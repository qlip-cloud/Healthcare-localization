import frappe
from frappe import _
from erpnext.healthcare.doctype.patient.patient import Patient

class HealthcarePatient(Patient):

    def validate(self):

        patient_name_by = frappe.db.get_single_value('Healthcare Settings', 'patient_name_by')
        if patient_name_by == 'Patient Name' and qp_field_exists("Patient", "eico_nvben_ndoc"):

            # Validar campo (exista y sea único)
            count = 0
            if self.eico_nvben_ndoc:
                count = frappe.db.sql("""select count(*) as cuenta from tabPatient
                        where name = %s""", "{0}".format(self.eico_nvben_ndoc), as_list=1)[0][0]

            if not self.eico_nvben_ndoc or count > 0:
                frappe.throw(_("Tax ID is empty or already registered"))

        super(HealthcarePatient, self).validate()

    def get_patient_name(self):

        if qp_field_exists("Patient", "eico_nvben_ndoc"):

            return self.eico_nvben_ndoc

        return super(HealthcarePatient, self).get_patient_name()

    def add_as_website_user(self):
        # Se omite la creación de usuario si registran correo electrónico

        return

def qp_field_exists(doc, field):

    meta = frappe.get_meta(doc)
    return meta.has_field(field)
