import frappe

def add_index(doc=None, method=None):

    frappe.db.add_index("qp_HCO_pathological_history", ["parent", "parentfield", "parenttype"])
