import React from 'react';
import { AppNotification } from '../types';

interface NotificationCenterProps {
  notifications: AppNotification[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications, onClose, onMarkRead }) => {
  return (
    <div className="absolute right-0 mt-8 w-[420px] max-h-[600px] bg-brand-900 border border-brand-800 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-4 duration-500 z-[200]">
      <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-1.5 w-1.5 rounded-full bg-accent-gold shadow-[0_0_10px_#D4AF37]"></div>
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.5em]">Central de Alertas</h3>
        </div>
        <button onClick={onClose} className="h-10 w-10 flex items-center justify-center text-slate-800 hover:text-white hover:bg-white/5 transition-all">
          <i className="fa-solid fa-xmark text-xs"></i>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {notifications.length > 0 ? (
          <div className="divide-y divide-white/5">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-8 hover:bg-white/5 transition-all cursor-pointer relative group ${!n.read ? 'bg-brand-500/[0.03]' : ''}`}
                onClick={() => onMarkRead(n.id)}
              >
                {!n.read && <div className="absolute top-10 left-4 h-1 w-1 bg-accent-gold shadow-[0_0_8px_#D4AF37]"></div>}
                <div className="pl-6 space-y-3 text-left">
                  <div className="flex justify-between items-start">
                    <p className={`text-[9px] font-black uppercase tracking-[0.3em] ${n.type === 'alert' ? 'text-rose-500' : 'text-brand-500'}`}>
                      {n.title}
                    </p>
                    <span className="text-[8px] font-black text-slate-900 uppercase tracking-widest">
                      {new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className={`text-[11px] leading-relaxed tracking-wide transition-colors ${!n.read ? 'text-white font-black' : 'text-slate-700 font-bold'}`}>
                    {n.message.toUpperCase()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center space-y-6">
            <div className="h-20 w-20 bg-white/[0.01] border border-white/5 flex items-center justify-center mx-auto text-white/5 transition-all">
              <i className="fa-solid fa-radar text-3xl"></i>
            </div>
            <p className="text-[9px] font-black text-slate-900 uppercase tracking-[0.5em]">Nenhum Alerta Ativo</p>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-white/5 bg-white/[0.01]">
        <button className="w-full py-4 text-[9px] font-black text-slate-800 hover:text-brand-500 uppercase tracking-[0.4em] transition-all border border-white/5 hover:border-brand-500/20">
          Arquivar Todos os Protocolos
        </button>
      </div>
    </div>
  );
};

export default NotificationCenter;
