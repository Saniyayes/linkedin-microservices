import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import Connections from './pages/Connections';
import Jobs from './pages/Jobs';
import Messaging from './pages/Messaging';
import Notifications from './pages/Notifications';
import SearchPage from './pages/Search';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('App ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', maxWidth: '600px', margin: '60px auto', textAlign: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          <h2 style={{ color: '#0a66c2', marginBottom: '16px' }}>NodeWork encountered an unexpected issue</h2>
          <p style={{ color: '#666', marginBottom: '24px', lineHeight: 1.5 }}>
            {this.state.error?.message || 'Something went wrong while loading this page.'}
          </p>
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
              } catch (_) {}
              window.location.href = '/login';
            }}
            style={{
              backgroundColor: '#0a66c2',
              color: '#fff',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '24px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px'
            }}
          >
            Clear Session & Return to Login
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function Layout({ children }) {
  return (
    <>
      <Navbar />
      <div className="app-shell">{children}</div>
    </>
  );
}

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? '/feed' : '/login'} replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route
            path="/feed"
            element={
              <ProtectedRoute>
                <Layout>
                  <Feed />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile/:id?"
            element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/connections"
            element={
              <ProtectedRoute>
                <Layout>
                  <Connections />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/jobs"
            element={
              <ProtectedRoute>
                <Layout>
                  <Jobs />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/messaging"
            element={
              <ProtectedRoute>
                <Layout>
                  <Messaging />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Layout>
                  <Notifications />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <Layout>
                  <SearchPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<HomeRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ErrorBoundary>
  );
}
