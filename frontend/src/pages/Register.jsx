import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { register } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Briefcase, MapPin, Sparkles } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    title: '',
    headline: '',
    company: '',
    college: '',
    location: '',
    avatarUrl: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await register({
        ...form,
        headline: form.headline || form.title || 'Professional Member'
      });
      authLogin(data.token, {
        id: data.userId,
        name: data.name,
        email: data.email,
        headline: form.headline || form.title
      });
      navigate('/feed');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
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
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Create password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
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
