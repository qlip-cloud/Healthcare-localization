frappe.pages['patient_history'].on_page_show = function (wrapper) {

  // Botones para editar historiales específicos
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

      $main_section.on('click', '[data-history-type]', function () {
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
      if (frappe.get_route()[0] !== "patient_history") {
        return;
      }

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

    $(document).on('frappe:form:set_value', function (e, fieldname, value) {
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
  function fetchAllAllergies(patient) {
    return frappe.call({
      method: "frappe.client.get_list",
      args: {
        doctype: "Patient Encounter",
        filters: { patient: patient, docstatus: 1 },
        fields: ["hco_allergies"],
        order_by: "encounter_date desc",
        limit_page_length: 200
      }
    }).then(r => {
      if (!r.message || r.message.length === 0) return "";

      let allLines = [];

      for (let enc of r.message) {
        if (enc.hco_allergies) {
          let lines = enc.hco_allergies
            .split("\n")
            .map(l => l.trim())
            .filter(l => l !== "");

          allLines.push(...lines);
        }
      }

      let unique = [...new Set(allLines)].sort();

      return unique.join(", ");
    });
  }

  // Extender la función show_patient_info para incluir la verificación de alergias
  const original_show_patient_info = show_patient_info;

  show_patient_info = function(patient_id, me) {
      original_show_patient_info(patient_id, me);
      fetchAllAllergies(patient_id).then(allergies => {
            if (allergies && allergies.trim() !== "") {
              frappe.msgprint({
                title: __('Atención'),
                message:  __(`El paciente tiene alergias registradas: ${allergies}`),
                indicator: 'orange'
              });
            }
      });

  }

  // Agregar opción de impresión de historial completo
  const page = wrapper.page;
  if (page) {
    let $btn = page.set_secondary_action('Imprimir', () => createPrintLog(), 'printer');
  }

  // Creación del registro de impresión
  const createPrintLog = () => {
    let d = new frappe.ui.Dialog({
      title: 'Registro de Impresión',
      fields: [
      {
        label: 'Usuario',
        fieldname: 'user',
        fieldtype: 'Data',
        reqd: 1
      },
      {
        label: 'Fecha',
        fieldname: 'print_date',
        fieldtype: 'Date',
        reqd: 1,
        read_only: 1,
        default: frappe.datetime.get_today()
      },
      {
        label: 'Motivo de Impresión',
        fieldname: 'print_reason',
        fieldtype: 'Small Text',
        reqd: 1,
        description: 'Mínimo 20 caracteres, máximo 5000 caracteres'
      },
      {
        label: 'Observaciones',
        fieldname: 'observations',
        fieldtype: 'Text',
        reqd: 0,
        description: 'Máximo 5000 caracteres'
      }
      ],
      primary_action_label: 'Registrar',
      primary_action(values) {
        const patient = $('div[data-fieldname="patient"] input').val();
        if (!patient) {
          frappe.msgprint({
            title: __('Error'),
            message: __('No se ha seleccionado un paciente.'),
            indicator: 'red'
          });
          return;
        }

        // Validar longitud de print_reason
        if (values.print_reason && values.print_reason.length < 20) {
          frappe.msgprint({
            title: __('Validación'),
            message: __('El motivo de impresión debe tener al menos 20 caracteres.'),
            indicator: 'red'
          });
          return;
        }

        if (values.print_reason && values.print_reason.length > 5000) {
          frappe.msgprint({
            title: __('Validación'),
            message: __('El motivo de impresión no puede exceder los 5000 caracteres.'),
            indicator: 'red'
          });
          return;
        }

        // Validar longitud de observations
        if (values.observations && values.observations.length > 5000) {
          frappe.msgprint({
            title: __('Validación'),
            message: __('Las observaciones no pueden exceder los 5000 caracteres.'),
            indicator: 'red'
          });
          return;
        }

        frappe.call({
          method: 'frappe.client.insert',
          args: {
            doc: {
              doctype: 'qp_HCO_MedicalHistoryPrintLog',
              user: values.user,
              print_date: values.print_date,
              print_reason: values.print_reason,
              observations: values.observations,
              patient: patient
            }
          },
          callback: function(r) {
            if (!r.exc) {
              d.hide();
              frappe.show_alert({
                message: __('Registro de impresión creado correctamente.')
              });
              window.open(`print/qp_HCO_MedicalHistoryPrintLog/${r.message.name}`, '_blank');
            } else {
              frappe.msgprint({
                title: __('Error'),
                message: __('Ocurrió un error al crear el registro de impresión.'),
                indicator: 'red'
              });
              console.error(r.exc);
            }
          }
        });
      }
    });

    d.show();
  }
};
