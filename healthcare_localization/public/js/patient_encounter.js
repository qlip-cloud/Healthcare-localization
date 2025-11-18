frappe.ui.form.on("Patient Encounter", "onload", function (frm) {
    // Tablas maestros
    frm.set_query("hco_diagnosis_type", function () {
        return {
            filters: {
                'enabled': ['=', '1']
            }
        }
    });
    frm.set_query("hco_technology_in_health", function () {
        return {
            filters: {
                'enabled': ['=', '1']
            }
        }
    });
    frm.set_query("hco_services_group", function () {
        return {
            filters: {
                'enabled': ['=', '1']
            }
        }
    });
    frm.set_query("hco_service_code", function () {
        return {
            filters: {
                'enabled': ['=', '1']
            }
        }
    });
    frm.set_query("hco_purpose_of_health_tech", function () {
        return {
            filters: {
                'enabled': ['=', '1']
            }
        }
    });
    frm.set_query("hco_pharmaceutical_form", function () {
        return {
            filters: {
                'enabled': ['=', '1']
            }
        }
    });
    frm.set_query("hco_mode", function () {
        return {
            filters: {
                'enabled': ['=', '1']
            }
        }
    });
    frm.set_query("hco_entry_route", function () {
        return {
            filters: {
                'enabled': ['=', '1']
            }
        }
    });
    frm.set_query("hco_cause_of_attention", function () {
        return {
            filters: {
                'enabled': ['=', '1']
            }
        }
    });

    // Información de datos por defecto de la configuración

    frappe.db.get_single_value("qp_HCO_healthcare_localization_settings", "services_group_set").then(services_group_set => {
        if (services_group_set) {
            frappe.model.set_value(frm.doctype, frm.docname, 'hco_services_group', services_group_set);
        }
    });

    frappe.db.get_single_value("qp_HCO_healthcare_localization_settings", "cause_of_attention_set").then(cause_of_attention_set => {
        if (cause_of_attention_set) {
            frappe.model.set_value(frm.doctype, frm.docname, 'hco_cause_of_attention', cause_of_attention_set);
        }
    });

    frappe.db.get_single_value("qp_HCO_healthcare_localization_settings", "mode_set").then(mode_set => {
        if (mode_set) {
            frappe.model.set_value(frm.doctype, frm.docname, 'hco_mode', mode_set);
        }
    });

    frappe.db.get_single_value("qp_HCO_healthcare_localization_settings", "purpose_of_health_tec_set").then(purpose_of_health_tec_set => {
        if (purpose_of_health_tec_set) {
            frappe.model.set_value(frm.doctype, frm.docname, 'hco_purpose_of_health_tech', purpose_of_health_tec_set);
        }
    });

});

