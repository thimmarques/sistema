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
      <div className="space-y-12 animate-fade-in pb-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-white/5 pb-10">
          <div className="space-y-4 text-left">
            <p className="text-[10px] font-black text-brand-500 uppercase tracking-[0.5em]">CONTROLE TEMPORAL</p>
            <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase font-serif">Agenda Estratégica</h2>
            <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Protocolo de Prazos e Audiências</p>
          </div>
          <div className="flex items-center gap-6 w-full md:w-auto">
            <button
              onClick={handleToday}
              className="flex-1 md:flex-none h-14 px-8 border border-white/5 text-slate-500 font-black text-[9px] uppercase tracking-[0.3em] hover:text-white hover:bg-white/5 transition-all"
            >
              Terminal Hoje
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex-1 md:flex-none bg-brand-500 text-black px-12 py-5 font-black text-[11px] uppercase tracking-[0.4em] hover:bg-brand-600 transition-all active:scale-95 shadow-2xl"
            >
              Novo Evento
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
          <div className="xl:col-span-3 bg-white/[0.02] border border-white/5 p-12">
            <div className="flex flex-col lg:flex-row justify-between items-center mb-12 gap-10">
              <div className="flex items-center gap-8">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic font-serif">
                  {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex bg-white/5 p-1 border border-white/5">
                  <button onClick={handlePrev} className="h-10 w-10 flex items-center justify-center text-slate-800 hover:text-white transition-all"><i className="fa-solid fa-chevron-left text-xs"></i></button>
                  <div className="w-[1px] bg-white/5"></div>
                  <button onClick={handleNext} className="h-10 w-10 flex items-center justify-center text-slate-800 hover:text-white transition-all"><i className="fa-solid fa-chevron-right text-xs"></i></button>
                </div>
              </div>
              <div className="flex bg-white/5 p-1 border border-white/5">
                {['MÊS', 'SEMANA', 'DIA'].map((t) => (
                  <button key={t} onClick={() => setView(t as any)} className={`px-10 py-3 text-[9px] font-black uppercase tracking-[0.3em] transition-all ${view === t ? 'bg-brand-500 text-black shadow-lg shadow-brand-500/20' : 'text-slate-500 hover:text-white'}`}>{t}</button>
                ))}
              </div>
            </div>

            {view === 'MÊS' && (
              <div className="grid grid-cols-7 border border-white/5">
                {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map(d => (
                  <div key={d} className="py-6 text-center text-[9px] font-black text-slate-700 tracking-[0.4em] border-b border-r border-white/5 bg-white/[0.01]">{d}</div>
                ))}
                {calendarDays.map((d, i) => {
                  const dayMovements = getMovementsForDay(d.fullDate);
                  const dayIsToday = isToday(d.fullDate);
                  return (
                    <div key={i} onClick={() => handleSelectDay(d.fullDate)} className={`min-h-[140px] p-6 border-r border-b border-white/5 transition-all group hover:bg-white/[0.03] cursor-pointer ${dayIsToday ? 'bg-brand-500/5' : ''}`}>
                      <div className="flex justify-between items-start mb-6">
                        <span className={`text-base font-black ${d.currentMonth ? (dayIsToday ? 'text-brand-500' : 'text-slate-500') : 'text-slate-900'}`}>
                          {d.day}
                        </span>
                        {dayIsToday && <div className="h-1 w-1 bg-accent-gold shadow-[0_0_10px_#D4AF37]"></div>}
                      </div>
                      <div className="space-y-2">
                        {dayMovements.slice(0, 3).map((m) => (
                          <div key={m.id} className="flex items-center gap-3 group/task" onClick={(e) => { e.stopPropagation(); setSelectedMovement(m); }}>
                            <div className={`h-1 w-1 ${m.type === 'Audiência' ? 'bg-orange-500' : m.type === 'Deadline' ? 'bg-rose-500' : 'bg-brand-500'}`}></div>
                            <p className="text-[9px] font-black text-slate-800 truncate group-hover/task:text-white transition-all">
                              {m.description.toUpperCase()}
                            </p>
                          </div>
                        ))}
                        {dayMovements.length > 3 && <p className="text-[8px] font-black text-slate-900 pl-4">+ {dayMovements.length - 3}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {view === 'SEMANA' && (
              <div className="space-y-6">
                {weekDays.map((wd) => {
                  const dayMovements = getMovementsForDay(wd.fullDate);
                  const dayIsToday = isToday(wd.fullDate);
                  return (
                    <div key={wd.fullDate} onClick={() => handleSelectDay(wd.fullDate)} className={`flex flex-col lg:flex-row border border-white/5 transition-all cursor-pointer group hover:border-brand-500/30 ${dayIsToday ? 'bg-brand-500/[0.02]' : 'bg-white/[0.01]'}`}>
                      <div className="flex flex-row lg:flex-col items-center justify-center min-w-[140px] p-10 bg-white/[0.01] border-b lg:border-b-0 lg:border-r border-white/5">
                        <span className={`text-[9px] font-black tracking-[0.4em] uppercase ${dayIsToday ? 'text-brand-500' : 'text-slate-800'}`}>{wd.dayName}</span>
                        <span className={`text-4xl font-black mt-2 tracking-tighter ${dayIsToday ? 'text-brand-500' : 'text-white'}`}>{wd.day}</span>
                      </div>
                      <div className="flex-1 divide-y divide-white/5">
                        {dayMovements.length > 0 ? dayMovements.map(m => (
                          <div key={m.id} className="p-8 px-12 flex justify-between items-center group/item hover:bg-white/5 transition-all" onClick={(e) => { e.stopPropagation(); setSelectedMovement(m); }}>
                            <div className="space-y-3 text-left">
                              <span className="text-[9px] font-black text-brand-500 uppercase tracking-[0.3em]">{m.time || '09:00'}</span>
                              <h4 className="text-sm font-black text-white group-hover:text-brand-500 transition-all uppercase tracking-widest">{m.description}</h4>
                              <p className="text-[9px] font-black text-slate-800 uppercase tracking-[0.2em]">{m.caseNumber} • {m.source}</p>
                            </div>
                            <span className={`px-4 py-2 text-[8px] font-black tracking-[0.2em] border ${formatMovementType(m.type).color.replace('bg-', 'bg-white/5 border-')}`}>
                              {formatMovementType(m.type).label}
                            </span>
                          </div>
                        )) : <div className="p-16 text-[9px] font-black uppercase text-slate-900 tracking-[0.4em] text-center italic">Sem Registros Ativos</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {view === 'DIA' && (
              <div className="space-y-16 py-10">
                <div className="flex items-center gap-12 border-l-4 border-brand-500 pl-12 bg-white/[0.01] py-10">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-brand-500 uppercase tracking-[0.4em] mb-3">{currentDate.toLocaleString('pt-BR', { weekday: 'long' })}</p>
                    <h4 className="text-8xl font-black text-white tracking-tighter leading-none">{currentDate.getDate()}</h4>
                  </div>
                  <div className="space-y-4 text-left">
                    <p className="text-4xl font-black text-white uppercase tracking-tighter italic font-serif">
                      {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="h-1.5 w-1.5 bg-accent-gold shadow-[0_0_10px_#D4AF37]"></div>
                      <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em]">ATIVIDADE OPERACIONAL DISPONÍVEL</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {getMovementsForDay(currentDate.toISOString().split('T')[0]).length > 0 ? (
                    getMovementsForDay(currentDate.toISOString().split('T')[0]).map(m => (
                      <div key={m.id} className="group flex flex-col lg:flex-row justify-between items-center p-12 border border-white/5 hover:border-brand-500/30 transition-all bg-white/[0.01] relative overflow-hidden">
                        <div className="space-y-8 flex-1 text-left">
                          <div className="flex items-center gap-6">
                            <span className="text-[10px] font-black text-brand-500 tracking-[0.4em] uppercase">{m.time || '09:00'}</span>
                            <span className={`px-4 py-2 text-[8px] font-black tracking-[0.2em] uppercase border ${formatMovementType(m.type).color.replace('bg-', 'bg-white/5 border-')}`}>{formatMovementType(m.type).label}</span>
                          </div>
                          <h5 className="text-3xl font-black text-white uppercase tracking-widest">{m.description}</h5>
                          <div className="grid grid-cols-2 lg:flex lg:gap-16 gap-10">
                            <div className="space-y-2">
                              <p className="text-[8px] font-black text-slate-800 uppercase tracking-[0.3em]">IDENTIFICADOR</p>
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{m.caseNumber}</p>
                            </div>
                            <div className="space-y-2">
                              <p className="text-[8px] font-black text-slate-800 uppercase tracking-[0.3em]">TRIBUNAL/ÓRGÃO</p>
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{m.source}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-4 mt-12 lg:mt-0">
                          <button onClick={() => setSelectedMovement(m)} className="p-4 border border-white/5 text-slate-900 hover:text-white hover:border-white/20 transition-all">
                            <i className="fa-solid fa-eye text-xs"></i>
                          </button>
                          <button onClick={() => handleEditClick(m)} className="p-4 border border-white/5 text-slate-900 hover:text-white hover:border-white/20 transition-all">
                            <i className="fa-solid fa-pen-to-square text-xs"></i>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-32 text-center space-y-6 bg-white/[0.01] border border-white/5">
                      <i className="fa-solid fa-radar text-5xl text-white/5"></i>
                      <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.5em]">Sem Registros Ativos para este Período</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-10">
            <div className="bg-white/[0.02] border border-white/5 p-10 space-y-10">
              <div className="flex justify-between items-end border-b border-white/5 pb-6">
                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.5em]">CRÍTICOS</h4>
                <span className="px-3 py-1 bg-brand-500 text-black text-[10px] font-black">{allDeadlines.length}</span>
              </div>
              <div className="space-y-6">
                {paginatedDeadlines.map((m) => (
                  <div key={m.id} onClick={() => handleSelectDay(m.date)} className="p-8 border border-white/5 hover:border-brand-500/30 bg-white/[0.01] transition-all cursor-pointer group text-left relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 opacity-20 group-hover:opacity-100 transition-all"></div>
                    <p className="text-[9px] font-black text-rose-500 uppercase tracking-[0.4em] mb-4">PRAZO FATAL</p>
                    <h5 className="text-[11px] font-black text-white group-hover:text-brand-500 uppercase transition-all line-clamp-2 tracking-widest leading-relaxed">{m.description}</h5>
                    <div className="mt-8 flex justify-between items-center text-[9px] font-black text-slate-800 uppercase tracking-widest">
                      <span>{new Date(m.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                      <i className="fa-solid fa-chevron-right text-[8px] group-hover:translate-x-2 transition-all"></i>
                    </div>
                  </div>
                ))}
                {allDeadlines.length === 0 && <p className="text-center text-[9px] font-black text-slate-900 py-10 uppercase tracking-[0.4em]">Nenhum Alerta Ativo</p>}
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 p-10 space-y-8">
              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.5em] border-b border-white/5 pb-6">LEGENDA</h4>
              <div className="space-y-5">
                <div className="flex items-center gap-4"><div className="h-1.5 w-1.5 bg-orange-500 shadow-[0_0_10px_#f97316]"></div><span className="text-[9px] font-black uppercase text-slate-700 tracking-[0.3em]">Audiência</span></div>
                <div className="flex items-center gap-4"><div className="h-1.5 w-1.5 bg-rose-500 shadow-[0_0_10px_#f43f5e]"></div><span className="text-[9px] font-black uppercase text-slate-700 tracking-[0.3em]">Prazo Fatal</span></div>
                <div className="flex items-center gap-4"><div className="h-1.5 w-1.5 bg-accent-gold shadow-[0_0_10px_#D4AF37]"></div><span className="text-[9px] font-black uppercase text-brand-400 tracking-[0.3em]">Operacional</span></div>
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
