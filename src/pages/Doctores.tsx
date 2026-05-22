import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { Doctor } from '../context/AppContext';
import { Calendar, Clock, Lock } from 'lucide-react';

export const Doctores: React.FC = () => {
  const { 
    doctors, 
    appointments, 
    patients, 
    procedures, 
    showToast,
    addDoctor,
    updateDoctor,
    deleteDoctor
  } = useApp();

  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  
  // Set default selected doctor when doctors list loads
  useEffect(() => {
    if (!selectedDoctorId && doctors.length > 0) {
      setSelectedDoctorId(doctors[0].id);
    }
  }, [doctors, selectedDoctorId]);

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  
  const [formName, setFormName] = useState('');
  const [formSpecialty, setFormSpecialty] = useState('Ortodoncia');
  const [formHours, setFormHours] = useState('08:00 - 17:00');
  const [formDays, setFormDays] = useState<string[]>(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']);
  const [formColor, setFormColor] = useState('#00A3FF');

  // Schedule blocking states
  const [blockDate, setBlockDate] = useState('');
  const [blockTimeStart, setBlockTimeStart] = useState('08:00');
  const [blockTimeEnd, setBlockTimeEnd] = useState('12:00');
  const [blockReason, setBlockReason] = useState('');

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId) || doctors[0];

  // Get active appointments for selected doctor
  const doctorAppointments = selectedDoctor 
    ? appointments.filter(a => a.doctorId === selectedDoctor.id && a.status !== 'cancelada')
    : [];

  const handleOpenCreate = () => {
    setEditingDoctor(null);
    setFormName('');
    setFormSpecialty('Ortodoncia');
    setFormHours('08:00 - 17:00');
    setFormDays(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']);
    setFormColor('#00A3FF');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (doc: Doctor) => {
    setEditingDoctor(doc);
    setFormName(doc.name);
    setFormSpecialty(doc.specialty);
    setFormHours(doc.workingHours);
    setFormDays(doc.workingDays);
    setFormColor(doc.color);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Por favor ingrese el nombre del especialista', 'warning');
      return;
    }

    try {
      if (editingDoctor) {
        await updateDoctor(editingDoctor.id, {
          name: formName,
          specialty: formSpecialty,
          workingHours: formHours,
          workingDays: formDays,
          color: formColor
        });
      } else {
        const newDoc = await addDoctor({
          name: formName,
          specialty: formSpecialty,
          workingHours: formHours,
          workingDays: formDays,
          color: formColor
        });
        setSelectedDoctorId(newDoc.id);
      }
      setIsModalOpen(false);
    } catch (err) {}
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Está seguro de que desea desactivar a este especialista? Se ocultará de la lista activa.')) {
      try {
        await deleteDoctor(id);
        const remaining = doctors.filter(d => d.id !== id);
        setSelectedDoctorId(remaining[0]?.id || '');
      } catch (err) {}
    }
  };

  const handleBlockSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>PERSONAL CLÍNICO ({doctors.length})</div>
          <button 
            className="btn btn-primary" 
            style={{ padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
            onClick={handleOpenCreate}
          >
            + Agregar
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {doctors.length === 0 ? (
            <div 
              className="premium-card" 
              style={{ 
                padding: '32px 16px', 
                textAlign: 'center', 
                color: 'var(--text-light)', 
                fontSize: '13px',
                border: '1px dashed var(--border-light)',
                backgroundColor: 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <span>No hay especialistas registrados aún.</span>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', fontSize: '12.5px' }}
                onClick={handleOpenCreate}
              >
                + Registrar Primero
              </button>
            </div>
          ) : (
            doctors.map(d => (
              <div 
                key={d.id}
                className="premium-card"
                style={{ 
                  padding: '16px',
                  cursor: 'pointer',
                  border: '1px solid var(--border-light)',
                  borderLeft: selectedDoctorId === d.id ? `4px solid ${d.color}` : '1px solid var(--border-light)',
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
            ))
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Schedule Details & Block Actions */}
      {selectedDoctor ? (
        <div className="doctors-detail-col premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px', minHeight: '550px' }}>
          
          {/* Dossier Header */}
          <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', fontSize: '13px' }}
                onClick={() => handleOpenEdit(selectedDoctor)}
              >
                Editar Datos
              </button>
              <button 
                className="btn" 
                style={{ 
                  padding: '6px 12px', 
                  fontSize: '13px', 
                  backgroundColor: 'var(--state-cancelada-bg)', 
                  color: 'var(--state-cancelada)', 
                  border: '1px solid #fca5a5' 
                }}
                onClick={() => handleDelete(selectedDoctor.id)}
              >
                Desactivar
              </button>
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
        <div className="premium-card" style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', minHeight: '550px' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-muted)' }}>
            No hay ningún especialista seleccionado
          </div>
          <p className="text-muted" style={{ fontSize: '13px', maxWidth: '360px', textAlign: 'center' }}>
            Por favor, seleccione un especialista de la columna izquierda o agregue uno nuevo para ver su disponibilidad semanal y su agenda.
          </p>
          <button className="btn btn-primary" style={{ marginTop: '8px' }} onClick={handleOpenCreate}>
            + Registrar Especialista
          </button>
        </div>
      )}

      {/* Create/Edit Doctor Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content fade-in" style={{ maxWidth: '500px', borderRadius: 'var(--radius-lg)' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-light)', padding: '16px' }}>
              <h3 style={{ margin: 0 }}>{editingDoctor ? 'Editar Especialista' : 'Registrar Nuevo Especialista'}</h3>
              <button 
                className="close-btn" 
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-muted)' }}
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', display: 'block' }}>Nombre del Especialista *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ej: Dra. Diana Marcela Restrepo" 
                    required 
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    style={{ width: '100%', height: '38px' }}
                  />
                </div>

                <div className="grid-2" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', display: 'block' }}>Especialidad *</label>
                    <select 
                      className="form-select"
                      required
                      value={formSpecialty}
                      onChange={(e) => setFormSpecialty(e.target.value)}
                      style={{ width: '100%', height: '38px' }}
                    >
                      <option value="Ortodoncia">Ortodoncia</option>
                      <option value="Endodoncia">Endodoncia</option>
                      <option value="Periodoncia">Periodoncia</option>
                      <option value="Cirugía Oral">Cirugía Oral</option>
                      <option value="Odontología General">Odontología General</option>
                      <option value="Estética Dental">Estética Dental</option>
                      <option value="Odontopediatría">Odontopediatría</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', display: 'block' }}>Horas de Consulta *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ej: 08:00 - 17:00" 
                      required 
                      value={formHours}
                      onChange={(e) => setFormHours(e.target.value)}
                      style={{ width: '100%', height: '38px' }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', display: 'block' }}>Días Laborales *</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                    {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(day => {
                      const isSelected = formDays.includes(day);
                      return (
                        <button
                          type="button"
                          key={day}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '12px',
                            fontWeight: 600,
                            backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-app)',
                            color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                            border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-light)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => {
                            if (isSelected) {
                              setFormDays(prev => prev.filter(d => d !== day));
                            } else {
                              setFormDays(prev => [...prev, day]);
                            }
                          }}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', display: 'block' }}>Color del Especialista (Representación Visual)</label>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                    {['#00A3FF', '#1F2933', '#6366F1', '#10B981', '#F59E0B', '#EF4444', '#EC4899'].map(color => (
                      <button
                        type="button"
                        key={color}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: color,
                          border: formColor === color ? '3px solid white' : '1px solid rgba(0,0,0,0.1)',
                          boxShadow: formColor === color ? '0 0 0 2px var(--primary)' : 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onClick={() => setFormColor(color)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-light)', padding: '16px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingDoctor ? 'Guardar Cambios' : 'Registrar Especialista'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
