frappe.ui.form.on("Patient", "onload", function(frm) {
    frm.set_query("sex", function() {
        return {
            filters:{
                'hco_code': ['!=', '']
            }
        }
    });
	frm.set_query("hco_residence_country", function() {
        return {
            filters:{
                'hco_iso_numeric_code': ['!=', '']
            }
        }
    });
	frm.set_query("hco_birth_country", function() {
        return {
            filters:{
                'hco_iso_numeric_code': ['!=', '']
            }
        }
    });
    // Tablas maestros
    frm.set_query("hco_contract", function() {
        return {
            filters:{
                'enabled': ['=', '1']
            }
        }
    });
    frm.set_query("hco_health_document_type", function() {
        return {
            filters:{
                'enabled': ['=', '1']
            }
        }
    });
    frm.set_query("hco_territorial_zone", function() {
        return {
            filters:{
                'enabled': ['=', '1']
            }
        }
    });
    frm.set_query("hco_user_type", function() {
        return {
            filters:{
                'enabled': ['=', '1']
            }
        }
    });

	// Información de datos por defecto de la configuración

	frappe.db.get_single_value("qp_HCO_healthcare_localization_settings", "pathological_history_set").then(pathological_history_set => {
        if (pathological_history_set) {
            frappe.model.set_value(frm.doctype, frm.docname, 'hco_pathological_history', pathological_history_set);
        }
    });

    frappe.db.get_single_value("qp_HCO_healthcare_localization_settings", "op_family_history_set").then(op_family_history_set => {
        if (op_family_history_set) {
            frappe.model.set_value(frm.doctype, frm.docname, 'hco_op_family_history', op_family_history_set);
        }
    });

    frappe.db.get_single_value("qp_HCO_healthcare_localization_settings", "ob_gyn_history_set").then(ob_gyn_history_set => {
        if (ob_gyn_history_set) {
            frappe.model.set_value(frm.doctype, frm.docname, 'hco_ob_gyn_history', ob_gyn_history_set);
        }
    });

});

// Información de Municipalidad según Departamento
frappe.ui.form.on('Patient', 'hco_residence_department', function(frm) {
	if (frm.doc.hco_residence_department) {

        cur_frm.fields_dict['hco_residence_municipality'].get_query = function(doc) {
			return {
				filters: {
					"state_code": cur_frm.doc.hco_residence_department
				}
			}
		}

	}
	else {
		frappe.model.set_value(frm.doctype,frm.docname, 'hco_residence_municipality', '');
        frm.refresh_field("hco_residence_municipality");
	}
});

// Información de Entidad/País de la Entidad
frappe.ui.form.on('Patient', 'eico_nvent_nomb_id', function(frm) {
	if (frm.doc.eico_nvent_nomb_id) {

        frappe.call({
			method: "healthcare_localization.healthcare_localization.uses_cases.sales_invoices.validation.get_data_third_party",
			args: {
				customer: frm.doc.eico_nvent_nomb_id
			},
			callback: function(r){
				if(r.message){
                    console.log("---->>>", r.message)
                    frappe.model.set_value(frm.doctype,frm.docname, 'eico_nvent_pais', r.message.third_party_country);
				}
			}
		});

	}
	else {
		frappe.model.set_value(frm.doctype,frm.docname, 'eico_nvent_pais', '');
	}
});

// Historia del Paciente
frappe.ui.form.on('Patient', 'hco_pathological_history', function(frm) {

    let pat_hist = frm.doc.hco_pathological_history;
	if (pat_hist) {

        frappe.call({
			method: "healthcare_localization.healthcare_localization.utils.get_info.get_pathological_history",
			args: {
				history_type: pat_hist
			},
			callback: function(r){
				if(r.message){

                    frm.doc.hco_pathological_history_detail = [];
                    $.each(r.message, function(i, ph_det) {
						let entry = frm.add_child("hco_pathological_history_detail");
                        entry.description = ph_det.description;
					});

                    frm.refresh_field("hco_pathological_history_detail");

				}
			}
		});

	}
	else {
		frm.doc.hco_pathological_history_detail = [];
        frm.refresh_field("hco_pathological_history_detail");
	}
});

// Historia Familiar del Paciente
frappe.ui.form.on('Patient', 'hco_op_family_history', function(frm) {

    let pat_hist = frm.doc.hco_op_family_history;
	if (pat_hist) {

        frappe.call({
			method: "healthcare_localization.healthcare_localization.utils.get_info.get_pathological_history",
			args: {
				history_type: pat_hist
			},
			callback: function(r){
				if(r.message){

                    frm.doc.hco_op_family_history_detail = [];
                    $.each(r.message, function(i, ph_det) {
						let entry = frm.add_child("hco_op_family_history_detail");
                        entry.description = ph_det.description;
					});

                    frm.refresh_field("hco_op_family_history_detail");

				}
			}
		});

	}
	else {
		frm.doc.hco_op_family_history_detail = [];
        frm.refresh_field("hco_op_family_history_detail");
	}
});


// Historia Ginecoobstétrica del Paciente
frappe.ui.form.on('Patient', 'hco_ob_gyn_history', function(frm) {

    let pat_hist = frm.doc.hco_ob_gyn_history;
	if (pat_hist) {

        frappe.call({
			method: "healthcare_localization.healthcare_localization.utils.get_info.get_pathological_history",
			args: {
				history_type: pat_hist
			},
			callback: function(r){
				if(r.message){

                    frm.doc.hco_ob_gyn_history_detail = [];
                    $.each(r.message, function(i, ph_det) {
						let entry = frm.add_child("hco_ob_gyn_history_detail");
                        entry.description = ph_det.description;
					});

                    frm.refresh_field("hco_ob_gyn_history_detail");

				}
			}
		});

	}
	else {
		frm.doc.hco_ob_gyn_history_detail = [];
        frm.refresh_field("hco_ob_gyn_history_detail");
	}
});

// Indicador de estado
frappe.get_indicator = function(doc) {
    if (doc.doctype !== 'Patient') {
        return;
    }

    const status = doc.hco_patient_status;

    if (status === "Active") {
        return [__("Activo"), "green", "status,=,Activo"];
    } else if (status === "Inactive") {
        return [__("Inactivo"), "red", "status,=,Inactivo"];
    } 
};

// Límite de caracteres para nuevos campos
frappe.ui.form.on('Patient', {
    refresh: function(frm) {
        const limits = {
            another_substance: 100,
            another_consumption_pattern: 100,
            another_frecuency: 100,
            substance_quantity: 300,
            started_age: 100,
            another_risk: 100,
            other_risk_factors: 500
        }
        frm.field_limits = limits;

        frappe.after_ajax(() => {
            for (let fieldname in limits) {
                setup_field_validation(frm, fieldname, limits[fieldname]);
            }
        });
    }
});

function setup_field_validation(frm, fieldname, limits) {
    const field = frm.get_field(fieldname);
    if (!field || !field.input) return;

    const $input = $(field.input);
    const max = limits;

    $input.attr("maxlength", max);
}
