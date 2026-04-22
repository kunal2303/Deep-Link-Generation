import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchLinkBySlug } from '../services/linkService';

const Redirector = () => {
  const { shortCode } = useParams();
  const [error, setError] = useState('');
  const [target, setTarget] = useState('');

  useEffect(() => {
    const fetchLinkAndRedirect = async () => {
      try {
        const linkData = await fetchLinkBySlug(shortCode);

        if (linkData) {
          const targetUrl = linkData.targetUrl;
          setTarget(targetUrl);
          performRedirect(targetUrl);
        } else {
          setError("Link not found or expired.");
        }
      } catch (err) {
        console.error("Error fetching link:", err);
        setError("An error occurred while routing.");
      }
    };

    fetchLinkAndRedirect();
  }, [shortCode]);

  const performRedirect = (url) => {
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    let redirectUrl = url;

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const formattedUrl = url.replace(/^https?:\/\//, '');

      if (isAndroid) {
        // Android Intent for YouTube
        redirectUrl = `intent://${formattedUrl}#Intent;package=com.google.android.youtube;scheme=https;end`;
      } else if (isIOS) {
        // iOS URL scheme for YouTube
        redirectUrl = `vnd.youtube://${formattedUrl}`;
      }
    }
    
    // Attempt the deep link redirect
    window.location.replace(redirectUrl);

    // Fallback to standard web URL if app fails to open after 2.5 seconds
    setTimeout(() => {
      window.location.replace(url);
    }, 2500);
  };

  if (error) {
    return (
      <div className="container center-all">
        <div className="glass-panel error-panel">
          <h2>Oops!</h2>
          <p>{error}</p>
          <a href="/" className="btn auto-width">Go to Homepage</a>
        </div>
      </div>
    );
  }

  return (
    <div className="container center-all">
      <div className="loader-container">
        <div className="spinner"></div>
        <h2>Opening App...</h2>
        <p className="loader-sub">Please wait while we redirect you.</p>
        
        {target && (
          <div className="fallback-action">
            <p className="fallback-text">Not redirecting?</p>
            <a href={target} className="btn primary-btn fallback-btn">Continue to Website</a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Redirector;
