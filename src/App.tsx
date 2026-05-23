import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { SpotlightSearch } from './components/SpotlightSearch';
import { QuickAppointmentModal } from './components/QuickAppointmentModal';
import { Login } from './components/Login';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X, Download, Laptop, Smartphone } from 'lucide-react';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Agenda } from './pages/Agenda';
import { Pacientes } from './pages/Pacientes';
import { Procedimientos } from './pages/Procedimientos';
import { Doctores } from './pages/Doctores';
import { Caja } from './pages/Caja';
import { HistorialClinico } from './pages/HistorialClinico';
import { Reportes } from './pages/Reportes';
import { Configuracion } from './pages/Configuracion';

const MainAppContent: React.FC = () => {
  const [activeModule, setActiveModule] = useState<string>('Inicio');
  const [isQuickApptOpen, setIsQuickApptOpen] = useState(false);
  const { toasts, removeToast, isAuthenticated, loading } = useApp();

  const CLIENT_VERSION = '1.0.1';
  const [checkingVersion, setCheckingVersion] = useState(true);
  const [isForceUpdateRequired, setIsForceUpdateRequired] = useState(false);
  const [isLiveUpdating, setIsLiveUpdating] = useState(false);
  const [versionConfig, setVersionConfig] = useState<any>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'completed' | 'error'>('idle');
  const [downloadSpeed, setDownloadSpeed] = useState<string>('');
  const [downloadedBytes, setDownloadedBytes] = useState<string>('');

  React.useEffect(() => {
    const isVersionLower = (current: string, target: string): boolean => {
      const currentParts = current.split('.').map(Number);
      const targetParts = target.split('.').map(Number);
      for (let i = 0; i < Math.max(currentParts.length, targetParts.length); i++) {
        const c = currentParts[i] || 0;
        const t = targetParts[i] || 0;
        if (c < t) return true;
        if (c > t) return false;
      }
      return false;
    };

    const checkVersion = async (isPoll = false) => {
      try {
        const { api } = await import('./services/api');
        const config = await api.get('/system/version');
        setVersionConfig(config);

        if (isVersionLower(CLIENT_VERSION, config.minVersion)) {
          setIsForceUpdateRequired(true);
        } else if (isVersionLower(CLIENT_VERSION, config.latestVersion)) {
          // Si detectamos una versión superior a la cargada en memoria, disparamos la actualización en caliente
          setIsLiveUpdating(true);
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        }
      } catch (err) {
        console.warn('Fallo en verificación de versión (modo offline o servidor inaccesible):', err);
      } finally {
        if (!isPoll) {
          setCheckingVersion(false);
        }
      }
    };

    // Consultar de inmediato al iniciar
    checkVersion();

    // Sondeo periódico cada 45 segundos para detectar nuevos deploys en Railway en caliente
    const intervalId = setInterval(() => {
      checkVersion(true);
    }, 45000);

    return () => clearInterval(intervalId);
  }, []);

  // Global search navigation callback
  const handleSpotlightNavigation = (module: string, param?: string) => {
    setActiveModule(module);
    if (module === 'Pacientes' && param) {
      // The state selected patient will be handled by the click inside Spotlight
      // We force page rerender. In a real-world setting we can pass parameter
    }
  };

  const renderActivePage = () => {
    switch (activeModule) {
      case 'Inicio':
        return <Dashboard onNavigateToModule={handleSpotlightNavigation} />;
      case 'Agenda':
        return <Agenda />;
      case 'Pacientes':
        return <Pacientes />;
      case 'Procedimientos':
        return <Procedimientos />;
      case 'Doctores':
        return <Doctores />;
      case 'Caja':
        return <Caja />;
      case 'Historial Clínico':
        return <HistorialClinico />;
      case 'Reportes':
        return <Reportes />;
      case 'Configuración':
        return <Configuracion />;
      default:
        return <Dashboard onNavigateToModule={handleSpotlightNavigation} />;
    }
  };

  if (loading || checkingVersion || isLiveUpdating) {
    return (
      <div className="app-loading-screen">
        <img src="img/Logo.png" alt="XESSIA" className="app-loading-logo" />
        <div className="app-loading-spinner"></div>
        <div className="app-loading-text">
          {isLiveUpdating 
            ? 'Nueva versión de XESSIA detectada. Aplicando actualizaciones en vivo...' 
            : 'Conectando a XESSIA Cloud...'}
        </div>
      </div>
    );
  }

  if (isForceUpdateRequired && versionConfig) {
    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroid = /android/i.test(userAgent) || /mobile/i.test(userAgent);
    const isPC = !isAndroid;

    const handleStartDownload = async (url: string, filename: string) => {
      try {
        setDownloadState('downloading');
        setDownloadProgress(0);
        setDownloadedBytes('0.0 MB');
        setDownloadSpeed('Conectando...');
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to download update file');
        
        const contentLength = response.headers.get('content-length');
        if (!contentLength) {
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
          setDownloadProgress(100);
          setDownloadState('completed');
          return;
        }
        
        const totalBytes = parseInt(contentLength, 10);
        let loadedBytes = 0;
        
        const reader = response.body?.getReader();
        if (!reader) throw new Error('Reader not supported');
        
        const chunks: Uint8Array[] = [];
        const startTime = Date.now();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          chunks.push(value);
          loadedBytes += value.length;
          
          const progress = Math.round((loadedBytes / totalBytes) * 100);
          setDownloadProgress(progress);
          setDownloadedBytes(`${(loadedBytes / (1024 * 1024)).toFixed(1)} MB / ${(totalBytes / (1024 * 1024)).toFixed(1)} MB`);
          
          const elapsedSeconds = (Date.now() - startTime) / 1000;
          if (elapsedSeconds > 0) {
            const speedMbps = ((loadedBytes * 8) / (1024 * 1024)) / elapsedSeconds;
            setDownloadSpeed(`${speedMbps.toFixed(1)} Mbps`);
          }
        }
        
        const blob = new Blob(chunks as any);
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        
        setDownloadState('completed');
        setDownloadProgress(100);
      } catch (err) {
        console.error('Download update error:', err);
        setDownloadState('error');
        setDownloadProgress(null);
      }
    };

    return (
      <div className="update-block-screen">
        <div className="update-block-container" style={{ maxWidth: '500px' }}>
          <img src="img/Logo.png" alt="XESSIA" className="update-block-logo" />
          
          <div className="update-block-icon">
            <AlertTriangle size={32} />
          </div>

          <h2 className="update-block-title">Actualización Obligatoria</h2>
          
          <p className="update-block-desc" style={{ marginBottom: '20px' }}>
            Hemos realizado mejoras críticas de seguridad y rendimiento en XESSIA Cloud. 
            Para continuar garantizando la integridad de tus datos clínicos, debes actualizar la aplicación.
          </p>

          <div className="update-block-versions" style={{ marginBottom: '24px' }}>
            <div className="update-version-tag current">
              Versión instalada: <strong>v{CLIENT_VERSION}</strong>
            </div>
            <div className="update-version-divider"></div>
            <div className="update-version-tag required">
              Versión requerida: <strong>v{versionConfig.minVersion}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {isPC ? (
              /* Windows Download Card */
              <div 
                className="update-download-card recommended"
                style={{ cursor: downloadState === 'downloading' ? 'default' : 'pointer', width: '100%', maxWidth: '380px' }}
                onClick={() => {
                  if (downloadState !== 'downloading') {
                    handleStartDownload(versionConfig.downloadWindows, 'XESSIA_Setup.exe');
                  }
                }}
              >
                <span className="update-recommendation-badge">PC de la Clínica</span>
                <div className="update-card-icon">
                  <Laptop size={24} />
                </div>
                <h3 className="update-card-title">XESSIA para Windows</h3>
                <p className="update-card-desc">
                  Instalador ejecutable de escritorio (.exe) para actualizar la aplicación.
                </p>
                
                {downloadState === 'idle' && (
                  <button className="update-download-btn">
                    <Download size={14} /> Actualizar Ahora
                  </button>
                )}
                
                {downloadState === 'downloading' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>Descargando: {downloadProgress}%</span>
                      <span>{downloadSpeed}</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${downloadProgress}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '3px', transition: 'width 0.1s ease' }}></div>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-light)', textAlign: 'right' }}>{downloadedBytes}</span>
                  </div>
                )}
                
                {downloadState === 'completed' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', textAlign: 'center', color: '#10b981' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>✓ Descarga Completada</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Abra el archivo "XESSIA_Setup.exe" en su carpeta de descargas para aplicar la actualización.</span>
                  </div>
                )}
                
                {downloadState === 'error' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', textAlign: 'center', color: '#ef4444' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>⚠ Error en la descarga</span>
                    <button className="btn" style={{ fontSize: '11px', padding: '4px 10px', marginTop: '4px' }} onClick={(e) => { e.stopPropagation(); handleStartDownload(versionConfig.downloadWindows, 'XESSIA_Setup.exe'); }}>Reintentar descarga</button>
                  </div>
                )}
              </div>
            ) : (
              /* Android Download Card */
              <div 
                className="update-download-card recommended"
                style={{ cursor: downloadState === 'downloading' ? 'default' : 'pointer', width: '100%', maxWidth: '380px' }}
                onClick={() => {
                  if (downloadState !== 'downloading') {
                    handleStartDownload(versionConfig.downloadAndroid, 'XESSIA.apk');
                  }
                }}
              >
                <span className="update-recommendation-badge">Celular de la Clínica</span>
                <div className="update-card-icon">
                  <Smartphone size={24} />
                </div>
                <h3 className="update-card-title">XESSIA para Android</h3>
                <p className="update-card-desc">
                  Paquete de aplicación nativa (.apk) para instalar la actualización.
                </p>
                
                {downloadState === 'idle' && (
                  <button className="update-download-btn">
                    <Download size={14} /> Actualizar Ahora
                  </button>
                )}
                
                {downloadState === 'downloading' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>Descargando: {downloadProgress}%</span>
                      <span>{downloadSpeed}</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${downloadProgress}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '3px', transition: 'width 0.1s ease' }}></div>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-light)', textAlign: 'right' }}>{downloadedBytes}</span>
                  </div>
                )}
                
                {downloadState === 'completed' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', textAlign: 'center', color: '#10b981' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>✓ Descarga Completada</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Instale el archivo "XESSIA.apk" en su dispositivo para aplicar la actualización.</span>
                  </div>
                )}
                
                {downloadState === 'error' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', textAlign: 'center', color: '#ef4444' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>⚠ Error en la descarga</span>
                    <button className="btn" style={{ fontSize: '11px', padding: '4px 10px', marginTop: '4px' }} onClick={(e) => { e.stopPropagation(); handleStartDownload(versionConfig.downloadAndroid, 'XESSIA.apk'); }}>Reintentar descarga</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Login />
        {/* Floating Toast Notifications stack */}
        <div className="toast-container">
          {toasts.map(toast => {
            let Icon = Info;
            if (toast.type === 'success') Icon = CheckCircle;
            else if (toast.type === 'warning') Icon = AlertTriangle;
            else if (toast.type === 'error') Icon = AlertCircle;
            
            return (
              <div key={toast.id} className={`toast ${toast.type}`}>
                <div className={`toast-icon-wrapper ${toast.type}`}>
                  <Icon size={18} />
                </div>
                <div className="toast-message">{toast.message}</div>
                <button 
                  className="toast-close-btn" 
                  onClick={() => removeToast(toast.id)}
                  title="Cerrar"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </>
    );
  }

  return (
    <div className="app-container">
      {/* 1. Sidebar Nav */}
      <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} />

      {/* 2. Main Wrapper */}
      <div className="main-wrapper">
        
        {/* Header Tools */}
        <Header 
          activeModule={activeModule} 
          onQuickAppointmentClick={() => setIsQuickApptOpen(true)} 
        />

        {/* Dynamic Page Content */}
        <main className="page-content">
          {renderActivePage()}
        </main>
      </div>

      {/* 3. Global Spotlight Search Bar */}
      <SpotlightSearch onNavigate={handleSpotlightNavigation} />

      {/* 4. Global Quick Appointment Modal */}
      <QuickAppointmentModal 
        isOpen={isQuickApptOpen} 
        onClose={() => setIsQuickApptOpen(false)} 
      />

      {/* 5. Floating Toast Notifications stack */}
      <div className="toast-container">
        {toasts.map(toast => {
          let Icon = Info;
          if (toast.type === 'success') Icon = CheckCircle;
          else if (toast.type === 'warning') Icon = AlertTriangle;
          else if (toast.type === 'error') Icon = AlertCircle;
          
          return (
            <div key={toast.id} className={`toast ${toast.type}`}>
              <div className={`toast-icon-wrapper ${toast.type}`}>
                <Icon size={18} />
              </div>
              <div className="toast-message">{toast.message}</div>
              <button 
                className="toast-close-btn" 
                onClick={() => removeToast(toast.id)}
                title="Cerrar"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}

export default App;
