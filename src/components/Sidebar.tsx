import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Sliders, 
  Stethoscope, 
  DollarSign, 
  Activity, 
  FileBarChart, 
  Settings 
} from 'lucide-react';

interface SidebarProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeModule, setActiveModule }) => {

  const menuItems = [
    { name: 'Inicio', icon: <LayoutDashboard size={20} /> },
    { name: 'Agenda', icon: <Calendar size={20} /> },
    { name: 'Pacientes', icon: <Users size={20} /> },
    { name: 'Procedimientos', icon: <Sliders size={20} /> },
    { name: 'Doctores', icon: <Stethoscope size={20} /> },
    { name: 'Caja', icon: <DollarSign size={20} /> },
    { name: 'Historial Clínico', icon: <Activity size={20} /> },
    { name: 'Reportes', icon: <FileBarChart size={20} /> },
    { name: 'Configuración', icon: <Settings size={20} /> },
  ];

  return (
    <aside className="app-sidebar">
      <div className="sidebar-logo">
        {/* Desktop: isotipo + nombre de marca */}
        <div className="logo-full" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img 
            src="/img/Logo.png" 
            alt="XESSIA" 
            style={{ 
              height: '34px', 
              width: '34px',
              objectFit: 'contain',
              flexShrink: 0
            }} 
          />
          <span className="logo-text">XESSIA</span>
        </div>
        {/* Tablet/móvil: solo isotipo centrado */}
        <div className="logo-compact" style={{ width: '100%', justifyContent: 'center' }}>
          <div className="logo-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img 
              src="/img/Logo.png" 
              alt="XESSIA" 
              style={{ width: '28px', height: '28px', objectFit: 'contain' }} 
            />
          </div>
        </div>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => (
          <button
            key={item.name}
            className={`menu-item ${activeModule === item.name ? 'active' : ''}`}
            onClick={() => setActiveModule(item.name)}
          >
            {item.icon}
            <span>{item.name}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-badge">
          <div className="user-avatar" style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
            JR
          </div>
          <div className="user-info">
            <span className="user-name">Jessica Restrepo</span>
            <span className="user-role">Secretaria</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
