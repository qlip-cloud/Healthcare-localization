import frappe
from frappe.model.mapper import get_mapped_doc
from frappe.utils import getdate
from erpnext.healthcare.doctype.patient_appointment.patient_appointment import PatientAppointment
from healthcare_localization.healthcare_localization.utils.get_info import get_fields_from_patient_appointment


class HealthcarePatientAppointment(PatientAppointment):
	"""Override Patient Appointment to fix datetime concatenation issue during data import"""
	
	def set_appointment_datetime(self):
		# Ensure appointment_date is converted to date only (without time part)
		# This fixes the issue when importing from CSV where date comes as datetime object
		appointment_date = getdate(self.appointment_date)
		appointment_time = self.appointment_time or "00:00:00"
		self.appointment_datetime = "%s %s" % (appointment_date, appointment_time)