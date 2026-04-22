import { GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { auth } from '../firebase';

const SAVED_ACCOUNT_KEY = 'deepLinkSavedAccount';
const APP_SESSION_LOCKED_KEY = 'deepLinkAppSessionLocked';
export const SAVED_ACCOUNT_CHANGED_EVENT = 'saved-account-changed';
export const APP_SESSION_LOCKED_CHANGED_EVENT = 'app-session-locked-changed';

const notifySavedAccountChanged = () => {
  window.dispatchEvent(new Event(SAVED_ACCOUNT_CHANGED_EVENT));
};

const notifyAppSessionLockedChanged = () => {
  window.dispatchEvent(new Event(APP_SESSION_LOCKED_CHANGED_EVENT));
};

export const getAuthErrorMessage = (err) => {
  if (err?.code === 'auth/unauthorized-domain') {
    return 'This domain is not authorized in Firebase Authentication.';
  }

  if (err?.code === 'auth/popup-blocked') {
    return 'The sign-in popup was blocked. Redirecting to Google sign-in...';
  }

  if (err?.code === 'auth/popup-closed-by-user') {
    return 'Google sign-in was closed before it finished.';
  }

  return 'Google sign-in could not be completed.';
};

export const getSavedAccount = () => {
  try {
    const savedAccount = window.localStorage.getItem(SAVED_ACCOUNT_KEY);
    return savedAccount ? JSON.parse(savedAccount) : null;
  } catch (err) {
    console.error('Failed to read saved account:', err);
    return null;
  }
};

export const saveAccountForQuickLogin = (user) => {
  if (!user) {
    return;
  }

  const account = {
    displayName: user.displayName || '',
    email: user.email || '',
    photoURL: user.photoURL || '',
    uid: user.uid
  };

  try {
    window.localStorage.setItem(SAVED_ACCOUNT_KEY, JSON.stringify(account));
    notifySavedAccountChanged();
  } catch (err) {
    console.error('Failed to save account for quick login:', err);
  }
};

export const removeSavedAccount = () => {
  try {
    window.localStorage.removeItem(SAVED_ACCOUNT_KEY);
    window.localStorage.removeItem(APP_SESSION_LOCKED_KEY);
    notifySavedAccountChanged();
    notifyAppSessionLockedChanged();
  } catch (err) {
    console.error('Failed to remove saved account:', err);
  }
};

export const isAppSessionLocked = () => window.localStorage.getItem(APP_SESSION_LOCKED_KEY) === 'true';

export const lockAppSession = () => {
  window.localStorage.setItem(APP_SESSION_LOCKED_KEY, 'true');
  notifyAppSessionLockedChanged();
};

export const unlockAppSession = () => {
  window.localStorage.removeItem(APP_SESSION_LOCKED_KEY);
  notifyAppSessionLockedChanged();
};

export const signInWithGoogle = async ({ selectAccount = false } = {}) => {
  const googleProvider = new GoogleAuthProvider();

  if (selectAccount) {
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  }

  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (err) {
    if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/cancelled-popup-request') {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }

    throw err;
  }
};
