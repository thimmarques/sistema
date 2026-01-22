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
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row justify-between items-end gap-10">
        <div className="space-y-2">
          <span className="text-[9px] font-black text-brand-500 uppercase tracking-[0.4em]">Agenda Táctica</span>
          <h2 className="text-4xl font-black text-white font-serif italic tracking-tight uppercase">Calendário de Operações</h2>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button
            onClick={handleToday}
            className="flex-1 md:flex-none h-14 px-10 bg-white/5 border border-white/10 text-slate-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.3em]"
          >
            Terminal Atual
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex-1 md:flex-none bg-brand-500 text-black px-10 py-5 rounded-none font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-brand-600 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-4"
          >
            <i className="fa-solid fa-calendar-plus text-xs"></i>
            Agendar Novo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-0 border border-white/5">
        <div className="xl:col-span-3 bg-[#0A0A0B] p-12 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row justify-between items-center mb-16 gap-10 relative z-10">
            <div className="flex items-center gap-10">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] mb-2">Ponto de Referência</span>
                <h3 className="text-4xl font-black text-white font-serif italic tracking-tighter uppercase whitespace-nowrap">
                  {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                </h3>
              </div>
              <div className="flex gap-1">
                <button onClick={handlePrev} className="h-12 w-12 flex items-center justify-center bg-white/5 border border-white/5 text-slate-500 hover:text-brand-500 transition-all"><i className="fa-solid fa-chevron-left text-xs"></i></button>
                <button onClick={handleNext} className="h-12 w-12 flex items-center justify-center bg-white/5 border border-white/5 text-slate-500 hover:text-brand-500 transition-all"><i className="fa-solid fa-chevron-right text-xs"></i></button>
              </div>
            </div>
            <div className="flex bg-white/5 p-1 border border-white/5">
              {['MÊS', 'SEMANA', 'DIA'].map((t) => (
                <button key={t} onClick={() => setView(t as any)} className={`px-10 py-3 text-[9px] font-black uppercase tracking-widest transition-all ${view === t ? 'bg-brand-500 text-black' : 'text-slate-600 hover:text-slate-300'}`}>{t}</button>
              ))}
            </div>
          </div>

          {view === 'MÊS' && (
            <div className="grid grid-cols-7 border-l border-t border-white/5">
              {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map(d => (
                <div key={d} className="py-6 text-center text-[9px] font-black text-slate-700 tracking-[0.4em] border-r border-b border-white/5 bg-white/[0.02]">{d}</div>
              ))}
              {calendarDays.map((d, i) => {
                const dayMovements = getMovementsForDay(d.fullDate);
                const dayIsToday = isToday(d.fullDate);
                return (
                  <div key={i} onClick={() => handleSelectDay(d.fullDate)} className={`min-h-[160px] p-6 border-r border-b border-white/5 transition-all group hover:bg-white/[0.02] cursor-pointer ${dayIsToday ? 'bg-brand-500/[0.03]' : ''}`}>
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-xl font-black italic tracking-tighter ${d.currentMonth ? 'text-white' : 'text-slate-900'} ${dayIsToday ? 'text-brand-500' : ''}`}>
                        {d.day}
                      </span>
                      {dayIsToday && <div className="h-1 w-1 bg-brand-500 shadow-[0_0_8px_rgba(197,160,89,1)]"></div>}
                    </div>
                    <div className="space-y-2">
                      {dayMovements.slice(0, 3).map((m) => (
                        <div key={m.id} className="flex items-center gap-2 group/task" onClick={(e) => { e.stopPropagation(); setSelectedMovement(m); }}>
                          <div className={`h-[1px] w-3 ${m.type === 'Audiência' ? 'bg-orange-500' : m.type === 'Deadline' ? 'bg-rose-500' : 'bg-brand-500'}`}></div>
                          <p className="text-[9px] font-black uppercase tracking-tighter text-slate-600 truncate group-hover/task:text-white transition-colors">
                            {m.description}
                          </p>
                        </div>
                      ))}
                      {dayMovements.length > 3 && <p className="text-[7px] font-black text-slate-800 uppercase tracking-widest">+ {dayMovements.length - 3} EVENTOS</p>}
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
                  <div key={wd.fullDate} onClick={() => handleSelectDay(wd.fullDate)} className={`flex flex-col lg:flex-row gap-0 border border-white/5 transition-all cursor-pointer group hover:border-brand-500/30 ${dayIsToday ? 'bg-white/[0.03]' : ''}`}>
                    <div className="flex flex-row lg:flex-col items-center justify-center min-w-[120px] p-8 bg-white/[0.01] border-b lg:border-b-0 lg:border-r border-white/5">
                      <span className={`text-[9px] font-black tracking-[0.4em] uppercase ${dayIsToday ? 'text-brand-500' : 'text-slate-800'}`}>{wd.dayName}</span>
                      <span className={`text-5xl font-black italic tracking-tighter ${dayIsToday ? 'text-brand-500' : 'text-white'}`}>{wd.day}</span>
                    </div>
                    <div className="flex-1 divide-y divide-white/5">
                      {dayMovements.length > 0 ? dayMovements.map(m => (
                        <div key={m.id} className="p-8 flex justify-between items-center group/item hover:bg-white/[0.01]" onClick={(e) => { e.stopPropagation(); setSelectedMovement(m); }}>
                          <div className="space-y-2">
                            <span className="text-[8px] font-black text-brand-500 uppercase tracking-[0.4em] opacity-50">{m.time || '09:00'}</span>
                            <h4 className="text-lg font-black text-slate-300 uppercase italic transition-colors group-item-hover:text-white">{m.description}</h4>
                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{m.caseNumber} • {m.source}</p>
                          </div>
                          <span className={`px-4 py-1.5 border font-black text-[8px] tracking-[0.2em] ${formatMovementType(m.type).color}`}>
                            {formatMovementType(m.type).label}
                          </span>
                        </div>
                      )) : <div className="p-12 text-[9px] font-black uppercase text-slate-900 tracking-[0.4em]">Fluxo Operacional Limpo</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {view === 'DIA' && (
            <div className="space-y-20 py-10">
              <div className="flex items-center gap-12 text-white">
                <div className="text-center">
                  <p className="text-[12px] font-black text-brand-500 uppercase tracking-[0.6em] mb-2">{currentDate.toLocaleString('pt-BR', { weekday: 'long' })}</p>
                  <h4 className="text-8xl font-black italic tracking-tighter font-serif leading-none">{currentDate.getDate()}</h4>
                </div>
                <div className="h-20 w-[1px] bg-white/5"></div>
                <div className="space-y-2">
                  <p className="text-4xl font-black italic tracking-tight uppercase">{currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                  <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.8em]">Relatório Diário Operacional</p>
                </div>
              </div>

              <div className="space-y-1">
                {getMovementsForDay(currentDate.toISOString().split('T')[0]).length > 0 ? (
                  getMovementsForDay(currentDate.toISOString().split('T')[0]).map(m => (
                    <div key={m.id} className="group flex flex-col lg:flex-row justify-between items-center p-12 border border-white/5 hover:border-brand-500/50 transition-all duration-700 bg-white/[0.01] hover:bg-white/[0.02]">
                      <div className="space-y-6 flex-1 text-left">
                        <div className="flex items-center gap-6">
                          <span className="text-[10px] font-black text-brand-500 tracking-[0.4em] uppercase">{m.time || '09:00'}</span>
                          <div className="h-[1px] w-12 bg-white/10"></div>
                          <span className={`px-4 py-1 border text-[8px] font-black tracking-widest uppercase ${formatMovementType(m.type).color}`}>{formatMovementType(m.type).label}</span>
                        </div>
                        <h5 className="text-4xl font-black text-white italic tracking-tight font-serif">{m.description}</h5>
                        <div className="flex gap-12">
                          <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-700 uppercase">PROCESSO</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase">{m.caseNumber}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-700 uppercase">INSTÂNCIA</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase">{m.source}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 mt-6 lg:mt-0">
                        <button onClick={() => setSelectedMovement(m)} className="h-14 w-14 bg-white/5 text-slate-600 hover:text-brand-500 transition-all flex items-center justify-center">
                          <i className="fa-solid fa-terminal text-xs"></i>
                        </button>
                        <button onClick={() => handleEditClick(m)} className="h-14 w-14 bg-white/5 text-slate-600 hover:text-white transition-all flex items-center justify-center">
                          <i className="fa-solid fa-pen-nib text-xs"></i>
                        </button>
                      </div>
                    </div>
                  ))
                ) : <p className="py-40 text-center text-[10px] font-black uppercase text-slate-800 tracking-[1em]">Nenhum Movimento Detetado</p>}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Alerts */}
        <div className="bg-white/[0.02] p-12 space-y-20 border-l border-white/5">
          <div className="space-y-10">
            <div className="flex justify-between items-end">
              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">PRIORITÁRIOS</h4>
              <span className="text-[10px] font-black text-rose-500 italic font-serif leading-none">{allDeadlines.length}</span>
            </div>
            <div className="space-y-6">
              {paginatedDeadlines.map((m) => (
                <div key={m.id} onClick={() => handleSelectDay(m.date)} className="p-6 border border-white/5 hover:border-rose-500/30 transition-all cursor-pointer group">
                  <p className="text-[8px] font-black text-slate-700 uppercase mb-2">PRAZO FATAL</p>
                  <h5 className="text-[11px] font-black text-slate-400 group-hover:text-white uppercase transition-colors">{m.description}</h5>
                  <div className="mt-4 flex justify-between items-center">
                    <p className="text-[8px] font-bold text-slate-800">{new Date(m.date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                    <div className="h-1 w-1 bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,1)]"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em]">LEGENDA TÉCNICA</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-4"><div className="h-1 w-4 bg-orange-500"></div><span className="text-[9px] font-black uppercase text-slate-600 tracking-widest">Audiência</span></div>
              <div className="flex items-center gap-4"><div className="h-1 w-4 bg-rose-500"></div><span className="text-[9px] font-black uppercase text-slate-600 tracking-widest">Prazo Fatal</span></div>
              <div className="flex items-center gap-4"><div className="h-1 w-4 bg-brand-500"></div><span className="text-[9px] font-black uppercase text-slate-600 tracking-widest">Notificação</span></div>
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
    </div>
  );
};

export default Agenda;
