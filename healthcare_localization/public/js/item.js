frappe.ui.form.on("Item", "onload", function(frm) {
    // Tablas maestros
	frm.set_query("hco_minimum_dispensing_unit", function() {
        return {
            filters:{
                'enabled': ['=', '1']
            }
        }
    });
    frm.set_query("qp_hco_typeofmedication", function() {
        return {
            filters:{
                'enabled': ['=', '1']
            }
        }
    });
});