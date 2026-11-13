/**
 * AI HEALTH RECORDS — Patient Dashboard
 */
(function (global) {
  'use strict';

  function renderDashboard(state) {
    const icons = global.HealthApp.icons;
    const utils = global.HealthApp.utils;
    const charts = global.HealthApp.charts;

    const totalRecords = state.reports.length;
    const recentReportsCount = state.reports.length;
    const activeReminders = state.reminders.filter((r) => r.active);
    const takenCount = activeReminders.filter((r) => r.takenToday).length;
    const pendingInquiries = state.inquiries.filter((i) => i.status === 'Pending').length;

    const userReports = state.reports || [];

    const recentReportsHtml = userReports.length
      ? userReports
          .slice(0, 4)
          .map(
            (r) =>
              '<div class="mini-report-row">' +
                '<div class="mini-report-left">' +
                  '<div class="doc-icon-box">' + icons.get('records') + '</div>' +
                  '<div style="min-width:0;">' +
                    '<div class="mini-report-title">' + utils.escapeHtml(r.title || r.fileName) + '</div>' +
                    '<div class="mini-report-meta tabular-nums">' + utils.formatDate(r.date) + '</div>' +
                  '</div>' +
                '</div>' +
                '<div class="mini-report-actions">' +
                  '<button type="button" class="btn btn-secondary btn-sm" data-dash-explain="' + r.id + '">' + icons.get('sparkles') + ' Explain</button>' +
                  (r.link
                    ? '<a href="' + utils.escapeHtml(r.link) + '" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">Summary</a>'
                    : '') +
                '</div>' +
              '</div>'
          )
          .join('')
      : '<div class="empty-state" style="padding:28px 18px;"><p style="margin:0;">No reports uploaded yet.</p></div>';

    const upcomingMedsHtml = activeReminders
      .slice(0, 4)
      .map(
        (m) =>
          '<div class="mini-report-row" style="' + (m.takenToday ? 'background:var(--color-sage-mist);border-color:var(--color-border-sage);' : '') + '">' +
            '<div class="mini-report-left">' +
              '<div class="doc-icon-box" style="width:38px;height:38px;' + (m.takenToday ? 'background:var(--color-emerald);color:var(--color-white);' : '') + '">' +
                icons.get(m.takenToday ? 'check' : 'pill') +
              '</div>' +
              '<div style="min-width:0;">' +
                '<div class="mini-report-title">' + utils.escapeHtml(m.name) + ' · ' + utils.escapeHtml(m.dosage) + '</div>' +
                '<div class="mini-report-meta tabular-nums">' + utils.escapeHtml(m.time) + ' · ' + utils.escapeHtml(m.mealInstruction) + '</div>' +
              '</div>' +
            '</div>' +
            '<button type="button" class="btn btn-sm ' + (m.takenToday ? 'btn-sage' : 'btn-primary') + '" data-dash-med="' + m.id + '">' +
              (m.takenToday ? 'Taken' : 'Mark Taken') +
            '</button>' +
          '</div>'
      )
      .join('');

    const historyPreviewHtml = state.history
      .slice(0, 4)
      .map(
        (h) =>
          '<div class="timeline-entry" style="padding-bottom:2px;">' +
            '<div class="timeline-node" style="top:6px;">' + icons.get('history') + '</div>' +
            '<div style="padding:4px 0 12px;">' +
              '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">' +
                '<strong style="font-size:0.875rem;color:var(--color-charcoal);">' + utils.escapeHtml(h.title) + '</strong>' +
                '<span class="timeline-date-marker" style="font-size:0.72rem;">' + utils.formatDate(h.date) + '</span>' +
              '</div>' +
              '<div style="font-size:0.78rem;color:var(--color-muted);margin-top:3px;">' + utils.escapeHtml(h.hospital) + ' · ' + utils.escapeHtml(h.category) + '</div>' +
            '</div>' +
          '</div>'
      )
      .join('');

    const activityHtml = state.recentActivity
      .slice(0, 4)
      .map(
        (a) =>
          '<div class="activity-item">' +
            '<div class="activity-dot">' + icons.get(a.icon || 'sparkles') + '</div>' +
            '<div style="flex:1;min-width:0;">' +
              '<p style="font-size:0.84rem;color:var(--color-charcoal);line-height:1.4;">' + utils.escapeHtml(a.text) + '</p>' +
              '<span style="font-size:0.74rem;color:var(--color-muted);">' + utils.escapeHtml(a.time) + '</span>' +
            '</div>' +
          '</div>'
      )
      .join('');

    return (
      '<div class="page-view">' +
        '<div class="page-header">' +
          '<div>' +
            '<h1 class="page-title">' + utils.getGreeting() + ', ' + utils.escapeHtml(state.profile.firstName) + '.</h1>' +
            '<p class="page-subtitle">Your health journey, all in one place.</p>' +
          '</div>' +
          '<div class="page-header-actions">' +
            '<button type="button" class="btn btn-secondary" data-dash-nav="summary">' + icons.get('summary') + ' Health Summary</button>' +
            '<button type="button" class="btn btn-primary" data-dash-nav="upload">' + icons.get('upload') + ' Upload Report</button>' +
          '</div>' +
        '</div>' +

        '<section class="stats-grid" aria-label="Health Overview Statistics">' +
          '<button type="button" class="stat-card stat-sage" data-dash-nav="records">' +
            '<div class="stat-card-top">' +
              '<span class="stat-label">Total Health Records</span>' +
              '<span class="stat-icon">' + icons.get('records') + '</span>' +
            '</div>' +
            '<div class="stat-value">' + totalRecords + '</div>' +
            '<div class="stat-meta">' + icons.get('check') + ' Indexed &amp; organized</div>' +
          '</button>' +

          '<button type="button" class="stat-card" data-dash-nav="records">' +
            '<div class="stat-card-top">' +
              '<span class="stat-label">Recent Reports</span>' +
              '<span class="stat-icon">' + icons.get('calendar') + '</span>' +
            '</div>' +
            '<div class="stat-value">' + recentReportsCount + '</div>' +
            '<div class="stat-meta">Updated past 6 months</div>' +
          '</button>' +

          '<button type="button" class="stat-card stat-sage" data-dash-nav="reminders">' +
            '<div class="stat-card-top">' +
              '<span class="stat-label">Active Reminders</span>' +
              '<span class="stat-icon">' + icons.get('pill') + '</span>' +
            '</div>' +
            '<div class="stat-value">' + activeReminders.length + '</div>' +
            '<div class="stat-meta">' + takenCount + ' of ' + activeReminders.length + ' taken today</div>' +
          '</button>' +

          '<button type="button" class="stat-card" data-dash-nav="inquiries">' +
            '<div class="stat-card-top">' +
              '<span class="stat-label">Pending Inquiries</span>' +
              '<span class="stat-icon">' + icons.get('inquiries') + '</span>' +
            '</div>' +
            '<div class="stat-value">' + pendingInquiries + '</div>' +
            '<div class="stat-meta champagne">' + (pendingInquiries > 0 ? 'Awaiting provider reply' : 'All inquiries answered') + '</div>' +
          '</button>' +
        '</section>' +

        '<section class="dashboard-bento">' +
          '<div class="card col-span-7">' +
            '<div class="card-header">' +
              '<div>' +
                '<h2 class="card-title">Recent Medical Reports</h2>' +
                '<p class="card-subtitle">Latest archived lab panels, imaging, and checkup documents</p>' +
              '</div>' +
              '<button type="button" class="btn btn-ghost btn-sm" data-dash-nav="records">View all</button>' +
            '</div>' +
            '<div class="list-stack">' + recentReportsHtml + '</div>' +
          '</div>' +

          '<div class="card col-span-5">' +
            '<div class="card-header">' +
              '<div>' +
                '<h2 class="card-title">Report Categories</h2>' +
                '<p class="card-subtitle">Distribution across your health vault</p>' +
              '</div>' +
              '<span class="pill pill-sage">All Time</span>' +
            '</div>' +
            charts.renderCategoryDonut(state.reports) +
          '</div>' +

          '<div class="card col-span-6">' +
            '<div class="card-header">' +
              '<div>' +
                '<h2 class="card-title">Upcoming Medicine Reminders</h2>' +
                '<p class="card-subtitle">Today’s medication and supplement schedule</p>' +
              '</div>' +
              '<button type="button" class="btn btn-ghost btn-sm" data-dash-nav="reminders">Manage</button>' +
            '</div>' +
            '<div class="list-stack">' +
              (upcomingMedsHtml || '<div class="empty-state" style="padding:24px 18px;"><p style="margin:0;font-size:0.85rem;color:var(--color-muted);">No active medication reminders scheduled.</p></div>') +
            '</div>' +
          '</div>' +

          '<div class="card col-span-6">' +
            '<div class="card-header">' +
              '<div>' +
                '<h2 class="card-title">Health History Timeline</h2>' +
                '<p class="card-subtitle">Recent visits, scans, and clinical milestones</p>' +
              '</div>' +
              '<button type="button" class="btn btn-ghost btn-sm" data-dash-nav="history">Full timeline</button>' +
            '</div>' +
            '<div class="timeline-wrapper" style="gap:6px;">' +
              (historyPreviewHtml || '<div class="empty-state" style="padding:24px 18px;"><p style="margin:0;font-size:0.85rem;color:var(--color-muted);">No health timeline milestones saved yet.</p></div>') +
            '</div>' +
          '</div>' +

          '<div class="card col-span-5">' +
            '<div class="card-header">' +
              '<div>' +
                '<h2 class="card-title">Recent Activity</h2>' +
                '<p class="card-subtitle">Latest actions across your account</p>' +
              '</div>' +
            '</div>' +
            '<div>' +
              (activityHtml || '<div class="empty-state" style="padding:24px 18px;"><p style="margin:0;font-size:0.85rem;color:var(--color-muted);">No recent activity recorded.</p></div>') +
            '</div>' +
          '</div>' +

          '<div class="card-sage col-span-7">' +
            '<div class="card-header">' +
              '<div>' +
                '<h2 class="card-title">Quick Actions</h2>' +
                '<p class="card-subtitle">Jump directly to common patient tools</p>' +
              '</div>' +
            '</div>' +
            '<div class="quick-actions-grid">' +
              '<button type="button" class="quick-action-tile" data-dash-nav="upload">' +
                '<span class="tile-icon">' + icons.get('upload') + '</span>' +
                '<strong>Upload Report</strong>' +
                '<span>Add PDF or scan</span>' +
              '</button>' +
              '<button type="button" class="quick-action-tile" data-dash-nav="explainer">' +
                '<span class="tile-icon">' + icons.get('sparkles') + '</span>' +
                '<strong>AI Explainer</strong>' +
                '<span>Decode lab terms</span>' +
              '</button>' +
              '<button type="button" class="quick-action-tile" data-dash-nav="compare">' +
                '<span class="tile-icon">' + icons.get('compare') + '</span>' +
                '<strong>Compare Reports</strong>' +
                '<span>Track numeric shifts</span>' +
              '</button>' +
              '<button type="button" class="quick-action-tile" data-dash-nav="assistant">' +
                '<span class="tile-icon">' + icons.get('assistant') + '</span>' +
                '<strong>AI Assistant</strong>' +
                '<span>Ask health questions</span>' +
              '</button>' +
            '</div>' +
          '</div>' +
        '</section>' +
      '</div>'
    );
  }

  function bindDashboardEvents(root) {
    const store = global.HealthApp.store;

    if (global.supabaseClient) {
      global.supabaseClient.auth.getUser().then(function (result) {
        if (!result || result.error || !result.data || !result.data.user) {
          store.setState({
            isAuthenticated: false,
            authMode: 'login',
            currentPage: 'dashboard'
          });
        }
      }).catch(function () {
        store.setState({
          isAuthenticated: false,
          authMode: 'login',
          currentPage: 'dashboard'
        });
      });
    }

    root.querySelectorAll('[data-dash-nav]').forEach((el) => {
      el.addEventListener('click', function () {
        store.navigate(el.getAttribute('data-dash-nav'));
      });
    });

    root.querySelectorAll('[data-dash-view]').forEach((btn) => {
      btn.addEventListener('click', function () {
        const id = btn.getAttribute('data-dash-view');
        const report = store.getState().reports.find((r) => r.id === id);
        if (report) global.HealthApp.modals.openReportPreview(report);
      });
    });

    root.querySelectorAll('[data-dash-explain]').forEach((btn) => {
      btn.addEventListener('click', function () {
        const id = btn.getAttribute('data-dash-explain');
        store.navigate('explainer', { selectedReportId: id });
      });
    });

    root.querySelectorAll('[data-dash-med]').forEach((btn) => {
      btn.addEventListener('click', async function () {
        const medId = btn.getAttribute('data-dash-med');
        const state = store.getState();
        const target = state.reminders.find((m) => m.id === medId);
        if (!target) return;
        const nextVal = !target.takenToday;
        store.setState((s) => ({
          reminders: s.reminders.map((m) => (m.id === medId ? { ...m, takenToday: nextVal } : m))
        }));
        store.addActivity('pill', target.name + ' marked as ' + (nextVal ? 'taken' : 'upcoming'));
        const userId = state.profile && state.profile.id;
        if (userId) {
          try {
            await global.HealthApp.snsWebhookService.toggleMedicineReminderTaken(userId, medId, nextVal);
          } catch (_) {}
        }
        global.HealthApp.utils.showToast(
          nextVal ? 'Dose recorded' : 'Dose reset',
          target.name + ' (' + target.dosage + ') updated.'
        );
      });
    });
  }

  global.HealthApp = global.HealthApp || {};
  global.HealthApp.pages = global.HealthApp.pages || {};
  global.HealthApp.pages.dashboard = {
    render: renderDashboard,
    bind: bindDashboardEvents
  };
})(window);
