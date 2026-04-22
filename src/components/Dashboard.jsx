import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { getAuthErrorMessage, signInWithGoogle } from '../services/authService';
import { fetchLinksForUser } from '../services/linkService';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [links, setLinks] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!authReady || !user) {
      setLinks([]);
      return;
    }

    const loadLinks = async () => {
      setLoadingLinks(true);
      setError('');

      try {
        const userLinks = await fetchLinksForUser(user.uid);
        setLinks(userLinks);
      } catch (err) {
        console.error('Failed to load dashboard links:', err);
        setError('Could not load your links right now.');
      } finally {
        setLoadingLinks(false);
      }
    };

    loadLinks();
  }, [authReady, user]);

  const totalClicks = useMemo(() => links.reduce((sum, link) => sum + (link.clicks || 0), 0), [links]);

  const handleSignIn = async () => {
    setError('');

    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Google sign-in failed:', err);
      setError(getAuthErrorMessage(err));
    }
  };

  if (!authReady) {
    return (
      <div className="page-container dashboard-page">
        <div className="loader-container dashboard-loader">
          <div className="spinner"></div>
          <h2>Loading dashboard...</h2>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-container dashboard-page">
        <section className="glass-panel auth-required-panel">
          <h1 className="title">Your Dashboard</h1>
          <p className="subtitle">Sign in to review the smart links connected to your account.</p>
          {error && <p className="form-error">{error}</p>}
          <button type="button" className="btn primary-btn" onClick={handleSignIn}>
            Sign in with Google
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="page-container dashboard-page">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Your Smart Links</h1>
          <p>Review every link you created, where it points, and how many clicks it has received.</p>
        </div>

        <div className="stats-card">
          <span>{links.length}</span>
          <p>Links</p>
          <strong>{totalClicks}</strong>
          <p>Total clicks</p>
        </div>
      </section>

      {error && <p className="form-error dashboard-error">{error}</p>}

      {loadingLinks ? (
        <div className="loader-container dashboard-loader">
          <div className="spinner"></div>
          <h2>Loading links...</h2>
        </div>
      ) : links.length === 0 ? (
        <section className="glass-panel empty-panel">
          <h2>No links yet</h2>
          <p>Create your first smart link, then come back here to track it.</p>
          <Link to="/" className="btn primary-btn empty-action">Create Link</Link>
        </section>
      ) : (
        <section className="dashboard-grid" aria-label="Created smart links">
          {links.map((link) => {
            const shortLink = `${window.location.origin}/${link.slug}`;

            return (
              <article className="link-card" key={link.slug}>
                <div className="link-card-header">
                  <h2>{link.title || 'Untitled Link'}</h2>
                  <span>{link.clicks || 0} clicks</span>
                </div>

                <div className="link-detail">
                  <span>Target URL</span>
                  <a href={link.targetUrl} target="_blank" rel="noopener noreferrer">{link.targetUrl}</a>
                </div>

                <div className="link-detail">
                  <span>Shortlink</span>
                  <a href={shortLink} target="_blank" rel="noopener noreferrer">{shortLink}</a>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
};

export default Dashboard;
