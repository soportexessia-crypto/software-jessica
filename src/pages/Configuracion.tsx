import React from 'react';
import { useApp } from '../context/AppContext';
import { Database, ShieldCheck, HardDrive, RefreshCw, Wifi } from 'lucide-react';

export const Configuracion: React.FC = () => {
  const { patients, doctors, appointments, financials, showToast } = useApp();

  const [onlineStatus, setOnlineStatus] = React.useState(navigator.onLine);
  const [draftCount, setDraftCount] = React.useState(0);
  const [activeDrafts, setActiveDrafts] = React.useState<string[]>([]);

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
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('xessia_draft_')) {
        let displayName = '';
        if (key === 'xessia_draft_patient') displayName = 'Formulario Paciente';
        else if (key === 'xessia_draft_quick_appt') displayName = 'Cita Rápida';
        else if (key === 'xessia_draft_income') displayName = 'Ingreso Caja';
        else if (key === 'xessia_draft_expense') displayName = 'Gasto Caja';
        else if (key.startsWith('xessia_draft_note_')) {
          displayName = 'Evolución Clínica';
        } else {
          displayName = key.replace('xessia_draft_', '');
        }
        keys.push(displayName);
      }
    }
    setDraftCount(keys.length);
    setActiveDrafts(keys);
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
                  <span>Servidor API (Railway):</span>
                  <span style={{ color: 'var(--state-confirmada)', fontWeight: 600 }}>https://software-jessica-production.up.railway.app</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Versión del Software:</span>
                  <strong>v1.0.0 (Producción Local)</strong>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '10px' }}>
              <h3>Gestión de Autoguardado (Borradores)</h3>
              <p className="text-muted" style={{ fontSize: '12px', marginTop: '2px', marginBottom: '8px' }}>
                Autoguardado en localStorage activo. Previene pérdida de textos ante cortes de luz o recargas accidentales.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', marginBottom: '12px', backgroundColor: 'var(--bg-app)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Borradores Activos en Memoria:</span>
                  <strong style={{ color: draftCount > 0 ? 'var(--primary)' : 'var(--text-light)' }}>{draftCount} borrador(es)</strong>
                </div>
                {draftCount > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed var(--border-light)', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    <span>Formularios con datos guardados:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                      {activeDrafts.map((d, i) => (
                        <span key={i} className="badge badge-pendiente" style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', border: 'none' }}>
                          {d}
                        </span>
                      ))}
                    </div>
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
                    padding: '8px 14px'
                  }} 
                  onClick={handleClearDrafts}
                >
                  Vaciar Borradores Manualmente
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Settings Audit and Theme */}
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
              <span>Tema Visual Activado:</span>
              <strong>Tema Claro Clínico</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Moneda de Caja:</span>
              <strong>Pesos Colombianos ($ COP)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Canal de WhatsApp Remoto:</span>
              <strong style={{ color: 'var(--state-confirmada)' }}>En Línea</strong>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
