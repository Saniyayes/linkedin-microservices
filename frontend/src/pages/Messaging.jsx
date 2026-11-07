import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markMessagesRead
} from '../api/chat';
import { getUserProfile } from '../api/users';
import {
  MessageSquare,
  Send,
  Search,
  User as UserIcon,
  Circle,
  Clock,
  Sparkles
} from 'lucide-react';

export default function Messaging() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const targetUserId = searchParams.get('userId');

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    if (!user?.id) return;
    try {
      const list = await getConversations(user.id);
      setConversations(list || []);

      // If a userId was passed in query param, open or create conversation with them
      if (targetUserId && String(targetUserId) !== String(user.id)) {
        const existing = list?.find(
          c => String(c.user1Id) === String(targetUserId) || String(c.user2Id) === String(targetUserId)
        );
        if (existing) {
          setActiveConv(existing);
        } else {
          // Fetch target user info and create conversation
          const otherUser = await getUserProfile(targetUserId);
          if (otherUser) {
            const created = await getOrCreateConversation(
              user.id,
              otherUser.id,
              user.name,
              otherUser.name,
              user.avatarUrl || '',
              otherUser.avatarUrl || ''
            );
            setActiveConv(created);
            setConversations(prev => [created, ...(prev || [])]);
          }
        }
      } else if (!activeConv && list && list.length > 0) {
        setActiveConv(list[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId) => {
    if (!convId) return;
    try {
      const msgs = await getMessages(convId);
      setMessages(msgs || []);
      scrollToBottom();
      // Mark read
      if (user?.id) {
        markMessagesRead(convId, user.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [user?.id, targetUserId]);

  useEffect(() => {
    if (activeConv?.id) {
      loadMessages(activeConv.id);
      const interval = setInterval(() => loadMessages(activeConv.id), 4000);
      return () => clearInterval(interval);
    }
  }, [activeConv?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv) return;

    const otherUserId = String(activeConv.user1Id) === String(user.id)
      ? activeConv.user2Id
      : activeConv.user1Id;

    try {
      const msg = await sendMessage(
        activeConv.id,
        user.id,
        user.name,
        user.avatarUrl || '',
        otherUserId,
        newMessage.trim()
      );
      setMessages(prev => [...prev, msg]);
      setNewMessage('');
      scrollToBottom();
      loadConversations();
    } catch (err) {
      alert('Could not deliver message');
    }
  };

  const filteredConversations = conversations.filter(c => {
    const otherName = String(c.user1Id) === String(user?.id) ? c.user2Name : c.user1Name;
    return (otherName || '').toLowerCase().includes(searchFilter.toLowerCase());
  });

  return (
    <div className="messaging-container">
      <div className="messaging-card">
        {/* Left: Conversations list pane */}
        <aside className="messaging-sidebar">
          <div className="messaging-sidebar-header">
            <h3>Messaging</h3>
            <div className="messaging-search-wrap">
              <Search size={16} className="text-muted" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="conversations-scroll-list">
            {loading ? (
              <div className="empty-sub-state">Loading chats...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="empty-sub-state">
                {searchFilter ? 'No matching chats' : 'No messages yet. Connect with professionals to chat!'}
              </div>
            ) : (
              filteredConversations.map(c => {
                const isSelected = activeConv?.id === c.id;
                const otherName = String(c.user1Id) === String(user?.id) ? c.user2Name : c.user1Name;
                const otherAvatar = String(c.user1Id) === String(user?.id) ? c.user2Avatar : c.user1Avatar;
                const unreadCount = String(c.user1Id) === String(user?.id) ? c.user1UnreadCount : c.user2UnreadCount;

                return (
                  <div
                    key={c.id}
                    className={`conversation-item ${isSelected ? 'active' : ''}`}
                    onClick={() => setActiveConv(c)}
                  >
                    <div className="conversation-avatar">
                      {otherAvatar ? (
                        <img src={otherAvatar} alt={otherName} />
                      ) : (
                        <span>{otherName?.slice(0, 2).toUpperCase() || 'M'}</span>
                      )}
                    </div>
                    <div className="conversation-info">
                      <div className="conversation-top-row">
                        <strong className="conversation-name">{otherName}</strong>
                        <small className="conversation-time">
                          {c.lastMessageTime
                            ? new Date(c.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : ''}
                        </small>
                      </div>
                      <p className="conversation-snippet">{c.lastMessage || 'Start a conversation'}</p>
                    </div>
                    {unreadCount > 0 && (
                      <span className="unread-dot">{unreadCount}</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right: Active chat window */}
        <main className="messaging-chat-pane">
          {activeConv ? (
            <>
              {/* Chat Header */}
              {(() => {
                const otherName = String(activeConv.user1Id) === String(user?.id) ? activeConv.user2Name : activeConv.user1Name;
                const otherId = String(activeConv.user1Id) === String(user?.id) ? activeConv.user2Id : activeConv.user1Id;
                const otherAvatar = String(activeConv.user1Id) === String(user?.id) ? activeConv.user2Avatar : activeConv.user1Avatar;

                return (
                  <div className="chat-header">
                    <div
                      className="chat-header-user clickable"
                      onClick={() => navigate(`/profile/${otherId}`)}
                    >
                      <div className="chat-header-avatar">
                        {otherAvatar ? (
                          <img src={otherAvatar} alt={otherName} />
                        ) : (
                          <span>{otherName?.slice(0, 2).toUpperCase() || 'M'}</span>
                        )}
                      </div>
                      <div>
                        <h4>{otherName}</h4>
                        <small className="text-muted">Available on Nodework</small>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Chat Thread */}
              <div className="chat-messages-wrap">
                {messages.length === 0 ? (
                  <div className="empty-sub-state">
                    <Sparkles size={28} className="text-muted" />
                    <p>No messages yet in this conversation. Say hello!</p>
                  </div>
                ) : (
                  messages.map(m => {
                    const isMine = String(m.senderId) === String(user?.id);
                    return (
                      <div
                        key={m.id}
                        className={`message-bubble-row ${isMine ? 'mine' : 'theirs'}`}
                      >
                        <div className="message-bubble">
                          <p>{m.content}</p>
                          <small className="message-time">
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </small>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Send Box */}
              <form onSubmit={handleSendMessage} className="chat-send-form">
                <input
                  type="text"
                  placeholder="Write a message..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!newMessage.trim()}
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="empty-chat-welcome">
              <MessageSquare size={48} className="text-muted" />
              <h3>Your Messages</h3>
              <p>Send private messages to colleagues, recruiters, and network connections.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
