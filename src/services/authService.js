import { GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { auth } from '../firebase';

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
