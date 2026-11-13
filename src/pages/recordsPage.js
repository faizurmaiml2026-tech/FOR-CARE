/**
 * AI HEALTH RECORDS — My Health Records Library
 */
(function (global) {
  'use strict';

  const CATEGORIES = ['All', 'Blood Work', 'Cardiology', 'Imaging', 'Prescription', 'Checkup'];

  function getFilteredReports(state) {
    const f = state.recordsFilter;
    const q = (f.search || '').trim().toLowerCase();
    const userReports = state.reports || [];

    return userReports
      .filter((r) => {
        const matchYear = f.year === 'All' || String(r.date).startsWith(f.year);
        const matchQuery =
          !q ||
          (r.fileName || '').toLowerCase().includes(q) ||
          (r.title || '').toLowerCase().includes(q) ||
          (r.status || '').toLowerCase().includes(q);
        return matchYear && matchQuery;
      })
      .sort((a, b) => {
        if (f.sort === 'oldest') return String(a.date).localeCompare(String(b.date));
        if (f.sort === 'az') return String(a.fileName || a.title).localeCompare(String(b.fileName || b.title));
        return String(b.date).localeCompare(String(a.date));
      });
  }

  function renderRecordsPage(state) {
    const icons = global.HealthApp.icons;
    const utils = global.HealthApp.utils;
    const f = state.recordsFilter;
    const userReports = state.reports || [];
    const filtered = getFilteredReports(state);
    const years = ['All', ...Array.from(new Set(userReports.map((r) => String(r.date).slice(0, 4)))).sort().reverse()];

    const filterPillsHtml = CATEGORIES.map(
      (cat) =>
        '<button type="button" class="filter-pill' + (f.category === cat ? ' active' : '') + '" data-rec-cat="' + cat + '">' +
          cat +
        '</button>'
    ).join('');

    const cardsHtml = filtered.length
      ? f.viewMode === 'list'
        ? '<div class="table-wrap"><table class="data-table"><thead><tr><th>Report File</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>' +
          filtered
            .map(
              (r) =>
                '<tr>' +
                  '<td><div style="display:flex;align-items:center;gap:10px;"><span class="doc-icon-box" style="width:34px;height:34px;">' +
                    icons.get('records') +
                  '</span><strong style="display:block;">' + utils.escapeHtml(r.title || r.fileName) + '</strong></div></td>' +
                  '<td class="tabular-nums">' + utils.formatDate(r.date) + '</td>' +
                  '<td><span class="pill ' + (r.status === 'ready' ? 'pill-sage' : 'pill-error') + '">' + utils.escapeHtml(r.status) + '</span></td>' +
                  '<td><div style="display:flex;gap:6px;align-items:center;">' +
                    '<button type="button" class="btn btn-ghost btn-sm" data-rec-view="' + r.id + '">' + icons.get('eye') + ' View</button>' +
                    '<button type="button" class="btn btn-secondary btn-sm" data-rec-explain="' + r.id + '">' + icons.get('sparkles') + ' Explain</button>' +
                    (r.link
                      ? '<a href="' + utils.escapeHtml(r.link) + '" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">Summary</a>'
                      : '') +
                    '<button type="button" class="btn btn-ghost btn-sm" data-rec-delete="' + r.id + '" style="color:var(--color-terracotta);" title="Delete">' + icons.get('trash') + '</button>' +
                  '</div></td>' +
                '</tr>'
            )
            .join('') +
          '</tbody></table></div>'
        : '<div class="records-grid">' +
          filtered
            .map((r) => {
              return (
                '<article class="record-card">' +
                  '<div class="record-card-top">' +
                    '<div class="doc-icon-box">' + icons.get('records') + '</div>' +
                    '<span class="pill ' + (r.status === 'ready' ? 'pill-sage' : 'pill-error') + '">' + utils.escapeHtml(r.status) + '</span>' +
                  '</div>' +
                  '<div>' +
                    '<h3 class="record-card-title">' + utils.escapeHtml(r.title || r.fileName) + '</h3>' +
                  '</div>' +
                  '<div class="record-card-meta">' +
                    '<span class="tabular-nums">' + utils.formatDate(r.date) + '</span>' +
                    '<span>PDF</span>' +
                  '</div>' +
                  '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">' +
                    '<button type="button" class="btn btn-ghost btn-sm" style="flex:1;" data-rec-view="' + r.id + '">View</button>' +
                    '<button type="button" class="btn btn-secondary btn-sm" style="flex:1;" data-rec-explain="' + r.id + '">' + icons.get('sparkles') + ' Explain</button>' +
                    (r.link
                      ? '<a href="' + utils.escapeHtml(r.link) + '" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" style="flex:1;text-align:center;">Summary</a>'
                      : '') +
                    '<button type="button" class="btn btn-ghost btn-sm" data-rec-delete="' + r.id + '" style="color:var(--color-terracotta);" title="Delete">' + icons.get('trash') + '</button>' +
                  '</div>' +
                '</article>'
              );
            })
            .join('') +
          '</div>'
      : '<div class="empty-state">' +
          '<div class="empty-state-icon">' + icons.get('records') + '</div>' +
          '<h3>No reports uploaded yet.</h3>' +
          '<p>' + (userReports.length ? 'Try clearing your active search terms or selecting a different year.' : 'Upload a medical report PDF to generate your simple-language summary.') + '</p>' +
          (userReports.length
            ? '<button type="button" class="btn btn-secondary" id="reset-rec-filters">Reset all filters</button>'
            : '') +
        '</div>';

    return (
      '<div class="page-view">' +
        '<div class="page-header">' +
          '<div>' +
            '<h1 class="page-title">My Health Records</h1>' +
            '<p class="page-subtitle">All of your lab panels, diagnostic scans, prescriptions, and checkup summaries.</p>' +
          '</div>' +
          '<div class="page-header-actions">' +
            '<button type="button" class="btn btn-secondary" id="rec-compare-btn">' + icons.get('compare') + ' Compare Reports</button>' +
            '<button type="button" class="btn btn-primary" id="rec-upload-btn">' + icons.get('upload') + ' Upload Report</button>' +
          '</div>' +
        '</div>' +

        '<div class="card" style="margin-bottom:20px;padding:18px 20px;">' +
          '<div class="records-toolbar">' +
            '<div class="records-search input-with-icon input-icon-left">' +
              '<span class="input-prefix-icon">' + icons.get('search') + '</span>' +
              '<input type="text" class="input" id="rec-search-input" value="' + utils.escapeHtml(f.search) + '" placeholder="Search by report name, hospital, or summary..." />' +
            '</div>' +
            '<select class="select" id="rec-year-select" style="width:auto;min-width:120px;">' +
              years.map((y) => '<option value="' + y + '"' + (f.year === y ? ' selected' : '') + '>' + (y === 'All' ? 'All Years' : y) + '</option>').join('') +
            '</select>' +
            '<select class="select" id="rec-sort-select" style="width:auto;min-width:150px;">' +
              '<option value="newest"' + (f.sort === 'newest' ? ' selected' : '') + '>Newest First</option>' +
              '<option value="oldest"' + (f.sort === 'oldest' ? ' selected' : '') + '>Oldest First</option>' +
              '<option value="az"' + (f.sort === 'az' ? ' selected' : '') + '>Report Name A–Z</option>' +
            '</select>' +
            '<div style="display:inline-flex;border:1px solid var(--color-border-strong);border-radius:var(--radius-sm);overflow:hidden;">' +
              '<button type="button" class="btn btn-sm ' + (f.viewMode === 'grid' ? 'btn-sage' : 'btn-ghost') + '" data-view-mode="grid" style="border-radius:0;">Grid</button>' +
              '<button type="button" class="btn btn-sm ' + (f.viewMode === 'list' ? 'btn-sage' : 'btn-ghost') + '" data-view-mode="list" style="border-radius:0;">List</button>' +
            '</div>' +
          '</div>' +
          '<div class="filter-pills">' + filterPillsHtml + '</div>' +
        '</div>' +

        cardsHtml +
      '</div>'
    );
  }

  function bindRecordsEvents(root) {
    const store = global.HealthApp.store;

    const uploadBtn = root.querySelector('#rec-upload-btn');
    if (uploadBtn) uploadBtn.addEventListener('click', () => store.navigate('upload'));

    const compareBtn = root.querySelector('#rec-compare-btn');
    if (compareBtn) compareBtn.addEventListener('click', () => store.navigate('compare'));

    const searchInput = root.querySelector('#rec-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        const cursor = searchInput.selectionStart;
        store.setState((s) => ({ recordsFilter: { ...s.recordsFilter, search: searchInput.value } }));
        const nextInput = document.getElementById('rec-search-input');
        if (nextInput) {
          nextInput.focus();
          nextInput.setSelectionRange(cursor, cursor);
        }
      });
    }

    root.querySelectorAll('[data-rec-cat]').forEach((btn) => {
      btn.addEventListener('click', function () {
        const cat = btn.getAttribute('data-rec-cat');
        store.setState((s) => ({ recordsFilter: { ...s.recordsFilter, category: cat } }));
      });
    });

    const yearSelect = root.querySelector('#rec-year-select');
    if (yearSelect) {
      yearSelect.addEventListener('change', function () {
        store.setState((s) => ({ recordsFilter: { ...s.recordsFilter, year: yearSelect.value } }));
      });
    }

    const sortSelect = root.querySelector('#rec-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', function () {
        store.setState((s) => ({ recordsFilter: { ...s.recordsFilter, sort: sortSelect.value } }));
      });
    }

    root.querySelectorAll('[data-view-mode]').forEach((btn) => {
      btn.addEventListener('click', function () {
        const mode = btn.getAttribute('data-view-mode');
        store.setState((s) => ({ recordsFilter: { ...s.recordsFilter, viewMode: mode } }));
      });
    });

    root.querySelectorAll('[data-rec-view]').forEach((btn) => {
      btn.addEventListener('click', function () {
        const id = btn.getAttribute('data-rec-view');
        const rep = store.getState().reports.find((r) => r.id === id);
        if (rep) global.HealthApp.modals.openReportPreview(rep);
      });
    });

    root.querySelectorAll('[data-rec-explain]').forEach((btn) => {
      btn.addEventListener('click', function () {
        const id = btn.getAttribute('data-rec-explain');
        store.navigate('explainer', { selectedReportId: id });
      });
    });

    root.querySelectorAll('[data-rec-delete]').forEach((btn) => {
      btn.addEventListener('click', function () {
        const id = btn.getAttribute('data-rec-delete');
        const rep = store.getState().reports.find((r) => r.id === id);
        if (!rep) return;
        const title = rep.title || rep.fileName || 'this record';
        global.HealthApp.modals.confirm({
          title: 'Delete health record?',
          message: 'Are you sure you want to delete "' + title + '"? This will permanently remove the record and its AI summary.',
          confirmLabel: 'Delete Record',
          variant: 'danger',
          onConfirm: async function () {
            const userId = store.getState().profile && store.getState().profile.id;
            if (!userId) return;
            try {
              await global.HealthApp.snsWebhookService.deleteHealthRecord(userId, id);
              await store.loadUserData(userId);
              global.HealthApp.utils.showToast('Record deleted', 'The record was removed from your vault.');
            } catch (err) {
              global.HealthApp.utils.showToast('Error', err.message || 'Unable to delete record.');
            }
          }
        });
      });
    });

    const resetBtn = root.querySelector('#reset-rec-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        store.setState((s) => ({
          recordsFilter: { ...s.recordsFilter, search: '', category: 'All', year: 'All' }
        }));
      });
    }
  }

  global.HealthApp = global.HealthApp || {};
  global.HealthApp.pages = global.HealthApp.pages || {};
  global.HealthApp.pages.records = {
    render: renderRecordsPage,
    bind: bindRecordsEvents
  };
})(window);
