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
				method: 'healthcare_localization.healthcare_localization.utils.get_info.get_fields_from_department',
				args: {
					medical_department: frm.doc.medical_department
				},
				callback: function(data) {
                    if (data.message) {
                        let values = {
                            'hco_service_code':data.message[0]
                        };
                        frm.set_value(values);
                    }
				}
			});
		}
		else {
			let values = {
				'hco_service_code': ''
			};
			frm.set_value(values);
		}
	},
});