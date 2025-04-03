frappe.ui.form.on("Patient Appointment", "onload", function(frm) {
    frm.set_query("department", function() {
        return {
            filters:{
                'hco_service_code': ['!=', '']
            }
        }
    });
});