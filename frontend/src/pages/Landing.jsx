import { useNavigate } from 'react-router-dom';
import {
    Gavel,
    ShieldCheck,
    Zap,
    Globe,
    ChevronRight,
    ArrowRight,
    Monitor,
    Database,
    Users
} from 'lucide-react';

const Landing = () => {
    const navigate = useNavigate();

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <nav style={{
                padding: '1.5rem 4rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'fixed',
                top: 0,
                width: '100%',
                zIndex: 100,
                background: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid var(--glass-border)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'var(--shadow-glow)'
                    }}>
                        <Gavel size={24} color="white" />
                    </div>
                    <span style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.03em' }}>BidStream</span>
                </div>

                <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                    <a href="#features" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: '600' }}>Features</a>
                    <a href="#about" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: '600' }}>Integrations</a>
                    <button
                        onClick={() => navigate('/login')}
                        className="btn-primary"
                        style={{ padding: '0.6rem 1.5rem' }}
                    >
                        Launch App
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section style={{
                padding: '10rem 4rem 6rem',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background Gradients */}
                <div style={{
                    position: 'absolute',
                    top: '10%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '80%',
                    height: '400px',
                    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0) 70%)',
                    filter: 'blur(80px)',
                    zIndex: -1
                }} />

                <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        background: 'var(--primary-light)',
                        borderRadius: '999px',
                        color: 'var(--primary)',
                        fontSize: '0.875rem',
                        fontWeight: '700',
                        marginBottom: '24px',
                        border: '1px solid rgba(99, 102, 241, 0.2)'
                    }}>
                        <Zap size={16} fill="currentColor" />
                        New: Atomic Bidding Engine 2.0
                    </div>

                    <h1 style={{ fontSize: '4.5rem', fontWeight: '900', lineHeight: 1.1, letterSpacing: '-0.04em', marginBottom: '24px' }}>
                        The High-Performance <br />
                        <span style={{
                            background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>Auction Infrastructure</span>
                    </h1>

                    <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '700px', margin: '0 auto 40px', lineHeight: 1.6 }}>
                        Experience sub-millisecond bidding at scale. BidStream combines Redis-backed atomic operations with a distributed architecture to handle thousands of concurrent bids without breaking a sweat.
                    </p>

                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                        <button
                            onClick={() => navigate('/login')}
                            className="btn-primary"
                            style={{ height: '60px', paddingInline: '2.5rem', fontSize: '1.1rem' }}
                        >
                            Get Started for Free
                            <ArrowRight size={20} />
                        </button>
                        <button className="btn-secondary" style={{ height: '60px', paddingInline: '2.5rem', fontSize: '1.1rem' }}>
                            View Case Studies
                        </button>
                    </div>

                    {/* Stats */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '60px',
                        marginTop: '80px',
                        color: 'var(--text-dim)'
                    }}>
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)' }}>50ms</div>
                            <div style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Max Latency</div>
                        </div>
                        <div style={{ width: '1px', background: 'var(--glass-border)' }} />
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)' }}>10k+</div>
                            <div style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Bids/Sec</div>
                        </div>
                        <div style={{ width: '1px', background: 'var(--glass-border)' }} />
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)' }}>99.9%</div>
                            <div style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>SLA Guarantee</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" style={{ padding: '6rem 4rem', background: 'rgba(30, 41, 59, 0.3)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '16px' }}>Built for Critical Workloads</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Modern features for modern auctioneers.</p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '32px'
                    }}>
                        {[
                            {
                                icon: <ShieldCheck size={28} />,
                                title: "Atomic Assurance",
                                desc: "Powered by Redis Lua scripts to prevent overselling and race conditions during high-speed bidding wars."
                            },
                            {
                                icon: <Globe size={28} />,
                                title: "Edge Distribution",
                                desc: "Bidders connect to the nearest node, ensuring the lowest possible latency for high-stakes decisions."
                            },
                            {
                                icon: <Database size={28} />,
                                title: "Persistent Integrity",
                                desc: "Every bid is verified in memory and synced to PostgreSQL for a bulletproof audit trail."
                            },
                            {
                                icon: <Monitor size={28} />,
                                title: "Live Dashboard",
                                desc: "Beautifully designed administrative panel to manage auctions, users, and disputes in real-time."
                            },
                            {
                                icon: <Users size={28} />,
                                title: "Role-Based Access",
                                desc: "Granular controls for auctioneers, bidders, and observers with seamless JWT integration."
                            },
                            {
                                icon: <ChevronRight size={28} />,
                                title: "Webhook Integrations",
                                desc: "Easily connect your existing ERP or sales systems via our robust developer-first API."
                            }
                        ].map((feat, i) => (
                            <div key={i} className="glass-card" style={{ padding: '32px', transition: 'transform 0.3s' }}>
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '14px',
                                    background: 'var(--primary-light)',
                                    color: 'var(--primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '24px'
                                }}>
                                    {feat.icon}
                                </div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '12px' }}>{feat.title}</h3>
                                <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                padding: '4rem',
                borderTop: '1px solid var(--glass-border)',
                background: 'var(--bg-dark)',
                textAlign: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
                    <Gavel size={24} color="var(--primary)" />
                    <span style={{ fontSize: '1.25rem', fontWeight: '800' }}>BidStream</span>
                </div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>
                    © 2026 BidStream Technologies Inc. All rights reserved. Built with passion for open-source.
                </div>
            </footer>
        </div>
    );
};

export default Landing;
