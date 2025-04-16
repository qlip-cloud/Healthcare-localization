frappe.ui.form.on("Patient Encounter", "onload", function(frm) {
    // Tablas maestros
    frm.set_query("hco_diagnosis_type", function() {
        return {
            filters:{
                'enabled': ['=', '1']
            }
        }
    });
    frm.set_query("hco_technology_in_health", function() {
        return {
            filters:{
                'enabled': ['=', '1']
            }
        }
    });
    frm.set_query("hco_services_group", function() {
        return {
            filters:{
                'enabled': ['=', '1']
            }
        }
    });
    frm.set_query("hco_service_code", function() {
        return {
            filters:{
                'enabled': ['=', '1']
            }
        }
    });
	frm.set_query("hco_purpose_of_health_tech", function() {
        return {
            filters:{
                'enabled': ['=', '1']
            }
        }
    });
	frm.set_query("hco_pharmaceutical_form", function() {
        return {
            filters:{
                'enabled': ['=', '1']
            }
        }
    });
	frm.set_query("hco_mode", function() {
        return {
            filters:{
                'enabled': ['=', '1']
            }
        }
    });
	frm.set_query("hco_entry_route", function() {
        return {
            filters:{
                'enabled': ['=', '1']
            }
        }
    });
	frm.set_query("hco_cause_of_attention", function() {
        return {
            filters:{
                'enabled': ['=', '1']
            }
        }
    });
});

// Información del Departamento
frappe.ui.form.on('Patient Encounter', {
	medical_department: function(frm) {
		frm.events.set_medical_department_fields(frm);
	},

	set_medical_department_fields: function(frm) {
		if (frm.doc.medical_department) {
			frappe.call({
				method: 'frappe.client.get',
				args: {
					doctype: 'Medical Department',
					name: frm.doc.medical_department
				},
				callback: function(data) {
                    if (data.message && data.message.hco_service_code) {
                        let values = {
                            'hco_service_code':data.message.hco_service_code
                        };
                        frm.set_value(values);
                        frm.refresh_field("hco_service_code");
                    }
				}
			});
		}
		else {
			let values = {
				'hco_service_code': ''
			};
			frm.set_value(values);
            frm.refresh_field("hco_service_code");
		}
	},
});


// TODO: Pendiente ajustar llenado de tabla y probar
// Información del Código Médico en Cita con el Paciente
frappe.ui.form.on('Patient Encounter', {
	appointment: function(frm) {
		frm.events.set_appointment_medical_code_fields(frm);
	},

	set_appointment_medical_code_fields: function(frm) {
		if (frm.doc.appointment) {
			frappe.call({
                method: 'frappe.client.get',
				args: {
					doctype: 'Patient Appointment',
					name: frm.doc.appointment
				},
                callback: function(r) {
                    if (r.message && r.message.hco_medical_code) {

                        frm.doc.codification_table = [];
                        
                        let entry = frm.add_child("codification_table");
                        
                        entry.medical_code = r.message.hco_medical_code;

                        frm.refresh_field("codification_table");

                    }

                }
            });
		}
		else {
			frm.doc.codification_table = [];
            frm.refresh_field("codification_table");
		}
	},
});
