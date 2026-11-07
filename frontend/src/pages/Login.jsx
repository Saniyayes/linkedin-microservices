import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Sparkles, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

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
            <label>Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
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

        {/* Demo Accounts Quick-Fill Box for Testing & Interview Review */}
        <div className="demo-accounts-box">
          <div className="demo-title">
            <Sparkles size={14} className="text-accent" />
            <span>One-Click Demo Accounts</span>
          </div>
          <div className="demo-btns-row">
            <button
              type="button"
              className="btn-demo-pill"
              onClick={() => handleQuickDemo('alice@nodework.com', 'password123')}
            >
              👩‍💻 Alice Chen (Architect)
            </button>
            <button
              type="button"
              className="btn-demo-pill"
              onClick={() => handleQuickDemo('bob@nodework.com', 'password123')}
            >
              👨‍💻 Bob Smith (Frontend Lead)
            </button>
          </div>
        </div>

        <div className="auth-footer">
          New to Nodework? <NavLink to="/register">Join now</NavLink>
        </div>
      </div>
    </div>
  );
}
