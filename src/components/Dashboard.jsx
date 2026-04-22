import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import {
  APP_SESSION_LOCKED_CHANGED_EVENT,
  getAuthErrorMessage,
  isAppSessionLocked,
  saveAccountForQuickLogin,
  signInWithGoogle,
  unlockAppSession
} from '../services/authService';
import { deleteLinkForUser, fetchLinksForUser } from '../services/linkService';
import SavedAccountPrompt from './SavedAccountPrompt';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [sessionLocked, setSessionLocked] = useState(() => isAppSessionLocked());
  const [authReady, setAuthReady] = useState(false);
  const [links, setLinks] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [deletingSlug, setDeletingSlug] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        saveAccountForQuickLogin(currentUser);
      }

      setUser(currentUser);
      setAuthReady(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const updateLockedState = () => setSessionLocked(isAppSessionLocked());
    window.addEventListener(APP_SESSION_LOCKED_CHANGED_EVENT, updateLockedState);

    return () => window.removeEventListener(APP_SESSION_LOCKED_CHANGED_EVENT, updateLockedState);
  }, []);

  const activeUser = sessionLocked ? null : user;

  useEffect(() => {
    if (!authReady || !activeUser) {
      setLinks([]);
      return;
    }

    const loadLinks = async () => {
      setLoadingLinks(true);
      setError('');

      try {
        const userLinks = await fetchLinksForUser(activeUser.uid);
        setLinks(userLinks);
      } catch (err) {
        console.error('Failed to load dashboard links:', err);
        setError('Could not load your links right now.');
      } finally {
        setLoadingLinks(false);
      }
    };

    loadLinks();
  }, [authReady, activeUser]);

  const totalClicks = useMemo(() => links.reduce((sum, link) => sum + (link.clicks || 0), 0), [links]);

  const handleSignIn = async ({ restoreLocalSession = false } = {}) => {
    setError('');

    if (restoreLocalSession) {
      unlockAppSession();
      return;
    }

    try {
      await signInWithGoogle();
      unlockAppSession();
    } catch (err) {
      console.error('Google sign-in failed:', err);
      setError(getAuthErrorMessage(err));
    }
  };

  const handleUseDifferentAccount = async () => {
    setError('');

    try {
      await signInWithGoogle({ selectAccount: true });
      unlockAppSession();
    } catch (err) {
      console.error('Google sign-in failed:', err);
      setError(getAuthErrorMessage(err));
    }
  };

  const handleDeleteLink = async (slug, title) => {
    if (!activeUser || deletingSlug) {
      return;
    }

    const confirmed = window.confirm(`Delete "${title || 'Untitled Link'}"? This shortlink will stop working.`);

    if (!confirmed) {
      return;
    }

    setDeletingSlug(slug);
    setError('');

    try {
      await deleteLinkForUser(slug, activeUser.uid);
      setLinks((currentLinks) => currentLinks.filter((link) => link.slug !== slug));
    } catch (err) {
      console.error('Failed to delete link:', err);
      setError('Could not delete that link. Please try again.');
    } finally {
      setDeletingSlug('');
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

  if (!activeUser) {
    return (
      <div className="page-container dashboard-page">
        <section className="glass-panel auth-required-panel">
          <h1 className="title">Your Dashboard</h1>
          <p className="subtitle">Sign in to review the smart links connected to your account.</p>
          {error && <p className="form-error">{error}</p>}
          <SavedAccountPrompt
            onContinue={handleSignIn}
            onUseDifferentAccount={handleUseDifferentAccount}
          />
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
          <Link to="/" className="btn primary-btn dashboard-create-link">
            Create Link
          </Link>
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

                <button
                  type="button"
                  className="btn danger-btn link-delete-btn"
                  onClick={() => handleDeleteLink(link.slug, link.title)}
                  disabled={deletingSlug === link.slug}
                >
                  {deletingSlug === link.slug ? 'Deleting...' : 'Delete Link'}
                </button>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
};

export default Dashboard;
