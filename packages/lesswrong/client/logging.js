import * as Sentry from '@sentry/browser';
import { getSetting, addCallback } from 'meteor/vulcan:core'
import { captureEvent } from '../lib/analyticsEvents.js';

const sentryUrl = getSetting('sentry.url');
const sentryEnvironment = getSetting('sentry.environment');
const sentryRelease = getSetting('sentry.release')

Sentry.init({
  dsn: sentryUrl,
  environment: sentryEnvironment,
  release: sentryRelease,
});
// Initializing sentry on the client browser

function identifyUserToSentry(user) {
  // Set user in sentry scope
  Sentry.configureScope((scope) => {
    scope.setUser({id: user._id, email: user.email, username: user.username});
  });
}

addCallback('events.identify', identifyUserToSentry)

function addUserIdToGoogleAnalytics(user) {
  if (window && window.ga) {
    window.ga('set', 'userId', user._id); // Set the user ID using signed-in user_id.
  }
}

addCallback('events.identify', addUserIdToGoogleAnalytics)

window.addEventListener('load', ev => {
  captureEvent("pageLoadFinished", {
    url: document.location?.href,
    referrer: document.referrer,
    performance: {
      memory: window.performance?.memory?.usedJSHeapSize,
      timeOrigin: window.performance?.timeOrigin,
      timing: window.performance?.timing,
    },
  });
});
