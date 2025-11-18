frappe.ui.form.on(cur_frm.doctype, {
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
                            frappe.msgprint({
                                message: __("Paciente Inactivo"),
                                title: __("Error"),
                                indicator: "red"
                            });
                            frm.set_value('patient', '');
                            frm.refresh_field('patient');
                        }
                    }
                }
            });
        }
    }
});
