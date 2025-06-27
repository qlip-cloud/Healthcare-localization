import frappe
from frappe import _
from erpnext.healthcare.doctype.healthcare_practitioner.healthcare_practitioner import HealthcarePractitioner as ERPHealthcarePractitioner

class HealthcarePractitioner(ERPHealthcarePractitioner):
  
  def set_full_name(self):
    if self.last_name:
      if self.middle_name:
        self.practitioner_name = ' '.join(filter(None, [self.first_name, self.middle_name, self.last_name]))
      else:
        self.practitioner_name = ' '.join(filter(None, [self.first_name, self.last_name]))
    else:
      self.practitioner_name = self.first_name
    