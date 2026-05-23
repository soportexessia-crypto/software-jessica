import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Activity, Pill, Clipboard, HeartCrack, Download } from 'lucide-react';

export const HistorialClinico: React.FC = () => {
  const { patients, updatePatient, showToast } = useApp();
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');

  // Prescription generator state
  const [meds, setMeds] = useState('');
  const [indic, setIndic] = useState('');

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  const handleCreatePrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meds || !indic) {
      showToast('Por favor complete la receta médica.', 'warning');
      return;
    }

    const currentNotes = selectedPatient.observations ? `${selectedPatient.observations}\n\n` : '';
    const dateStr = new Date().toLocaleDateString('es-CO');
    const prescriptionText = `${currentNotes}[Receta Médica - ${dateStr}]: \n• Medicamento: ${meds}\n• Indicaciones: ${indic}`;
    
    updatePatient(selectedPatient.id, { observations: prescriptionText });
    setMeds('');
    setIndic('');
    showToast('Fórmula médica guardada en el historial y lista para imprimir.', 'success');
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.document.includes(searchQuery)
  );

  return (
    <div className="grid-12 fade-in" style={{ gap: '28px' }}>
      
      {/* LEFT COLUMN: Patient Directory Search */}
      <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="premium-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3>Buscar Paciente</h3>
          
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Buscar por nombre o documento..." 
              style={{ width: '100%', paddingLeft: '36px', height: '38px', borderRadius: 'var(--radius-md)' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-light)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '500px', overflowY: 'auto' }}>
            {filteredPatients.map(p => (
              <div 
                key={p.id}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: selectedPatientId === p.id ? 'var(--bg-hover)' : 'white',
                  border: '1px solid var(--border-light)',
                  borderLeft: selectedPatientId === p.id ? '4px solid var(--primary)' : '1px solid var(--border-light)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setSelectedPatientId(p.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '13.5px', color: selectedPatientId === p.id ? 'var(--secondary)' : 'var(--text-main)' }}>{p.name}</strong>
                  {p.allergies && p.allergies !== 'Ninguna' && p.allergies !== 'Ninguna conocida' && p.allergies.trim() !== '' && (
                    <span className="badge badge-cancelada" style={{ fontSize: '9px', padding: '2px 6px', fontWeight: 700, letterSpacing: '0.3px', textTransform: 'uppercase' }}>Alergias</span>
                  )}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>C.C. {p.document}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Clinical History Dossier */}
      {selectedPatient ? (
        <div className="premium-card" style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '550px' }}>
          
          {/* Dossier Header */}
          <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={22} style={{ color: 'var(--primary)' }} />
                Expediente Clínico: {selectedPatient.name}
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>
                Cédula de Ciudadanía: {selectedPatient.document} • EPS: {selectedPatient.eps}
              </div>
            </div>
            <button 
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 16px', height: '36px' }}
              onClick={() => {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                  // Beautifully styled clinical dossier HTML
                  const notesListHtml = selectedPatient.observations
                    .split('\n\n')
                    .map(item => {
                      const isRecipe = item.startsWith('[Receta');
                      const dateMatch = item.match(/-\s*(\d{1,2}\/\d{1,2}\/\d{4})/);
                      const date = dateMatch?.[1] || 'Reciente';
                      const cleanText = item
                        .replace(/\[Nota de Evolución -.*?\]: /, '')
                        .replace(/\[Receta Médica -.*?\]: /, '');
                      return `
                        <div class="note-box" style="border-left: 4px solid ${isRecipe ? '#e11d48' : '#3b82f6'};">
                           <div class="note-type">${isRecipe ? 'Fórmula Médica' : 'Evolución Clínica'}</div>
                           <div class="note-text">${cleanText}</div>
                           <div class="note-date">Fecha: ${date}</div>
                        </div>
                      `;
                    }).join('');

                  printWindow.document.write(`
                    <html>
                      <head>
                        <title>Historia Clinica - ${selectedPatient.name}</title>
                        <style>
                          body { font-family: Arial, sans-serif; color: #333; padding: 40px; line-height: 1.6; }
                          .header-box { border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 30px; }
                          .title { font-size: 26px; font-weight: bold; color: #3b82f6; }
                          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; font-size: 14px; background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
                          .note-box { background: #f8fafc; padding: 15px; margin-bottom: 15px; border-radius: 6px; border: 1px solid #e2e8f0; }
                          .note-type { font-weight: bold; font-size: 13px; color: #1e293b; text-transform: uppercase; margin-bottom: 5px; }
                          .note-text { font-size: 14px; white-space: pre-line; }
                          .note-date { font-size: 11px; color: #64748b; text-align: right; margin-top: 8px; }
                          .allergy-alert { background: #fee2e2; color: #991b1b; padding: 12px; border-radius: 6px; font-weight: bold; border: 1px solid #fecaca; margin-bottom: 20px; }
                          .btn-print { background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold; margin-bottom: 15px; }
                          @media print { .btn-print { display: none; } }
                        </style>
                      </head>
                      <body onload="window.print()">
                        <div class="header-box">
                          <span class="title">HISTORIA CLÍNICA ODONTOLÓGICA</span>
                          <div style="font-size: 12px; color: #64748b; margin-top: 5px;">CLÍNICA ODONTOLÓGICA XESSIA</div>
                        </div>
                        
                        ${selectedPatient.allergies && selectedPatient.allergies !== 'Ninguna' && selectedPatient.allergies !== 'Ninguna conocida' && selectedPatient.allergies.trim() !== '' ? `
                          <div class="allergy-alert">
                            ⚠️ ALERTA MÉDICA: EL PACIENTE PRESENTA ALERGIAS: ${selectedPatient.allergies}
                          </div>
                        ` : ''}

                        <div class="info-grid">
                          <div><strong>Paciente:</strong> ${selectedPatient.name}</div>
                          <div><strong>Documento:</strong> C.C. ${selectedPatient.document}</div>
                          <div><strong>Teléfono:</strong> ${selectedPatient.phone}</div>
                          <div><strong>EPS:</strong> ${selectedPatient.eps}</div>
                          <div><strong>Sexo:</strong> ${selectedPatient.gender}</div>
                          <div><strong>Fecha Nacimiento:</strong> ${selectedPatient.birthDate}</div>
                        </div>

                        <h3>Notas de Evolución y Recetas</h3>
                        ${notesListHtml || '<div class="text-muted">No hay registros clínicos aún.</div>'}

                        <div style="margin-top: 50px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px dashed #e2e8f0; padding-top: 15px;">
                          Documento de confidencialidad médica restringida. Generado automáticamente por XESSIA Gestión.
                        </div>
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                }
              }}
            >
              <Download size={14} /> Guardar PDF / Imprimir
            </button>
          </div>

          {/* Persistent medical warning if there are allergies */}
          {selectedPatient.allergies && selectedPatient.allergies !== 'Ninguna' && selectedPatient.allergies !== 'Ninguna conocida' && selectedPatient.allergies.trim() !== '' && (
            <div 
              style={{ 
                backgroundColor: 'var(--state-cancelada-bg)', 
                color: 'var(--state-cancelada)', 
                border: '1px solid #fee2e2', 
                borderRadius: 'var(--radius-md)', 
                padding: '12px 16px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                fontWeight: 700, 
                fontSize: '14px',
                marginTop: '4px',
                boxShadow: 'var(--shadow-sm)',
                animation: 'fadeIn 0.2s ease',
                width: '100%'
              }}
            >
              <HeartCrack size={18} style={{ flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', opacity: 0.8 }}>ALERTA MÉDICA CRÍTICA</span>
                <span>El paciente presenta alergias: {selectedPatient.allergies}</span>
              </div>
            </div>
          )}

          {/* Grid: Timeline and Recipe Form */}
          <div className="grid-2" style={{ gap: '24px' }}>
            
            {/* Clinical Evolution timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3>Evolución y Diagnósticos</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                
                {selectedPatient.observations.includes('[Nota') || selectedPatient.observations.includes('[Receta') ? (
                  selectedPatient.observations
                    .split('\n\n')
                    .filter(s => s.startsWith('[Nota') || s.startsWith('[Receta'))
                    .map((item, idx) => {
                      const isRecipe = item.startsWith('[Receta');
                      return (
                        <div 
                          key={idx} 
                          style={{ 
                            backgroundColor: 'var(--bg-app)', 
                            padding: '14px', 
                            borderRadius: 'var(--radius-md)', 
                            border: '1px solid var(--border-light)',
                            borderLeft: `4px solid ${isRecipe ? 'var(--accent)' : 'var(--primary)'}`,
                            fontSize: '13px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: isRecipe ? 'var(--accent)' : 'var(--secondary)', marginBottom: '6px' }}>
                            {isRecipe ? <Pill size={14}/> : <Clipboard size={14}/>}
                            {isRecipe ? 'Fórmula Médica' : 'Evolución Clínica'}
                          </div>
                          <div style={{ whiteSpace: 'pre-line' }}>{item.replace(/\[Nota de Evolución -.*?\]: /, '').replace(/\[Receta Médica -.*?\]: /, '')}</div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-light)', marginTop: '8px', textAlign: 'right' }}>
                            Registrado: {item.match(/-\s*(\d{1,2}\/\d{1,2}\/\d{4})/)?.[1] || 'Reciente'}
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-muted" style={{ padding: '32px', textAlign: 'center', fontSize: '13px' }}>
                    No hay registros de evolución clínica ni recetas para este paciente.
                  </div>
                )}

              </div>
            </div>

            {/* Doctor's Prescription form */}
            <div 
              style={{ 
                backgroundColor: 'var(--bg-app)', 
                padding: '20px', 
                borderRadius: 'var(--radius-lg)', 
                border: '1px solid var(--border-light)', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '14px' 
              }}
            >
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Pill size={18} style={{ color: 'var(--accent)' }} /> 
                Generar Fórmula / Receta
              </h3>
              
              <form onSubmit={handleCreatePrescription} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Medicamento e Indicación *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ej: Amoxicilina 500mg cápsulas"
                    required
                    value={meds}
                    onChange={(e) => setMeds(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Posología y Duración *</label>
                  <textarea 
                    className="form-textarea" 
                    rows={3} 
                    placeholder="Ej: Tomar 1 cápsula cada 8 horas por 7 días después de los alimentos."
                    required
                    value={indic}
                    onChange={(e) => setIndic(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn" style={{ backgroundColor: 'var(--accent)', color: 'white', width: '100%' }}>
                  Guardar y Registrar Fórmula
                </button>
              </form>

            </div>

          </div>

        </div>
      ) : (
        <div className="premium-card" style={{ gridColumn: 'span 8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Seleccione un paciente de la lista.
        </div>
      )}

    </div>
  );
};
