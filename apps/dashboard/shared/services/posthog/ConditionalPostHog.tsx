"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const ConditionalPostHog = () => {
  const [shouldLoadPostHog, setShouldLoadPostHog] = useState(false);

  useEffect(() => {
    const checkCookieConsent = () => {
      const consentData = localStorage.getItem("cookie-consent");

      if (consentData) {
        try {
          const { status, timestamp } = JSON.parse(consentData);
          const sixMonthsAgo = Date.now() - 6 * 30 * 24 * 60 * 60 * 1000;

          // Only load PostHog if user accepted cookies and consent is still valid
          if (status === "accepted" && timestamp && timestamp > sixMonthsAgo) {
            setShouldLoadPostHog(true);
            console.log("PostHog loaded");
          } else {
            setShouldLoadPostHog(false);
            // If consent expired or user declined, opt out of PostHog tracking
            if (typeof window !== "undefined") {
              const windowWithPostHog = window as typeof window & {
                posthog?: { opt_out_capturing: () => void };
              };
              if (windowWithPostHog.posthog?.opt_out_capturing) {
                windowWithPostHog.posthog.opt_out_capturing();
              }
            }
          }
        } catch (error) {
          setShouldLoadPostHog(false);
        }
      } else {
        setShouldLoadPostHog(false);
      }
    };

    // Check initial state
    checkCookieConsent();

    // Listen for storage changes (when user accepts/declines on another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "cookie-consent") {
        checkCookieConsent();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Also listen for custom events from our cookie banner
    const handleCookieConsentChange = () => {
      checkCookieConsent();
    };

    window.addEventListener("cookieConsentChange", handleCookieConsentChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "cookieConsentChange",
        handleCookieConsentChange,
      );
    };
  }, []);

  const posthogScript = `
    (function(t,e){var o,n,p,r;e.__SV||(window.posthog && window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init rs ls yi ns us ts ss capture Hi calculateEventProperties vs register register_once register_for_session unregister unregister_for_session gs getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey displaySurvey cancelPendingSurvey canRenderSurvey canRenderSurveyAsync identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException startExceptionAutocapture stopExceptionAutocapture loadToolbar get_property getSessionProperty fs ds createPersonProfile ps Qr opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing get_explicit_consent_status is_capturing clear_opt_in_out_capturing hs debug O cs getPageViewId captureTraceFeedback captureTraceMetric Kr".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    
    posthog.init('phc_du5jBxwYY19OJpuOrD6J0pIK1OVcWXuxwnM3yyyVBjW', {
        api_host: 'https://us.i.posthog.com',
        defaults: '2025-11-30',
        person_profiles: 'identified_only',
    });

    // Event listener for custom events
    document.addEventListener('click', (e) => {
        const link = e.target.closest('[data-ph-event]');
        if (!link) return;
        
        posthog.capture(link.dataset.phEvent, {
            source: link.dataset.phSource,
            href: link.href,
            page: window.location.pathname,
        });
    });
  `;

  // Only render PostHog script in production and when cookies are accepted
  if (process.env.NODE_ENV === "production" && shouldLoadPostHog) {
    return (
      <Script
        id="posthog"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: posthogScript }}
      />
    );
  }

  return null;
};

export default ConditionalPostHog;
