import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, LogIn, UserPlus, Chrome } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
    onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
    const { user, signInWithGoogle, signInWithEmail, signUp } = useAuth();
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Auto-close when user is logged in
    useEffect(() => {
        if (user) {
            onClose();
        }
    }, [user, onClose]);
    const handleGoogleSignIn = async () => {
        setError('');
        setLoading(true);
        try {
            await signInWithGoogle();
            onClose();
        } catch (e: any) {
            setError(e.message ?? 'Erro ao entrar com Google.');
            setLoading(false);
        }
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (mode === 'login') {
                await signInWithEmail(email, password);
            } else {
                await signUp(email, password);
            }
            onClose();
        } catch (e: any) {
            const msg: Record<string, string> = {
                'auth/invalid-credential': 'E-mail ou senha incorretos.',
                'auth/email-already-in-use': 'Esse e-mail já está cadastrado.',
                'auth/weak-password': 'A senha deve ter ao menos 6 caracteres.',
                'auth/invalid-email': 'E-mail inválido.',
            };
            setError(msg[e.code] ?? e.message ?? 'Erro desconhecido.');
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ scale: 0.92, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.92, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-red-600 px-6 py-5 flex items-center justify-between">
                        <div>
                            <h2 className="text-white text-xl font-black tracking-tight">
                                {mode === 'login' ? 'Entrar' : 'Criar Conta'}
                            </h2>
                            <p className="text-red-200 text-xs mt-0.5 font-medium">DefiniDEX</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/70 hover:text-white transition-colors p-1 rounded-xl hover:bg-white/10"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="space-y-4">
                            {/* Google Button */}
                            <button
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-zinc-200 rounded-2xl font-bold text-zinc-700 hover:border-red-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Entrar com Google
                            </button>

                            {/* Divider */}
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-px bg-zinc-200" />
                                <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">ou</span>
                                <div className="flex-1 h-px bg-zinc-200" />
                            </div>

                            {/* Email form */}
                            <form onSubmit={handleEmailSubmit} className="space-y-3">
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    <input
                                        type="email"
                                        placeholder="E-mail"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none text-sm font-medium transition-all"
                                    />
                                </div>

                                <div className="relative">
                                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                                    <input
                                        type="password"
                                        placeholder="Senha"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-zinc-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 outline-none text-sm font-medium transition-all"
                                    />
                                </div>

                                {error && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-red-600 text-xs font-semibold bg-red-50 px-3 py-2 rounded-lg border border-red-200"
                                    >
                                        {error}
                                    </motion.p>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                                >
                                    {mode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
                                    {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar Conta'}
                                </button>
                            </form>

                            {/* Toggle login/signup */}
                            <p className="text-center text-xs text-zinc-500">
                                {mode === 'login' ? 'Não tem conta? ' : 'Já tem conta? '}
                                <button
                                    onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
                                    className="text-red-600 font-bold hover:underline"
                                >
                                    {mode === 'login' ? 'Cadastrar' : 'Entrar'}
                                </button>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
