import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getUser } from '../api/users';

export default function Profile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getUser(id)
      .then(setProfile)
      .catch(() => setError('Could not load this profile.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="spinner-row">Loading profile…</div>;
  if (!profile) return <div className="error-banner">{error || 'Profile not found.'}</div>;

  return (
    <div>
      <div className="card">
        <div className="profile-header">
          <div className="avatar">{profile.name?.[0]?.toUpperCase() ?? '?'}</div>
          <div>
            <h2>{profile.name}</h2>
            <div style={{ color: 'var(--ink-soft)' }}>{profile.title || 'No headline yet'}</div>
          </div>
        </div>
        <p style={{ margin: '4px 0' }}><strong>Company:</strong> {profile.company || '—'}</p>
        <p style={{ margin: '4px 0' }}><strong>College:</strong> {profile.college || '—'}</p>
        <p style={{ margin: '4px 0' }}><strong>Connections:</strong> {profile.connectionsCount ?? 0}</p>
        <div style={{ marginTop: 10 }}>
          {(profile.skills || []).map((s) => <span key={s} className="skill-tag">{s}</span>)}
        </div>
      </div>
    </div>
  );
}
