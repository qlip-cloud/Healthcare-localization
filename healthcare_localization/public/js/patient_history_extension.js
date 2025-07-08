frappe.pages['patient_history'].on_page_show = function (wrapper) {
  const $wrapper = $(wrapper);
  const $main_section = $wrapper.find('.patient_documents');

  if ($main_section.length) {
    initializePatientHistoryButtons($main_section);
  }
  const historyConfig = {
    pathological: {
      template: "Personales Patológicos",
      title: "Editar Personales Patológicos",
      fieldname: "hco_pathological_history",
      detailField: "hco_pathological_history_detail",
      successMessage: "Historial patológico actualizado correctamente."
    },
    family: {
      template: "Familiares",
      title: "Editar Historial Familiar",
      fieldname: "hco_op_family_history",
      detailField: "hco_op_family_history_detail",
      successMessage: "Historial familiar actualizado correctamente."
    },
    gynecological: {
      template: "Ginecoobstétricos",
      title: "Editar Información Ginecoobstetra",
      fieldname: "hco_ob_gyn_history",
      detailField: "hco_ob_gyn_history_detail",
      successMessage: "Información ginecoobstetra actualizado correctamente."
    }
  };
  
  function initializePatientHistoryButtons($main_section) {
    if (!$main_section.find('.my-custom-buttons').length) {
      const $btn_group = $(`
        <div class="my-custom-buttons" style="margin-bottom: 15px; display: none;">
          <button class="btn btn-sm btn-secondary" data-history-type="pathological">Personales Patológicos</button>
          <button class="btn btn-sm btn-secondary" data-history-type="family">Antecedentes Familiares</button>
          <button class="btn btn-sm btn-secondary" data-history-type="gynecological">Información Ginecoobstetra</button>
        </div>
      `);
  
      $main_section.prepend($btn_group);
  
      $main_section.on('click', '[data-history-type]', function() {
        const historyType = $(this).data('history-type');
        const config = historyConfig[historyType];
        
        if (config) {
          openPatientHistoryDialog(config);
        }
      });
  
      setupPatientChangeListener($main_section);
    }
  }
  
  function setupPatientChangeListener($main_section) {
    function toggleButtons() {
      const patient = $('div[data-fieldname="patient"] input').val();
      const $buttons = $main_section.find('.my-custom-buttons');
      
      if (patient && patient.trim() !== '') {
        $buttons.show();
      } else {
        $buttons.hide();
      }
    }
  
    setTimeout(toggleButtons, 100); 
  
    $(document).on('change', 'div[data-fieldname="patient"] input', toggleButtons);
    
    $(document).on('input', 'div[data-fieldname="patient"] input', toggleButtons);
    
    $(document).on('frappe:form:set_value', function(e, fieldname, value) {
      if (fieldname === 'patient') {
        toggleButtons();
      }
    });
  
    $(document).on('change', 'input[data-fieldname="patient"]', toggleButtons);
    
    setInterval(toggleButtons, 500);
  }
  
  function openPatientHistoryDialog(config) {
    const patient = $('div[data-fieldname="patient"] input').val();
    
    if (!patient) {
      showError('No se ha seleccionado un paciente.');
      return;
    }
  
    frappe.db.get_doc('Patient', patient)
      .then(doc => {
        loadHistoryTemplate(config, doc);
      })
      .catch(error => {
        showError('No se pudo cargar el paciente: ' + error.message);
        console.error("Error al obtener paciente:", error);
      });
  }
  
  function loadHistoryTemplate(config, patientDoc) {
    frappe.call({
      method: "healthcare_localization.healthcare_localization.utils.get_info.get_pathological_history",
      args: {
        history_type: config.template
      },
      callback: function (r) {
        const tableData = prepareTableData(patientDoc, config.detailField, r.message);
        showHistoryDialog(config, patientDoc, tableData);
      }
    });
  }
  
  function prepareTableData(patientDoc, detailField, templateData) {
    const existingData = patientDoc[detailField] || [];
    
    if (existingData.length > 0) {
      return existingData.map(row => ({
        description: row.description,
        si: row.si || 0,
        observations: row.observations || '',
        alert: row.alert || 0
      }));
    }
    
    if (templateData && templateData.length > 0) {
      return templateData.map(row => ({
        description: row.description,
        si: 0,
        observations: '',
        alert: 0
      }));
    }
    
    return [];
  }
  
  function showHistoryDialog(config, patientDoc, tableData) {
    const dialog = new frappe.ui.Dialog({
      title: config.title,
      size: 'extra-large',
      fields: [
        {
          label: 'Plantilla',
          fieldname: config.fieldname,
          fieldtype: 'Link',
          options: 'qp_HCO_history_template',
          default: config.template,
          read_only: 1,
          hidden: 1,
        },
        {
          label: 'History Detail',
          fieldname: config.detailField,
          fieldtype: 'Table',
          options: 'qp_HCO_pathological_history',
          cannot_add_rows: false,
          in_place_edit: true,
          data: tableData,
          fields: getTableFields()
        }
      ],
      primary_action_label: 'Guardar',
      primary_action(values) {
        savePatientHistory(config, patientDoc, values, dialog);
      }
    });
  
    dialog.show();
  }
  
  function getTableFields() {
    return [
      {
        label: 'Descripción',
        fieldname: 'description',
        fieldtype: 'Data',
        reqd: 1,
        in_list_view: true
      },
      {
        label: 'Sí',
        fieldname: 'si',
        fieldtype: 'Check',
        in_list_view: true
      },
      {
        label: 'Observaciones',
        fieldname: 'observations',
        fieldtype: 'Data',
        in_list_view: true
      },
      {
        label: 'Alerta',
        fieldname: 'alert',
        fieldtype: 'Check',
        in_list_view: true
      }
    ];
  }
  
  function savePatientHistory(config, patientDoc, values, dialog) {
    // Actualizar el documento del paciente
    patientDoc[config.fieldname] = config.template;
    patientDoc[config.detailField] = [];
  
    const detailData = values[config.detailField] || [];
    detailData.forEach(row => {
      patientDoc[config.detailField].push({
        doctype: 'qp_HCO_pathological_history',
        parentfield: config.detailField,
        parenttype: 'Patient',
        parent: patientDoc.name,
        description: row.description,
        si: row.si,
        observations: row.observations,
        alert: row.alert
      });
    });
  
    // Guardar el documento
    frappe.call({
      method: 'frappe.client.save',
      args: {
        doc: patientDoc
      },
      callback: (r) => {
        if (!r.exc) {
          frappe.msgprint(config.successMessage);
          dialog.hide();
        } else {
          showError('Ocurrió un error al guardar el historial.');
          console.error(r.exc);
        }
      }
    });
  }
  
  function showError(message) {
    frappe.msgprint({
      title: __('Error'),
      message: __(message),
      indicator: 'red'
    });
  }
};
