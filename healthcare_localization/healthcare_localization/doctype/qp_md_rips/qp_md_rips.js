// Copyright (c) 2025, Aryrosa Fuentes and contributors
// For license information, please see license.txt

frappe.ui.form.on('qp_MD_RIPS', {
	refresh: function (frm) {
		if (frm.doc.docstatus === 1) {
			frm.add_custom_button(__("Generate RIPS"), function () {
				// Validar fechas antes de proceder
				if (!frm.doc.start_date || !frm.doc.end_date) {
					frappe.msgprint(__("Please select both start and end dates."));
					return;
				}

				frappe.confirm(
					__("This action will process validated invoices from the selected period and generate the RIPS Excel file. Are you sure?"),
					function () {
						frappe.show_progress(__('Generating RIPS'), 0, 100, __('Processing invoices...'));

						frappe.call({
							method: "healthcare_localization.healthcare_localization.uses_cases.qp_MD_RIPS.validate.validate_rips",
							args: {
								start_date: frm.doc.start_date,
								end_date: frm.doc.end_date,
								docname: frm.doc.name 
							},
							freeze: true,
							freeze_message: __("Generating RIPS file..."),
							callback: function (r) {
								frappe.hide_progress();

								if (r.message) {
									if (r.message.success) {
										frappe.show_alert({
											message: r.message.msg,
											indicator: 'green'
										});
										frm.reload_doc();
									} else {
										frappe.msgprint({
											title: __('Error'),
											message: r.message.msg,
											indicator: 'red'
										});
									}
								}
							},
							error: function (r) {
								frappe.hide_progress();
								frappe.msgprint({
									title: __('Error'),
									message: __('An unexpected error occurred while generating RIPS.'),
									indicator: 'red'
								});
							}
						});
					}
				);
			});
		}
	}
});