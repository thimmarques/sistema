
import React from 'react';
import { AppNotification } from '../types';

interface NotificationCenterProps {
  notifications: AppNotification[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ notifications, onClose, onMarkRead }) => {
  return (
    <div className="absolute right-0 mt-2 w-80 max-h-[480px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-4 duration-200">
      <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 text-sm">Notificações</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark"></i></button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {notifications.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <div 
                key={n.id} 
                className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer relative ${!n.read ? 'bg-indigo-50/30' : ''}`}
                onClick={() => onMarkRead(n.id)}
              >
                {!n.read && <div className="absolute top-4 left-2 h-2 w-2 bg-indigo-600 rounded-full"></div>}
                <div className="pl-4">
                  <div className="flex justify-between items-start mb-1">
                    <p className={`text-xs font-bold ${n.type === 'alert' ? 'text-red-600' : 'text-slate-800'}`}>{n.title}</p>
                    <span className="text-[10px] text-slate-400">{new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-snug">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <i className="fa-solid fa-bell-slash text-slate-200 text-3xl mb-2"></i>
            <p className="text-xs text-slate-400 font-medium">Tudo em dia!</p>
          </div>
        )}
      </div>
      
      <div className="p-3 border-t bg-slate-50 text-center">
        <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700">Ver todas as notificações</button>
      </div>
    </div>
  );
};

export default NotificationCenter;
