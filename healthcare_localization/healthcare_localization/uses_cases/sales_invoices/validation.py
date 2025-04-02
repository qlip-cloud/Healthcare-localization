import frappe
import json

from healthcare_localization.healthcare_localization.exception import sales_invoices_exception

from electronic_invoicing_colombia.electronic_invoicing_colombia.service.setup.sales_invoices.get_setup  \
    import get_is_not_electronic_invoice_resolution


def handle(sales_invoice):

    transaction_node = {}

    user_list = []

    # ------------------------------- ELIMINAR AL TERMINAR --------------------------------

    transaction_node = get_transaction_info(sales_invoice)

    users_json = get_users_info(sales_invoice, 1)

    user_list.append(users_json)

    transaction_node["Usuarios"] = user_list

    # ---------------------------------------------------------------------------------

    # TODO: IDENTAR A MEDIDA QUE SE PROGRAME LUEGO DESCOMENTAR PARA PROBAR EL PROCESO
    # if not get_is_not_electronic_invoice_resolution(sales_invoice):

        # # Transacción

        # transaction_node = get_transaction_info(sales_invoice)

    #     # Usuarios
    #     get_users_info(sales_invoice.customer, sales_invoice.patient, 1)

    #     # servicio

    #     __assert_has_service_info(sales_invoice)

    #     # consultas

    #     __assert_has_medical_consultation_info(sales_invoice)

    #     # procedimientos
        
    #     __assert_has_medical_procedure_info(sales_invoice)

    #     # No aplica: urgencias

    #     # hospitalizacion

    #     __assert_has_hospitalization_info(sales_invoice)

    #     # No palica: recienNacidos

    #     # medicamentos

    #     __assert_has_medicines_info(sales_invoice)

    #     # otrosServicios

    #     __assert_has_other_services_info(sales_invoice)

    # print("transaction_node", transaction_node)
    print("res json -->>", json.dumps(transaction_node))

    frappe.log_error(message=json.dumps(transaction_node), title="JSON Validate RIPS")

    return json.dumps(transaction_node)


def get_transaction_info(sales_invoice):
    """
    numDocumentoIdObligado
    numFactura
    TipoNota
    numNota
    """

    res = {}

    tax_id_company = frappe.db.get_value("Company", sales_invoice.company, "tax_id")

    if not tax_id_company:
        sales_invoices_exception.tax_id_company_exception()

    res["numDocumentoIdObligado"] = tax_id_company

    res["numFactura"] = sales_invoice.name

    if  sales_invoice.is_return or sales_invoice.is_debit_note:

        # TODO: Cómo determinar lo siguiente:
        # Cuando el ajuste en los RIPS esté relacionado con el valor monetario de un
        # dato en RIPS se debe utilizar nota crédito o nota débito según corresponda.
        # Por su parte, en aquellos casos cuando el ajuste no esté relacionado con el
        # valor monetario, se debe - utilizar la nota ajuste RIPS.
        # NA nota ajuste RIPS.
        # NC nota crédito
        # ND nota débito

        res["tipoNota"] = "ND" if sales_invoice.is_debit_note else "NC"
        res["numNota"] = sales_invoice.return_against

    else:
        res["tipoNota"] = None
        res["numNota"] = None


    return res


