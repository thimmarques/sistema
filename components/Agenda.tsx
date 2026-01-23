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
  const deadlinesPerPage = 4;

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

  React.useEffect(() => {
    setDeadlinesPage(0);
  }, [allDeadlines.length]);

  const totalDeadlinesPages = Math.ceil(allDeadlines.length / deadlinesPerPage);

  const paginatedDeadlines = useMemo(() => {
    const start = deadlinesPage * deadlinesPerPage;
    return allDeadlines.slice(start, start + deadlinesPerPage);
  }, [allDeadlines, deadlinesPage]);

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
      case 'Audiência': return { label: 'AUDIÊNCIA', color: 'border-orange-500 text-orange-500 bg-orange-500/5' };
      case 'Deadline': return { label: 'PRAZO', color: 'border-rose-500 text-rose-500 bg-rose-500/5' };
      default: return { label: 'NOTIFICAÇÃO', color: 'border-brand-500 text-brand-500 bg-brand-500/5' };
    }
  };

  const isToday = (dateStr: string) => dateStr === new Date().toISOString().split('T')[0];

  return (
    <>
      <div className="space-y-8 animate-fade-in pb-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-8">
          <div className="space-y-2 text-left">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Planejamento Jurídico</p>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Agenda Estratégica</h2>
            <p className="text-sm text-slate-500 font-medium">Controle de prazos e atos processuais</p>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button
              onClick={handleToday}
              className="flex-1 md:flex-none h-12 px-6 rounded-lg border border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-all"
            >
              Hoje
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex-1 md:flex-none bg-blue-600 text-white px-8 py-3 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-blue-700 transition-all active:scale-95 shadow-sm flex items-center gap-2"
            >
              <i className="fa-solid fa-plus"></i>
              <span>Novo Evento</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className="xl:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="flex flex-col lg:flex-row justify-between items-center mb-10 gap-6">
              <div className="flex items-center gap-6">
                <h3 className="text-xl font-bold text-slate-900 capitalize">
                  {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button onClick={handlePrev} className="h-8 w-8 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-white rounded-md transition-all"><i className="fa-solid fa-chevron-left text-xs"></i></button>
                  <button onClick={handleNext} className="h-8 w-8 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-white rounded-md transition-all"><i className="fa-solid fa-chevron-right text-xs"></i></button>
                </div>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                {['MÊS', 'SEMANA', 'DIA'].map((t) => (
                  <button key={t} onClick={() => setView(t as any)} className={`px-6 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${view === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{t}</button>
                ))}
              </div>
            </div>

            {view === 'MÊS' && (
              <div className="grid grid-cols-7 border border-slate-100 rounded-lg overflow-hidden">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                  <div key={d} className="py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 border-b border-slate-100">{d}</div>
                ))}
                {calendarDays.map((d, i) => {
                  const dayMovements = getMovementsForDay(d.fullDate);
                  const dayIsToday = isToday(d.fullDate);
                  return (
                    <div key={i} onClick={() => handleSelectDay(d.fullDate)} className={`min-h-[120px] p-4 border-r border-b border-slate-100 transition-all group hover:bg-slate-50/50 cursor-pointer ${dayIsToday ? 'bg-blue-50/30' : ''}`}>
                      <div className="flex justify-between items-start mb-3">
                        <span className={`text-sm font-bold ${d.currentMonth ? (dayIsToday ? 'text-blue-600' : 'text-slate-700') : 'text-slate-300'}`}>
                          {d.day}
                        </span>
                        {dayIsToday && <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>}
                      </div>
                      <div className="space-y-1.5">
                        {dayMovements.slice(0, 3).map((m) => (
                          <div key={m.id} className="flex items-center gap-2 group/task" onClick={(e) => { e.stopPropagation(); setSelectedMovement(m); }}>
                            <div className={`h-1 w-1 rounded-full ${m.type === 'Audiência' ? 'bg-amber-500' : m.type === 'Deadline' ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
                            <p className="text-[10px] font-semibold text-slate-600 truncate group-hover/task:text-blue-700 transition-all">
                              {m.description}
                            </p>
                          </div>
                        ))}
                        {dayMovements.length > 3 && <p className="text-[9px] font-bold text-slate-400 pl-3">+ {dayMovements.length - 3}</p>}
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
                    <div key={wd.fullDate} onClick={() => handleSelectDay(wd.fullDate)} className={`flex flex-col lg:flex-row rounded-xl border border-slate-100 transition-all cursor-pointer group hover:border-blue-200 ${dayIsToday ? 'bg-blue-50/20' : 'bg-white'}`}>
                      <div className="flex flex-row lg:flex-col items-center justify-center min-w-[120px] p-6 bg-slate-50/30 border-b lg:border-b-0 lg:border-r border-slate-100 rounded-t-xl lg:rounded-l-xl lg:rounded-tr-none">
                        <span className={`text-[10px] font-bold tracking-wider uppercase ${dayIsToday ? 'text-blue-600' : 'text-slate-400'}`}>{wd.dayName}</span>
                        <span className={`text-3xl font-bold mt-1 tracking-tight ${dayIsToday ? 'text-blue-600' : 'text-slate-900'}`}>{wd.day}</span>
                      </div>
                      <div className="flex-1 divide-y divide-slate-100">
                        {dayMovements.length > 0 ? dayMovements.map(m => (
                          <div key={m.id} className="p-6 flex justify-between items-center hover:bg-slate-50 transition-all" onClick={(e) => { e.stopPropagation(); setSelectedMovement(m); }}>
                            <div className="text-left">
                              <div className="flex items-center gap-3 mb-1">
                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">{m.time || '09:00'}</span>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase border ${formatMovementType(m.type).color.replace('bg-', 'bg-white border-')}`}>
                                  {formatMovementType(m.type).label}
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{m.description}</h4>
                              <p className="text-[10px] font-medium text-slate-500 mt-1">{m.caseNumber} • {m.source}</p>
                            </div>
                            <i className="fa-solid fa-chevron-right text-slate-300 text-xs"></i>
                          </div>
                        )) : <div className="p-10 text-[10px] font-bold uppercase text-slate-300 tracking-widest text-center italic">Agenda Livre</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {view === 'DIA' && (
              <div className="space-y-10 py-6">
                <div className="flex items-center gap-8 border-l-4 border-blue-600 pl-8 bg-slate-50/30 py-8 rounded-r-xl shadow-sm">
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">{currentDate.toLocaleString('pt-BR', { weekday: 'long' })}</p>
                    <h4 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">{currentDate.getDate()}</h4>
                  </div>
                  <div className="space-y-1 text-left">
                    <p className="text-2xl font-bold text-slate-900 capitalize">
                      {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"></div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Compromissos do Dia</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {getMovementsForDay(currentDate.toISOString().split('T')[0]).length > 0 ? (
                    getMovementsForDay(currentDate.toISOString().split('T')[0]).map(m => (
                      <div key={m.id} className="group flex flex-col lg:flex-row justify-between items-center p-8 border border-slate-100 rounded-xl hover:border-blue-200 hover:shadow-md transition-all bg-white relative overflow-hidden">
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-4 mb-3">
                            <span className="text-xs font-bold text-blue-600 tracking-wide uppercase">{m.time || '09:00'}</span>
                            <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wide uppercase border ${formatMovementType(m.type).color.replace('bg-', 'bg-white border-')}`}>{formatMovementType(m.type).label}</span>
                          </div>
                          <h5 className="text-lg font-bold text-slate-900 mb-4">{m.description}</h5>
                          <div className="flex flex-wrap gap-8">
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left">Processo</p>
                              <p className="text-xs font-semibold text-slate-600">{m.caseNumber}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left">Tribunal</p>
                              <p className="text-xs font-semibold text-slate-600">{m.source}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-8 lg:mt-0">
                          <button onClick={() => setSelectedMovement(m)} className="p-3 rounded-lg border border-slate-100 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                            <i className="fa-solid fa-eye text-sm"></i>
                          </button>
                          <button onClick={() => handleEditClick(m)} className="p-3 rounded-lg border border-slate-100 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                            <i className="fa-solid fa-pen-to-square text-sm"></i>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center space-y-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                      <i className="fa-solid fa-calendar-day text-4xl text-slate-200"></i>
                      <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">Sem compromissos hoje</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Prazos Fatais</h4>
                <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded text-[10px] font-bold">{allDeadlines.length}</span>
              </div>
              <div className="space-y-4">
                {paginatedDeadlines.map((m) => (
                  <div key={m.id} onClick={() => handleSelectDay(m.date)} className="p-5 rounded-lg border border-slate-100 hover:border-rose-200 hover:shadow-sm bg-white transition-all cursor-pointer group text-left relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 opacity-20 group-hover:opacity-100 transition-all"></div>
                    <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest mb-2">ALERTA CRÍTICO</p>
                    <h5 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 leading-relaxed">{m.description}</h5>
                    <div className="mt-4 flex justify-between items-center text-[10px] font-semibold text-slate-400">
                      <span>{new Date(m.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                      <i className="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition-all"></i>
                    </div>
                  </div>
                ))}
                {allDeadlines.length === 0 && <p className="text-center text-xs font-medium text-slate-300 py-6 uppercase tracking-widest">Nenhum alerta crítico</p>}
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 space-y-4">
              <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200/50 pb-3 text-left">Legenda</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3"><div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]"></div><span className="text-[10px] font-bold uppercase text-slate-600 tracking-wide text-left">Audiência</span></div>
                <div className="flex items-center gap-3"><div className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]"></div><span className="text-[10px] font-bold uppercase text-slate-600 tracking-wide text-left">Prazo Fatal</span></div>
                <div className="flex items-center gap-3"><div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]"></div><span className="text-[10px] font-bold uppercase text-slate-600 tracking-wide text-left">Operacional</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <MovementFormModal isOpen={showForm} onClose={handleCloseForm} onSubmit={handleSubmitForm} clients={clients} initialData={movementToEdit} />

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
            if (window.confirm('Excluir registo permanentemente?')) {
              onDeleteMovement?.(m);
              setSelectedMovement(null);
            }
          }}
        />
      )}
    </>
  );
};

export default Agenda;
