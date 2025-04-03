from frappe import _, throw

def tax_id_company_exception():

	throw(_("Tax ID in Company not found"))

def country_third_party_exception():

	throw(_("Country in third party not found"))

def iso_numeric_code_country_exception():

	throw(_("ISO numeric code in Country not found"))

def tax_id_customer_exception():

	throw(_("Tax ID in Customer not found"))

def hco_code_gender_exception():

	throw(_("Code in Gender not found"))

def patient_sales_invoice_exception():

	throw(_("Patient in Sales Invoice not found"))

def patient_empty_field_exception(field_param):

	throw("{} {}".format(_(field_param), _("in Patient not found")))

def hco_iso_residence_country_exception():

	throw(_("ISO numeric code in Residence Country not found"))

def hco_iso_birth_country_exception():

	throw(_("ISO numeric code in Birth Country not found"))

def patient_encounter_empty_doc_exception(field_param):

	throw("{} {}".format(_(field_param), _("in Invoice not found")))

def cod_prestador_company_exception():

	throw(_("Provider code in Company not found"))

def ppal_diagnosis_patient_encounter_exception():

	throw(_("Primary diagnosis in Patient Encounter not found"))

def nvben_doc_patient_exception():

	throw(_("Identification document in Patient not found"))

def patient_encounter_empty_field_exception(field_param):

	throw("{} {}".format(_(field_param), _("in Patient Encounter not found")))
