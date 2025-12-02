from email.mime import message
import frappe
from frappe import _

@frappe.whitelist()
def get_patient_detail(patient):
  patient_dict = frappe.db.sql("""select * from `tabPatient` where name=%s""", (patient,), as_dict=1)
          
  vital_sign = frappe.db.sql("""select * from `tabVital Signs` where patient=%s order by signs_date desc limit 1""", (patient,), as_dict=1)

  details = patient_dict[0]
  if vital_sign:
      details.update(vital_sign[0])
  last_encounter = frappe.db.sql("""SELECT hco_allergies FROM `tabPatient Encounter` WHERE patient = %s AND docstatus = 1 ORDER BY encounter_date DESC LIMIT 1""",(patient,),as_dict=1)
  if last_encounter:
      details['allergies'] = last_encounter[0]['hco_allergies']
  else:
      details['allergies'] = ''
  if details['allergies']:
      frappe.msgprint(title= _("Atención"),msg= _(f'El paciente tiene alergias registradas: {details["allergies"]}'),indicator= "orange");
  return details
  
  

                                        
