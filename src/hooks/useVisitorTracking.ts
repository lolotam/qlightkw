import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Generate a unique visitor ID and store in localStorage
const getVisitorId = (): string => {
  const key = 'ql_visitor_id';
  let visitorId = localStorage.getItem(key);
  if (!visitorId) {
    visitorId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(key, visitorId);
  }
  return visitorId;
};

// Generate session ID (resets after 30 min of inactivity)
const getSessionId = (): string => {
  const key = 'ql_session_id';
  const timestampKey = 'ql_session_timestamp';
  const now = Date.now();
  const lastTimestamp = parseInt(localStorage.getItem(timestampKey) || '0', 10);
  const thirtyMinutes = 30 * 60 * 1000;

  let sessionId = localStorage.getItem(key);
  if (!sessionId || now - lastTimestamp > thirtyMinutes) {
    sessionId = `s_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(key, sessionId);
  }
  localStorage.setItem(timestampKey, now.toString());
  return sessionId;
};

// Detect device type from user agent
const getDeviceType = (): string => {
  const ua = navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua)) {
    if (/ipad|tablet/i.test(ua)) return 'tablet';
    return 'mobile';
  }
  return 'desktop';
};

// Detect browser
const getBrowser = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  return 'Other';
};

// Detect OS
const getOS = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Other';
};

/**
 * Hook to track page visits for analytics
 * Automatically logs each page view to site_visits table
 */
export function useVisitorTracking() {
  const location = useLocation();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    // Skip tracking for admin pages
    if (location.pathname.startsWith('/admin')) return;

    // Prevent double tracking same page
    if (lastTrackedPath.current === location.pathname) return;
    lastTrackedPath.current = location.pathname;

    const trackVisit = async () => {
      try {
        const visitorId = getVisitorId();
        const sessionId = getSessionId();
        const { data: userData } = await supabase.auth.getUser();

        // Insert visit record
        await supabase.from('site_visits').insert({
          visitor_id: visitorId,
          session_id: sessionId,
          page_url: location.pathname,
          page_title: document.title,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
          device_type: getDeviceType(),
          browser: getBrowser(),
          os: getOS(),
          user_id: userData?.user?.id || null,
        });
      } catch (error) {
        // Silently fail - don't disrupt user experience
        console.debug('Visit tracking failed:', error);
      }
    };

    // Small delay to ensure page title is set
    const timer = setTimeout(trackVisit, 500);
    return () => clearTimeout(timer);
  }, [location.pathname]);
}

export default useVisitorTracking;
