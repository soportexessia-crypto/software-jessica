import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { Appointment } from '../context/AppContext';
import { format12h, TimeSelector12h } from '../components/QuickAppointmentModal';
import { 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  AlertTriangle,
  X,
  Clock,
  Calendar
} from 'lucide-react';

export const Agenda: React.FC = () => {
  const { 
    appointments, 
    patients, 
    doctors, 
    procedures, 
    updateAppointment,
    getPatientById,
    getProcedureByCode 
  } = useApp();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'mes' | 'semana' | 'dia'>('mes');
  const [filterDoctorId, setFilterDoctorId] = useState<string>('todos');
  
  // Selected appointment details modal
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [selectedDayAppts, setSelectedDayAppts] = useState<{ date: string; appts: Appointment[] } | null>(null);
  
  // Appointment edit states
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editDoctorId, setEditDoctorId] = useState('');
  const [editStatus, setEditStatus] = useState<Appointment['status']>('pendiente');
  const [editNotes, setEditNotes] = useState('');
  const [editDiscount, setEditDiscount] = useState(0);

  // Handle setting modal edit fields
  useEffect(() => {
    if (selectedAppt) {
      setEditDate(selectedAppt.date);
      setEditTime(selectedAppt.time);
      setEditDoctorId(selectedAppt.doctorId);
      setEditStatus(selectedAppt.status);
      setEditNotes(selectedAppt.notes || '');
      setEditDiscount(selectedAppt.discount || 0);
    }
  }, [selectedAppt]);

  // Calendar calculations (Month view)
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month); // 0 = Sunday, 1 = Monday, etc.

  // Shift first day to adjust for Lunes start
  const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const prevMonthDays = getDaysInMonth(year, month - 1);

  // Month navigation
  const prevPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'mes') {
      newDate.setMonth(month - 1);
    } else if (viewMode === 'semana') {
      newDate.setDate(currentDate.getDate() - 7);
    } else {
      newDate.setDate(currentDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const nextPeriod = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'mes') {
      newDate.setMonth(month + 1);
    } else if (viewMode === 'semana') {
      newDate.setDate(currentDate.getDate() + 7);
    } else {
      newDate.setDate(currentDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Helper: Format YYYY-MM-DD
  const formatDateString = (yearNum: number, monthNum: number, dayNum: number) => {
    return `${yearNum}-${String(monthNum + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
  };

  // Build grid items for Month View
  const calendarCells = [];
  
  // Previous month fill
  for (let i = adjustedFirstDayIndex - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const dateStr = formatDateString(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1, d);
    calendarCells.push({ day: d, outside: true, dateString: dateStr });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatDateString(year, month, d);
    calendarCells.push({ day: d, outside: false, dateString: dateStr });
  }

  // Next month fill to make 42 cells total (6 rows)
  const remaining = 42 - calendarCells.length;
  for (let d = 1; d <= remaining; d++) {
    const dateStr = formatDateString(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1, d);
    calendarCells.push({ day: d, outside: true, dateString: dateStr });
  }

  // Handle saving edits
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAppt) {
      updateAppointment(selectedAppt.id, {
        date: editDate,
        time: editTime,
        doctorId: editDoctorId,
        status: editStatus,
        notes: editNotes,
        discount: editDiscount
      });
      setSelectedAppt(null);
    }
  };

  const isToday = (dateString: string) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return dateString === todayStr;
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Filters and Nav Bar */}
      <div className="calendar-header-card">
        <div className="calendar-title-nav">
          <h2 style={{ minWidth: '180px' }}>
            {viewMode === 'mes' && `${monthNames[month]} ${year}`}
            {viewMode === 'semana' && `Semana ${currentDate.getDate()} - ${monthNames[month]}`}
            {viewMode === 'dia' && `${currentDate.getDate()} de ${monthNames[month]}, ${year}`}
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="calendar-nav-btn" onClick={prevPeriod}>
              <ChevronLeft size={16} />
            </button>
            <button className="calendar-nav-btn" onClick={() => setCurrentDate(new Date())}>
              Hoy
            </button>
            <button className="calendar-nav-btn" onClick={nextPeriod}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Doctor Filters */}
        <div className="calendar-filter-container">
          <div className="calendar-filter-label">
            <Filter size={16} />
            Filtrar Doctor:
          </div>
          <select 
            className="form-select calendar-filter-select"
            value={filterDoctorId}
            onChange={(e) => setFilterDoctorId(e.target.value)}
          >
            <option value="todos">Todos los doctores</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
            ))}
          </select>
        </div>

        {/* View Mode Selector */}
        <div className="calendar-view-selector" style={{ margin: 0 }}>
          <button 
            className={`calendar-view-btn ${viewMode === 'mes' ? 'active' : ''}`}
            onClick={() => setViewMode('mes')}
          >
            Mes
          </button>
          <button 
            className={`calendar-view-btn ${viewMode === 'semana' ? 'active' : ''}`}
            onClick={() => setViewMode('semana')}
            disabled
            style={{ opacity: 0.5, cursor: 'not-allowed' }}
            title="Vista semanal disponible en fase 2"
          >
            Semana
          </button>
          <button 
            className={`calendar-view-btn ${viewMode === 'dia' ? 'active' : ''}`}
            onClick={() => setViewMode('dia')}
            disabled
            style={{ opacity: 0.5, cursor: 'not-allowed' }}
            title="Vista diaria disponible en fase 2"
          >
            Día
          </button>
        </div>
      </div>

      {/* Interactive Month Grid */}
      <div className="calendar-container">
        <div className="calendar-grid">
          {/* Day Names Labels */}
          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(label => (
            <div key={label} className="calendar-day-label">
              {label}
            </div>
          ))}

          {/* Grid Cells */}
          <div className="calendar-grid-cells">
            {calendarCells.map((cell, idx) => {
              // Get appointments scheduled for this cell day
              const cellAppts = appointments.filter(a => {
                if (a.date !== cell.dateString) return false;
                if (filterDoctorId !== 'todos' && a.doctorId !== filterDoctorId) return false;
                return true;
              });

              return (
                <div 
                  key={idx} 
                  className={`calendar-cell ${cell.outside ? 'outside' : ''} ${isToday(cell.dateString) ? 'today' : ''} ${cellAppts.length > 0 ? 'has-events' : ''}`}
                  style={{ cursor: cellAppts.length > 0 ? 'pointer' : 'default' }}
                  onClick={() => {
                    if (cellAppts.length > 0) {
                      setSelectedDayAppts({ date: cell.dateString, appts: cellAppts });
                    }
                  }}
                >
                  <div className="calendar-cell-header">
                    <span className="calendar-date-number">{cell.day}</span>
                    {cellAppts.length > 0 && (
                      <span className="calendar-citas-badge">
                        {cellAppts.length} citas
                      </span>
                    )}
                  </div>
                  <div className="calendar-cell-events">
                    {/* Desktop View: Full appointment tags */}
                    <div className="calendar-desktop-events">
                      {cellAppts
                        .sort((a,b) => a.time.localeCompare(b.time))
                        .map(appt => {
                          const pat = patients.find(p => p.id === appt.patientId);
                          const proc = procedures.find(p => p.code === appt.procedureCode);
                          if (!pat) return null;
                          
                          return (
                            <div 
                              key={appt.id} 
                              className={`calendar-event ${appt.status}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAppt(appt);
                              }}
                              title={`${format12h(appt.time)} - ${pat.name}: ${proc?.name || ''}`}
                            >
                              <strong>{format12h(appt.time)}</strong> {pat.name.split(' ')[0]}
                            </div>
                          );
                        })}
                    </div>
                    {/* Mobile View: Clean, elegant status dots */}
                    <div className="calendar-mobile-dots">
                      {cellAppts.map(appt => (
                        <span 
                          key={appt.id} 
                          className={`calendar-mobile-dot ${appt.status}`}
                          title={`${format12h(appt.time)}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Professional Appointment Details & Editing Modal */}
      {/* ⚠️ SIN onClick en modal-overlay — solo se cierra con botones explícitos */}
      {selectedAppt && (
        <div className="modal-overlay">
          <div className="modal-content fade-in" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Detalles de la Cita</h2>
              <button className="close-btn" onClick={() => setSelectedAppt(null)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Patient Profile Quick Summary */}
                {(() => {
                  const pat = getPatientById(selectedAppt.patientId);
                  const proc = getProcedureByCode(selectedAppt.procedureCode);
                  if (!pat || !proc) return null;
                  
                  return (
                    <div style={{ backgroundColor: 'var(--bg-app)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '4px' }}>PACIENTE</div>
                      <div style={{ fontWeight: 700, fontSize: '15px' }}>{pat.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Cód. Procedimiento: <strong>{proc.code}</strong> • {proc.name}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--secondary)', fontWeight: 700, marginTop: '6px' }}>
                        Valor del Tratamiento:{' '}
                        <span style={{ textDecoration: (selectedAppt.discount || 0) > 0 ? 'line-through' : 'none', color: (selectedAppt.discount || 0) > 0 ? 'var(--text-muted)' : 'var(--secondary)', fontWeight: (selectedAppt.discount || 0) > 0 ? 400 : 700 }}>
                          ${proc.price.toLocaleString('es-CO')}
                        </span>
                        {(selectedAppt.discount || 0) > 0 && (
                          <strong style={{ color: 'var(--state-confirmada)', marginLeft: '8px' }}>
                            ${Math.round(proc.price * (1 - (selectedAppt.discount || 0) / 100)).toLocaleString('es-CO')} ({(selectedAppt.discount || 0)}% desc.)
                          </strong>
                        )}
                      </div>
                      {pat.allergies !== 'Ninguna' && pat.allergies !== 'Ninguna conocida' && (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', color: 'var(--state-cancelada)', fontSize: '11px', fontWeight: 700, marginTop: '6px' }}>
                          <AlertTriangle size={12} /> ALERGIA: {pat.allergies}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Form fields for rescheduling */}
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Fecha</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      required 
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hora</label>
                    <TimeSelector12h
                      value={editTime}
                      onChange={setEditTime}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Doctor / Especialista</label>
                  <select 
                    className="form-select"
                    value={editDoctorId}
                    onChange={(e) => setEditDoctorId(e.target.value)}
                  >
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Porcentaje de Descuento (%)</label>
                  <input 
                    type="number" 
                    className="form-input"
                    min={0}
                    max={100}
                    value={editDiscount || ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : Number(e.target.value);
                      setEditDiscount(val < 0 ? 0 : val > 100 ? 100 : val);
                    }}
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Estado de la Cita</label>
                  <select 
                    className="form-select"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                  >
                    <option value="pendiente">Pendiente (Amarillo)</option>
                    <option value="confirmada">Confirmada (Verde)</option>
                    <option value="enproceso">En Proceso (Azul)</option>
                    <option value="finalizada">Finalizada (Gris)</option>
                    <option value="cancelada">Cancelada (Rojo)</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Evolución / Observaciones</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Evolución clínica o notas internas"
                  />
                </div>

              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setSelectedAppt(null)}
                >
                  Cerrar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Day details modal for displaying multiple appointments clearly */}
      {/* ⚠️ SIN onClick en modal-overlay — solo se cierra con botones explícitos */}
      {selectedDayAppts && (
        <div 
          className="modal-overlay" 
          style={{ animation: 'fadeIn 0.2s ease' }}
        >
          <div className="modal-content fade-in" style={{ maxWidth: '680px', padding: '24px', borderRadius: '18px' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Calendar size={22} style={{ color: 'var(--primary)' }} />
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Itinerario del Día</h2>
                  <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: 600 }}>
                    {(() => {
                      const parts = selectedDayAppts.date.split('-');
                      if (parts.length !== 3) return selectedDayAppts.date;
                      const y = parseInt(parts[0]);
                      const m = parseInt(parts[1]) - 1;
                      const d = parseInt(parts[2]);
                      const dateObj = new Date(y, m, d);
                      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                      return `${dayNames[dateObj.getDay()]} ${d} de ${monthNames[m]} de ${y}`;
                    })()}
                  </span>
                </div>
              </div>
              <button className="close-btn" onClick={() => setSelectedDayAppts(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '450px', overflowY: 'auto', paddingRight: '4px' }}>
              {selectedDayAppts.appts
                .sort((a, b) => a.time.localeCompare(b.time))
                .map(appt => {
                  const pat = patients.find(p => p.id === appt.patientId);
                  const doc = doctors.find(d => d.id === appt.doctorId);
                  const proc = procedures.find(p => p.code === appt.procedureCode);
                  if (!pat) return null;

                  return (
                    <div 
                      key={appt.id} 
                      className="calendar-day-modal-item"
                      onClick={() => {
                        setSelectedDayAppts(null);
                        setSelectedAppt(appt);
                      }}
                    >
                      {/* Left: Time and Patient Info */}
                      <div className="calendar-day-modal-item-left">
                        <div 
                          className="calendar-day-modal-item-time"
                          style={{ 
                            backgroundColor: `var(--state-${appt.status}-bg)`, 
                            color: `var(--state-${appt.status})`,
                          }}
                        >
                          <Clock size={12} style={{ marginRight: '4px' }} />
                          {format12h(appt.time)}
                        </div>
                        <div className="calendar-day-modal-item-patient">
                          <strong>{pat.name}</strong>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span>C.C. {pat.document}</span>
                            {pat.allergies && pat.allergies !== 'Ninguna' && pat.allergies !== 'Ninguna conocida' && (
                              <span 
                                className="calendar-day-modal-item-allergy"
                                title={`Alergia: ${pat.allergies}`}
                              >
                                <AlertTriangle size={10} style={{ marginRight: '3px' }} /> ALERGIA
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Treatment & Doctor Info */}
                      <div className="calendar-day-modal-item-right">
                        <div className="calendar-day-modal-item-treatment">
                          <span className="treatment-name">{proc?.name || 'Tratamiento General'}</span>
                          <span className="treatment-category">{proc?.category || 'Odontología'}</span>
                        </div>

                        {/* Doctor Circle Badge */}
                        <div 
                          className="calendar-day-modal-item-doctor"
                          title={`Especialista: ${doc?.name}`}
                        >
                          <span 
                            className="doctor-avatar"
                            style={{ 
                              backgroundColor: doc?.color || 'var(--primary)', 
                            }}
                          >
                            {doc?.avatar || 'DR'}
                          </span>
                          <span className="doctor-name">{doc?.name.split(' ').slice(0,2).join(' ')}</span>
                        </div>

                        {/* Status capsule */}
                        <span className={`badge badge-${appt.status}`} style={{ fontSize: '10.5px', padding: '3px 8px', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                          {appt.status === 'pendiente' ? 'Pendiente' : appt.status === 'confirmada' ? 'Confirmada' : appt.status === 'enproceso' ? 'En Proceso' : appt.status === 'finalizada' ? 'Finalizada' : 'Cancelada'}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-light)', marginTop: '16px', paddingTop: '14px' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ width: '100%', padding: '10px' }}
                onClick={() => setSelectedDayAppts(null)}
              >
                Cerrar itinerario
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

