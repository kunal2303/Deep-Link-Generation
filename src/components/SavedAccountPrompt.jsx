import React, { useEffect, useState } from 'react';
import { getSavedAccount, removeSavedAccount, SAVED_ACCOUNT_CHANGED_EVENT } from '../services/authService';
import { auth } from '../firebase';

const SavedAccountPrompt = ({ onContinue, onUseDifferentAccount, disabled = false, compact = false }) => {
  const [savedAccount, setSavedAccount] = useState(() => getSavedAccount());

  useEffect(() => {
    const updateSavedAccount = () => setSavedAccount(getSavedAccount());
    window.addEventListener(SAVED_ACCOUNT_CHANGED_EVENT, updateSavedAccount);

    return () => window.removeEventListener(SAVED_ACCOUNT_CHANGED_EVENT, updateSavedAccount);
  }, []);

  if (!savedAccount) {
    return (
      <button type="button" className="btn primary-btn" onClick={onUseDifferentAccount} disabled={disabled}>
        Sign in with Google
      </button>
    );
  }

  const label = savedAccount.displayName || savedAccount.email || 'saved account';

  const handleContinue = () => {
    onContinue({
      restoreLocalSession: Boolean(auth.currentUser && auth.currentUser.uid === savedAccount.uid)
    });
  };

  return (
    <div className={`saved-account ${compact ? 'compact' : ''}`}>
      <button type="button" className="saved-account-main" onClick={handleContinue} disabled={disabled}>
        {savedAccount.photoURL ? (
          <img src={savedAccount.photoURL} alt="" className="avatar" referrerPolicy="no-referrer" />
        ) : (
          <span className="avatar avatar-fallback">{label.charAt(0)}</span>
        )}
        <span>
          <strong>Continue as {label}</strong>
          {!compact && savedAccount.email && <small>{savedAccount.email}</small>}
        </span>
      </button>

      <div className="saved-account-actions">
        <button type="button" className="text-action" onClick={onUseDifferentAccount} disabled={disabled}>
          Use another account
        </button>
        <button type="button" className="text-action danger-text" onClick={removeSavedAccount} disabled={disabled}>
          Remove
        </button>
      </div>
    </div>
  );
};

export default SavedAccountPrompt;