// Información del Departamento
frappe.ui.form.on('Patient Encounter', {
    medical_department: function (frm) {
        frm.events.set_medical_department_fields(frm);
    },

    set_medical_department_fields: function (frm) {
        if (frm.doc.medical_department) {
            frappe.call({
                method: 'frappe.client.get',
                args: {
                    doctype: 'Medical Department',
                    name: frm.doc.medical_department
                },
                callback: function (data) {
                    if (data.message && data.message.hco_service_code) {
                        let values = {
                            'hco_service_code': data.message.hco_service_code
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

frappe.ui.form.on("Patient Encounter", {
    refresh: function (frm) {
        frm.add_custom_button('Historia del Paciente', () => {
            let url = '/app/patient_history';
            if (frm.doc.patient) {
                url += `?patient=${frm.doc.patient}`;
            }
            window.open(url, '_blank');
        });
    },

});




// Información del Código Médico en Cita con el Paciente
frappe.ui.form.on('Patient Encounter', {
    appointment: function (frm) {
        frm.events.set_appointment_medical_code_fields(frm);
    },

    set_appointment_medical_code_fields: function (frm) {
        if (frm.doc.appointment) {
            frappe.call({
                method: 'frappe.client.get',
                args: {
                    doctype: 'Patient Appointment',
                    name: frm.doc.appointment
                },
                callback: function (r) {
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
// Calculo de IMC y Presión Arterial
frappe.ui.form.on('Patient Encounter', {
    height: function (frm) {
        if (frm.doc.height && frm.doc.weight) {
            calculate_bmi(frm);
        }
    },

    weight: function (frm) {
        if (frm.doc.height && frm.doc.weight) {
            calculate_bmi(frm);
        }
    },

    bp_systolic: function (frm) {
        if (frm.doc.bp_systolic && frm.doc.bp_diastolic) {
            set_bp(frm);
        }
    },

    bp_diastolic: function (frm) {
        if (frm.doc.bp_systolic && frm.doc.bp_diastolic) {
            set_bp(frm);
        }
    }
});

function calculate_bmi(frm) {
    let bmi = (frm.doc.weight / (frm.doc.height * frm.doc.height)).toFixed(2);
    let bmi_note = null;

    if (bmi < 18.5) bmi_note = 'Underweight';
    else if (bmi < 25) bmi_note = 'Normal';
    else if (bmi < 30) bmi_note = 'Overweight';
    else bmi_note = 'Obese';

    frm.set_value('bmi', bmi);
    frm.set_value('nutrition_note', bmi_note);
}

function set_bp(frm) {
    let bp = frm.doc.bp_systolic + '/' + frm.doc.bp_diastolic + ' mmHg';
    frm.set_value('bp', bp);
}

// DocType: Patient Encounter
// Evento: onload o refresh

frappe.ui.form.on('Patient Encounter', {
    onload: function (frm) {
        reorder_fields(frm);
    },
    refresh: function (frm) {
        reorder_fields(frm);
    }
});

function reorder_fields(frm) {
    // Obtener el elemento después del cual queremos insertar
    let target_field = frm.fields_dict['hco_sb_school_certificates'];

    if (!target_field) return;

    let target_wrapper = target_field.wrapper;

    // Campos a mover en orden
    let fields_to_move = [
        'rehabilitation_section',
        'sb_test_prescription',
        'codification',
    ];

    // Mover cada campo después del objetivo
    fields_to_move.forEach(function (fieldname) {
        let field = frm.fields_dict[fieldname];
        if (field && field.wrapper) {
            // Insertar después del campo objetivo
            $(field.wrapper).insertAfter(target_wrapper);
            // Actualizar el objetivo para el próximo campo
            target_wrapper = field.wrapper;
        }
    });

    let drugs_field = frm.fields_dict['sb_drug_prescription'];
    if (!drugs_field) return;

    let drugs_wrapper = drugs_field.wrapper;

    let procedure_field = 'sb_procedures'

    let procedure = frm.fields_dict[procedure_field];
    if (procedure && procedure.wrapper) {
        // Insertar después del campo objetivo
        $(procedure.wrapper).insertAfter(drugs_wrapper);
        // Actualizar el objetivo para el próximo campo
        drugs_wrapper = procedure.wrapper;
    }

}

// Validación para paciente inactivo (hco_patient_status != "Active")
frappe.ui.form.on('Patient Encounter', {
    patient: function (frm) {
        if (frm.doc.patient) {
            frappe.call({
                method: 'frappe.client.get',
                args: {
                    doctype: 'Patient',
                    name: frm.doc.patient
                },
                callback: function (data) {
                    if (data.message) {
                        let patient_status = data.message.hco_patient_status;
                        if (patient_status !== "Active") {
                            frappe.throw("Paciente Inactivo")
                        }
                    }
                }
            });
        }
    }
});

// Notificación de alergias del paciente
frappe.ui.form.on('Patient Encounter', {
    onload: function (frm) {
        if (frm.doc.patient) {
            if (frm.doc.hco_allergies && frm.doc.hco_allergies.trim() !== "") {
                frappe.msgprint({
                    message: __(`El paciente tiene alergias registradas: ${frm.doc.hco_allergies}`),
                    title: __("Atención"),
                    indicator: "orange"
                });

            }
        }
    },
    after_save: function (frm) {
        if (frm.doc.patient) {
            if (frm.doc.hco_allergies && frm.doc.hco_allergies.trim() !== "") {
                frappe.msgprint({
                    message: __(`El paciente tiene alergias registradas: ${frm.doc.hco_allergies}`),
                    title: __("Atención"),
                    indicator: "orange"
                });
            }
        }
    }
})