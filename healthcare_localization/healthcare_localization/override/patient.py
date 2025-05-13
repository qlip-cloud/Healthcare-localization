import frappe
from frappe import _
from healthcare_localization.healthcare_localization.utils.constant import IDTYPE
from erpnext.healthcare.doctype.healthcare_settings.healthcare_settings import send_registration_sms
from colombia_localization.colombia_localization.doctype.qp_co_thirdparty.qp_co_thirdparty import tax_id_calculate
from erpnext.healthcare.doctype.patient.patient import Patient

class HealthcarePatient(Patient):

    def get_patient_name(self):

        if qp_field_exists("Patient", "eico_nvben_ndoc"):

            # Validar campo (exista y sea único)
            count = 0
            if self.eico_nvben_ndoc:
                count = frappe.db.sql("""select count(*) as cuenta from tabPatient
                        where name = %s""", "{0}".format(self.eico_nvben_ndoc), as_list=1)[0][0]

            if not self.eico_nvben_ndoc or count > 0:
                frappe.throw(_("Tax ID is empty or already registered"))

            return self.eico_nvben_ndoc

        return super(HealthcarePatient, self).get_patient_name()

    def add_as_website_user(self):
        # Se omite la creación de usuario si registran correo electrónico

        return

    def after_insert(self):
        self.add_as_website_user()
        self.reload()
        if frappe.db.get_single_value("Healthcare Settings", "link_customer_to_patient") and not self.customer:
            qlip_create_customer(self)
        if frappe.db.get_single_value("Healthcare Settings", "collect_registration_fee"):
            frappe.db.set_value("Patient", self.name, "status", "Disabled")
        else:
            send_registration_sms(self)
        self.reload() # self.notify_update()

    def on_update(self):
        if self.customer:
            customer = frappe.get_doc("Customer", self.customer)
            if self.customer_group:
                customer.customer_group = self.customer_group
            if self.territory:
                customer.territory = self.territory

            customer.customer_name = self.patient_name
            customer.first_name = self.first_name,
            customer.secound_name = self.middle_name,
            customer.first_surname = self.last_name,
            customer.secound_surname = self.hco_secound_surname,
            customer.default_price_list = self.default_price_list
            customer.default_currency = self.default_currency
            customer.language = self.language
            customer.ignore_mandatory = True
            customer.save(ignore_permissions=True)
        else:
            if frappe.db.get_single_value("Healthcare Settings", "link_customer_to_patient"):
                qlip_create_customer(self)

def qp_field_exists(doc, field):

    meta = frappe.get_meta(doc)
    return meta.has_field(field)

def qlip_create_customer(doc):

    # Se asume que se maneja el name del cliente con el valor de tax_id
    # Si ya existe tax_id como name de cliente, asociarlo al Paciente
    # Si no existe tax_id como name de cliente, se crea
    qp_tax_id = doc.get("eico_nvben_ndoc", None)
    qp_type_tax_id = doc.get("eico_nvben_tdoc", None)
    qp_dir = doc.get("eico_nvben_dire", None)
    qp_department = doc.hco_residence_department and frappe.db.get_value("qp_CO_State", doc.hco_residence_department, "state_name") or ""

    if qp_tax_id and frappe.db.exists("Customer", qp_tax_id):

        customer = frappe.get_doc("Customer", qp_tax_id)

        frappe.db.set_value("Patient", doc.name, "customer", customer.name)
        frappe.msgprint(_("Customer {0} is associated.").format(customer.name), alert=True)

    else:

        # Insert Customer
        customer = frappe.get_doc({
            "doctype": "Customer",
            "customer_name": doc.patient_name,
            "first_name": doc.first_name,
            "secound_name": doc.middle_name,
            "first_surname": doc.last_name,
            "secound_surname": doc.hco_secound_surname,
            "customer_group": doc.customer_group or frappe.db.get_single_value("Selling Settings", "customer_group"),
            "territory" : doc.territory or frappe.db.get_single_value("Selling Settings", "territory"),
            "customer_type": "Individual",
            "default_currency": doc.default_currency,
            "default_price_list": doc.default_price_list,
            "language": doc.language,
            "qp_typeid": qp_type_tax_id,
            "tax_id": qp_tax_id
        }).insert(ignore_permissions=True, ignore_mandatory=True)

        # Insert Address
        addr = frappe.get_doc({
            "doctype": "Address",
            "address_type": "Billing",
            "address_line1": qp_dir,
            "address_title": customer.name,
            "city": doc.hco_residence_municipality,
            "state": qp_department,
            "country": doc.hco_residence_country,
            "phone": doc.get("phone", None),
            "email_id": doc.get("email", None),
            "links": [
                {
                    "link_doctype": "Customer",
                    "link_name": customer.name,
                    "doctype": "Dynamic Link"
                }
            ]
        }).insert(ignore_permissions=True, ignore_mandatory=True)

        # Insert Tercero

        # Consultar por tax_id, si existe agregarlo en el link, si no, crear el registro del tercero
        if customer.tax_id and frappe.db.exists("qp_CO_ThirdParty", customer.tax_id):

            thirdparty = frappe.get_doc("qp_CO_ThirdParty", customer.tax_id)

            is_thirdparty = False
            for ind in thirdparty.links:
                if ind.link_doctype == "Customer" and ind.link_fieldname == customer.name and ind.doctype == "DocType Link":
                    is_thirdparty = True

            if not is_thirdparty:
                third_row = {
                    "link_doctype": "Customer",
                    "link_fieldname": customer.name,
                    "doctype": "DocType Link"
                }
                thirdparty.append("links", third_row)

                thirdparty.save(ignore_permissions=True)

        else:

            # Persona natural -->> first_name,secound_name,first_surname,secound_surname

            # Buscar correspondencia entre customer.qp_typeid y Terceros -->> id_type
            idtype_code = IDTYPE[customer.qp_typeid]
            idtype_fields = frappe.db.sql("select name, validate_check_digit from `tabqp_CO_IdType` where \
                id_type_id = %s LIMIT 1", idtype_code, as_dict=True)

            if not idtype_fields[0].validate_check_digit:
                res_check_digit = ""
                res_naming = customer.tax_id
            else:
                res_check_digit = tax_id_calculate(customer.qp_typeid, idtype_fields[0].validate_check_digit, customer.tax_id)
                res_naming = "{0}-{1}".format(res_check_digit, customer.tax_id)

            third = frappe.get_doc({
                "doctype": "qp_CO_ThirdParty",
                "naming": res_naming,
                "id_type": idtype_fields[0].name,
                "tax_id": customer.tax_id,
                "check_digit": res_check_digit,
                "business_type": "Persona Natural",
                "tax_regime": "49",
                "first_name": customer.first_name,
                "secound_name": customer.secound_name,
                "first_surname": customer.first_surname,
                "secound_surname": customer.secound_surname,
                "email": doc.get("email", None),
                "ciiu_id": doc.eico_nvben_cciu,
                "country": doc.hco_residence_country,
                "state": doc.hco_residence_department,
                "municipality": doc.hco_residence_municipality,
                "iscompany": "Customer",
                "address": qp_dir,
                "links": [
                    {
                        "link_doctype": "Customer",
                        "link_fieldname": customer.name,
                        "doctype": "DocType Link"
                    }
                ]
            }).insert(ignore_permissions=True, ignore_mandatory=True)

        frappe.db.set_value("Patient", doc.name, "customer", customer.name)
        frappe.msgprint(_("Customer {0} is created.").format(customer.name), alert=True)
