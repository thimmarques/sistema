
// Import React to fix namespace errors
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

  // Sync local state if global settings change (e.g., initial load)
  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'logo') => {
    const file = e.target.files?.[0];
    setError(null);

    if (file) {
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        setError(`O arquivo é muito grande (${(file.size / 1024 / 1024).toFixed(2)}MB). O limite para o logo é de 2MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings({
          ...localSettings,
          [type === 'profile' ? 'profileImage' : 'logo']: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await onUpdateSettings(localSettings);
      onAddNotification('success', 'Perfil Atualizado', 'Suas informações foram salvas com sucesso!');
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar as configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await onDeleteAccount();
    } catch (err) {
      // Error handled in App.tsx via addNotification
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const labelClass = "block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest";
  const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-medium text-slate-700 placeholder:text-slate-300";

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32 animate-in fade-in duration-500 relative">
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        {/* Header de Perfil */}
        <div className="p-8 border-b bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col sm:flex-row gap-8 items-center">
          <div className="relative group cursor-pointer" onClick={() => profileInputRef.current?.click()}>
            <div className="h-32 w-32 rounded-[2.5rem] border-4 border-slate-700 shadow-2xl overflow-hidden relative">
              <img
                src={localSettings.profileImage || `https://ui-avatars.com/api/?name=${localSettings.name || 'User'}&background=1e293b&color=fff`}
                className="h-full w-full object-cover transition-transform group-hover:scale-110 duration-500"
                alt="Profile"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <i className="fa-solid fa-camera text-white text-2xl"></i>
              </div>
            </div>
            <button className="absolute -bottom-2 -right-2 bg-amber-500 text-white h-10 w-10 rounded-2xl flex items-center justify-center shadow-lg border-2 border-slate-900 z-10">
              <i className="fa-solid fa-pen-to-square text-sm"></i>
            </button>
            <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'profile')} />
          </div>

          <div className="text-center sm:text-left flex-1">
            <h3 className="text-3xl font-black text-white tracking-tight">{localSettings.name || 'Seu Nome Profissional'}</h3>
            <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-2">
              <span className="px-3 py-1 bg-amber-500/20 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/30">{localSettings.role || 'Advogado'}</span>
              <span className="px-3 py-1 bg-white/10 text-slate-300 rounded-full text-[10px] font-black uppercase tracking-widest">OAB/{localSettings.oabState || 'SP'} {localSettings.oab || '...'}</span>
            </div>
          </div>
        </div>

        <div className="p-10 space-y-12">
          {error && (
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
              <i className="fa-solid fa-circle-exclamation text-rose-500"></i>
              <p className="text-xs font-bold text-rose-600">{error}</p>
            </div>
          )}

          {/* Seção 1: Dados Institucionais */}
          <section className="space-y-8">
            <h4 className="font-black text-slate-800 flex items-center gap-3 text-lg uppercase tracking-wider">
              <div className="h-8 w-8 bg-slate-900 rounded-xl flex items-center justify-center text-white text-sm">
                <i className="fa-solid fa-user-tie"></i>
              </div>
              Dados Institucionais
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10">
              <div className="col-span-1 sm:col-span-2">
                <label className={labelClass}>Nome Profissional Completo</label>
                <input type="text" placeholder="Ex: Dr. João Silva" className={inputClass} value={localSettings.name} onChange={(e) => setLocalSettings({ ...localSettings, name: e.target.value })} />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className={labelClass}>E-mail Profissional</label>
                <input type="email" placeholder="Ex: contato@adv.oabsp.org.br" className={inputClass} value={localSettings.email} onChange={(e) => setLocalSettings({ ...localSettings, email: e.target.value })} />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className={labelClass}>Cargo / Especialidade</label>
                <input type="text" placeholder="Ex: Advogado Civilista" className={inputClass} value={localSettings.role} onChange={(e) => setLocalSettings({ ...localSettings, role: e.target.value })} />
              </div>
              <div className="col-span-1">
                <label className={labelClass}>Inscrição na OAB</label>
                <div className="flex gap-2">
                  <select
                    className="w-24 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-4 outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-black text-slate-700 text-xs"
                    value={localSettings.oabState}
                    onChange={(e) => setLocalSettings({ ...localSettings, oabState: e.target.value })}
                  >
                    {['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'].map(uf => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Ex: 000.000"
                    className={`${inputClass} flex-1`}
                    value={localSettings.oab}
                    onChange={(e) => setLocalSettings({ ...localSettings, oab: e.target.value })}
                  />
                </div>
              </div>
              <div className="col-span-1">
                <label className={labelClass}>CPF do Advogado</label>
                <input type="text" placeholder="Ex: 000.000.000-00" className={inputClass} value={localSettings.cpf} onChange={(e) => setLocalSettings({ ...localSettings, cpf: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Endereço Profissional</label>
                <input type="text" placeholder="Rua, Número, Bairro, Cidade - UF" className={inputClass} value={localSettings.address} onChange={(e) => setLocalSettings({ ...localSettings, address: e.target.value })} />
              </div>
            </div>
          </section>

          {/* Seção 2: Identidade Visual */}
          <section className="space-y-6 pt-6 border-t border-slate-100">
            <h4 className="font-black text-slate-800 flex items-center gap-3 text-lg uppercase tracking-wider">
              <div className="h-8 w-8 bg-amber-500 rounded-xl flex items-center justify-center text-slate-900 text-sm">
                <i className="fa-solid fa-palette"></i>
              </div>
              Identidade Visual do Escritório
            </h4>

            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
                <i className="fa-solid fa-triangle-exclamation"></i>
                {error}
              </div>
            )}

            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 flex flex-col md:flex-row items-center gap-8">
              <div className="w-full md:w-64 h-32 bg-slate-900 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-800 shadow-inner group relative">
                {localSettings.logo ? (
                  <img src={localSettings.logo} className="max-h-full max-w-full object-contain p-4" alt="Logo Escritório" />
                ) : (
                  <div className="text-center">
                    <i className="fa-solid fa-image text-slate-700 text-3xl mb-2"></i>
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Sem Logotipo</p>
                  </div>
                )}
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer"
                >
                  <i className="fa-solid fa-upload text-white mb-2"></i>
                  <span className="text-[9px] text-white font-black uppercase tracking-widest">Alterar Logotipo</span>
                </div>
              </div>
              <div className="flex-1 space-y-2 text-center md:text-left">
                <p className="text-sm font-bold text-slate-800">Logotipo Oficial do Escritório</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Este logotipo será exibido na barra lateral e no cabeçalho de todos os documentos gerados em PDF.
                </p>
                <div className="mt-2 p-3 bg-white border border-slate-200 rounded-xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Requisitos de Upload:</p>
                  <ul className="text-[10px] text-slate-500 space-y-1">
                    <li><i className="fa-solid fa-check text-emerald-500 mr-1"></i> Máximo 2MB de tamanho.</li>
                    <li><i className="fa-solid fa-check text-emerald-500 mr-1"></i> Formato PNG transparente recomendado.</li>
                    <li><i className="fa-solid fa-check text-emerald-500 mr-1"></i> Proporção horizontal recomendada.</li>
                  </ul>
                </div>
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="mt-4 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                >
                  Upload do Logotipo
                </button>
                <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
              </div>
            </div>
          </section>

          {/* Seção 3: Preferências e Notificações */}
          <section className="space-y-6 pt-6 border-t border-slate-100">
            <h4 className="font-black text-slate-800 flex items-center gap-3 text-lg uppercase tracking-wider">
              <div className="h-8 w-8 bg-indigo-500 rounded-xl flex items-center justify-center text-white text-sm">
                <i className="fa-solid fa-bell"></i>
              </div>
              Preferências e Notificações
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner">
                <div>
                  <p className="text-sm font-bold text-slate-800">Alertas de Prazos</p>
                  <p className="text-xs text-slate-500 mt-1">Exibir avisos de prazos no Dashboard.</p>
                </div>
                <button
                  onClick={() => setLocalSettings({ ...localSettings, notifyDeadlines: !localSettings.notifyDeadlines })}
                  className={`h-7 w-12 rounded-full transition-all relative ${localSettings.notifyDeadlines ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 h-5 w-5 bg-white rounded-full transition-all shadow-sm ${localSettings.notifyDeadlines ? 'left-6' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner">
                <label className={labelClass}>Antecedência do Alerta (Dias)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="15"
                    className="flex-1 accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    value={localSettings.deadlineThresholdDays}
                    onChange={(e) => setLocalSettings({ ...localSettings, deadlineThresholdDays: parseInt(e.target.value) })}
                  />
                  <span className="min-w-[45px] text-center font-black text-indigo-600 bg-white border border-slate-200 rounded-lg py-1.5 text-xs shadow-sm">
                    {localSettings.deadlineThresholdDays}d
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Seção 4: Integrações */}
          <section className="space-y-6 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-slate-800 flex items-center gap-3 text-lg uppercase tracking-wider">
                <div className="h-8 w-8 bg-red-500 rounded-xl flex items-center justify-center text-white text-sm">
                  <i className="fa-solid fa-link"></i>
                </div>
                Integrações Externas
              </h4>
              {settings.googleConnected && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                  <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Conectado
                </span>
              )}
            </div>

            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                  <i className="fa-brands fa-google text-3xl text-red-500"></i>
                </div>
                <div className="flex-1 text-center md:text-left space-y-1">
                  <h5 className="font-black text-slate-800 uppercase text-xs tracking-wider">Google Agenda (Calendar)</h5>
                  <p className="text-xs text-slate-500">Sincronize seus prazos e audiências do LexAI diretamente com seu calendário pessoal do Google.</p>
                  {settings.googleConnected && (
                    <p className="text-[10px] font-bold text-indigo-600 mt-2 flex items-center justify-center md:justify-start gap-1">
                      <i className="fa-solid fa-circle-check"></i>
                      Vinculado a: {settings.googleEmail}
                    </p>
                  )}
                </div>
                <div className="w-full md:w-auto">
                  {settings.googleConnected ? (
                    <button
                      onClick={onDisconnectGoogle}
                      className="w-full md:w-auto px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                    >
                      Desconectar
                    </button>
                  ) : (
                    <button
                      onClick={onConnectGoogle}
                      className="w-full md:w-auto px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <i className="fa-brands fa-google"></i>
                      Conectar Google
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Botão Salvar Fixo/Destaque */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-8 border-t border-slate-100">
            <div className="flex gap-4 w-full sm:w-auto">
              <button
                onClick={onLogout}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                <i className="fa-solid fa-right-from-bracket"></i>
                Sair do Sistema
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-rose-50 text-rose-500 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-rose-100 transition-all"
              >
                <i className="fa-solid fa-user-slash"></i>
                Excluir Conta
              </button>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`
                w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 bg-slate-900 text-white rounded-[1.5rem] font-bold text-sm uppercase tracking-widest
                transition-all duration-300 shadow-xl shadow-slate-900/20 active:scale-95
                ${isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-amber-600 hover:shadow-amber-500/20'}
              `}
            >
              {isSaving ? (
                <>
                  <i className="fa-solid fa-circle-notch animate-spin"></i>
                  Salvando...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-floppy-disk"></i>
                  Salvar Informações
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 space-y-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-4">
              <div className="h-20 w-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-3xl mx-auto ring-8 ring-rose-50/50">
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Cuidado Especial!</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                Você está prestes a excluir sua conta LexAI permanentemente. Suas configurações pessoais e vínculo com o escritório serão removidos. Esta ação <b>não pode ser desfeita</b>.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isDeleting ? (
                  <>
                    <i className="fa-solid fa-circle-notch animate-spin"></i>
                    Excluindo...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-user-xmark"></i>
                    Sim, Excluir Minha Conta
                  </>
                )}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="w-full py-4 text-xs font-black uppercase text-slate-400 hover:text-slate-600 transition-all tracking-widest disabled:opacity-50"
              >
                Cancelar Operação
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
        LexAI Legal Management &bull; Sistema de Gestão Inteligente
      </p>
    </div>
  );
};

export default Settings;
