/**
 * AI HEALTH RECORDS — Compare Reports Workspace
 * Carefully distinguishes mathematical differences from clinical judgment.
 * Connects to SNS Agent Workbench AI Agent webhook.
 */
(function (global) {
  'use strict';

  let aiComparisonResult = null;
  let isComparing = false;
  let compareErrorMessage = '';

  function renderComparePage(state) {
    const icons = global.HealthApp.icons;
    const utils = global.HealthApp.utils;
    const reports = state.reports || [];

    if (reports.length < 2) {
      return (
        '<div class="page-view">' +
          '<div class="page-header">' +
            '<div>' +
              '<h1 class="page-title">Compare Reports</h1>' +
              '<p class="page-subtitle">Examine how laboratory numbers differ across dates.</p>' +
            '</div>' +
          '</div>' +
          '<div class="empty-state">' +
            '<div class="empty-state-icon">' + icons.get('compare') + '</div>' +
            '<h3>At least two reports are required to compare</h3>' +
            '<p>Please upload two medical reports in the Upload Report section to compare them side by side.</p>' +
            '<button type="button" class="btn btn-primary" id="cmp-empty-upload">' + icons.get('upload') + ' Upload Report</button>' +
          '</div>' +
        '</div>'
      );
    }

    const reportA = reports.find((r) => r.id === state.compareReportAId) || reports[1] || reports[0];
    const reportB = reports.find((r) => r.id === state.compareReportBId) || reports[0];

    const optionsA = reports
      .map(
        (r) =>
          '<option value="' + r.id + '"' + (reportA && r.id === reportA.id ? ' selected' : '') + '>' +
            utils.escapeHtml(r.title) + ' — ' + utils.formatDate(r.date) +
          '</option>'
      )
      .join('');

    const optionsB = reports
      .map(
        (r) =>
          '<option value="' + r.id + '"' + (reportB && r.id === reportB.id ? ' selected' : '') + '>' +
            utils.escapeHtml(r.title) + ' — ' + utils.formatDate(r.date) +
          '</option>'
      )
      .join('');

    let aiResultHtml = '';
    if (isComparing) {
      aiResultHtml =
        '<div class="card" style="margin-top:20px;padding:24px;">' +
          '<div style="display:flex;align-items:center;gap:12px;">' +
            '<div class="typing-dots"><span></span><span></span><span></span></div>' +
            '<strong style="color:var(--color-forest);">SNS Agent Workbench is comparing your selected reports...</strong>' +
          '</div>' +
        '</div>';
    } else if (compareErrorMessage) {
      aiResultHtml =
        '<div class="upload-state-box error" style="margin-top:20px;">' +
          '<div style="display:flex;align-items:flex-start;gap:12px;">' +
            '<div style="color:var(--color-terracotta);margin-top:2px;">' + icons.get('alertCircle') + '</div>' +
            '<div style="flex:1;">' +
              '<strong style="color:var(--color-terracotta);display:block;margin-bottom:4px;">Comparison Webhook Notice</strong>' +
              '<p style="font-size:0.85rem;color:var(--color-charcoal);margin-bottom:8px;">' + utils.escapeHtml(compareErrorMessage) + '</p>' +
            '</div>' +
          '</div>' +
        '</div>';
    } else if (aiComparisonResult) {
      aiResultHtml =
        '<div class="card" style="margin-top:20px;padding:24px;">' +
          '<div class="card-header" style="margin-bottom:12px;">' +
            '<div style="display:flex;align-items:center;gap:8px;">' +
              '<span class="ai-identity-badge"><span class="ai-pulse-dot"></span> Clinical Trend Comparison</span>' +
            '</div>' +
            '<span class="pill pill-sage">Clinical Comparison Engine</span>' +
          '</div>' +
          '<div style="font-size:0.9rem;color:var(--color-charcoal);line-height:1.6;white-space:pre-wrap;">' +
            utils.escapeHtml(aiComparisonResult) +
          '</div>' +
          '<div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--color-border);font-size:0.78rem;color:var(--color-muted);">' +
            'Notice: This comparison is for educational and informational purposes only. It is not medical advice or diagnosis. Always consult your doctor.' +
          '</div>' +
        '</div>';
    }

    return (
      '<div class="page-view">' +
        '<div class="page-header">' +
          '<div>' +
            '<h1 class="page-title">Compare Reports</h1>' +
            '<p class="page-subtitle">Compare two selected reports side by side to see what changed between their values in plain English.</p>' +
          '</div>' +
          '<div class="page-header-actions">' +
            '<button type="button" class="btn btn-primary" id="run-compare-btn"' + (isComparing ? ' disabled' : '') + '>' +
              icons.get('sparkles') + ' ' + (isComparing ? 'Comparing...' : 'Compare Selected Reports') +
            '</button>' +
          '</div>' +
        '</div>' +

        '<div class="compare-selectors">' +
          '<div class="card" style="padding:18px 20px;">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
              '<span class="pill pill-champagne">Report A · Baseline</span>' +
              (reportA ? '<span class="tabular-nums" style="font-size:0.78rem;color:var(--color-muted);">' + utils.formatDate(reportA.date) + '</span>' : '') +
            '</div>' +
            '<select class="select" id="compare-select-a" aria-label="Select Report A">' + optionsA + '</select>' +
            (reportA ? '<p style="font-size:0.78rem;color:var(--color-muted);margin-top:8px;">' + utils.escapeHtml(reportA.hospital) + ' · ' + utils.escapeHtml(reportA.category) + '</p>' : '') +
          '</div>' +

          '<div class="compare-vs-badge">VS</div>' +

          '<div class="card-sage" style="padding:18px 20px;">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
              '<span class="pill pill-emerald">Report B · Comparison</span>' +
              (reportB ? '<span class="tabular-nums" style="font-size:0.78rem;color:var(--color-forest);">' + utils.formatDate(reportB.date) + '</span>' : '') +
            '</div>' +
            '<select class="select" id="compare-select-b" aria-label="Select Report B">' + optionsB + '</select>' +
            (reportB ? '<p style="font-size:0.78rem;color:var(--color-forest);margin-top:8px;">' + utils.escapeHtml(reportB.hospital) + ' · ' + utils.escapeHtml(reportB.category) + '</p>' : '') +
          '</div>' +
        '</div>' +

        '<div class="clinical-integrity-banner">' +
          '<div style="color:var(--color-champagne-text);flex-shrink:0;margin-top:1px;">' + icons.get('shield') + '</div>' +
          '<div>' +
            '<strong style="display:block;margin-bottom:2px;">Informational Comparison</strong>' +
            '<span>This tool compares the clinical biomarker measurements of Report A and Report B. It is for informational purposes only and the patient should consult a doctor. It never diagnoses or prescribes.</span>' +
          '</div>' +
        '</div>' +

        aiResultHtml +
      '</div>'
    );
  }

  function bindCompareEvents(root) {
    const store = global.HealthApp.store;

    const emptyUpload = root.querySelector('#cmp-empty-upload');
    if (emptyUpload) emptyUpload.addEventListener('click', () => store.navigate('upload'));

    const selA = root.querySelector('#compare-select-a');
    const selB = root.querySelector('#compare-select-b');
    if (selA) {
      selA.addEventListener('change', () => {
        store.setState({ compareReportAId: selA.value });
        aiComparisonResult = null;
        compareErrorMessage = '';
      });
    }
    if (selB) {
      selB.addEventListener('change', () => {
        store.setState({ compareReportBId: selB.value });
        aiComparisonResult = null;
        compareErrorMessage = '';
      });
    }

    const runBtn = root.querySelector('#run-compare-btn');
    if (runBtn) {
      runBtn.addEventListener('click', async function () {
        const state = store.getState();
        const reports = state.reports || [];
        const reportA = reports.find((r) => r.id === state.compareReportAId) || reports[1] || reports[0];
        const reportB = reports.find((r) => r.id === state.compareReportBId) || reports[0];

        if (!reportA || !reportB) return;

        isComparing = true;
        compareErrorMessage = '';
        aiComparisonResult = null;
        global.HealthApp.renderCurrentView();

        const res = await global.HealthApp.snsWebhookService.compareReports(reportA, reportB, state.profile.id);
        isComparing = false;
        if (res.ok && res.data) {
          aiComparisonResult = res.data.comparison;
          compareErrorMessage = '';
        } else {
          aiComparisonResult = null;
          compareErrorMessage = res.error || 'Failed to complete comparison via Workbench webhook.';
        }
        global.HealthApp.renderCurrentView();
      });
    }
  }

  global.HealthApp = global.HealthApp || {};
  global.HealthApp.pages = global.HealthApp.pages || {};
  global.HealthApp.pages.compare = {
    render: renderComparePage,
    bind: bindCompareEvents
  };
})(window);
