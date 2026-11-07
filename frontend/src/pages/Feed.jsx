import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getAllPosts,
  createPost,
  toggleLike,
  addComment,
  getComments,
  toggleSavePost,
  deletePost
} from '../api/posts';
import { getSuggestions, getUserProfile } from '../api/users';
import { sendConnectionRequest, followUser } from '../api/connections';
import {
  Image as ImageIcon,
  Video,
  FileText,
  Send,
  ThumbsUp,
  MessageSquare,
  Share2,
  Bookmark,
  Trash2,
  MoreHorizontal,
  Plus,
  Check,
  TrendingUp,
  Briefcase,
  ExternalLink,
  Sparkles,
  X
} from 'lucide-react';

function timeAgo(ts) {
  if (!ts) return 'just now';
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

export default function Feed() {
  const { user, userProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, NETWORK, TRENDING, SAVED
  const [error, setError] = useState('');

  // Post modal / form state
  const [showModal, setShowModal] = useState(false);
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [mediaType, setMediaType] = useState('TEXT');
  const [submitting, setSubmitting] = useState(false);

  // Expanded comments & loading per post
  const [expandedComments, setExpandedComments] = useState({});
  const [commentsMap, setCommentsMap] = useState({});
  const [commentInput, setCommentInput] = useState({});

  // Suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [connectedMap, setConnectedMap] = useState({});

  const loadFeed = async () => {
    try {
      const data = await getAllPosts(user?.id);
      setPosts(data || []);
    } catch (err) {
      setError('Could not refresh feed.');
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = async () => {
    try {
      const list = await getSuggestions(user?.id);
      setSuggestions(list.slice(0, 4));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadFeed();
    loadSuggestions();
  }, [user?.id]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await createPost(
        user.id,
        user.name,
        content.trim(),
        user.headline || userProfile?.headline || user.title || 'Professional Member',
        user.avatarUrl || userProfile?.avatarUrl || '',
        imageUrl.trim(),
        imageUrl.trim() ? 'IMAGE' : 'TEXT'
      );
      setContent('');
      setImageUrl('');
      setShowModal(false);
      await loadFeed();
    } catch (err) {
      alert('Failed to publish post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLike = async (postId) => {
    try {
      const res = await toggleLike(
        postId,
        user.id,
        user.name,
        user.avatarUrl || userProfile?.avatarUrl || ''
      );
      setPosts(prev =>
        prev.map(p =>
          p.id === postId
            ? { ...p, likedByMe: res.liked, likesCount: res.likesCount }
            : p
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSave = async (postId) => {
    try {
      const res = await toggleSavePost(postId, user.id);
      setPosts(prev =>
        prev.map(p => (p.id === postId ? { ...p, savedByMe: res.saved } : p))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      alert('Could not delete post');
    }
  };

  const toggleComments = async (postId) => {
    const isExpanded = !!expandedComments[postId];
    setExpandedComments(prev => ({ ...prev, [postId]: !isExpanded }));

    if (!isExpanded && !commentsMap[postId]) {
      try {
        const comments = await getComments(postId);
        setCommentsMap(prev => ({ ...prev, [postId]: comments || [] }));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAddComment = async (postId) => {
    const text = commentInput[postId];
    if (!text || !text.trim()) return;

    try {
      const newComment = await addComment(
        postId,
        user.id,
        user.name,
        user.headline || userProfile?.headline || '',
        user.avatarUrl || userProfile?.avatarUrl || '',
        text.trim()
      );
      setCommentsMap(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment]
      }));
      setPosts(prev =>
        prev.map(p =>
          p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p
        )
      );
      setCommentInput(prev => ({ ...prev, [postId]: '' }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickConnect = async (targetUser) => {
    try {
      await sendConnectionRequest(
        user.id,
        targetUser.id,
        user.name,
        targetUser.name
      );
      setConnectedMap(prev => ({ ...prev, [targetUser.id]: true }));
    } catch (err) {
      console.error(err);
    }
  };

  // Filter posts
  const filteredPosts = posts.filter(p => {
    if (activeTab === 'SAVED') return p.savedByMe;
    if (activeTab === 'TRENDING') return (p.likesCount || 0) > 0 || (p.commentsCount || 0) > 0;
    return true;
  });

  const avatar = user?.avatarUrl || userProfile?.avatarUrl;
  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : 'U';

  return (
    <div className="feed-layout">
      {/* ──────────────── Left Column: Profile Card & Shortcuts ──────────────── */}
      <aside className="feed-col-left">
        <div className="card mini-profile-card">
          <div
            className="mini-card-cover"
            style={{
              backgroundImage: userProfile?.coverUrl
                ? `url(${userProfile.coverUrl})`
                : 'linear-gradient(135deg, #0a66c2 0%, #004182 100%)'
            }}
          />
          <div className="mini-card-avatar-wrap">
            <div className="mini-card-avatar">
              {avatar ? (
                <img src={avatar} alt={user?.name} />
              ) : (
                <span>{initials}</span>
              )}
            </div>
          </div>
          <div className="mini-card-body">
            <h3
              className="mini-card-name"
              onClick={() => navigate(`/profile/${user?.id}`)}
            >
              {user?.name || 'Professional Member'}
            </h3>
            <p className="mini-card-headline">
              {user?.headline || userProfile?.headline || user?.title || 'LinkedIn Member'}
            </p>
          </div>

          <div className="mini-card-stats">
            <div
              className="stat-row clickable"
              onClick={() => navigate('/connections')}
            >
              <span className="stat-label">Connections</span>
              <span className="stat-value">{userProfile?.connectionsCount || 0}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Profile viewers</span>
              <span className="stat-value text-accent">142</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Post impressions</span>
              <span className="stat-value text-accent">1,209</span>
            </div>
          </div>

          <div className="mini-card-footer">
            <NavLink to="/jobs?tab=saved" className="mini-card-link">
              <Bookmark size={15} />
              <span>My Saved Items</span>
            </NavLink>
          </div>
        </div>

        {/* Community & Shortcuts widget */}
        <div className="card shortcuts-card">
          <div className="shortcuts-title">Recent Community</div>
          <div className="shortcuts-item"># softwareengineering</div>
          <div className="shortcuts-item"># distributed-systems</div>
          <div className="shortcuts-item"># webdevelopment</div>
          <div className="shortcuts-item"># springboot</div>
          <div className="shortcuts-item"># systemdesign</div>
        </div>
      </aside>

      {/* ──────────────── Center Column: Post Composer & Feed ──────────────── */}
      <main className="feed-col-center">
        {/* Post Composer Card */}
        <div className="card composer-card">
          <div className="composer-top">
            <div className="composer-avatar">
              {avatar ? <img src={avatar} alt={user?.name} /> : <span>{initials}</span>}
            </div>
            <button
              type="button"
              className="composer-trigger-btn"
              onClick={() => setShowModal(true)}
            >
              Start a post, share an achievement or insight...
            </button>
          </div>

          <div className="composer-actions">
            <button
              type="button"
              className="composer-action-btn"
              onClick={() => {
                setMediaType('IMAGE');
                setShowModal(true);
              }}
            >
              <ImageIcon size={18} className="text-blue" />
              <span>Media</span>
            </button>

            <button
              type="button"
              className="composer-action-btn"
              onClick={() => navigate('/jobs?post=true')}
            >
              <Briefcase size={18} className="text-purple" />
              <span>Job</span>
            </button>

            <button
              type="button"
              className="composer-action-btn"
              onClick={() => {
                setMediaType('DOCUMENT');
                setShowModal(true);
              }}
            >
              <FileText size={18} className="text-orange" />
              <span>Article</span>
            </button>
          </div>
        </div>

        {/* Feed Tab Filters */}
        <div className="feed-tabs">
          <button
            type="button"
            className={`feed-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveTab('ALL')}
          >
            All Posts
          </button>
          <button
            type="button"
            className={`feed-tab-btn ${activeTab === 'TRENDING' ? 'active' : ''}`}
            onClick={() => setActiveTab('TRENDING')}
          >
            <TrendingUp size={14} />
            <span>Trending</span>
          </button>
          <button
            type="button"
            className={`feed-tab-btn ${activeTab === 'SAVED' ? 'active' : ''}`}
            onClick={() => setActiveTab('SAVED')}
          >
            <Bookmark size={14} />
            <span>Saved</span>
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {/* Posts List */}
        {loading ? (
          <div className="feed-loading">
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="card empty-feed-card">
            <Sparkles size={36} className="text-muted" />
            <h3>No posts found in this view</h3>
            <p>Share your ideas with your professional network or explore recommendations.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              Start a Post
            </button>
          </div>
        ) : (
          filteredPosts.map(post => {
            const isMine = String(post.authorId) === String(user?.id);
            const comments = commentsMap[post.id] || [];
            const isCommentsOpen = !!expandedComments[post.id];

            return (
              <article key={post.id} className="card post-card">
                {/* Post Header */}
                <div className="post-header">
                  <div
                    className="post-author-block"
                    onClick={() => navigate(`/profile/${post.authorId}`)}
                  >
                    <div className="post-avatar">
                      {post.authorAvatar ? (
                        <img src={post.authorAvatar} alt={post.authorName} />
                      ) : (
                        <span>{post.authorName?.slice(0, 2).toUpperCase() || 'M'}</span>
                      )}
                    </div>
                    <div className="post-author-meta">
                      <h4 className="post-author-name">{post.authorName}</h4>
                      <p className="post-author-headline">
                        {post.authorHeadline || 'Professional Member'}
                      </p>
                      <span className="post-timestamp">
                        {timeAgo(post.createdAt)} • 🌐
                      </span>
                    </div>
                  </div>

                  <div className="post-menu-actions">
                    <button
                      type="button"
                      className={`btn-icon ${post.savedByMe ? 'text-accent' : ''}`}
                      title="Save Post"
                      onClick={() => handleToggleSave(post.id)}
                    >
                      <Bookmark size={17} fill={post.savedByMe ? 'currentColor' : 'none'} />
                    </button>
                    {isMine && (
                      <button
                        type="button"
                        className="btn-icon text-danger"
                        title="Delete Post"
                        onClick={() => handleDeletePost(post.id)}
                      >
                        <Trash2 size={17} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Post Body Content */}
                <div className="post-content-wrap">
                  <p className="post-text">{post.content}</p>
                  {post.imageUrl && (
                    <div className="post-image-container">
                      <img src={post.imageUrl} alt="Post attachment" />
                    </div>
                  )}
                </div>

                {/* Post Stats Counters */}
                <div className="post-stats-row">
                  <div className="post-likes-badge">
                    <span className="like-icon-circle">👍</span>
                    <span>{post.likesCount || 0}</span>
                  </div>
                  <div className="post-comments-count">
                    <span onClick={() => toggleComments(post.id)}>
                      {post.commentsCount || 0} comments
                    </span>
                  </div>
                </div>

                {/* Post Action Buttons */}
                <div className="post-action-bar">
                  <button
                    type="button"
                    className={`action-bar-btn ${post.likedByMe ? 'active' : ''}`}
                    onClick={() => handleToggleLike(post.id)}
                  >
                    <ThumbsUp size={18} fill={post.likedByMe ? 'currentColor' : 'none'} />
                    <span>Like</span>
                  </button>

                  <button
                    type="button"
                    className={`action-bar-btn ${isCommentsOpen ? 'active' : ''}`}
                    onClick={() => toggleComments(post.id)}
                  >
                    <MessageSquare size={18} />
                    <span>Comment</span>
                  </button>

                  <button
                    type="button"
                    className="action-bar-btn"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(window.location.origin + `/feed`);
                        alert('Link copied to clipboard!');
                      }
                    }}
                  >
                    <Share2 size={18} />
                    <span>Share</span>
                  </button>
                </div>

                {/* Expandable Comments Section */}
                {isCommentsOpen && (
                  <div className="post-comments-section">
                    <div className="comment-composer">
                      <div className="comment-composer-avatar">
                        {avatar ? <img src={avatar} alt={user?.name} /> : <span>{initials}</span>}
                      </div>
                      <div className="comment-composer-input-wrap">
                        <input
                          type="text"
                          placeholder="Add a comment or thought..."
                          value={commentInput[post.id] || ''}
                          onChange={e =>
                            setCommentInput({ ...commentInput, [post.id]: e.target.value })
                          }
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleAddComment(post.id);
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={!commentInput[post.id]?.trim()}
                          onClick={() => handleAddComment(post.id)}
                        >
                          <Send size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="comments-list">
                      {comments.map(c => (
                        <div key={c.id} className="comment-item">
                          <div className="comment-avatar">
                            {c.authorAvatar ? (
                              <img src={c.authorAvatar} alt={c.authorName} />
                            ) : (
                              <span>{c.authorName?.slice(0, 2).toUpperCase() || 'M'}</span>
                            )}
                          </div>
                          <div className="comment-bubble">
                            <div className="comment-meta">
                              <strong>{c.authorName}</strong>
                              <small>{timeAgo(c.createdAt)}</small>
                            </div>
                            <div className="comment-headline">
                              {c.authorHeadline || 'Professional Member'}
                            </div>
                            <p className="comment-text">{c.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </main>

      {/* ──────────────── Right Column: Recommendations & News ──────────────── */}
      <aside className="feed-col-right">
        {/* Suggested Connections Widget */}
        <div className="card side-widget">
          <div className="widget-header">
            <h4>Add to your feed</h4>
          </div>
          <div className="suggestions-list">
            {suggestions.map(s => (
              <div key={s.id} className="suggestion-item">
                <div
                  className="suggestion-avatar clickable"
                  onClick={() => navigate(`/profile/${s.id}`)}
                >
                  {s.avatarUrl ? (
                    <img src={s.avatarUrl} alt={s.name} />
                  ) : (
                    <span>{s.name?.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div className="suggestion-info">
                  <h5
                    className="clickable"
                    onClick={() => navigate(`/profile/${s.id}`)}
                  >
                    {s.name}
                  </h5>
                  <p>{s.headline || s.title || s.company || 'Professional Member'}</p>
                  <button
                    type="button"
                    className={`btn btn-sm ${connectedMap[s.id] ? 'btn-outline' : 'btn-ghost-primary'}`}
                    disabled={connectedMap[s.id]}
                    onClick={() => handleQuickConnect(s)}
                  >
                    {connectedMap[s.id] ? (
                      <>
                        <Check size={14} />
                        <span>Pending</span>
                      </>
                    ) : (
                      <>
                        <Plus size={14} />
                        <span>Connect</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nodework News Widget */}
        <div className="card side-widget">
          <div className="widget-header">
            <h4>Nodework News & Discussions</h4>
          </div>
          <ul className="news-list">
            <li>
              <div className="news-headline">Distributed systems scale up</div>
              <div className="news-sub">4h ago • 14,890 readers</div>
            </li>
            <li>
              <div className="news-headline">AI Agents reshape product roadmaps</div>
              <div className="news-sub">6h ago • 22,410 readers</div>
            </li>
            <li>
              <div className="news-headline">Tech talent market updates Q4</div>
              <div className="news-sub">1d ago • 8,950 readers</div>
            </li>
            <li>
              <div className="news-headline">Remote & hybrid engineer salaries</div>
              <div className="news-sub">2d ago • 34,100 readers</div>
            </li>
          </ul>
        </div>
      </aside>

      {/* ──────────────── Create Post Modal ──────────────── */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content post-modal">
            <div className="modal-header">
              <h3>Create a post</h3>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePost}>
              <div className="modal-body">
                <div className="modal-author-row">
                  <div className="composer-avatar">
                    {avatar ? <img src={avatar} alt={user?.name} /> : <span>{initials}</span>}
                  </div>
                  <div>
                    <strong>{user?.name}</strong>
                    <div className="badge-pill">🌐 Anyone on Nodework</div>
                  </div>
                </div>

                <textarea
                  rows={5}
                  className="modal-textarea"
                  placeholder="What do you want to talk about? Share an insight, project milestone, or question..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  autoFocus
                />

                <div className="modal-attachment-row">
                  <label>Add Image or Media URL (Optional):</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                  />
                  {imageUrl.trim() && (
                    <div className="image-preview">
                      <img src={imageUrl.trim()} alt="Preview" />
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <div className="modal-footer-tools">
                  <button
                    type="button"
                    className="btn-icon"
                    title="Insert image URL"
                    onClick={() => {
                      const url = prompt('Enter public image URL:');
                      if (url) setImageUrl(url);
                    }}
                  >
                    <ImageIcon size={20} />
                  </button>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || !content.trim()}
                >
                  {submitting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
