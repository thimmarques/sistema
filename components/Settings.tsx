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

  const labelClass = "block text-xs font-semibold uppercase text-slate-500 mb-2 tracking-wide";
  const inputClass = "w-full bg-white border border-slate-200 rounded-lg px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-medium text-slate-900 text-sm placeholder:text-slate-400";

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24 animate-fade-in px-4 md:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-slate-200 pb-8">
        <div className="space-y-2 text-left">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Configurações do Sistema</p>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Escritório Digital</h2>
          <p className="text-sm text-slate-500">Gerencie suas preferências e identidade visual</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full md:w-auto bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold text-xs uppercase tracking-wider hover:bg-blue-700 transition-all active:scale-95 shadow-sm hover:shadow-md flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <i className="fa-solid fa-floppy-disk"></i>}
          Salvar Alterações
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-8 overflow-hidden">
            <div className="space-y-6 text-left">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-4">Identidade Visual</h4>
              <div className="relative group mx-auto w-32 h-32" onClick={() => profileInputRef.current?.click()}>
                <img
                  src={localSettings.profileImage || `https://ui-avatars.com/api/?name=${localSettings.name || 'User'}&background=eff6ff&color=2563eb`}
                  className="h-full w-full object-cover rounded-full border-4 border-slate-50 group-hover:border-blue-100 transition-all cursor-pointer shadow-sm"
                  alt="Profile"
                />
                <div className="absolute inset-0 bg-black/10 rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer">
                  <i className="fa-solid fa-camera text-white text-xl drop-shadow-md"></i>
                </div>
                <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'profile')} />
              </div>
            </div>

            <div className="space-y-6 pt-6 border-t border-slate-100 text-left">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-4">Logotipo</h4>
              <div className="h-28 w-full bg-slate-50 border-2 border-slate-200 border-dashed rounded-lg flex items-center justify-center p-4 group cursor-pointer hover:bg-slate-100 hover:border-blue-300 transition-all" onClick={() => logoInputRef.current?.click()}>
                {localSettings.logo ? <img src={localSettings.logo} className="max-h-full max-w-full object-contain transition-all" alt="Logo" /> : <div className="text-center space-y-2"><i className="fa-solid fa-cloud-arrow-up text-slate-400 text-xl group-hover:text-blue-500"></i><p className="text-xs font-semibold text-slate-500">Carregar Logo</p></div>}
                <input type="file" ref={logoInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'logo')} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col gap-3">
            <button onClick={onLogout} className="w-full py-3 text-slate-600 font-semibold text-xs uppercase tracking-wider hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all border border-slate-200">Sair do Sistema</button>
            <button onClick={() => setShowDeleteModal(true)} className="w-full py-3 text-red-600 font-semibold text-xs uppercase tracking-wider hover:text-white hover:bg-red-600 rounded-lg transition-all border border-red-100">Excluir Conta</button>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-8 md:p-10 space-y-10">
          <section className="space-y-8 text-left">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-4">Dados Profissionais</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className={labelClass}>Nome Completo</label>
                <input type="text" className={inputClass} value={localSettings.name} onChange={(e) => setLocalSettings({ ...localSettings, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>E-mail Corporativo</label>
                <input type="email" className={inputClass} value={localSettings.email} onChange={(e) => setLocalSettings({ ...localSettings, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Especialidade</label>
                <input type="text" className={inputClass} value={localSettings.role} onChange={(e) => setLocalSettings({ ...localSettings, role: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Registro OAB</label>
                <div className="flex bg-white border border-slate-200 rounded-lg focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all overflow-hidden">
                  <select className="bg-slate-50 border-r border-slate-200 text-slate-700 text-xs font-bold px-4 outline-none cursor-pointer hover:bg-slate-100 transition-colors" value={localSettings.oabState} onChange={(e) => setLocalSettings({ ...localSettings, oabState: e.target.value })}>
                    {['SP', 'RJ', 'MG', 'PR', 'RS', 'SC', 'ES', 'GO', 'DF'].map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                  <input type="text" className="w-full bg-transparent border-none px-4 py-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400" value={localSettings.oab} onChange={(e) => setLocalSettings({ ...localSettings, oab: e.target.value })} placeholder="Número" />
                </div>
              </div>
              <div className="space-y-2">
                <label className={labelClass}>CPF</label>
                <input type="text" className={inputClass} value={localSettings.cpf} onChange={(e) => setLocalSettings({ ...localSettings, cpf: e.target.value })} />
              </div>
            </div>
          </section>

          <section className="space-y-8 pt-8 border-t border-slate-100 text-left">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-4">Integrações</h4>
            <div className="flex flex-col md:flex-row items-center gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200 relative overflow-hidden">
              <div className="h-12 w-12 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-700">
                <i className="fa-brands fa-google text-xl text-blue-600"></i>
              </div>
              <div className="flex-1 text-center md:text-left space-y-1">
                <p className="text-sm font-bold text-slate-900">Google Agenda</p>
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <div className={`h-2 w-2 rounded-full ${settings.googleConnected ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                  <p className="text-xs text-slate-500 font-medium">Status: {settings.googleConnected ? 'Conectado' : 'Desconectado'}</p>
                </div>
              </div>
              <button
                onClick={settings.googleConnected ? onDisconnectGoogle : onConnectGoogle}
                className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${settings.googleConnected ? 'border-red-200 text-red-600 hover:bg-red-50' : 'bg-white border-slate-200 text-blue-600 hover:border-blue-300 hover:shadow-sm'}`}
              >
                {settings.googleConnected ? 'Desconectar' : 'Conectar'}
              </button>
            </div>
          </section>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-8 space-y-8 animate-in zoom-in-95">
            <div className="text-center space-y-4">
              <div className="h-16 w-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fa-solid fa-triangle-exclamation text-2xl"></i>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Confirmar Exclusão</h3>
                <p className="text-sm text-slate-500 leading-relaxed">Esta ação é irreversível. Todos os dados, clientes e processos serão permanentemente removidos do sistema.</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={onDeleteAccount} disabled={isDeleting} className="w-full bg-red-600 text-white py-3 rounded-lg font-bold text-sm hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-500/20">Confirmar Exclusão</button>
              <button onClick={() => setShowDeleteModal(false)} className="w-full py-3 text-slate-600 font-semibold text-sm hover:bg-slate-50 rounded-lg transition-all">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
