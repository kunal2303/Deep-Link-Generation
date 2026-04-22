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

  const getPlatform = () => {
    const userAgent = navigator.userAgent;

    return {
      isAndroid: /Android/i.test(userAgent),
      isIOS: /iPhone|iPad|iPod/i.test(userAgent)
    };
  };

  const createAndroidIntent = ({ host, pathAndQuery = '', packageName, fallbackUrl, scheme = 'https' }) => {
    const encodedFallback = encodeURIComponent(fallbackUrl);
    return `intent://${host}${pathAndQuery}#Intent;scheme=${scheme};package=${packageName};S.browser_fallback_url=${encodedFallback};end`;
  };

  const normalizeWebUrl = (rawUrl, hostMapper) => {
    try {
      const parsedUrl = new URL(rawUrl);
      const hostname = hostMapper ? hostMapper(parsedUrl.hostname) : parsedUrl.hostname;
      return `https://${hostname}${parsedUrl.pathname}${parsedUrl.search}`;
    } catch (err) {
      console.error("Failed to normalize URL:", err);
      return rawUrl;
    }
  };

  const getYouTubeWebUrl = (rawUrl) => {
    try {
      const parsedUrl = new URL(rawUrl);
      const hostname = parsedUrl.hostname.replace(/^m\./, 'www.');

      if (hostname === 'youtu.be') {
        const videoId = parsedUrl.pathname.split('/').filter(Boolean)[0];
        return videoId ? `https://www.youtube.com/watch?v=${videoId}` : rawUrl;
      }

      if (hostname.endsWith('youtube.com')) {
        return `https://www.youtube.com${parsedUrl.pathname}${parsedUrl.search}`;
      }
    } catch (err) {
      console.error("Failed to parse YouTube URL:", err);
    }

    return rawUrl;
  };

  const buildYouTubeDeepLink = (url) => {
    const { isAndroid, isIOS } = getPlatform();
    const webUrl = getYouTubeWebUrl(url);

    try {
      const parsedUrl = new URL(webUrl);
      const pathAndQuery = `${parsedUrl.pathname}${parsedUrl.search}`;

      if (isAndroid) {
        return createAndroidIntent({
          host: 'www.youtube.com',
          pathAndQuery,
          packageName: 'com.google.android.youtube',
          fallbackUrl: webUrl
        });
      }

      if (isIOS) {
        return `youtube://www.youtube.com${pathAndQuery}`;
      }
    } catch (err) {
      console.error("Failed to build YouTube deep link:", err);
    }

    return webUrl;
  };

  const buildInstagramDeepLink = (url) => {
    const { isAndroid, isIOS } = getPlatform();
    const webUrl = normalizeWebUrl(url, (host) => host.replace(/^www\./, 'www.'));

    try {
      const parsedUrl = new URL(webUrl);
      const pathAndQuery = `${parsedUrl.pathname}${parsedUrl.search}`;

      if (isAndroid) {
        return createAndroidIntent({
          host: 'www.instagram.com',
          pathAndQuery,
          packageName: 'com.instagram.android',
          fallbackUrl: webUrl
        });
      }

      if (isIOS) {
        const username = parsedUrl.pathname.split('/').filter(Boolean)[0];

        if (username && !['p', 'reel', 'tv', 'stories', 'explore'].includes(username)) {
          return `instagram://user?username=${encodeURIComponent(username)}`;
        }

        return `instagram://media?id=${encodeURIComponent(pathAndQuery)}`;
      }
    } catch (err) {
      console.error("Failed to build Instagram deep link:", err);
    }

    return webUrl;
  };

  const buildSpotifyDeepLink = (url) => {
    const { isAndroid, isIOS } = getPlatform();
    const webUrl = normalizeWebUrl(url, (host) => host.replace(/^www\./, 'open.'));

    try {
      const parsedUrl = new URL(webUrl);
      const parts = parsedUrl.pathname.split('/').filter(Boolean);
      const entityType = parts[0];
      const entityId = parts[1];

      if (isAndroid) {
        return createAndroidIntent({
          host: 'open.spotify.com',
          pathAndQuery: `${parsedUrl.pathname}${parsedUrl.search}`,
          packageName: 'com.spotify.music',
          fallbackUrl: webUrl
        });
      }

      if (isIOS && entityType && entityId) {
        return `spotify:${entityType}:${entityId}`;
      }
    } catch (err) {
      console.error("Failed to build Spotify deep link:", err);
    }

    return webUrl;
  };

  const buildTwitterDeepLink = (url) => {
    const { isAndroid, isIOS } = getPlatform();
    const webUrl = normalizeWebUrl(url, () => 'x.com');

    try {
      const parsedUrl = new URL(webUrl);
      const parts = parsedUrl.pathname.split('/').filter(Boolean);
      const username = parts[0];
      const statusId = parts[1] === 'status' ? parts[2] : '';

      if (isAndroid) {
        return createAndroidIntent({
          host: 'x.com',
          pathAndQuery: `${parsedUrl.pathname}${parsedUrl.search}`,
          packageName: 'com.twitter.android',
          fallbackUrl: webUrl
        });
      }

      if (isIOS && statusId) {
        return `twitter://status?id=${encodeURIComponent(statusId)}`;
      }

      if (isIOS && username) {
        return `twitter://user?screen_name=${encodeURIComponent(username)}`;
      }
    } catch (err) {
      console.error("Failed to build X/Twitter deep link:", err);
    }

    return webUrl;
  };

  const buildLinkedInDeepLink = (url) => {
    const { isAndroid, isIOS } = getPlatform();
    const webUrl = normalizeWebUrl(url, (host) => host.replace(/^www\./, 'www.'));

    try {
      const parsedUrl = new URL(webUrl);
      const pathAndQuery = `${parsedUrl.pathname}${parsedUrl.search}`;

      if (isAndroid) {
        return createAndroidIntent({
          host: 'www.linkedin.com',
          pathAndQuery,
          packageName: 'com.linkedin.android',
          fallbackUrl: webUrl
        });
      }

      if (isIOS) {
        return `linkedin://${pathAndQuery.replace(/^\//, '')}`;
      }
    } catch (err) {
      console.error("Failed to build LinkedIn deep link:", err);
    }

    return webUrl;
  };

  const buildFacebookDeepLink = (url) => {
    const { isAndroid, isIOS } = getPlatform();
    const webUrl = normalizeWebUrl(url, (host) => host.replace(/^m\./, 'www.'));

    try {
      const parsedUrl = new URL(webUrl);
      const pathAndQuery = `${parsedUrl.pathname}${parsedUrl.search}`;

      if (isAndroid) {
        return createAndroidIntent({
          host: 'www.facebook.com',
          pathAndQuery,
          packageName: 'com.facebook.katana',
          fallbackUrl: webUrl
        });
      }

      if (isIOS) {
        return `fb://facewebmodal/f?href=${encodeURIComponent(webUrl)}`;
      }
    } catch (err) {
      console.error("Failed to build Facebook deep link:", err);
    }

    return webUrl;
  };

  const buildWhatsAppDeepLink = (url) => {
    const { isAndroid, isIOS } = getPlatform();
    const webUrl = normalizeWebUrl(url, (host) => host.replace(/^api\./, 'wa.').replace(/^www\./, 'wa.'));

    try {
      const parsedUrl = new URL(webUrl);
      const text = parsedUrl.searchParams.get('text') || '';
      const phoneFromPath = parsedUrl.pathname.split('/').filter(Boolean).find((part) => /^\d+$/.test(part));
      const appUrl = phoneFromPath
        ? `whatsapp://send?phone=${encodeURIComponent(phoneFromPath)}${text ? `&text=${encodeURIComponent(text)}` : ''}`
        : `whatsapp://send${text ? `?text=${encodeURIComponent(text)}` : ''}`;

      if (isAndroid) {
        return createAndroidIntent({
          host: 'send',
          pathAndQuery: `${phoneFromPath ? `?phone=${encodeURIComponent(phoneFromPath)}` : ''}${!phoneFromPath && text ? `?text=${encodeURIComponent(text)}` : phoneFromPath && text ? `&text=${encodeURIComponent(text)}` : ''}`,
          packageName: 'com.whatsapp',
          fallbackUrl: webUrl,
          scheme: 'whatsapp'
        });
      }

      if (isIOS) {
        return appUrl;
      }
    } catch (err) {
      console.error("Failed to build WhatsApp deep link:", err);
    }

    return webUrl;
  };

  const getDeepLinkUrl = (url) => {
    let hostname = '';

    try {
      hostname = new URL(url).hostname.replace(/^www\./, '').replace(/^m\./, '').toLowerCase();
    } catch (err) {
      console.error("Failed to parse redirect URL:", err);
      return url;
    }

    if (hostname === 'youtu.be' || hostname.endsWith('youtube.com')) {
      return buildYouTubeDeepLink(url);
    }

    if (hostname.endsWith('instagram.com')) {
      return buildInstagramDeepLink(url);
    }

    if (hostname.endsWith('spotify.com')) {
      return buildSpotifyDeepLink(url);
    }

    if (hostname === 'x.com' || hostname.endsWith('twitter.com')) {
      return buildTwitterDeepLink(url);
    }

    if (hostname.endsWith('linkedin.com')) {
      return buildLinkedInDeepLink(url);
    }

    if (hostname.endsWith('facebook.com') || hostname === 'fb.watch') {
      return buildFacebookDeepLink(url);
    }

    if (hostname.endsWith('whatsapp.com') || hostname === 'wa.me') {
      return buildWhatsAppDeepLink(url);
    }

    return url;
  };

  const performRedirect = (url) => {
    const redirectUrl = getDeepLinkUrl(url);

    window.location.replace(redirectUrl);

    const fallbackTimer = window.setTimeout(() => {
      if (document.visibilityState === 'visible') {
        window.location.replace(url);
      }
    }, 2500);

    const clearFallback = () => window.clearTimeout(fallbackTimer);
    window.addEventListener('pagehide', clearFallback, { once: true });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        clearFallback();
      }
    }, { once: true });
  };

  const retryAppOpen = () => {
    if (!target) {
      return;
    }

    window.location.href = getDeepLinkUrl(target);
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
            <button type="button" onClick={retryAppOpen} className="btn primary-btn fallback-btn">
              Open App
            </button>
            <a href={target} className="web-fallback-link" target="_blank" rel="noopener noreferrer">
              Continue in browser
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Redirector;
