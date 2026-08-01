import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFollowers, getSecondDegree, sendRequest } from '../api/connections';

export default function Connections() {
  const { user } = useAuth();
  const [followers, setFollowers] = useState([]);
  const [secondDegree, setSecondDegree] = useState([]);
  const [targetId, setTargetId] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [f, s] = await Promise.all([getFollowers(user.id), getSecondDegree(user.id)]);
      setFollowers(f.followers || []);
      setSecondDegree(s.secondDegree || []);
    } catch (err) {
      setError(`Could not load your network (${err.response?.status || err.message || 'unknown error'}).`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!targetId.trim()) return;
    try {
      const res = await sendRequest(user.id, targetId.trim());
      setStatus(res.message || 'Request sent.');
      setTargetId('');
    } catch (err) {
      setStatus(`Could not send request (${err.response?.status || err.message}).`);
    }
  };

  if (loading) return <div className="spinner-row">Loading your network…</div>;

  return (
    <div>
      <div className="card" style={{ marginTop: 20, marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12 }}>Connect with someone</h3>
        <form onSubmit={handleConnect} style={{ display: 'flex', gap: 10 }}>
          <input placeholder="Their user ID, e.g. user_101" value={targetId} onChange={(e) => setTargetId(e.target.value)} />
          <button type="submit" className="btn-primary">Send request</button>
        </form>
        {status && <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginTop: 10 }}>{status}</p>}
      </div>

      {error && <div className="error-banner" style={{ marginBottom: 20 }}>{error}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12 }}>Your connections ({followers.length})</h3>
        {followers.length === 0 ? (
          <p style={{ color: 'var(--ink-soft)' }}>No connections yet.</p>
        ) : (
          followers.map((id) => <span key={id} className="skill-tag">{id}</span>)
        )}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>People you may know ({secondDegree.length})</h3>
        {secondDegree.length === 0 ? (
          <p style={{ color: 'var(--ink-soft)' }}>No suggestions right now.</p>
        ) : (
          secondDegree.map((id) => <span key={id} className="skill-tag">{id}</span>)
        )}
      </div>
    </div>
  );
}
