frappe.ui.form.on(cur_frm.doctype, {
    setup: function(frm) {
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
