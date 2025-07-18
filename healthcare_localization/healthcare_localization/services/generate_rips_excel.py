import json
import pandas as pd

def generate_rips_excel(rips_data):
    """
    Generates an Excel file from the RIPS data.

    Args:
        rips_data (list): List of dictionaries containing RIPS data.

    Returns:
        str: Path to the generated Excel file.
    """
    try:
         # Niveles de los RIPS
        transaccion = []
        usuarios = []
        consultas = []
        urgencias = []
        procedimientos = []
        hospitalizaciones = []
        recienNacidos = []
        medicamentos = []
        otrosServicios = []

        for rips in rips_data:
            transaccion.append(rips.get("transaccion", {}))
            num_DocumentoIdObligado = rips.get("transaccion", "").get("num_DocumentoIdObligado", "")
            for usuario in rips.get("usuarios", []):
                usuario_copy = usuario.copy()
                usuario_copy["num_DocumentoIdObligado"] = num_DocumentoIdObligado
                usuarios.append(usuario_copy)
                consecutivoUsuario = usuario.get("consecutivo", "")
                for consulta in usuario.get("servicios", []).get("consultas", []):
                    consulta_copy = consulta.copy()
                    consulta_copy["num_DocumentoIdObligado"] = num_DocumentoIdObligado
                    consulta_copy["consecutivoUsuario"] = consecutivoUsuario
                    consultas.append(consulta_copy)

        df_transaccion = pd.DataFrame(transaccion)
        df_usuarios = pd.DataFrame(usuarios)
        df_consultas = pd.DataFrame(consultas)

        with pd.ExcelWriter('RIPS_Data.xlsx') as writer:
            df_transaccion.to_excel(writer, sheet_name='Transaccion', index=False)
            df_usuarios.to_excel(writer, sheet_name='Usuarios', index=False)
            df_consultas.to_excel(writer, sheet_name='Consultas', index=False)

    except Exception as e:
        raise Exception(f"Error generating RIPS Excel file: {str(e)}")
    
