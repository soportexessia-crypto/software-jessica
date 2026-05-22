import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Appointment, Patient } from '../context/AppContext';
import { 
  TrendingUp, 
  CalendarDays, 
  AlertOctagon, 
  Clock, 
  Check, 
  X, 
  Play, 
  ChevronRight, 
  MessageSquare,
  Users
} from 'lucide-react';
import { format12h } from '../components/QuickAppointmentModal';

interface DashboardProps {
  onNavigateToModule: (module: string, param?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToModule }) => {
  const { 
    appointments, 
    patients, 
    doctors, 
    procedures, 
    financials, 
    updateAppointment
  } = useApp();

  const [simulatedWhatsApp, setSimulatedWhatsApp] = useState<{ message: string; phone: string } | null>(null);

  // Tomorrow's date string calculation
  const getTomorrowDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const tomorrowStr = getTomorrowDateString();
  const unconfirmedTomorrowCount = appointments.filter(a => a.date === tomorrowStr && a.status === 'pendiente').length;

  // Patient with dynamic debt
  const debtorPatients = patients.filter(p => p.debt > 0).sort((a, b) => b.debt - a.debt);
  const topDebtor = debtorPatients[0];

  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayDateString();
  const todayAppointments = appointments.filter(a => a.date === todayStr);

  const totalTodayCount = todayAppointments.length;
  const cancelledCount = todayAppointments.filter(a => a.status === 'cancelada').length;
  const waitingRoomCount = todayAppointments.filter(a => a.status === 'enproceso' || a.status === 'confirmada').length;
  
  const todayEarnings = financials
    .filter(f => f.date.startsWith(todayStr) && f.type === 'Ingreso')
    .reduce((sum, r) => sum + r.amount, 0);

  const handleStatusChange = (id: string, newStatus: Appointment['status']) => {
    updateAppointment(id, { status: newStatus });
  };

  const handleSendWhatsApp = (pat: Patient, appt: Appointment) => {
    const time = format12h(appt.time);
    const msg = `Hola *${pat.name}*, le recordamos su cita odontológica en *Centro Odontológico Catalina EVA* programada para hoy a las *${time}*. ¿Confirma su asistencia?`;
    
    // Clean phone number (only digits)
    const cleanPhone = pat.phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;
    
    setSimulatedWhatsApp({ message: msg, phone: formattedPhone });
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* 1. KPIs row */}
      <div className="kpi-container">
        
        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--state-confirmada)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Ingresos de Hoy</span>
            <span className="kpi-value">${todayEarnings.toLocaleString('es-CO')}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--primary)' }}>
            <CalendarDays size={24} />
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Citas de Hoy</span>
            <span className="kpi-value">{totalTodayCount}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--state-enproceso)' }}>
            <Clock size={24} />
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Sala de Espera</span>
            <span className="kpi-value">{waitingRoomCount}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--state-cancelada)' }}>
            <AlertOctagon size={24} />
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Canceladas</span>
            <span className="kpi-value">{cancelledCount}</span>
          </div>
        </div>

      </div>

      {/* 2. Main Section Grid */}
      <div className="grid-12">
        
        {/* Appointments Timeline */}
        <div className="premium-card" style={{ gridColumn: 'span 8', minHeight: '400px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Flujo de Citas del Día</h2>
            <span className="text-muted" style={{ fontSize: '13px' }}>Fecha: {todayStr}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
            {todayAppointments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-light)' }}>
                <CalendarDays size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                <p>No hay citas programadas para el día de hoy.</p>
              </div>
            ) : (
              todayAppointments
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((appt) => {
                  const pat = patients.find(p => p.id === appt.patientId);
                  const doc = doctors.find(d => d.id === appt.doctorId);
                  const proc = procedures.find(p => p.code === appt.procedureCode);
                  
                  if (!pat || !doc || !proc) return null;

                  return (
                    <div key={appt.id} className="appt-card">
                        {/* Time slot and details wrapped in appt-info-section */}
                        <div className="appt-info-section">
                          {/* Time slot */}
                          <div className="appt-time-slot">
                            <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--secondary)' }}>{format12h(appt.time)}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{proc.duration} min</span>
                          </div>

                          {/* Patient and details */}
                          <div className="appt-details">
                            <div 
                              style={{ fontWeight: 700, fontSize: '14.5px', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                              onClick={() => onNavigateToModule('Pacientes', pat.id)}
                            >
                              {pat.name} 
                              <ChevronRight size={14} style={{ color: 'var(--text-light)' }} />
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Doctor: <strong>{doc.name}</strong> • Tratamiento: <strong>{proc.name}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Right side controls (Badges & Actions) */}
                        <div className="appt-controls-section">
                          {/* Badges */}
                          <div className="appt-badges">
                            <span className={`badge badge-${appt.status}`}>
                              {appt.status.toUpperCase()}
                            </span>
                            <span style={{ 
                              fontSize: '11px', 
                              fontWeight: 700, 
                              color: appt.paymentStatus === 'pagado' ? 'var(--state-confirmada)' : appt.paymentStatus === 'parcial' ? 'var(--state-pendiente)' : 'var(--state-cancelada)', 
                              backgroundColor: appt.paymentStatus === 'pagado' ? 'var(--state-confirmada-bg)' : appt.paymentStatus === 'parcial' ? 'var(--state-pendiente-bg)' : 'var(--state-cancelada-bg)', 
                              padding: '2px 8px', 
                              borderRadius: 'var(--radius-full)',
                              letterSpacing: '0.5px'
                            }}>
                              {appt.paymentStatus === 'pagado' ? 'PAGADO' : appt.paymentStatus === 'parcial' ? 'PARCIAL' : 'DEUDA'}
                            </span>
                          </div>

                          {appt.status !== 'cancelada' && appt.status !== 'finalizada' && (
                            <>
                              {/* Divider */}
                              <div className="appt-divider"></div>

                              {/* Actions */}
                              <div className="appt-actions">
                                {appt.status === 'pendiente' && (
                                  <>
                                    <button 
                                      title="Confirmar Cita" 
                                      className="btn btn-secondary" 
                                      style={{ width: '36px', height: '36px', padding: 0, borderRadius: '8px', color: 'var(--state-confirmada)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                      onClick={() => handleStatusChange(appt.id, 'confirmada')}
                                    >
                                      <Check size={16} />
                                    </button>
                                    <button 
                                      title="Marcar Inasistencia" 
                                      className="btn btn-secondary" 
                                      style={{ width: '36px', height: '36px', padding: 0, borderRadius: '8px', color: 'var(--state-cancelada)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                      onClick={() => handleStatusChange(appt.id, 'cancelada')}
                                    >
                                      <X size={16} />
                                    </button>
                                  </>
                                )}

                                {appt.status === 'confirmada' && (
                                  <>
                                    <button 
                                      title="Iniciar Consulta" 
                                      className="btn btn-primary" 
                                      style={{ height: '36px', padding: '0 14px', borderRadius: '8px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                      onClick={() => handleStatusChange(appt.id, 'enproceso')}
                                    >
                                      <Play size={12} fill="white" /> Iniciar
                                    </button>
                                    <button 
                                      title="Cancelar Cita" 
                                      className="btn btn-secondary" 
                                      style={{ width: '36px', height: '36px', padding: 0, borderRadius: '8px', color: 'var(--state-cancelada)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                      onClick={() => handleStatusChange(appt.id, 'cancelada')}
                                    >
                                      <X size={16} />
                                    </button>
                                  </>
                                )}

                                {appt.status === 'enproceso' && (
                                  <button 
                                    className="btn" 
                                    style={{ height: '36px', padding: '0 14px', borderRadius: '8px', fontSize: '12px', backgroundColor: 'var(--state-confirmada)', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                    onClick={() => handleStatusChange(appt.id, 'finalizada')}
                                  >
                                    Finalizar
                                  </button>
                                )}

                                <button 
                                  title="Enviar Recordatorio WhatsApp" 
                                  className="btn btn-secondary" 
                                  style={{ width: '36px', height: '36px', padding: 0, borderRadius: '8px', color: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  onClick={() => handleSendWhatsApp(pat, appt)}
                                >
                                  <MessageSquare size={16} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>

                      </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Sidebar panels */}
        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Virtual Waiting Room */}
          <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h2>Sala de Espera</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {todayAppointments.filter(a => a.status === 'enproceso' || a.status === 'confirmada').length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-light)', fontSize: '13px' }}>
                  <Users size={32} style={{ opacity: 0.3, marginBottom: '6px' }} />
                  <p>No hay pacientes en sala.</p>
                </div>
              ) : (
                todayAppointments
                  .filter(a => a.status === 'enproceso' || a.status === 'confirmada')
                  .map(appt => {
                    const pat = patients.find(p => p.id === appt.patientId);
                    if (!pat) return null;
                    return (
                      <div 
                        key={appt.id} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          padding: '10px 12px', 
                          borderRadius: 'var(--radius-md)', 
                          backgroundColor: 'var(--bg-app)',
                          border: '1px solid var(--border-light)',
                          borderLeft: `4px solid ${appt.status === 'enproceso' ? 'var(--state-enproceso)' : 'var(--state-confirmada)'}`
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13px' }}>{pat.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cita: {format12h(appt.time)}</div>
                        </div>
                        <span className="badge badge-enproceso" style={{ fontSize: '10px' }}>
                          {appt.status === 'enproceso' ? 'En Sillón' : 'En Espera'}
                        </span>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* Active Notifications & Reminders */}
          <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h2>Recordatorios Pendientes</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              {unconfirmedTomorrowCount === 0 && !topDebtor ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-light)', fontSize: '13px' }}>
                  No hay recordatorios urgentes hoy.
                </div>
              ) : (
                <>
                  {unconfirmedTomorrowCount > 0 && (
                    <div style={{ backgroundColor: 'var(--state-pendiente-bg)', color: 'var(--state-pendiente)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid #fef3c7' }}>
                      <strong>Confirmar citas de mañana:</strong> Hay {unconfirmedTomorrowCount} paciente{unconfirmedTomorrowCount > 1 ? 's que no han' : ' que no ha'} confirmado cita para mañana.
                    </div>
                  )}

                  {topDebtor && (
                    <div style={{ backgroundColor: 'var(--state-cancelada-bg)', color: 'var(--state-cancelada)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid #fee2e2' }}>
                      <strong>Pacientes con saldo:</strong> <strong>{topDebtor.name}</strong> tiene saldo pendiente de ${topDebtor.debt.toLocaleString('es-CO')}. Recordar cobro.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Simulated WhatsApp Modal Overlay */}
      {simulatedWhatsApp && (
        <div className="modal-overlay" onClick={() => setSimulatedWhatsApp(null)}>
          <div className="modal-content fade-in" style={{ maxWidth: '400px', borderRadius: 'var(--radius-lg)' }}>
            <div className="modal-header" style={{ backgroundColor: 'var(--primary)', color: 'white', borderBottom: '1px solid var(--primary-hover)' }}>
              <h3 style={{ color: 'white' }}>Simulación WhatsApp Business</h3>
              <button className="close-btn" style={{ color: 'white' }} onClick={() => setSimulatedWhatsApp(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ backgroundColor: 'var(--primary-light)', padding: '20px' }}>
              <div 
                style={{ 
                  backgroundColor: 'white', 
                  padding: '16px', 
                  borderRadius: '12px', 
                  boxShadow: '0 4px 12px var(--primary-glow)', 
                  border: '1px solid var(--border-light)',
                  maxWidth: '90%',
                  fontSize: '13.5px',
                  lineHeight: '1.5',
                  position: 'relative'
                }}
              >
                <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-main)', fontWeight: 500 }}>{simulatedWhatsApp.message}</div>
                <div style={{ textAlign: 'right', fontSize: '10px', color: 'var(--primary)', marginTop: '8px', fontWeight: 600 }}>
                  Mensaje redactado ✓✓
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ padding: '12px 16px', gap: '10px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, fontSize: '13px' }} 
                onClick={() => setSimulatedWhatsApp(null)}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, fontSize: '13px' }} 
                onClick={() => {
                  const url = `https://api.whatsapp.com/send?phone=${simulatedWhatsApp.phone}&text=${encodeURIComponent(simulatedWhatsApp.message)}`;
                  window.open(url, '_blank');
                  setSimulatedWhatsApp(null);
                }}
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
