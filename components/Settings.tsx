import React, { useRef, useState } from 'react';
import { UserSettings } from '../types';

interface SettingsProps {
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  onAddNotification: (type: 'success' | 'info' | 'alert', title: string, message: string) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onConnectGoogle: () => void;
  onDisconnectGoogle: () => void;
}

const Settings: React.FC<SettingsProps> = ({
  settings,
  onUpdateSettings,
  onAddNotification,
  onLogout,
  onDeleteAccount,
  onConnectGoogle,
  onDisconnectGoogle
}) => {
  const profileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'logo') => {
    const file = e.target.files?.[0];
    setError(null);
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Limite de 2MB excedido.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings({ ...localSettings, [type === 'profile' ? 'profileImage' : 'logo']: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await onUpdateSettings(localSettings);
      onAddNotification('success', 'Terminal Atualizado', 'Parâmetros guardados com sucesso.');
    } catch (err: any) {
      setError(err.message || 'Erro operacional no salvamento.');
    } finally {
      setIsSaving(false);
    }
  };

  const labelClass = "block text-[9px] font-black uppercase text-slate-600 mb-3 tracking-[0.4em]";
  const inputClass = "w-full bg-white/5 border border-white/10 rounded-none px-6 py-5 outline-none focus:border-brand-500 transition-all font-black text-white text-xs placeholder:text-slate-800";

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24 animate-fade-in px-4 md:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 border-b border-white/5 pb-10">
        <div className="space-y-4 text-left">
          <p className="text-[10px] font-black text-brand-500 uppercase tracking-[0.5em]">CONFIGURAÇÕES DE TERMINAL</p>
          <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase font-serif">Escritório Digital</h2>
          <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Protocolo de Preferências e Identidade</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full md:w-auto bg-brand-500 text-black px-12 py-5 font-black text-[11px] uppercase tracking-[0.4em] hover:bg-brand-600 transition-all active:scale-95 shadow-2xl flex items-center justify-center gap-4 disabled:opacity-50"
        >
          {isSaving ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-floppy-disk"></i>}
          CONSOLIDAR PARÂMETROS
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-10">
          <div className="bg-white/[0.02] border border-white/5 p-10 space-y-10 relative overflow-hidden">
            <div className="space-y-8 text-left">
              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.5em] border-b border-white/5 pb-6">IDENTIDADE VISUAL</h4>
              <div className="relative group mx-auto w-40 h-40" onClick={() => profileInputRef.current?.click()}>
                <img
                  src={localSettings.profileImage || `https://ui-avatars.com/api/?name=${localSettings.name || 'User'}&background=7e8aee&color=fff`}
                  className="h-full w-full object-cover border border-white/10 group-hover:border-brand-500 transition-all cursor-pointer grayscale group-hover:grayscale-0"
                  alt="Profile"
                />
                <div className="absolute inset-0 bg-brand-500/10 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer border border-brand-500">
                  <i className="fa-solid fa-camera text-brand-500 text-2xl"></i>
                </div>
                <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'profile')} />
              </div>
            </div>

            <div className="space-y-8 pt-8 border-t border-white/5 text-left">
              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.5em] border-b border-white/5 pb-6">LOGOTIPO INSTITUCIONAL</h4>
              <div className="h-32 w-full bg-white/[0.01] border border-white/5 border-dashed flex items-center justify-center p-6 group cursor-pointer hover:bg-white/[0.03] hover:border-brand-500/30 transition-all" onClick={() => logoInputRef.current?.click()}>
                {localSettings.logo ? <img src={localSettings.logo} className="max-h-full max-w-full object-contain grayscale group-hover:grayscale-0 transition-all" alt="Logo" /> : <div className="text-center space-y-3"><i className="fa-solid fa-plus text-slate-800 text-xl"></i><p className="text-[9px] font-black text-slate-900 uppercase tracking-widest">UPLOAD LOGO</p></div>}
                <input type="file" ref={logoInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'logo')} />
              </div>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 p-8 flex flex-col gap-4">
            <button onClick={onLogout} className="w-full py-5 text-slate-500 font-black text-[9px] uppercase tracking-[0.4em] hover:text-white hover:bg-white/5 transition-all border border-white/5">ENCERRAR SESSÃO</button>
            <button onClick={() => setShowDeleteModal(true)} className="w-full py-5 text-rose-500 font-black text-[9px] uppercase tracking-[0.4em] hover:text-white hover:bg-rose-500 transition-all border border-rose-500/20">EXCLUIR TERMINAL</button>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 p-12 md:p-16 space-y-16">
          <section className="space-y-10 text-left">
            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.5em] border-b border-white/5 pb-8">DADOS DO OPERADOR</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="md:col-span-2 space-y-4">
                <label className={labelClass}>Nome Completo</label>
                <input type="text" className={inputClass} value={localSettings.name} onChange={(e) => setLocalSettings({ ...localSettings, name: e.target.value })} />
              </div>
              <div className="space-y-4">
                <label className={labelClass}>Canal de E-mail</label>
                <input type="email" className={inputClass} value={localSettings.email} onChange={(e) => setLocalSettings({ ...localSettings, email: e.target.value })} />
              </div>
              <div className="space-y-4">
                <label className={labelClass}>Especialidade Operacional</label>
                <input type="text" className={inputClass} value={localSettings.role} onChange={(e) => setLocalSettings({ ...localSettings, role: e.target.value })} />
              </div>
              <div className="space-y-4">
                <label className={labelClass}>Protocolo OAB</label>
                <div className="flex bg-white/5 border border-white/10 focus-within:border-brand-500 transition-all">
                  <select className="bg-transparent border-none text-brand-500 text-[10px] font-black px-6 outline-none appearance-none cursor-pointer" value={localSettings.oabState} onChange={(e) => setLocalSettings({ ...localSettings, oabState: e.target.value })}>
                    {['SP', 'RJ', 'MG', 'PR', 'RS', 'SC', 'ES', 'GO', 'DF'].map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                  <div className="w-[1px] bg-white/10 my-4"></div>
                  <input type="text" className="w-full bg-transparent border-none px-6 py-5 text-[11px] font-black uppercase tracking-widest text-white outline-none" value={localSettings.oab} onChange={(e) => setLocalSettings({ ...localSettings, oab: e.target.value })} />
                </div>
              </div>
              <div className="space-y-4">
                <label className={labelClass}>Identificador CPF</label>
                <input type="text" className={inputClass} value={localSettings.cpf} onChange={(e) => setLocalSettings({ ...localSettings, cpf: e.target.value })} />
              </div>
            </div>
          </section>

          <section className="space-y-10 pt-10 border-t border-white/5 text-left">
            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.5em] border-b border-white/5 pb-8">INTEGRAÇÕES EXTERNAS</h4>
            <div className="flex flex-col md:flex-row items-center gap-10 bg-white/[0.01] p-10 border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-brand-500 opacity-20 group-hover:opacity-100 transition-all"></div>
              <div className="h-16 w-16 bg-white/[0.02] border border-white/5 flex items-center justify-center text-slate-800 transition-all group-hover:text-white">
                <i className="fa-brands fa-google text-2xl"></i>
              </div>
              <div className="flex-1 text-center md:text-left space-y-3">
                <p className="text-sm font-black text-white uppercase tracking-widest">Sincronização de Terminal (Google)</p>
                <div className="flex items-center gap-3 justify-center md:justify-start">
                  <div className={`h-1.5 w-1.5 rounded-full ${settings.googleConnected ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-slate-800'}`}></div>
                  <p className="text-[9px] text-slate-700 font-black uppercase tracking-[0.3em]">Estado: {settings.googleConnected ? 'Ativo' : 'Inativo'}</p>
                </div>
              </div>
              <button
                onClick={settings.googleConnected ? onDisconnectGoogle : onConnectGoogle}
                className={`px-8 py-3 text-[10px] font-black uppercase tracking-[0.3em] transition-all border ${settings.googleConnected ? 'border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white' : 'border-brand-500/20 text-brand-500 hover:bg-brand-500 hover:text-black'}`}
              >
                {settings.googleConnected ? 'DESCONECTAR' : 'AUTENTICAR AGORA'}
              </button>
            </div>
          </section>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in duration-500">
          <div className="bg-brand-900 border border-brand-800 w-full max-lg p-16 space-y-12 animate-in zoom-in-95">
            <div className="text-center space-y-8">
              <div className="h-24 w-24 bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto transition-all">
                <i className="fa-solid fa-triangle-exclamation text-4xl"></i>
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic font-serif">Confirmar Exclusão</h3>
                <p className="text-[11px] text-slate-700 font-black uppercase tracking-widest leading-relaxed">Esta ação é irreversível. Todos os protocolos e dados operacionais serão purgados permanentemente do terminal.</p>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <button onClick={onDeleteAccount} disabled={isDeleting} className="w-full bg-rose-600 text-white py-5 font-black text-[11px] uppercase tracking-[0.4em] hover:bg-rose-700 transition-all active:scale-95 shadow-2xl">CONFIRMAR PURGA DE DADOS</button>
              <button onClick={() => setShowDeleteModal(false)} className="w-full py-5 text-slate-800 font-black text-[9px] uppercase tracking-[0.4em] hover:text-white transition-all">ABORTAR OPERAÇÃO</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
