import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface QuickAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickAppointmentModal: React.FC<QuickAppointmentModalProps> = ({ isOpen, onClose }) => {
  const { 
    patients, 
    doctors, 
    procedures, 
    addAppointment,
    addPatient,
    getPatientById,
    showToast
  } = useApp();

  // Form states
  const [patientMode, setPatientMode] = useState<'existente' | 'nuevo'>('existente');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientDoc, setNewPatientDoc] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedProcedureCode, setSelectedProcedureCode] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState(0);

  // Alerts states
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [doctorMismatch, setDoctorMismatch] = useState(false);
  const [success, setSuccess] = useState(false);

  // Reset fields
  useEffect(() => {
    if (isOpen) {
      setSelectedPatientId('');
      setNewPatientName('');
      setNewPatientDoc('');
      setNewPatientPhone('');
      setSelectedDoctorId(doctors[0]?.id || '');
      setSelectedProcedureCode(procedures[0]?.code || '');
      
      // Default to today's date
      const today = new Date();
      const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      setDate(formattedDate);
      setTime('09:00');
      setNotes('');
      setAlertMsg(null);
      setDoctorMismatch(false);
      setSuccess(false);
    }
  }, [isOpen, doctors, procedures]);

  // Handle auto calculations and alerts based on chosen Procedure
  useEffect(() => {
    if (!selectedProcedureCode) return;
    const procedure = procedures.find(p => p.code === selectedProcedureCode);
    if (procedure) {
      setDuration(procedure.duration);
      setPrice(procedure.price);
      
      // Smart Procedural Alert
      if (procedure.alert) {
        setAlertMsg(procedure.alert);
      } else {
        setAlertMsg(null);
      }

      // Check Doctor match
      if (procedure.specialist !== 'Todos' && selectedDoctorId && procedure.specialist !== selectedDoctorId) {
        setDoctorMismatch(true);
      } else {
        setDoctorMismatch(false);
      }
    }
  }, [selectedProcedureCode, selectedDoctorId, procedures]);

  // Check debt for existing patient
  useEffect(() => {
    if (patientMode === 'existente' && selectedPatientId) {
      const p = getPatientById(selectedPatientId);
      if (p && p.debt > 0) {
        setAlertMsg(prev => {
          const debtWarning = `El paciente tiene un saldo pendiente de $${p.debt.toLocaleString('es-CO')}.`;
          return prev ? `${debtWarning}\n${prev}` : debtWarning;
        });
      }
    }
  }, [selectedPatientId, patientMode, getPatientById]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let patientId = selectedPatientId;

    if (patientMode === 'nuevo') {
      if (!newPatientName || !newPatientDoc || !newPatientPhone) {
        showToast('Por favor complete todos los datos del nuevo paciente.', 'warning');
        return;
      }
      
      const newPat = addPatient({
        name: newPatientName,
        document: newPatientDoc,
        phone: newPatientPhone,
        whatsapp: newPatientPhone.replace(/[^0-9]/g, ''),
        address: '',
        birthDate: '1990-01-01',
        gender: 'Otro',
        email: '',
        eps: 'Particular',
        allergies: 'Ninguna',
        observations: 'Paciente registrado vía Cita Rápida'
      });
      patientId = newPat.id;
    }

    if (!patientId || !selectedDoctorId || !selectedProcedureCode || !date || !time) {
      showToast('Por favor complete todos los campos.', 'warning');
      return;
    }

    addAppointment({
      patientId,
      doctorId: selectedDoctorId,
      procedureCode: selectedProcedureCode,
      date,
      time,
      duration,
      status: 'confirmada',
      notes
    });

    setSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content fade-in" style={{ maxWidth: '550px' }}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Cita Rápida (15 Segundos)
          </h2>
          <button className="close-btn" onClick={onClose} disabled={success}>
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="modal-body" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ color: 'var(--state-confirmada)', display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <CheckCircle size={64} className="pulse-dot" style={{ animation: 'none' }} />
            </div>
            <h3>¡Cita Creada Exitosamente!</h3>
            <p className="text-muted" style={{ marginTop: '8px' }}>El horario ha sido bloqueado en la agenda.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Patient Selection Mode */}
              <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-light)', paddingBottom: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>
                  <input 
                    type="radio" 
                    name="patMode" 
                    checked={patientMode === 'existente'} 
                    onChange={() => setPatientMode('existente')} 
                  />
                  Paciente Existente
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>
                  <input 
                    type="radio" 
                    name="patMode" 
                    checked={patientMode === 'nuevo'} 
                    onChange={() => setPatientMode('nuevo')} 
                  />
                  Registrar y Agendar
                </label>
              </div>

              {patientMode === 'existente' ? (
                <div className="form-group">
                  <label className="form-label">Buscar Paciente *</label>
                  <select 
                    className="form-select" 
                    required 
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                  >
                    <option value="">-- Seleccionar Paciente --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (C.C. {p.document})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: 'var(--bg-hover)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--secondary)' }}>DATOS DEL NUEVO PACIENTE</div>
                  <div className="grid-2" style={{ gap: '10px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Nombre completo" 
                        required 
                        value={newPatientName}
                        onChange={(e) => setNewPatientName(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Cédula/Documento" 
                        required 
                        value={newPatientDoc}
                        onChange={(e) => setNewPatientDoc(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Teléfono Celular / WhatsApp" 
                      required 
                      value={newPatientPhone}
                      onChange={(e) => setNewPatientPhone(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Doctor Selection */}
              <div className="form-group">
                <label className="form-label">Doctor / Especialista *</label>
                <select 
                  className="form-select" 
                  required 
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                >
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.specialty})
                    </option>
                  ))}
                </select>
              </div>

              {/* Procedure Selection */}
              <div className="form-group">
                <label className="form-label">Procedimiento / Tratamiento *</label>
                <select 
                  className="form-select" 
                  required 
                  value={selectedProcedureCode}
                  onChange={(e) => setSelectedProcedureCode(e.target.value)}
                >
                  <option value="" disabled>-- Seleccionar Procedimiento --</option>
                  {procedures.map(pr => (
                    <option key={pr.code} value={pr.code}>
                      {pr.name} (${pr.price.toLocaleString('es-CO')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Auto Calculations Card */}
              <div 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  backgroundColor: 'var(--bg-hover)', 
                  padding: '12px 16px', 
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  fontSize: '13px'
                }}
              >
                <div>
                  <span className="text-muted">Duración:</span>{' '}
                  <strong style={{ color: 'var(--secondary)' }}>{duration} minutos</strong>
                </div>
                <div>
                  <span className="text-muted">Valor base:</span>{' '}
                  <strong style={{ color: 'var(--secondary)' }}>${price.toLocaleString('es-CO')} COP</strong>
                </div>
              </div>

              {/* Dynamic Intelligent Alerts */}
              {doctorMismatch && (
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '10px', 
                    backgroundColor: 'var(--state-pendiente-bg)', 
                    color: 'var(--state-pendiente)', 
                    padding: '10px 14px', 
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #fef3c7',
                    fontSize: '12.5px',
                    fontWeight: 500
                  }}
                >
                  <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Alerta de Especialidad:</strong> El doctor seleccionado no suele realizar este tratamiento. 
                    El especialista autorizado es: <strong>{doctors.find(d => d.id === procedures.find(p => p.code === selectedProcedureCode)?.specialist)?.name}</strong>.
                  </div>
                </div>
              )}

              {alertMsg && (
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '10px', 
                    backgroundColor: 'var(--state-cancelada-bg)', 
                    color: 'var(--state-cancelada)', 
                    padding: '10px 14px', 
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #fee2e2',
                    fontSize: '12.5px',
                    whiteSpace: 'pre-line',
                    fontWeight: 500
                  }}
                >
                  <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    {alertMsg}
                  </div>
                </div>
              )}

              {/* Date & Time */}
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Fecha *</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    required 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Hora *</label>
                  <input 
                    type="time" 
                    className="form-input" 
                    required 
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Observaciones / Notas</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Ej: Paciente prefiere consultorio con ventana"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onClose}
                disabled={success}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={success}
              >
                Agendar Cita
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
