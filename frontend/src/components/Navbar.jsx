import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  Users,
  Briefcase,
  MessageSquare,
  Bell,
  Search,
  User as UserIcon,
  LogOut,
  ChevronDown,
  PlusCircle,
  Bookmark
} from 'lucide-react';
import { searchUsers } from '../api/users';

export default function Navbar() {
  const { user, userProfile, unreadNotifications, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await searchUsers(val.trim());
      setSearchResults(results.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchFocused(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const avatar = user?.avatarUrl || userProfile?.avatarUrl;
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';

  return (
    <header className="global-navbar">
      <div className="navbar-container">
        {/* Left: Brand + Search */}
        <div className="nav-left">
          <NavLink to="/feed" className="brand-logo">
            <span className="brand-icon">N</span>
            <span className="brand-text">Nodework</span>
          </NavLink>

          <div className="search-wrapper" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="search-form">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search professionals, skills, jobs..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setSearchFocused(true)}
              />
            </form>

            {searchFocused && searchQuery.trim() && (
              <div className="search-dropdown">
                {searching ? (
                  <div className="search-dropdown-item text-muted">Searching...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(u => (
                    <div
                      key={u.id}
                      className="search-dropdown-item"
                      onClick={() => {
                        setSearchFocused(false);
                        setSearchQuery('');
                        navigate(`/profile/${u.id}`);
                      }}
                    >
                      <div className="mini-avatar">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.name} />
                        ) : (
                          <span>{u.name?.slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="dropdown-user-info">
                        <strong>{u.name}</strong>
                        <small>{u.headline || u.title || 'Member'}</small>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="search-dropdown-item text-muted">
                    Press Enter to search for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Navigation items */}
        <nav className="nav-right">
          <NavLink to="/feed" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Home size={20} />
            <span>Home</span>
          </NavLink>

          <NavLink to="/connections" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Users size={20} />
            <span>My Network</span>
          </NavLink>

          <NavLink to="/jobs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Briefcase size={20} />
            <span>Jobs</span>
          </NavLink>

          <NavLink to="/messaging" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <MessageSquare size={20} />
            <span>Messaging</span>
          </NavLink>

          <NavLink to="/notifications" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <div className="badge-wrap">
              <Bell size={20} />
              {unreadNotifications > 0 && (
                <span className="notif-badge">{unreadNotifications > 99 ? '99+' : unreadNotifications}</span>
              )}
            </div>
            <span>Notifications</span>
          </NavLink>

          {/* Profile Dropdown */}
          <div className="nav-profile-menu" ref={dropdownRef}>
            <button
              type="button"
              className="profile-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="nav-avatar">
                {avatar ? (
                  <img src={avatar} alt={user?.name} />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div className="nav-me-label">
                <span>Me</span>
                <ChevronDown size={12} />
              </div>
            </button>

            {dropdownOpen && (
              <div className="profile-dropdown-menu">
                <div className="dropdown-header">
                  <div className="dropdown-avatar">
                    {avatar ? (
                      <img src={avatar} alt={user?.name} />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                  <div className="dropdown-header-info">
                    <h4>{user?.name || 'Professional Member'}</h4>
                    <p>{user?.headline || userProfile?.headline || user?.title || 'LinkedIn Member'}</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="dropdown-btn-view"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate(`/profile/${user?.id}`);
                  }}
                >
                  View Profile
                </button>

                <div className="dropdown-divider" />

                <div className="dropdown-section">
                  <div className="dropdown-section-title">Manage</div>
                  <button
                    type="button"
                    className="dropdown-link-item"
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/jobs?tab=saved');
                    }}
                  >
                    <Bookmark size={15} />
                    <span>Saved Jobs & Posts</span>
                  </button>
                  <button
                    type="button"
                    className="dropdown-link-item"
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/jobs?post=true');
                    }}
                  >
                    <PlusCircle size={15} />
                    <span>Post a Job Free</span>
                  </button>
                </div>

                <div className="dropdown-divider" />

                <button
                  type="button"
                  className="dropdown-link-item dropdown-logout"
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                    navigate('/login');
                  }}
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
