import React, { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import {
  APP_SESSION_LOCKED_CHANGED_EVENT,
  getAuthErrorMessage,
  isAppSessionLocked,
  lockAppSession,
  saveAccountForQuickLogin,
  signInWithGoogle,
  unlockAppSession
} from '../services/authService';
import SavedAccountPrompt from './SavedAccountPrompt';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [sessionLocked, setSessionLocked] = useState(() => isAppSessionLocked());
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState('');

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

  const handleSignIn = async ({ restoreLocalSession = false } = {}) => {
    setAuthError('');

    if (restoreLocalSession) {
      unlockAppSession();
      return;
    }

    try {
      await signInWithGoogle();
      unlockAppSession();
    } catch (err) {
      console.error('Google sign-in failed:', err);
      setAuthError(getAuthErrorMessage(err));
    }
  };

  const handleUseDifferentAccount = async () => {
    setAuthError('');

    try {
      await signInWithGoogle({ selectAccount: true });
      unlockAppSession();
    } catch (err) {
      console.error('Google sign-in failed:', err);
      setAuthError(getAuthErrorMessage(err));
    }
  };

  const handleSignOut = async () => {
    setAuthError('');
    lockAppSession();
  };

  const handleSwitchAccount = async () => {
    setAuthError('');

    try {
      await signInWithGoogle({ selectAccount: true });
      unlockAppSession();
    } catch (err) {
      console.error('Account switch failed:', err);
      setAuthError(getAuthErrorMessage(err));
    }
  };

  return (
    <header className="navbar">
      <Link to="/" className="brand-link" aria-label="Smart Link Generator home">
        <span className="brand-mark">DL</span>
        <span className="brand-text">Deep Link</span>
      </Link>

      <div className="nav-actions">
        {authError && <span className="nav-error">{authError}</span>}

        {authReady && user && !sessionLocked ? (
          <>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Dashboard
            </NavLink>
            <div className="user-chip" title={user.displayName || user.email || 'Signed in'}>
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="avatar" referrerPolicy="no-referrer" />
              ) : (
                <span className="avatar avatar-fallback">{(user.displayName || user.email || 'U').charAt(0)}</span>
              )}
              <span className="user-name">{user.displayName || user.email}</span>
            </div>
            <button type="button" className="btn ghost-btn nav-button" onClick={handleSwitchAccount}>
              Switch Account
            </button>
            <button type="button" className="btn ghost-btn nav-button" onClick={handleSignOut}>
              Hide Account
            </button>
          </>
        ) : (
          <SavedAccountPrompt
            compact
            disabled={!authReady}
            onContinue={handleSignIn}
            onUseDifferentAccount={handleUseDifferentAccount}
          />
        )}
      </div>
    </header>
  );
};

export default Navbar;
