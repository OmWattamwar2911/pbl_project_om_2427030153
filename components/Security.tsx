import React from 'react';

const Security: React.FC = () => {
    return (
        <section className="py-20 px-6">
            <div className="max-w-7xl mx-auto glass rounded-[40px] overflow-hidden border border-white/5 relative">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center p-8 lg:p-20">
                    <div 
                        className="relative rounded-3xl overflow-hidden aspect-video bg-cover bg-center" 
                        style={{backgroundImage: "url('https://picsum.photos/seed/security/800/600')"}}
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-background-dark/80 via-transparent to-transparent"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                             <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                                <span className="material-symbols-outlined text-primary text-6xl">lock</span>
                             </div>
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        <h2 className="text-4xl font-black text-white leading-tight">Glassmorphic Security</h2>
                        <p className="text-lg text-slate-400 leading-relaxed">
                            Military-grade encryption meets sleek, modern design. Your data is protected by the latest in decentralized technology, ensuring that only you have access to your wealth.
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
                            <div className="flex items-start gap-3 group">
                                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-primary/10 transition-colors">
                                    <span className="material-symbols-outlined text-primary">verified_user</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">Biometric Vault</h4>
                                    <p className="text-sm text-slate-500">Access with FaceID or TouchID</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 group">
                                 <div className="p-2 bg-white/5 rounded-lg group-hover:bg-primary/10 transition-colors">
                                    <span className="material-symbols-outlined text-primary">history</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">Immutable Logs</h4>
                                    <p className="text-sm text-slate-500">Full transparency on every move</p>
                                </div>
                            </div>
                        </div>
                        
                        <button className="bg-primary/10 border border-primary/20 text-primary px-8 py-3 rounded-xl font-bold hover:bg-primary/20 transition-all mt-4">
                            Learn More About Security
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Security;