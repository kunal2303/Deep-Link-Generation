import React, { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, provider } from '../firebase';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });

    return unsubscribe;
  }, []);

  const handleSignIn = async () => {
    setAuthError('');

    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('Google sign-in failed:', err);
      setAuthError('Google sign-in could not be completed.');
    }
  };

  const handleSignOut = async () => {
    setAuthError('');

    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign out failed:', err);
      setAuthError('Sign out failed. Please try again.');
    }
  };

  const handleSwitchAccount = async () => {
    setAuthError('');

    try {
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('Account switch failed:', err);
      setAuthError('Could not switch accounts.');
    } finally {
      provider.setCustomParameters({});
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

        {authReady && user ? (
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
              Sign Out
            </button>
          </>
        ) : (
          <button type="button" className="btn primary-btn nav-button" onClick={handleSignIn} disabled={!authReady}>
            Sign in with Google
          </button>
        )}
      </div>
    </header>
  );
};

export default Navbar;
