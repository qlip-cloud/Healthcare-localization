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
    setup: function (frm) {
        if (!frm.original_read_only_state) {
            frm.original_read_only_state = {};
            Object.keys(frm.fields_dict).forEach(function (fieldname) {
                let field = frm.fields_dict[fieldname];
                if (field && field.df) {
                    frm.original_read_only_state[fieldname] = field.df.read_only || 0;
                }
            });
        }
    },
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
                        let status = data.message.hco_patient_status;

                        if (status !== "Active") {
                            frappe.msgprint({
                                message: __("Paciente Inactivo"),
                                title: __("Error"),
                                indicator: "red"
                            });
                            // Bloquear todos los campos excepto patient
                            Object.keys(frm.fields_dict).forEach(function (fieldname) {
                                if (fieldname !== 'patient') {
                                    frm.set_df_property(fieldname, 'read_only', 1);
                                }
                            });
                            frm.set_df_property('patient', 'read_only', 0);
                            frm.disable_save();

                        } else {
                            // Restaurar el estado original de read_only de cada campo
                            Object.keys(frm.fields_dict).forEach(function (fieldname) {
                                if (frm.original_read_only_state && frm.original_read_only_state[fieldname] !== undefined) {
                                    frm.set_df_property(fieldname, 'read_only', frm.original_read_only_state[fieldname]);
                                }
                            });
                            frm.enable_save();
                            frm.refresh_fields();
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

frappe.ui.form.on("Patient Encounter", {
    refresh(frm) {
        // Límites de caracteres
        const limits = {
            hco_reason_of_consultation: { min: 10, max: 500 },
            hco_medical_history: { min: 0, max: 500 },
            hco_allergies: { min: 0, max: 500 },
            hco_surgical_history: { min: 0, max: 500 },
            hco_other_history: { min: 0, max: 500 },
            hco_current_illness: { min: 0, max: 500 },
            hco_evolution: { min: 0, max: 500 },
            hco_new_findings: { min: 0, max: 500 },
            hco_response_to_treatment: { min: 0, max: 500 },
            hco_therapeutic_adjustments: { min: 0, max: 500 },
            hco_school: { min: 0, max: 500 },
            hco_medical_justification: { min: 0, max: 500 },
            hco_certificate_details: { min: 0, max: 500 },
            hco_physical_exam: { min: 0, max: 1000 },
            hco_other_exam_detail: { min: 0, max: 100 },
            hco_referral_details: { min: 0, max: 500 },
            hco_treatment: { min: 0, max: 500 },
            hco_general_recs: { min: 0, max: 500 }
        };
        const size_limits = {
            hco_school: 35,
            hco_medical_justification: 35,
            hco_treatment: 100,
            hco_general_recs: 100
        };
        frm.field_limits = limits;
        frm.size_limits = size_limits;
        frappe.after_ajax(() => {
            for (let fieldname in limits) {
                setup_field_validation(frm, fieldname, limits[fieldname]);
            }
            for (let fieldname in size_limits) {
                modify_field_size(frm, fieldname, size_limits[fieldname]);
            }
        });
    },

    validate(frm) {
        let errors = [];

        for (let fieldname in frm.field_limits) {
            const field = frm.get_field(fieldname);
            const value = (frm.doc[fieldname] || "").trim();

            if (field && !field.df.hidden && value.length > 0) {
                const { min } = frm.field_limits[fieldname];

                if (value.length < min) {
                    errors.push({
                        fieldname: fieldname,
                        label: field.df.label,
                        current: value.length,
                        min: min
                    });
                }
            }
        }

        if (errors.length > 0) {
            const msg = errors.map(e =>
                `<b>${e.label}:</b> ${e.current}/${e.min} caracteres`
            ).join('<br>');

            frappe.msgprint({
                title: __('Campos incompletos'),
                indicator: 'orange',
                message: `Los siguientes campos necesitan más información:<br><br>${msg}`
            });

            // Enfocar el primer campo con error
            frm.scroll_to_field(errors[0].fieldname);

            frappe.validated = false;
            return false;
        }
    }
});

// Función modificar tamaño visual de campos

function modify_field_size(frm, fieldname, size) {
    const field = frm.get_field(fieldname);
    const $input = $(field.input);
    if (!field || !field.input) return;

     $input.css("height", "" + size + "px");
    
}
// Configurar validación individual por campo
function setup_field_validation(frm, fieldname, limits) {
    const field = frm.get_field(fieldname);
    if (!field || !field.input) return;

    const $input = $(field.input);
    const { min, max } = limits;

    $input.attr("maxlength", max);


    $input.off("input.charvalidation").on("input.charvalidation",
        debounce(() => {
            const value = (frm.doc[fieldname] || "").trim();
            update_field_feedback(field, value.length, min, max);
        }, 300)
    );


    $input.off("blur.charvalidation").on("blur.charvalidation", () => {
        const value = (frm.doc[fieldname] || "").trim();
        if (value.length > 0 && value.length < min) {
            show_field_error(field, value.length, min);
        } else {
            clear_field_error(field);
        }
    });

    $input.off("focus.charvalidation").on("focus.charvalidation", () => {
        clear_field_error(field);
    });
}

function update_field_feedback(field, length, min, max) {
    const $counter = field.$wrapper.find(".char-counter .current");
    const $input = $(field.input);

    $counter.text(length);

    const $wrapper = field.$wrapper.find(".char-counter");

    if (length === 0) {
        $wrapper.css("color", "#8d99a6"); 
        $input.removeClass("validate-warning validate-success");
    } else if (length < min) {
        $wrapper.css("color", "#f39c12"); 
        $input.addClass("validate-warning").removeClass("validate-success");
    } else {
        $wrapper.css("color", "#27ae60"); 
        $input.addClass("validate-success").removeClass("validate-warning");
    }
}

function show_field_error(field, current, min) {
    const $input = $(field.input);

    clear_field_error(field);

    $input.addClass("validate-error");
    field.$wrapper.append(`
        <div class="char-error" style="color: #e74c3c; font-size: 12px; margin-top: 3px;">
            <i class="fa fa-exclamation-circle"></i> 
            Faltan ${min - current} caracteres (mínimo ${min})
        </div>
    `);
}

function clear_field_error(field) {
    field.$wrapper.find(".char-error").remove();
    $(field.input).removeClass("validate-error validate-warning");
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

frappe.after_ajax(() => {
    if (!document.getElementById("custom-field-validation-styles")) {
        $("head").append(`
            <style id="custom-field-validation-styles">
                .validate-warning {
                    border-color: #f39c12 !important;
                    transition: border-color 0.3s ease;
                }
                .validate-success {
                    border-color: #27ae60 !important;
                    transition: border-color 0.3s ease;
                }
                .validate-error {
                    border-color: #e74c3c !important;
                    transition: border-color 0.3s ease;
                }
            </style>
        `);
    }
});