import React from 'react';
import { useApp } from '../context/AppContext';
import { Database, ShieldCheck, HardDrive, RefreshCw, Wifi, X, Edit3, Download, FileSpreadsheet } from 'lucide-react';

function getAge(birthDateString: string): number {
  if (!birthDateString) return 0;
  const today = new Date();
  const birthDate = new Date(birthDateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

interface DraftItem {
  key: string;
  displayName: string;
  value: string;
}

export const Configuracion: React.FC = () => {
  const { patients, doctors, appointments, financials, procedures, showToast } = useApp();

  const [onlineStatus, setOnlineStatus] = React.useState(navigator.onLine);
  const [draftCount, setDraftCount] = React.useState(0);
  const [activeDrafts, setActiveDrafts] = React.useState<DraftItem[]>([]);

  // States for the draft editing modal
  const [selectedDraft, setSelectedDraft] = React.useState<DraftItem | null>(null);
  const [editValue, setEditValue] = React.useState<string>('');
  const [jsonFields, setJsonFields] = React.useState<{ [key: string]: string }>({});
  const [isJson, setIsJson] = React.useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState<boolean>(false);

  React.useEffect(() => {
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Calculate active drafts
    updateDraftsList();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateDraftsList = () => {
    const items: DraftItem[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('xessia_draft_')) {
        let displayName = '';
        if (key === 'xessia_draft_patient') {
          displayName = 'Formulario Paciente';
        } else if (key === 'xessia_draft_quick_appt') {
          displayName = 'Cita Rápida';
        } else if (key === 'xessia_draft_income') {
          displayName = 'Ingreso Caja';
        } else if (key === 'xessia_draft_expense') {
          displayName = 'Gasto Caja';
        } else if (key.startsWith('xessia_draft_note_')) {
          const patientId = key.replace('xessia_draft_note_', '');
          const patient = patients.find(p => p.id === patientId);
          displayName = `Evolución Clínica (${patient ? patient.name : 'Paciente Desconocido'})`;
        } else {
          displayName = key.replace('xessia_draft_', '');
        }
        items.push({
          key,
          displayName,
          value: localStorage.getItem(key) || ''
        });
      }
    }
    setActiveDrafts(items);
    setDraftCount(items.length);
  };

  const getFieldLabel = (key: string) => {
    const labels: { [key: string]: string } = {
      nombre: 'Nombre Completo',
      cedula: 'Cédula de Ciudadanía',
      eps: 'EPS / Aseguradora',
      phone: 'Teléfono Celular',
      whatsapp: 'Número de WhatsApp',
      doctor: 'Doctor / Especialista',
      observaciones: 'Observaciones Iniciales',
      patientName: 'Nombre del Paciente',
      doctorId: 'ID del Doctor',
      procedure: 'Procedimiento / Tratamiento',
      amount: 'Monto / Valor',
      method: 'Método de Pago',
      concept: 'Concepto / Descripción',
      category: 'Categoría',
      notes: 'Notas Adicionales',
      date: 'Fecha',
      time: 'Hora',
      duration: 'Duración (min)'
    };
    return labels[key] || key;
  };

  const handleDeleteDraft = (key: string) => {
    localStorage.removeItem(key);
    updateDraftsList();
    showToast('Borrador eliminado correctamente.', 'success');
  };

  const handleOpenEditModal = (draft: DraftItem) => {
    setSelectedDraft(draft);
    setEditValue(draft.value);
    
    let parsed: any = null;
    let validJson = false;
    try {
      parsed = JSON.parse(draft.value);
      validJson = typeof parsed === 'object' && parsed !== null;
    } catch (e) {
      validJson = false;
    }
    
    setIsJson(validJson);
    if (validJson) {
      const fields: { [key: string]: string } = {};
      Object.keys(parsed).forEach(k => {
        if (typeof parsed[k] === 'object' && parsed[k] !== null) {
          fields[k] = JSON.stringify(parsed[k]);
        } else {
          fields[k] = String(parsed[k] ?? '');
        }
      });
      setJsonFields(fields);
    } else {
      setJsonFields({});
    }
    
    setIsEditModalOpen(true);
  };

  const handleSaveDraft = () => {
    if (!selectedDraft) return;
    
    let newValue = editValue;
    if (isJson) {
      try {
        const originalObj = JSON.parse(selectedDraft.value);
        const updatedObj = { ...originalObj };
        Object.keys(jsonFields).forEach(k => {
          const val = jsonFields[k];
          if ((val.startsWith('{') && val.endsWith('}')) || (val.startsWith('[') && val.endsWith(']'))) {
            try {
              updatedObj[k] = JSON.parse(val);
            } catch (e) {
              updatedObj[k] = val;
            }
          } else if (val === 'true') {
            updatedObj[k] = true;
          } else if (val === 'false') {
            updatedObj[k] = false;
          } else if (!isNaN(Number(val)) && val.trim() !== '') {
            updatedObj[k] = Number(val);
          } else {
            updatedObj[k] = val;
          }
        });
        newValue = JSON.stringify(updatedObj);
      } catch (e) {
        showToast('Error al procesar los datos estructurados del borrador.', 'error');
        return;
      }
    }
    
    localStorage.setItem(selectedDraft.key, newValue);
    updateDraftsList();
    setIsEditModalOpen(false);
    setSelectedDraft(null);
    showToast('Borrador actualizado con éxito.', 'success');
  };

  const handleClearDrafts = () => {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('xessia_draft_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    updateDraftsList();
    showToast('Todos los borradores temporales han sido eliminados de forma segura.', 'success');
  };

  const handleDownloadBackup = () => {
    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      appName: 'XESSIA',
      database: {
        patients,
        doctors,
        appointments,
        financials
      }
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'xessia_respaldo_seguridad.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    
    showToast('¡Respaldo de base de datos generado con éxito! El archivo JSON ha sido descargado.', 'success');
  };

  return (
    <div className="grid-2 fade-in" style={{ gap: '28px', alignItems: 'start' }}>
      
      {/* LEFT COLUMN: Security, Backups & OTA updates */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        
        {/* Respaldos y Seguridad */}
        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={22} style={{ color: 'var(--primary)' }} />
            Respaldos y Seguridad
          </h2>
          <p className="text-muted" style={{ fontSize: '13px', marginTop: '-10px' }}>
            XESSIA cifra y guarda copias locales en la memoria del dispositivo. Se recomienda descargar respaldos manuales periódicamente ante eventualidades.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
            <div>
              <h3>Descargar Copia de Seguridad Completa</h3>
              <p className="text-muted" style={{ fontSize: '12px', marginTop: '2px', marginBottom: '10px' }}>
                Exporta pacientes, citas activas, historiales clínicos, odontogramas y caja en formato estructurado JSON.
              </p>
              <button className="btn btn-primary" onClick={handleDownloadBackup}>
                <HardDrive size={16} /> Descargar Respaldo (.json)
              </button>
            </div>

            <div style={{ marginTop: '12px' }}>
              <h3>Restaurar Base de Datos</h3>
              <p className="text-muted" style={{ fontSize: '12px', marginTop: '2px', marginBottom: '10px' }}>
                Cargue un archivo de respaldo previo para sobrescribir y restaurar el estado completo de la clínica.
              </p>
              <button className="btn btn-secondary" onClick={() => showToast('Seleccione un archivo .json de respaldo válido en su disco...', 'info')}>
                <RefreshCw size={14} /> Importar y Restaurar
              </button>
            </div>
          </div>
        </div>

        {/* Actualizaciones en Vivo (OTA) y Borradores */}
        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wifi size={22} style={{ color: 'var(--primary)' }} />
            Actualizaciones y Borradores
          </h2>
          <p className="text-muted" style={{ fontSize: '13px', marginTop: '-10px' }}>
            Monitorea el estado de las actualizaciones Over-The-Air (OTA) y administra los borradores del sistema.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
            <div>
              <h3>Información del Sistema y Conectividad</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', marginTop: '8px', backgroundColor: 'var(--bg-app)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Conectividad de Red:</span>
                  <span className={`badge ${onlineStatus ? 'badge-confirmada' : 'badge-cancelada'}`} style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                    {onlineStatus ? 'CONECTADO A INTERNET' : 'TRABAJANDO SIN CONEXIÓN'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Origen de Carga:</span>
                  <strong style={{ color: 'var(--primary)' }}>Local (Native Offline Bundle)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Versión del Software:</span>
                  <strong>v1.0.1</strong>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '10px' }}>
              <h3>Gestión de Autoguardado (Borradores)</h3>
              <p className="text-muted" style={{ fontSize: '12px', marginTop: '2px', marginBottom: '8px' }}>
                Autoguardado en localStorage activo. Previene pérdida de textos ante cortes de luz o recargas accidentales.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: 'var(--bg-app)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <span>Borradores Activos en Memoria:</span>
                  <strong style={{ color: draftCount > 0 ? 'var(--primary)' : 'var(--text-light)' }}>{draftCount} borrador(es)</strong>
                </div>
                
                {draftCount > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                    {activeDrafts.map((draft) => {
                      let snippet = draft.value;
                      if (snippet.startsWith('{') && snippet.endsWith('}')) {
                        try {
                          const parsed = JSON.parse(draft.value);
                          snippet = Object.entries(parsed)
                            .filter(([_, v]) => typeof v !== 'object' && v)
                            .map(([k, v]) => `${getFieldLabel(k)}: ${v}`)
                            .join(', ');
                        } catch (e) {
                          // use original snippet
                        }
                      }
                      if (snippet.length > 80) {
                        snippet = snippet.substring(0, 80) + '...';
                      }

                      return (
                        <div 
                          key={draft.key} 
                          className="premium-card"
                          style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '8px', 
                            padding: '12px', 
                            borderRadius: 'var(--radius-md)', 
                            border: '1px solid var(--border-light)',
                            boxShadow: 'none',
                            backgroundColor: 'var(--bg-app)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{draft.displayName}</span>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', backgroundColor: 'var(--border-light)', padding: '2px 6px', borderRadius: '4px' }}>
                              {draft.key.replace('xessia_draft_', '')}
                            </span>
                          </div>
                          
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontStyle: 'italic', wordBreak: 'break-all' }}>
                            {snippet || 'Sin contenido'}
                          </div>
                          
                          <div style={{ display: 'flex', gap: '8px', marginTop: '4px', borderTop: '1px solid var(--border-light)', paddingTop: '8px' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 10px', fontSize: '11px', flex: 1, justifyContent: 'center', minHeight: 'auto', height: '28px' }}
                              onClick={() => handleOpenEditModal(draft)}
                            >
                              <Edit3 size={12} /> Editar
                            </button>
                            <button 
                              className="btn" 
                              style={{ 
                                padding: '4px 10px', 
                                fontSize: '11px', 
                                backgroundColor: 'var(--state-cancelada-bg)', 
                                color: 'var(--state-cancelada)', 
                                border: '1px solid #fca5a5',
                                flex: 1,
                                justifyContent: 'center',
                                minHeight: 'auto',
                                height: '28px'
                              }}
                              onClick={() => handleDeleteDraft(draft.key)}
                            >
                              🗑️ Eliminar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {draftCount > 0 && (
                <button 
                  className="btn" 
                  style={{ 
                    backgroundColor: 'var(--state-cancelada-bg)', 
                    color: 'var(--state-cancelada)', 
                    border: '1px solid #fca5a5',
                    fontSize: '12px',
                    padding: '8px 14px',
                    width: '100%',
                    marginTop: '8px',
                    display: 'flex',
                    justifyContent: 'center'
                  }} 
                  onClick={handleClearDrafts}
                >
                  Vaciar Todos los Borradores
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Settings Audit, Theme, and Excel Exporter */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

        {/* Exportación de Datos en Excel / CSV */}
        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet size={22} style={{ color: 'var(--primary)' }} />
            Exportación Total de Datos (Excel)
          </h2>
          <p className="text-muted" style={{ fontSize: '13px', marginTop: '-10px' }}>
            Descargue toda la información registrada en la clínica en archivos estructurados CSV listos para Microsoft Excel.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
            <button 
              className="btn btn-secondary" 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-start', width: '100%' }}
              onClick={() => {
                try {
                  const headers = ['Nombre Completo', 'Documento/CC', 'Celular', 'WhatsApp', 'Fecha Nacimiento', 'Edad', 'Sexo', 'EPS', 'Alergias', 'Observaciones', 'Deuda Pendiente (COP)'];
                  const rows = patients.map(p => {
                    const age = getAge(p.birthDate);
                    return [
                      `"${p.name.replace(/"/g, '""')}"`,
                      p.document,
                      p.phone,
                      p.whatsapp || '',
                      p.birthDate,
                      `${age} años`,
                      p.gender,
                      `"${p.eps.replace(/"/g, '""')}"`,
                      `"${p.allergies.replace(/"/g, '""')}"`,
                      `"${(p.observations || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
                      p.debt
                    ];
                  });
                  const csv = 'sep=;\n' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
                  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', `Xessia_Pacientes_${new Date().toISOString().substring(0, 10)}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  showToast('Pacientes exportados correctamente.', 'success');
                } catch (e: any) {
                  showToast('Error al exportar pacientes', 'error');
                }
              }}
            >
              <Download size={14} /> Exportar Planilla de Pacientes
            </button>

            <button 
              className="btn btn-secondary" 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-start', width: '100%' }}
              onClick={() => {
                try {
                  const headers = ['ID Cita', 'Paciente', 'Especialista', 'Procedimiento', 'Fecha', 'Hora', 'Duracion (min)', 'Precio Base', 'Descuento (%)', 'Precio Final', 'Abonado', 'Estado'];
                  const rows = appointments.map(appt => {
                    const pat = patients.find(p => p.id === appt.patientId);
                    const doc = doctors.find(d => d.id === appt.doctorId);
                    const proc = procedures.find(p => p.code === appt.procedureCode);
                    const price = proc ? proc.price : 0;
                    return [
                      appt.id,
                      `"${(pat ? pat.name : 'N/A').replace(/"/g, '""')}"`,
                      `"${(doc ? doc.name : 'N/A').replace(/"/g, '""')}"`,
                      appt.procedureCode,
                      appt.date,
                      appt.time,
                      appt.duration,
                      price,
                      appt.discount || 0,
                      Math.round(price * (1 - (appt.discount || 0) / 100)),
                      appt.paidAmount || 0,
                      appt.status
                    ];
                  });
                  const csv = 'sep=;\n' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
                  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', `Xessia_Historial_Citas_${new Date().toISOString().substring(0, 10)}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  showToast('Historial de citas exportado correctamente.', 'success');
                } catch (e: any) {
                  showToast('Error al exportar citas', 'error');
                }
              }}
            >
              <Download size={14} /> Exportar Historial de Citas
            </button>

            <button 
              className="btn btn-secondary" 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-start', width: '100%' }}
              onClick={() => {
                try {
                  const headers = ['ID Transaccion', 'Fecha', 'Concepto', 'Metodo', 'Tipo', 'Monto (COP)'];
                  const rows = financials.map(f => [
                    f.id,
                    f.date,
                    `"${(f.notes || '').replace(/"/g, '""')}"`,
                    f.method,
                    f.type,
                    f.amount
                  ]);
                  const csv = 'sep=;\n' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
                  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', `Xessia_Planilla_Caja_${new Date().toISOString().substring(0, 10)}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  showToast('Flujo de caja exportado correctamente.', 'success');
                } catch (e: any) {
                  showToast('Error al exportar caja', 'error');
                }
              }}
            >
              <Download size={14} /> Exportar Planilla de Caja (Flujo)
            </button>
          </div>
        </div>

        {/* Respaldos y Seguridad */}
        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={22} style={{ color: 'var(--state-confirmada)' }} />
            Bitácora de Auditoría
          </h2>
          <p className="text-muted" style={{ fontSize: '13px', marginTop: '-10px' }}>
            Registro histórico de acciones administrativas y de seguridad efectuadas en XESSIA hoy.
          </p>

          <div 
            style={{ 
              backgroundColor: 'var(--bg-app)', 
              padding: '16px', 
              borderRadius: 'var(--radius-lg)', 
              border: '1px solid var(--border-light)', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px',
              maxHeight: '300px',
              overflowY: 'auto'
            }}
          >
            <div style={{ fontSize: '11.5px', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-light)' }}>17:58:17</span> • Sesión administrativa iniciada por Jessica Montenegro.
            </div>
            <div style={{ fontSize: '11.5px', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-light)' }}>18:02:10</span> • Odontograma actualizado en paciente María Camila Restrepo (Caries en Diente 11).
            </div>
            <div style={{ fontSize: '11.5px', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-light)' }}>18:04:45</span> • Caja: Abono de $200,000 COP recibido de Juan Sebastián Montoya.
            </div>
            <div style={{ fontSize: '11.5px', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
              <span style={{ color: 'var(--text-light)' }}>18:05:01</span> • Cita rápida agendada para Samuel Alejandro Giraldo.
            </div>
            <div style={{ fontSize: '11.5px' }}>
              <span style={{ color: 'var(--text-light)' }}>Justo ahora</span> • Vista de configuración abierta por Jessica Montenegro.
            </div>
          </div>

          {/* Theme Settings Panel */}
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
            <h3>Apariencia y Parámetros Clínicos</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px', marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Canal de WhatsApp Remoto:</span>
                <strong style={{ color: 'var(--state-confirmada)' }}>En Línea</strong>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Modal para Editar Borrador */}
      {isEditModalOpen && selectedDraft && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="premium-card modal-content" style={{ width: '100%', maxWidth: '500px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
            <button 
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}
              onClick={() => { setIsEditModalOpen(false); setSelectedDraft(null); }}
            >
              <X size={20} />
            </button>
            
            <h3>Editar Borrador</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '-6px' }}>
              <span className="badge badge-pendiente" style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', border: 'none', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                {selectedDraft.displayName}
              </span>
            </div>
            <p className="text-muted" style={{ fontSize: '12px', marginTop: '-6px' }}>
              Modifique los campos temporales. Los cambios se aplicarán inmediatamente en el respectivo formulario.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '320px', overflowY: 'auto', paddingRight: '6px', margin: '4px 0' }}>
              {isJson ? (
                Object.keys(jsonFields).map((fieldKey) => (
                  <div key={fieldKey} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-dark)' }}>
                      {getFieldLabel(fieldKey)}
                    </label>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ padding: '8px 12px', fontSize: '13px' }}
                      value={jsonFields[fieldKey]} 
                      onChange={(e) => setJsonFields({ ...jsonFields, [fieldKey]: e.target.value })}
                    />
                  </div>
                ))
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-dark)' }}>
                    Texto Borrador de Evolución Clínica
                  </label>
                  <textarea 
                    className="form-input" 
                    rows={8}
                    style={{ padding: '10px 12px', fontSize: '13px', resize: 'vertical', lineHeight: '1.4' }}
                    value={editValue} 
                    onChange={(e) => setEditValue(e.target.value)}
                  />
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => { setIsEditModalOpen(false); setSelectedDraft(null); }}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={handleSaveDraft}
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
