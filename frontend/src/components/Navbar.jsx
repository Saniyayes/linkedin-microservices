import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <strong style={{ fontFamily: 'Fraunces, serif' }}>Nodework</strong>
        <div className="navbar-links">
          <NavLink to="/feed" className={({ isActive }) => (isActive ? 'active' : '')}>Feed</NavLink>
          <NavLink to={`/profile/${user?.id}`} className={({ isActive }) => (isActive ? 'active' : '')}>Profile</NavLink>
          <NavLink to="/connections" className={({ isActive }) => (isActive ? 'active' : '')}>Connections</NavLink>
        </div>
        <button className="btn-ghost" onClick={handleLogout}>Log out</button>
      </div>
    </nav>
  );
}
