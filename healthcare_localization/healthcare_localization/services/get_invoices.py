import frappe

def get_invoices(start_date, end_date):
    """
    Fetch invoices within a specified date range.
    
    :param start_date: Start date for filtering invoices
    :param end_date: End date for filtering invoices
    :return: List of invoices within the date range that are submitted and validated by DIAN  
    """
    query = """
        SELECT si.name
        FROM `tabSales Invoice` si
        INNER JOIN `tabqp_EICO_Transaction` transaction
        ON si.name = transaction.parent
        WHERE si.posting_date BETWEEN %s AND %s
        AND si.docstatus = 1
        AND si.hco_rips = 1
        AND transaction.status = 0 AND transaction.response = 'Exitosa'
    """
    return frappe.db.sql(query, (start_date, end_date), as_dict=True)
