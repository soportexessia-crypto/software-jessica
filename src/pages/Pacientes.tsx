import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { Patient } from '../context/AppContext';
import { Odontograma } from '../components/Odontograma';
import { format12h } from '../components/QuickAppointmentModal';
import { 
  Search, 
  UserPlus, 
  Phone, 
  MessageSquare, 
  Mail, 
  HeartCrack, 
  FileText, 
  Image as ImageIcon,
  DollarSign, 
  Plus, 
  Trash2, 
  Edit3, 
  X
} from 'lucide-react';

export const Pacientes: React.FC = () => {
  const { 
    patients, 
    appointments, 
    procedures, 
    doctors,
    addPatient, 
    updatePatient, 
    deletePatient,
    addFinancialRecord,
    showToast
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'perfil' | 'historial' | 'odontograma' | 'caja' | 'archivos'>('perfil');

  // Form states for creating/editing patients
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  
  // Fields for patient form
  const [formName, setFormName] = useState('');
  const [formDoc, setFormDoc] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formBirth, setFormBirth] = useState('');
  const [formGender, setFormGender] = useState<'Femenino' | 'Masculino' | 'Otro'>('Femenino');
  const [formEmail, setFormEmail] = useState('');
  const [formEps, setFormEps] = useState('');
  const [formAllergies, setFormAllergies] = useState('');
  const [formObs, setFormObs] = useState('');

  // Evolution note adding state
  const [newNote, setNewNote] = useState('');

  // Payment popup state
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Nequi' | 'Daviplata'>('Efectivo');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  const [formCompanionPhone, setFormCompanionPhone] = useState('');
  const [formCompanionName, setFormCompanionName] = useState('');
  const [formWhatsapp, setFormWhatsapp] = useState('');
  const [useSameNumberForWhatsapp, setUseSameNumberForWhatsapp] = useState(true);

  // Auto-copy phone to whatsapp if the checkbox is checked
  useEffect(() => {
    if (useSameNumberForWhatsapp) {
      setFormWhatsapp(formPhone);
    }
  }, [formPhone, useSameNumberForWhatsapp]);

  // ========= ESTADOS DEL MODAL DE HISTORIAL CLÍNICO =========
  const [isClinicalModalOpen, setIsClinicalModalOpen] = useState(false);
  // Campos editables del historial
  const [clinicalAllergies, setClinicalAllergies] = useState('');
  const [clinicalInitialObs, setClinicalInitialObs] = useState('');
  // Notas de la línea de tiempo (array parseado)
  const [clinicalNotes, setClinicalNotes] = useState<Array<{ raw: string; text: string; date: string; type: 'nota' | 'receta'; editing: boolean; editText: string }>>([]);

  // ========= HELPERS DE PARSEO / SERIALIZACIÓN DE OBSERVACIONES =========
  /** Parsea el string de observations en notas estructuradas y el texto base */
  const parseObservations = (obs: string) => {
    const parts = obs.split('\n\n');
    const initialObs = parts.filter(p => !p.startsWith('[Nota') && !p.startsWith('[Receta')).join('\n\n');
    const notes = parts
      .filter(p => p.startsWith('[Nota') || p.startsWith('[Receta'))
      .map(raw => {
        const isReceta = raw.startsWith('[Receta');
        const dateMatch = raw.match(/-\s*(\d{1,2}\/\d{1,2}\/\d{4})/);
        const date = dateMatch?.[1] || '';
        const text = raw
          .replace(/\[Nota de Evolución - .*?\]: /, '')
          .replace(/\[Receta Médica - .*?\]: /, '')
          .trim();
        return { raw, text, date, type: (isReceta ? 'receta' : 'nota') as 'nota' | 'receta', editing: false, editText: text };
      });
    return { initialObs, notes };
  };

  /** Re-serializa notas + observaciones iniciales en el string de observations */
  const serializeObservations = (initialObs: string, notes: typeof clinicalNotes): string => {
    const initialPart = initialObs.trim();
    const notesParts = notes.map(n => n.raw);
    return [initialPart, ...notesParts].filter(Boolean).join('\n\n');
  };

  const handleOpenClinicalModal = () => {
    if (!selectedPatient) return;
    const { initialObs, notes } = parseObservations(selectedPatient.observations || '');
    setClinicalAllergies(selectedPatient.allergies || '');
    setClinicalInitialObs(initialObs);
    setClinicalNotes(notes);
    setIsClinicalModalOpen(true);
  };

  const handleSaveClinicalModal = async () => {
    if (!selectedPatient) return;
    // Reconstruir notas con textos editados
    const updatedNotes = clinicalNotes.map(n => {
      if (n.type === 'receta') {
        return { ...n, raw: `[Receta Médica - ${n.date}]: \n${n.editText}` };
      } else {
        return { ...n, raw: `[Nota de Evolución - ${n.date}]: ${n.editText}` };
      }
    });
    const newObservations = serializeObservations(clinicalInitialObs, updatedNotes);
    await updatePatient(selectedPatient.id, {
      allergies: clinicalAllergies,
      observations: newObservations
    });
    setIsClinicalModalOpen(false);
    showToast('Historial clínico actualizado correctamente.', 'success');
  };

  const handleDeleteClinicalNote = (idx: number) => {
    if (!window.confirm('¿Eliminar esta nota del historial clínico? Esta acción no se puede deshacer.')) return;
    setClinicalNotes(prev => prev.filter((_, i) => i !== idx));
    showToast('Nota eliminada. Guarda los cambios para confirmar.', 'info');
  };

  // Sincronización de borrador seguro de Pacientes a localStorage
  useEffect(() => {
    if (isModalOpen && modalMode === 'create') {
      const draft = {
        name: formName,
        document: formDoc,
        phone: formPhone,
        whatsapp: formWhatsapp,
        useSameNumberForWhatsapp,
        address: formAddress,
        birthDate: formBirth,
        gender: formGender,
        email: formEmail,
        eps: formEps,
        allergies: formAllergies,
        observations: formObs,
        companionPhone: formCompanionPhone,
        companionName: formCompanionName
      };
      localStorage.setItem('xessia_draft_patient', JSON.stringify(draft));
    }
  }, [isModalOpen, modalMode, formName, formDoc, formPhone, formWhatsapp, useSameNumberForWhatsapp, formAddress, formBirth, formGender, formEmail, formEps, formAllergies, formObs, formCompanionPhone, formCompanionName]);

  // Recuperar borrador de nota clínica para cada paciente específico
  useEffect(() => {
    if (selectedPatient?.id) {
      const saved = localStorage.getItem('xessia_draft_note_' + selectedPatient.id);
      setNewNote(saved || '');
    }
  }, [selectedPatient?.id]);

  // Guardar borrador de nota clínica
  useEffect(() => {
    if (selectedPatient?.id) {
      if (newNote) {
        localStorage.setItem('xessia_draft_note_' + selectedPatient.id, newNote);
      } else {
        localStorage.removeItem('xessia_draft_note_' + selectedPatient.id);
      }
    }
  }, [newNote, selectedPatient?.id]);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    const saved = localStorage.getItem('xessia_draft_patient');
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        setFormName(draft.name || '');
        setFormDoc(draft.document || '');
        setFormPhone(draft.phone || '');
        setFormWhatsapp(draft.whatsapp || '');
        setUseSameNumberForWhatsapp(draft.useSameNumberForWhatsapp !== undefined ? draft.useSameNumberForWhatsapp : true);
        setFormAddress(draft.address || '');
        setFormBirth(draft.birthDate || '');
        setFormGender(draft.gender || 'Femenino');
        setFormEmail(draft.email || '');
        setFormEps(draft.eps || 'Particular');
        setFormAllergies(draft.allergies || 'Ninguna');
        setFormObs(draft.observations || '');
        setFormCompanionPhone(draft.companionPhone || '');
        setFormCompanionName(draft.companionName || '');
        showToast('Borrador restaurado automáticamente.', 'info');
      } catch (e) {
        console.error('Error parsing draft patient', e);
      }
    } else {
      setFormName('');
      setFormDoc('');
      setFormPhone('');
      setFormWhatsapp('');
      setUseSameNumberForWhatsapp(true);
      setFormAddress('');
      setFormBirth('');
      setFormGender('Femenino');
      setFormEmail('');
      setFormEps('Particular');
      setFormAllergies('Ninguna');
      setFormObs('');
      setFormCompanionPhone('');
      setFormCompanionName('');
    }
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Patient) => {
    setModalMode('edit');
    setFormName(p.name);
    setFormDoc(p.document);
    setFormPhone(p.phone);
    setFormWhatsapp(p.whatsapp || '');
    setUseSameNumberForWhatsapp(p.phone === p.whatsapp || !p.whatsapp);
    setFormAddress(p.address);
    setFormBirth(p.birthDate);
    setFormGender(p.gender);
    setFormEmail(p.email);
    setFormEps(p.eps);
    setFormAllergies(p.allergies);
    setFormObs(p.observations);
    setFormCompanionPhone(p.companionPhone || '');
    setFormCompanionName(p.companionName || '');
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const whatsappVal = useSameNumberForWhatsapp ? formPhone : formWhatsapp;
      if (modalMode === 'create') {
        const newP = await addPatient({
          name: formName,
          document: formDoc,
          phone: formPhone,
          whatsapp: whatsappVal.replace(/[^0-9]/g, ''),
          address: formAddress,
          birthDate: formBirth,
          gender: formGender,
          email: formEmail,
          eps: formEps,
          allergies: formAllergies,
          observations: formObs,
          companionPhone: formCompanionPhone,
          companionName: formCompanionName
        });
        setSelectedPatientId(newP.id);
        localStorage.removeItem('xessia_draft_patient');
      } else {
        await updatePatient(selectedPatient.id, {
          name: formName,
          document: formDoc,
          phone: formPhone,
          whatsapp: whatsappVal.replace(/[^0-9]/g, ''),
          address: formAddress,
          birthDate: formBirth,
          gender: formGender,
          email: formEmail,
          eps: formEps,
          allergies: formAllergies,
          observations: formObs,
          companionPhone: formCompanionPhone,
          companionName: formCompanionName
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Está seguro de eliminar este paciente? Sus citas pendientes serán canceladas.')) {
      deletePatient(id);
      setSelectedPatientId(patients.find(p => p.id !== id)?.id || '');
    }
  };

  const handleAddEvolutionNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    
    const currentNotes = selectedPatient.observations ? `${selectedPatient.observations}\n\n` : '';
    const dateStr = new Date().toLocaleDateString('es-CO');
    const noteWithHeader = `${currentNotes}[Nota de Evolución - ${dateStr}]: ${newNote}`;
    
    updatePatient(selectedPatient.id, { observations: noteWithHeader });
    setNewNote('');
    localStorage.removeItem('xessia_draft_note_' + selectedPatient.id);
    showToast('Nota de evolución agregada al historial clínico.', 'success');
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) return;
    
    addFinancialRecord({
      patientId: selectedPatient.id,
      amount: paymentAmount,
      method: paymentMethod,
      type: 'Ingreso',
      notes: `Abono voluntario en caja para el paciente: ${selectedPatient.name}`
    });
    
    setIsPaymentModalOpen(false);
    setPaymentAmount(0);
    showToast('Abono registrado con éxito en la Caja.', 'success');
  };

  // Filter patients by query
  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.document.includes(searchQuery)
  );

  const patientAppointments = appointments.filter(a => a.patientId === selectedPatient?.id);

  return (
    <div className="grid-12 fade-in" style={{ gap: '28px' }}>
      
      {/* LEFT COLUMN: Search & Patient List */}
      <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="premium-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px' }}>Directorio</h3>
            <button 
              className="btn btn-primary" 
              style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px' }}
              onClick={handleOpenCreateModal}
            >
              <UserPlus size={14} /> Registrar
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Buscar por nombre o cédula..." 
              style={{ width: '100%', paddingLeft: '36px', height: '38px', borderRadius: 'var(--radius-md)' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-light)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '550px', overflowY: 'auto', paddingRight: '2px' }}>
            {filteredPatients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-light)', fontSize: '13px' }}>
                No se encontraron pacientes
              </div>
            ) : (
              filteredPatients.map(p => (
                <div 
                  key={p.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: selectedPatientId === p.id ? 'var(--bg-hover)' : 'white',
                    border: '1px solid var(--border-light)',
                    borderLeft: selectedPatientId === p.id ? '4px solid var(--primary)' : '1px solid var(--border-light)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => {
                    setSelectedPatientId(p.id);
                    setActiveTab('perfil');
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '13.5px', color: selectedPatientId === p.id ? 'var(--secondary)' : 'var(--text-main)' }}>{p.name}</strong>
                    {p.allergies && p.allergies !== 'Ninguna' && p.allergies !== 'Ninguna conocida' && p.allergies.trim() !== '' && (
                      <span className="badge badge-cancelada" style={{ fontSize: '9px', padding: '2px 6px', fontWeight: 700, letterSpacing: '0.3px', textTransform: 'uppercase' }}>Alergias</span>
                    )}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>C.C. {p.document}</span>
                    {p.debt > 0 && <span style={{ color: 'var(--state-cancelada)', fontWeight: 700 }}>Deuda: ${p.debt.toLocaleString('es-CO')}</span>}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>

      {/* RIGHT COLUMN: Patient Dossier */}
      {selectedPatient ? (
        <div className="premium-card" style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '600px' }}>
          
          {/* Dossier Header Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-light)', paddingBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div className="user-avatar" style={{ width: '56px', height: '56px', fontSize: '20px', borderRadius: 'var(--radius-md)', fontWeight: 800 }}>
                {selectedPatient.name.split(' ').map(n=>n[0]).slice(0,2).join('')}
              </div>
              <div>
                <h2 style={{ fontSize: '22px' }}>{selectedPatient.name}</h2>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '12px' }}>
                  <span>C.C: <strong>{selectedPatient.document}</strong></span>
                  <span>EPS: <strong>{selectedPatient.eps}</strong></span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '8px 12px', fontSize: '13px' }}
                onClick={() => {
                  if (activeTab === 'historial') {
                    handleOpenClinicalModal();
                  } else {
                    handleOpenEditModal(selectedPatient);
                  }
                }}
                title={activeTab === 'historial' ? 'Editar Historial Clínico' : 'Editar Datos del Paciente'}
              >
                <Edit3 size={14} /> {activeTab === 'historial' ? 'Editar Historial' : 'Editar'}
              </button>
              <button 
                className="btn btn-danger" 
                style={{ padding: '8px 12px', fontSize: '13px' }}
                onClick={() => handleDelete(selectedPatient.id)}
              >
                <Trash2 size={14} /> Eliminar
              </button>
            </div>
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
                marginTop: '16px',
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

          {/* Tab Selection */}
          <div className="calendar-view-selector" style={{ margin: 0, padding: '4px', alignSelf: 'flex-start' }}>
            <button className={`calendar-view-btn ${activeTab === 'perfil' ? 'active' : ''}`} onClick={() => setActiveTab('perfil')}>Datos</button>
            <button className={`calendar-view-btn ${activeTab === 'historial' ? 'active' : ''}`} onClick={() => setActiveTab('historial')}>Historial Clínico</button>
            <button className={`calendar-view-btn ${activeTab === 'odontograma' ? 'active' : ''}`} onClick={() => setActiveTab('odontograma')}>Odontograma</button>
            <button className={`calendar-view-btn ${activeTab === 'caja' ? 'active' : ''}`} onClick={() => setActiveTab('caja')}>Pagos / Caja</button>
            <button className={`calendar-view-btn ${activeTab === 'archivos' ? 'active' : ''}`} onClick={() => setActiveTab('archivos')}>RX y Archivos</button>
          </div>

          {/* TAB CONTENTS */}
          <div style={{ flex: 1 }}>

            {/* TAB: PERFIL (General data) */}
            {activeTab === 'perfil' && (
              <div className="grid-2 fade-in" style={{ gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>Información de Contacto</h3>
                  
                  <div style={{ fontSize: '13.5px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Phone size={14} className="text-muted"/> Tlf: <strong>{selectedPatient.phone}</strong></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MessageSquare size={14} style={{ color: '#25D366' }}/> WhatsApp:{' '}
                      <a 
                        href={`https://wa.me/${selectedPatient.whatsapp}`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ color: 'var(--secondary)', textDecoration: 'none', fontWeight: 700 }}
                      >
                        Enviar Mensaje
                      </a>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Mail size={14} className="text-muted"/> Email: <strong>{selectedPatient.email || 'No registrado'}</strong></div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}><FileText size={14} className="text-muted" style={{ marginTop: '3px' }}/> Dirección: <span>{selectedPatient.address || 'No registrado'}</span></div>
                    {selectedPatient.companionPhone && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '10px', backgroundColor: 'var(--bg-hover)', borderRadius: '8px', border: '1px solid var(--border-light)', marginTop: '4px' }}>
                        <span className="text-muted" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contacto Acompañante</span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '13px' }}>{selectedPatient.companionName || 'Familiar'}</strong>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>{selectedPatient.companionPhone}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>Perfil Médico</h3>
                  
                  <div style={{ fontSize: '13.5px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>Nacimiento: <strong>{selectedPatient.birthDate}</strong></div>
                    <div>Sexo: <strong>{selectedPatient.gender}</strong></div>
                    
                    {/* Allergy alert */}
                    <div 
                      style={{ 
                        padding: '10px 14px', 
                        borderRadius: '8px', 
                        backgroundColor: selectedPatient.allergies !== 'Ninguna' && selectedPatient.allergies !== 'Ninguna conocida' ? 'var(--state-cancelada-bg)' : 'var(--bg-app)',
                        color: selectedPatient.allergies !== 'Ninguna' && selectedPatient.allergies !== 'Ninguna conocida' ? 'var(--state-cancelada)' : 'var(--text-main)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 600
                      }}
                    >
                      <HeartCrack size={16} /> Alergias: {selectedPatient.allergies}
                    </div>

                    <div style={{ backgroundColor: 'var(--bg-app)', padding: '12px', borderRadius: '8px', fontSize: '12px' }}>
                      <strong>Notas internas:</strong> <br/>
                      <span className="text-muted">{selectedPatient.observations.split('[Nota')[0] || 'Sin observaciones iniciales.'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: HISTORIAL CLÍNICO */}
            {activeTab === 'historial' && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Evolution Notes Timeline */}
                <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
                  <h3>Línea de Evolución Clínica</h3>
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedPatient.observations.includes('[Nota') ? (
                      selectedPatient.observations
                        .split('\n\n')
                        .filter(s => s.startsWith('[Nota'))
                        .map((note, idx) => (
                          <div key={idx} style={{ backgroundColor: 'var(--bg-app)', padding: '12px', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--primary)', fontSize: '13px' }}>
                            {note}
                          </div>
                        ))
                    ) : (
                      <div className="text-muted" style={{ padding: '16px 0', textAlign: 'center', fontSize: '13px' }}>
                        No hay notas de evolución registradas aún. Use el formulario inferior para agregar.
                      </div>
                    )}
                  </div>
                </div>

                {/* Add Evolution Note Form */}
                <form onSubmit={handleAddEvolutionNote} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label className="form-label">Registrar Evolución / Diagnóstico</label>
                  <textarea 
                    className="form-textarea" 
                    rows={3} 
                    placeholder="Escriba aquí los detalles del tratamiento realizado hoy, medicamentos recetados y próximas indicaciones..."
                    required
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end', padding: '6px 16px', fontSize: '13px' }}>
                    <Plus size={14} /> Registrar Nota
                  </button>
                </form>

                {/* Past/Future appointments list */}
                <div>
                  <h3 style={{ marginBottom: '10px' }}>Historial de Citas</h3>
                  <div className="premium-table-container">
                    <table className="premium-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Hora</th>
                          <th>Doctor</th>
                          <th>Procedimiento</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patientAppointments.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }} className="text-muted">
                              No hay citas registradas en el historial.
                            </td>
                          </tr>
                        ) : (
                          patientAppointments
                            .sort((a,b) => b.date.localeCompare(a.date))
                            .map(appt => {
                              const doc = doctors.find(d => d.id === appt.doctorId);
                              const proc = procedures.find(p => p.code === appt.procedureCode);
                              return (
                                <tr key={appt.id}>
                                  <td>{appt.date}</td>
                                  <td>{format12h(appt.time)}</td>
                                  <td>{doc?.name}</td>
                                  <td>{proc?.name}</td>
                                  <td>
                                    <span className={`badge badge-${appt.status}`}>
                                      {appt.status.toUpperCase()}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* TAB: ODONTOGRAMA */}
            {activeTab === 'odontograma' && (
              <div className="fade-in">
                <Odontograma patientId={selectedPatient.id} />
              </div>
            )}

            {/* TAB: FINANCES / CAJA */}
            {activeTab === 'caja' && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    backgroundColor: selectedPatient.debt > 0 ? 'var(--state-cancelada-bg)' : 'var(--state-confirmada-bg)', 
                    color: selectedPatient.debt > 0 ? 'var(--state-cancelada)' : 'var(--state-confirmada)', 
                    padding: '16px', 
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${selectedPatient.debt > 0 ? '#fee2e2' : '#bbf7d0'}`
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>ESTADO DE CUENTA</div>
                    <h2 style={{ color: 'inherit', fontSize: '24px' }}>
                      {selectedPatient.debt > 0 
                        ? `Pendiente: $${selectedPatient.debt.toLocaleString('es-CO')}` 
                        : '¡Sin deudas activas!'
                      }
                    </h2>
                  </div>
                  {selectedPatient.debt > 0 && (
                    <button 
                      className="btn" 
                      style={{ backgroundColor: 'var(--state-cancelada)', color: 'white' }}
                      onClick={() => setIsPaymentModalOpen(true)}
                    >
                      <DollarSign size={16} /> Registrar Abono
                    </button>
                  )}
                </div>

                <div>
                  <h3>Desglose de Procedimientos y Pagos</h3>
                  <div className="premium-table-container" style={{ marginTop: '10px' }}>
                    <table className="premium-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Tratamiento</th>
                          <th>Valor</th>
                          <th>Abonado</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patientAppointments.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }} className="text-muted">No hay facturaciones vinculadas</td>
                          </tr>
                        ) : (
                          patientAppointments.map(appt => {
                            const proc = procedures.find(p => p.code === appt.procedureCode);
                            const price = proc ? proc.price : 0;
                            return (
                              <tr key={appt.id}>
                                <td>{appt.date}</td>
                                <td>{proc?.name}</td>
                                <td>${price.toLocaleString('es-CO')}</td>
                                <td>${appt.paidAmount.toLocaleString('es-CO')}</td>
                                <td>
                                  <span className={`badge badge-${appt.paymentStatus === 'pagado' ? 'confirmada' : (appt.paymentStatus === 'parcial' ? 'pendiente' : 'cancelada')}`}>
                                    {appt.paymentStatus.toUpperCase()}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ARCHIVOS Y RADIOGRAFÍAS */}
            {activeTab === 'archivos' && (
              <div className="fade-in grid-3" style={{ gap: '20px' }}>
                <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: 'white' }}>
                  <div style={{ backgroundColor: 'var(--bg-app)', height: '140px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: 'var(--text-light)' }}>
                    <ImageIcon size={48} />
                  </div>
                  <strong style={{ fontSize: '13px' }}>Radiografía Panorámica.png</strong>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Subido: 10/05/2026</span>
                  <a href="#download" onClick={(e) => { e.preventDefault(); showToast('Descargando archivo panorámica dental simulada...', 'info'); }} style={{ fontSize: '12px', color: 'var(--secondary)', textDecoration: 'none', fontWeight: 700 }}>Descargar</a>
                </div>

                <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: 'white' }}>
                  <div style={{ backgroundColor: 'var(--bg-app)', height: '140px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: 'var(--text-light)' }}>
                    <ImageIcon size={48} />
                  </div>
                  <strong style={{ fontSize: '13px' }}>Periapical Diente 14.png</strong>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Subido: 21/05/2026</span>
                  <a href="#download" onClick={(e) => { e.preventDefault(); showToast('Descargando archivo periapical...', 'info'); }} style={{ fontSize: '12px', color: 'var(--secondary)', textDecoration: 'none', fontWeight: 700 }}>Descargar</a>
                </div>

                <div style={{ border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: 'var(--bg-app)', cursor: 'pointer' }} onClick={() => showToast('Simulación: Seleccione un archivo PDF o imagen de Rayos X de su disco duro...', 'info')}>
                  <Plus size={32} className="text-light" />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center' }}>Subir Nueva Radiografía / PDF</span>
                </div>
              </div>
            )}

          </div>

        </div>
      ) : (
        <div className="premium-card" style={{ gridColumn: 'span 8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="text-muted">Seleccione o registre un paciente del menú izquierdo.</span>
        </div>
      )}

      {/* MODAL: REGISTRAR / EDITAR PACIENTE */}
      {/* ⚠️ SIN onClick en modal-overlay — solo se cierra con botones explícitos */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content fade-in" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>{modalMode === 'create' ? 'Registrar Paciente Nuevo' : 'Editar Ficha de Paciente'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmitForm}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                <div className="form-group">
                  <label className="form-label">Nombre Completo *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={formName} 
                    onChange={(e) => setFormName(e.target.value)} 
                    placeholder="Ej: María José Restrepo" 
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Cédula / Documento *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={formDoc} 
                      onChange={(e) => setFormDoc(e.target.value)} 
                      placeholder="Ej: 102048392" 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teléfono Celular *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={formPhone} 
                      onChange={(e) => setFormPhone(e.target.value)} 
                      placeholder="Ej: +57 312 849 5723" 
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Teléfono WhatsApp *</span>
                      <button 
                        type="button" 
                        className={`text-xs px-2 py-0.5 rounded transition ${useSameNumberForWhatsapp ? 'bg-primary-100 text-primary-700 font-medium' : 'bg-slate-100 text-slate-500'}`}
                        style={{ 
                          fontSize: '11px', 
                          border: 'none', 
                          cursor: 'pointer',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: useSameNumberForWhatsapp ? 'rgba(37, 211, 102, 0.1)' : '#f1f5f9',
                          color: useSameNumberForWhatsapp ? '#25D366' : '#64748b',
                          fontWeight: 'bold'
                        }}
                        onClick={() => setUseSameNumberForWhatsapp(!useSameNumberForWhatsapp)}
                      >
                        {useSameNumberForWhatsapp ? '✓ Mismo del celular' : 'Usar número de celular'}
                      </button>
                    </label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required
                      value={useSameNumberForWhatsapp ? formPhone : formWhatsapp} 
                      disabled={useSameNumberForWhatsapp}
                      onChange={(e) => setFormWhatsapp(e.target.value)} 
                      placeholder={useSameNumberForWhatsapp ? formPhone || 'Mismo número de celular' : 'Ej: +57 312 849 5723'} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email de Contacto</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      value={formEmail} 
                      onChange={(e) => setFormEmail(e.target.value)} 
                      placeholder="ejemplo@correo.com" 
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Celular del Acompañante o Familiar</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={formCompanionPhone} 
                      onChange={(e) => setFormCompanionPhone(e.target.value)} 
                      placeholder="Ej: 987654321" 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nombre del Acompañante o Familiar</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={formCompanionName} 
                      onChange={(e) => setFormCompanionName(e.target.value)} 
                      placeholder="Ej: Nombre del familiar" 
                    />
                  </div>
                </div>

                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Fecha Nacimiento *</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      required 
                      value={formBirth} 
                      onChange={(e) => setFormBirth(e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sexo *</label>
                    <select 
                      className="form-select" 
                      value={formGender} 
                      onChange={(e) => setFormGender(e.target.value as any)}
                    >
                      <option value="Femenino">Femenino</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">EPS / Seguro Clínico *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={formEps} 
                      onChange={(e) => setFormEps(e.target.value)} 
                      placeholder="Sura, Sanitas, Particular" 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Dirección Residencia</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formAddress} 
                    onChange={(e) => setFormAddress(e.target.value)} 
                    placeholder="Calle, Barrio, Ciudad" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Alergias / Advertencias Clínicas *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={formAllergies} 
                    onChange={(e) => setFormAllergies(e.target.value)} 
                    placeholder="Ej: Penicilina, Látex, o escribir 'Ninguna'" 
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Observaciones y Diagnóstico Inicial</label>
                  <textarea 
                    className="form-textarea" 
                    rows={2} 
                    value={formObs} 
                    onChange={(e) => setFormObs(e.target.value)} 
                    placeholder="Notas internas iniciales sobre el estado del paciente..." 
                  />
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Paciente</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ABONO RAPIDO EN DEUDA DE PACIENTE */}
      {/* ⚠️ SIN onClick en modal-overlay — solo se cierra con botones explícitos */}
      {isPaymentModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content fade-in" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Registrar Abono en Caja</h2>
              <button className="close-btn" onClick={() => setIsPaymentModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleRecordPayment}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ backgroundColor: 'var(--bg-hover)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Abonando a: <strong style={{ color: 'var(--text-main)' }}>{selectedPatient.name}</strong> <br/>
                  Deuda Máxima: <strong style={{ color: 'var(--text-main)' }}>${selectedPatient.debt.toLocaleString('es-CO')} COP</strong>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Monto del Pago *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    required 
                    max={selectedPatient.debt}
                    min={1}
                    value={paymentAmount || ''}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    placeholder="Ej: 100000"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Método de Pago *</label>
                  <select 
                    className="form-select"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta de Crédito/Débito</option>
                    <option value="Nequi">Nequi</option>
                    <option value="Daviplata">Daviplata</option>
                    <option value="Transferencia">Transferencia Bancaria</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsPaymentModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar Pago</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======== MODAL PREMIUM: EDITAR HISTORIAL CLÍNICO ======== */}
      {/* ⚠️ SIN onClick en modal-overlay — solo se cierra con botones explícitos */}
      {isClinicalModalOpen && selectedPatient && (
        <div className="modal-overlay">
          <div className="modal-content fade-in" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                ✏️ Editar Historial Clínico
                <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-muted)' }}>— {selectedPatient.name}</span>
              </h2>
              <button className="close-btn" onClick={() => setIsClinicalModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Alergias */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '13px' }}>
                  🚨 Alergias / Advertencias Médicas
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={clinicalAllergies}
                  onChange={e => setClinicalAllergies(e.target.value)}
                  placeholder="Ej: Penicilina, Látex, o 'Ninguna'"
                />
              </div>

              {/* Observaciones Iniciales */}
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '13px' }}>
                  📋 Observaciones Iniciales / Diagnóstico Base
                </label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={clinicalInitialObs}
                  onChange={e => setClinicalInitialObs(e.target.value)}
                  placeholder="Nota inicial del paciente o diagnóstico base..."
                />
              </div>

              {/* Línea de Evolución Clínica */}
              <div>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '13px', marginBottom: '10px', display: 'block' }}>
                  📊 Línea de Evolución Clínica ({clinicalNotes.length} registros)
                </label>
                {clinicalNotes.length === 0 ? (
                  <div className="text-muted" style={{ textAlign: 'center', padding: '20px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
                    No hay notas de evolución registradas.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto', paddingRight: '4px' }}>
                    {clinicalNotes.map((note, idx) => (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: 'var(--bg-app)',
                          padding: '12px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-light)',
                          borderLeft: `4px solid ${note.type === 'receta' ? 'var(--accent)' : 'var(--primary)'}`,
                          fontSize: '13px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '6px' }}>
                            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 700 }}>
                              {note.type === 'receta' ? '💊 FÓRMULA MÉDICA' : '📝 EVOLUCIÓN CLÍNICA'}{note.date && ` — ${note.date}`}
                            </div>
                            {note.editing ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <textarea
                                  className="form-textarea"
                                  rows={3}
                                  value={note.editText}
                                  onChange={e => setClinicalNotes(prev => prev.map((n, i) => i === idx ? { ...n, editText: e.target.value } : n))}
                                  style={{ fontSize: '12px' }}
                                />
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    type="button"
                                    className="btn btn-primary"
                                    style={{ fontSize: '11px', padding: '4px 10px' }}
                                    onClick={() => setClinicalNotes(prev => prev.map((n, i) => i === idx ? { ...n, editing: false } : n))}
                                  >
                                    ✓ Guardar
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{ fontSize: '11px', padding: '4px 10px' }}
                                    onClick={() => setClinicalNotes(prev => prev.map((n, i) => i === idx ? { ...n, editing: false, editText: n.text } : n))}
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ whiteSpace: 'pre-line', color: 'var(--text-main)' }}>{note.editText || note.text}</div>
                            )}
                          </div>
                          {!note.editing && (
                            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '11px', minWidth: 'auto' }}
                                title="Editar nota"
                                onClick={() => setClinicalNotes(prev => prev.map((n, i) => i === idx ? { ...n, editing: true } : n))}
                              >
                                <Edit3 size={12} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger"
                                style={{ padding: '4px 8px', fontSize: '11px', minWidth: 'auto' }}
                                title="Eliminar nota"
                                onClick={() => handleDeleteClinicalNote(idx)}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsClinicalModalOpen(false)}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSaveClinicalModal}>
                💾 Guardar Historial
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
