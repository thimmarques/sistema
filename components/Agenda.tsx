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
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1 text-left">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Calendário Operacional</h2>
          <p className="text-slate-500">Agenda tática e controle de prazos.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleToday}
            className="flex-1 md:flex-none h-12 px-6 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-all shadow-sm"
          >
            Hoje
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex-1 md:flex-none bg-brand-600 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-brand-600/20 hover:bg-brand-700 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <i className="fa-solid fa-calendar-plus text-xs"></i>
            Novo Evento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 md:p-8">
          <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-6">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <h3 className="text-2xl font-bold text-slate-900 capitalize">
                  {currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                </h3>
              </div>
              <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                <button onClick={handlePrev} className="h-8 w-8 flex items-center justify-center text-slate-500 hover:text-brand-600 hover:bg-white rounded-md transition-all"><i className="fa-solid fa-chevron-left text-xs"></i></button>
                <button onClick={handleNext} className="h-8 w-8 flex items-center justify-center text-slate-500 hover:text-brand-600 hover:bg-white rounded-md transition-all"><i className="fa-solid fa-chevron-right text-xs"></i></button>
              </div>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {['MÊS', 'SEMANA', 'DIA'].map((t) => (
                <button key={t} onClick={() => setView(t as any)} className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${view === t ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t}</button>
              ))}
            </div>
          </div>

          {view === 'MÊS' && (
            <div className="grid grid-cols-7 border-l border-t border-slate-100 rounded-xl overflow-hidden shadow-sm">
              {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map(d => (
                <div key={d} className="py-4 text-center text-[10px] font-bold text-slate-400 tracking-widest border-r border-b border-slate-100 bg-slate-50">{d}</div>
              ))}
              {calendarDays.map((d, i) => {
                const dayMovements = getMovementsForDay(d.fullDate);
                const dayIsToday = isToday(d.fullDate);
                return (
                  <div key={i} onClick={() => handleSelectDay(d.fullDate)} className={`min-h-[120px] p-3 border-r border-b border-slate-100 transition-all group hover:bg-slate-50 cursor-pointer ${dayIsToday ? 'bg-brand-50/50' : ''}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-sm font-bold ${d.currentMonth ? (dayIsToday ? 'text-brand-600' : 'text-slate-700') : 'text-slate-300'}`}>
                        {d.day}
                      </span>
                      {dayIsToday && <div className="h-1.5 w-1.5 rounded-full bg-brand-500"></div>}
                    </div>
                    <div className="space-y-1">
                      {dayMovements.slice(0, 3).map((m) => (
                        <div key={m.id} className="flex items-center gap-2 group/task" onClick={(e) => { e.stopPropagation(); setSelectedMovement(m); }}>
                          <div className={`h-1.5 w-1.5 rounded-full ${m.type === 'Audiência' ? 'bg-orange-500' : m.type === 'Deadline' ? 'bg-rose-500' : 'bg-brand-500'}`}></div>
                          <p className="text-[10px] font-bold text-slate-500 truncate group-hover/task:text-brand-600 transition-colors">
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
            <div className="space-y-3">
              {weekDays.map((wd) => {
                const dayMovements = getMovementsForDay(wd.fullDate);
                const dayIsToday = isToday(wd.fullDate);
                return (
                  <div key={wd.fullDate} onClick={() => handleSelectDay(wd.fullDate)} className={`flex flex-col lg:flex-row gap-0 border border-slate-100 rounded-2xl overflow-hidden transition-all cursor-pointer group hover:border-brand-300 shadow-sm ${dayIsToday ? 'bg-brand-50/20' : 'bg-white'}`}>
                    <div className="flex flex-row lg:flex-col items-center justify-center min-w-[100px] p-6 bg-slate-50/50 border-b lg:border-b-0 lg:border-r border-slate-100">
                      <span className={`text-[10px] font-bold tracking-widest uppercase ${dayIsToday ? 'text-brand-600' : 'text-slate-400'}`}>{wd.dayName}</span>
                      <span className={`text-3xl font-bold ${dayIsToday ? 'text-brand-600' : 'text-slate-800'}`}>{wd.day}</span>
                    </div>
                    <div className="flex-1 divide-y divide-slate-100">
                      {dayMovements.length > 0 ? dayMovements.map(m => (
                        <div key={m.id} className="p-4 px-6 flex justify-between items-center group/item hover:bg-slate-50" onClick={(e) => { e.stopPropagation(); setSelectedMovement(m); }}>
                          <div className="space-y-1 text-left">
                            <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">{m.time || '09:00'}</span>
                            <h4 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors uppercase text-sm">{m.description}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.caseNumber} • {m.source}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full font-bold text-[9px] tracking-wider border ${formatMovementType(m.type).color}`}>
                            {formatMovementType(m.type).label}
                          </span>
                        </div>
                      )) : <div className="p-10 text-[10px] font-bold uppercase text-slate-300 tracking-widest text-center">Nenhum evento</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {view === 'DIA' && (
            <div className="space-y-12 py-6">
              <div className="flex items-center gap-8">
                <div className="text-center p-6 bg-brand-50 rounded-3xl min-w-[140px]">
                  <p className="text-[12px] font-bold text-brand-600 uppercase tracking-widest mb-1">{currentDate.toLocaleString('pt-BR', { weekday: 'long' })}</p>
                  <h4 className="text-6xl font-bold text-brand-700 leading-none">{currentDate.getDate()}</h4>
                </div>
                <div className="space-y-1 text-left">
                  <p className="text-2xl font-bold text-slate-900 uppercase tracking-tight">{currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Atividade Operacional do Dia</p>
                </div>
              </div>

              <div className="space-y-3">
                {getMovementsForDay(currentDate.toISOString().split('T')[0]).length > 0 ? (
                  getMovementsForDay(currentDate.toISOString().split('T')[0]).map(m => (
                    <div key={m.id} className="group flex flex-col lg:flex-row justify-between items-center p-6 border border-slate-100 rounded-2xl hover:border-brand-200 transition-all bg-white shadow-sm hover:shadow-md">
                      <div className="space-y-4 flex-1 text-left">
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-bold text-brand-600 tracking-widest uppercase">{m.time || '09:00'}</span>
                          <span className={`px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase border ${formatMovementType(m.type).color}`}>{formatMovementType(m.type).label}</span>
                        </div>
                        <h5 className="text-2xl font-bold text-slate-900 uppercase">{m.description}</h5>
                        <div className="flex gap-8">
                          <div className="space-y-1">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">PROCESSO</p>
                            <p className="text-xs font-bold text-slate-600 uppercase">{m.caseNumber}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">FORO</p>
                            <p className="text-xs font-bold text-slate-600 uppercase">{m.source}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-6 lg:mt-0">
                        <button onClick={() => setSelectedMovement(m)} className="p-3 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all">
                          <i className="fa-solid fa-eye text-sm"></i>
                        </button>
                        <button onClick={() => handleEditClick(m)} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
                          <i className="fa-solid fa-pen-to-square text-sm"></i>
                        </button>
                      </div>
                    </div>
                  ))
                ) : <p className="py-20 text-center text-[10px] font-bold uppercase text-slate-300 tracking-widest">Nenhum Registro detetado</p>}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Alerts */}
        <div className="space-y-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
            <div className="flex justify-between items-end border-b border-slate-100 pb-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Críticos</h4>
              <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded-md text-[10px] font-bold">{allDeadlines.length}</span>
            </div>
            <div className="space-y-4">
              {paginatedDeadlines.map((m) => (
                <div key={m.id} onClick={() => handleSelectDay(m.date)} className="p-4 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-slate-50 transition-all cursor-pointer group text-left">
                  <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest mb-1">PRAZO FATAL</p>
                  <h5 className="text-[11px] font-bold text-slate-800 group-hover:text-brand-700 uppercase transition-colors line-clamp-2">{m.description}</h5>
                  <div className="mt-4 flex justify-between items-center text-[10px] font-bold text-slate-400">
                    <span>{new Date(m.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                    <i className="fa-solid fa-chevron-right text-[8px] group-hover:translate-x-1 transition-transform"></i>
                  </div>
                </div>
              ))}
              {allDeadlines.length === 0 && <p className="text-center text-[10px] font-bold text-slate-300 py-4 uppercase">Nenhum Alerta</p>}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-4">Legenda</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3"><div className="h-2 w-2 rounded-full bg-orange-500"></div><span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Audiência</span></div>
              <div className="flex items-center gap-3"><div className="h-2 w-2 rounded-full bg-rose-500"></div><span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Prazo Fatal</span></div>
              <div className="flex items-center gap-3"><div className="h-2 w-2 rounded-full bg-brand-500"></div><span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Geral</span></div>
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
