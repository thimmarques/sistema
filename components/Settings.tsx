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
    <div className="max-w-6xl mx-auto space-y-16 pb-40 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row justify-between items-end gap-10">
        <div className="space-y-2 text-left">
          <span className="text-[9px] font-black text-brand-500 uppercase tracking-[0.4em]">Parâmetros Globais</span>
          <h2 className="text-4xl font-black text-white font-serif italic tracking-tight">Configurações de Terminal</h2>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="bg-brand-500 text-black px-12 py-5 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-brand-600 transition-all flex items-center gap-4">
          {isSaving ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-floppy-disk"></i>}
          SINCRONIZAR TERMINAL
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border border-white/5">
        <div className="lg:col-span-1 bg-white/[0.02] p-12 space-y-12 border-r border-white/5">
          <div className="space-y-8">
            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.5em] italic">Identidade Visual</h4>
            <div className="relative h-48 w-48 mx-auto border border-white/10 p-2 group cursor-pointer" onClick={() => profileInputRef.current?.click()}>
              <img src={localSettings.profileImage || `https://ui-avatars.com/api/?name=${localSettings.name || 'User'}&background=0A0A0B&color=fff`} className="h-full w-full object-cover filter grayscale hover:grayscale-0 transition-all duration-700" alt="Profile" />
              <div className="absolute inset-0 bg-brand-500/20 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                <i className="fa-solid fa-terminal text-black text-2xl"></i>
              </div>
              <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'profile')} />
            </div>
          </div>

          <div className="space-y-6 pt-12 border-t border-white/5">
            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.5em] italic">Logotipo Institucional</h4>
            <div className="h-32 w-full bg-white/5 border border-white/10 flex items-center justify-center p-8 group cursor-pointer relative" onClick={() => logoInputRef.current?.click()}>
              {localSettings.logo ? <img src={localSettings.logo} className="max-h-full max-w-full object-contain grayscale" alt="Logo" /> : <i className="fa-solid fa-image text-slate-800"></i>}
              <input type="file" ref={logoInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'logo')} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 p-12 space-y-16">
          <section className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="md:col-span-2">
                <label className={labelClass}>Identificação Profissional</label>
                <input type="text" className={inputClass} value={localSettings.name} onChange={(e) => setLocalSettings({ ...localSettings, name: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Canal Hidrográfico (E-mail)</label>
                <input type="email" className={inputClass} value={localSettings.email} onChange={(e) => setLocalSettings({ ...localSettings, email: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Patente (Cargo)</label>
                <input type="text" className={inputClass} value={localSettings.role} onChange={(e) => setLocalSettings({ ...localSettings, role: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Inscrição OAB</label>
                <div className="flex">
                  <select className="bg-white/5 border border-white/10 text-white text-[10px] font-black px-4 outline-none border-r-0" value={localSettings.oabState} onChange={(e) => setLocalSettings({ ...localSettings, oabState: e.target.value })}>
                    {['SP', 'RJ', 'MG', 'PR', 'RS', 'SC', 'ES', 'GO', 'DF'].map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                  <input type="text" className={inputClass} value={localSettings.oab} onChange={(e) => setLocalSettings({ ...localSettings, oab: e.target.value })} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Número de Cadastro (CPF)</label>
                <input type="text" className={inputClass} value={localSettings.cpf} onChange={(e) => setLocalSettings({ ...localSettings, cpf: e.target.value })} />
              </div>
            </div>
          </section>

          <section className="space-y-10 pt-16 border-t border-white/5">
            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.5em] italic">Protocolos de Integração</h4>
            <div className="flex flex-col md:flex-row items-center gap-10 bg-white/5 p-10 border border-white/5">
              <div className="h-16 w-16 bg-white/[0.02] border border-white/10 flex items-center justify-center"><i className="fa-brands fa-google text-2xl text-slate-700"></i></div>
              <div className="flex-1 text-center md:text-left">
                <p className="text-xs font-black text-white uppercase tracking-widest">Sincronização Cloud (Calendar)</p>
                <p className="text-[10px] text-slate-600 mt-2 font-black uppercase tracking-tighter">Estado: {settings.googleConnected ? 'Ativo' : 'Inativo'}</p>
              </div>
              <button onClick={settings.googleConnected ? onDisconnectGoogle : onConnectGoogle} className={`px-8 py-3 text-[9px] font-black uppercase tracking-widest border transition-all ${settings.googleConnected ? 'border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white' : 'border-brand-500 text-brand-500 hover:bg-brand-500 hover:text-black'}`}>
                {settings.googleConnected ? 'DESCONECTAR' : 'VINCULAR AGORA'}
              </button>
            </div>
          </section>

          <div className="flex flex-col md:flex-row gap-6 pt-16 border-t border-white/5 justify-between">
            <div className="flex gap-4">
              <button onClick={onLogout} className="px-8 py-4 bg-white/5 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">TERMINAR SESSÃO</button>
              <button onClick={() => setShowDeleteModal(true)} className="px-8 py-4 bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all">ELIMINAR TERMINAL</button>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A0A0B]/90 backdrop-blur-xl p-4">
          <div className="bg-[#0A0A0B] border border-white/10 w-full max-w-lg p-16 space-y-10">
            <div className="text-center space-y-6">
              <i className="fa-solid fa-triangle-exclamation text-rose-500 text-4xl"></i>
              <h3 className="text-3xl font-black text-white italic tracking-tighter font-serif">ELIMINAÇÃO CRÍTICA</h3>
              <p className="text-[10px] font-black text-slate-600 tracking-[0.2em] leading-relaxed uppercase">Esta ação destruirá todos os parâmetros locais de terminal e vículos de rede permanentemente.</p>
            </div>
            <div className="flex flex-col gap-4">
              <button onClick={onDeleteAccount} disabled={isDeleting} className="w-full bg-rose-600 text-white py-5 font-black text-xs uppercase tracking-[0.2em] hover:bg-rose-700 transition-all">CONFIRMAR DESTRUIÇÃO</button>
              <button onClick={() => setShowDeleteModal(false)} className="w-full text-[9px] font-black uppercase text-slate-800 tracking-widest hover:text-white transition-all">CANCELAR PROTOCOLO</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
