import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { register } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, MapPin, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    title: '',
    company: '',
    location: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const getPasswordStrength = (pass) => {
    if (!pass) return { label: '', color: '' };
    if (pass.length < 6) return { label: 'Too short (min 6 chars)', color: '#ef4444' };
    const hasNum = /\d/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);
    if (pass.length >= 8 && hasNum && hasSpecial) return { label: 'Strong password', color: '#10b981' };
    if (pass.length >= 6 && (hasNum || hasSpecial)) return { label: 'Medium strength', color: '#f59e0b' };
    return { label: 'Weak password', color: '#ef4444' };
  };

  const strength = getPasswordStrength(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        title: form.title.trim(),
        headline: form.title.trim() || 'Professional Member',
        company: form.company.trim(),
        location: form.location.trim()
      });
      authLogin(data.token, {
        id: data.userId,
        name: data.name,
        email: data.email,
        headline: form.title.trim() || 'Professional Member'
      });
      navigate('/feed');
    } catch (err) {
      if (err.response?.status === 409) {
        setError('This email is already registered. Please sign in instead.');
      } else {
        setError(err.response?.data?.error || 'Registration failed. Please check your information and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card card">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="auth-logo-badge">N</span>
            <span className="auth-logo-text">Nodework</span>
          </div>
          <h2>Make the most of your professional life</h2>
          <p>Join thousands of engineers, leaders, and creators</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Full Name *</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input
                type="text"
                required
                placeholder="e.g. Alex Johnson"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email Address *</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password (6+ characters) *</label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Create password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
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
            {form.password && (
              <div style={{ fontSize: '11px', marginTop: '4px', color: strength.color, fontWeight: 500 }}>
                {strength.label}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Confirm Password *</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Confirm password"
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Headline or Job Title</label>
              <input
                type="text"
                placeholder="e.g. Full-Stack Developer"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Current Company</label>
              <input
                type="text"
                placeholder="e.g. Amazon"
                value={form.company}
                onChange={e => setForm({ ...form, company: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Location</label>
            <div className="input-with-icon">
              <MapPin size={18} className="input-icon" />
              <input
                type="text"
                placeholder="e.g. San Francisco Bay Area"
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={submitting}
          >
            {submitting ? 'Creating account...' : 'Agree & Join Nodework'}
          </button>
        </form>

        <div className="auth-footer">
          Already on Nodework? <NavLink to="/login">Sign in</NavLink>
        </div>
      </div>
    </div>
  );
}
