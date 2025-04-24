import frappe

@frappe.whitelist()
def get_fields_from_patient_appointment(patient_appointment_name):
	# Returns hco_service_code from department of patient appointment

	res = frappe.db.sql(
		"""
			SELECT
				dep.hco_service_code
			FROM
				`tabMedical Department` dep, `tabPatient Appointment` pa
			WHERE
				pa.name=%(patient_appointment_name)s and pa.department=dep.name
			LIMIT 1
		""", {'patient_appointment_name': patient_appointment_name}
	)


	return res

@frappe.whitelist()
def get_pathological_history(history_type):
	# Returns details of pathological_history

	res = frappe.db.sql(
		"""
			SELECT
				opt.description
			FROM
				`tabqp_HCO_option_list` opt
			WHERE
				opt.parent=%(history_type)s
			AND
				opt.parenttype = 'qp_HCO_history_template'
			AND
				opt.parentfield = 'details'
			AND
				opt.enabled = 1
			ORDER BY idx
		""", {'history_type': history_type}, as_dict=True
	)

	return res
