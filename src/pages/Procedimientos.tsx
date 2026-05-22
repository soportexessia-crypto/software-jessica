import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Procedure } from '../context/AppContext';
import { Search, Star, Clock, Stethoscope, AlertTriangle, Plus, X, Edit3 } from 'lucide-react';

export const Procedimientos: React.FC = () => {
  const { procedures, doctors, showToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProc, setEditingProc] = useState<Procedure | null>(null);

  // Form states
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<Procedure['category']>('CONSULTAS');
  const [formDuration, setFormDuration] = useState<number | ''>(30);
  const [formPrice, setFormPrice] = useState<number | ''>(0);
  const [formColor, setFormColor] = useState('azul');
  const [formSpecialist, setFormSpecialist] = useState('Todos');
  const [formAlert, setFormAlert] = useState('');
  const [formFavorite, setFormFavorite] = useState(false);

  const categories = [
    'TODOS',
    'CONSULTAS',
    'LIMPIEZA Y PREVENCIÓN',
    'RADIOLOGÍA',
    'ORTODONCIA',
    'CIRUGÍA',
    'RESTAURACIÓN Y ESTÉTICA',
    'PRÓTESIS Y REHABILITACIÓN'
  ];

  const handleOpenEdit = (proc: Procedure) => {
    setEditingProc(proc);
    setFormCode(proc.code);
    setFormName(proc.name);
    setFormCategory(proc.category);
    setFormDuration(proc.duration);
    setFormPrice(proc.price);
    setFormColor(proc.color);
    setFormSpecialist(proc.specialist);
    setFormAlert(proc.alert || '');
    setFormFavorite(!!proc.favorite);
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingProc(null);
    setFormCode(`PROC-${procedures.length + 10}`);
    setFormName('');
    setFormCategory('CONSULTAS');
    setFormDuration(30);
    setFormPrice('');
    setFormColor('azul');
    setFormSpecialist('Todos');
    setFormAlert('');
    setFormFavorite(false);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalDuration = formDuration === '' ? 30 : formDuration;
    const finalPrice = formPrice === '' ? 0 : formPrice;

    if (editingProc) {
      editingProc.name = formName;
      editingProc.category = formCategory;
      editingProc.duration = finalDuration;
      editingProc.price = finalPrice;
      editingProc.color = formColor;
      editingProc.specialist = formSpecialist;
      editingProc.alert = formAlert || undefined;
      editingProc.favorite = formFavorite;
      showToast('Tratamiento actualizado.', 'success');
    } else {
      procedures.push({
        code: formCode,
        name: formName,
        category: formCategory,
        duration: finalDuration,
        price: finalPrice,
        color: formColor,
        specialist: formSpecialist,
        alert: formAlert || undefined,
        favorite: formFavorite
      });
      showToast('Nuevo tratamiento creado.', 'success');
    }
    
    setIsModalOpen(false);
  };

  const filteredProcedures = procedures.filter(proc => {
    const matchesSearch = 
      proc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      proc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proc.category.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = selectedCategory === 'TODOS' || proc.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const favoriteProcedures = procedures.filter(p => p.favorite);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Search and Categories bar */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '16px',
          backgroundColor: 'white',
          padding: '16px 24px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Autocompletado inteligente (Escriba 'orto', 'res', 'con')..." 
            style={{ width: '100%', paddingLeft: '36px', height: '38px', borderRadius: 'var(--radius-md)' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--text-light)' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>Categoría:</span>
          <select 
            className="form-select"
            style={{ padding: '6px 12px', minWidth: '180px', margin: 0 }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={16} /> Agregar Tratamiento
        </button>
      </div>

      {/* Pinned Favorites */}
      {favoriteProcedures.length > 0 && !searchQuery && selectedCategory === 'TODOS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Star size={16} fill="var(--state-pendiente)" style={{ color: 'var(--state-pendiente)' }} />
            TRATAMIENTOS FAVORITOS (ACCESO RÁPIDO)
          </div>
          <div className="grid-3" style={{ gap: '20px' }}>
            {favoriteProcedures.map(proc => (
              <div 
                key={proc.code} 
                className="premium-card" 
                style={{ 
                  borderLeft: `5px solid var(--primary)`, 
                  position: 'relative', 
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
                onClick={() => handleOpenEdit(proc)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-light)' }}>{proc.code}</span>
                  <span className="badge badge-confirmada" style={{ fontSize: '9px', padding: '1px 6px' }}>{proc.category}</span>
                </div>
                <h3 style={{ fontSize: '15px', color: 'var(--text-main)' }}>{proc.name}</h3>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12}/> {proc.duration} min</span>
                  <strong style={{ color: 'var(--secondary)', fontSize: '14px' }}>${proc.price.toLocaleString('es-CO')}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Catalog grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>Catálogo de Procedimientos</h2>
        
        <div className="grid-4" style={{ gap: '20px' }}>
          {filteredProcedures.map(proc => {
            const specDoc = doctors.find(d => d.id === proc.specialist);
            return (
              <div 
                key={proc.code} 
                className="premium-card" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-light)' }}>{proc.code}</span>
                  <span className="badge" style={{ fontSize: '9px', padding: '1px 6px', backgroundColor: 'var(--bg-app)', color: 'var(--text-muted)' }}>{proc.category}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 0 }}>
                  <h3 style={{ fontSize: '14px', flex: 1, minWidth: 0, lineHeight: '1.3' }}>{proc.name}</h3>
                  {proc.favorite && <Star size={12} fill="var(--state-pendiente)" style={{ color: 'var(--state-pendiente)', marginLeft: '8px', flexShrink: 0 }} />}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12}/> {proc.duration} min</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Stethoscope size={12}/> {specDoc ? specDoc.name.split(' ')[1] : 'General'}
                  </span>
                </div>

                <div 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    borderTop: '1px solid var(--border-light)', 
                    paddingTop: '10px',
                    marginTop: '4px'
                  }}
                >
                  <strong style={{ color: 'var(--secondary)', fontSize: '15px' }}>${proc.price.toLocaleString('es-CO')} COP</strong>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px' }}
                    onClick={() => handleOpenEdit(proc)}
                  >
                    <Edit3 size={11} /> Config
                  </button>
                </div>

                {proc.alert && (
                  <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--state-pendiente-bg)', color: 'var(--state-pendiente)', padding: '6px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: 600 }}>
                    <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{proc.alert}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CONFIGURATION MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}>
          <div className="modal-content fade-in" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>{editingProc ? 'Editar Tratamiento' : 'Registrar Nuevo Tratamiento'}</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Código del Procedimiento *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      disabled={!!editingProc}
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Categoría *</label>
                    <select 
                      className="form-select"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                    >
                      {categories.filter(c => c !== 'TODOS').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Nombre del Tratamiento *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ej: Resina Simple Oclusal"
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Duración (minutos) *</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      required 
                      min={5}
                      max={360}
                      value={formDuration}
                      onChange={(e) => setFormDuration(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Precio base ($ COP) *</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      required 
                      min={0}
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Odontólogo Autorizado / Especialista</label>
                  <select 
                    className="form-select"
                    value={formSpecialist}
                    onChange={(e) => setFormSpecialist(e.target.value)}
                  >
                    <option value="Todos">Disponible para todos los Odontólogos</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Mensaje de Alerta Inteligente (Opcional)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formAlert}
                    onChange={(e) => setFormAlert(e.target.value)}
                    placeholder="Ej: Requiere radiografía previa"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', fontWeight: 600 }}>
                    <input 
                      type="checkbox" 
                      checked={formFavorite}
                      onChange={(e) => setFormFavorite(e.target.checked)}
                    />
                    Fijar en Favoritos (Acceso Rápido)
                  </label>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Tratamiento</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
