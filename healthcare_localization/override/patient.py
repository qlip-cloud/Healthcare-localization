from email.mime import message
import frappe
from frappe import _

@frappe.whitelist()
def get_patient_detail(patient):
    patient_dict = frappe.db.sql(
        """SELECT * FROM `tabPatient` WHERE name=%s""",
        (patient,),
        as_dict=1
    )

    vital_sign = frappe.db.sql(
        """SELECT * FROM `tabVital Signs` 
           WHERE patient=%s 
           ORDER BY signs_date DESC LIMIT 1""",
        (patient,),
        as_dict=1
    )

    details = patient_dict[0]
    if vital_sign:
        details.update(vital_sign[0])

    encounters = frappe.db.sql(
        """SELECT hco_allergies 
           FROM `tabPatient Encounter`
           WHERE patient=%s AND docstatus = 1
           ORDER BY encounter_date DESC""",
        (patient,),
        as_dict=1
    )

    allergy_lines = []

    for enc in encounters:
        if enc.get("hco_allergies"):
            lines = enc["hco_allergies"].split("\n")
            cleaned = [l.strip() for l in lines if l.strip()]
            allergy_lines.extend(cleaned)

    unique_allergies = sorted(set(allergy_lines))

    allergies_str = ", ".join(unique_allergies)

    details["allergies"] = allergies_str

    return details


                                        
