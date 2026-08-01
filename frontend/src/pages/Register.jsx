import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', title: '', company: '', college: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/feed');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create your account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card card">
        <div className="brand">
          <div className="mark">N</div>
          <h1 style={{ fontSize: '1.3rem' }}>Create your account</h1>
        </div>
        {error && <div className="error-banner" style={{ marginBottom: 14 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field"><label>Full name</label><input required value={form.name} onChange={update('name')} /></div>
          <div className="field"><label>Email</label><input type="email" required value={form.email} onChange={update('email')} /></div>
          <div className="field"><label>Password</label><input type="password" required minLength={6} value={form.password} onChange={update('password')} /></div>
          <div className="field"><label>Headline (optional)</label><input placeholder="e.g. Backend Engineer" value={form.title} onChange={update('title')} /></div>
          <div className="field"><label>Company (optional)</label><input value={form.company} onChange={update('company')} /></div>
          <div className="field"><label>College (optional)</label><input value={form.college} onChange={update('college')} /></div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: 4 }}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 18, fontSize: '0.88rem', color: 'var(--ink-soft)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
