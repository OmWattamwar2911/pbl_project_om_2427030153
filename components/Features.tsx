import React from 'react';

const Features: React.FC = () => {
    const features = [
        {
            icon: 'bolt',
            title: 'Instant Transfers',
            description: 'Send money across borders in seconds. No intermediate banks, no delays, just instant peer-to-peer settlement.',
            points: ['180+ Countries supported', 'Real-time FX rates']
        },
        {
            icon: 'analytics',
            title: 'Smart Budgeting',
            description: 'Our AI-driven insights categorize your spending automatically and help you hit your saving goals faster than ever.',
            points: ['Automated categorization', 'Monthly trend analysis']
        },
        {
            icon: 'currency_bitcoin',
            title: 'Crypto Ready',
            description: 'Bridge the gap between fiat and digital assets. Buy, sell, and hold top cryptocurrencies in a military-grade vault.',
            points: ['Multi-chain wallet', 'Cold storage security']
        }
    ];

    return (
        <section className="py-24 px-6 relative overflow-hidden">
             <div className="max-w-7xl mx-auto">
                <div className="text-center mb-20 space-y-4">
                    <h2 className="text-4xl md:text-5xl font-black text-white">Powerful Financial Engine</h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
                        Our platform combines traditional banking reliability with the speed of decentralized finance.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {features.map((feature, idx) => (
                        <div key={idx} className="group glass p-8 rounded-3xl border border-white/10 hover:border-primary/40 transition-all duration-500 hover:-translate-y-2">
                            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-primary text-3xl">{feature.icon}</span>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                            <p className="text-slate-400 leading-relaxed mb-6">
                                {feature.description}
                            </p>
                            <ul className="space-y-3 text-sm text-slate-300">
                                {feature.points.map((point, pIdx) => (
                                    <li key={pIdx} className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
             </div>
        </section>
    );
};

export default Features;