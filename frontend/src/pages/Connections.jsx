import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getAcceptedConnections,
  getPendingInvitations,
  getSentInvitations,
  acceptConnectionRequest,
  rejectConnectionRequest,
  withdrawConnectionRequest,
  removeConnection,
  sendConnectionRequest,
  followUser
} from '../api/connections';
import { getSuggestions } from '../api/users';
import {
  Users,
  UserCheck,
  UserPlus,
  Send,
  MessageSquare,
  Trash2,
  Check,
  X,
  Search,
  Sparkles
} from 'lucide-react';

export default function Connections() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('INVITES'); // INVITES, CONNECTIONS, DISCOVER
  const [connections, setConnections] = useState([]);
  const [pendingReceived, setPendingReceived] = useState([]);
  const [pendingSent, setPendingSent] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState({});

  const loadData = async () => {
    if (!user?.id) return;
    try {
      const [connsRes, pendingRes, sentRes, suggRes] = await Promise.all([
        getAcceptedConnections(user.id),
        getPendingInvitations(user.id),
        getSentInvitations(user.id),
        getSuggestions(user.id)
      ]);

      setConnections(connsRes.connections || []);
      setPendingReceived(pendingRes || []);
      setPendingSent(sentRes || []);
      setSuggestions(suggRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const handleAccept = async (invitation) => {
    try {
      await acceptConnectionRequest(invitation.requesterId, user.id);
      setActionStatus(prev => ({ ...prev, [invitation.id]: 'ACCEPTED' }));
      await loadData();
    } catch (err) {
      alert('Could not accept request');
    }
  };

  const handleReject = async (invitation) => {
    try {
      await rejectConnectionRequest(invitation.requesterId, user.id);
      setPendingReceived(prev => prev.filter(p => p.id !== invitation.id));
    } catch (err) {
      alert('Could not reject request');
    }
  };

  const handleWithdraw = async (invitation) => {
    try {
      await withdrawConnectionRequest(user.id, invitation.receiverId);
      setPendingSent(prev => prev.filter(p => p.id !== invitation.id));
    } catch (err) {
      alert('Could not withdraw request');
    }
  };

  const handleRemove = async (conn) => {
    if (!window.confirm(`Remove connection with ${conn.name}?`)) return;
    try {
      await removeConnection(user.id, conn.userId);
      setConnections(prev => prev.filter(c => c.connectionId !== conn.connectionId));
    } catch (err) {
      alert('Could not remove connection');
    }
  };

  const handleConnect = async (targetUser) => {
    try {
      await sendConnectionRequest(user.id, targetUser.id, user.name, targetUser.name);
      setActionStatus(prev => ({ ...prev, [targetUser.id]: 'SENT' }));
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredConnections = connections.filter(c =>
    (c.name || '').toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="network-page-container">
      {/* Top Network Stats Bar */}
      <div className="card network-stats-card">
        <div className="network-stat-item">
          <div className="stat-num">{connections.length}</div>
          <div className="stat-label">Connections</div>
        </div>
        <div className="network-stat-divider" />
        <div className="network-stat-item">
          <div className="stat-num">{pendingReceived.length}</div>
          <div className="stat-label">Pending Invitations</div>
        </div>
        <div className="network-stat-divider" />
        <div className="network-stat-item">
          <div className="stat-num">{pendingSent.length}</div>
          <div className="stat-label">Sent Requests</div>
        </div>
      </div>

      {/* Network Tabs */}
      <div className="network-tabs-row">
        <button
          type="button"
          className={`network-tab-btn ${activeTab === 'INVITES' ? 'active' : ''}`}
          onClick={() => setActiveTab('INVITES')}
        >
          <span>Invitations</span>
          {(pendingReceived.length > 0 || pendingSent.length > 0) && (
            <span className="tab-badge">{pendingReceived.length + pendingSent.length}</span>
          )}
        </button>

        <button
          type="button"
          className={`network-tab-btn ${activeTab === 'CONNECTIONS' ? 'active' : ''}`}
          onClick={() => setActiveTab('CONNECTIONS')}
        >
          <span>My Connections ({connections.length})</span>
        </button>

        <button
          type="button"
          className={`network-tab-btn ${activeTab === 'DISCOVER' ? 'active' : ''}`}
          onClick={() => setActiveTab('DISCOVER')}
        >
          <Sparkles size={16} />
          <span>People You May Know</span>
        </button>
      </div>

      {/* ──────────────── TAB 1: INVITATIONS ──────────────── */}
      {activeTab === 'INVITES' && (
        <div className="invitations-section">
          {/* Received Requests */}
          <div className="card section-card">
            <div className="section-header">
              <h3>Invitations Received ({pendingReceived.length})</h3>
            </div>
            {pendingReceived.length === 0 ? (
              <div className="empty-sub-state">No pending incoming invitations.</div>
            ) : (
              <div className="invitations-list">
                {pendingReceived.map(inv => (
                  <div key={inv.id} className="invitation-row">
                    <div
                      className="invitation-avatar clickable"
                      onClick={() => navigate(`/profile/${inv.requesterId}`)}
                    >
                      <span>{inv.requesterName?.slice(0, 2).toUpperCase() || 'M'}</span>
                    </div>
                    <div className="invitation-info">
                      <h4
                        className="clickable"
                        onClick={() => navigate(`/profile/${inv.requesterId}`)}
                      >
                        {inv.requesterName}
                      </h4>
                      <p>Wants to connect with you</p>
                    </div>
                    <div className="invitation-actions">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleAccept(inv)}
                      >
                        <Check size={16} />
                        <span>Accept</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => handleReject(inv)}
                      >
                        <X size={16} />
                        <span>Ignore</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sent Requests */}
          <div className="card section-card" style={{ marginTop: 20 }}>
            <div className="section-header">
              <h3>Sent Invitations Pending ({pendingSent.length})</h3>
            </div>
            {pendingSent.length === 0 ? (
              <div className="empty-sub-state">No sent invitations pending.</div>
            ) : (
              <div className="invitations-list">
                {pendingSent.map(inv => (
                  <div key={inv.id} className="invitation-row">
                    <div className="invitation-avatar">
                      <span>{inv.receiverName?.slice(0, 2).toUpperCase() || 'M'}</span>
                    </div>
                    <div className="invitation-info">
                      <h4>{inv.receiverName}</h4>
                      <p>Invitation sent</p>
                    </div>
                    <div className="invitation-actions">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => handleWithdraw(inv)}
                      >
                        Withdraw
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ──────────────── TAB 2: MY CONNECTIONS ──────────────── */}
      {activeTab === 'CONNECTIONS' && (
        <div className="card section-card">
          <div className="connections-search-bar">
            <Search size={18} className="text-muted" />
            <input
              type="text"
              placeholder="Search your connections by name..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
            />
          </div>

          {filteredConnections.length === 0 ? (
            <div className="empty-sub-state">
              {searchFilter
                ? `No connections matching "${searchFilter}"`
                : 'You have no connections yet. Discover professionals below!'}
            </div>
          ) : (
            <div className="connections-grid">
              {filteredConnections.map(c => (
                <div key={c.connectionId} className="connection-card">
                  <div
                    className="connection-avatar clickable"
                    onClick={() => navigate(`/profile/${c.userId}`)}
                  >
                    <span>{c.name?.slice(0, 2).toUpperCase() || 'M'}</span>
                  </div>
                  <div className="connection-body">
                    <h4
                      className="clickable"
                      onClick={() => navigate(`/profile/${c.userId}`)}
                    >
                      {c.name}
                    </h4>
                    <span className="badge-connected">1st</span>
                  </div>
                  <div className="connection-actions">
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => navigate(`/messaging?userId=${c.userId}`)}
                    >
                      <MessageSquare size={14} />
                      <span>Message</span>
                    </button>
                    <button
                      type="button"
                      className="btn-icon text-muted"
                      title="Remove Connection"
                      onClick={() => handleRemove(c)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ──────────────── TAB 3: DISCOVER PROFESSIONALS ──────────────── */}
      {activeTab === 'DISCOVER' && (
        <div className="card section-card">
          <div className="section-header">
            <h3>People You May Know</h3>
            <p>Expand your network with industry colleagues and alumni</p>
          </div>

          <div className="discover-grid">
            {suggestions.map(s => {
              const isSent = actionStatus[s.id] === 'SENT';
              const avatar = s.avatarUrl;
              const initials = s.name ? s.name.slice(0, 2).toUpperCase() : 'M';

              return (
                <div key={s.id} className="discover-card">
                  <div
                    className="discover-cover"
                    style={{
                      backgroundImage: s.coverUrl
                        ? `url(${s.coverUrl})`
                        : 'linear-gradient(135deg, #0a66c2 0%, #004182 100%)'
                    }}
                  />
                  <div
                    className="discover-avatar-wrap clickable"
                    onClick={() => navigate(`/profile/${s.id}`)}
                  >
                    <div className="discover-avatar">
                      {avatar ? <img src={avatar} alt={s.name} /> : <span>{initials}</span>}
                    </div>
                  </div>
                  <div className="discover-body">
                    <h4
                      className="clickable"
                      onClick={() => navigate(`/profile/${s.id}`)}
                    >
                      {s.name}
                    </h4>
                    <p className="discover-headline">
                      {s.headline || s.title || s.company || 'Professional Member'}
                    </p>
                    <small className="discover-meta">
                      {s.company ? `🏢 ${s.company}` : s.location ? `📍 ${s.location}` : 'Nodework Member'}
                    </small>
                  </div>

                  <div className="discover-footer">
                    <button
                      type="button"
                      className={`btn btn-sm ${isSent ? 'btn-outline' : 'btn-primary'}`}
                      disabled={isSent}
                      onClick={() => handleConnect(s)}
                    >
                      {isSent ? (
                        <>
                          <Check size={14} />
                          <span>Pending</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={14} />
                          <span>Connect</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
