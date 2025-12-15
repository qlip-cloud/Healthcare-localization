// Copyright (c) 2025, Aryrosa Fuentes and contributors
// For license information, please see license.txt

frappe.ui.form.on('qp_HCO_MedicalHistoryPrintLog', {
	refresh: function(frm) {
		frm.page.btn_print.hide();
		console.log("Print function disabled for qp_HCO_MedicalHistoryPrintLog");
	}
});
