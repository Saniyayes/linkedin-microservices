import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchUsers } from '../api/users';
import { getJobs } from '../api/jobs';
import { getAllPosts } from '../api/posts';
import { useAuth } from '../context/AuthContext';
import {
  Search as SearchIcon,
  Users,
  Briefcase,
  FileText,
  UserPlus,
  Send,
  Building,
  MapPin,
  Sparkles
} from 'lucide-react';
import { sendConnectionRequest } from '../api/connections';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();
  const { user } = useAuth();

  const [filter, setFilter] = useState('ALL'); // ALL, PEOPLE, JOBS, POSTS
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectedMap, setConnectedMap] = useState({});

  useEffect(() => {
    async function executeSearch() {
      if (!query.trim()) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [usersRes, jobsRes, postsRes] = await Promise.all([
          searchUsers(query),
          getJobs(query, user?.id),
          getAllPosts(user?.id)
        ]);
        setUsers(usersRes || []);
        setJobs((jobsRes || []).map(j => j.job));
        setPosts(
          (postsRes || []).filter(p =>
            p.content?.toLowerCase().includes(query.toLowerCase()) ||
            p.authorName?.toLowerCase().includes(query.toLowerCase())
          )
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    executeSearch();
  }, [query, user?.id]);

  const handleConnect = async (target) => {
    try {
      await sendConnectionRequest(user.id, target.id, user.name, target.name);
      setConnectedMap(prev => ({ ...prev, [target.id]: true }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="search-page-container">
      <div className="search-page-header card">
        <h2>
          Search results for "<span className="text-accent">{query}</span>"
        </h2>
        <div className="search-filter-tabs">
          <button
            type="button"
            className={`search-tab-pill ${filter === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilter('ALL')}
          >
            All Results
          </button>
          <button
            type="button"
            className={`search-tab-pill ${filter === 'PEOPLE' ? 'active' : ''}`}
            onClick={() => setFilter('PEOPLE')}
          >
            <Users size={15} />
            <span>People ({users.length})</span>
          </button>
          <button
            type="button"
            className={`search-tab-pill ${filter === 'JOBS' ? 'active' : ''}`}
            onClick={() => setFilter('JOBS')}
          >
            <Briefcase size={15} />
            <span>Jobs ({jobs.length})</span>
          </button>
          <button
            type="button"
            className={`search-tab-pill ${filter === 'POSTS' ? 'active' : ''}`}
            onClick={() => setFilter('POSTS')}
          >
            <FileText size={15} />
            <span>Posts ({posts.length})</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="skeleton-card" style={{ height: 200, marginTop: 16 }} />
      ) : (
        <div className="search-results-content">
          {/* People Section */}
          {(filter === 'ALL' || filter === 'PEOPLE') && (
            <div className="card search-section-card">
              <div className="section-header">
                <h3>People ({users.length})</h3>
              </div>
              {users.length === 0 ? (
                <div className="empty-sub-state">No professionals found.</div>
              ) : (
                <div className="search-users-list">
                  {users.map(u => (
                    <div key={u.id} className="search-user-row">
                      <div
                        className="search-user-avatar clickable"
                        onClick={() => navigate(`/profile/${u.id}`)}
                      >
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.name} />
                        ) : (
                          <span>{u.name?.slice(0, 2).toUpperCase() || 'M'}</span>
                        )}
                      </div>
                      <div className="search-user-info">
                        <h4
                          className="clickable"
                          onClick={() => navigate(`/profile/${u.id}`)}
                        >
                          {u.name}
                        </h4>
                        <p>{u.headline || u.title || 'Professional Member'}</p>
                        <small className="text-muted">
                          {u.company ? `🏢 ${u.company}` : ''} {u.location ? `• 📍 ${u.location}` : ''}
                        </small>
                      </div>
                      <div className="search-user-actions">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={connectedMap[u.id]}
                          onClick={() => handleConnect(u)}
                        >
                          {connectedMap[u.id] ? 'Pending' : 'Connect'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Jobs Section */}
          {(filter === 'ALL' || filter === 'JOBS') && (
            <div className="card search-section-card">
              <div className="section-header">
                <h3>Jobs ({jobs.length})</h3>
              </div>
              {jobs.length === 0 ? (
                <div className="empty-sub-state">No job opportunities found.</div>
              ) : (
                <div className="search-jobs-list">
                  {jobs.map(j => (
                    <div
                      key={j.id}
                      className="search-job-row clickable"
                      onClick={() => navigate(`/jobs`)}
                    >
                      <div className="search-job-icon">
                        <Briefcase size={22} />
                      </div>
                      <div className="search-job-info">
                        <h4>{j.title}</h4>
                        <p>{j.company} • {j.location} ({j.jobType})</p>
                        <span className="salary-pill">{j.salaryRange}</span>
                      </div>
                      <button type="button" className="btn btn-outline btn-sm">
                        View Role
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Posts Section */}
          {(filter === 'ALL' || filter === 'POSTS') && (
            <div className="card search-section-card">
              <div className="section-header">
                <h3>Posts ({posts.length})</h3>
              </div>
              {posts.length === 0 ? (
                <div className="empty-sub-state">No posts matched your query.</div>
              ) : (
                <div className="search-posts-list">
                  {posts.map(p => (
                    <div
                      key={p.id}
                      className="search-post-row clickable"
                      onClick={() => navigate(`/feed`)}
                    >
                      <strong>{p.authorName}</strong>
                      <p className="search-post-snippet">{p.content}</p>
                      <div className="text-muted">
                        <small>👍 {p.likesCount || 0} • 💬 {p.commentsCount || 0}</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
