
import React, { useState, useMemo } from 'react';
import { CourtMovement, Client, UserSettings } from '../types';
import MovementSummaryModal from './MovementSummaryModal';

interface AgendaProps {
  movements: CourtMovement[];
  onAddMovement: (movement: CourtMovement) => void;
  onUpdateMovement?: (movement: CourtMovement) => void;
  clients: Client[];
  settings: UserSettings;
}

const Agenda: React.FC<AgendaProps> = ({ movements, onAddMovement, onUpdateMovement, clients, settings }) => {
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState<'MÊS' | 'SEMANA' | 'DIA'>('MÊS');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingMovementId, setEditingMovementId] = useState<string | null>(null);
  const [selectedMovement, setSelectedMovement] = useState<CourtMovement | null>(null);

  const [deadlinesPage, setDeadlinesPage] = useState(0);
  const deadlinesPerPage = 3;

  const [formData, setFormData] = useState({
    clientId: '',
    caseNumber: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    description: '',
    type: 'Deadline' as CourtMovement['type'],
    modality: 'Presencial' as CourtMovement['modality'],
    source: 'Lançamento Manual'
  });

  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (view === 'MÊS') newDate.setMonth(currentDate.getMonth() - 1);
    else if (view === 'SEMANA') newDate.setDate(currentDate.getDate() - 7);
    else newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'MÊS') newDate.setMonth(currentDate.getMonth() + 1);
    else if (view === 'SEMANA') newDate.setDate(currentDate.getDate() + 7);
    else newDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const handleToday = () => setCurrentDate(new Date());

  const handleSelectDay = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    setCurrentDate(date);
    setView('DIA');
  };

  const handleEditClick = (movement: CourtMovement) => {
    setEditingMovementId(movement.id);
    setFormData({
      clientId: movement.clientId || '',
      caseNumber: movement.caseNumber,
      date: movement.date,
      time: movement.time || '09:00',
      description: movement.description,
      type: movement.type,
      modality: movement.modality || 'Presencial',
      source: movement.source
    });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingMovementId(null);
    setFormData({
      clientId: '',
      caseNumber: '',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      description: '',
      type: 'Deadline',
      modality: 'Presencial',
      source: 'Lançamento Manual'
    });
  };

  const matchedClientName = useMemo(() => {
    if (!formData.caseNumber) return null;
    const client = clients.find(c => c.caseNumber.trim() === formData.caseNumber.trim());
    return client ? client.name : null;
  }, [formData.caseNumber, clients]);

  const allDeadlines = useMemo(() => {
    return movements
      .filter(m => m.type === 'Deadline')
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [movements]);

  const totalDeadlinesPages = Math.ceil(allDeadlines.length / deadlinesPerPage);

  const paginatedDeadlines = useMemo(() => {
    const start = deadlinesPage * deadlinesPerPage;
    return allDeadlines.slice(start, start + deadlinesPerPage);
  }, [allDeadlines, deadlinesPage]);

  const handleNextDeadlines = () => {
    if (deadlinesPage < totalDeadlinesPages - 1) {
      setDeadlinesPage(prev => prev + 1);
    }
  };

  const handlePrevDeadlines = () => {
    if (deadlinesPage > 0) {
      setDeadlinesPage(prev => prev - 1);
    }
  };

  const handleClientChange = (clientId: string) => {
    const selectedClient = clients.find(c => c.id === clientId);
    setFormData({
      ...formData,
      clientId,
      caseNumber: selectedClient ? selectedClient.caseNumber : ''
    });
  };

  const handleCaseNumberChange = (caseNumber: string) => {
    const client = clients.find(c => c.caseNumber.trim() === caseNumber.trim());
    setFormData({
      ...formData,
      caseNumber,
      clientId: client ? client.id : formData.clientId
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMovementId && onUpdateMovement) {
      onUpdateMovement({
        ...formData,
        id: editingMovementId
      });
    } else {
      const newMovement: CourtMovement = {
        ...formData,
        id: `mov_${Date.now()}`
      };
      onAddMovement(newMovement);
    }

    setShowForm(false);
    setEditingMovementId(null);

    setFormData({
      clientId: '',
      caseNumber: '',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      description: '',
      type: 'Deadline',
      modality: 'Presencial',
      source: 'Lançamento Manual'
    });
  };

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const days = [];

    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const dateStr = new Date(year, month - 1, d).toISOString().split('T')[0];
      days.push({ day: d, currentMonth: false, fullDate: dateStr });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = new Date(year, month, i).toISOString().split('T')[0];
      days.push({ day: i, currentMonth: true, fullDate: dateStr });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const dateStr = new Date(year, month + 1, i).toISOString().split('T')[0];
      days.push({ day: i, currentMonth: false, fullDate: dateStr });
    }
    return days;
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return {
        day: d.getDate(),
        fullDate: d.toISOString().split('T')[0],
        dayName: d.toLocaleString('pt-BR', { weekday: 'short' }).toUpperCase()
      };
    });
  }, [currentDate]);

  const getMovementsForDay = (dateStr: string) => {
    return movements.filter(m => m.date === dateStr).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  };

  const formatMovementType = (type: string) => {
    switch (type) {
      case 'Audiência': return { label: 'AUDIÊNCIA', color: 'bg-orange-100 text-orange-600 border-orange-200' };
      case 'Deadline': return { label: 'PRAZO', color: 'bg-rose-50 text-rose-600 border-rose-100' };
      default: return { label: 'NOTIFICAÇÃO', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' };
    }
  };

  const inputClass = "w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-700";
  const labelClass = "block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-widest";

  const isToday = (dateStr: string) => dateStr === new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Agenda & Prazos</h2>
          <p className="text-sm text-slate-400 font-medium mt-1">Organize suas audiências, reuniões e prazos fatais.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleToday} className="h-11 px-4 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-all shadow-sm text-[10px] font-black uppercase tracking-widest">Hoje</button>
          <button onClick={() => setShowForm(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2">
            <i className="fa-solid fa-plus"></i> Novo Evento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 bg-white rounded-[2.5rem] shadow-sm border border-slate-50 p-8">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
            <div className="flex items-center gap-6">
              <h3 className="text-xl font-black text-slate-800 tracking-tight min-w-[180px]">
                {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}
              </h3>
              <div className="flex gap-4">
                <button onClick={handlePrev} className="h-10 w-10 flex items-center justify-center rounded-full text-slate-300 hover:text-indigo-600 hover:bg-slate-50 transition-all"><i className="fa-solid fa-chevron-left"></i></button>
                <button onClick={handleNext} className="h-10 w-10 flex items-center justify-center rounded-full text-slate-300 hover:text-indigo-600 hover:bg-slate-50 transition-all"><i className="fa-solid fa-chevron-right"></i></button>
              </div>
            </div>
            <div className="flex p-1 bg-slate-100 rounded-xl">
              {['MÊS', 'SEMANA', 'DIA'].map((t) => (
                <button key={t} onClick={() => setView(t as any)} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>{t}</button>
              ))}
            </div>
          </div>

          {view === 'MÊS' && (
            <div className="grid grid-cols-7 border-t border-l border-slate-50">
              {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map(d => (
                <div key={d} className="py-4 text-center text-[10px] font-black text-slate-300 tracking-widest border-r border-b border-slate-50 uppercase">{d}</div>
              ))}
              {calendarDays.map((d, i) => {
                const dayMovements = getMovementsForDay(d.fullDate);
                const dayIsToday = isToday(d.fullDate);
                return (
                  <div key={i} onClick={() => handleSelectDay(d.fullDate)} className={`min-h-[120px] p-3 border-r border-b border-slate-50 transition-all group hover:bg-slate-50/50 cursor-pointer ${dayIsToday ? 'bg-indigo-50/20' : ''}`}>
                    <div className="flex justify-between items-start mb-2 pointer-events-none">
                      <span className={`text-sm font-bold ${d.currentMonth ? 'text-slate-800' : 'text-slate-200'} ${dayIsToday ? 'h-7 w-7 bg-indigo-600 text-white rounded-full flex items-center justify-center -mt-1 -ml-1 text-xs shadow-md' : ''}`}>{d.day}</span>
                    </div>
                    <div className="space-y-1">
                      {dayMovements.map((m) => (
                        <div
                          key={m.id}
                          className={`${formatMovementType(m.type).color} border px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight truncate cursor-pointer hover:brightness-95 transition-all`}
                          title={m.description}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMovement(m);
                          }}
                        >
                          {m.type === 'Audiência' ? '⚖️ ' : '📅 '}{m.time && <span className="mr-1">{m.time}</span>}{m.description}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {view === 'SEMANA' && (
            <div className="space-y-4">
              {weekDays.map((wd) => {
                const dayMovements = getMovementsForDay(wd.fullDate);
                const dayIsToday = isToday(wd.fullDate);
                return (
                  <div key={wd.fullDate} onClick={() => handleSelectDay(wd.fullDate)} className={`flex gap-6 p-4 rounded-3xl border transition-all cursor-pointer group ${dayIsToday ? 'bg-indigo-50/30 border-indigo-100 ring-1 ring-indigo-100' : 'bg-slate-50/50 border-slate-100 hover:bg-white hover:shadow-md'}`}>
                    <div className="flex flex-col items-center justify-center min-w-[60px]">
                      <span className={`text-[10px] font-black tracking-widest ${dayIsToday ? 'text-indigo-600' : 'text-slate-300'}`}>{wd.dayName}</span>
                      <span className={`text-2xl font-black ${dayIsToday ? 'text-indigo-600' : 'text-slate-800'}`}>{wd.day}</span>
                    </div>
                    <div className="flex-1 space-y-2">
                      {dayMovements.length > 0 ? dayMovements.map(m => (
                        <div
                          key={m.id}
                          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center transition-all group-hover:border-indigo-200 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMovement(m);
                          }}
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {m.time && <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{m.time}</span>}
                              {m.modality && <span className="text-[9px] font-black text-slate-400 border border-slate-100 px-2 py-0.5 rounded-full uppercase tracking-tighter">{m.modality}</span>}
                              <p className="font-black text-slate-800 text-sm uppercase tracking-tight">{m.description}</p>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">PROCESSO: {m.caseNumber}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${formatMovementType(m.type).color}`}>{formatMovementType(m.type).label}</span>
                        </div>
                      )) : <div className="h-full flex items-center italic text-slate-300 text-xs">Sem eventos para este dia.</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {view === 'DIA' && (
            <div className="space-y-8 py-4">
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 bg-indigo-600 rounded-[2rem] flex flex-col items-center justify-center text-white shadow-xl shadow-indigo-100">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{currentDate.toLocaleString('pt-BR', { weekday: 'short' })}</span>
                  <span className="text-3xl font-black">{currentDate.getDate()}</span>
                </div>
                <div>
                  <h4 className="text-2xl font-black text-slate-800">{currentDate.toLocaleDateString('pt-BR', { dateStyle: 'full' })}</h4>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Visão Detalhada do Dia</p>
                </div>
              </div>
              <div className="space-y-4">
                {getMovementsForDay(currentDate.toISOString().split('T')[0]).length > 0 ? (
                  getMovementsForDay(currentDate.toISOString().split('T')[0]).map(m => (
                    <div key={m.id} className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 flex justify-between items-start transition-all hover:bg-white hover:shadow-md">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${formatMovementType(m.type).color}`}>{formatMovementType(m.type).label}</span>
                          {m.time && <span className="text-sm font-black text-slate-800">{m.time}</span>}
                          {m.modality && <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white border border-slate-100 px-3 py-1 rounded-full"><i className={`fa-solid ${m.modality === 'Online' ? 'fa-video' : 'fa-building-columns'} mr-2`}></i>{m.modality}</span>}
                        </div>
                        <h5 className="text-xl font-black text-slate-800 leading-tight">{m.description}</h5>
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2 text-slate-400"><i className="fa-solid fa-file-contract text-xs"></i><span className="text-xs font-bold uppercase tracking-widest">{m.caseNumber}</span></div>
                          <div className="flex items-center gap-2 text-slate-400"><i className="fa-solid fa-map-pin text-xs"></i><span className="text-xs font-bold uppercase tracking-widest">{m.source}</span></div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedMovement(m)} className="h-12 w-12 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 transition-all shadow-sm flex items-center justify-center"><i className="fa-solid fa-eye"></i></button>
                        <button onClick={() => handleEditClick(m)} className="h-12 w-12 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 transition-all shadow-sm flex items-center justify-center"><i className="fa-solid fa-pen-to-square"></i></button>
                      </div>
                    </div>
                  ))
                ) : <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem]"><i className="fa-solid fa-calendar-xmark text-slate-200 text-5xl mb-4"></i><p className="text-slate-400 font-black text-xs uppercase tracking-widest">Nenhum evento agendado para hoje.</p></div>}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-50 p-8 flex flex-col h-fit">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-base font-black text-slate-800 tracking-tight">Próximos Prazos</h4>
              <span className="bg-rose-50 text-rose-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">{allDeadlines.length} ATIVOS</span>
            </div>
            <div className="space-y-4 flex-1">
              {paginatedDeadlines.length > 0 ? paginatedDeadlines.map((m) => (
                <div key={m.id} onClick={() => handleSelectDay(m.date)} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 transition-all hover:shadow-md border-l-4 border-rose-500 cursor-pointer animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="text-center min-w-[40px]">
                    <p className="text-[9px] font-black text-slate-300 uppercase leading-none">{new Date(m.date + 'T12:00:00').toLocaleString('pt-BR', { month: 'short' }).toUpperCase()}</p>
                    <p className="text-lg font-black text-slate-800 leading-tight">{new Date(m.date + 'T12:00:00').getDate()}</p>
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-black text-slate-800 text-sm truncate">{m.description}</p>
                    <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">Proc: {m.caseNumber}</p>
                  </div>
                </div>
              )) : <div className="py-8 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest">Sem prazos ativos.</div>}
            </div>
            {totalDeadlinesPages > 1 && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-50">
                <button onClick={handlePrevDeadlines} disabled={deadlinesPage === 0} className={`text-[9px] font-black uppercase tracking-widest transition-all ${deadlinesPage === 0 ? 'text-slate-200 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-800'}`}><i className="fa-solid fa-chevron-left mr-1"></i> Anterior</button>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{deadlinesPage + 1} / {totalDeadlinesPages}</span>
                <button onClick={handleNextDeadlines} disabled={deadlinesPage === totalDeadlinesPages - 1} className={`text-[9px] font-black uppercase tracking-widest transition-all ${deadlinesPage === totalDeadlinesPages - 1 ? 'text-slate-200 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-800'}`}>Próximo <i className="fa-solid fa-chevron-right ml-1"></i></button>
              </div>
            )}
          </div>
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-50 p-8">
            <h4 className="text-base font-black text-slate-800 tracking-tight mb-8">Legenda</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3"><div className="h-3 w-3 rounded-full bg-rose-500"></div><span className="text-xs font-bold text-slate-500">Prazos Fatais</span></div>
              <div className="flex items-center gap-3"><div className="h-3 w-3 rounded-full bg-orange-500"></div><span className="text-xs font-bold text-slate-500">Audiências</span></div>
              <div className="flex items-center gap-3"><div className="h-3 w-3 rounded-full bg-indigo-500"></div><span className="text-xs font-bold text-slate-500">Notificações</span></div>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-10 space-y-8 shadow-2xl animate-in zoom-in-95 my-8">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{editingMovementId ? 'Editar Lançamento' : 'Novo Lançamento na Agenda'}</h3>
              <button onClick={handleCloseForm} className="h-10 w-10 bg-slate-100 rounded-full text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors flex items-center justify-center"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Número do Processo</label>
                  <input type="text" required className={inputClass} placeholder="0000000-00.0000.0.00.0000" value={formData.caseNumber} onChange={(e) => handleCaseNumberChange(e.target.value)} />
                  {matchedClientName && <p className="mt-1.5 text-[11px] font-bold text-indigo-600 flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2"><i className="fa-solid fa-user-check"></i>Cliente Identificado: <span className="uppercase">{matchedClientName}</span></p>}
                </div>
                <div>
                  <label className={labelClass}>Vincular Cliente (Opcional)</label>
                  <select className={inputClass} value={formData.clientId} onChange={(e) => handleClientChange(e.target.value)}>
                    <option value="">-- Selecione um Cliente --</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelClass}>Data do Evento</label><input type="date" required className={inputClass} value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} /></div>
                  <div><label className={labelClass}>Tipo de Evento</label><select className={inputClass} value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}><option value="Deadline">Prazo Processual</option><option value="Audiência">Audiência</option><option value="Notification">Notificação / Outro</option></select></div>
                </div>
                {formData.type === 'Audiência' && (
                  <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                    <div><label className={labelClass}>Horário</label><input type="time" required className={inputClass} value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} /></div>
                    <div><label className={labelClass}>Modalidade</label><select className={inputClass} value={formData.modality} onChange={(e) => setFormData({ ...formData, modality: e.target.value as any })}><option value="Presencial">Presencial</option><option value="Online">Online / Videoconferência</option></select></div>
                  </div>
                )}
                <div><label className={labelClass}>Descrição do Lançamento</label><textarea required className={`${inputClass} h-24 resize-none`} placeholder="Ex: Prazo para réplica à contestação..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
              </div>
              <div className="flex items-center gap-6 pt-4">
                <button type="button" onClick={handleCloseForm} className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">{editingMovementId ? 'Salvar Alterações' : 'Salvar na Agenda'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedMovement && (
        <MovementSummaryModal
          movement={selectedMovement}
          client={clients.find(c => c.id === selectedMovement.clientId || c.caseNumber === selectedMovement.caseNumber)}
          settings={settings}
          onClose={() => setSelectedMovement(null)}
        />
      )}
    </div>
  );
};

export default Agenda;
