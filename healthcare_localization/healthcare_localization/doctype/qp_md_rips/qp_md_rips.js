// Copyright (c) 2025, Aryrosa Fuentes and contributors
// For license information, please see license.txt
frappe.ui.form.on('qp_MD_RIPS', {
	refresh: function (frm) {
		if (frm.doc.docstatus == 1) {
			frm.add_custom_button(__("Generate RIPS"), function () {
				frappe.confirm(__("This action will process validated invoices from the selected period and generate the RIPS Excel file. Are you sure?"), function () {
					frappe.call({
						method: "healthcare_localization.healthcare_localization.uses_cases.qp_MD_RIPS.validate.validate_rips",
						args: {
							start_date: frm.doc.start_date,
							end_date: frm.doc.end_date,
						},
						freeze: true,
						callback: (r) => {
							if (r.message) {
								frappe.msgprint(r.message.msg);
							}
							frm.refresh();
						}
					});
				});
			});
		}
	}
});

