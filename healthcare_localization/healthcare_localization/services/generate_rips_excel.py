import json
import pandas as pd
import os
from datetime import datetime
import frappe

def generate_rips_excel(rips_data, docname=None):
    """
    Generates an Excel file from the RIPS data with optimized processing.

    Args:
        rips_data (list): List of dictionaries containing RIPS data.
        docname (str): Document name for unique file naming.

    Returns:
        str: Path to the generated Excel file.
    """
    try:
        if not rips_data:
            raise ValueError("No RIPS data provided")

        # Generar nombre único para el archivo
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"RIPS_Data_{docname or 'unknown'}_{timestamp}.xlsx"
        file_path = os.path.join(frappe.utils.get_site_path(), "private", "files", filename)
        
        # Asegurar que el directorio existe
        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        # Inicializar estructuras de datos
        data_sheets = {
            'Transaccion': [],
            'Usuarios': [],
            'Consultas': [],
            'Urgencias': [],
            'Procedimientos': [],
            'Hospitalizaciones': [],
            'RecienNacidos': [],
            'Medicamentos': [],
            'OtrosServicios': []
        }

        # Procesar datos de manera optimizada
        for rips in rips_data:
            # Datos de transacción
            transaccion = rips.copy()
            transaccion.pop("Usuarios", None)  # Eliminar usuarios de transacción
            if transaccion:
                data_sheets['Transaccion'].append(transaccion)
            
            num_documento_obligado = transaccion.get("numDocumentoIdObligado", "")
            
            # Procesar usuarios y sus servicios
            for usuario in rips.get("Usuarios", []):
                # Agregar usuario con referencia al documento obligado
                usuario_copy = usuario.copy()
                usuario_copy["num_DocumentoIdObligado"] = num_documento_obligado
                usuario_copy.pop("Servicios", None)
                data_sheets['Usuarios'].append(usuario_copy)
                
                consecutivo_usuario = usuario.get("consecutivo", "")
                servicios = usuario.get("Servicios", {})
                
                # Procesar cada tipo de servicio
                service_types = [
                    ('consultas', 'Consultas'),
                    ('urgencias', 'Urgencias'),
                    ('procedimientos', 'Procedimientos'),
                    ('hospitalizaciones', 'Hospitalizaciones'),
                    ('recienNacidos', 'RecienNacidos'),
                    ('medicamentos', 'Medicamentos'),
                    ('otrosServicios', 'OtrosServicios')
                ]
                
                for service_key, sheet_name in service_types:
                    for servicio in servicios.get(service_key, []):
                        servicio_copy = servicio.copy()
                        servicio_copy["num_DocumentoIdObligado"] = num_documento_obligado
                        servicio_copy["consecutivoUsuario"] = consecutivo_usuario
                        data_sheets[sheet_name].append(servicio_copy)

        # Crear DataFrames y escribir al Excel
        with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
            for sheet_name, data in data_sheets.items():
                if data:  # Solo crear hojas que tengan datos
                    df = pd.DataFrame(data)
                    df.to_excel(writer, sheet_name=sheet_name, index=False)
                    
                    worksheet = writer.sheets[sheet_name]
                    for column in worksheet.columns:
                        max_length = 0
                        column_name = column[0].column_letter
                        for cell in column:
                            try:
                                if len(str(cell.value)) > max_length:
                                    max_length = len(str(cell.value))
                            except:
                                pass
                        adjusted_width = min(max_length + 2, 50)
                        worksheet.column_dimensions[column_name].width = adjusted_width

        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Failed to create Excel file: {file_path}")

        return file_path

    except Exception as e:
        frappe.log_error(
            message=f"Error generating RIPS Excel file: {str(e)}\n{frappe.get_traceback()}",
            title="Excel Generation Error"
        )
        raise Exception(f"Error generating RIPS Excel file: {str(e)}")
