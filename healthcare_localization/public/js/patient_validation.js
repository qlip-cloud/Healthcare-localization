frappe.ui.form.on(cur_frm.doctype, {
    patient: function(frm) {
        if (!frm.doc.patient) return;

        frappe.call({
            method: 'frappe.client.get',
            args: {
                doctype: 'Patient',
                name: frm.doc.patient
            },
            callback: function(data) {
                if (data.message) {
                    const status = data.message.hco_patient_status;
                    if (status && status !== "Active") {
                        frappe.throw(__("Paciente Inactivo"));
                    }
                }
            }
        });
    }
});
