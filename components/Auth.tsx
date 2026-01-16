
import React, { useState } from 'react';
import { supabase } from '../src/lib/supabase';

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
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (signUpError) throw signUpError;
                alert('Cadastro realizado! Verifique seu e-mail para confirmar.');
            } else {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (signInError) throw signInError;
                onSuccess();
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao processar autenticação');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden font-sans">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-slate-500/10 rounded-full blur-[120px] animate-pulse"></div>

            <div className="w-full max-w-md p-8 relative z-10">
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl p-8 md:p-10">
                    <div className="flex flex-col items-center mb-10">
                        <div className="h-16 w-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 mb-6">
                            <i className="fa-solid fa-scale-balanced text-white text-2xl"></i>
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight uppercase">LexAI Management</h1>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-2">Acesso Privado</p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-6">
                        {error && (
                            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-3 animate-in shake duration-500">
                                <i className="fa-solid fa-circle-exclamation text-base"></i>
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail Profissional</label>
                            <div className="relative">
                                <i className="fa-solid fa-envelope absolute left-5 top-1/2 -translate-y-1/2 text-slate-500"></i>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@parceiro.adv.br"
                                    required
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha de Acesso</label>
                            <div className="relative">
                                <i className="fa-solid fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-slate-500"></i>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-2xl pl-12 pr-14 py-4 text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                >
                                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-black text-xs uppercase tracking-[0.2em] py-5 rounded-2xl shadow-xl shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <>
                                    <i className="fa-solid fa-circle-notch animate-spin text-lg"></i>
                                    Processando...
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-right-to-bracket text-lg"></i>
                                    {isSignUp ? 'Cadastrar Escritório' : 'Entrar no Sistema'}
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
                        >
                            {isSignUp ? 'Já possui uma conta? Entrar' : 'Novo por aqui? Criar conta'}
                        </button>
                        <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em]">
                            LexAI Legal &bull; Segurança de Ponta
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;
