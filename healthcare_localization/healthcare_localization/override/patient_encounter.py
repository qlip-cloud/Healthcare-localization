import frappe
from erpnext.healthcare.doctype.patient_encounter.patient_encounter import PatientEncounter as ERPPatientEncounter

class HealthcarePatientEncounter(ERPPatientEncounter):

    def before_save(self):
        super().before_save() 
        self.copy_diagnosis() 

    def copy_diagnosis(self):
        if self.hco_diagnosis:
            self.diagnosis = self.hco_diagnosis

    def on_submit(self):
        super().on_submit()
        self.create_vital_signs()

    def create_vital_signs(self):
        if not self.patient:
            return
      
        if frappe.db.exists("Vital Signs", {"patient": self.patient, "patient_encounter": self.name}):
            return

        fields = [
            self.temperature, self.pulse, self.respiratory_rate, self.tongue, self.abdomen,
            self.reflexes, self.bp_diastolic, self.bp_systolic, self.bp, self.vital_signs_note,
            self.height, self.weight, self.bmi, self.nutrition_note
        ]

        if not any(fields):
            return
        vital_sign = frappe.new_doc("Vital Signs")
        vital_sign.patient = self.patient
        vital_sign.encounter = self.name
        vital_sign.company = self.company
        vital_sign.signs_date = self.encounter_date
        vital_sign.signs_time = self.encounter_time
        vital_sign.temperature = self.temperature
        vital_sign.pulse = self.pulse
        vital_sign.respiratory_rate = self.respiratory_rate
        vital_sign.tongue = self.tongue
        vital_sign.abdomen = self.abdomen
        vital_sign.reflexes = self.reflexes
        vital_sign.bp_systolic = self.bp_systolic
        vital_sign.bp_diastolic = self.bp_diastolic
        vital_sign.bp = self.bp
        vital_sign.vital_signs_note = self.vital_signs_note
        vital_sign.height = self.height
        vital_sign.weight = self.weight
        vital_sign.bmi = self.bmi
        vital_sign.nutrition_note = self.nutrition_note
        vital_sign.save(ignore_permissions=True)
        vital_sign.submit()
