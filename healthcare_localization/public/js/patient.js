frappe.ui.form.on("Patient", "onload", function(frm) {
    frm.set_query("sex", function() {
        return {
            filters:{
                'hco_code': ['!=', '']
            }
        }
    });
	frm.set_query("hco_residence_country", function() {
        return {
            filters:{
                'hco_iso_numeric_code': ['!=', '']
            }
        }
    });
	frm.set_query("hco_birth_country", function() {
        return {
            filters:{
                'hco_iso_numeric_code': ['!=', '']
            }
        }
    });
});

frappe.ui.form.on('Patient', 'eico_nvent_nomb_id', function(frm) {
	if (frm.doc.eico_nvent_nomb_id) {

        frappe.call({
			method: "healthcare_localization.healthcare_localization.uses_cases.sales_invoices.validation.get_data_third_party",
			args: {
				customer: frm.doc.eico_nvent_nomb_id
			},
			callback: function(r){
				if(r.message){
                    console.log("---->>>", r.message)
                    frappe.model.set_value(frm.doctype,frm.docname, 'eico_nvent_pais', r.message.third_party_country);
				}
			}
		});

	}
	else {
		frappe.model.set_value(frm.doctype,frm.docname, 'eico_nvent_pais', '');
	}
});