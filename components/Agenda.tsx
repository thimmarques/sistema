
import React, { useState, useMemo } from 'react';
import { CourtMovement, Client, UserSettings } from '../types';
import MovementSummaryModal from './MovementSummaryModal';
import MovementFormModal from './MovementFormModal';

interface AgendaProps {
  movements: CourtMovement[];
  onAddMovement: (movement: CourtMovement) => void;
  onUpdateMovement?: (movement: CourtMovement) => void;
  clients: Client[];
  settings: UserSettings;
  onSyncToGoogle: (movement: CourtMovement) => void;
  googleConnected?: boolean;
  onDeleteMovement?: (movement: CourtMovement) => void;
}

const Agenda: React.FC<AgendaProps> = ({
  movements,
  onAddMovement,
  onUpdateMovement,
  onDeleteMovement,
  clients,
  settings,
  onSyncToGoogle,
  googleConnected
}) => {
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState<'MÊS' | 'SEMANA' | 'DIA'>('MÊS');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [movementToEdit, setMovementToEdit] = useState<CourtMovement | null>(null);
  const [selectedMovement, setSelectedMovement] = useState<CourtMovement | null>(null);
  const [deadlinesPage, setDeadlinesPage] = useState(0);
  const deadlinesPerPage = 3;

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
    setMovementToEdit(movement);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setMovementToEdit(null);
  };


  const allDeadlines = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return movements
      .filter(m => (m.type === 'Deadline' || m.type === 'Notification') && m.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [movements]);

  // Reset page when data changes to avoid being on a blank page
  React.useEffect(() => {
    setDeadlinesPage(0);
  }, [allDeadlines.length]);

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


  const handleSubmitForm = (data: Partial<CourtMovement> & { id?: string }) => {
    if (data.id && onUpdateMovement) {
      onUpdateMovement(data as CourtMovement);
    } else {
      const newMovement: CourtMovement = {
        ...data,
        id: `mov_${Date.now()}`
      } as CourtMovement;
      onAddMovement(newMovement);
    }
    handleCloseForm();
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <span className="text-[10px] font-black text-brand-500 uppercase tracking-[0.3em]">Gestão de Prazos</span>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Agenda Jurídica</h2>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button
            onClick={handleToday}
            className="flex-1 md:flex-none h-14 px-6 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-500 hover:text-brand-600 hover:border-brand-100 transition-all shadow-sm text-[10px] font-black uppercase tracking-widest active:scale-95"
          >
            Hoje
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex-1 md:flex-none bg-brand-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.15em] shadow-xl shadow-brand-500/20 hover:bg-brand-700 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <i className="fa-solid fa-calendar-plus text-base"></i>
            Novo Evento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 bg-white rounded-[3rem] shadow-premium border border-white/40 p-10 relative overflow-hidden">
          {/* Subtle Background Accent */}
          <div className="absolute top-0 right-0 h-64 w-64 bg-brand-500/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>

          <div className="flex flex-col lg:flex-row justify-between items-center mb-12 gap-8 relative z-10">
            <div className="flex items-center gap-8">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">Período de Visualização</span>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight min-w-[220px]">
                  {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}
                </h3>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handlePrev}
                  className="h-12 w-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-all active:scale-90 border border-slate-100"
                >
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
                <button
                  onClick={handleNext}
                  className="h-12 w-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-all active:scale-90 border border-slate-100"
                >
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            </div>
            <div className="flex p-1.5 bg-slate-100/50 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-inner">
              {['MÊS', 'SEMANA', 'DIA'].map((t) => (
                <button key={t} onClick={() => setView(t as any)} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === t ? 'bg-white text-brand-600 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
              ))}
            </div>
          </div>

          {view === 'MÊS' && (
            <div className="grid grid-cols-7 border border-slate-100 rounded-3xl overflow-hidden bg-white relative z-10">
              {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map(d => (
                <div key={d} className="py-5 text-center text-[10px] font-black text-slate-300 tracking-[0.2em] border-b border-r border-slate-50 uppercase bg-slate-50/30">{d}</div>
              ))}
              {calendarDays.map((d, i) => {
                const dayMovements = getMovementsForDay(d.fullDate);
                const dayIsToday = isToday(d.fullDate);
                return (
                  <div key={i} onClick={() => handleSelectDay(d.fullDate)} className={`min-h-[140px] p-4 border-r border-b border-slate-50 transition-all group hover:bg-brand-50/30 cursor-pointer ${dayIsToday ? 'bg-brand-50/20' : ''}`}>
                    <div className="flex justify-between items-start mb-3 pointer-events-none">
                      <span className={`text-base font-black transition-transform duration-300 group-hover:scale-110 ${d.currentMonth ? 'text-slate-800' : 'text-slate-200'} ${dayIsToday ? 'h-9 w-9 bg-brand-600 text-white rounded-2xl flex items-center justify-center -mt-1 -ml-1 text-xs shadow-lg shadow-brand-500/30' : ''}`}>{d.day}</span>
                    </div>
                    <div className="space-y-1.5">
                      {dayMovements.slice(0, 3).map((m) => {
                        const style = formatMovementType(m.type);
                        return (
                          <div
                            key={m.id}
                            className={`${style.color.replace('bg-', 'bg-').replace('text-', 'text-')} border px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-tight truncate cursor-pointer hover:brightness-90 transition-all shadow-sm`}
                            title={m.description}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMovement(m);
                            }}
                          >
                            <span className="mr-1.5 opacity-60 font-bold">{m.time || '—'}</span>
                            {m.description}
                          </div>
                        );
                      })}
                      {dayMovements.length > 3 && (
                        <div className="text-[8px] font-black text-slate-300 text-center uppercase tracking-widest pt-1">
                          + {dayMovements.length - 3} Eventos
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {view === 'SEMANA' && (
            <div className="space-y-6 relative z-10">
              {weekDays.map((wd) => {
                const dayMovements = getMovementsForDay(wd.fullDate);
                const dayIsToday = isToday(wd.fullDate);
                return (
                  <div key={wd.fullDate} onClick={() => handleSelectDay(wd.fullDate)} className={`flex flex-col md:flex-row gap-8 p-8 rounded-[2.5rem] border transition-all cursor-pointer group hover:shadow-xl active:scale-[0.99] ${dayIsToday ? 'bg-brand-50/40 border-brand-100 ring-4 ring-brand-500/5' : 'bg-slate-50/50 border-slate-100 hover:bg-white hover:border-brand-200'}`}>
                    <div className="flex md:flex-col items-center justify-center min-w-[100px] border-b md:border-b-0 md:border-r border-slate-200/50 pb-6 md:pb-0 md:pr-8 gap-4 md:gap-1">
                      <span className={`text-[11px] font-black tracking-[0.3em] uppercase ${dayIsToday ? 'text-brand-600' : 'text-slate-300'}`}>{wd.dayName}</span>
                      <span className={`text-4xl font-black tracking-tighter ${dayIsToday ? 'text-brand-600' : 'text-slate-800'}`}>{wd.day}</span>
                    </div>
                    <div className="flex-1 grid grid-cols-1 gap-4">
                      {dayMovements.length > 0 ? dayMovements.map(m => (
                        <div
                          key={m.id}
                          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all group-hover:border-brand-100 cursor-pointer hover:shadow-md"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMovement(m);
                          }}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              {m.time && <span className="text-[10px] font-black text-brand-600 bg-brand-50 px-3 py-1 rounded-full uppercase tracking-widest">{m.time}</span>}
                              <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">{m.description}</h4>
                            </div>
                            <div className="flex items-center gap-4">
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                <i className="fa-solid fa-file-invoice text-[9px]"></i> {m.caseNumber}
                              </p>
                              {m.modality && (
                                <span className="text-[9px] font-black text-slate-300 border border-slate-100 px-2 py-0.5 rounded-md uppercase tracking-tighter">
                                  <i className={`fa-solid ${m.modality === 'Online' ? 'fa-video' : 'fa-building-columns'} mr-1`}></i>
                                  {m.modality}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${formatMovementType(m.type).color}`}>{formatMovementType(m.type).label}</span>
                        </div>
                      )) : (
                        <div className="h-full flex items-center gap-4 py-4 px-2 text-slate-300">
                          <i className="fa-solid fa-calendar-day opacity-50"></i>
                          <span className="text-[10px] font-black uppercase tracking-widest">Livre de compromissos</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {view === 'DIA' && (
            <div className="space-y-12 py-6 relative z-10">
              <div className="flex items-center gap-8">
                <div className="h-24 w-24 bg-brand-600 rounded-[2.5rem] flex flex-col items-center justify-center text-white shadow-[0_20px_40px_-15px_rgba(var(--color-brand-600),0.3)]">
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] opacity-80 mb-1">{currentDate.toLocaleString('pt-BR', { weekday: 'short' })}</span>
                  <span className="text-4xl font-black">{currentDate.getDate()}</span>
                </div>
                <div>
                  <h4 className="text-3xl font-black text-slate-800 tracking-tighter">{currentDate.toLocaleDateString('pt-BR', { dateStyle: 'full' })}</h4>
                  <p className="text-brand-500 font-black text-[10px] uppercase tracking-[0.4em] mt-2">Visão Estratégica Diária</p>
                </div>
              </div>
              <div className="space-y-6">
                {getMovementsForDay(currentDate.toISOString().split('T')[0]).length > 0 ? (
                  getMovementsForDay(currentDate.toISOString().split('T')[0]).map(m => (
                    <div key={m.id} className="bg-slate-50/50 p-10 rounded-[3rem] border border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 transition-all hover:bg-white hover:shadow-premium hover:-translate-y-1 group">
                      <div className="space-y-6 flex-1">
                        <div className="flex flex-wrap items-center gap-4">
                          <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm ${formatMovementType(m.type).color}`}>{formatMovementType(m.type).label}</span>
                          {m.time && <span className="text-lg font-black text-slate-800 tracking-tighter bg-white px-4 py-2 rounded-2xl border border-slate-100">{m.time}</span>}
                          {m.modality && (
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white border border-slate-100 px-4 py-2 rounded-2xl shadow-sm">
                              <i className={`fa-solid ${m.modality === 'Online' ? 'fa-video' : 'fa-building-columns'} mr-3 text-brand-500`}></i>
                              {m.modality}
                            </span>
                          )}
                        </div>
                        <h5 className="text-2xl font-black text-slate-800 leading-tight group-hover:text-brand-600 transition-colors">{m.description}</h5>
                        <div className="flex flex-wrap items-center gap-8">
                          <div className="flex items-center gap-3 text-slate-400">
                            <div className="h-8 w-8 bg-slate-100 rounded-xl flex items-center justify-center text-xs">
                              <i className="fa-solid fa-file-contract"></i>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.1em]">{m.caseNumber}</span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-400">
                            <div className="h-8 w-8 bg-slate-100 rounded-xl flex items-center justify-center text-xs">
                              <i className="fa-solid fa-map-pin"></i>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.1em]">{m.source}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                        {googleConnected && !m.syncedToGoogle && (
                          <button
                            onClick={() => onSyncToGoogle(m)}
                            className="flex-1 lg:flex-none h-14 px-8 rounded-2xl bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white transition-all border border-brand-100 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.15em] shadow-sm hover:shadow-brand-500/20 active:scale-95"
                            title="Sincronizar com Google Agenda"
                          >
                            <i className="fa-brands fa-google text-lg"></i>
                            Sincronizar
                          </button>
                        )}
                        {m.syncedToGoogle && (
                          <div className="flex-1 lg:flex-none h-14 px-8 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.15em] select-none shadow-sm">
                            <i className="fa-solid fa-circle-check text-lg"></i>
                            Sincronizado
                          </div>
                        )}
                        <div className="flex gap-3 flex-1 lg:flex-none">
                          <button onClick={() => setSelectedMovement(m)} className="flex-1 lg:h-14 lg:w-14 h-14 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-brand-600 hover:border-brand-200 transition-all shadow-sm flex items-center justify-center active:scale-95"><i className="fa-solid fa-eye text-lg"></i></button>
                          <button onClick={() => handleEditClick(m)} className="flex-1 lg:h-14 lg:w-14 h-14 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm flex items-center justify-center active:scale-95"><i className="fa-solid fa-pen-to-square text-lg"></i></button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-32 text-center border-2 border-dashed border-slate-100 rounded-[4rem] group hover:border-brand-200 transition-all animate-in fade-in zoom-in-95 duration-700">
                    <div className="h-24 w-24 bg-slate-50 text-slate-200 rounded-[2.5rem] flex items-center justify-center text-4xl mx-auto mb-8 shadow-inner border border-slate-100 group-hover:scale-110 transition-transform duration-500">
                      <i className="fa-solid fa-calendar-xmark"></i>
                    </div>
                    <p className="text-slate-400 font-black text-xs uppercase tracking-[0.3em]">Nenhum evento agendado para hoje.</p>
                    <button onClick={() => setShowForm(true)} className="mt-8 text-[10px] font-black text-brand-600 uppercase tracking-widest hover:underline underline-offset-8">Agendar Novo Evento</button>
                  </div>
                )}
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
              <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-50">
                <button
                  onClick={handlePrevDeadlines}
                  disabled={deadlinesPage === 0}
                  className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${deadlinesPage === 0 ? 'text-slate-200 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-800'}`}
                >
                  <i className="fa-solid fa-chevron-left text-[8px]"></i> Anterior
                </button>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{deadlinesPage + 1} / {totalDeadlinesPages}</span>
                <button
                  onClick={handleNextDeadlines}
                  disabled={deadlinesPage === totalDeadlinesPages - 1}
                  className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${deadlinesPage === totalDeadlinesPages - 1 ? 'text-slate-200 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-800'}`}
                >
                  Próximo <i className="fa-solid fa-chevron-right text-[8px]"></i>
                </button>
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

      <MovementFormModal
        isOpen={showForm}
        onClose={handleCloseForm}
        onSubmit={handleSubmitForm}
        clients={clients}
        initialData={movementToEdit}
      />

      {selectedMovement && (
        <MovementSummaryModal
          movement={movements.find(m => m.id === selectedMovement.id) || selectedMovement}
          client={clients.find(c => c.id === selectedMovement.clientId || c.caseNumber === selectedMovement.caseNumber)}
          settings={settings}
          onClose={() => setSelectedMovement(null)}
          onEdit={() => {
            const m = movements.find(m => m.id === selectedMovement.id) || selectedMovement;
            setSelectedMovement(null);
            handleEditClick(m);
          }}
          onSyncToGoogle={() => onSyncToGoogle(movements.find(m => m.id === selectedMovement.id) || selectedMovement)}
          googleConnected={googleConnected}
          onDelete={() => {
            const m = movements.find(m => m.id === selectedMovement.id) || selectedMovement;
            if (window.confirm('Tem certeza que deseja excluir este evento da agenda e do Google Calendar?')) {
              onDeleteMovement?.(m);
              setSelectedMovement(null);
            }
          }}
        />
      )}
    </div>
  );
};

export default Agenda;
