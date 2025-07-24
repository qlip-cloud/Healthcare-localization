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