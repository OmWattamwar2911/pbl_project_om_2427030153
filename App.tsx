import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Hero from './components/Hero';
import Features from './components/Features';
import Security from './components/Security';
import Dashboard from './components/Dashboard';
import AuthModal from './components/AuthModal';
import { User } from './types';

type ViewState = 'landing' | 'dashboard';

const App: React.FC = () => {
    const [view, setView] = useState<ViewState>('landing');
    const [user, setUser] = useState<User | null>(null);
    const [isAuthModalOpen, setAuthModalOpen] = useState(false);

    const handleLogin = (loggedInUser: User) => {
        setUser(loggedInUser);
        setView('dashboard');
        // In a real app, we would store token in localStorage here
    };

    const handleLogout = () => {
        setUser(null);
        setView('landing');
    };

    const handleHome = () => {
        setView('landing');
    };

    return (
        <div className="relative min-h-screen flex flex-col bg-background-dark text-slate-100 font-display overflow-x-hidden">
            {/* Background Ambient Effects */}
            <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
            <div className="fixed bottom-1/4 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] -z-10 pointer-events-none"></div>

            <Header 
                onLoginClick={() => setAuthModalOpen(true)} 
                onHome={handleHome} 
                user={user}
                onLogout={handleLogout}
            />

            <main className="flex-grow">
                {view === 'landing' && !user ? (
                    <div className="animate-fade-in">
                        <Hero onStart={() => setAuthModalOpen(true)} />
                        
                        {/* Stats Section */}
                        <section className="py-12 px-6">
                            <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { val: '24/7', label: 'Live Support' },
                                    { val: '0%', label: 'Hidden Fees' },
                                    { val: '256-bit', label: 'AES Encryption' },
                                    { val: 'Instant', label: 'Withdrawals' }
                                ].map((stat) => (
                                    <div key={stat.label} className="glass p-6 rounded-2xl text-center border-white/5 hover:border-primary/20 transition-colors">
                                        <p className="text-primary text-3xl font-black mb-1">{stat.val}</p>
                                        <p className="text-xs text-slate-400 uppercase tracking-tighter">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <Features />
                        <Security />
                        
                        {/* CTA Section */}
                        <section className="py-24 px-6 text-center">
                            <div className="max-w-3xl mx-auto space-y-10">
                                <h2 className="text-4xl md:text-6xl font-black text-white">Ready to join the revolution?</h2>
                                <p className="text-xl text-slate-400">Join 5 million users who already trust us with their financial future. Setting up an account takes less than 3 minutes.</p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                                    <button onClick={() => setAuthModalOpen(true)} className="w-full sm:w-auto bg-primary text-background-dark px-12 py-5 rounded-2xl font-black text-xl neon-glow hover:scale-105 transition-all">
                                        Open Free Account
                                    </button>
                                    <div className="flex items-center gap-4 text-slate-400">
                                        <div className="flex items-center text-yellow-500">
                                            {[1,2,3,4,5].map(i => <span key={i} className="material-symbols-outlined text-sm">star</span>)}
                                        </div>
                                        <span className="text-sm font-medium">4.9/5 on App Store</span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                ) : (
                    <div className="animate-fade-in">
                        {user && <Dashboard user={user} />}
                    </div>
                )}
            </main>

            <Footer />

            <AuthModal 
                isOpen={isAuthModalOpen} 
                onClose={() => setAuthModalOpen(false)} 
                onLogin={handleLogin} 
            />
        </div>
    );
};

export default App;
