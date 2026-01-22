import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface AuthProps {
    onSuccess: () => void;
}

const Auth: React.FC<AuthProps> = ({ onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (isSignUp) {
                const { error: signUpError } = await supabase.auth.signUp({ email, password });
                if (signUpError) throw signUpError;
                alert('CONTA CRIADA. VERIFIQUE SEU TERMINAL DE E-MAIL.');
            } else {
                const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
                if (signInError) throw signInError;
                onSuccess();
            }
        } catch (err: any) {
            setError(err.message || 'FALHA NA AUTENTICAÇÃO OPERACIONAL');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#0A0A0B] relative overflow-hidden">
            {/* Structural Background Accents */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-white/[0.01] skew-x-[-20deg] translate-x-1/2"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-500/5 rounded-full blur-[150px] pointer-events-none"></div>

            <div className="w-full max-w-lg p-12 relative z-10">
                <div className="bg-[#0A0A0B] border border-white/10 p-16 space-y-12 animate-in fade-in duration-1000">
                    <div className="flex flex-col items-center space-y-6">
                        <div className="h-20 w-20 border border-brand-500 flex items-center justify-center relative group">
                            <div className="absolute inset-0 bg-brand-500/20 blur-xl group-hover:bg-brand-500/40 transition-all"></div>
                            <i className="fa-solid fa-scale-balanced text-brand-500 text-3xl relative z-10"></i>
                        </div>
                        <div className="text-center space-y-2">
                            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase font-serif">LexAI</h1>
                            <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em]">Sistema de Gestão de Elite</p>
                        </div>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-10">
                        {error && (
                            <div className="bg-rose-500/5 border border-rose-500/20 text-rose-500 p-5 text-[10px] font-black uppercase tracking-widest flex items-center gap-4 animate-in slide-in-from-top-4">
                                <i className="fa-solid fa-triangle-exclamation"></i>
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em]">Identificação (E-mail)</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="USUARIO@ESCRITORIO.ADV.BR"
                                required
                                className="w-full bg-white/5 border border-white/10 p-5 text-xs font-black uppercase tracking-widest text-white outline-none focus:border-brand-500 transition-all placeholder:text-slate-900"
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-[9px] font-black text-slate-700 uppercase tracking-[0.3em]">Código de Acesso (Senha)</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full bg-white/5 border border-white/10 p-5 text-xs font-black uppercase tracking-widest text-white outline-none focus:border-brand-500 transition-all placeholder:text-slate-900"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-800 hover:text-white transition-all">
                                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-brand-500 text-black py-6 font-black text-[11px] uppercase tracking-[0.4em] hover:bg-brand-600 transition-all active:scale-95 shadow-2xl relative group"
                        >
                            {loading ? (
                                <i className="fa-solid fa-circle-notch animate-spin text-lg"></i>
                            ) : (
                                <span className="group-hover:tracking-[0.5em] transition-all">{isSignUp ? 'REGISTRAR TERMINAL' : 'INICIAR SESSÃO'}</span>
                            )}
                        </button>
                    </form>

                    <div className="pt-10 border-t border-white/5 flex flex-col items-center space-y-6">
                        <button onClick={() => setIsSignUp(!isSignUp)} className="text-[9px] font-black text-slate-700 hover:text-white uppercase tracking-widest transition-all">
                            {isSignUp ? 'SESSÃO EXISTENTE / LOGIN' : 'REQUISITAR NOVO TERMINAL'}
                        </button>
                        <div className="h-1 w-8 bg-brand-500/30"></div>
                        <p className="text-[8px] text-slate-900 font-black uppercase tracking-[0.8em]">LexAI &bull; Protocolo 2025</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;
