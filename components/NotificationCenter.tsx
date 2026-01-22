import React from 'react';
import { AppNotification } from '../types';

interface NotificationCenterProps {
  notifications: AppNotification[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications, onClose, onMarkRead }) => {
  return (
    <div className="absolute right-0 mt-6 w-96 max-h-[500px] bg-[#0A0A0B] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-6 duration-500 z-[200]">
      <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.5em] italic">Centro de Notificações</h3>
        <button onClick={onClose} className="text-slate-600 hover:text-white transition-all"><i className="fa-solid fa-xmark text-xs"></i></button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {notifications.length > 0 ? (
          <div className="divide-y divide-white/5">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-8 hover:bg-white/[0.01] transition-all cursor-pointer relative group ${!n.read ? 'bg-white/[0.02]' : ''}`}
                onClick={() => onMarkRead(n.id)}
              >
                {!n.read && <div className="absolute top-8 left-4 h-1 w-1 bg-brand-500 shadow-[0_0_8px_rgba(197,160,89,1)]"></div>}
                <div className="pl-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <p className={`text-[9px] font-black uppercase tracking-widest ${n.type === 'alert' ? 'text-rose-500' : 'text-brand-500'}`}>{n.title}</p>
                    <span className="text-[8px] font-black text-slate-800 uppercase">{new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed group-hover:text-slate-300 transition-colors uppercase tracking-tighter italic">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center space-y-4">
            <i className="fa-solid fa-bell-slash text-slate-900 text-3xl"></i>
            <p className="text-[9px] font-black text-slate-800 uppercase tracking-[0.5em]">SEM PENDÊNCIAS</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/5 bg-white/[0.01] text-center">
        <button className="text-[9px] font-black text-slate-700 hover:text-brand-500 uppercase tracking-widest transition-all">LIMPAR PROTOCOLO</button>
      </div>
    </div>
  );
};

export default NotificationCenter;
