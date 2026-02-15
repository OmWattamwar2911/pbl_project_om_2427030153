import React from 'react';

interface HeroProps {
    onStart: () => void;
}

const Hero: React.FC<HeroProps> = ({ onStart }) => {
    return (
        <section className="relative pt-20 pb-16 px-6 lg:pt-32">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-8 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        VanguardAI is Live
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-black leading-[1.1] tracking-tight text-white">
                        VanguardAI <span className="text-primary neon-text">Future Wealth</span>
                    </h1>
                    <p className="text-lg text-slate-400 max-w-lg leading-relaxed">
                        Experience the next generation of AI-driven portfolio management. Intelligent, decentralized, and personalized. Your global financial hub in one sleek app.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button onClick={onStart} className="bg-primary text-background-dark px-8 py-4 rounded-xl font-black text-lg neon-glow hover:scale-105 transition-all">
                            Start Free Trial
                        </button>
                        <button className="glass text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/5 transition-all flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined">play_circle</span>
                            How it works
                        </button>
                    </div>
                    <div className="flex items-center gap-6 pt-8 border-t border-white/5">
                        <div className="flex -space-x-3">
                            {[1, 2, 3].map((i) => (
                                <img key={i} className="w-10 h-10 rounded-full border-2 border-background-dark" src={`https://picsum.photos/100/100?random=${i}`} alt="User" />
                            ))}
                        </div>
                        <p className="text-sm text-slate-500"><span className="text-white font-bold">5M+</span> active users worldwide</p>
                    </div>
                </div>

                <div className="relative">
                    <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full"></div>
                    <div className="relative glass rounded-3xl p-8 overflow-hidden shadow-2xl transform hover:rotate-1 transition-transform duration-500">
                        <div className="flex justify-between items-start mb-12">
                            <div>
                                <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Total Balance</p>
                                <h3 className="text-4xl font-bold text-white">$142,850.40</h3>
                            </div>
                            <span className="material-symbols-outlined text-primary text-4xl">contactless</span>
                        </div>
                        <div className="space-y-6">
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-primary w-2/3 shadow-[0_0_10px_#25c0f4]"></div>
                            </div>
                            <div className="flex justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                                    <span className="text-slate-300">Savings</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-white/20"></div>
                                    <span className="text-slate-300">Investment</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-12 grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <p className="text-[10px] uppercase text-slate-500 mb-1">Weekly Profit</p>
                                <p className="text-xl font-bold text-green-400">+12.5%</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <p className="text-[10px] uppercase text-slate-500 mb-1">Security Score</p>
                                <p className="text-xl font-bold text-primary">99.9</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;