/**
 * AI HEALTH RECORDS — Reusable Modal System & Document Preview Modal
 */
(function (global) {
  'use strict';

  function getRoot() {
    return document.getElementById('modal-root');
  }

  function closeModal() {
    const root = getRoot();
    if (root) root.innerHTML = '';
    document.removeEventListener('keydown', onEscape);
  }

  function onEscape(e) {
    if (e.key === 'Escape') closeModal();
  }

  function openModal(config) {
    const root = getRoot();
    if (!root) return;
    const icons = global.HealthApp.icons;
    const utils = global.HealthApp.utils;

    const sizeClass = config.size === 'lg' ? ' modal-lg' : config.size === 'sm' ? ' modal-sm' : '';

    root.innerHTML =
      '<div class="modal-backdrop" id="active-modal-backdrop" role="dialog" aria-modal="true">' +
        '<div class="modal-dialog' + sizeClass + '">' +
          '<div class="modal-header">' +
            '<div>' +
              '<h2 class="modal-title">' + utils.escapeHtml(config.title || '') + '</h2>' +
              (config.subtitle ? '<p style="font-size:0.8125rem;color:var(--color-muted);margin-top:2px;">' + utils.escapeHtml(config.subtitle) + '</p>' : '') +
            '</div>' +
            '<button type="button" class="modal-close" id="modal-close-x" aria-label="Close modal">' +
              icons.get('close') +
            '</button>' +
          '</div>' +
          '<div class="modal-body" id="modal-body-slot">' + (config.bodyHtml || '') + '</div>' +
          (config.footerHtml !== undefined
            ? '<div class="modal-footer" id="modal-footer-slot">' + config.footerHtml + '</div>'
            : '') +
        '</div>' +
      '</div>';

    document.addEventListener('keydown', onEscape);
    document.getElementById('modal-close-x').addEventListener('click', closeModal);
    document.getElementById('active-modal-backdrop').addEventListener('click', function (e) {
      if (e.target.id === 'active-modal-backdrop') closeModal();
    });

    if (typeof config.onMount === 'function') {
      config.onMount(root, closeModal);
    }
  }

  function openConfirmModal(opts) {
    const utils = global.HealthApp.utils;
    const btnClass = opts.variant === 'danger' ? 'btn btn-danger-soft' : 'btn btn-primary';
    openModal({
      title: opts.title || 'Confirm Action',
      size: 'sm',
      bodyHtml: '<p style="color:var(--color-charcoal-soft);line-height:1.6;">' + utils.escapeHtml(opts.message || '') + '</p>',
      footerHtml:
        '<button type="button" class="btn btn-secondary" id="confirm-cancel-btn">Cancel</button>' +
        '<button type="button" class="' + btnClass + '" id="confirm-ok-btn">' + utils.escapeHtml(opts.confirmLabel || 'Confirm') + '</button>',
      onMount: function (root, close) {
        root.querySelector('#confirm-cancel-btn').addEventListener('click', close);
        root.querySelector('#confirm-ok-btn').addEventListener('click', function () {
          close();
          if (typeof opts.onConfirm === 'function') opts.onConfirm();
        });
      }
    });
  }

  function renderDocumentSheetHtml(report, profile) {
    const utils = global.HealthApp.utils;
    const markers = (report.metrics && report.metrics.length)
      ? report.metrics
      : ((report.aiExplanation && report.aiExplanation.markers) || []);

    const metricsRows = markers
      .map(
        (m) =>
          '<tr>' +
            '<td style="font-weight:600;">' + utils.escapeHtml(m.name) + '</td>' +
            '<td class="tabular-nums" style="font-weight:700;color:var(--color-forest);">' + utils.escapeHtml(m.value + ' ' + (m.unit || '')) + '</td>' +
            '<td class="tabular-nums" style="color:var(--color-muted);">' + utils.escapeHtml(m.referenceRange) + '</td>' +
            '<td><span class="pill ' + (m.status === 'High' ? 'pill-coral' : (m.status === 'Low' ? 'pill-champagne' : 'pill-sage')) + '">' + utils.escapeHtml(m.status || m.statusLabel || 'Recorded') + '</span></td>' +
          '</tr>'
      )
      .join('');

    const imageBlock = report.imageDataUrl
      ? '<div style="margin-bottom:16px;border:1px solid var(--color-border);border-radius:var(--radius-sm);overflow:hidden;">' +
          '<img src="' + report.imageDataUrl + '" alt="Uploaded report scan" style="width:100%;max-height:360px;object-fit:contain;background:var(--color-ivory-elevated);display:block;" />' +
        '</div>'
      : '';

    return (
      '<div class="doc-sheet">' +
        '<div class="doc-sheet-header">' +
          '<div>' +
            '<div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--color-emerald);">' +
              utils.escapeHtml(report.hospital) +
            '</div>' +
            '<h3 style="font-size:1.125rem;margin-top:4px;">' + utils.escapeHtml(report.title) + '</h3>' +
            '<p style="font-size:0.8rem;color:var(--color-muted);margin-top:3px;">' + utils.escapeHtml(report.doctorRef || 'Patient Archived Copy') + '</p>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<span class="pill pill-neutral">' + utils.escapeHtml(report.category) + '</span>' +
            '<div class="tabular-nums" style="font-size:0.78rem;color:var(--color-muted);margin-top:6px;">' + utils.formatDate(report.date) + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;padding:10px 12px;background:var(--color-ivory-elevated);border-radius:var(--radius-xs);margin-bottom:16px;font-size:0.78rem;">' +
          '<div><span style="color:var(--color-muted);display:block;">Patient</span><strong>' + utils.escapeHtml(profile.fullName) + '</strong></div>' +
          '<div><span style="color:var(--color-muted);display:block;">Patient Ref</span><strong class="tabular-nums">' + utils.escapeHtml(profile.id) + '</strong></div>' +
          '<div><span style="color:var(--color-muted);display:block;">Format</span><strong>PDF Document</strong></div>' +
        '</div>' +
        imageBlock +
        ((report.fileUrl || report.link || report.summaryUrl)
          ? '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;">' +
              (report.fileUrl ? '<a href="' + utils.escapeHtml(report.fileUrl) + '" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">' + icons.get('download') + ' Open Uploaded PDF</a>' : '') +
              ((report.link || report.summaryUrl) ? '<a href="' + utils.escapeHtml(report.link || report.summaryUrl) + '" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">' + icons.get('link') + ' Open Generated Summary</a>' : '') +
            '</div>'
          : '') +
        (report.summary ? '<p style="font-size:0.85rem;color:var(--color-charcoal-soft);margin-bottom:16px;line-height:1.55;">' + utils.escapeHtml(report.summary) + '</p>' : '') +
        (metricsRows
          ? '<div class="table-wrap"><table class="data-table"><thead><tr><th>Measurement</th><th>Result</th><th>Reference</th><th>Note</th></tr></thead><tbody>' +
            metricsRows +
            '</tbody></table></div>'
          : '<div class="card-ivory" style="font-size:0.85rem;color:var(--color-charcoal-soft);">Original patient-uploaded document archived in Supabase. Open AI Report Explainer for plain-English clinical context.</div>') +
      '</div>'
    );
  }

  function openReportPreviewModal(report) {
    const state = global.HealthApp.store.getState();
    const icons = global.HealthApp.icons;
    const utils = global.HealthApp.utils;

    openModal({
      title: report.title,
      subtitle: report.hospital + ' · ' + utils.formatDate(report.date),
      size: 'lg',
      bodyHtml: renderDocumentSheetHtml(report, state.profile),
      footerHtml:
        '<button type="button" class="btn btn-secondary" id="preview-close-btn">Close</button>' +
        '<button type="button" class="btn btn-primary" id="preview-explain-btn">' +
          icons.get('sparkles') + ' Explain with AI' +
        '</button>',
      onMount: function (root, close) {
        root.querySelector('#preview-close-btn').addEventListener('click', close);
        root.querySelector('#preview-explain-btn').addEventListener('click', function () {
          close();
          global.HealthApp.store.navigate('explainer', { selectedReportId: report.id });
        });
      }
    });
  }

  global.HealthApp = global.HealthApp || {};
  global.HealthApp.modals = {
    open: openModal,
    close: closeModal,
    confirm: openConfirmModal,
    openReportPreview: openReportPreviewModal,
    renderDocumentSheetHtml
  };
})(window);
