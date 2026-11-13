/**
 * AI HEALTH RECORDS — Application Bootstrap & Page Router
 */
(function (global) {
  'use strict';

  function renderApp() {
    const appRoot = document.getElementById('app');
    if (!appRoot) return;

    const state = global.HealthApp.store.getState();

    if (!state.isAuthenticated) {
      appRoot.innerHTML = global.HealthApp.pages.auth.render(state);
      global.HealthApp.pages.auth.bind(appRoot);
      return;
    }

    const pageId = state.currentPage || 'dashboard';
    const pageMod = global.HealthApp.pages[pageId] || global.HealthApp.pages.dashboard;

    appRoot.innerHTML =
      '<div class="app-shell' + (state.sidebarCollapsed ? ' sidebar-collapsed' : '') + '">' +
        global.HealthApp.sidebar.render(state) +
        '<div class="main-wrapper">' +
          global.HealthApp.topbar.render(state) +
          '<main class="page-container" id="page-mount">' +
            pageMod.render(state) +
          '</main>' +
        '</div>' +
        global.HealthApp.sidebar.renderMobileBottomNav(state) +
      '</div>';

    global.HealthApp.sidebar.bindEvents(appRoot);
    global.HealthApp.topbar.bindEvents(appRoot);

    const mount = document.getElementById('page-mount');
    if (mount && typeof pageMod.bind === 'function') {
      pageMod.bind(mount);
    }
  }

  global.HealthApp = global.HealthApp || {};
  global.HealthApp.renderCurrentView = renderApp;

  async function restoreSupabaseSession() {
    if (!global.supabaseClient) return;
    try {
      const res = await global.supabaseClient.auth.getSession();
      const session = res && res.data && res.data.session;
      const store = global.HealthApp.store;

      if (session && session.user) {
        var metaName = session.user.user_metadata && session.user.user_metadata.name;
        var email = session.user.email || '';
        var displayName = (metaName || '').trim();

        try {
          var profRes = await global.supabaseClient
            .from('profiles')
            .select('name')
            .eq('id', session.user.id)
            .maybeSingle();
          if (profRes && profRes.data && profRes.data.name) {
            displayName = profRes.data.name.trim();
          }
        } catch (_) {}

        if (!displayName && email) {
          displayName = email
            .split('@')[0]
            .replace(/[._-]+/g, ' ')
            .trim()
            .split(/\s+/)
            .map(function (w) { return w ? w.charAt(0).toUpperCase() + w.slice(1) : ''; })
            .join(' ');
        }

        var parts = (displayName || 'Patient').split(/\s+/);
        store.setState((s) => ({
          isAuthenticated: true,
          profile: {
            ...s.profile,
            id: session.user.id,
            email: email || s.profile.email,
            fullName: displayName || s.profile.fullName,
            firstName: parts[0] || s.profile.firstName,
            lastName: parts.slice(1).join(' ')
          }
        }), { silent: true });

        // Load all data from Supabase for this logged-in user
        await store.loadUserData(session.user.id);
      } else {
        store.clearUserData();
      }
    } catch (_) {
      global.HealthApp.store.clearUserData();
    }
  }

  document.addEventListener('DOMContentLoaded', async function () {
    global.HealthApp.store.subscribe(renderApp);
    await restoreSupabaseSession();
    renderApp();

    if (global.supabaseClient) {
      global.supabaseClient.auth.onAuthStateChange(async function (event, session) {
        if (event === 'SIGNED_OUT') {
          global.HealthApp.store.clearUserData();
        } else if (event === 'SIGNED_IN' && session && session.user) {
          await global.HealthApp.store.loadUserData(session.user.id);
        }
      });
    }

    document.addEventListener('keydown', function (e) {
      const state = global.HealthApp.store.getState();
      if (!state.isAuthenticated) return;
      const tag = (e.target && e.target.tagName) || '';
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
        e.preventDefault();
        global.HealthApp.topbar.openGlobalSearchModal();
      }
    });
  });
})(window);
