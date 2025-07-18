import frappe
import json
from healthcare_localization.healthcare_localization.services.get_invoices import get_invoices
from healthcare_localization.healthcare_localization.services.generate_rips_json import handle as generate_rips_json
from healthcare_localization.healthcare_localization.services.generate_rips_excel import generate_rips_excel

@frappe.whitelist()
def validate_rips(start_date, end_date):
    """
    Ejecuta el proceso de validación y generación de los JSON RIPS a partir de las facturas electrónicas.

    Este método se llama desde el botón "Generate RIPS" en el Doctype `qp_MD_RIPS`. Recibe un rango de fechas,
    consulta las facturas electrónicas validadas por la DIAN y marcadas como RIPS, genera el JSON de transacción
    correspondiente para cada una y registra los resultados en el log de errores de Frappe para verificación.

    Args:
        start_date: Fecha inicial del rango a procesar.
        end_date: Fecha final del rango a procesar.

    Returns:
        JSON con la información de los RIPS
    """
    try:
        invoices = get_invoices(start_date, end_date)
        if not invoices:
            return {"msg": "No invoices found in the specified date range."}

        rips_json = generate_rips_json(invoices)
        rips_data = json.loads(rips_json)
        generate_rips_excel(rips_data)
        frappe.log_error(message=json.dumps(rips_data), title="RIPS Data Generated")
        return {"msg": "RIPS data generated successfully.", "data": rips_data}

    except Exception as e:
        frappe.log_error(message=frappe.get_traceback(), title="RIPS Validation Error")
        return {"msg": f"An error occurred: {str(e)}"}