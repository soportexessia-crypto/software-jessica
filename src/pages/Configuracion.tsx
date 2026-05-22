import React from 'react';
import { useApp } from '../context/AppContext';
import { Database, ShieldCheck, HardDrive, RefreshCw } from 'lucide-react';

export const Configuracion: React.FC = () => {
  const { patients, doctors, appointments, financials, showToast } = useApp();

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
    <div className="grid-2 fade-in" style={{ gap: '28px' }}>
      
      {/* LEFT COLUMN: Security & Backups */}
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
            <span style={{ color: 'var(--text-light)' }}>17:58:17</span> • Sesión administrativa iniciada por Jessica Restrepo.
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
            <span style={{ color: 'var(--text-light)' }}>Justo ahora</span> • Vista de configuración abierta por Jessica Restrepo.
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
