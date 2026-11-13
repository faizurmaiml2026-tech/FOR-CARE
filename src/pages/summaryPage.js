/**
 * AI HEALTH RECORDS — Digital Health Summary Document
 */
(function (global) {
  'use strict';

  function renderSummaryPage(state) {
    const icons = global.HealthApp.icons;
    const utils = global.HealthApp.utils;
    const p = state.profile;
    const activeMeds = state.reminders.filter((r) => r.active);

    const reportsRows = state.reports.length
      ? state.reports
          .slice(0, 6)
          .map(
            (r) =>
              '<tr>' +
                '<td class="tabular-nums">' + utils.formatDate(r.date) + '</td>' +
                '<td style="font-weight:600;">' + utils.escapeHtml(r.title || r.fileName) + '</td>' +
                '<td>' + utils.escapeHtml(r.category) + '</td>' +
                '<td>' + utils.escapeHtml(r.hospital) + '</td>' +
              '</tr>'
          )
          .join('')
      : '<tr><td colspan="4" style="color:var(--color-muted);text-align:center;padding:14px;">No health records uploaded yet.</td></tr>';

    const medsRows = activeMeds.length
      ? activeMeds
          .map(
            (m) =>
              '<tr>' +
                '<td style="font-weight:600;">' + utils.escapeHtml(m.name) + '</td>' +
                '<td class="tabular-nums">' + utils.escapeHtml(m.dosage) + '</td>' +
                '<td>' + utils.escapeHtml(m.frequency) + ' · ' + utils.escapeHtml(m.time) + '</td>' +
                '<td>' + utils.escapeHtml(m.mealInstruction) + '</td>' +
                '<td>' + utils.escapeHtml(m.purpose) + '</td>' +
              '</tr>'
          )
          .join('')
      : '<tr><td colspan="5" style="color:var(--color-muted);text-align:center;padding:14px;">No active medication reminders scheduled.</td></tr>';

    const historyRows = state.history.length
      ? state.history
          .slice(0, 5)
          .map(
            (h) =>
              '<div style="display:flex;gap:14px;padding:10px 0;border-bottom:1px solid var(--color-border);">' +
                '<span class="tabular-nums" style="min-width:104px;font-weight:600;font-size:0.82rem;color:var(--color-forest);">' + utils.formatDate(h.date) + '</span>' +
                '<div style="flex:1;">' +
                  '<strong style="font-size:0.875rem;display:block;">' + utils.escapeHtml(h.title) + '</strong>' +
                  '<span style="font-size:0.8rem;color:var(--color-muted);">' + utils.escapeHtml(h.hospital) + ' — ' + utils.escapeHtml(h.summary) + '</span>' +
                '</div>' +
              '</div>'
          )
          .join('')
      : '<p style="font-size:0.85rem;color:var(--color-muted);margin:10px 0;">No health timeline records saved yet.</p>';

    return (
      '<div class="page-view">' +
        '<div class="page-header no-print">' +
          '<div>' +
            '<h1 class="page-title">Health Summary</h1>' +
            '<p class="page-subtitle">A structured, printable personal health document ready for appointments or personal archiving.</p>' +
          '</div>' +
          '<div class="page-header-actions">' +
            '<button type="button" class="btn btn-secondary" id="summary-copy-btn">' + icons.get('copy') + ' Copy Text Summary</button>' +
            '<button type="button" class="btn btn-secondary" id="summary-print-btn">' + icons.get('printer') + ' Print</button>' +
            '<button type="button" class="btn btn-primary" id="summary-pdf-btn">' + icons.get('download') + ' Download PDF</button>' +
          '</div>' +
        '</div>' +

        '<article class="summary-document" id="printable-health-summary">' +
          '<div class="summary-doc-top">' +
            '<div>' +
              '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">' +
                '<div class="brand-mark" style="width:32px;height:32px;">' + icons.get('brandMark') + '</div>' +
                '<span style="font-size:0.78rem;font-weight:700;letter-spacing:0.06em;color:var(--color-emerald);">AI HEALTH RECORDS</span>' +
              '</div>' +
              '<h2 style="font-size:1.625rem;color:var(--color-forest);">Personal Digital Health Summary</h2>' +
              '<p style="font-size:0.85rem;color:var(--color-muted);margin-top:4px;">Patient-Compiled Reference Document · Generated ' + utils.formatDate(new Date().toISOString().slice(0, 10)) + '</p>' +
            '</div>' +
            '<div style="text-align:right;">' +
              '<span class="pill pill-sage">Patient ID: ' + utils.escapeHtml(p.id) + '</span>' +
              '<p style="font-size:0.78rem;color:var(--color-muted);margin-top:6px;">Blood Group: <strong style="color:var(--color-charcoal);">' + utils.escapeHtml(p.bloodGroup) + '</strong></p>' +
            '</div>' +
          '</div>' +

          '<section class="summary-section">' +
            '<h3 class="summary-section-title">1. Patient Information</h3>' +
            '<div class="summary-kv-grid">' +
              '<div class="summary-kv-item"><span>Full Name</span><strong>' + utils.escapeHtml(p.fullName) + '</strong></div>' +
              '<div class="summary-kv-item"><span>Date of Birth / Age</span><strong class="tabular-nums">' + utils.formatDate(p.dateOfBirth) + ' (' + p.age + ' yrs)</strong></div>' +
              '<div class="summary-kv-item"><span>Blood Group &amp; Measurements</span><strong>' + utils.escapeHtml(p.bloodGroup) + ' · ' + utils.escapeHtml(p.height) + ', ' + utils.escapeHtml(p.weight) + '</strong></div>' +
              '<div class="summary-kv-item"><span>Contact Email &amp; Phone</span><strong>' + utils.escapeHtml(p.phone) + '</strong></div>' +
              '<div class="summary-kv-item"><span>Known Allergies</span><strong>' + utils.escapeHtml((p.allergies || []).join(', ') || 'None recorded') + '</strong></div>' +
              '<div class="summary-kv-item"><span>Emergency Contact</span><strong>' + utils.escapeHtml((p.emergencyContact && p.emergencyContact.name) || '—') + '</strong></div>' +
            '</div>' +
          '</section>' +

          '<section class="summary-section">' +
            '<h3 class="summary-section-title">2. Medical History &amp; Focus Areas</h3>' +
            '<div class="chip-list" style="margin-bottom:14px;">' +
              (p.focusAreas || []).map((a) => '<span class="pill pill-sage">' + utils.escapeHtml(a) + '</span>').join('') +
            '</div>' +
            '<div>' + historyRows + '</div>' +
          '</section>' +

          '<section class="summary-section">' +
            '<h3 class="summary-section-title">3. Reports Overview</h3>' +
            '<div class="table-wrap"><table class="data-table"><thead><tr><th>Date</th><th>Report Title</th><th>Category</th><th>Facility</th></tr></thead><tbody>' +
              reportsRows +
            '</tbody></table></div>' +
          '</section>' +

          '<section class="summary-section">' +
            '<h3 class="summary-section-title">4. Important Dates</h3>' +
            '<div class="summary-kv-grid">' +
              '<div class="summary-kv-item"><span>Most Recent Lab Panel</span><strong class="tabular-nums">Oct 28, 2026</strong></div>' +
              '<div class="summary-kv-item"><span>Last Cardiology ECG</span><strong class="tabular-nums">Sep 15, 2026</strong></div>' +
              '<div class="summary-kv-item"><span>Next Suggested Lipid Review</span><strong class="tabular-nums">Feb – Apr 2027</strong></div>' +
            '</div>' +
          '</section>' +

          '<section class="summary-section" style="margin-bottom:0;">' +
            '<h3 class="summary-section-title">5. Active Medicine &amp; Supplement Schedule</h3>' +
            '<div class="table-wrap"><table class="data-table"><thead><tr><th>Medication</th><th>Dosage</th><th>Schedule</th><th>Meal Note</th><th>Purpose</th></tr></thead><tbody>' +
              (medsRows || '<tr><td colspan="5" style="color:var(--color-muted);">No active medications scheduled.</td></tr>') +
            '</tbody></table></div>' +
          '</section>' +
        '</article>' +
      '</div>'
    );
  }

  function bindSummaryEvents(root) {
    const printBtn = root.querySelector('#summary-print-btn');
    const pdfBtn = root.querySelector('#summary-pdf-btn');
    const copyBtn = root.querySelector('#summary-copy-btn');

    if (printBtn) {
      printBtn.addEventListener('click', () => window.print());
    }

    if (pdfBtn) {
      pdfBtn.addEventListener('click', () => {
        global.HealthApp.utils.showToast('Preparing PDF Export', 'Choose "Save as PDF" in your browser print dialog.');
        setTimeout(() => window.print(), 250);
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const s = global.HealthApp.store.getState();
        const text = [
          'AI HEALTH RECORDS — PERSONAL HEALTH SUMMARY',
          'Patient: ' + s.profile.fullName + ' (' + s.profile.id + ')',
          'Blood Group: ' + s.profile.bloodGroup + ' | Allergies: ' + (s.profile.allergies || []).join(', '),
          '',
          'ACTIVE MEDICATIONS:',
          ...s.reminders.filter((m) => m.active).map((m) => '- ' + m.name + ' ' + m.dosage + ' (' + m.time + ', ' + m.mealInstruction + ')'),
          '',
          'RECENT REPORTS:',
          ...s.reports.slice(0, 5).map((r) => '- ' + r.date + ': ' + r.title + ' (' + r.hospital + ')')
        ].join('\n');

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).catch(() => {});
        }
        global.HealthApp.utils.showToast('Summary copied', 'Plain-text health summary copied to clipboard.');
      });
    }
  }

  global.HealthApp = global.HealthApp || {};
  global.HealthApp.pages = global.HealthApp.pages || {};
  global.HealthApp.pages.summary = {
    render: renderSummaryPage,
    bind: bindSummaryEvents
  };
})(window);
