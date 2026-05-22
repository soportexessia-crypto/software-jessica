import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { FinancialRecord } from '../context/AppContext';
import { 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  FileText, 
  CheckCircle,
  Plus, 
  X,
  Printer,
  Download
} from 'lucide-react';

export const Caja: React.FC = () => {
  const { financials, patients, appointments, procedures, addFinancialRecord, getPatientById, showToast } = useApp();
  
  // Modal state
  const [selectedRecordForInvoice, setSelectedRecordForInvoice] = useState<FinancialRecord | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Form states (Income)
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedApptId, setSelectedApptId] = useState('');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<FinancialRecord['method']>('Efectivo');
  const [payNotes, setPayNotes] = useState('');

  // Form states (Expense)
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseNotes, setExpenseNotes] = useState('');
  const todayStr = new Date().toISOString().split('T')[0];
  const [expenseDate, setExpenseDate] = useState(todayStr);
  const [expenseMethod, setExpenseMethod] = useState<FinancialRecord['method']>('Efectivo');
  const [expensePhoto, setExpensePhoto] = useState<string | null>(null);

  // Daily statistics
  const totalIncomes = financials
    .filter(f => f.type === 'Ingreso')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalExpenses = financials
    .filter(f => f.type === 'Egreso')
    .reduce((sum, r) => sum + r.amount, 0);

  const netBalance = totalIncomes - totalExpenses;

  const totalCard = financials.filter(f => f.method === 'Tarjeta').reduce((sum, r) => sum + (r.type === 'Ingreso' ? r.amount : -r.amount), 0);
  const totalNequi = financials.filter(f => f.method === 'Nequi').reduce((sum, r) => sum + (r.type === 'Ingreso' ? r.amount : -r.amount), 0);
  const totalDaviplata = financials.filter(f => f.method === 'Daviplata').reduce((sum, r) => sum + (r.type === 'Ingreso' ? r.amount : -r.amount), 0);
  const totalEfectivo = financials.filter(f => f.method === 'Efectivo').reduce((sum, r) => sum + (r.type === 'Ingreso' ? r.amount : -r.amount), 0);
  const totalTransfer = financials.filter(f => f.method === 'Transferencia').reduce((sum, r) => sum + (r.type === 'Ingreso' ? r.amount : -r.amount), 0);

  // Filter patients with debt
  const patientsWithDebt = patients.filter(p => p.debt > 0);
  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  
  // Filter patient's pending appointments
  const pendingAppts = selectedPatientId 
    ? appointments.filter(a => a.patientId === selectedPatientId && a.paymentStatus !== 'pagado' && a.status !== 'cancelada')
    : [];

  // Auto populate amount based on chosen appointment
  const handleApptChange = (apptId: string) => {
    setSelectedApptId(apptId);
    const appt = appointments.find(a => a.id === apptId);
    if (appt) {
      const proc = procedures.find(p => p.code === appt.procedureCode);
      const price = proc ? proc.price : 0;
      setPayAmount(price - appt.paidAmount);
    }
  };

  const handleRegisterPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || payAmount <= 0) {
      showToast('Por favor complete los campos obligatorios.', 'warning');
      return;
    }

    addFinancialRecord({
      patientId: selectedPatientId,
      appointmentId: selectedApptId || undefined,
      amount: payAmount,
      method: payMethod,
      type: 'Ingreso',
      notes: payNotes || `Abono registrado en caja.`
    });

    setIsPayModalOpen(false);
    setSelectedPatientId('');
    setSelectedApptId('');
    setPayAmount(0);
    setPayNotes('');
    showToast('Ingreso a caja registrado exitosamente.', 'success');
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setExpensePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegisterExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseAmount <= 0 || !expenseNotes || !expenseDate) {
      showToast('Por favor complete los campos obligatorios.', 'warning');
      return;
    }

    addFinancialRecord({
      amount: expenseAmount,
      method: expenseMethod,
      type: 'Egreso',
      notes: expenseNotes,
      date: expenseDate,
      receiptPhoto: expensePhoto || undefined
    });

    setIsExpenseModalOpen(false);
    setExpenseAmount(0);
    setExpenseNotes('');
    setExpenseDate(todayStr);
    setExpensePhoto(null);
    showToast('Salida de caja (gasto) registrada exitosamente.', 'success');
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Financial console KPIs */}
      <div className="kpi-container">
        
        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--state-confirmada-bg)', color: 'var(--state-confirmada)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Recaudo Diario (Ingresos)</span>
            <span className="kpi-value">${totalIncomes.toLocaleString('es-CO')}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--state-cancelada-bg)', color: 'var(--state-cancelada)' }}>
            <TrendingUp size={24} style={{ transform: 'rotate(180deg)' }} />
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Gastos Diarios (Egresos)</span>
            <span className="kpi-value">${totalExpenses.toLocaleString('es-CO')}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
            <DollarSign size={24} />
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Balance Neto de Caja</span>
            <span className="kpi-value">${netBalance.toLocaleString('es-CO')}</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'var(--bg-hover)', color: '#0f766e' }}>
            <DollarSign size={24} />
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Efectivo en Caja</span>
            <span className="kpi-value">${totalEfectivo.toLocaleString('es-CO')}</span>
          </div>
        </div>

      </div>

      {/* Grid: Payments register & transactions list */}
      <div className="grid-12">
        
        {/* Transaction History list */}
        <div className="cash-history-col premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <h2>Historial de Transacciones de Caja</h2>
            <div style={{ display: 'flex', gap: '10px' }} className="cash-actions-container">
              <button className="btn btn-primary" onClick={() => setIsPayModalOpen(true)}>
                <Plus size={16} /> Registrar Entrada / Ingreso
              </button>
              <button 
                className="btn" 
                style={{ 
                  backgroundColor: 'var(--state-cancelada-bg)', 
                  color: 'var(--state-cancelada)', 
                  border: '1px solid #fca5a5' 
                }} 
                onClick={() => setIsExpenseModalOpen(true)}
              >
                <Plus size={16} /> Registrar Salida / Gasto
              </button>
            </div>
          </div>

          <div className="premium-table-container">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Fecha/Hora</th>
                  <th>Detalle / Paciente</th>
                  <th>Método</th>
                  <th>Monto ($ COP)</th>
                  <th>Soporte / Factura</th>
                </tr>
              </thead>
              <tbody>
                {financials.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '24px' }} className="text-muted">
                      No hay transacciones registradas hoy.
                    </td>
                  </tr>
                ) : (
                  financials.map(rec => {
                    const isIncome = rec.type === 'Ingreso';
                    const pat = rec.patientId ? getPatientById(rec.patientId) : undefined;
                    return (
                      <tr key={rec.id}>
                        <td>{rec.date}</td>
                        <td>
                          {isIncome ? (
                            <strong>{pat?.name || 'Abono General'}</strong>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span className="badge badge-cancelada" style={{ fontSize: '9px', padding: '1px 5px', width: 'fit-content', fontWeight: 700, borderRadius: '4px' }}>GASTO / EGRESO</span>
                              <span style={{ fontSize: '13px', fontWeight: 600 }}>{rec.notes}</span>
                            </div>
                          )}
                        </td>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                            <CreditCard size={12} className="text-light" />
                            {rec.method}
                          </span>
                        </td>
                        <td style={{ 
                          color: isIncome ? 'var(--state-confirmada)' : 'var(--state-cancelada)', 
                          fontWeight: 700 
                        }}>
                          {isIncome ? '+' : '-'}${rec.amount.toLocaleString('es-CO')}
                        </td>
                        <td>
                          <button 
                            className="btn btn-secondary" 
                            style={{ 
                              padding: '4px 10px', 
                              fontSize: '11px', 
                              gap: '4px',
                              borderColor: isIncome ? 'var(--border-light)' : '#fca5a5',
                              backgroundColor: isIncome ? 'var(--bg-hover)' : 'var(--state-cancelada-bg)',
                              color: isIncome ? 'var(--text-main)' : 'var(--state-cancelada)'
                            }}
                            onClick={() => setSelectedRecordForInvoice(rec)}
                          >
                            <FileText size={11} /> {isIncome ? 'Ver Recibo' : 'Ver Soporte'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payments stats breakdown panel */}
        <div className="cash-stats-col premium-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2>Desglose por Método de Pago</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
              <span>Efectivo:</span>
              <strong>${totalEfectivo.toLocaleString('es-CO')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
              <span>Tarjeta Crédito/Débito:</span>
              <strong>${totalCard.toLocaleString('es-CO')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
              <span>Nequi:</span>
              <strong>${totalNequi.toLocaleString('es-CO')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
              <span>Daviplata:</span>
              <strong>${totalDaviplata.toLocaleString('es-CO')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px' }}>
              <span>Transferencia Bancaria:</span>
              <strong>${totalTransfer.toLocaleString('es-CO')}</strong>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--bg-hover)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', fontSize: '11.5px', marginTop: '10px', color: 'var(--text-muted)' }}>
            <strong>Cierre de Caja Diario:</strong> <br/>
            Al final del turno, la secretaria debe contrastar el saldo en Efectivo con los recibos físicos generados y la planilla digital antes del arqueo.
          </div>
        </div>

      </div>

      {/* POPUP MODAL: REGISTRAR PAGO RECIBIDO */}
      {isPayModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsPayModalOpen(false)}>
          <div className="modal-content fade-in" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2>Registrar Pago Recibido</h2>
              <button className="close-btn" onClick={() => setIsPayModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleRegisterPayment}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                <div className="form-group">
                  <label className="form-label">Paciente (Deudores Activos) *</label>
                  <select 
                    className="form-select" 
                    required 
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                  >
                    <option value="">-- Seleccionar Paciente --</option>
                    {patientsWithDebt.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Saldo: ${p.debt.toLocaleString('es-CO')})</option>
                    ))}
                  </select>
                </div>

                {selectedPatientId && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Cita o Tratamiento Vinculado</label>
                      <select 
                        className="form-select"
                        value={selectedApptId}
                        onChange={(e) => handleApptChange(e.target.value)}
                      >
                        <option value="">-- Pago General / Abono voluntario --</option>
                        {pendingAppts.map(a => {
                          const proc = procedures.find(p => p.code === a.procedureCode);
                          return (
                            <option key={a.id} value={a.id}>
                              {a.date} - {proc?.name} (Debe: ${(proc ? proc.price - a.paidAmount : 0).toLocaleString('es-CO')})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Monto del Recibo ($ COP) *</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        required 
                        min={100}
                        max={selectedPatient?.debt}
                        value={payAmount || ''}
                        onChange={(e) => setPayAmount(Number(e.target.value))}
                        placeholder="Monto a registrar"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Método de Recibo *</label>
                      <select 
                        className="form-select"
                        value={payMethod}
                        onChange={(e) => setPayMethod(e.target.value as any)}
                      >
                        <option value="Efectivo">Efectivo</option>
                        <option value="Tarjeta">Tarjeta de Crédito/Débito</option>
                        <option value="Nequi">Nequi</option>
                        <option value="Daviplata">Daviplata</option>
                        <option value="Transferencia">Transferencia</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Notas o Detalle de Caja</label>
                      <input 
                        type="text" 
                        className="form-input"
                        placeholder="Ej: Abono de tratamiento estético"
                        value={payNotes}
                        onChange={(e) => setPayNotes(e.target.value)}
                      />
                    </div>
                  </>
                )}

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsPayModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar Caja</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: REGISTRAR EGRESO / GASTO */}
      {isExpenseModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setIsExpenseModalOpen(false)}>
          <div className="modal-content fade-in" style={{ maxWidth: '450px' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #fca5a5' }}>
              <h2 style={{ color: 'var(--state-cancelada)' }}>Registrar Egreso / Gasto</h2>
              <button className="close-btn" onClick={() => setIsExpenseModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleRegisterExpense}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                <div className="form-group">
                  <label className="form-label">Fecha del Gasto *</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    required 
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Concepto o Descripción del Gasto *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required
                    placeholder="Ej: Servicios, insumos, arriendo, papelería"
                    value={expenseNotes}
                    onChange={(e) => setExpenseNotes(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Monto del Egreso ($ COP) *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    required 
                    min={100}
                    value={expenseAmount || ''}
                    onChange={(e) => setExpenseAmount(Number(e.target.value))}
                    placeholder="Monto a retirar de caja"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Método de Pago Utilizado *</label>
                  <select 
                    className="form-select"
                    value={expenseMethod}
                    onChange={(e) => setExpenseMethod(e.target.value as any)}
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta de Crédito/Débito</option>
                    <option value="Nequi">Nequi</option>
                    <option value="Daviplata">Daviplata</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Foto del Comprobante / Soporte</label>
                  
                  {!expensePhoto ? (
                    <div style={{
                      border: '2px dashed var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      padding: '20px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: 'var(--bg-app)',
                      transition: 'all 0.2s ease',
                    }}
                    onClick={() => document.getElementById('expense-photo-input')?.click()}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--state-cancelada)'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-light)'}
                    >
                      <input 
                        type="file" 
                        id="expense-photo-input"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handlePhotoChange}
                      />
                      <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                        Subir Foto o Escáner de Comprobante
                      </span>
                      <span style={{ display: 'block', fontSize: '10.5px', color: 'var(--text-light)', marginTop: '4px' }}>
                        Formatos: JPG, PNG. Máximo 5MB
                      </span>
                    </div>
                  ) : (
                    <div style={{
                      position: 'relative',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      backgroundColor: 'var(--bg-app)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '10px'
                    }}>
                      <img 
                        src={expensePhoto} 
                        alt="Vista previa" 
                        style={{ maxWidth: '100%', maxHeight: '120px', objectFit: 'contain', borderRadius: '4px' }}
                      />
                      <button 
                        type="button"
                        className="close-btn"
                        style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          backgroundColor: 'rgba(220, 38, 38, 0.9)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        onClick={() => setExpensePhoto(null)}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>

              </div>
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-light)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsExpenseModalOpen(false)}>Cancelar</button>
                <button 
                  type="submit" 
                  className="btn"
                  style={{ backgroundColor: 'var(--state-cancelada)', color: 'white' }}
                >
                  Registrar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: INVOICE / RECIBO IMPRIMIBLE PREMIUM */}
      {selectedRecordForInvoice && (() => {
        const isIncome = selectedRecordForInvoice.type === 'Ingreso';
        return (
          <div className="modal-overlay" onClick={() => setSelectedRecordForInvoice(null)}>
            <div className="modal-content fade-in" style={{ maxWidth: '500px', padding: 0, borderRadius: '18px', overflow: 'hidden' }}>
              
              {/* Professional Header mockup */}
              <div style={{ 
                backgroundColor: isIncome ? 'var(--primary-light)' : 'var(--state-cancelada-bg)', 
                borderBottom: '1px solid ' + (isIncome ? 'var(--border-light)' : '#fca5a5'), 
                padding: '24px 32px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <div>
                  <div style={{ 
                    fontSize: '11px', 
                    fontWeight: 700, 
                    color: isIncome ? 'var(--primary)' : 'var(--state-cancelada)', 
                    textTransform: 'uppercase', 
                    letterSpacing: '1px' 
                  }}>
                    {isIncome ? 'RECIBO DE PAGO DIGITAL' : 'COMPROBANTE DE EGRESO DIGITAL'}
                  </div>
                  <h2 style={{ color: 'var(--text-main)', marginTop: '4px', fontSize: '20px' }}>Centro Odontológico Catalina EVA</h2>
                </div>
                <CheckCircle size={36} style={{ color: isIncome ? 'var(--state-confirmada)' : 'var(--state-cancelada)' }} />
              </div>

              <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '13px' }}>
                
                {/* Receipt metadata */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '14px' }}>
                  <div>
                    <span className="text-muted">{isIncome ? 'N° Recibo:' : 'N° Egreso:'}</span> <br/>
                    <strong>{isIncome ? 'REC-' : 'EGR-'}{selectedRecordForInvoice.id.toUpperCase()}</strong>
                  </div>
                  <div>
                    <span className="text-muted">Fecha:</span> <br/>
                    <strong>{selectedRecordForInvoice.date}</strong>
                  </div>
                </div>

                {/* Patient or general outflow info */}
                {isIncome ? (() => {
                  const pat = selectedRecordForInvoice.patientId ? getPatientById(selectedRecordForInvoice.patientId) : undefined;
                  return (
                    <div>
                      <span className="text-muted" style={{ fontSize: '11px', fontWeight: 700 }}>DATOS DEL PACIENTE:</span>
                      <div style={{ marginTop: '4px', fontSize: '13.5px' }}>
                        <strong>{pat?.name}</strong> <br/>
                        <span className="text-muted">C.C. {pat?.document} • Tlf: {pat?.phone}</span>
                      </div>
                    </div>
                  );
                })() : (
                  <div>
                    <span className="text-muted" style={{ fontSize: '11px', fontWeight: 700 }}>DETALLE DEL EGRESO:</span>
                    <div style={{ marginTop: '4px', fontSize: '13.5px' }}>
                      <strong>Administración de Caja - Centro Odontológico Catalina EVA</strong> <br/>
                      <span className="text-muted">Salida registrada por control interno de egresos diarios.</span>
                    </div>
                  </div>
                )}

                {/* Itemized cost structure */}
                <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '12px 16px', backgroundColor: 'var(--bg-app)' }}>
                  <span className="text-muted" style={{ fontSize: '11px', fontWeight: 700 }}>
                    {isIncome ? 'CONCEPTO DEL ABONO:' : 'CONCEPTO DEL GASTO:'}
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '13.5px' }}>
                    <span style={{ fontWeight: 500 }}>
                      {selectedRecordForInvoice.notes || (isIncome ? 'Abono general odontológico en caja' : 'Salida de caja general')}
                    </span>
                    <strong style={{ color: isIncome ? 'var(--text-main)' : 'var(--state-cancelada)' }}>
                      {isIncome ? '+' : '-'}${selectedRecordForInvoice.amount.toLocaleString('es-CO')} COP
                    </strong>
                  </div>
                </div>

                {/* Receipt Image Soporte preview */}
                {!isIncome && selectedRecordForInvoice.receiptPhoto && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span className="text-muted" style={{ fontSize: '11px', fontWeight: 700 }}>FOTO DE COMPROBANTE ADJUNTA:</span>
                    <div 
                      style={{ 
                        border: '1px solid var(--border-light)', 
                        borderRadius: 'var(--radius-md)', 
                        overflow: 'hidden', 
                        position: 'relative',
                        cursor: 'pointer',
                        maxHeight: '180px',
                        backgroundColor: 'var(--bg-hover)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const newTab = window.open();
                        if (newTab) {
                          newTab.document.write(`
                            <html>
                              <head>
                                <title>Comprobante de Egreso ${selectedRecordForInvoice.id.toUpperCase()}</title>
                                <style>
                                  body { margin: 0; background: #0f172a; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; color: white; }
                                  img { max-width: 95%; max-height: 90vh; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
                                  .btn-print { position: fixed; top: 20px; right: 20px; background: #0284c7; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; }
                                  .btn-print:hover { background: #0369a1; }
                                </style>
                              </head>
                              <body>
                                <button class="btn-print" onclick="window.print()">Imprimir Comprobante</button>
                                <img src="${selectedRecordForInvoice.receiptPhoto}" />
                              </body>
                            </html>
                          `);
                        }
                      }}
                    >
                      <img 
                        src={selectedRecordForInvoice.receiptPhoto} 
                        alt="Comprobante de Gasto" 
                        style={{ width: '100%', height: 'auto', maxHeight: '180px', objectFit: 'contain', display: 'block' }} 
                      />
                      <div style={{ 
                        position: 'absolute', 
                        bottom: 0, 
                        left: 0, 
                        right: 0, 
                        backgroundColor: 'rgba(15, 23, 42, 0.75)', 
                        color: 'white', 
                        fontSize: '10px', 
                        textAlign: 'center', 
                        padding: '4px',
                        fontWeight: 600
                      }}>
                        Haz clic para ver comprobante a pantalla completa
                      </div>
                    </div>
                  </div>
                )}

                {/* Method & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '14px' }}>
                  <div>
                    <span className="text-muted">{isIncome ? 'Método de Recibo:' : 'Método de Gasto:'}</span> <br/>
                    <strong>{selectedRecordForInvoice.method}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="text-muted">Estado:</span> <br/>
                    <span 
                      className={`badge ${isIncome ? 'badge-confirmada' : 'badge-cancelada'}`} 
                      style={{ fontSize: '10px', padding: '2px 8px', marginTop: '4px', borderRadius: '4px' }}
                    >
                      {isIncome ? 'INGRESADO CONCILIADO' : 'GASTO REGISTRADO'}
                    </span>
                  </div>
                </div>

              </div>

              <div className="modal-footer" style={{ backgroundColor: 'var(--bg-app)', borderTop: '1px solid var(--border-light)', padding: '16px 32px', gap: '8px' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                  onClick={() => { showToast('Simulación: Abriendo ventana de impresión del sistema...', 'info'); }}
                >
                  <Printer size={14} /> Imprimir {isIncome ? 'Recibo' : 'Soporte'}
                </button>
                <button 
                  className="btn btn-primary" 
                  style={{ 
                    flex: 1, 
                    padding: '8px', 
                    fontSize: '12px',
                    backgroundColor: isIncome ? 'var(--primary)' : 'var(--state-cancelada)'
                  }}
                  onClick={() => { showToast('Simulación: Descargando PDF...', 'info'); }}
                >
                  <Download size={14} /> Guardar PDF
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};
