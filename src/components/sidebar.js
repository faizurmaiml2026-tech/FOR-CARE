/**
 * AI HEALTH RECORDS — Collapsible Patient Sidebar & Mobile Navigation
 */
(function (global) {
  'use strict';

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', group: 'Overview' },
    { id: 'records', label: 'My Health Records', icon: 'records' },
    { id: 'upload', label: 'Upload Report', icon: 'upload' },
    { id: 'explainer', label: 'AI Report Explainer', icon: 'sparkles', group: 'Intelligence & Care' },
    { id: 'history', label: 'Health History', icon: 'history' },
    { id: 'compare', label: 'Compare Reports', icon: 'compare' },
    { id: 'summary', label: 'Health Summary', icon: 'summary' },
    { id: 'reminders', label: 'Medicine Reminders', icon: 'pill', group: 'Daily Wellness' },
    { id: 'assistant', label: 'AI Health Assistant', icon: 'assistant' },
    { id: 'inquiries', label: 'Healthcare Inquiries', icon: 'inquiries' },
    { id: 'profile', label: 'My Profile', icon: 'profile', group: 'Account' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
    { id: 'logout', label: 'Logout', icon: 'logout' }
  ];

  function getBadgeCount(id, state) {
    if (id === 'reminders') {
      const pending = (state.reminders || []).filter((r) => r.active && !r.takenToday).length;
      return pending > 0 ? String(pending) : '';
    }
    if (id === 'inquiries') {
      const pending = (state.inquiries || []).filter((i) => i.status === 'Pending').length;
      return pending > 0 ? String(pending) : '';
    }
    return '';
  }

  function renderSidebar(state) {
    const icons = global.HealthApp.icons;
    const collapsed = state.sidebarCollapsed;
    const mobileOpen = state.mobileMenuOpen;

    const navHtml = NAV_ITEMS.map((item) => {
      const groupHtml = item.group
        ? '<div class="nav-group-label">' + item.group + '</div>'
        : '';
      const isActive = state.currentPage === item.id;
      const isLogout = item.id === 'logout';
      const badge = getBadgeCount(item.id, state);

      return (
        groupHtml +
        (isLogout ? '<div class="nav-divider"></div>' : '') +
        '<button type="button" class="nav-item' +
        (isActive ? ' active' : '') +
        (isLogout ? ' nav-logout' : '') +
        '" data-nav-id="' + item.id + '" title="' + item.label + '">' +
          icons.get(item.icon) +
          '<span class="nav-label">' + item.label + '</span>' +
          (badge ? '<span class="nav-badge">' + badge + '</span>' : '') +
        '</button>'
      );
    }).join('');

    return (
      '<div class="sidebar-backdrop' + (mobileOpen ? ' visible' : '') + '" id="sidebar-backdrop"></div>' +
      '<aside class="sidebar' +
      (collapsed ? ' collapsed' : '') +
      (mobileOpen ? ' mobile-open' : '') +
      '" aria-label="Patient Navigation">' +
        '<div class="sidebar-header">' +
          '<div class="brand-lockup">' +
            '<div class="brand-mark">' + icons.get('brandMark') + '</div>' +
            '<div class="brand-text">' +
              '<span class="brand-name">AI HEALTH RECORDS</span>' +
              '<span class="brand-tagline">Patient Health Portal</span>' +
            '</div>' +
          '</div>' +
          '<button type="button" class="sidebar-collapse-btn" id="sidebar-collapse-btn" aria-label="Toggle sidebar">' +
            icons.get(collapsed ? 'chevronRight' : 'chevronLeft') +
          '</button>' +
        '</div>' +
        '<nav class="sidebar-nav">' + navHtml + '</nav>' +
        '<div class="sidebar-footer">' +
          '<div class="sidebar-patient-tag">' +
            '<span class="sidebar-patient-dot"></span>' +
            '<span>Patient-Only Vault · Private</span>' +
          '</div>' +
        '</div>' +
      '</aside>'
    );
  }

  function renderMobileBottomNav(state) {
    const icons = global.HealthApp.icons;
    const quick = [
      { id: 'dashboard', label: 'Home', icon: 'dashboard' },
      { id: 'records', label: 'Records', icon: 'records' },
      { id: 'upload', label: 'Upload', icon: 'upload' },
      { id: 'assistant', label: 'AI Chat', icon: 'assistant' }
    ];

    const buttons = quick
      .map(
        (item) =>
          '<button type="button" class="mobile-nav-btn' +
          (state.currentPage === item.id ? ' active' : '') +
          '" data-mobile-nav="' + item.id + '">' +
            icons.get(item.icon) +
            '<span>' + item.label + '</span>' +
          '</button>'
      )
      .join('');

    return (
      '<nav class="mobile-bottom-nav" aria-label="Quick Mobile Navigation">' +
        buttons +
        '<button type="button" class="mobile-nav-btn" id="mobile-more-btn">' +
          icons.get('menu') +
          '<span>Menu</span>' +
        '</button>' +
      '</nav>'
    );
  }

  function handleLogout() {
    global.HealthApp.modals.confirm({
      title: 'Sign out of AI Health Records?',
      message: 'Your personal health records remain safely saved. You can sign back in anytime.',
      confirmLabel: 'Logout',
      onConfirm: async function () {
        if (global.supabaseClient) {
          try {
            await global.supabaseClient.auth.signOut();
          } catch (_) {}
        }
        global.HealthApp.store.clearUserData();
        global.HealthApp.utils.showToast('Signed out', 'You have safely exited your patient session.');
      }
    });
  }

  function bindSidebarEvents(root) {
    const store = global.HealthApp.store;

    const collapseBtn = root.querySelector('#sidebar-collapse-btn');
    if (collapseBtn) {
      collapseBtn.addEventListener('click', function () {
        store.setState((s) => ({ sidebarCollapsed: !s.sidebarCollapsed }));
      });
    }

    const backdrop = root.querySelector('#sidebar-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', function () {
        store.setState({ mobileMenuOpen: false });
      });
    }

    root.querySelectorAll('[data-nav-id]').forEach((btn) => {
      btn.addEventListener('click', function () {
        const id = btn.getAttribute('data-nav-id');
        if (id === 'logout') {
          handleLogout();
        } else {
          store.navigate(id);
        }
      });
    });

    root.querySelectorAll('[data-mobile-nav]').forEach((btn) => {
      btn.addEventListener('click', function () {
        store.navigate(btn.getAttribute('data-mobile-nav'));
      });
    });

    const moreBtn = root.querySelector('#mobile-more-btn');
    if (moreBtn) {
      moreBtn.addEventListener('click', function () {
        store.setState({ mobileMenuOpen: true });
      });
    }
  }

  global.HealthApp = global.HealthApp || {};
  global.HealthApp.sidebar = {
    NAV_ITEMS,
    render: renderSidebar,
    renderMobileBottomNav,
    bindEvents: bindSidebarEvents,
    handleLogout
  };
})(window);
