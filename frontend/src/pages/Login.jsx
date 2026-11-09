import { useState } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { login, googleAuth, linkedinAuth } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Sparkles, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login: authLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // 1. Handle Google OAuth id_token in URL hash
    const hash = window.location.hash;
    if (hash && hash.includes('id_token=')) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const idToken = hashParams.get('id_token');
      if (idToken) {
        setSubmitting(true);
        googleAuth(idToken)
          .then(data => {
            authLogin(data.token, {
              id: data.userId,
              name: data.name,
              email: data.email,
              headline: data.headline,
              avatarUrl: data.avatarUrl
            });
            navigate('/feed');
          })
          .catch(err => {
            setError(err.response?.data?.error || 'Google sign-in failed.');
          })
          .finally(() => setSubmitting(false));
      }
    }

    // 2. Handle LinkedIn OAuth code in query params
    const code = searchParams.get('code');
    if (code) {
      setSubmitting(true);
      linkedinAuth(code, window.location.origin + '/login')
        .then(data => {
          authLogin(data.token, {
            id: data.userId,
            name: data.name,
            email: data.email,
            headline: data.headline,
            avatarUrl: data.avatarUrl
          });
          navigate('/feed');
        })
        .catch(err => {
          setError(err.response?.data?.error || 'LinkedIn sign-in failed.');
        })
        .finally(() => setSubmitting(false));
    }
  }, [searchParams]);

  const isDemoEnabled = import.meta.env.VITE_DEMO_ENABLED === 'true';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await login(email.trim(), password);
      authLogin(data.token, {
        id: data.userId,
        name: data.name,
        email: data.email,
        headline: data.headline,
        avatarUrl: data.avatarUrl
      });
      navigate('/feed');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="auth-shell">
      <div className="auth-card card">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="auth-logo-badge">N</span>
            <span className="auth-logo-text">Nodework</span>
          </div>
          <h2>Welcome back to your network</h2>
          <p>Stay updated on your professional world</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>Password</label>
              <NavLink to="/forgot-password" style={{ fontSize: '12px', color: 'var(--primary, #0a66c2)', textDecoration: 'none' }}>
                Forgot password?
              </NavLink>
            </div>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center'
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={submitting}
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0 16px', gap: '12px' }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>or sign in with</span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <button
            type="button"
            className="btn btn-outline btn-block"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px' }}
            onClick={() => {
              const googleId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
              if (!googleId) {
                alert('Google Sign-In is ready to activate! Please configure VITE_GOOGLE_CLIENT_ID in your environment variables.');
                return;
              }
              const redirectUri = window.location.origin + '/login';
              const nonce = Math.random().toString(36).substring(2);
              window.open(`https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleId}&response_type=id_token&scope=openid%20email%20profile&redirect_uri=${encodeURIComponent(redirectUri)}&nonce=${nonce}`, '_self');
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Google
          </button>

          <button
            type="button"
            className="btn btn-outline btn-block"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px' }}
            onClick={() => {
              const linkedinId = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
              if (!linkedinId) {
                alert('LinkedIn OpenID Connect integration is scaffolded. Add VITE_LINKEDIN_CLIENT_ID and approval from LinkedIn Developer portal to activate.');
                return;
              }
              const redirectUri = window.location.origin + '/login';
              window.open(`https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${linkedinId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20email`, '_self');
            }}
          >
            <svg width="16" height="16" fill="#0a66c2" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
            LinkedIn
          </button>
        </div>

        {/* Demo Accounts Quick-Fill Box (Only shown if VITE_DEMO_ENABLED is true) */}
        {isDemoEnabled && (
          <div className="demo-accounts-box">
            <div className="demo-title">
              <Sparkles size={14} className="text-accent" />
              <span>One-Click Demo Accounts</span>
            </div>
            <div className="demo-btns-row">
              <button
                type="button"
                className="btn-demo-pill"
                onClick={() => handleQuickDemo('alice@nodework.com', 'Demo@1234!')}
              >
                👩‍💻 Alice Chen (Architect)
              </button>
              <button
                type="button"
                className="btn-demo-pill"
                onClick={() => handleQuickDemo('bob@nodework.com', 'Demo@1234!')}
              >
                👨‍💻 Bob Smith (Frontend Lead)
              </button>
            </div>
          </div>
        )}

        <div className="auth-footer">
          New to Nodework? <NavLink to="/register">Join now</NavLink>
        </div>
      </div>
    </div>
  );
}
