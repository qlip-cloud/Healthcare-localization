import frappe
from frappe import _

def handle(gender, method):
	meta = frappe.get_meta("Gender")

	if meta.has_field("hco_code") and gender.get("hco_code"):
		filters = {"hco_code": gender.hco_code, "name": ["!=", gender.name]}

		doctype_with_same_number = frappe.db.get_value("Gender", filters)

		if doctype_with_same_number:
			frappe.throw(_("Code {0} is already used in {1}")
				.format(gender.hco_code, doctype_with_same_number))
