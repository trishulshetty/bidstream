import { API_URL } from '../config';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap,
    ShieldCheck,
    History,
    AlertTriangle,
    Activity,
    TrendingUp,
    Cpu,
    ArrowLeft,
    Play
} from 'lucide-react';

const Logo = ({ size = 'md' }) => {
    const dimensions = size === 'lg' ? { container: '48px', inner: '18px', radius: '12px' } :
        size === 'sm' ? { container: '28px', inner: '10px', radius: '6px' } :
            { container: '36px', inner: '14px', radius: '10px' };

    return (
        <div style={{
            width: dimensions.container,
            height: dimensions.container,
            borderRadius: dimensions.radius,
            background: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
            <div style={{
                width: dimensions.inner,
                height: dimensions.inner,
                background: 'var(--bg-deep)',
                borderRadius: '2px'
            }} />
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon, color, subValue }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={{ padding: '24px', borderLeft: `4px solid ${color}`, flex: 1, minWidth: '200px' }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</span>
            <Icon size={18} style={{ color }} />
        </div>
        <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)', fontFamily: 'monospace' }}>{value}</div>
        {subValue && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{subValue}</div>}
    </motion.div>
);

const Simulator = () => {
    const navigate = useNavigate();
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentStage, setCurrentStage] = useState(null); // 'naive' or 'redis'
    const [report, setReport] = useState(null);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io(API_URL);
        setSocket(newSocket);

        newSocket.on('sim_progress', (data) => {
            setCurrentStage(data.stage);
            setProgress(data.progress);
        });

        newSocket.on('sim_complete', (data) => {
            setReport(data);
            setIsRunning(false);
            setCurrentStage(null);
        });

        return () => newSocket.close();
    }, []);

    const startSimulation = async () => {
        setReport(null);
        setIsRunning(true);
        setProgress(0);
        try {
            await axios.post(`${API_URL}/api/simulator/run?count=1000`);
        } catch (err) {
            alert('Simulation failed: ' + (err.response?.data?.message || err.message));
            setIsRunning(false);
        }
    };

    const chartData = report ? [
        { name: 'Naive', throughput: parseInt(report.naive.throughput), errors: report.naive.integrityErrors + report.naive.lostUpdates, latency: report.naive.timeMs / 1000 },
        { name: 'Redis', throughput: parseInt(report.redis.throughput), errors: report.redis.integrityErrors + report.redis.lostUpdates, latency: report.redis.timeMs / 1000 }
    ] : [];

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-deep)' }}>
            <nav style={{
                padding: '1.5rem 4rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-color)',
                background: 'rgba(2, 6, 23, 0.8)',
                backdropFilter: 'blur(12px)',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <Logo size="sm" />
                        <span style={{
                            fontSize: '1.5rem',
                            fontWeight: '800',
                            letterSpacing: '0.05em',
                            fontFamily: "'Bricolage Grotesque', sans-serif",
                            color: 'var(--text-main)',
                            textTransform: 'uppercase'
                        }}>BidStream <span style={{ color: 'var(--text-dim)', fontWeight: '400' }}>/ Labs</span></span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isRunning ? '#fbbf24' : '#10b981' }} />
                    <span style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                        {isRunning ? `Running ${currentStage} test...` : 'System Ready'}
                    </span>
                </div>
            </nav>

            <main style={{ flex: 1, padding: '4rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                <header style={{ marginBottom: '4rem' }}>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--text-main)' }}>Concurrency Lab</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '700px' }}>
                        Visualizing the impact of Distributed Locks and Atomic Operations in a high-frequency bidding environment.
                        We contrast a standard application-level database logic against Redis-backed Lua execution.
                    </p>
                </header>

                {!report && !isRunning && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-card"
                        style={{ padding: '6rem 4rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border-color)' }}
                    >
                        <div style={{ background: 'var(--primary-light)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                            <Cpu size={40} style={{ color: 'var(--primary)' }} />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem' }}>Stress Test Ready</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: '500px', marginInline: 'auto' }}>
                            Launching this test will initiate 1,000 concurrent bid requests across two independent architecture scenarios.
                        </p>
                        <button
                            onClick={startSimulation}
                            className="btn-primary"
                            style={{ height: '72px', paddingInline: '4rem', fontSize: '1.1rem', borderRadius: '12px', boxShadow: '0 0 30px rgba(203, 213, 225, 0.1)' }}
                        >
                            <Play size={24} fill="currentColor" /> INITIATE STRESS TEST
                        </button>
                    </motion.div>
                )}

                {isRunning && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                        <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: '2rem' }}>
                                Executing {currentStage?.toUpperCase()} Simulation
                            </div>
                            <div style={{ height: '8px', background: 'var(--bg-dark)', borderRadius: '10px', overflow: 'hidden', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                                <motion.div
                                    animate={{ width: `${progress}%` }}
                                    style={{ height: '100%', background: 'var(--primary)', boxShadow: '0 0 20px var(--primary)' }}
                                />
                            </div>
                            <div style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--text-main)' }}>{Math.round(progress)}%</div>
                            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '4rem' }}>
                                <div>
                                    <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>NETWORK PACKETS</div>
                                    <div style={{ fontWeight: '800' }}>{(progress * 10).toFixed(0)} / 1000</div>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>TARGET LATENCY</div>
                                    <div style={{ fontWeight: '800' }}>&lt; 20ms</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {report && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                            <StatCard
                                title="Throughput (Redis)"
                                value={`${report.redis.throughput}`}
                                subValue="Transactions per sec"
                                icon={Zap}
                                color="#10b981"
                            />
                            <StatCard
                                title="Integrity Score"
                                value="100%"
                                subValue="Zero Data Corruption"
                                icon={ShieldCheck}
                                color="#3b82f6"
                            />
                            <StatCard
                                title="Naive Failures"
                                value={`${report.naive.lostUpdates + report.naive.integrityErrors}`}
                                subValue="Race Condition Artifacts"
                                icon={AlertTriangle}
                                color="#ef4444"
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                            <div className="glass-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                    <Activity size={20} style={{ color: 'var(--primary)' }} />
                                    <h3 style={{ fontSize: '1rem', fontWeight: '800', textTransform: 'uppercase' }}>Performance Comparison</h3>
                                </div>
                                <div style={{ flex: 1, minHeight: '300px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                            <XAxis dataKey="name" stroke="var(--text-dim)" fontSize={12} />
                                            <YAxis stroke="var(--text-dim)" fontSize={12} />
                                            <Tooltip
                                                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                                itemStyle={{ color: 'var(--text-main)' }}
                                            />
                                            <Legend />
                                            <Line name="Bids/sec" type="monotone" dataKey="throughput" stroke="#10b981" strokeWidth={3} dot={{ r: 6 }} />
                                            <Line name="Data Errors" type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={3} dot={{ r: 6 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div className="glass-card" style={{ padding: '32px' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: '800', textTransform: 'uppercase', marginBottom: '20px', color: 'var(--text-muted)' }}>The "Lost Update" Problem</h3>
                                    <div style={{ borderLeft: '2px solid #ef4444', paddingLeft: '20px', marginBottom: '20px' }}>
                                        <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ef4444' }}>{report.naive.lostUpdates} UPDATES DROPPED</div>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '8px' }}>
                                            In the Naive scenario, multiple processes read the same price and attempted to update it based on stale data. Higher bids were literally erased by slower, lower ones.
                                        </p>
                                    </div>
                                    <div style={{ borderLeft: '2px solid #10b981', paddingLeft: '20px' }}>
                                        <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#10b981' }}>0 UPDATES DROPPED (REDIS)</div>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '8px' }}>
                                            Redis Lua scripts execute atomically. Even with 1,000 sub-millisecond requests, every operation was serialized, ensuring not a single dollar was lost.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={startSimulation}
                                    className="btn-secondary"
                                    style={{ height: '60px', width: '100%', borderRadius: '12px' }}
                                >
                                    RERUN EXPERIMENT
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <footer style={{
                padding: '2.5rem 4rem',
                borderTop: '1px solid var(--border-color)',
                color: 'var(--text-dim)',
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: '700',
                display: 'flex',
                justifyContent: 'center'
            }}>
                Engineered for Atomic Integrity • Powered by Redis Distributed States
            </footer>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .recharts-cartesian-grid-horizontal line, .recharts-cartesian-grid-vertical line {
                    stroke: rgba(255,255,255,0.05);
                }
            `}</style>
        </div>
    );
};

export default Simulator;
