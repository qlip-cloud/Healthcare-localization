import frappe
import json
import os
from healthcare_localization.healthcare_localization.services.get_invoices import (
    get_invoices,
)
from healthcare_localization.healthcare_localization.services.generate_rips_json import (
    handle as generate_rips_json,
)
from healthcare_localization.healthcare_localization.services.generate_rips_excel import (
    generate_rips_excel,
)


@frappe.whitelist()
def validate_rips(start_date, end_date, docname):
    """
    Ejecuta el proceso de validación y generación de los RIPS a partir de las facturas electrónicas.

    Este método se llama desde el botón "Generate RIPS" en el Doctype `qp_MD_RIPS`. Recibe un rango de fechas,
    consulta las facturas electrónicas validadas por la DIAN y marcadas como RIPS, genera el JSON y 
    el archivo Excel de transacción correspondiente para cada una y registra los resultados en el log de errores 
    de Frappe para verificación.

    Args:
        start_date: Fecha inicial del rango a procesar.
        end_date: Fecha final del rango a procesar.
        docname: Nombre del documento qp_MD_RIPS para adjuntar el archivo.

    Returns:
        JSON con la información de los RIPS y estado del proceso
    """
    try:
        # Validar parámetros
        if not all([start_date, end_date, docname]):
            return {
                "success": False,
                "msg": "Missing required parameters: start_date, end_date, or docname.",
            }

        # Obtener facturas
        invoices = get_invoices(start_date, end_date)
        if not invoices:
            return {
                "success": False,
                "msg": f"No invoices found in the date range from {start_date} to {end_date}.",
            }

        # Generar JSON RIPS
        rips_json = generate_rips_json(invoices)
        rips_data = json.loads(rips_json)

        # Generar archivo Excel
        excel_path = generate_rips_excel(rips_data, docname)

        # Adjuntar archivo al documento
        attach_file_to_doc(docname, excel_path)

        # Log para auditoría
        frappe.log_error(
            message=json.dumps(
                {
                    "docname": docname,
                    "start_date": start_date,
                    "end_date": end_date,
                    "invoices_count": len(invoices),
                    "rips_count": len(rips_data),
                    "file_path": excel_path,
                }
            ),
            title="RIPS Generation Success",
        )

        return {
            "success": True,
            "msg": f"RIPS data generated successfully. Processed {len(invoices)} invoices and generated {len(rips_data)} RIPS records.",
            "data": {
                "invoices_count": len(invoices),
                "rips_count": len(rips_data),
                "file_path": excel_path,
            },
        }

    except Exception as e:
        frappe.log_error(message=frappe.get_traceback(), title="RIPS Validation Error")
        return {
            "success": False,
            "msg": f"An error occurred while generating RIPS: {str(e)}",
        }


def attach_file_to_doc(docname, file_path):
    """
    Adjunta un archivo al documento qp_MD_RIPS.

    Args:
        docname: Nombre del documento
        file_path: Ruta del archivo a adjuntar
    """
    try:
        # Verificar que el archivo existe
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        # Leer el archivo
        with open(file_path, "rb") as f:
            file_content = f.read()

        # Crear el archivo en Frappe
        file_doc = frappe.get_doc(
            {
                "doctype": "File",
                "file_name": os.path.basename(file_path),
                "attached_to_doctype": "qp_MD_RIPS",
                "attached_to_name": docname,
                "attached_to_field": "rips",
                "content": file_content,
                "decode": False,
            }
        )
        file_doc.insert()

        # Actualizar el campo rips del documento
        frappe.db.set_value("qp_MD_RIPS", docname, "rips", file_doc.file_url)
        frappe.db.commit()

        # Limpiar archivo temporal
        if os.path.exists(file_path):
            os.remove(file_path)

    except Exception as e:
        frappe.log_error(
            message=f"Error attaching file to document {docname}: {str(e)}\n{frappe.get_traceback()}",
            title="File Attachment Error",
        )
        raise
