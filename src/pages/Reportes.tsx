import React from 'react';
import { useApp } from '../context/AppContext';
import { BarChart3, TrendingUp, Users, FileSpreadsheet } from 'lucide-react';

export const Reportes: React.FC = () => {
  const { financials, patients, appointments, showToast } = useApp();

  // Admin and Doctor Stats calculations
  const newPatientsCount = patients.length;
  const activeApptsCount = appointments.filter(a => a.status !== 'cancelada').length;
  const totalEarningsVal = financials.reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Overview indicators */}
      <div className="grid-3" style={{ gap: '20px' }}>
        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--secondary)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Recaudado Acumulado</span>
            <span className="kpi-value">${totalEarningsVal.toLocaleString('es-CO')}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--accent)' }}>
            <Users size={24} />
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Pacientes Nuevos</span>
            <span className="kpi-value">{newPatientsCount}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--state-confirmada)' }}>
            <BarChart3 size={24} />
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Consultas Ejecutadas</span>
            <span className="kpi-value">{activeApptsCount}</span>
          </div>
        </div>
      </div>

      {/* SVG Graphics section */}
      <div className="grid-2" style={{ gap: '28px' }}>
        
        {/* Income Growth Chart (SVG) */}
        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3>Flujo de Caja Mensual</h3>
          <p className="text-muted" style={{ fontSize: '12px', marginTop: '-8px' }}>Evolución de cobros y facturas acumuladas (En miles de COP)</p>
          
          <div style={{ width: '100%', height: '240px', marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
            <svg viewBox="0 0 500 220" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              {/* Grids and Axes */}
              <line x1="40" y1="20" x2="40" y2="180" stroke="var(--border-light)" strokeWidth="1" />
              <line x1="40" y1="180" x2="480" y2="180" stroke="var(--border-light)" strokeWidth="1" />
              
              <line x1="40" y1="140" x2="480" y2="140" stroke="var(--bg-app)" strokeWidth="1" strokeDasharray="4" />
              <line x1="40" y1="100" x2="480" y2="100" stroke="var(--bg-app)" strokeWidth="1" strokeDasharray="4" />
              <line x1="40" y1="60" x2="480" y2="60" stroke="var(--bg-app)" strokeWidth="1" strokeDasharray="4" />
              
              <path 
                d="M 60,160 Q 140,110 220,130 T 380,50 L 460,80" 
                fill="none" 
                stroke="var(--secondary)" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
              />
              
              <path 
                d="M 60,160 Q 140,110 220,130 T 380,50 L 460,80 L 460,180 L 60,180 Z" 
                fill="rgba(2, 132, 199, 0.05)" 
              />

              {/* Data points */}
              <circle cx="60" cy="160" r="5" fill="var(--secondary)" stroke="white" strokeWidth="2" />
              <circle cx="140" cy="120" r="5" fill="var(--secondary)" stroke="white" strokeWidth="2" />
              <circle cx="220" cy="130" r="5" fill="var(--secondary)" stroke="white" strokeWidth="2" />
              <circle cx="380" cy="50" r="5" fill="var(--secondary)" stroke="white" strokeWidth="2" />
              <circle cx="460" cy="80" r="5" fill="var(--secondary)" stroke="white" strokeWidth="2" />

              {/* Text labels */}
              <text x="60" y="200" fontSize="10" fill="var(--text-light)" textAnchor="middle">Ene</text>
              <text x="140" y="200" fontSize="10" fill="var(--text-light)" textAnchor="middle">Feb</text>
              <text x="220" y="200" fontSize="10" fill="var(--text-light)" textAnchor="middle">Mar</text>
              <text x="380" y="200" fontSize="10" fill="var(--text-light)" textAnchor="middle">Abr</text>
              <text x="460" y="200" fontSize="10" fill="var(--text-light)" textAnchor="middle">May</text>
              
              <text x="30" y="165" fontSize="9" fill="var(--text-light)" textAnchor="end">$200k</text>
              <text x="30" y="105" fontSize="9" fill="var(--text-light)" textAnchor="end">$500k</text>
              <text x="30" y="55" fontSize="9" fill="var(--text-light)" textAnchor="end">$900k</text>
            </svg>
          </div>
        </div>

        {/* Doctor efficiency stats (SVG Bar Chart) */}
        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3>Rendimiento y Consultas por Especialista</h3>
          <p className="text-muted" style={{ fontSize: '12px', marginTop: '-8px' }}>Cantidad de citas finalizadas exitosamente este mes</p>
          
          <div style={{ width: '100%', height: '240px', marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
            <svg viewBox="0 0 500 220" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              {/* Axes */}
              <line x1="50" y1="20" x2="50" y2="180" stroke="var(--border-light)" strokeWidth="1" />
              <line x1="50" y1="180" x2="480" y2="180" stroke="var(--border-light)" strokeWidth="1" />
              
              {/* Bars */}
              <rect x="90" y="70" width="34" height="110" rx="4" fill="var(--primary)" />
              <rect x="200" y="50" width="34" height="130" rx="4" fill="var(--secondary)" />
              <rect x="310" y="90" width="34" height="90" rx="4" fill="var(--accent)" />
              <rect x="420" y="110" width="34" height="70" rx="4" fill="var(--state-confirmada)" />

              {/* Text labels */}
              <text x="107" y="198" fontSize="10" fill="var(--text-muted)" textAnchor="middle" fontWeight="600">Dra Valentina</text>
              <text x="217" y="198" fontSize="10" fill="var(--text-muted)" textAnchor="middle" fontWeight="600">Dr Carlos</text>
              <text x="327" y="198" fontSize="10" fill="var(--text-muted)" textAnchor="middle" fontWeight="600">Dra Camila</text>
              <text x="437" y="198" fontSize="10" fill="var(--text-muted)" textAnchor="middle" fontWeight="600">Dr Andrés</text>
              
              {/* Bar values */}
              <text x="107" y="62" fontSize="11" fill="var(--text-main)" textAnchor="middle" fontWeight="700">22</text>
              <text x="217" y="42" fontSize="11" fill="var(--text-main)" textAnchor="middle" fontWeight="700">28</text>
              <text x="327" y="82" fontSize="11" fill="var(--text-main)" textAnchor="middle" fontWeight="700">18</text>
              <text x="437" y="102" fontSize="11" fill="var(--text-main)" textAnchor="middle" fontWeight="700">14</text>
            </svg>
          </div>
        </div>

      </div>

      {/* Procedures efficiency lists */}
      <div className="premium-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3>Tratamientos Odontológicos Más Realizados</h3>
          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', gap: '6px' }} onClick={() => showToast('Exportando informe consolidado Excel...', 'info')}>
            <FileSpreadsheet size={14} /> Exportar Consolidado
          </button>
        </div>

        <div className="premium-table-container">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre Tratamiento</th>
                <th>Categoría</th>
                <th>Cobrado Acumulado</th>
                <th>Frecuencia Mensual</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>LIMP-01</strong></td>
                <td>Limpieza Dental Profunda + Profilaxis</td>
                <td><span className="badge badge-confirmada" style={{ fontSize: '9px' }}>LIMPIEZA</span></td>
                <td>$1,440,000</td>
                <td><strong>12 ejecuciones</strong></td>
              </tr>
              <tr>
                <td><strong>CONT-10</strong></td>
                <td>Control de Ortodoncia Técnica Roth</td>
                <td><span className="badge badge-enproceso" style={{ fontSize: '9px' }}>ORTODONCIA</span></td>
                <td>$720,000</td>
                <td><strong>8 ejecuciones</strong></td>
              </tr>
              <tr>
                <td><strong>RES-01</strong></td>
                <td>Resina Estética Fotocurable</td>
                <td><span className="badge badge-pendiente" style={{ fontSize: '9px' }}>RESTAURACIÓN</span></td>
                <td>$900,000</td>
                <td><strong>6 ejecuciones</strong></td>
              </tr>
              <tr>
                <td><strong>CIR-02</strong></td>
                <td>Extracción Quirúrgica de Tercer Molar</td>
                <td><span className="badge badge-cancelada" style={{ fontSize: '9px' }}>CIRUGÍA</span></td>
                <td>$1,050,000</td>
                <td><strong>3 ejecuciones</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
