/**
 * AI HEALTH RECORDS — Shared Supabase Auth Client
 * Uses the public Supabase URL and publishable key only.
 */
(function (global) {
  'use strict';

  var SUPABASE_URL = 'https://lrtosvimbnzzhqaeunkr.supabase.co';
  var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_eP6DXTRm_FxZabTG1LsMRA_0t__k1gK';
  var REMEMBER_PREF_KEY = 'ahr_supabase_remember_me';

  function getRememberPreference() {
    try {
      var sessionPref = global.sessionStorage.getItem(REMEMBER_PREF_KEY);
      if (sessionPref === 'false') return false;
      var localPref = global.localStorage.getItem(REMEMBER_PREF_KEY);
      if (localPref === 'false') return false;
      return true;
    } catch (_) {
      return true;
    }
  }

  function setRememberPreference(remember) {
    var shouldRemember = Boolean(remember);
    try {
      if (shouldRemember) {
        global.localStorage.setItem(REMEMBER_PREF_KEY, 'true');
        global.sessionStorage.removeItem(REMEMBER_PREF_KEY);
      } else {
        global.sessionStorage.setItem(REMEMBER_PREF_KEY, 'false');
        global.localStorage.removeItem(REMEMBER_PREF_KEY);
      }
    } catch (_) {}
  }

  // Routes Supabase Auth storage to localStorage (ticked) or sessionStorage (unticked)
  var rememberAwareStorage = {
    getItem: function (key) {
      try {
        var fromSession = global.sessionStorage.getItem(key);
        if (fromSession !== null) return fromSession;
        return global.localStorage.getItem(key);
      } catch (_) {
        return null;
      }
    },
    setItem: function (key, value) {
      try {
        if (getRememberPreference()) {
          global.localStorage.setItem(key, value);
          global.sessionStorage.removeItem(key);
        } else {
          global.sessionStorage.setItem(key, value);
          global.localStorage.removeItem(key);
        }
      } catch (_) {}
    },
    removeItem: function (key) {
      try {
        global.localStorage.removeItem(key);
        global.sessionStorage.removeItem(key);
      } catch (_) {}
    }
  };

  var client = null;
  if (global.supabase && typeof global.supabase.createClient === 'function') {
    client = global.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: rememberAwareStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }

  global.supabaseClient = client;
  global.setSupabaseRememberMe = setRememberPreference;
})(window);
