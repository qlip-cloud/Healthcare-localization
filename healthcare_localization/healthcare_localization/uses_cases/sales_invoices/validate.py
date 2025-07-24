from var_dump import var_dump 
import frappe
from frappe import _
from electronic_invoicing_colombia.electronic_invoicing_colombia.service.setup.sales_invoices.get_setup \
    import get_is_not_electronic_invoice_resolution
from healthcare_localization.healthcare_localization.uses_cases.sales_invoices.validation import handle as get_petition

@frappe.whitelist()
def validate_rips(si_doc):
    msg = "There was an error. Check error list"

    try:
        sales_invoices = frappe.get_doc("Sales Invoice", si_doc)

        # --------------------------------------
        res = get_petition(sales_invoices)
        # --------------------------------------

        # Si es factura electrónica
        # Si ya está validada y si está activa factura rips
        # Si no está la factura validada por el ministerio aún
        if not get_is_not_electronic_invoice_resolution(sales_invoices) and \
            sales_invoices.docstatus == 1 and sales_invoices.hco_rips and \
            not sales_invoices.hco_validated:
            # TODO: Programar lógica
            msg = _("Completed")
        else:
            msg = _("The request is not sent...")

        return {"msg": msg}

    except Exception as error:

        frappe.log_error(message=frappe.get_traceback(), title="Validate RIPS")

        pass

    return {"msg": msg}