// Copyright (c) 2025, Aryrosa Fuentes and contributors
// For license information, please see license.txt

frappe.ui.form.on('qp_MD_RIPS', {
	refresh: function (frm) {
		if (!frm.is_new()) {
			add_custom_buttons(frm);
		}

		if (frm.doc.confirmed) {
			frm.set_df_property('start_date', 'read_only', 1);
			frm.set_df_property('end_date', 'read_only', 1);
			frm.set_df_property('rips', 'read_only', 1);
		}
	},


	before_save: function (frm) {
		if (frm.doc.confirmed) {
			frappe.throw(__('Cannot save confirmed RIPS document'));
		}
	}
});

function add_custom_buttons(frm) {
	if (!frm.doc.confirmed) {
		frm.add_custom_button(__('Confirmar'), function () {
			if (!frm.is_dirty()) {
				confirm_doc(frm, frm.doc.name);
			} else {
				frappe.msgprint({
					title: __('Unsaved Changes'),
					message: __('Please save the document before confirming'),
					indicator: 'orange'
				});
			}
		}, __('Actions'));
	}

	if (frm.doc.rips) {
		frm.add_custom_button(__('Descargar RIPS'), function () {
			download_doc(frm, frm.doc.name);
		}, __('Actions'));
	}

	if (frm.doc.confirmed) {
		frm.add_custom_button(__('Generar JSON'), function () {
			generate_json(frm, frm.doc.name);
		}, __('Actions'));
	}
}

function download_doc(frm, upload_id) {
	frappe.message({
		title: __('Downloading RIPS'),
		message: __('Please wait while the RIPS document is being downloaded...'),
		indicator: 'blue'
	});
}

function confirm_doc(frm, upload_id) {
	frappe.confirm(
		__('Are you sure you want to confirm this RIPS document? This action cannot be undone.'),
		function () {
			frm.set_df_property('confirmed', 'read_only', 1);
			frm.set_value('confirmed', 1);
			frappe.msgprint({
				title: __('RIPS Confirmed'),
				message: __('The RIPS document has been successfully confirmed.'),
				indicator: 'green'
			});
			frm.refresh();
		},
	);
}

function generate_json(frm, upload_id) {
	frappe.confirm(__("This action sends a validation request to the Ministry of Health. Are you sure?"), function () {
		frappe.call({
			method: "healthcare_localization.healthcare_localization.uses_cases.sales_invoices.validate.validate_rips",
			args: {
				si_doc: frm.doc.name
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
}