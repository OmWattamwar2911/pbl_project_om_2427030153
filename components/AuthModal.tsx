import React, { useState } from 'react';
import { User } from '../types';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: (user: User) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            onLogin({
                email,
                name: email.split('@')[0]
            });
            onClose();
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative w-full max-w-md bg-background-dark border border-white/10 rounded-3xl p-8 shadow-2xl animate-fade-in-up">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                    <span className="material-symbols-outlined">close</span>
                </button>

                <div className="text-center mb-8">
                    <div className="inline-flex p-3 bg-primary/10 rounded-2xl mb-4 text-primary">
                        <span className="material-symbols-outlined text-3xl">lock_person</span>
                    </div>
                    <h2 className="text-2xl font-black text-white">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                    <p className="text-slate-400 text-sm mt-2">Secure access to your financial future</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                             <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Full Name</label>
                             <input type="text" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" placeholder="John Doe" />
                        </div>
                    )}
                    <div>
                        <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Email Address</label>
                        <input 
                            type="email" 
                            required 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" 
                            placeholder="you@example.com" 
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Password</label>
                        <input 
                            type="password" 
                            required 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" 
                            placeholder="••••••••" 
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-primary text-background-dark font-bold py-4 rounded-xl mt-4 neon-glow hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                        {isLogin ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                <div className="mt-6 pt-6 border-t border-white/5 text-center">
                    <p className="text-slate-400 text-sm">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-bold hover:underline">
                            {isLogin ? 'Sign up' : 'Log in'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
