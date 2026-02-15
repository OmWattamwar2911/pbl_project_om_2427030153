import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { PortfolioItem, WatchlistItem, RiskProfile, AnalysisResult, MarketIndex, NewsItem, User, Timeframe, PerformancePoint, InvestmentPlanInput, PlanResult, PriceAlert } from '../types';
import { analyzePortfolio, generateInvestmentPlan } from '../services/geminiService';
import { getMarketIndices, getFinancialNews, getLivePrice, getPortfolioHistory, getSparklineData, getMockBrokerageHoldings } from '../services/marketData';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, Line, Legend, LineChart } from 'recharts';

interface DashboardProps {
    user: User;
}

type DashboardTab = 'overview' | 'portfolio' | 'planner' | 'advisor' | 'settings';
type SortDirection = 'asc' | 'desc';

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
    // Navigation State
    const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
    
    // Market State
    const [indices, setIndices] = useState<MarketIndex[]>([]);
    const [news, setNews] = useState<NewsItem[]>([]);
    
    // News Filter State
    const [newsFilter, setNewsFilter] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all');
    const [newsSearch, setNewsSearch] = useState('');
    
    // Portfolio State
    const [portfolio, setPortfolio] = useState<PortfolioItem[]>([
        { id: '1', symbol: 'BTC', amount: 0.5, type: 'crypto', currentPrice: 64230, sparklineData: getSparklineData() },
        { id: '2', symbol: 'ETH', amount: 5.0, type: 'crypto', currentPrice: 3450, sparklineData: getSparklineData() },
        { id: '3', symbol: 'TSLA', amount: 20, type: 'stock', currentPrice: 225, sparklineData: getSparklineData() },
        { id: '4', symbol: 'USDT', amount: 15000, type: 'cash', currentPrice: 1, sparklineData: Array(20).fill(1) },
    ]);
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([
        { id: 'w1', symbol: 'NVDA', type: 'stock', currentPrice: 850, sparklineData: getSparklineData() },
        { id: 'w2', symbol: 'SOL', type: 'crypto', currentPrice: 145, sparklineData: getSparklineData() }
    ]);

    // Sorting State
    const [portfolioSort, setPortfolioSort] = useState<{ key: string; direction: SortDirection } | null>(null);
    const [watchlistSort, setWatchlistSort] = useState<{ key: string; direction: SortDirection } | null>(null);

    // Alerts State
    const [alerts, setAlerts] = useState<PriceAlert[]>([
        { id: 'a1', symbol: 'BTC', targetPrice: 65000, condition: 'above', isActive: true },
        { id: 'a2', symbol: 'ETH', targetPrice: 3000, condition: 'below', isActive: true }
    ]);
    const [notifications, setNotifications] = useState<{id: string, message: string, time: string}[]>([]);
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
    const [newAlert, setNewAlert] = useState<{symbol: string, price: string, condition: 'above' | 'below'}>({
        symbol: '', price: '', condition: 'above'
    });
    const [showNotifications, setShowNotifications] = useState(false);

    const [riskProfile, setRiskProfile] = useState<RiskProfile>(RiskProfile.MODERATE);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);

    // Add Asset State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newAsset, setNewAsset] = useState<{symbol: string, amount: string, type: string}>({
        symbol: '', amount: '', type: 'stock'
    });

    // Brokerage Connection State
    const [isBrokerageModalOpen, setIsBrokerageModalOpen] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    // Add Watchlist Item State
    const [isWatchlistModalOpen, setIsWatchlistModalOpen] = useState(false);
    const [newWatchlistItem, setNewWatchlistItem] = useState<{symbol: string, type: string}>({
        symbol: '', type: 'stock'
    });

    // Settings State
    const [settings, setSettings] = useState({
        currency: 'USD',
        language: 'en',
        notifications: {
            email: true,
            push: true,
            weeklyReport: false
        },
        twoFactor: false
    });
    const [profileName, setProfileName] = useState(user.name);

    // Search State
    const [searchTerm, setSearchTerm] = useState('');

    // History State
    const [timeframe, setTimeframe] = useState<Timeframe>('1M');
    const [historyData, setHistoryData] = useState<PerformancePoint[]>([]);

    // Planner State
    const [planInput, setPlanInput] = useState<InvestmentPlanInput>({
        initialAmount: 10000,
        monthlyContribution: 500,
        targetGoal: 100000,
        durationYears: 5,
        riskProfile: RiskProfile.MODERATE,
        safetyNet: 5000
    });
    const [includePortfolio, setIncludePortfolio] = useState(false);
    const [planResult, setPlanResult] = useState<PlanResult | null>(null);
    const [planningLoading, setPlanningLoading] = useState(false);

    // Initial Data Fetch
    useEffect(() => {
        setIndices(getMarketIndices());
        setNews(getFinancialNews());
    }, []);

    // Live Market Simulation
    useEffect(() => {
        const interval = setInterval(() => {
            // Update Indices
            setIndices(prev => prev.map(idx => ({
                ...idx,
                price: getLivePrice(idx.symbol, idx.price)
            })));

            // Update Portfolio Prices and Sparklines
            setPortfolio(prev => prev.map(item => {
                const newPrice = getLivePrice(item.symbol, item.currentPrice || 100);
                const currentSparkline = item.sparklineData || [];
                // Update sparkline: remove first, add new at end to create moving chart effect
                const newSparkline = currentSparkline.length > 0 
                    ? [...currentSparkline.slice(1), newPrice] 
                    : currentSparkline;

                return {
                    ...item,
                    currentPrice: newPrice,
                    sparklineData: newSparkline
                };
            }));

            // Update Watchlist Prices and Sparklines
            setWatchlist(prev => prev.map(item => {
                const newPrice = getLivePrice(item.symbol, item.currentPrice);
                const currentSparkline = item.sparklineData || [];
                const newSparkline = currentSparkline.length > 0 
                    ? [...currentSparkline.slice(1), newPrice] 
                    : currentSparkline;

                return {
                    ...item,
                    currentPrice: newPrice,
                    sparklineData: newSparkline
                };
            }));
        }, 3000); // Update every 3 seconds for simulated real-time feel

        return () => clearInterval(interval);
    }, []);

    // Check Alerts Logic
    useEffect(() => {
        let hasChanges = false;
        const newNotifications: {id: string, message: string, time: string}[] = [];

        const allAssets = [
             ...indices.map(i => ({symbol: i.symbol, price: i.price})),
             ...portfolio.map(i => ({symbol: i.symbol, price: i.currentPrice || 0})),
             ...watchlist.map(i => ({symbol: i.symbol, price: i.currentPrice}))
        ];

        const updatedAlerts = alerts.map(alert => {
            if (!alert.isActive) return alert;
             // Remove potential suffix like -USD for robust matching or exact match
             const asset = allAssets.find(a => a.symbol === alert.symbol || a.symbol.startsWith(alert.symbol));
             if (asset) {
                 if ((alert.condition === 'above' && asset.price >= alert.targetPrice) ||
                     (alert.condition === 'below' && asset.price <= alert.targetPrice)) {
                     
                     newNotifications.push({ 
                         id: Date.now().toString() + Math.random(), 
                         message: `🔔 Price Alert: ${alert.symbol} reached $${asset.price.toLocaleString(undefined, {maximumFractionDigits: 2})}`,
                         time: new Date().toLocaleTimeString()
                     });
                     hasChanges = true;
                     return { ...alert, isActive: false };
                 }
             }
             return alert;
        });

        if (hasChanges) {
             setAlerts(updatedAlerts);
             setNotifications(prev => [...newNotifications, ...prev]);
        }
    }, [indices, portfolio, watchlist, alerts]);

    // Calculate portfolio values based on live prices
    const portfolioWithValues = portfolio.map(p => ({
        ...p,
        value: (p.currentPrice || 0) * p.amount
    }));

    const totalValue = portfolioWithValues.reduce((sum, item) => sum + (item.value || 0), 0);

    // Filter portfolio for display
    const filteredPortfolio = portfolioWithValues.filter(item => 
        item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sorting Logic
    const sortedPortfolio = useMemo(() => {
        if (!portfolioSort) return filteredPortfolio;

        return [...filteredPortfolio].sort((a, b) => {
            const aVal = a[portfolioSort.key as keyof typeof a];
            const bVal = b[portfolioSort.key as keyof typeof b];

            if (aVal === bVal) return 0;
            if (aVal === undefined || aVal === null) return 1;
            if (bVal === undefined || bVal === null) return -1;

            if (aVal < bVal) return portfolioSort.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return portfolioSort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredPortfolio, portfolioSort]);

    const sortedWatchlist = useMemo(() => {
        if (!watchlistSort) return watchlist;

        return [...watchlist].sort((a, b) => {
            const aVal = a[watchlistSort.key as keyof typeof a];
            const bVal = b[watchlistSort.key as keyof typeof b];

            if (aVal === bVal) return 0;
            if (aVal === undefined || aVal === null) return 1;
            if (bVal === undefined || bVal === null) return -1;

            if (aVal < bVal) return watchlistSort.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return watchlistSort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [watchlist, watchlistSort]);

    // News Filtering Logic
    const filteredNews = useMemo(() => {
        return news.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(newsSearch.toLowerCase()) || item.source.toLowerCase().includes(newsSearch.toLowerCase());
            const matchesFilter = newsFilter === 'all' || item.sentiment === newsFilter;
            return matchesSearch && matchesFilter;
        });
    }, [news, newsSearch, newsFilter]);

    const handlePortfolioSort = (key: string) => {
        let direction: SortDirection = 'asc';
        if (portfolioSort && portfolioSort.key === key && portfolioSort.direction === 'asc') {
            direction = 'desc';
        }
        setPortfolioSort({ key, direction });
    };

    const handleWatchlistSort = (key: string) => {
        let direction: SortDirection = 'asc';
        if (watchlistSort && watchlistSort.key === key && watchlistSort.direction === 'asc') {
            direction = 'desc';
        }
        setWatchlistSort({ key, direction });
    };

    // Update history when timeframe or total value (live update) changes
    useEffect(() => {
        const data = getPortfolioHistory(timeframe, totalValue);
        setHistoryData(data);
    }, [timeframe, totalValue]);

    const handleAnalyze = useCallback(async () => {
        setLoading(true);
        try {
            const result = await analyzePortfolio(portfolioWithValues, riskProfile, indices, news);
            setAnalysis(result);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [portfolioWithValues, riskProfile, indices, news]);

    const handleGeneratePlan = async () => {
        setPlanningLoading(true);
        try {
            const result = await generateInvestmentPlan({
                ...planInput,
                includeCurrentPortfolio: includePortfolio,
                currentPortfolio: includePortfolio ? portfolioWithValues : undefined
            });
            setPlanResult(result);
        } catch (e) {
            console.error(e);
        } finally {
            setPlanningLoading(false);
        }
    };

    const handleConnectBrokerage = async () => {
        setIsConnecting(true);
        // Simulate API network delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const importedHoldings = getMockBrokerageHoldings();
        setPortfolio(prev => [...prev, ...importedHoldings]);
        
        setIsConnecting(false);
        setIsBrokerageModalOpen(false);
        setNotifications(prev => [{
            id: Date.now().toString(),
            message: `Successfully imported ${importedHoldings.length} assets from brokerage.`,
            time: new Date().toLocaleTimeString()
        }, ...prev]);
        setShowNotifications(true);
    };

    const handleAddAsset = (e: React.FormEvent) => {
        e.preventDefault();
        if(!newAsset.symbol || !newAsset.amount) return;
        
        // Mock price fetch for immediate display
        const price = getLivePrice(newAsset.symbol, 100);
        
        const newItem: PortfolioItem = {
            id: Date.now().toString(),
            symbol: newAsset.symbol.toUpperCase(),
            amount: parseFloat(newAsset.amount),
            type: newAsset.type as any,
            currentPrice: price,
            value: price * parseFloat(newAsset.amount),
            sparklineData: getSparklineData()
        };
        
        setPortfolio([...portfolio, newItem]);
        setIsAddModalOpen(false);
        setNewAsset({ symbol: '', amount: '', type: 'stock' });
    };

    const handleRemoveAsset = (id: string) => {
        setPortfolio(portfolio.filter(p => p.id !== id));
    };

    const handleAddToWatchlist = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWatchlistItem.symbol) return;

        const price = getLivePrice(newWatchlistItem.symbol, 100);

        const newItem: WatchlistItem = {
            id: `w-${Date.now()}`,
            symbol: newWatchlistItem.symbol.toUpperCase(),
            type: newWatchlistItem.type as any,
            currentPrice: price,
            sparklineData: getSparklineData()
        };

        setWatchlist([...watchlist, newItem]);
        setIsWatchlistModalOpen(false);
        setNewWatchlistItem({ symbol: '', type: 'stock' });
    };

    const handleRemoveFromWatchlist = (id: string) => {
        setWatchlist(watchlist.filter(w => w.id !== id));
    };

    const handleAddAlert = (e: React.FormEvent) => {
        e.preventDefault();
        if(!newAlert.symbol || !newAlert.price) return;

        const newItem: PriceAlert = {
            id: `a-${Date.now()}`,
            symbol: newAlert.symbol.toUpperCase(),
            targetPrice: parseFloat(newAlert.price),
            condition: newAlert.condition,
            isActive: true
        };

        setAlerts([...alerts, newItem]);
        setIsAlertModalOpen(false);
        setNewAlert({ symbol: '', price: '', condition: 'above' });
    };

    const removeAlert = (id: string) => {
        setAlerts(alerts.filter(a => a.id !== id));
    };

    const dismissNotification = (id: string) => {
        setNotifications(notifications.filter(n => n.id !== id));
    };

    // Helper Component for Sort Arrow
    const SortArrow = ({ active, direction }: { active: boolean, direction: SortDirection }) => (
        <div className="flex flex-col ml-1 opacity-70 group-hover:opacity-100 transition-opacity">
            <span className={`material-symbols-outlined text-[10px] h-[6px] flex items-center -mb-[2px] ${active && direction === 'asc' ? 'text-primary' : 'text-slate-600'}`}>arrow_drop_up</span>
            <span className={`material-symbols-outlined text-[10px] h-[6px] flex items-center ${active && direction === 'desc' ? 'text-primary' : 'text-slate-600'}`}>arrow_drop_down</span>
        </div>
    );

    const COLORS = ['#25c0f4', '#a855f7', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 min-h-[calc(100vh-100px)] flex flex-col relative">
            
            {/* Notifications Toast */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-[calc(100vw-48px)]">
                {notifications.slice(0, 3).map(notif => (
                    <div key={notif.id} className="pointer-events-auto bg-slate-900 border border-primary/50 text-white p-4 rounded-xl shadow-2xl flex items-start gap-3 animate-fade-in-up w-full sm:w-80">
                        <span className="material-symbols-outlined text-primary mt-0.5">notifications_active</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{notif.message}</p>
                            <p className="text-xs text-slate-500 mt-1">{notif.time}</p>
                        </div>
                        <button onClick={() => dismissNotification(notif.id)} className="text-slate-500 hover:text-white shrink-0">
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>
                ))}
            </div>

            {/* Top Bar with User & Navigation */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8 border-b border-white/10 pb-6">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-white">Welcome, {user.name}</h2>
                    <p className="text-slate-400">VanguardAI Dashboard</p>
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative">
                        <button 
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors relative"
                        >
                            <span className="material-symbols-outlined">notifications</span>
                            {notifications.length > 0 && (
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            )}
                        </button>
                        {showNotifications && (
                            <div className="absolute top-full right-0 mt-2 w-72 sm:w-80 bg-background-dark border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                                <div className="p-3 border-b border-white/5 flex justify-between items-center">
                                    <h4 className="font-bold text-sm text-white">Notifications</h4>
                                    <button onClick={() => setNotifications([])} className="text-xs text-primary hover:underline">Clear all</button>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <p className="p-4 text-center text-xs text-slate-500">No new notifications</p>
                                    ) : (
                                        notifications.map(n => (
                                            <div key={n.id} className="p-3 hover:bg-white/5 border-b border-white/5 last:border-0">
                                                <p className="text-xs text-white break-words">{n.message}</p>
                                                <p className="text-[10px] text-slate-500 mt-1">{n.time}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-xl overflow-x-auto w-full md:w-auto">
                        {(['overview', 'portfolio', 'planner', 'advisor', 'settings'] as DashboardTab[]).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold capitalize transition-all whitespace-nowrap flex-1 md:flex-none text-center ${
                                    activeTab === tab 
                                    ? 'bg-primary text-background-dark shadow-lg shadow-primary/25' 
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {tab === 'advisor' ? 'AI Advisor' : tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* TAB CONTENT: OVERVIEW */}
            {activeTab === 'overview' && (
                <div className="animate-fade-in space-y-6">
                    {/* Market Ticker */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {indices.map((idx) => (
                            <div key={idx.symbol} className="glass px-4 py-3 rounded-xl border border-white/5 flex flex-col">
                                <span className="text-xs text-slate-500 font-bold uppercase truncate">{idx.name}</span>
                                <div className="flex justify-between items-end mt-1">
                                    <span className="font-mono text-white font-bold text-sm sm:text-base">{idx.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                    <span className={`text-xs font-bold ${idx.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {idx.change >= 0 ? '+' : ''}{idx.change}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                         <div className="lg:col-span-2 glass p-6 md:p-8 rounded-3xl border border-white/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 transition-opacity group-hover:opacity-10">
                                <span className="material-symbols-outlined text-9xl">account_balance</span>
                            </div>
                            <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Total Net Worth</h3>
                            <div className="flex flex-wrap items-baseline gap-4">
                                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white break-all">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</h1>
                                <span className="text-green-400 font-bold flex items-center bg-green-500/10 px-2 py-1 rounded-lg text-sm">
                                    <span className="material-symbols-outlined text-sm mr-1">trending_up</span> +2.4%
                                </span>
                            </div>
                            <div className="mt-8 h-48 sm:h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={historyData}>
                                        <defs>
                                            <linearGradient id="colorOverview" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#25c0f4" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#25c0f4" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <Area 
                                            type="monotone" 
                                            dataKey="value" 
                                            stroke="#25c0f4" 
                                            strokeWidth={3} 
                                            fill="url(#colorOverview)"
                                            animationDuration={2000}
                                            animationEasing="ease-out"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                         </div>

                         <div className="flex flex-col gap-6">
                            {/* Asset Allocation */}
                            <div className="glass p-6 rounded-3xl border border-white/10 flex-1 flex flex-col">
                                <h3 className="text-white font-bold mb-4">Asset Allocation</h3>
                                <div className="flex-1 min-h-[150px] sm:min-h-[200px] lg:min-h-[150px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={portfolioWithValues}
                                                dataKey="value"
                                                nameKey="symbol"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={40}
                                                outerRadius={60}
                                                paddingAngle={5}
                                                animationDuration={1500}
                                                animationEasing="ease-out"
                                            >
                                                {portfolioWithValues.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', borderRadius: '8px' }}
                                                itemStyle={{ color: '#fff' }}
                                                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            
                            {/* Price Alerts Widget */}
                            <div className="glass p-6 rounded-3xl border border-white/10 flex-1 flex flex-col">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-white font-bold">Price Alerts</h3>
                                    <button onClick={() => setIsAlertModalOpen(true)} className="text-primary hover:text-white transition-colors">
                                        <span className="material-symbols-outlined text-sm">add_circle</span>
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto max-h-[150px] space-y-2 pr-2 custom-scrollbar">
                                    {alerts.length === 0 ? (
                                        <p className="text-xs text-slate-500 text-center py-4">No active alerts</p>
                                    ) : (
                                        alerts.map(alert => (
                                            <div key={alert.id} className={`flex justify-between items-center p-2 rounded-lg border ${alert.isActive ? 'bg-white/5 border-white/5' : 'bg-white/0 border-white/5 opacity-50'}`}>
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${alert.isActive ? 'bg-green-500' : 'bg-slate-500'}`}></span>
                                                    <div>
                                                        <p className="text-xs font-bold text-white">{alert.symbol}</p>
                                                        <p className="text-[10px] text-slate-400">
                                                            {alert.condition === 'above' ? 'Above' : 'Below'} ${alert.targetPrice.toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button onClick={() => removeAlert(alert.id)} className="text-slate-500 hover:text-red-500">
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                         </div>
                    </div>

                    <div className="glass p-6 rounded-3xl border border-white/10 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                                Breaking News
                            </h3>
                            <button onClick={() => setActiveTab('advisor')} className="text-xs text-primary border border-primary/20 px-3 py-1 rounded-full hover:bg-primary/10 transition-colors">View All</button>
                        </div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                            {news.slice(0, 3).map((item, idx) => (
                                <div key={item.id} className="relative pl-4 border-l border-white/10 hover:border-primary transition-colors cursor-pointer group" onClick={() => setActiveTab('advisor')}>
                                    <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-background-dark ${
                                         item.sentiment === 'positive' ? 'bg-green-500' : 
                                         item.sentiment === 'negative' ? 'bg-red-500' : 'bg-slate-500'
                                    } group-hover:scale-110 transition-transform`}></div>
                                    
                                    <h4 className="text-sm font-bold text-slate-200 group-hover:text-white leading-tight mb-2 transition-colors">
                                        {item.title}
                                    </h4>
                                    <div className="flex justify-between items-center">
                                         <p className="text-[10px] text-slate-500 uppercase font-bold">{item.source}</p>
                                         <p className="text-[10px] text-slate-600">{item.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: PORTFOLIO */}
            {activeTab === 'portfolio' && (
                <div className="animate-fade-in space-y-6">
                    {/* ASSET MANAGEMENT TABLE */}
                    <div className="glass p-6 rounded-3xl border border-white/10">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-white">Asset Management</h3>
                                <p className="text-slate-400 text-sm">Manage your holdings and track live value</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                                <div className="relative flex-1 sm:w-64">
                                    <span className="absolute left-3 top-2.5 text-slate-400 material-symbols-outlined text-sm">search</span>
                                    <input 
                                        type="text" 
                                        placeholder="Search assets..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white focus:border-primary outline-none text-sm transition-colors focus:bg-white/10"
                                    />
                                </div>
                                <button 
                                    onClick={() => setIsBrokerageModalOpen(true)}
                                    className="bg-white/5 text-white border border-white/10 px-4 py-2 rounded-lg font-bold text-sm hover:bg-white/10 flex items-center justify-center gap-2 whitespace-nowrap w-full sm:w-auto transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">link</span> Connect Brokerage
                                </button>
                                <button 
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="bg-primary text-background-dark px-4 py-2 rounded-lg font-bold text-sm hover:brightness-110 flex items-center justify-center gap-2 whitespace-nowrap w-full sm:w-auto"
                                >
                                    <span className="material-symbols-outlined text-sm">add</span> Add Asset
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto -mx-6 px-6 pb-2">
                            <table className="w-full text-left border-collapse min-w-[800px] md:min-w-0">
                                <thead>
                                    <tr className="text-slate-500 text-xs uppercase border-b border-white/10">
                                        <th onClick={() => handlePortfolioSort('symbol')} className="pb-4 pl-4 font-bold cursor-pointer hover:text-white transition-colors group select-none whitespace-nowrap">
                                            <div className="flex items-center gap-1">
                                                Asset <SortArrow active={portfolioSort?.key === 'symbol'} direction={portfolioSort?.direction || 'asc'} />
                                            </div>
                                        </th>
                                        <th onClick={() => handlePortfolioSort('type')} className="pb-4 font-bold cursor-pointer hover:text-white transition-colors group select-none whitespace-nowrap">
                                            <div className="flex items-center gap-1">
                                                Type <SortArrow active={portfolioSort?.key === 'type'} direction={portfolioSort?.direction || 'asc'} />
                                            </div>
                                        </th>
                                        <th className="pb-4 font-bold text-center whitespace-nowrap hidden md:table-cell">Trend (7d)</th>
                                        <th onClick={() => handlePortfolioSort('currentPrice')} className="pb-4 font-bold text-right cursor-pointer hover:text-white transition-colors group select-none whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1">
                                                Price <SortArrow active={portfolioSort?.key === 'currentPrice'} direction={portfolioSort?.direction || 'asc'} />
                                            </div>
                                        </th>
                                        <th onClick={() => handlePortfolioSort('amount')} className="pb-4 font-bold text-right cursor-pointer hover:text-white transition-colors group select-none whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1">
                                                Holdings <SortArrow active={portfolioSort?.key === 'amount'} direction={portfolioSort?.direction || 'asc'} />
                                            </div>
                                        </th>
                                        <th onClick={() => handlePortfolioSort('value')} className="pb-4 font-bold text-right cursor-pointer hover:text-white transition-colors group select-none whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1">
                                                Total Value <SortArrow active={portfolioSort?.key === 'value'} direction={portfolioSort?.direction || 'asc'} />
                                            </div>
                                        </th>
                                        <th className="pb-4 font-bold text-right pr-4 whitespace-nowrap">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {sortedPortfolio.length > 0 ? (
                                        sortedPortfolio.map((item) => (
                                            <tr key={item.id} className="group hover:bg-white/5 transition-colors">
                                                <td className="py-4 pl-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                                            item.type === 'crypto' ? 'bg-orange-500/20 text-orange-400' :
                                                            item.type === 'stock' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                                                        }`}>
                                                            <span className="material-symbols-outlined text-sm">
                                                                {item.type === 'crypto' ? 'currency_bitcoin' : item.type === 'stock' ? 'show_chart' : 'payments'}
                                                            </span>
                                                        </div>
                                                        <span className="font-bold text-white">{item.symbol}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 text-slate-400 text-sm capitalize">{item.type}</td>
                                                <td className="py-4 hidden md:table-cell">
                                                    <div className="h-10 w-24 mx-auto">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <LineChart data={item.sparklineData?.map((val, i) => ({ i, val })) || []}>
                                                                <Line 
                                                                    type="monotone" 
                                                                    dataKey="val" 
                                                                    stroke={(item.sparklineData?.[item.sparklineData.length - 1] || 0) >= (item.sparklineData?.[0] || 0) ? "#4ade80" : "#f87171"} 
                                                                    strokeWidth={2} 
                                                                    dot={false}
                                                                    isAnimationActive={true}
                                                                    animationDuration={1000}
                                                                />
                                                            </LineChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </td>
                                                <td className="py-4 text-right text-slate-300 font-mono text-sm">${item.currentPrice?.toLocaleString()}</td>
                                                <td className="py-4 text-right text-white font-bold text-sm">{item.amount}</td>
                                                <td className="py-4 text-right text-primary font-bold font-mono text-sm">${item.value?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                                                <td className="py-4 text-right pr-4">
                                                    <button 
                                                        onClick={() => handleRemoveAsset(item.id)}
                                                        className="p-2 hover:bg-red-500/20 rounded-lg text-slate-500 hover:text-red-500 transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">delete</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="py-8 text-center text-slate-500 text-sm">
                                                No assets found matching "{searchTerm}"
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* WATCHLIST TABLE */}
                    <div className="glass p-6 rounded-3xl border border-white/10">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white">Watchlist</h3>
                                <p className="text-slate-400 text-sm">Track assets you are interested in</p>
                            </div>
                            <button 
                                onClick={() => setIsWatchlistModalOpen(true)}
                                className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-white/10 flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">visibility</span> <span className="hidden sm:inline">Add to Watchlist</span>
                            </button>
                        </div>
                        <div className="overflow-x-auto -mx-6 px-6 pb-2">
                             <table className="w-full text-left border-collapse min-w-[600px] md:min-w-0">
                                <thead>
                                    <tr className="text-slate-500 text-xs uppercase border-b border-white/10">
                                        <th onClick={() => handleWatchlistSort('symbol')} className="pb-4 pl-4 font-bold cursor-pointer hover:text-white transition-colors group select-none whitespace-nowrap">
                                            <div className="flex items-center gap-1">
                                                Asset <SortArrow active={watchlistSort?.key === 'symbol'} direction={watchlistSort?.direction || 'asc'} />
                                            </div>
                                        </th>
                                        <th onClick={() => handleWatchlistSort('type')} className="pb-4 font-bold cursor-pointer hover:text-white transition-colors group select-none whitespace-nowrap">
                                            <div className="flex items-center gap-1">
                                                Type <SortArrow active={watchlistSort?.key === 'type'} direction={watchlistSort?.direction || 'asc'} />
                                            </div>
                                        </th>
                                        <th className="pb-4 font-bold text-center whitespace-nowrap hidden md:table-cell">Trend (7d)</th>
                                        <th onClick={() => handleWatchlistSort('currentPrice')} className="pb-4 font-bold text-right cursor-pointer hover:text-white transition-colors group select-none whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1">
                                                Current Price <SortArrow active={watchlistSort?.key === 'currentPrice'} direction={watchlistSort?.direction || 'asc'} />
                                            </div>
                                        </th>
                                        <th className="pb-4 font-bold text-right pr-4 whitespace-nowrap">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {sortedWatchlist.length > 0 ? (
                                        sortedWatchlist.map((item) => (
                                            <tr key={item.id} className="group hover:bg-white/5 transition-colors">
                                                <td className="py-4 pl-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                                            item.type === 'crypto' ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'
                                                        }`}>
                                                            <span className="material-symbols-outlined text-sm">
                                                                {item.type === 'crypto' ? 'currency_bitcoin' : 'show_chart'}
                                                            </span>
                                                        </div>
                                                        <span className="font-bold text-white">{item.symbol}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 text-slate-400 text-sm capitalize">{item.type}</td>
                                                <td className="py-4 hidden md:table-cell">
                                                    <div className="h-10 w-24 mx-auto">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <LineChart data={item.sparklineData?.map((val, i) => ({ i, val })) || []}>
                                                                <Line 
                                                                    type="monotone" 
                                                                    dataKey="val" 
                                                                    stroke={(item.sparklineData?.[item.sparklineData.length - 1] || 0) >= (item.sparklineData?.[0] || 0) ? "#4ade80" : "#f87171"} 
                                                                    strokeWidth={2} 
                                                                    dot={false} 
                                                                    isAnimationActive={true}
                                                                    animationDuration={1000}
                                                                />
                                                            </LineChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </td>
                                                <td className="py-4 text-right text-white font-mono text-sm">${item.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td className="py-4 text-right pr-4">
                                                     <button 
                                                        onClick={() => handleRemoveFromWatchlist(item.id)}
                                                        className="p-2 hover:bg-red-500/20 rounded-lg text-slate-500 hover:text-red-500 transition-colors"
                                                        title="Remove from Watchlist"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">close</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-slate-500 text-sm">
                                                Your watchlist is empty. Add assets to track their performance.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                             </table>
                        </div>
                    </div>

                    {/* PORTFOLIO PERFORMANCE CHART */}
                    <div className="glass p-6 rounded-3xl border border-white/10">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white">Portfolio Performance</h3>
                                <p className="text-slate-400 text-sm">Historical value tracking</p>
                            </div>
                            <div className="flex bg-white/5 p-1 rounded-lg">
                                {(['1D', '1W', '1M', '1Y'] as Timeframe[]).map((tf) => (
                                    <button
                                        key={tf}
                                        onClick={() => setTimeframe(tf)}
                                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                                            timeframe === tf 
                                            ? 'bg-primary text-background-dark shadow-lg' 
                                            : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        {tf}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={historyData}>
                                    <defs>
                                        <linearGradient id="colorHistory" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#25c0f4" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#25c0f4" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis 
                                        dataKey="date" 
                                        stroke="#475569" 
                                        tick={{fontSize: 10}} 
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis 
                                        stroke="#475569" 
                                        tick={{fontSize: 10}} 
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => `$${val.toLocaleString()}`}
                                        domain={['auto', 'auto']}
                                    />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                        formatter={(value: number) => [`$${value.toLocaleString(undefined, {maximumFractionDigits: 2})}`, 'Value']}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="value" 
                                        stroke="#25c0f4" 
                                        strokeWidth={3} 
                                        fill="url(#colorHistory)" 
                                        animationDuration={2000}
                                        animationEasing="ease-out"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: PLANNER */}
            {activeTab === 'planner' && (
                <div className="animate-fade-in space-y-6">
                    <div className="glass p-6 md:p-8 rounded-3xl border border-white/10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                                <span className="material-symbols-outlined">rocket_launch</span>
                            </div>
                            <div>
                                <h3 className="text-xl md:text-2xl font-bold text-white">Smart Goal Modeler</h3>
                                <p className="text-slate-400 text-sm">Simulate your financial future with AI projections</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Initial Investment</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                                        <input 
                                            type="number" 
                                            value={planInput.initialAmount} 
                                            onChange={(e) => setPlanInput({...planInput, initialAmount: Number(e.target.value)})}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-2 text-white focus:border-primary outline-none text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Monthly Contribution</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                                        <input 
                                            type="number" 
                                            value={planInput.monthlyContribution} 
                                            onChange={(e) => setPlanInput({...planInput, monthlyContribution: Number(e.target.value)})}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-2 text-white focus:border-primary outline-none text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Target Goal</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                                        <input 
                                            type="number" 
                                            value={planInput.targetGoal} 
                                            onChange={(e) => setPlanInput({...planInput, targetGoal: Number(e.target.value)})}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-2 text-white focus:border-primary outline-none text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Duration (Years)</label>
                                    <input 
                                        type="number" 
                                        value={planInput.durationYears} 
                                        onChange={(e) => setPlanInput({...planInput, durationYears: Number(e.target.value)})}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-primary outline-none text-sm"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Risk Profile</label>
                                    <select 
                                        value={planInput.riskProfile}
                                        onChange={(e) => setPlanInput({...planInput, riskProfile: e.target.value as RiskProfile})}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-primary outline-none text-sm"
                                    >
                                        <option value={RiskProfile.CONSERVATIVE}>Conservative</option>
                                        <option value={RiskProfile.MODERATE}>Moderate</option>
                                        <option value={RiskProfile.AGGRESSIVE}>Aggressive</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Safety Net (Cash/Safe)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                                        <input 
                                            type="number" 
                                            value={planInput.safetyNet} 
                                            onChange={(e) => setPlanInput({...planInput, safetyNet: Number(e.target.value)})}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-2 text-white focus:border-primary outline-none text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3 mb-6 bg-white/5 p-3 rounded-xl border border-white/5 w-fit">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={includePortfolio} onChange={(e) => setIncludePortfolio(e.target.checked)} className="sr-only peer" />
                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                            <span className="text-sm text-slate-300 font-medium">Link Current Portfolio Analysis</span>
                        </div>

                        <button 
                            onClick={handleGeneratePlan}
                            disabled={planningLoading}
                            className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold py-3 rounded-xl mb-8 neon-glow hover:scale-[1.01] transition-transform disabled:opacity-50"
                        >
                            {planningLoading ? 'Simulating Scenarios...' : 'Generate AI Investment Plan'}
                        </button>

                        {planResult && (
                            <div className="animate-fade-in-up space-y-8 border-t border-white/10 pt-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className={`col-span-1 p-6 rounded-2xl border ${planResult.isFeasible ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                        <p className="text-xs uppercase font-bold mb-2 text-slate-400">Goal Feasibility</p>
                                        <div className="flex items-end gap-2">
                                            <h4 className={`text-4xl md:text-5xl font-black ${planResult.isFeasible ? 'text-green-400' : 'text-red-400'}`}>{planResult.feasibilityScore}%</h4>
                                            <span className="mb-1 text-sm text-slate-400">probability</span>
                                        </div>
                                        <p className="text-sm mt-2 text-slate-300">
                                            Projected: <span className="font-bold text-white">${planResult.projectedTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                        </p>
                                    </div>
                                    <div className="col-span-1 md:col-span-2 h-[200px]">
                                        <p className="text-xs uppercase font-bold mb-2 text-slate-400 pl-2">Growth Projection</p>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={planResult.yearlyData || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="year" stroke="#475569" tick={{fontSize: 10}} />
                                                <YAxis stroke="#475569" tick={{fontSize: 10}} tickFormatter={(val) => `$${val/1000}k`} />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333' }}
                                                    itemStyle={{ fontSize: 12 }}
                                                />
                                                <Area 
                                                    type="monotone" 
                                                    dataKey="projected" 
                                                    stroke="#a855f7" 
                                                    fillOpacity={1} 
                                                    fill="url(#colorProjected)" 
                                                    name="Projected Value" 
                                                    animationDuration={2000}
                                                    animationEasing="ease-out"
                                                />
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="invested" 
                                                    stroke="#475569" 
                                                    strokeDasharray="5 5" 
                                                    name="Total Invested" 
                                                    animationDuration={2000}
                                                    animationEasing="ease-out"
                                                />
                                                <Legend />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                
                                {planResult.executiveSummary && (
                                    <div className="bg-white/5 rounded-2xl p-6 border-l-4 border-primary">
                                        <h5 className="font-bold text-white mb-2 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary text-sm">summarize</span>
                                            Executive Summary
                                        </h5>
                                        <p className="text-slate-300 text-sm leading-relaxed">{planResult.executiveSummary}</p>
                                    </div>
                                )}
                                
                                {planResult.actionablePlan && planResult.actionablePlan.length > 0 && (
                                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10 overflow-hidden">
                                        <h5 className="font-bold text-white mb-4 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-green-400 text-sm">payments</span>
                                            Actionable Investment Breakdown
                                        </h5>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead className="text-xs uppercase text-slate-500 bg-white/5 border-b border-white/10">
                                                    <tr>
                                                        <th className="px-4 py-3 font-bold">Asset</th>
                                                        <th className="px-4 py-3 font-bold">Type</th>
                                                        <th className="px-4 py-3 font-bold text-right">Initial Buy</th>
                                                        <th className="px-4 py-3 font-bold text-right">Monthly Add</th>
                                                        <th className="px-4 py-3 font-bold">Rationale</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {planResult.actionablePlan.map((item, idx) => (
                                                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                            <td className="px-4 py-3 font-bold text-white">{item.assetName}</td>
                                                            <td className="px-4 py-3">
                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                                    item.category === 'Stock' ? 'bg-blue-500/20 text-blue-400' :
                                                                    item.category === 'Crypto' ? 'bg-purple-500/20 text-purple-400' :
                                                                    item.category === 'Fixed Income' ? 'bg-green-500/20 text-green-400' :
                                                                    'bg-slate-500/20 text-slate-400'
                                                                }`}>
                                                                    {item.category}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-mono text-slate-300">${item.initialAllocation.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                                            <td className="px-4 py-3 text-right font-mono text-primary font-bold">+${item.monthlyAllocation.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                                            <td className="px-4 py-3 text-slate-400 text-xs italic">{item.rationale}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot className="border-t border-white/10 bg-white/5 font-bold">
                                                    <tr>
                                                        <td colSpan={2} className="px-4 py-3 text-right">Total:</td>
                                                        <td className="px-4 py-3 text-right font-mono text-white">${planResult.actionablePlan.reduce((sum, i) => sum + i.initialAllocation, 0).toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-right font-mono text-primary">${planResult.actionablePlan.reduce((sum, i) => sum + i.monthlyAllocation, 0).toLocaleString()}</td>
                                                        <td></td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {planResult.currentPortfolioAnalysis && (
                                    <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-6 border border-white/10">
                                        <div className="flex flex-col lg:flex-row gap-8">
                                            <div className="flex-1">
                                                <h5 className="font-bold text-white mb-4 flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-primary text-sm">sync_alt</span>
                                                    Portfolio Alignment
                                                </h5>
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="relative w-16 h-16 shrink-0">
                                                         <svg className="w-full h-full transform -rotate-90">
                                                            <circle cx="32" cy="32" r="28" stroke="#333" strokeWidth="4" fill="transparent" />
                                                            <circle cx="32" cy="32" r="28" stroke={planResult.currentPortfolioAnalysis.alignmentScore > 70 ? '#10b981' : '#f59e0b'} strokeWidth="4" fill="transparent" strokeDasharray={175} strokeDashoffset={175 - (175 * planResult.currentPortfolioAnalysis.alignmentScore) / 100} />
                                                         </svg>
                                                         <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 font-bold text-sm text-white">{planResult.currentPortfolioAnalysis.alignmentScore}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-400 uppercase font-bold">Alignment Score</p>
                                                        <p className="text-sm text-slate-300 leading-tight">{planResult.currentPortfolioAnalysis.alignmentAnalysis}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-3">
                                                    <div className="flex justify-between text-xs text-slate-400 uppercase font-bold">
                                                        <span>Current</span>
                                                        <span>Allocation Comparison</span>
                                                        <span>Target</span>
                                                    </div>
                                                    {/* Safe */}
                                                    <div className="grid grid-cols-[30px_auto_30px] sm:grid-cols-[1fr_auto_1fr] gap-2 items-center text-xs">
                                                        <div className="flex justify-end items-center gap-2">
                                                             <span className="text-slate-400 hidden sm:inline">{planResult.currentPortfolioAnalysis.currentAllocation.safe}%</span>
                                                             <div className="h-2 rounded-l-full bg-green-500/50 w-full sm:w-auto sm:flex-1" style={{width: `100%`, maxWidth: `${Math.min(100, planResult.currentPortfolioAnalysis.currentAllocation.safe)}%`}}></div>
                                                        </div>
                                                        <span className="text-slate-500 w-16 text-center">Safe</span>
                                                        <div className="flex justify-start items-center gap-2">
                                                             <div className="h-2 rounded-r-full bg-green-500 w-full sm:w-auto sm:flex-1" style={{width: `100%`, maxWidth: `${Math.min(100, planResult.allocationStrategy.safe)}%`}}></div>
                                                             <span className="text-white font-bold hidden sm:inline">{planResult.allocationStrategy.safe}%</span>
                                                        </div>
                                                    </div>
                                                    {/* Growth */}
                                                    <div className="grid grid-cols-[30px_auto_30px] sm:grid-cols-[1fr_auto_1fr] gap-2 items-center text-xs">
                                                        <div className="flex justify-end items-center gap-2">
                                                             <span className="text-slate-400 hidden sm:inline">{planResult.currentPortfolioAnalysis.currentAllocation.growth}%</span>
                                                             <div className="h-2 rounded-l-full bg-primary/50 w-full sm:w-auto sm:flex-1" style={{width: `100%`, maxWidth: `${Math.min(100, planResult.currentPortfolioAnalysis.currentAllocation.growth)}%`}}></div>
                                                        </div>
                                                        <span className="text-slate-500 w-16 text-center">Growth</span>
                                                        <div className="flex justify-start items-center gap-2">
                                                             <div className="h-2 rounded-r-full bg-primary w-full sm:w-auto sm:flex-1" style={{width: `100%`, maxWidth: `${Math.min(100, planResult.allocationStrategy.growth)}%`}}></div>
                                                             <span className="text-white font-bold hidden sm:inline">{planResult.allocationStrategy.growth}%</span>
                                                        </div>
                                                    </div>
                                                    {/* Speculative */}
                                                    <div className="grid grid-cols-[30px_auto_30px] sm:grid-cols-[1fr_auto_1fr] gap-2 items-center text-xs">
                                                        <div className="flex justify-end items-center gap-2">
                                                             <span className="text-slate-400 hidden sm:inline">{planResult.currentPortfolioAnalysis.currentAllocation.speculative}%</span>
                                                             <div className="h-2 rounded-l-full bg-purple-500/50 w-full sm:w-auto sm:flex-1" style={{width: `100%`, maxWidth: `${Math.min(100, planResult.currentPortfolioAnalysis.currentAllocation.speculative)}%`}}></div>
                                                        </div>
                                                        <span className="text-slate-500 w-16 text-center">Spec</span>
                                                        <div className="flex justify-start items-center gap-2">
                                                             <div className="h-2 rounded-r-full bg-purple-500 w-full sm:w-auto sm:flex-1" style={{width: `100%`, maxWidth: `${Math.min(100, planResult.allocationStrategy.speculative)}%`}}></div>
                                                             <span className="text-white font-bold hidden sm:inline">{planResult.allocationStrategy.speculative}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex-1 border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-8">
                                                <h5 className="font-bold text-white mb-4 flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-orange-400 text-sm">build</span>
                                                    Rebalancing Actions
                                                </h5>
                                                <ul className="space-y-3">
                                                    {planResult.currentPortfolioAnalysis.rebalancingSuggestions?.map((req, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                                            <span className="material-symbols-outlined text-orange-400 text-xs mt-1 shrink-0">arrow_forward</span>
                                                            {req}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white/5 rounded-2xl p-6">
                                        <h5 className="font-bold text-white mb-4 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary text-sm">pie_chart</span>
                                            Suggested Allocation
                                        </h5>
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between items-center text-sm mb-1">
                                                    <span className="text-slate-400">Safe / Bonds</span>
                                                    <span className="text-white font-bold">{planResult.allocationStrategy?.safe || 0}%</span>
                                                </div>
                                                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mb-2">
                                                    <div className="bg-green-400 h-full" style={{width: `${planResult.allocationStrategy?.safe || 0}%`}}></div>
                                                </div>
                                                <p className="text-xs text-slate-500">
                                                    Recommended: {planResult.suggestedAssets?.safe?.join(', ') || 'Government Bonds, Cash'}
                                                </p>
                                            </div>
                                            
                                            <div>
                                                <div className="flex justify-between items-center text-sm mb-1">
                                                    <span className="text-slate-400">Growth Stocks</span>
                                                    <span className="text-white font-bold">{planResult.allocationStrategy?.growth || 0}%</span>
                                                </div>
                                                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mb-2">
                                                    <div className="bg-primary h-full" style={{width: `${planResult.allocationStrategy?.growth || 0}%`}}></div>
                                                </div>
                                                <p className="text-xs text-slate-500">
                                                    Recommended: {planResult.suggestedAssets?.growth?.join(', ') || 'S&P 500 ETF, Tech Sector'}
                                                </p>
                                            </div>

                                            <div>
                                                <div className="flex justify-between items-center text-sm mb-1">
                                                    <span className="text-slate-400">Speculative / Crypto</span>
                                                    <span className="text-white font-bold">{planResult.allocationStrategy?.speculative || 0}%</span>
                                                </div>
                                                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mb-2">
                                                    <div className="bg-purple-500 h-full" style={{width: `${planResult.allocationStrategy?.speculative || 0}%`}}></div>
                                                </div>
                                                <p className="text-xs text-slate-500">
                                                    Recommended: {planResult.suggestedAssets?.speculative?.join(', ') || 'Bitcoin, Emerging Markets'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 rounded-2xl p-6">
                                         <h5 className="font-bold text-white mb-4 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary text-sm">tips_and_updates</span>
                                            AI Advisor Strategy
                                        </h5>
                                        <ul className="space-y-3">
                                            {planResult.recommendations?.map((rec, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                                    <span className="material-symbols-outlined text-primary text-xs mt-1 shrink-0">arrow_forward</span>
                                                    {rec}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {/* TAB CONTENT: AI ADVISOR */}
            {activeTab === 'advisor' && (
                <div className="animate-fade-in space-y-6">
                    <div className="glass p-6 md:p-8 rounded-3xl border border-white/10">
                         <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                             <div>
                                <h3 className="text-xl md:text-2xl font-bold text-white">VanguardAI Advisor</h3>
                                <p className="text-slate-400 text-sm">Real-time market analysis and portfolio recommendations</p>
                             </div>
                             <div className="flex items-center gap-4 w-full sm:w-auto">
                                <select 
                                    className="bg-background-dark border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none flex-1 sm:flex-none"
                                    value={riskProfile}
                                    onChange={(e) => setRiskProfile(e.target.value as RiskProfile)}
                                >
                                    <option value={RiskProfile.CONSERVATIVE}>Conservative</option>
                                    <option value={RiskProfile.MODERATE}>Moderate</option>
                                    <option value={RiskProfile.AGGRESSIVE}>Aggressive</option>
                                </select>
                                <button 
                                    onClick={handleAnalyze}
                                    disabled={loading}
                                    className="bg-primary text-background-dark px-6 py-2.5 rounded-lg font-bold text-sm neon-glow hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2 flex-1 sm:flex-none whitespace-nowrap"
                                >
                                    {loading ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined">psychology</span>}
                                    {loading ? 'Analyzing...' : 'Run Analysis'}
                                </button>
                             </div>
                        </div>

                        {/* AI Output */}
                        {analysis ? (
                             <div className="bg-white/5 p-6 md:p-8 rounded-3xl border border-primary/30 relative overflow-hidden animate-fade-in-up">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <span className="material-symbols-outlined text-9xl">auto_awesome</span>
                                </div>
                                
                                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">analytics</span>
                                    Market Assessment
                                </h4>

                                <div className="bg-black/40 rounded-xl p-6 mb-6 border-l-4 border-primary backdrop-blur-sm">
                                    <p className="text-slate-300 leading-relaxed italic">"{analysis.summary}"</p>
                                </div>

                                {/* Portfolio Suggestions */}
                                {analysis.portfolioSuggestions && analysis.portfolioSuggestions.length > 0 && (
                                    <div className="mb-8 animate-fade-in-up">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="p-1.5 bg-primary/20 rounded-lg text-primary shadow-[0_0_10px_rgba(37,192,244,0.3)]">
                                                 <span className="material-symbols-outlined text-sm">tips_and_updates</span>
                                            </div>
                                            <h4 className="text-sm font-bold text-white uppercase tracking-wider">AI Portfolio Suggestions</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {analysis.portfolioSuggestions.map((suggestion, i) => (
                                                <div key={i} className="group bg-gradient-to-br from-white/10 to-transparent border border-white/10 p-5 rounded-2xl hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 relative overflow-hidden flex flex-col h-full">
                                                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity duration-500 transform translate-x-2 -translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0">
                                                         <span className="material-symbols-outlined text-5xl">auto_awesome</span>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold border border-primary/30 shadow-[0_0_8px_rgba(37,192,244,0.3)]">
                                                            {i + 1}
                                                        </span>
                                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Action Item</span>
                                                    </div>
                                                    
                                                    <p className="text-slate-200 text-sm font-medium leading-relaxed relative z-10 group-hover:text-white transition-colors flex-grow">
                                                        {suggestion}
                                                    </p>
                                                    
                                                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <span className="text-[10px] text-slate-500 font-medium">AI Confidence: High</span>
                                                         <button className="text-primary hover:text-white transition-colors">
                                                            <span className="material-symbols-outlined text-sm transform group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                                         </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="grid md:grid-cols-2 gap-8">
                                    <div>
                                        <h4 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Action Plan</h4>
                                        <div className="space-y-3">
                                            {analysis.recommendations?.map((rec, i) => (
                                                <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                                                    <span className="material-symbols-outlined text-green-400 mt-0.5 text-lg shrink-0">check_circle</span>
                                                    <p className="text-slate-300 text-sm leading-relaxed">{rec}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                         <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center flex flex-col justify-center items-center">
                                            <p className="text-xs text-slate-500 uppercase font-bold mb-2">Risk Score</p>
                                            <div className="relative inline-flex items-center justify-center">
                                                 <svg className="w-16 h-16 md:w-20 md:h-20 transform -rotate-90">
                                                    <circle cx="50%" cy="50%" r="45%" stroke="#333" strokeWidth="6" fill="transparent" />
                                                    <circle cx="50%" cy="50%" r="45%" stroke={analysis.riskScore > 70 ? '#ef4444' : '#25c0f4'} strokeWidth="6" fill="transparent" strokeDasharray={226} strokeDashoffset={226 - (226 * analysis.riskScore) / 100} />
                                                 </svg>
                                                 <span className="absolute text-xl md:text-2xl font-bold text-white">{analysis.riskScore}</span>
                                            </div>
                                         </div>
                                         <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center flex flex-col justify-center items-center">
                                            <p className="text-xs text-slate-500 uppercase font-bold mb-2">Diversification</p>
                                            <div className="relative inline-flex items-center justify-center">
                                                 <svg className="w-16 h-16 md:w-20 md:h-20 transform -rotate-90">
                                                    <circle cx="50%" cy="50%" r="45%" stroke="#333" strokeWidth="6" fill="transparent" />
                                                    <circle cx="50%" cy="50%" r="45%" stroke="#10b981" strokeWidth="6" fill="transparent" strokeDasharray={226} strokeDashoffset={226 - (226 * analysis.diversificationScore) / 100} />
                                                 </svg>
                                                 <span className="absolute text-xl md:text-2xl font-bold text-white">{analysis.diversificationScore}</span>
                                            </div>
                                         </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white/5 rounded-3xl border border-white/5">
                                <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">smart_toy</span>
                                <h3 className="text-xl font-bold text-slate-300">Ready to Analyze</h3>
                                <p className="text-slate-500 max-w-md mx-auto mt-2">Our AI is standing by to evaluate your portfolio against real-time market conditions.</p>
                                <button onClick={handleAnalyze} className="mt-6 text-primary hover:text-white font-bold text-sm">Start Analysis &rarr;</button>
                            </div>
                        )}
                    </div>
                    
                    <div className="glass p-6 md:p-8 rounded-3xl border border-white/10">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">newspaper</span>
                                <h4 className="text-white font-bold text-lg">Market Intelligence</h4>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                 <div className="relative flex-1 md:flex-none">
                                    <span className="absolute left-3 top-2.5 text-slate-500 material-symbols-outlined text-sm">search</span>
                                    <input 
                                        type="text" 
                                        placeholder="Search news..." 
                                        value={newsSearch}
                                        onChange={(e) => setNewsSearch(e.target.value)}
                                        className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white text-sm focus:border-primary outline-none w-full md:w-48 transition-all focus:w-64"
                                    />
                                </div>
                                <div className="flex bg-white/5 p-1 rounded-lg">
                                    {(['all', 'positive', 'negative', 'neutral'] as const).map(filter => (
                                        <button
                                            key={filter}
                                            onClick={() => setNewsFilter(filter)}
                                            className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize transition-all ${
                                                newsFilter === filter 
                                                ? 'bg-primary text-background-dark shadow-lg' 
                                                : 'text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            {filter}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredNews.length > 0 ? (
                                filteredNews.map(item => (
                                    <div key={item.id} className="group relative bg-white/5 p-5 rounded-2xl border border-white/5 hover:border-primary/30 transition-all hover:-translate-y-1">
                                        <div className={`absolute left-0 top-6 bottom-6 w-1 rounded-r-full ${
                                            item.sentiment === 'positive' ? 'bg-green-500' : 
                                            item.sentiment === 'negative' ? 'bg-red-500' : 'bg-slate-500'
                                        }`}></div>
                                        
                                        <div className="pl-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                                                    {item.source} • {item.time}
                                                </span>
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                                                    item.sentiment === 'positive' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                                                    item.sentiment === 'negative' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                                }`}>
                                                    {item.sentiment}
                                                </span>
                                            </div>
                                            
                                            <h4 className="text-white font-bold text-base mb-3 leading-snug group-hover:text-primary transition-colors">
                                                {item.title}
                                            </h4>
                                            
                                            <div className="flex items-center justify-between mt-4">
                                                 <div className="flex items-center gap-2">
                                                    <button className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
                                                        <span className="material-symbols-outlined text-sm">share</span> Share
                                                    </button>
                                                    <button className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
                                                        <span className="material-symbols-outlined text-sm">bookmark</span> Save
                                                    </button>
                                                 </div>
                                                 <a 
                                                    href={item.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-bold text-primary flex items-center gap-1 hover:gap-2 transition-all"
                                                 >
                                                    Read More <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                                 </a>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-1 md:col-span-2 py-12 text-center text-slate-500">
                                    <span className="material-symbols-outlined text-4xl mb-2 opacity-50">find_in_page</span>
                                    <p>No news found matching your criteria.</p>
                                </div>
                            )}
                        </div>
                   </div>
                </div>
            )}
            
            {/* TAB CONTENT: SETTINGS */}
            {activeTab === 'settings' && (
                <div className="animate-fade-in space-y-6">
                    <div className="glass p-6 md:p-8 rounded-3xl border border-white/10">
                        <div className="mb-8">
                            <h3 className="text-xl md:text-2xl font-bold text-white">Account Settings</h3>
                            <p className="text-slate-400 text-sm">Manage your profile, preferences and security</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Profile & Preferences Column */}
                            <div className="space-y-6">
                                {/* Profile Card */}
                                <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                                    <h4 className="font-bold text-white mb-6 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">person</span>
                                        Profile Information
                                    </h4>
                                    
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center text-2xl font-bold border border-primary/50">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <button className="text-xs text-primary font-bold border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors">
                                            Change Avatar
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Full Name</label>
                                            <input 
                                                type="text" 
                                                value={profileName}
                                                onChange={(e) => setProfileName(e.target.value)}
                                                className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-primary outline-none text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Email Address</label>
                                            <input 
                                                type="email" 
                                                value={user.email}
                                                disabled
                                                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2.5 text-slate-400 text-sm cursor-not-allowed"
                                            />
                                            <p className="text-[10px] text-slate-500 mt-1">Contact support to change email</p>
                                        </div>
                                        <button className="bg-white/10 hover:bg-white/20 text-white font-bold text-sm px-4 py-2 rounded-lg transition-colors mt-2">
                                            Save Changes
                                        </button>
                                    </div>
                                </div>

                                {/* Preferences Card */}
                                <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                                    <h4 className="font-bold text-white mb-6 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">tune</span>
                                        App Preferences
                                    </h4>

                                    <div className="space-y-5">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Currency</label>
                                                <select 
                                                    value={settings.currency}
                                                    onChange={(e) => setSettings({...settings, currency: e.target.value})}
                                                    className="w-full bg-background-dark border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-primary"
                                                >
                                                    <option value="USD">USD ($)</option>
                                                    <option value="EUR">EUR (€)</option>
                                                    <option value="GBP">GBP (£)</option>
                                                    <option value="JPY">JPY (¥)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Language</label>
                                                <select 
                                                    value={settings.language}
                                                    onChange={(e) => setSettings({...settings, language: e.target.value})}
                                                    className="w-full bg-background-dark border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-primary"
                                                >
                                                    <option value="en">English</option>
                                                    <option value="es">Spanish</option>
                                                    <option value="fr">French</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="border-t border-white/5 pt-4">
                                            <p className="text-xs uppercase text-slate-500 font-bold mb-3">Notifications</p>
                                            <div className="space-y-3">
                                                <label className="flex items-center justify-between cursor-pointer group">
                                                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Price Alerts via Email</span>
                                                    <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.notifications.email ? 'bg-primary' : 'bg-slate-700'}`} onClick={() => setSettings({...settings, notifications: {...settings.notifications, email: !settings.notifications.email}})}>
                                                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${settings.notifications.email ? 'left-6' : 'left-1'}`}></div>
                                                    </div>
                                                </label>
                                                <label className="flex items-center justify-between cursor-pointer group">
                                                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Push Notifications</span>
                                                    <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.notifications.push ? 'bg-primary' : 'bg-slate-700'}`} onClick={() => setSettings({...settings, notifications: {...settings.notifications, push: !settings.notifications.push}})}>
                                                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${settings.notifications.push ? 'left-6' : 'left-1'}`}></div>
                                                    </div>
                                                </label>
                                                <label className="flex items-center justify-between cursor-pointer group">
                                                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Weekly Portfolio Report</span>
                                                    <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.notifications.weeklyReport ? 'bg-primary' : 'bg-slate-700'}`} onClick={() => setSettings({...settings, notifications: {...settings.notifications, weeklyReport: !settings.notifications.weeklyReport}})}>
                                                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${settings.notifications.weeklyReport ? 'left-6' : 'left-1'}`}></div>
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Security & Danger Zone Column */}
                            <div className="space-y-6">
                                {/* Security Card */}
                                <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                                    <h4 className="font-bold text-white mb-6 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">security</span>
                                        Security
                                    </h4>

                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between p-4 bg-background-dark/50 rounded-xl border border-white/5">
                                            <div>
                                                <p className="font-bold text-white text-sm">Two-Factor Authentication</p>
                                                <p className="text-xs text-slate-500 mt-1">Add an extra layer of security</p>
                                            </div>
                                            <div className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${settings.twoFactor ? 'bg-green-500' : 'bg-slate-700'}`} onClick={() => setSettings({...settings, twoFactor: !settings.twoFactor})}>
                                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.twoFactor ? 'left-7' : 'left-1'}`}></div>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-xs uppercase text-slate-500 font-bold mb-3">Change Password</p>
                                            <div className="space-y-3">
                                                <input type="password" placeholder="Current Password" className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-primary outline-none" />
                                                <input type="password" placeholder="New Password" className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-primary outline-none" />
                                                <input type="password" placeholder="Confirm New Password" className="w-full bg-background-dark border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-primary outline-none" />
                                                <button className="w-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm py-2.5 rounded-xl transition-colors">
                                                    Update Password
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Danger Zone */}
                                <div className="border border-red-500/20 bg-red-500/5 rounded-2xl p-6">
                                    <h4 className="font-bold text-red-400 mb-2 flex items-center gap-2">
                                        <span className="material-symbols-outlined">warning</span>
                                        Danger Zone
                                    </h4>
                                    <p className="text-xs text-slate-400 mb-4">
                                        Once you delete your account, there is no going back. Please be certain.
                                    </p>
                                    <button className="border border-red-500/50 text-red-400 hover:bg-red-500/10 font-bold text-sm px-4 py-2 rounded-lg transition-colors w-full sm:w-auto">
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* ADD ASSET MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
                    <div className="relative w-full max-w-md bg-background-dark border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl animate-fade-in-up m-4 overflow-y-auto max-h-[90vh]">
                        <h3 className="text-xl font-bold text-white mb-6">Add New Asset</h3>
                        <form onSubmit={handleAddAsset} className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Asset Symbol</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. BTC, AAPL"
                                    value={newAsset.symbol}
                                    onChange={(e) => setNewAsset({...newAsset, symbol: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Type</label>
                                <select 
                                    value={newAsset.type}
                                    onChange={(e) => setNewAsset({...newAsset, type: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                >
                                    <option value="stock">Stock</option>
                                    <option value="crypto">Crypto</option>
                                    <option value="cash">Cash</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Amount Owned</label>
                                <input 
                                    type="number" 
                                    placeholder="0.00"
                                    step="any"
                                    value={newAsset.amount}
                                    onChange={(e) => setNewAsset({...newAsset, amount: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                />
                            </div>
                            <div className="flex gap-4 mt-6">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 rounded-xl font-bold text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 bg-primary text-background-dark py-3 rounded-xl font-bold text-sm hover:brightness-110 transition-colors">Add to Portfolio</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
             {/* BROKERAGE CONNECTION MODAL */}
             {isBrokerageModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsBrokerageModalOpen(false)}></div>
                    <div className="relative w-full max-w-md bg-background-dark border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl animate-fade-in-up m-4">
                        <button onClick={() => setIsBrokerageModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                        
                        <div className="text-center mb-6">
                             <div className="inline-flex p-3 bg-primary/10 rounded-2xl mb-4 text-primary">
                                <span className="material-symbols-outlined text-3xl">account_balance</span>
                             </div>
                             <h3 className="text-xl font-bold text-white">Connect Brokerage</h3>
                             <p className="text-slate-400 text-sm mt-2">Securely import your portfolio holdings</p>
                        </div>
                        
                        <div className="space-y-3 mb-6">
                            {['SafeTrade', 'Robinhood (Mock)', 'Coinbase (Mock)'].map((broker) => (
                                <button key={broker} className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-white/10 transition-all text-left group">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-primary/20 transition-colors">
                                        <span className="material-symbols-outlined text-xl">corporate_fare</span>
                                    </div>
                                    <span className="font-bold text-slate-300 group-hover:text-white">{broker}</span>
                                    <span className="material-symbols-outlined ml-auto text-slate-500 group-hover:text-primary">chevron_right</span>
                                </button>
                            ))}
                        </div>
                        
                        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-3 mb-6">
                             <span className="material-symbols-outlined text-blue-400 shrink-0">info</span>
                             <p className="text-xs text-blue-200/80 leading-relaxed">
                                 This is a simulated connection. No real credentials will be sent. Data is generated for demonstration purposes.
                             </p>
                        </div>

                        <button 
                            onClick={handleConnectBrokerage}
                            disabled={isConnecting}
                            className="w-full bg-primary text-background-dark font-bold py-3.5 rounded-xl neon-glow hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isConnecting ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                                    Connecting Securely...
                                </>
                            ) : (
                                'Simulate Connection'
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* ADD WATCHLIST ITEM MODAL */}
            {isWatchlistModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsWatchlistModalOpen(false)}></div>
                    <div className="relative w-full max-w-md bg-background-dark border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl animate-fade-in-up m-4">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-primary/20 rounded-lg text-primary">
                                <span className="material-symbols-outlined">visibility</span>
                            </div>
                            <h3 className="text-xl font-bold text-white">Add to Watchlist</h3>
                        </div>
                        <form onSubmit={handleAddToWatchlist} className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Asset Symbol</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. MSFT, SOL"
                                    value={newWatchlistItem.symbol}
                                    onChange={(e) => setNewWatchlistItem({...newWatchlistItem, symbol: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Type</label>
                                <select 
                                    value={newWatchlistItem.type}
                                    onChange={(e) => setNewWatchlistItem({...newWatchlistItem, type: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                >
                                    <option value="stock">Stock</option>
                                    <option value="crypto">Crypto</option>
                                </select>
                            </div>
                            <div className="flex gap-4 mt-6">
                                <button type="button" onClick={() => setIsWatchlistModalOpen(false)} className="flex-1 py-3 rounded-xl font-bold text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 bg-primary text-background-dark py-3 rounded-xl font-bold text-sm hover:brightness-110 transition-colors">Track Asset</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ADD ALERT MODAL */}
            {isAlertModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsAlertModalOpen(false)}></div>
                    <div className="relative w-full max-w-md bg-background-dark border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl animate-fade-in-up m-4">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-primary/20 rounded-lg text-primary">
                                <span className="material-symbols-outlined">notifications</span>
                            </div>
                            <h3 className="text-xl font-bold text-white">Set Price Alert</h3>
                        </div>
                        <form onSubmit={handleAddAlert} className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Asset Symbol</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. BTC, TSLA"
                                    value={newAlert.symbol}
                                    onChange={(e) => setNewAlert({...newAlert, symbol: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Condition</label>
                                    <select 
                                        value={newAlert.condition}
                                        onChange={(e) => setNewAlert({...newAlert, condition: e.target.value as 'above' | 'below'})}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                    >
                                        <option value="above">Above</option>
                                        <option value="below">Below</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Target Price ($)</label>
                                    <input 
                                        type="number" 
                                        placeholder="0.00"
                                        step="any"
                                        value={newAlert.price}
                                        onChange={(e) => setNewAlert({...newAlert, price: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 mt-6">
                                <button type="button" onClick={() => setIsAlertModalOpen(false)} className="flex-1 py-3 rounded-xl font-bold text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 bg-primary text-background-dark py-3 rounded-xl font-bold text-sm hover:brightness-110 transition-colors">Create Alert</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;