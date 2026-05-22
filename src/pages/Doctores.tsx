import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, Clock, Lock } from 'lucide-react';

export const Doctores: React.FC = () => {
  const { doctors, appointments, patients, procedures, showToast } = useApp();
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(doctors[0]?.id || '');
  
  // Schedule blocking states
  const [blockDate, setBlockDate] = useState('');
  const [blockTimeStart, setBlockTimeStart] = useState('08:00');
  const [blockTimeEnd, setBlockTimeEnd] = useState('12:00');
  const [blockReason, setBlockReason] = useState('');

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId) || doctors[0];

  // Get active appointments for selected doctor
  const doctorAppointments = appointments.filter(a => a.doctorId === selectedDoctor?.id && a.status !== 'cancelada');

  const handleBlockSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockDate || !blockReason) {
      showToast('Por favor complete todos los datos del bloqueo.', 'warning');
      return;
    }
    
    showToast(`Bloqueo de horario registrado para el especialista ${selectedDoctor.name} el día ${blockDate} de ${blockTimeStart} a ${blockTimeEnd}. Motivo: ${blockReason}.`, 'success');
    setBlockDate('');
    setBlockReason('');
  };

  return (
    <div className="grid-12 fade-in" style={{ gap: '28px' }}>
      
      {/* LEFT COLUMN: Doctors List Cards */}
      <div className="doctors-list-col" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>PERSONAL CLÍNICO ({doctors.length})</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {doctors.map(d => (
            <div 
              key={d.id}
              className="premium-card"
              style={{ 
                padding: '16px',
                cursor: 'pointer',
                border: '1px solid var(--border-light)',
                borderLeft: selectedDoctorId === d.id ? '4px solid var(--primary)' : '1px solid var(--border-light)',
                backgroundColor: selectedDoctorId === d.id ? 'var(--bg-hover)' : 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}
              onClick={() => setSelectedDoctorId(d.id)}
            >
              <div 
                className="user-avatar" 
                style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: d.color,
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '18px'
                }}
              >
                {d.avatar}
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: '14.5px', color: 'var(--text-main)' }}>{d.name}</strong>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{d.specialty}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT COLUMN: Schedule Details & Block Actions */}
      {selectedDoctor ? (
        <div className="doctors-detail-col premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px', minHeight: '550px' }}>
          
          {/* Dossier Header */}
          <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '18px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div 
              className="user-avatar" 
              style={{ 
                width: '56px', 
                height: '56px', 
                borderRadius: 'var(--radius-md)', 
                backgroundColor: selectedDoctor.color, 
                color: 'white', 
                fontSize: '20px', 
                fontWeight: 800 
              }}
            >
              {selectedDoctor.avatar}
            </div>
            <div>
              <h2 style={{ fontSize: '22px' }}>{selectedDoctor.name}</h2>
              <span className="badge badge-confirmada" style={{ fontSize: '9px', padding: '1px 8px', marginTop: '4px', borderRadius: 'var(--radius-sm)' }}>
                {selectedDoctor.specialty.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="grid-2" style={{ gap: '24px' }}>
            {/* Working Schedule details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3>Disponibilidad Semanal</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} className="text-muted" /> 
                  Horas de Consulta: <strong>{selectedDoctor.workingHours}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <Calendar size={16} className="text-muted" style={{ marginTop: '2px' }} />
                  <div>
                    Días Laborales: <br/>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(day => {
                        const isWorking = selectedDoctor.workingDays.includes(day);
                        return (
                          <span 
                            key={day}
                            style={{ 
                              padding: '3px 8px', 
                              borderRadius: 'var(--radius-sm)', 
                              fontSize: '11px', 
                              fontWeight: 600,
                              backgroundColor: isWorking ? 'var(--bg-hover)' : 'var(--bg-app)',
                              color: isWorking ? 'var(--primary)' : 'var(--text-light)',
                              border: '1px solid var(--border-light)'
                            }}
                          >
                            {day}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Active appointments statistics */}
              <div style={{ marginTop: '10px' }}>
                <h3>Agenda del Mes</h3>
                <div style={{ backgroundColor: 'var(--bg-app)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginTop: '10px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--secondary)' }}>
                    {doctorAppointments.length}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    Citas activas en la agenda. <br/>
                    Asegure la confirmación previa antes de iniciar consulta.
                  </div>
                </div>
              </div>
            </div>

            {/* Block Schedules Form */}
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
                <Lock size={16} /> Bloquear Horario / Agenda
              </h3>
              <p className="text-muted" style={{ fontSize: '11.5px', marginTop: '-4px' }}>
                Bloquee horas específicas por motivos de cirugía mayor, reuniones clínicas, recesos o incapacidades.
              </p>

              <form onSubmit={handleBlockSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Fecha del Bloqueo *</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    required
                    value={blockDate}
                    onChange={(e) => setBlockDate(e.target.value)}
                  />
                </div>

                <div className="grid-2" style={{ gap: '10px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Hora Inicio</label>
                    <input 
                      type="time" 
                      className="form-input" 
                      required
                      value={blockTimeStart}
                      onChange={(e) => setBlockTimeStart(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Hora Fin</label>
                    <input 
                      type="time" 
                      className="form-input" 
                      required
                      value={blockTimeEnd}
                      onChange={(e) => setBlockTimeEnd(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Motivo del Bloqueo *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ej: Cirugía Exodoncia Compleja"
                    required
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Registrar Bloqueo Clínico
                </button>
              </form>
            </div>
          </div>

          {/* List of active doctor appointments */}
          <div>
            <h3>Listado de Citas Pendientes</h3>
            <div className="premium-table-container" style={{ marginTop: '12px' }}>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Procedimiento</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {doctorAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '16px' }} className="text-muted">No hay citas agendadas</td>
                    </tr>
                  ) : (
                    doctorAppointments.map(appt => {
                      const pat = patients.find(p => p.id === appt.patientId);
                      const proc = procedures.find(p => p.code === appt.procedureCode);
                      return (
                        <tr key={appt.id}>
                          <td><strong>{pat?.name}</strong></td>
                          <td>{appt.date}</td>
                          <td>{appt.time}</td>
                          <td>{proc?.name}</td>
                          <td>
                            <span className={`badge badge-${appt.status}`}>{appt.status.toUpperCase()}</span>
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
      ) : (
        <div className="premium-card" style={{ gridColumn: 'span 8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Seleccione un especialista del menú izquierdo.
        </div>
      )}

    </div>
  );
};
