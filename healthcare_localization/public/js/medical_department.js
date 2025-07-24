frappe.ui.form.on("Medical Department", "onload", function(frm) {
    // Tablas maestros
	frm.set_query("hco_service_code", function() {
        return {
            filters:{
                'enabled': ['=', '1']
            }
        }
    });
});