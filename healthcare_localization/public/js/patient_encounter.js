frappe.ui.form.on('Patient Encounter', {
	medical_department: function(frm) {
		frm.events.set_medical_department_fields(frm);
	},

	set_medical_department_fields: function(frm) {
		if (frm.doc.medical_department) {
			frappe.call({
				method: 'healthcare_localization.healthcare_localization.utils.get_info.get_fields_from_department',
				args: {
					medical_department: frm.doc.medical_department
				},
				callback: function(data) {
                    if (data.message) {
                        let values = {
                            'hco_service_code':data.message[0]
                        };
                        frm.set_value(values);
                    }
				}
			});
		}
		else {
			let values = {
				'hco_service_code': ''
			};
			frm.set_value(values);
		}
	},
});