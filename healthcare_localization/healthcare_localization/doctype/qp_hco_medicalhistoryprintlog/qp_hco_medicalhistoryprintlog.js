// Copyright (c) 2025, Aryrosa Fuentes and contributors
// For license information, please see license.txt

frappe.ui.form.on('qp_HCO_MedicalHistoryPrintLog', {
    refresh(frm) {
        setTimeout(() => {
            frm.page.wrapper
                .find('button.icon-btn use[href="#icon-printer"]')
                .closest('button')
                .hide();
        }, 0);
    }
});
