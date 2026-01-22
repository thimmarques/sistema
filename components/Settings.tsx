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
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1 text-left">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Escritório Digital</h2>
          <p className="text-slate-500">Gerencie seus dados e preferências do sistema.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-brand-600 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-brand-600/20 hover:bg-brand-700 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
        >
          {isSaving ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-floppy-disk"></i>}
          Salvar Alterações
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-8">
            <div className="space-y-6">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-4 text-left">Perfil</h4>
              <div className="relative group mx-auto w-32 h-32" onClick={() => profileInputRef.current?.click()}>
                <img
                  src={localSettings.profileImage || `https://ui-avatars.com/api/?name=${localSettings.name || 'User'}&background=7e8aee&color=fff`}
                  className="h-full w-full object-cover rounded-3xl border-2 border-slate-100 group-hover:border-brand-300 transition-all cursor-pointer"
                  alt="Profile"
                />
                <div className="absolute inset-0 bg-brand-600/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer">
                  <i className="fa-solid fa-camera text-brand-600 text-xl"></i>
                </div>
                <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'profile')} />
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-4 text-left">Logotipo</h4>
              <div className="h-24 w-full bg-slate-50 border border-slate-200 border-dashed rounded-2xl flex items-center justify-center p-4 group cursor-pointer hover:bg-slate-100 transition-all" onClick={() => logoInputRef.current?.click()}>
                {localSettings.logo ? <img src={localSettings.logo} className="max-h-full max-w-full object-contain" alt="Logo" /> : <i className="fa-solid fa-plus text-slate-300"></i>}
                <input type="file" ref={logoInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'logo')} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <button onClick={onLogout} className="w-full py-3 text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-all border border-slate-100">Sair da Conta</button>
            <button onClick={() => setShowDeleteModal(true)} className="w-full mt-3 py-3 text-rose-500 font-bold text-xs uppercase tracking-widest hover:bg-rose-50 rounded-xl transition-all border border-rose-100">Excluir Conta</button>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-8 md:p-10 space-y-10">
          <section className="space-y-6">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-4 text-left">Informações Pessoais</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" value={localSettings.name} onChange={(e) => setLocalSettings({ ...localSettings, name: e.target.value })} />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                <input type="email" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" value={localSettings.email} onChange={(e) => setLocalSettings({ ...localSettings, email: e.target.value })} />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Especialidade</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" value={localSettings.role} onChange={(e) => setLocalSettings({ ...localSettings, role: e.target.value })} />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Inscrição OAB</label>
                <div className="flex">
                  <select className="bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold px-3 rounded-l-xl outline-none border-r-0" value={localSettings.oabState} onChange={(e) => setLocalSettings({ ...localSettings, oabState: e.target.value })}>
                    {['SP', 'RJ', 'MG', 'PR', 'RS', 'SC', 'ES', 'GO', 'DF'].map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                  <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-r-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" value={localSettings.oab} onChange={(e) => setLocalSettings({ ...localSettings, oab: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">CPF</label>
                <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all" value={localSettings.cpf} onChange={(e) => setLocalSettings({ ...localSettings, cpf: e.target.value })} />
              </div>
            </div>
          </section>

          <section className="space-y-6 pt-6 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-4 text-left">Conexões</h4>
            <div className="flex flex-col md:flex-row items-center gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <div className="h-12 w-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-100"><i className="fa-brands fa-google text-xl text-slate-400"></i></div>
              <div className="flex-1 text-center md:text-left">
                <p className="text-sm font-bold text-slate-900">Sincronização com Google Agenda</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Estado: {settings.googleConnected ? 'Conectado' : 'Desconectado'}</p>
              </div>
              <button
                onClick={settings.googleConnected ? onDisconnectGoogle : onConnectGoogle}
                className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg border transition-all ${settings.googleConnected ? 'border-rose-200 text-rose-500 hover:bg-rose-50' : 'border-brand-200 text-brand-600 hover:bg-brand-50'}`}
              >
                {settings.googleConnected ? 'Desconectar' : 'Conectar agora'}
              </button>
            </div>
          </section>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-10 space-y-8 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-4">
              <div className="h-16 w-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-triangle-exclamation text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Confirmar Exclusão</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Esta ação é irreversível e todos os seus dados serão apagados permanentemente do sistema.</p>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={onDeleteAccount} disabled={isDeleting} className="w-full bg-rose-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 active:scale-95">Excluir Permanentemente</button>
              <button onClick={() => setShowDeleteModal(false)} className="w-full py-3 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-all">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
