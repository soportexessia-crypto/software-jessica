import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface QuickAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ==================== HELPERS DE TIEMPO 12 HORAS ====================

/** Convierte HH:MM (24h) a '9:30 AM' (12h display) */
export function format12h(time24: string): string {
  if (!time24 || !time24.includes(':')) return time24;
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

/** Convierte selección 12h a HH:MM (24h) para MongoDB */
export function parse24h(hour12: string, minute: string, period: string): string {
  let h = parseInt(hour12, 10);
  if (isNaN(h)) h = 12;
  if (h < 1) h = 1;
  if (h > 12) h = 12;

  let m = parseInt(minute, 10);
  if (isNaN(m)) m = 0;
  if (m < 0) m = 0;
  if (m > 59) m = 59;

  if (period === 'AM') {
    if (h === 12) h = 0;
  } else {
    if (h !== 12) h += 12;
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Extrae hora12, minuto y período desde HH:MM */
function splitTime12(time24: string): { hour12: string; minute: string; period: string } {
  if (!time24 || !time24.includes(':')) return { hour12: '9', minute: '00', period: 'AM' };
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return { hour12: String(h12), minute: mStr.padStart(2, '0'), period };
}

// ==================== COMPONENTE SELECTOR DE HORA 12H ====================

interface TimeSelector12hProps {
  value: string; // HH:MM format (24h)
  onChange: (time24: string) => void;
  required?: boolean;
}

export const TimeSelector12h: React.FC<TimeSelector12hProps> = ({ value, onChange, required }) => {
  const { hour12: initialHour, minute: initialMinute, period: initialPeriod } = splitTime12(value);

  const [localHour, setLocalHour] = useState(initialHour);
  const [localMinute, setLocalMinute] = useState(initialMinute);
  const [localPeriod, setLocalPeriod] = useState(initialPeriod);

  // Synchronize local state with value updates from parent
  useEffect(() => {
    const { hour12, minute, period } = splitTime12(value);
    setLocalHour(hour12);
    setLocalMinute(minute);
    setLocalPeriod(period);
  }, [value]);

  const handleHourChange = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    setLocalHour(clean);
    
    const h = clean === '' ? '12' : clean;
    onChange(parse24h(h, localMinute === '' ? '00' : localMinute, localPeriod));
  };

  const handleMinuteChange = (val: string) => {
    const clean = val.replace(/[^0-9]/g, '');
    setLocalMinute(clean);
    
    const m = clean === '' ? '00' : clean;
    onChange(parse24h(localHour === '' ? '12' : localHour, m, localPeriod));
  };

  const handlePeriodChange = (p: string) => {
    setLocalPeriod(p);
    onChange(parse24h(localHour === '' ? '12' : localHour, localMinute === '' ? '00' : localMinute, p));
  };

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: '6px' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className="form-input"
          required={required}
          value={localHour}
          list="hours-list"
          placeholder="Hora"
          onChange={e => handleHourChange(e.target.value)}
          onBlur={() => {
            let h = parseInt(localHour, 10);
            if (isNaN(h) || h < 1) h = 12;
            if (h > 12) h = 12;
            handleHourChange(String(h));
          }}
          style={{ textAlign: 'center', fontWeight: 700, width: '100%', margin: 0, paddingRight: '8px' }}
        />
        <datalist id="hours-list">
          {hours.map(h => <option key={h} value={h} />)}
        </datalist>
      </div>

      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className="form-input"
          required={required}
          value={localMinute}
          list="minutes-list"
          placeholder="Min"
          onChange={e => handleMinuteChange(e.target.value)}
          onBlur={() => {
            let m = parseInt(localMinute, 10);
            if (isNaN(m) || m < 0) m = 0;
            if (m > 59) m = 59;
            handleMinuteChange(String(m).padStart(2, '0'));
          }}
          style={{ textAlign: 'center', fontWeight: 700, width: '100%', margin: 0, paddingRight: '8px' }}
        />
        <datalist id="minutes-list">
          {minutes.map(m => <option key={m} value={m} />)}
        </datalist>
      </div>

      <select
        className="form-select"
        value={localPeriod}
        onChange={e => handlePeriodChange(e.target.value)}
        style={{
          textAlign: 'center',
          fontWeight: 800,
          color: localPeriod === 'AM' ? 'var(--primary)' : 'var(--secondary)',
          margin: 0
        }}
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================

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



  const [patientMode, setPatientMode] = useState<'existente' | 'nuevo'>('existente');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientDoc, setNewPatientDoc] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [hasDifferentWhatsApp, setHasDifferentWhatsApp] = useState(false);
  const [newPatientWhatsApp, setNewPatientWhatsApp] = useState('');

  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedProcedureCode, setSelectedProcedureCode] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState(0);
  const [customPrice, setCustomPrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Nequi' | 'Daviplata' | 'Bancolombia'>('Efectivo');

  // Alerts states
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [doctorMismatch, setDoctorMismatch] = useState(false);
  const [success, setSuccess] = useState(false);

  // Reset fields & restore draft
  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('xessia_draft_quick_appt');
      if (saved) {
        try {
          const draft = JSON.parse(saved);
          setPatientMode(draft.patientMode || 'existente');
          setSelectedPatientId(draft.selectedPatientId || '');
          setNewPatientName(draft.newPatientName || '');
          setNewPatientDoc(draft.newPatientDoc || '');
          setNewPatientPhone(draft.newPatientPhone || '');
          setHasDifferentWhatsApp(draft.hasDifferentWhatsApp || false);
          setNewPatientWhatsApp(draft.newPatientWhatsApp || '');
          setSelectedDoctorId(draft.selectedDoctorId || doctors[0]?.id || '');
          setSelectedProcedureCode(draft.selectedProcedureCode || procedures[0]?.code || '');
          setDate(draft.date || '');
          setTime(draft.time || '09:00');
          setNotes(draft.notes || '');
          setDiscount(draft.discount || 0);
          setCustomPrice(draft.customPrice || 0);
          setPaidAmount(draft.paidAmount || 0);
          setPaymentMethod(draft.paymentMethod || 'Efectivo');
          setAlertMsg(null);
          setDoctorMismatch(false);
          setSuccess(false);
          return;
        } catch (e) {
          console.error('Error parsing draft quick appt', e);
        }
      }

      setSelectedPatientId('');
      setNewPatientName('');
      setNewPatientDoc('');
      setNewPatientPhone('');
      setHasDifferentWhatsApp(false);
      setNewPatientWhatsApp('');
      setSelectedDoctorId(doctors[0]?.id || '');
      setSelectedProcedureCode(procedures[0]?.code || '');
      setDiscount(0);
      setCustomPrice(0);
      setPaidAmount(0);
      setPaymentMethod('Efectivo');
      
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

  // Sync draft to localStorage
  useEffect(() => {
    if (isOpen && !success) {
      const draft = {
        patientMode,
        selectedPatientId,
        newPatientName,
        newPatientDoc,
        newPatientPhone,
        hasDifferentWhatsApp,
        newPatientWhatsApp,
        selectedDoctorId,
        selectedProcedureCode,
        date,
        time,
        notes,
        discount,
        customPrice,
        paidAmount,
        paymentMethod
      };
      localStorage.setItem('xessia_draft_quick_appt', JSON.stringify(draft));
    }
  }, [isOpen, success, patientMode, selectedPatientId, newPatientName, newPatientDoc, newPatientPhone, hasDifferentWhatsApp, newPatientWhatsApp, selectedDoctorId, selectedProcedureCode, date, time, notes, discount, customPrice, paidAmount, paymentMethod]);

  // Double sync pricing handlers
  const handleCustomPriceChange = (val: number) => {
    setCustomPrice(val);
    if (price > 0) {
      if (val === price) {
        setDiscount(0);
      } else {
        const pct = Math.round((1 - val / price) * 100);
        setDiscount(pct < 0 ? 0 : pct > 100 ? 100 : pct);
      }
    }
  };

  const handleDiscountChange = (val: number) => {
    setDiscount(val);
    if (price > 0) {
      const calculated = Math.round(price * (1 - val / 100));
      setCustomPrice(calculated);
    }
  };

  // Handle auto calculations and alerts based on chosen Procedure
  useEffect(() => {
    if (!selectedProcedureCode) return;
    const procedure = procedures.find(p => p.code === selectedProcedureCode);
    if (procedure) {
      setDuration(procedure.duration);
      setPrice(procedure.price);
      setCustomPrice(procedure.price);
      setDiscount(0);
      
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let patientId = selectedPatientId;

    try {
      if (patientMode === 'nuevo') {
        if (!newPatientName || !newPatientDoc || !newPatientPhone) {
          showToast('Por favor complete todos los datos del nuevo paciente.', 'warning');
          return;
        }
        
        const finalWhatsApp = hasDifferentWhatsApp && newPatientWhatsApp 
          ? newPatientWhatsApp.replace(/[^0-9]/g, '').slice(0, 10)
          : newPatientPhone.replace(/[^0-9]/g, '').slice(0, 10);

        const newPat = await addPatient({
          name: newPatientName,
          document: newPatientDoc,
          phone: newPatientPhone.replace(/[^0-9]/g, '').slice(0, 10),
          whatsapp: finalWhatsApp,
          address: '',
          birthDate: '1990-01-01',
          gender: 'Femenino', // default to Femenino
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

      await addAppointment({
        patientId,
        doctorId: selectedDoctorId,
        procedureCode: selectedProcedureCode,
        date,
        time, // Siempre HH:MM (24h) para MongoDB
        duration,
        status: 'confirmada',
        discount,
        notes,
        paidAmount,
        paymentMethod
      });

      localStorage.removeItem('xessia_draft_quick_appt');
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error al procesar la cita rápida', 'error');
    }
  };

  return (
    // ⚠️ SIN onClick en el modal-overlay — el modal SOLO se cierra con botones explícitos
    <div className="modal-overlay">
      <div className="modal-content fade-in" style={{ maxWidth: '550px' }}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Cita Rápida
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Teléfono Celular" 
                        required 
                        value={newPatientPhone}
                        onChange={(e) => setNewPatientPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                        style={{ flex: 1 }}
                      />
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={() => setHasDifferentWhatsApp(!hasDifferentWhatsApp)}
                        style={{ fontSize: '11px', padding: '0 10px', height: '36px', whiteSpace: 'nowrap' }}
                      >
                        {hasDifferentWhatsApp ? '- WhatsApp único' : '+ WhatsApp diferente'}
                      </button>
                    </div>
                    
                    {hasDifferentWhatsApp && (
                      <input 
                        type="text" 
                        className="form-input animate-fade-in" 
                        placeholder="WhatsApp (Diferente)" 
                        required 
                        value={newPatientWhatsApp}
                        onChange={(e) => setNewPatientWhatsApp(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                      />
                    )}
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

              {/* Double pricing/discount section */}
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Precio Final del Servicio ($)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    min={0}
                    value={customPrice || ''}
                    onChange={(e) => handleCustomPriceChange(Number(e.target.value))}
                    placeholder="Ej: 50000"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Descuento (%)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input 
                      type="number" 
                      className="form-input" 
                      min={0}
                      max={100}
                      value={discount || ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : Number(e.target.value);
                        handleDiscountChange(val < 0 ? 0 : val > 100 ? 100 : val);
                      }}
                      placeholder="0"
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-muted)' }}>%</span>
                  </div>
                </div>
              </div>

              {/* Abono Inicial & Método de Pago */}
              <div className="grid-2" style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ color: 'var(--primary)' }}>Abono Inicial ($)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    min={0}
                    max={customPrice}
                    value={paidAmount || ''}
                    onChange={(e) => setPaidAmount(Math.min(customPrice, Number(e.target.value)))}
                    placeholder="0"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Método de Pago</label>
                  <select 
                    className="form-select"
                    value={paymentMethod}
                    onChange={(e: any) => setPaymentMethod(e.target.value)}
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta de Crédito/Débito</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Nequi">Nequi</option>
                    <option value="Daviplata">Daviplata</option>
                    <option value="Bancolombia">Bancolombia</option>
                  </select>
                </div>
              </div>

              {/* Auto Calculations Card */}
              <div 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: '6px',
                  backgroundColor: 'var(--bg-hover)', 
                  padding: '12px 16px', 
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  fontSize: '13px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <span className="text-muted">Duración:</span>{' '}
                    <strong style={{ color: 'var(--secondary)' }}>{duration} minutos</strong>
                  </div>
                  <div>
                    <span className="text-muted">Precio Base:</span>{' '}
                    <span style={{ textDecoration: discount > 0 ? 'line-through' : 'none', color: discount > 0 ? 'var(--text-muted)' : 'var(--secondary)', fontWeight: discount > 0 ? 400 : 700 }}>
                      ${price.toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>
                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border-light)', paddingTop: '6px', marginTop: '4px' }}>
                    <div style={{ color: 'var(--state-confirmada)', fontWeight: 600 }}>
                      Descuento aplicado: {discount}%
                    </div>
                    <div>
                      <strong style={{ color: 'var(--secondary)' }}>
                        ${customPrice.toLocaleString('es-CO')} COP
                      </strong>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '6px', marginTop: '4px', fontWeight: 600 }}>
                  <span style={{ color: 'var(--text-main)' }}>Saldo Restante (Deuda):</span>
                  <span style={{ color: (customPrice - paidAmount) > 0 ? 'var(--state-cancelada)' : 'var(--state-confirmada)' }}>
                    ${(customPrice - paidAmount).toLocaleString('es-CO')} COP
                  </span>
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

              {/* Date & Time con selector 12h */}
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
                  <TimeSelector12h
                    value={time}
                    onChange={setTime}
                    required
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
