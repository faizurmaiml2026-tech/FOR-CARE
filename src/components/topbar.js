/**
 * AI HEALTH RECORDS — Minimal Top Navigation, Search & Notifications
 */
(function (global) {
  'use strict';

  function getPageTitle(pageId) {
    const item = global.HealthApp.sidebar.NAV_ITEMS.find((n) => n.id === pageId);
    return item ? item.label : 'Dashboard';
  }

  function renderTopbar(state) {
    const icons = global.HealthApp.icons;
    const utils = global.HealthApp.utils;
    const unreadCount = (state.notifications || []).filter((n) => n.unread).length;
    const initials = utils.getInitials(state.profile.fullName);

    return (
      '<header class="topbar">' +
        '<div class="topbar-left">' +
          '<button type="button" class="mobile-menu-btn" id="topbar-menu-btn" aria-label="Open navigation">' +
            icons.get('menu') +
          '</button>' +
          '<div class="topbar-breadcrumb">' +
            '<span>Patient Portal</span>' +
            '<span>/</span>' +
            '<strong>' + utils.escapeHtml(getPageTitle(state.currentPage)) + '</strong>' +
          '</div>' +
        '</div>' +
        '<div class="topbar-search-wrap">' +
          '<button type="button" class="topbar-search-trigger" id="global-search-btn">' +
            icons.get('search') +
            '<span>Search reports, medicines, visits...</span>' +
            '<span class="topbar-search-kbd">/</span>' +
          '</button>' +
        '</div>' +
        '<div class="topbar-actions">' +
          '<div class="popover-anchor">' +
            '<button type="button" class="topbar-icon-btn" id="notif-toggle-btn" aria-label="Notifications">' +
              icons.get('bell') +
              (unreadCount > 0 ? '<span class="notif-dot"></span>' : '') +
            '</button>' +
            '<div class="popover-panel" id="notif-popover" style="display:none;"></div>' +
          '</div>' +
          '<div class="popover-anchor">' +
            '<button type="button" class="patient-pill-btn" id="profile-menu-btn" aria-label="Patient account menu">' +
              '<span class="avatar-circle">' + utils.escapeHtml(initials) + '</span>' +
              '<div class="patient-pill-meta">' +
                '<span class="patient-pill-name">' + utils.escapeHtml(state.profile.fullName) + '</span>' +
                '<span class="patient-pill-role tabular-nums">' + utils.escapeHtml(state.profile.id) + '</span>' +
              '</div>' +
            '</button>' +
            '<div class="popover-panel" id="profile-popover" style="display:none;width:230px;"></div>' +
          '</div>' +
        '</div>' +
      '</header>'
    );
  }

  function openGlobalSearchModal() {
    const state = global.HealthApp.store.getState();
    const icons = global.HealthApp.icons;
    const utils = global.HealthApp.utils;

    function buildResults(query) {
      const q = (query || '').trim().toLowerCase();
      const items = [];

      state.reports.forEach((r) => {
        if (!q || r.title.toLowerCase().includes(q) || r.hospital.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)) {
          items.push({
            type: 'Report',
            icon: 'records',
            title: r.title,
            meta: r.hospital + ' · ' + utils.formatDate(r.date),
            action: () => global.HealthApp.store.navigate('explainer', { selectedReportId: r.id })
          });
        }
      });

      state.reminders.forEach((m) => {
        if (!q || m.name.toLowerCase().includes(q) || m.purpose.toLowerCase().includes(q)) {
          items.push({
            type: 'Medicine',
            icon: 'pill',
            title: m.name + ' (' + m.dosage + ')',
            meta: m.time + ' · ' + m.mealInstruction,
            action: () => global.HealthApp.store.navigate('reminders')
          });
        }
      });

      state.inquiries.forEach((inq) => {
        if (!q || inq.subject.toLowerCase().includes(q) || inq.category.toLowerCase().includes(q)) {
          items.push({
            type: 'Inquiry',
            icon: 'inquiries',
            title: inq.subject,
            meta: inq.status + ' · ' + inq.category,
            action: () => global.HealthApp.store.navigate('inquiries')
          });
        }
      });

      if (!items.length) {
        return '<div style="padding:28px;text-align:center;color:var(--color-muted);font-size:0.875rem;">No matching health records, medicines, or inquiries found.</div>';
      }

      return items
        .slice(0, 8)
        .map(
          (item, idx) =>
            '<button type="button" class="mini-report-row" data-search-idx="' + idx + '" style="width:100%;text-align:left;cursor:pointer;margin-bottom:8px;">' +
              '<div class="mini-report-left">' +
                '<div class="doc-icon-box" style="width:36px;height:36px;">' + icons.get(item.icon) + '</div>' +
                '<div style="min-width:0;">' +
                  '<div class="mini-report-title">' + utils.escapeHtml(item.title) + '</div>' +
                  '<div class="mini-report-meta">' + utils.escapeHtml(item.meta) + '</div>' +
                '</div>' +
              '</div>' +
              '<span class="pill pill-sage">' + utils.escapeHtml(item.type) + '</span>' +
            '</button>'
        )
        .join('');
    }

    let currentMatches = [];

    function renderResultsList(root, query, close) {
      const q = (query || '').trim().toLowerCase();
      currentMatches = [];
      state.reports.forEach((r) => {
        if (!q || r.title.toLowerCase().includes(q) || r.hospital.toLowerCase().includes(q) || r.category.toLowerCase().includes(q)) {
          currentMatches.push(() => global.HealthApp.store.navigate('explainer', { selectedReportId: r.id }));
        }
      });
      state.reminders.forEach((m) => {
        if (!q || m.name.toLowerCase().includes(q) || m.purpose.toLowerCase().includes(q)) {
          currentMatches.push(() => global.HealthApp.store.navigate('reminders'));
        }
      });
      state.inquiries.forEach((inq) => {
        if (!q || inq.subject.toLowerCase().includes(q) || inq.category.toLowerCase().includes(q)) {
          currentMatches.push(() => global.HealthApp.store.navigate('inquiries'));
        }
      });

      const listEl = root.querySelector('#global-search-results');
      listEl.innerHTML = buildResults(query);
      listEl.querySelectorAll('[data-search-idx]').forEach((btn) => {
        btn.addEventListener('click', function () {
          const fn = currentMatches[Number(btn.getAttribute('data-search-idx'))];
          close();
          if (fn) fn();
        });
      });
    }

    global.HealthApp.modals.open({
      title: 'Search Your Health Vault',
      subtitle: 'Quickly locate medical reports, medications, and inquiries',
      bodyHtml:
        '<div class="input-with-icon input-icon-left" style="margin-bottom:16px;">' +
          '<span class="input-prefix-icon">' + icons.get('search') + '</span>' +
          '<input type="text" class="input" id="global-search-input" placeholder="Type report name, hospital, medicine, or inquiry..." autofocus />' +
        '</div>' +
        '<div id="global-search-results"></div>',
      onMount: function (root, close) {
        const input = root.querySelector('#global-search-input');
        renderResultsList(root, '', close);
        setTimeout(() => input.focus(), 40);
        input.addEventListener('input', function () {
          renderResultsList(root, input.value, close);
        });
      }
    });
  }

  function bindTopbarEvents(root) {
    const store = global.HealthApp.store;
    const state = store.getState();
    const icons = global.HealthApp.icons;
    const utils = global.HealthApp.utils;

    const menuBtn = root.querySelector('#topbar-menu-btn');
    if (menuBtn) {
      menuBtn.addEventListener('click', function () {
        store.setState({ mobileMenuOpen: true });
      });
    }

    const searchBtn = root.querySelector('#global-search-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', openGlobalSearchModal);
    }

    const notifBtn = root.querySelector('#notif-toggle-btn');
    const notifPop = root.querySelector('#notif-popover');
    const profBtn = root.querySelector('#profile-menu-btn');
    const profPop = root.querySelector('#profile-popover');

    function closePopovers() {
      if (notifPop) notifPop.style.display = 'none';
      if (profPop) profPop.style.display = 'none';
    }

    if (notifBtn && notifPop) {
      notifBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        const isOpen = notifPop.style.display === 'block';
        closePopovers();
        if (!isOpen) {
          const rows = (state.notifications || [])
            .map(
              (n) =>
                '<button type="button" class="thread-btn" data-notif-id="' + n.id + '" style="border-bottom:1px solid var(--color-border);border-radius:0;padding:12px 16px;">' +
                  '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">' +
                    '<strong style="font-size:0.825rem;color:var(--color-charcoal);">' + utils.escapeHtml(n.title) + '</strong>' +
                    (n.unread ? '<span style="width:7px;height:7px;border-radius:50%;background:var(--color-emerald);flex-shrink:0;"></span>' : '') +
                  '</div>' +
                  '<p style="font-size:0.78rem;color:var(--color-muted);margin-top:3px;line-height:1.4;">' + utils.escapeHtml(n.detail) + '</p>' +
                  '<span style="font-size:0.7rem;color:var(--color-emerald);display:block;margin-top:4px;">' + utils.escapeHtml(n.time) + '</span>' +
                '</button>'
            )
            .join('');

          notifPop.innerHTML =
            '<div style="padding:13px 16px;border-bottom:1px solid var(--color-border);display:flex;align-items:center;justify-content:space-between;">' +
              '<strong style="font-size:0.875rem;">Notifications</strong>' +
              '<button type="button" class="auth-link-btn" id="mark-all-read-btn" style="font-size:0.75rem;">Mark all read</button>' +
            '</div>' +
            '<div style="max-height:320px;overflow-y:auto;">' +
              (rows || '<div style="padding:20px;text-align:center;font-size:0.82rem;color:var(--color-muted);">All caught up.</div>') +
            '</div>';
          notifPop.style.display = 'block';

          const markBtn = notifPop.querySelector('#mark-all-read-btn');
          if (markBtn) {
            markBtn.addEventListener('click', function () {
              store.setState((s) => ({
                notifications: s.notifications.map((x) => ({ ...x, unread: false }))
              }));
            });
          }

          notifPop.querySelectorAll('[data-notif-id]').forEach((itemBtn) => {
            itemBtn.addEventListener('click', function () {
              const nid = itemBtn.getAttribute('data-notif-id');
              const found = state.notifications.find((x) => x.id === nid);
              store.setState((s) => ({
                notifications: s.notifications.map((x) => (x.id === nid ? { ...x, unread: false } : x)),
                currentPage: (found && found.targetPage) || s.currentPage,
                selectedReportId: (found && found.reportId) || s.selectedReportId
              }));
            });
          });
        }
      });
    }

    if (profBtn && profPop) {
      profBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        const isOpen = profPop.style.display === 'block';
        closePopovers();
        if (!isOpen) {
          profPop.innerHTML =
            '<div style="padding:14px 16px;border-bottom:1px solid var(--color-border);">' +
              '<strong style="display:block;font-size:0.875rem;">' + utils.escapeHtml(state.profile.fullName) + '</strong>' +
              '<span style="font-size:0.75rem;color:var(--color-muted);">' + utils.escapeHtml(state.profile.email) + '</span>' +
            '</div>' +
            '<div style="padding:6px;">' +
              '<button type="button" class="nav-item" id="pop-profile-btn">' + icons.get('profile') + '<span>My Profile</span></button>' +
              '<button type="button" class="nav-item" id="pop-settings-btn">' + icons.get('settings') + '<span>Settings</span></button>' +
              '<div class="nav-divider"></div>' +
              '<button type="button" class="nav-item nav-logout" id="pop-logout-btn">' + icons.get('logout') + '<span>Logout</span></button>' +
            '</div>';
          profPop.style.display = 'block';

          profPop.querySelector('#pop-profile-btn').addEventListener('click', () => store.navigate('profile'));
          profPop.querySelector('#pop-settings-btn').addEventListener('click', () => store.navigate('settings'));
          profPop.querySelector('#pop-logout-btn').addEventListener('click', global.HealthApp.sidebar.handleLogout);
        }
      });
    }

    document.addEventListener('click', closePopovers, { once: true });
  }

  global.HealthApp = global.HealthApp || {};
  global.HealthApp.topbar = {
    render: renderTopbar,
    bindEvents: bindTopbarEvents,
    openGlobalSearchModal
  };
})(window);
