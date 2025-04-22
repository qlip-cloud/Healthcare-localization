import frappe
from frappe.model.mapper import get_mapped_doc
from healthcare_localization.healthcare_localization.utils.get_info import get_fields_from_patient_appointment

@frappe.whitelist()
def make_encounter(source_name, target_doc=None):

    hco_service_code = get_fields_from_patient_appointment(source_name)

    doc = get_mapped_doc('Patient Appointment', source_name, {
        'Patient Appointment': {
            'doctype': 'Patient Encounter',
            'field_map': [
                ['appointment', 'name'],
                ['patient', 'patient'],
                ['practitioner', 'practitioner'],
                ['medical_department', 'department'],
                ['patient_sex', 'patient_sex'],
                ['invoiced', 'invoiced'],
                ['company', 'company']
            ]
        }
    }, target_doc)

    doc.hco_service_code = hco_service_code and hco_service_code[0][0] or ''


    hco_medical_code = frappe.get_value('Patient Appointment', source_name, 'hco_medical_code')

    if hco_medical_code:

        doc.append("codification_table", {
            "medical_code": hco_medical_code
        })

    return doc