def get_users_info(sales_invoice, idx):
    """
    tipoDocumentoIdentificacion
    numDocumentoIdentificacion
    tipoUsuario
    fechaNacimiento
    codSexo
    codPaisResidencia
    codMunicipioResidencia
    codZonaTerritorialResidencia
    incapacidad
    consecutivo
    codPaisOrigen
    servicios
    """
    # TODO: Determinar cuando es más de un usuario que se debe reportar
    # Los datos vienen del campo patient asociado a la factura

    # Se incluye validaciones menos en: codMunicipioResidencia y codZonaTerritorialResidencia

    tax_id_customer = frappe.db.get_value("Customer", sales_invoice.customer, "tax_id")
    if not tax_id_customer:
        sales_invoices_exception.tax_id_customer_exception()

    if not sales_invoice.patient:
        sales_invoices_exception.patient_sales_invoice_exception()

    patient_doc = frappe.get_doc("Patient", sales_invoice.patient)
    patient_validation(patient_doc)

    hco_code = frappe.db.get_value("Gender", patient_doc.sex, "hco_code")
    if not hco_code:
        sales_invoices_exception.hco_code_gender_exception()

    iso_residence_country = frappe.db.get_value("Country", patient_doc.hco_residence_country, "hco_iso_numeric_code")
    if not iso_residence_country:
        sales_invoices_exception.hco_iso_residence_country_exception()

    iso_birth_country = frappe.db.get_value("Country", patient_doc.hco_birth_country, "hco_iso_numeric_code")
    if not iso_birth_country:
        sales_invoices_exception.hco_iso_birth_country_exception()

    incap_paciente = get_incapacidad(sales_invoice.items)

    res = {}    

    res["tipoDocumentoIdentificacion"] = patient_doc.hco_health_document_type
    res["numDocumentoIdentificacion"] = patient_doc.eico_nvben_ndoc
    res["tipoUsuario"] = patient_doc.hco_user_type
    res["fechaNacimiento"] = "{}".format(patient_doc.dob)
    res["codSexo"] = hco_code
    res["codPaisResidencia"] = iso_residence_country
    res["codMunicipioResidencia"] = patient_doc.hco_residence_municipality or None
    res["codZonaTerritorialResidencia"] = patient_doc.hco_territorial_zone or None
    res["incapacidad"] = incap_paciente
    res["consecutivo"] = idx
    res["codPaisOrigen"] = iso_birth_country

    res["servicios"] = get_servicios(sales_invoice)

    return res


def patient_validation(patient_doc):

    if not patient_doc.hco_residence_country:
        sales_invoices_exception.patient_empty_field_exception("Residence Country")

    if not patient_doc.hco_birth_country:
        sales_invoices_exception.patient_empty_field_exception("Birth Country")

    if not patient_doc.hco_health_document_type:
        sales_invoices_exception.patient_empty_field_exception("Health Document Type")

    if not patient_doc.eico_nvben_ndoc:
        sales_invoices_exception.patient_empty_field_exception("Document number")

    if not patient_doc.hco_user_type:
        sales_invoices_exception.patient_empty_field_exception("User Type")

    if not patient_doc.dob:
        sales_invoices_exception.patient_empty_field_exception("dob")

    if not patient_doc.sex:
        sales_invoices_exception.patient_empty_field_exception("sex")


def get_incapacidad(si_items):

    incap_paciente = "NO"

    name_encounter = ""

    for item in si_items:

        if not item.get("reference_dt") == "Patient Encounter": continue

        name_encounter = item.get("reference_dn")

        incap_paciente = frappe.db.get_value("Patient Encounter", name_encounter, "hco_inability")

        break

    return incap_paciente.upper()


def get_servicios(sales_invoice):
    res_servicios = {}

    res_servicios["consultas"] = get_consultas(sales_invoice)
    res_servicios["medicamentos"] = get_medicamentos(sales_invoice)
    res_servicios["procedimientos"] = get_procedimientos(sales_invoice)
    # res_servicios["urgencias"] = get_urgencias(sales_invoice) # No Aplica
    res_servicios["hospitalizacion"] = get_hospitalizacion(sales_invoice)
    # res_servicios["recienNacidos"] = get_recien_nacidos(sales_invoice) # No Aplica
    res_servicios["otrosServicios"] = get_otros_servicios(sales_invoice)


    return res_servicios


