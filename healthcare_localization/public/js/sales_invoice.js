frappe.ui.form.on("Sales Invoice", "refresh", function(frm) {
    if (frm.doc.docstatus == 1 && frm.doc.hco_rips && !frm.doc.hco_validated) {
        frm.add_custom_button(__("Validate RIPS"), function() {
            console.log("frm.doc.name", frm.doc.name);
            frappe.confirm(__("This action sends a validation request to the Ministry of Health. Are you sure?"), function() {
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
        });
    }
});