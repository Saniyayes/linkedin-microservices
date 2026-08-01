import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllPosts, createPost } from '../api/posts';

function timeAgo(ts) {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setPosts(await getAllPosts());
    } catch {
      setError('Could not load the feed right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    try {
      await createPost(user.id, user.name, content.trim());
      setContent('');
      await load();
    } catch {
      setError('Could not publish that post.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div>
      <form className="card post-composer" onSubmit={handlePost}>
        <textarea rows={3} placeholder="Share something with your network…" value={content} onChange={(e) => setContent(e.target.value)} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button type="submit" className="btn-primary" disabled={posting || !content.trim()}>
            {posting ? 'Posting…' : 'Post'}
          </button>
        </div>
      </form>

      {error && <div className="error-banner" style={{ marginBottom: 14 }}>{error}</div>}

      {loading ? (
        <div className="spinner-row">Loading the feed…</div>
      ) : posts.length === 0 ? (
        <div className="card empty-state">No posts yet — be the first to share something.</div>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="card post-card">
            <div className="post-meta">
              <span className="post-author">{post.authorName}</span>
              <span className="post-time">{timeAgo(post.createdAt)}</span>
            </div>
            <p className="post-content">{post.content}</p>
            <div className="post-actions">
              <span>👍 {post.likesCount ?? 0}</span>
              <span>💬 {post.commentsCount ?? 0}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