def get_consultas(sales_invoice):
    """
    codPrestador
    fechaInicioAtencion
    numAutorizacion
    codConsulta
    modalidadGrupoServicioTecSal
    grupoServicios
    codServicio
    finalidadTecnologiaSalud
    causaMotivoAtencion
    codDiagnosticoPrincipal
    codDiagnosticoRelacionado1
    codDiagnosticoRelacionado2
    codDiagnosticoRelacionado3
    typoDiagnosticoPrincipal
    tipoDocumentoIdentificacion
    numDocumentoIdentificacion
    vrServicio
    conceptoRecaudo
    valorPagoModerador
    numFEVPagoModerador
    consecutivo
    """

    cod_prestador = frappe.db.get_value("Company", sales_invoice.company, "hco_codprestador")
    if not cod_prestador:
        sales_invoices_exception.cod_prestador_company_exception()

    patient_doc = frappe.db.get_values("Patient", sales_invoice.patient, fieldname=["eico_nvben_tdoc", "eico_nvben_ndoc"], as_dict=1)[0]

    if not patient_doc.eico_nvben_tdoc or not patient_doc.eico_nvben_ndoc:
        sales_invoices_exception.nvben_doc_patient_exception()

    res_consultas = []
    indx_cons = 0

    for item in sales_invoice.items:

        # TODO: Determinar encuentro con el paciente de tipo consulta
        # Actualmente se asume que todo encuentro con el paciente/cita con encuentro con el paciente es una consulta
        encounter_doc = None
        reference_dt = item.get("reference_dt")
        reference_dn = item.get("reference_dn")
        if reference_dt in ("Patient Encounter", "Patient Appointment"):

            encounter_doc = get_encounter_doc(reference_dt, reference_dn)

        else:

            continue

        indx_cons += 1

        encounter_patient_validation(encounter_doc)

        ppal_diagnosis = None
        for diag in encounter_doc.diagnosis:
            ppal_diagnosis = diag.diagnosis
            break

        if not ppal_diagnosis:
            sales_invoices_exception.patient_encounter_empty_field_exception("Diagnosis")

        rel_diagnosis = [x.diagnosis for x in encounter_doc.hco_related_diagnosis]

        inf_cons = {}

        inf_cons["codPrestador"] = cod_prestador
        inf_cons["fechaInicioAtencion"] = "{}".format(encounter_doc.encounter_date)
        inf_cons["numAutorizacion"] = encounter_doc.hco_authorization_number
        inf_cons["codConsulta"] = get_codConsulta(encounter_doc.codification_table)
        inf_cons["modalidadGrupoServicioTecSal"] = encounter_doc.hco_mode or None
        inf_cons["grupoServicios"] = encounter_doc.hco_services_group or None
        inf_cons["codServicio"] = encounter_doc.hco_service_code and int(encounter_doc.hco_service_code) or 0
        inf_cons["finalidadTecnologiaSalud"] = encounter_doc.hco_purpose_of_health_tech or None
        inf_cons["causaMotivoAtencion"] = encounter_doc.hco_cause_of_attention or None
        inf_cons["codDiagnosticoPrincipal"] = ppal_diagnosis and ppal_diagnosis[0] or None
        inf_cons["codDiagnosticoRelacionado1"] = len(rel_diagnosis) > 0 and  rel_diagnosis[0] or None
        inf_cons["codDiagnosticoRelacionado2"] = len(rel_diagnosis) > 1 and  rel_diagnosis[1] or None
        inf_cons["codDiagnosticoRelacionado3"] = len(rel_diagnosis) > 2 and  rel_diagnosis[2] or None
        inf_cons["typoDiagnosticoPrincipal"] = encounter_doc.hco_diagnosis_type
        inf_cons["tipoDocumentoIdentificacion"] = patient_doc.eico_nvben_tdoc or None
        inf_cons["numDocumentoIdentificacion"] = patient_doc.eico_nvben_ndoc or None
        inf_cons["vrServicio"] = item.net_amount
        # conceptoRecaudo es obligatorio en la Documentación y no se encuentra en el excel
        # 02:Cuota moderadora
        # 03:Pagos compartidos en planes voluntarios de salud
        # 05:No aplica
        inf_cons["conceptoRecaudo"] =  "05"
        # inf_cons["tipoPagoModerador"] = None # No aparece en la Documentación, es posible que sea conceptoRecaudo
        inf_cons["valorPagoModerador"] = 0
        inf_cons["numFEVPagoModerador"] = None
        inf_cons["consecutivo"] = indx_cons

        res_consultas.append(inf_cons)

    return res_consultas


