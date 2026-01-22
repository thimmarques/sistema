import React from 'react';
import { AppNotification } from '../types';

interface NotificationCenterProps {
  notifications: AppNotification[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications, onClose, onMarkRead }) => {
  return (
    <div className="absolute right-0 mt-6 w-96 max-h-[500px] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-4 duration-300 z-[200]">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-brand-500"></div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Notificações</h3>
        </div>
        <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-all">
          <i className="fa-solid fa-xmark text-xs"></i>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {notifications.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-6 hover:bg-slate-50 transition-all cursor-pointer relative group ${!n.read ? 'bg-brand-50/30' : ''}`}
                onClick={() => onMarkRead(n.id)}
              >
                {!n.read && <div className="absolute top-7 left-3 h-2 w-2 rounded-full bg-brand-500"></div>}
                <div className="pl-4 space-y-1 text-left">
                  <div className="flex justify-between items-start">
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${n.type === 'alert' ? 'text-rose-600' : 'text-brand-600'}`}>
                      {n.title}
                    </p>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">
                      {new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed transition-colors ${!n.read ? 'text-slate-900 font-semibold' : 'text-slate-500 font-medium'}`}>
                    {n.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center space-y-4">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
              <i className="fa-solid fa-bell-slash text-2xl"></i>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nenhuma notificação</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50/30 text-center">
        <button className="text-[10px] font-bold text-slate-500 hover:text-brand-600 uppercase tracking-widest transition-all">
          Marcar todas como lidas
        </button>
      </div>
    </div>
  );
};

export default NotificationCenter;
