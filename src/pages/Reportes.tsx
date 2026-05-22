import React from 'react';
import { useApp } from '../context/AppContext';
import { BarChart3, TrendingUp, Users, FileSpreadsheet } from 'lucide-react';

export const Reportes: React.FC = () => {
  const { financials, patients, appointments, procedures, showToast, doctors } = useApp();

  // Overview metrics (real data only)
  const newPatientsCount = patients.length;
  const activeApptsCount = appointments.filter(a => a.status === 'finalizada').length;
  const totalEarningsVal = financials
    .filter(f => f.type === 'Ingreso')
    .reduce((sum, f) => sum + f.amount, 0);

  // 1. Calculate monthly incomes for the last 5 months dynamically
  const getMonthlyIncomes = () => {
    const today = new Date();
    const monthsToCalculate: { year: number; month: number; name: string; total: number }[] = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      monthsToCalculate.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        name: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][d.getMonth()],
        total: 0
      });
    }
    
    financials.forEach(f => {
      if (f.type !== 'Ingreso') return;
      const fDate = new Date(f.date.replace(' ', 'T'));
      if (isNaN(fDate.getTime())) return;
      const year = fDate.getFullYear();
      const month = fDate.getMonth();
      
      const matched = monthsToCalculate.find(m => m.year === year && m.month === month);
      if (matched) {
        matched.total += f.amount;
      }
    });

    return monthsToCalculate;
  };

  const monthlyIncomes = getMonthlyIncomes();
  const hasFinancialData = monthlyIncomes.some(m => m.total > 0);
  const maxIncome = Math.max(...monthlyIncomes.map(m => m.total), 1);

  // SVG Coordinates for Line Chart
  const linePoints = monthlyIncomes.map((m, idx) => ({
    x: 60 + idx * 100,
    y: 180 - (m.total / maxIncome) * 140
  }));
  
  const pathD = linePoints.length > 0 
    ? `M ${linePoints.map(p => `${p.x},${p.y}`).join(' L ')}`
    : '';
  const fillD = linePoints.length > 0
    ? `${pathD} L ${linePoints[linePoints.length - 1].x},180 L ${linePoints[0].x},180 Z`
    : '';

  const formatYLabel = (val: number) => {
    if (val >= 1000000) {
      return `$${(val / 1000000).toFixed(1)}M`;
    }
    if (val >= 1000) {
      return `$${(val / 1000).toFixed(0)}k`;
    }
    return `$${val}`;
  };

  // 2. Calculate Doctor Performance dynamically
  const getDoctorPerformance = () => {
    return doctors.map(d => {
      const count = appointments.filter(a => a.doctorId === d.id && a.status === 'finalizada').length;
      return {
        name: d.name,
        color: d.color || 'var(--primary)',
        count
      };
    });
  };

  const doctorPerf = getDoctorPerformance();
  const hasPerfData = doctorPerf.some(dp => dp.count > 0);
  const maxCount = Math.max(...doctorPerf.map(dp => dp.count), 1);

  // 3. Calculate Top Procedures dynamically
  const getTopProcedures = () => {
    const activeAppts = appointments.filter(a => a.status !== 'cancelada');
    const counts: Record<string, { count: number; earnings: number }> = {};
    
    activeAppts.forEach(appt => {
      const code = appt.procedureCode;
      if (!counts[code]) {
        counts[code] = { count: 0, earnings: 0 };
      }
      counts[code].count += 1;
      counts[code].earnings += appt.paidAmount || 0;
    });
    
    return Object.entries(counts)
      .map(([code, data]) => {
        const proc = procedures.find(p => p.code === code);
        return {
          code,
          name: proc?.name || 'Tratamiento Desconocido',
          category: proc?.category || 'CONSULTAS',
          earnings: data.earnings,
          count: data.count
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  };

  const topProcedures = getTopProcedures();

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Overview indicators */}
      <div className="grid-3" style={{ gap: '20px' }}>
        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--secondary)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Recaudado Real Acumulado</span>
            <span className="kpi-value">${totalEarningsVal.toLocaleString('es-CO')}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--accent)' }}>
            <Users size={24} />
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Pacientes Registrados</span>
            <span className="kpi-value">{newPatientsCount}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--state-confirmada)' }}>
            <BarChart3 size={24} />
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Consultas Finalizadas</span>
            <span className="kpi-value">{activeApptsCount}</span>
          </div>
        </div>
      </div>

      {/* SVG Graphics section */}
      <div className="grid-2" style={{ gap: '28px' }}>
        
        {/* Income Growth Chart (SVG) */}
        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '340px' }}>
          <h3>Flujo de Caja Mensual</h3>
          <p className="text-muted" style={{ fontSize: '12px', marginTop: '-8px' }}>Evolución de cobros y facturas acumuladas (En miles de COP)</p>
          
          {!hasFinancialData ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-light)', gap: '8px' }}>
              <TrendingUp size={48} style={{ opacity: 0.3 }} />
              <p style={{ fontSize: '13.5px' }}>No hay registros de ingresos para graficar este mes.</p>
            </div>
          ) : (
            <div style={{ width: '100%', height: '240px', marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
              <svg viewBox="0 0 500 220" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                {/* Grids and Axes */}
                <line x1="40" y1="20" x2="40" y2="180" stroke="var(--border-light)" strokeWidth="1" />
                <line x1="40" y1="180" x2="480" y2="180" stroke="var(--border-light)" strokeWidth="1" />
                
                <line x1="40" y1="140" x2="480" y2="140" stroke="var(--bg-app)" strokeWidth="1" strokeDasharray="4" />
                <line x1="40" y1="100" x2="480" y2="100" stroke="var(--bg-app)" strokeWidth="1" strokeDasharray="4" />
                <line x1="40" y1="60" x2="480" y2="60" stroke="var(--bg-app)" strokeWidth="1" strokeDasharray="4" />
                
                <path 
                  d={pathD} 
                  fill="none" 
                  stroke="var(--secondary)" 
                  strokeWidth="3.5" 
                  strokeLinecap="round" 
                />
                
                <path 
                  d={fillD} 
                  fill="rgba(2, 132, 199, 0.05)" 
                />

                {/* Data points */}
                {linePoints.map((p, idx) => (
                  <circle key={idx} cx={p.x} cy={p.y} r="5" fill="var(--secondary)" stroke="white" strokeWidth="2" />
                ))}

                {/* Text labels */}
                {monthlyIncomes.map((m, idx) => (
                  <text key={idx} x={60 + idx * 100} y="200" fontSize="10" fill="var(--text-light)" textAnchor="middle">{m.name}</text>
                ))}
                
                <text x="30" y="145" fontSize="9" fill="var(--text-light)" textAnchor="end">{formatYLabel(maxIncome * 0.28)}</text>
                <text x="30" y="105" fontSize="9" fill="var(--text-light)" textAnchor="end">{formatYLabel(maxIncome * 0.57)}</text>
                <text x="30" y="55" fontSize="9" fill="var(--text-light)" textAnchor="end">{formatYLabel(maxIncome * 0.85)}</text>
              </svg>
            </div>
          )}
        </div>

        {/* Doctor efficiency stats (SVG Bar Chart) */}
        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '340px' }}>
          <h3>Rendimiento y Consultas por Especialista</h3>
          <p className="text-muted" style={{ fontSize: '12px', marginTop: '-8px' }}>Cantidad de citas finalizadas exitosamente este mes</p>
          
          {!hasPerfData ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-light)', gap: '8px' }}>
              <BarChart3 size={48} style={{ opacity: 0.3 }} />
              <p style={{ fontSize: '13.5px' }}>No hay consultas finalizadas este mes para graficar.</p>
            </div>
          ) : (
            <div style={{ width: '100%', height: '240px', marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
              <svg viewBox="0 0 500 220" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                {/* Axes */}
                <line x1="50" y1="20" x2="50" y2="180" stroke="var(--border-light)" strokeWidth="1" />
                <line x1="50" y1="180" x2="480" y2="180" stroke="var(--border-light)" strokeWidth="1" />
                
                {/* Bars */}
                {doctorPerf.map((dp, idx) => {
                  const step = 430 / doctorPerf.length;
                  const barWidth = Math.min(34, step * 0.5);
                  const x = 50 + step * idx + (step - barWidth) / 2;
                  const h = (dp.count / maxCount) * 140;
                  const y = 180 - h;
                  
                  return (
                    <g key={idx}>
                      <rect x={x} y={y} width={barWidth} height={h} rx="4" fill={dp.color} />
                      <text x={x + barWidth / 2} y="198" fontSize="10" fill="var(--text-muted)" textAnchor="middle" fontWeight="600">
                        {dp.name.replace(/^(Dr\.|Dra\.)\s+/i, '').split(' ')[0]}
                      </text>
                      <text x={x + barWidth / 2} y={y - 8} fontSize="11" fill="var(--text-main)" textAnchor="middle" fontWeight="700">{dp.count}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </div>

      </div>

      {/* Procedures efficiency lists */}
      <div className="premium-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3>Tratamientos Odontológicos Más Realizados</h3>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '6px 12px', fontSize: '12px', gap: '6px' }} 
            onClick={() => showToast('Exportando informe consolidado Excel...', 'info')}
            disabled={topProcedures.length === 0}
          >
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
              {topProcedures.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '24px' }} className="text-muted">
                    No hay datos de tratamientos ejecutados aún en el sistema.
                  </td>
                </tr>
              ) : (
                topProcedures.map(tp => (
                  <tr key={tp.code}>
                    <td><strong>{tp.code}</strong></td>
                    <td>{tp.name}</td>
                    <td>
                      <span className="badge badge-confirmada" style={{ fontSize: '9px' }}>
                        {tp.category.split(' ')[0]}
                      </span>
                    </td>
                    <td>${tp.earnings.toLocaleString('es-CO')}</td>
                    <td><strong>{tp.count} ejecuciones</strong></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
