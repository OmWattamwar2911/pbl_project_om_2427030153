import React from 'react';
import { User } from '../types';

interface HeaderProps {
    onLoginClick: () => void;
    onHome: () => void;
    user: User | null;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLoginClick, onHome, user, onLogout }) => {
    return (
        <header className="sticky top-0 z-50 w-full glass border-b border-white/10 px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div onClick={onHome} className="flex items-center gap-2 group cursor-pointer">
                    <div className="p-2 bg-primary rounded-lg neon-glow transition-transform group-hover:scale-105">
                        <span className="material-symbols-outlined text-background-dark font-bold">account_balance_wallet</span>
                    </div>
                    <span className="text-xl font-black tracking-tight text-white uppercase select-none">VanguardAI</span>
                </div>
                
                <nav className="hidden md:flex items-center gap-8">
                    <a href="#" onClick={(e) => { e.preventDefault(); onHome(); }} className="text-sm font-medium text-slate-400 hover:text-primary transition-colors">Features</a>
                    <a href="#" className="text-sm font-medium text-slate-400 hover:text-primary transition-colors">Security</a>
                    <a href="#" className="text-sm font-medium text-slate-400 hover:text-primary transition-colors">Pricing</a>
                    <a href="#" className="text-sm font-medium text-slate-400 hover:text-primary transition-colors">Resources</a>
                </nav>

                <div className="flex items-center gap-4">
                    {!user ? (
                        <>
                            <button onClick={onLoginClick} className="hidden sm:block text-sm font-semibold text-white px-4 py-2 hover:text-primary transition-colors">
                                Login
                            </button>
                            <button onClick={onLoginClick} className="bg-primary text-background-dark px-6 py-2.5 rounded-lg font-bold text-sm neon-glow hover:brightness-110 hover:scale-105 transition-all">
                                Get Started
                            </button>
                        </>
                    ) : (
                         <div className="flex items-center gap-4">
                             <div className="flex items-center gap-3">
                                 <span className="hidden sm:block text-sm text-slate-400">Hi, {user.name}</span>
                                 <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary text-primary flex items-center justify-center">
                                    <span className="material-symbols-outlined text-sm">person</span>
                                 </div>
                             </div>
                             <button onClick={onLogout} className="text-slate-500 hover:text-white transition-colors" title="Logout">
                                <span className="material-symbols-outlined">logout</span>
                             </button>
                         </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;