frappe.ui.form.on("Patient Appointment", "onload", function(frm) {
    frm.set_query("department", function() {
        return {
            filters:{
                'hco_service_code': ['!=', '']
            }
        }
    });
    frm.set_query("hco_medical_code", function() {
        return {
            filters: {
                'department': frm.doc.department || '',
                'appointment_type': frm.doc.appointment_type || '',
            }
        }
    });
});


// Validación para paciente inactivo (hco_patient_status != "Active")
frappe.ui.form.on('Patient Appointment', {
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