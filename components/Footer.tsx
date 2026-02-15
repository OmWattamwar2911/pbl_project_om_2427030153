import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="mt-auto py-16 px-6 border-t border-white/5 bg-background-dark">
            <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-12">
                <div className="col-span-2 space-y-6">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary rounded-lg">
                            <span className="material-symbols-outlined text-background-dark text-lg font-bold">account_balance_wallet</span>
                        </div>
                        <span className="text-xl font-black tracking-tight text-white uppercase">VanguardAI</span>
                    </div>
                    <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
                        Leading the global transition to a modern, intelligent financial ecosystem. Automated, secure, and personalized for you.
                    </p>
                    <div className="flex gap-4">
                        {['language', 'share', 'mail'].map((icon) => (
                            <a key={icon} href="#" className="w-10 h-10 rounded-full glass flex items-center justify-center hover:text-primary hover:border-primary/50 transition-colors">
                                <span className="material-symbols-outlined text-sm">{icon}</span>
                            </a>
                        ))}
                    </div>
                </div>
                
                {[
                    { title: "Product", links: ["Personal Account", "Business Account", "Crypto Wallet", "Smart Cards"] },
                    { title: "Company", links: ["About Us", "Careers", "Press Kit", "Contact"] },
                    { title: "Support", links: ["Help Center", "Security", "Status", "API Docs"] }
                ].map((col) => (
                    <div key={col.title}>
                        <h5 className="text-white font-bold mb-6">{col.title}</h5>
                        <ul className="space-y-4 text-sm text-slate-500">
                            {col.links.map(link => (
                                <li key={link}><a href="#" className="hover:text-primary transition-colors">{link}</a></li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            
            <div className="max-w-7xl mx-auto pt-16 mt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500 text-xs">
                <p>© 2024 VanguardAI Solutions Inc. All rights reserved.</p>
                <div className="flex gap-8">
                    <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                    <a href="#" className="hover:text-white transition-colors">Cookie Settings</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;