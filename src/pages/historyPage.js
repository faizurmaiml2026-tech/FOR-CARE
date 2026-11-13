/**
 * AI HEALTH RECORDS — Health History Vertical Timeline
 */
(function (global) {
  'use strict';

  const HISTORY_CATS = ['All', 'Lab Work', 'Hospital Visits', 'Diagnostics', 'Medication Changes', 'Checkups'];

  function renderHistoryPage(state) {
    const icons = global.HealthApp.icons;
    const utils = global.HealthApp.utils;
    const f = state.historyFilter;

    const years = ['All', ...Array.from(new Set(state.history.map((h) => String(h.date).slice(0, 4)))).sort().reverse()];

    const filtered = state.history
      .filter((h) => {
        const matchCat = f.category === 'All' || h.category === f.category;
        const matchYear = f.year === 'All' || String(h.date).startsWith(f.year);
        return matchCat && matchYear;
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    const entriesHtml = filtered.length
      ? filtered
          .map((item) => {
            const linkedReport = item.reportId ? state.reports.find((r) => r.id === item.reportId) : null;
            const nodeIcon =
              item.category === 'Hospital Visits'
                ? 'hospital'
                : item.category === 'Medication Changes'
                ? 'pill'
                : item.category === 'Diagnostics'
                ? 'heartPulse'
                : 'records';

            return (
              '<div class="timeline-entry">' +
                '<div class="timeline-node">' + icons.get(nodeIcon) + '</div>' +
                '<article class="timeline-card">' +
                  '<div class="timeline-card-header">' +
                    '<div>' +
                      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px;">' +
                        '<span class="timeline-date-marker">' + icons.get('calendar') + ' ' + utils.formatDate(item.date) + '</span>' +
                        '<span class="pill pill-sage">' + utils.escapeHtml(item.category) + '</span>' +
                      '</div>' +
                      '<h3 style="font-size:1.05rem;font-weight:700;color:var(--color-charcoal);">' + utils.escapeHtml(item.title) + '</h3>' +
                      '<p style="font-size:0.82rem;color:var(--color-muted);margin-top:3px;">' + utils.escapeHtml(item.hospital) + '</p>' +
                    '</div>' +
                    (linkedReport
                      ? '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
                          '<button type="button" class="btn btn-secondary btn-sm" data-hist-view="' + linkedReport.id + '">View Record</button>' +
                          '<button type="button" class="btn btn-sage btn-sm" data-hist-explain="' + linkedReport.id + '">' + icons.get('sparkles') + ' AI Explain</button>' +
                        '</div>'
                      : '') +
                  '</div>' +
                  '<p style="font-size:0.875rem;color:var(--color-charcoal-soft);line-height:1.55;">' + utils.escapeHtml(item.summary) + '</p>' +
                '</article>' +
              '</div>'
            );
          })
          .join('')
      : '<div class="empty-state">' +
          '<div class="empty-state-icon">' + icons.get('history') + '</div>' +
          '<h3>No timeline events match this filter</h3>' +
          '<p>Adjust the category or year filter, or log a new hospital visit or milestone.</p>' +
          '<button type="button" class="btn btn-secondary" id="hist-reset-btn">Show All History</button>' +
        '</div>';

    return (
      '<div class="page-view">' +
        '<div class="page-header">' +
          '<div>' +
            '<h1 class="page-title">Health History</h1>' +
            '<p class="page-subtitle">A chronological timeline of your hospital visits, tests, and health milestones.</p>' +
          '</div>' +
          '<div class="page-header-actions">' +
            '<button type="button" class="btn btn-primary" id="add-history-btn">' + icons.get('plus') + ' Log Visit or Milestone</button>' +
          '</div>' +
        '</div>' +

        '<div class="filter-bar">' +
          '<div class="filter-pills">' +
            HISTORY_CATS.map(
              (c) => '<button type="button" class="filter-pill' + (f.category === c ? ' active' : '') + '" data-hist-cat="' + c + '">' + c + '</button>'
            ).join('') +
          '</div>' +
          '<select class="select" id="hist-year-select" style="width:auto;min-width:120px;">' +
            years.map((y) => '<option value="' + y + '"' + (f.year === y ? ' selected' : '') + '>' + (y === 'All' ? 'All Years' : y) + '</option>').join('') +
          '</select>' +
        '</div>' +

        (filtered.length ? '<div class="timeline-wrapper">' + entriesHtml + '</div>' : entriesHtml) +
      '</div>'
    );
  }

  function openAddHistoryModal() {
    const store = global.HealthApp.store;
    global.HealthApp.modals.open({
      title: 'Log Hospital Visit or Milestone',
      subtitle: 'Add an entry to your personal health timeline',
      bodyHtml:
        '<form id="add-hist-form" style="display:flex;flex-direction:column;gap:14px;">' +
          '<div class="form-field">' +
            '<label class="form-label" for="h-title">Visit or Milestone Title</label>' +
            '<input class="input" id="h-title" type="text" placeholder="e.g., Annual Dental & Vision Checkup" required />' +
          '</div>' +
          '<div class="form-grid" style="gap:12px;">' +
            '<div class="form-field">' +
              '<label class="form-label" for="h-cat">Category</label>' +
              '<select class="select" id="h-cat">' +
                ['Hospital Visits', 'Lab Work', 'Diagnostics', 'Medication Changes', 'Checkups']
                  .map((c) => '<option value="' + c + '">' + c + '</option>')
                  .join('') +
              '</select>' +
            '</div>' +
            '<div class="form-field">' +
              '<label class="form-label" for="h-date">Date</label>' +
              '<input class="input" id="h-date" type="date" value="' + new Date().toISOString().slice(0, 10) + '" required />' +
            '</div>' +
          '</div>' +
          '<div class="form-field">' +
            '<label class="form-label" for="h-hosp">Hospital / Clinic Name (Reference)</label>' +
            '<input class="input" id="h-hosp" type="text" placeholder="e.g., St. Martha Wellness Clinic" required />' +
          '</div>' +
          '<div class="form-field">' +
            '<label class="form-label" for="h-sum">Personal Notes &amp; Outcome</label>' +
            '<textarea class="textarea" id="h-sum" placeholder="Key takeaways, follow-up instructions, or test outcomes..." required></textarea>' +
          '</div>' +
          '<div style="display:flex;justify-content:flex-end;gap:10px;margin-top:6px;">' +
            '<button type="button" class="btn btn-secondary" id="h-cancel-btn">Cancel</button>' +
            '<button type="submit" class="btn btn-primary">Save to Timeline</button>' +
          '</div>' +
        '</form>',
      onMount: function (root, close) {
        root.querySelector('#h-cancel-btn').addEventListener('click', close);
        root.querySelector('#add-hist-form').addEventListener('submit', async function (e) {
          e.preventDefault();
          const title = root.querySelector('#h-title').value.trim();
          const category = root.querySelector('#h-cat').value;
          const date = root.querySelector('#h-date').value;
          const hospital = root.querySelector('#h-hosp').value.trim();
          const summary = root.querySelector('#h-sum').value.trim();

          const client = global.supabaseClient;
          const userId = store.getState().profile && store.getState().profile.id;

          try {
            if (userId) {
              if (global.HealthApp.snsWebhookService && global.HealthApp.snsWebhookService.saveHealthRecord) {
                await global.HealthApp.snsWebhookService.saveHealthRecord(userId, {
                  title: title,
                  category: category,
                  hospital: hospital,
                  date: date,
                  summary: summary
                });
              } else if (client) {
                const { error } = await client.from('health_records').insert({
                  user_id: userId,
                  file_name: 'Milestone Note',
                  title: title,
                  category: category,
                  hospital: hospital,
                  record_date: date,
                  extracted_text: summary,
                  status: 'ready'
                });

                if (error) {
                  console.error('Supabase error saving history record:', {
                    message: error.message,
                    code: error.code,
                    details: error.details,
                    hint: error.hint
                  });
                }
              }
              await store.loadUserData(userId);
            }
            store.addActivity('history', 'Logged timeline event: ' + title);
            close();
            global.HealthApp.utils.showToast('Timeline updated', 'Added "' + title + '" to your Health History.');
          } catch (err) {
            global.HealthApp.utils.showToast('Error', err.message || 'Unable to save milestone.');
          }
        });
      }
    });
  }

  function bindHistoryEvents(root) {
    const store = global.HealthApp.store;

    const addBtn = root.querySelector('#add-history-btn');
    if (addBtn) addBtn.addEventListener('click', openAddHistoryModal);

    root.querySelectorAll('[data-hist-cat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        store.setState((s) => ({ historyFilter: { ...s.historyFilter, category: btn.getAttribute('data-hist-cat') } }));
      });
    });

    const yearSelect = root.querySelector('#hist-year-select');
    if (yearSelect) {
      yearSelect.addEventListener('change', () => {
        store.setState((s) => ({ historyFilter: { ...s.historyFilter, year: yearSelect.value } }));
      });
    }

    root.querySelectorAll('[data-hist-view]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const rep = store.getState().reports.find((r) => r.id === btn.getAttribute('data-hist-view'));
        if (rep) global.HealthApp.modals.openReportPreview(rep);
      });
    });

    root.querySelectorAll('[data-hist-explain]').forEach((btn) => {
      btn.addEventListener('click', () => {
        store.navigate('explainer', { selectedReportId: btn.getAttribute('data-hist-explain') });
      });
    });

    const resetBtn = root.querySelector('#hist-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        store.setState({ historyFilter: { category: 'All', year: 'All' } });
      });
    }
  }

  global.HealthApp = global.HealthApp || {};
  global.HealthApp.pages = global.HealthApp.pages || {};
  global.HealthApp.pages.history = {
    render: renderHistoryPage,
    bind: bindHistoryEvents
  };
})(window);
