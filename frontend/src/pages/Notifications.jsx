import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '../api/notifications';
import {
  Bell,
  ThumbsUp,
  MessageSquare,
  UserPlus,
  CheckCircle2,
  Check,
  Sparkles
} from 'lucide-react';

function timeAgo(ts) {
  if (!ts) return 'just now';
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function Notifications() {
  const { user, refreshUnreadCounts } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('ALL'); // ALL, UNREAD
  const [loading, setLoading] = useState(true);

  const loadNotifs = async () => {
    if (!user?.id) return;
    try {
      const data = await getNotifications(user.id);
      setNotifications(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifs();
  }, [user?.id]);

  const handleMarkRead = async (n) => {
    if (n.isRead) return;
    try {
      await markNotificationRead(n.id);
      setNotifications(prev =>
        prev.map(item => (item.id === n.id ? { ...item, isRead: true } : item))
      );
      refreshUnreadCounts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(user.id);
      setNotifications(prev => prev.map(item => ({ ...item, isRead: true })));
      refreshUnreadCounts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotifClick = (n) => {
    handleMarkRead(n);
    if (n.type === 'MESSAGE' && n.referenceId) {
      navigate(`/messaging?convId=${n.referenceId}`);
    } else if (n.type === 'CONNECTION_REQUEST' || n.type === 'CONNECTION_ACCEPTED') {
      navigate(`/connections`);
    } else if (n.actorId) {
      navigate(`/profile/${n.actorId}`);
    } else {
      navigate('/feed');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'POST_LIKE':
        return <ThumbsUp size={16} className="notif-icon-like" />;
      case 'POST_COMMENT':
      case 'MESSAGE':
        return <MessageSquare size={16} className="notif-icon-comment" />;
      case 'CONNECTION_REQUEST':
        return <UserPlus size={16} className="notif-icon-connect" />;
      case 'CONNECTION_ACCEPTED':
        return <CheckCircle2 size={16} className="notif-icon-accept" />;
      default:
        return <Bell size={16} className="notif-icon-default" />;
    }
  };

  const filtered = notifications.filter(n => {
    if (filter === 'UNREAD') return !n.isRead;
    return true;
  });

  return (
    <div className="notifications-container">
      <div className="card notifications-card">
        <div className="notifications-header">
          <div className="notifications-title-wrap">
            <h2>Notifications</h2>
            <div className="notif-filters">
              <button
                type="button"
                className={`notif-filter-pill ${filter === 'ALL' ? 'active' : ''}`}
                onClick={() => setFilter('ALL')}
              >
                All
              </button>
              <button
                type="button"
                className={`notif-filter-pill ${filter === 'UNREAD' ? 'active' : ''}`}
                onClick={() => setFilter('UNREAD')}
              >
                Unread
              </button>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleMarkAllRead}
          >
            <Check size={14} />
            <span>Mark all as read</span>
          </button>
        </div>

        <div className="notifications-list">
          {loading ? (
            <div className="skeleton-card" style={{ height: 180 }} />
          ) : filtered.length === 0 ? (
            <div className="empty-sub-state">
              <Sparkles size={32} className="text-muted" />
              <p>No notifications right now. Check back as your network grows!</p>
            </div>
          ) : (
            filtered.map(n => (
              <div
                key={n.id}
                className={`notification-item ${!n.isRead ? 'unread' : ''}`}
                onClick={() => handleNotifClick(n)}
              >
                <div className="notification-avatar-wrap">
                  <div className="notification-avatar">
                    {n.actorAvatar ? (
                      <img src={n.actorAvatar} alt={n.actorName} />
                    ) : (
                      <span>{n.actorName?.slice(0, 2).toUpperCase() || 'N'}</span>
                    )}
                  </div>
                  <div className="notification-type-badge">{getIcon(n.type)}</div>
                </div>

                <div className="notification-content">
                  <p className="notification-text">
                    <strong>{n.actorName || 'A member'}</strong> {n.message || n.title}
                  </p>
                  <small className="notification-time">{timeAgo(n.createdAt)}</small>
                </div>

                {!n.isRead && <span className="notification-unread-dot" />}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
