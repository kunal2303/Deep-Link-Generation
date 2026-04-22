import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { createLink } from '../services/linkService';
import {
  APP_SESSION_LOCKED_CHANGED_EVENT,
  getAuthErrorMessage,
  isAppSessionLocked,
  saveAccountForQuickLogin,
  signInWithGoogle,
  unlockAppSession
} from '../services/authService';
import SavedAccountPrompt from './SavedAccountPrompt';

const LinkGenerator = () => {
  const [user, setUser] = useState(null);
  const [sessionLocked, setSessionLocked] = useState(() => isAppSessionLocked());
  const [authReady, setAuthReady] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
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

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const generateLink = async (e) => {
    e.preventDefault();
    setError('');

    if (!activeUser) {
      setError("Please sign in with Google before generating a link.");
      return;
    }

    if (!title.trim()) {
      setError("Please add a title for this link.");
      return;
    }

    if (!url || !isValidUrl(url)) {
      setError("Please enter a valid URL.");
      return;
    }

    setLoading(true);
    try {
      const slug = await createLink({
        targetUrl: url,
        customSlug,
        title,
        userId: activeUser.uid
      });
      const newLink = `${window.location.origin}/${slug}`;
      setGeneratedLink(newLink);
      setCopied(false);
      setTitle('');
      setUrl('');
      setCustomSlug('');
    } catch (err) {
      console.error("Error generating link: ", err);
      if (err.message === "Slug already in use") {
        setError("That custom slug is already taken. Please try another.");
      } else if (err.message === "Authentication required") {
        setError("Please sign in with Google before generating a link.");
      } else {
        setError("Failed to generate link. Check permissions/Firebase limits.");
      }
    } finally {
      setLoading(false);
    }
  };

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
      console.error("Google sign-in failed:", err);
      setError(getAuthErrorMessage(err));
    }
  };

  const handleUseDifferentAccount = async () => {
    setError('');

    try {
      await signInWithGoogle({ selectAccount: true });
      unlockAppSession();
    } catch (err) {
      console.error("Google sign-in failed:", err);
      setError(getAuthErrorMessage(err));
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page-container generator-container">
      <div className="glass-panel">
        <h1 className="title">Smart Link Generator</h1>
        <p className="subtitle">Bypass Instagram browser and open directly in the YouTube app.</p>

        {!activeUser && authReady && (
          <div className="auth-callout">
            <p>Sign in to generate account-linked smart links and track them on your dashboard.</p>
            <SavedAccountPrompt
              onContinue={handleSignIn}
              onUseDifferentAccount={handleUseDifferentAccount}
            />
          </div>
        )}

        {error && <p className="form-error">{error}</p>}

        <form onSubmit={generateLink} className="form">
          <div className="input-group">
            <input
              type="text"
              placeholder="Title or name for this link..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="url-input"
              disabled={!activeUser || loading}
            />
            <input
              type="text"
              placeholder="Paste your YouTube link here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="url-input"
              disabled={!activeUser || loading}
            />
            <input
              type="text"
              placeholder="Custom slug (optional)..."
              value={customSlug}
              onChange={(e) => setCustomSlug(e.target.value)}
              className="url-input"
              disabled={!activeUser || loading}
            />
          </div>
          <button type="submit" disabled={loading || !activeUser || !authReady} className="btn primary-btn">
            {loading ? 'Generating...' : 'Generate Deep Link'}
          </button>
        </form>

        {generatedLink && (
          <div className="result-container result-enter">
            <p className="success-text">Your deep link is ready!</p>
            <div className="link-box">
              <input type="text" readOnly value={generatedLink} className="generated-input" />
              <button onClick={handleCopy} className={`btn copy-btn ${copied ? 'copied' : ''}`}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <a href={generatedLink} target="_blank" rel="noopener noreferrer" className="preview-link">Test Link</a>
          </div>
        )}
      </div>
      
      <div className="decoration circle-1"></div>
      <div className="decoration circle-2"></div>
    </div>
  );
};

export default LinkGenerator;