def get_encounter_doc(reference_dt, reference_dn):

    name_encounter = reference_dn

    if not reference_dn:
        sales_invoices_exception.patient_encounter_empty_doc_exception(reference_dt)

    if reference_dt == "Patient Appointment":

        existing_patient_encounter = frappe.db.sql("""select name from `tabPatient Encounter`
            where appointment = %(appointment)s
            limit 1""", { "appointment": reference_dn})

        name_encounter = existing_patient_encounter[0][0] if existing_patient_encounter else None

        if not name_encounter:
            sales_invoices_exception.patient_encounter_empty_doc_exception("Patient Encounter in Patient Appointment")

    encounter_doc = frappe.get_doc("Patient Encounter", name_encounter)

    return encounter_doc


def get_codConsulta(listMedicalCoding):

    return listMedicalCoding and listMedicalCoding[0].code or None

def encounter_patient_validation(encounter_doc):

    if not encounter_doc.hco_mode:
        sales_invoices_exception.patient_encounter_empty_field_exception("Mode")

    if not encounter_doc.hco_services_group:
        sales_invoices_exception.patient_encounter_empty_field_exception("Services Group")

    if not encounter_doc.hco_service_code:
        sales_invoices_exception.patient_encounter_empty_field_exception("Service Code")

    if not encounter_doc.hco_purpose_of_health_tech:
        sales_invoices_exception.patient_encounter_empty_field_exception("Purpose of Health Technology")

    if not encounter_doc.hco_cause_of_attention:
        sales_invoices_exception.patient_encounter_empty_field_exception("Cause That Motivates Attention")

    if not encounter_doc.codification_table:
        sales_invoices_exception.patient_encounter_empty_field_exception("Medical Coding")

    if not encounter_doc.hco_diagnosis_type:
        sales_invoices_exception.patient_encounter_empty_field_exception("Diagnosis Type")


def get_medicamentos(sales_invoice):
    res_medicamentos = []

    inf_med = {}


    res_medicamentos.append(inf_med)

    return res_medicamentos


def get_procedimientos(sales_invoice):
    res_procedimientos = []

    inf_proc = {}


    res_procedimientos.append(inf_proc)

    return res_procedimientos


def get_urgencias(sales_invoice):
    res_urgencias = []

    inf_urg = {}


    res_urgencias.append(inf_urg)

    return res_urgencias


def get_hospitalizacion(sales_invoice):
    res_hospitalizacion = []

    inf_hosp = {}


    res_hospitalizacion.append(inf_hosp)

    return res_hospitalizacion


def get_recien_nacidos(sales_invoice):
    res_recien_nacidos = []

    inf_rn = {}


    res_recien_nacidos.append(inf_rn)

    return res_recien_nacidos


def get_otros_servicios(sales_invoice):
    res_otros_servicios = []

    inf_os = {}


    res_otros_servicios.append(inf_os)

    return res_otros_servicios


@frappe.whitelist()
def get_data_third_party(customer):

    third_party_country = ""

    if customer:

        customer_tax_id = frappe.db.get_value("Customer", customer, "tax_id")

        if customer_tax_id:

            search ={
                "tax_id": customer_tax_id
            }

            third_party_country = frappe.db.get_value('qp_CO_ThirdParty', search, "country")

    return {"third_party_country": third_party_country}
