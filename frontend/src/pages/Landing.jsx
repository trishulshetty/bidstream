import { useNavigate } from 'react-router-dom';
import { Gavel, ArrowRight } from 'lucide-react';

const Logo = ({ size = 'md' }) => {
  const dimensions = size === 'lg' ? { container: '48px', inner: '18px', radius: '12px' } : 
                     size === 'sm' ? { container: '28px', inner: '10px', radius: '6px' }  :
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

const Landing = () => {
    const navigate = useNavigate();

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-deep)' }}>
            {/* Header */}
            <nav style={{
                padding: '1.5rem 4rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'rgba(2, 6, 23, 0.8)',
                backdropFilter: 'blur(12px)',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <Logo />
                    <span style={{ 
                        fontSize: '1.5rem', 
                        fontWeight: '800', 
                        letterSpacing: '0.05em',
                        fontFamily: "'Bricolage Grotesque', sans-serif",
                        color: 'var(--text-main)',
                        textTransform: 'uppercase'
                    }}>
                        BidStream
                    </span>
                </div>

                <div>
                    <button
                        onClick={() => navigate('/login')}
                        className="btn-secondary"
                        style={{ padding: '0.6rem 1.5rem', fontSize: '0.75rem', border: '1px solid var(--border-color)' }}
                    >
                        Enter Platform
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <main style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4rem',
                textAlign: 'left'
            }}>
                <div style={{ maxWidth: '900px', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '2.5rem' }}>
                        <div style={{ width: '40px', height: '1px', background: 'var(--text-dim)' }} />
                        <h3 style={{
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.2em',
                            fontSize: '0.7rem',
                            fontWeight: '700'
                        }}>
                            Infrastructure Overview
                        </h3>
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(3rem, 8vw, 6rem)', 
                        fontWeight: '800',
                        lineHeight: 0.95,
                        letterSpacing: '-0.04em',
                        marginBottom: '3rem',
                        color: 'var(--text-main)',
                        fontFamily: "'Bricolage Grotesque', sans-serif",
                        textTransform: 'uppercase'
                    }}>
                        Elite Real-Time<br />Auction Engine.
                    </h1>

                    <div style={{ display: 'flex', gap: '4rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <p style={{
                            fontSize: '1.2rem',
                            color: 'var(--text-muted)',
                            flex: '1 1 450px',
                            lineHeight: 1.6,
                            fontWeight: '300'
                        }}>
                            BidStream provides a robust, low-latency framework for high-stakes asset liquidation. 
                            Engineered for performance, transparency, and atomic execution.
                        </p>

                        <button
                            onClick={() => navigate('/login')}
                            className="btn-primary"
                            style={{
                                height: '64px',
                                paddingInline: '3rem',
                                fontSize: '1rem',
                                marginTop: '1rem'
                            }}
                        >
                            Launch App <ArrowRight size={20} style={{ marginLeft: '8px' }} />
                        </button>
                    </div>
                </div>
            </main>

            <footer style={{
                padding: '2.5rem 4rem',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                color: 'var(--text-dim)',
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: '700'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                    System Status: <span style={{ color: 'var(--text-muted)' }}>Operational</span>
                </div>
                <div>BidStream Core © {new Date().getFullYear()}</div>
            </footer>
        </div>
    );
};

export default Landing;
