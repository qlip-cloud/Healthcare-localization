import frappe

def handle(doc, method):
    patient_doc = frappe.get_doc("Patient", doc.patient)
    if patient_doc.hco_patient_status != "Active":
        frappe.throw(f"Paciente Inactivo")