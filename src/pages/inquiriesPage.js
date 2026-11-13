/**
 * AI HEALTH RECORDS — Patient Healthcare Inquiries Centre
 * Tracks patient questions and provider reference notes (patient-only view).
 */
(function (global) {
  'use strict';

  const INQUIRY_CATEGORIES = [
    'Report Clarification',
    'Prescription Renewal Question',
    'Appointment Follow-up',
    'Medical Record Request',
    'Lab Preparation'
  ];

  const REFERENCE_PROVIDERS = [
    'Dr. Kavita Rao — St. Martha Wellness Clinic',
    'Apollo Diagnostics & Care — Wellness Desk',
    'Narayana Heart & Wellness Centre',
    'Manipal Imaging & Diagnostics',
    'Other Hospital / Clinic (Specify in message)'
  ];

  function renderInquiriesPage(state) {
    const icons = global.HealthApp.icons;
    const utils = global.HealthApp.utils;

    const filter = state.inquiryFilter || 'All';
    const items = (state.inquiries || []).filter((inq) => filter === 'All' || inq.status === filter);
    const pendingCount = state.inquiries.filter((i) => i.status === 'Pending').length;
    const answeredCount = state.inquiries.filter((i) => i.status === 'Answered').length;

    const reportOpts =
      '<option value="">None linked</option>' +
      state.reports
        .map((r) => '<option value="' + r.id + '">' + utils.escapeHtml(r.title) + ' (' + utils.formatMonthYear(r.date) + ')</option>')
        .join('');

    const cardsHtml = items.length
      ? items
          .map((inq) => {
            const isAnswered = inq.status === 'Answered';
            const linkedRep = inq.relatedReportId
              ? state.reports.find((r) => r.id === inq.relatedReportId)
              : null;

            return (
              '<article class="inquiry-card">' +
                '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;">' +
                  '<div style="flex:1;min-width:200px;">' +
                    '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px;">' +
                      '<span class="pill ' + (isAnswered ? 'pill-sage' : 'pill-champagne') + '">' +
                        '<span class="status-dot"></span> ' + utils.escapeHtml(inq.status) +
                      '</span>' +
                      '<span class="pill pill-neutral">' + utils.escapeHtml(inq.category) + '</span>' +
                    '</div>' +
                    '<h3 style="font-size:1.02rem;font-weight:700;color:var(--color-charcoal);">' + utils.escapeHtml(inq.subject) + '</h3>' +
                    '<p style="font-size:0.78rem;color:var(--color-muted);margin-top:4px;">' +
                      'Reference: ' + utils.escapeHtml(inq.referenceProvider) + ' · Submitted ' + utils.formatDate(inq.submittedDate) +
                    '</p>' +
                  '</div>' +
                '</div>' +

                '<p style="font-size:0.875rem;color:var(--color-charcoal-soft);line-height:1.55;">' + utils.escapeHtml(inq.message) + '</p>' +

                (linkedRep
                  ? '<div><button type="button" class="btn btn-ghost btn-sm" data-inq-report="' + linkedRep.id + '">' +
                      icons.get('link') + ' Linked: ' + utils.escapeHtml(linkedRep.title) +
                    '</button></div>'
                  : '') +

                (isAnswered && inq.response
                  ? '<div class="inquiry-response-box">' +
                      '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">' +
                        '<strong style="color:var(--color-forest);font-size:0.82rem;">' + utils.escapeHtml(inq.response.authorNote) + '</strong>' +
                        '<span class="tabular-nums" style="font-size:0.75rem;color:var(--color-muted);">' + utils.formatDate(inq.response.respondedDate) + '</span>' +
                      '</div>' +
                      '<p style="color:var(--color-charcoal);line-height:1.5;">' + utils.escapeHtml(inq.response.text) + '</p>' +
                    '</div>'
                  : '<div style="padding:10px 14px;border-radius:var(--radius-sm);background:var(--color-champagne-soft);font-size:0.8rem;color:var(--color-champagne-text);">' +
                      'Pending review — responses received from your care team will appear here for your reference.' +
                    '</div>') +
              '</article>'
            );
          })
          .join('')
      : '<div class="empty-state">' +
          '<div class="empty-state-icon">' + icons.get('inquiries') + '</div>' +
          '<h3>No inquiries in this view</h3>' +
          '<p>Submit a new healthcare question using the form on the left, or switch status filters.</p>' +
        '</div>';

    return (
      '<div class="page-view">' +
        '<div class="page-header">' +
          '<div>' +
            '<h1 class="page-title">Healthcare Inquiries</h1>' +
            '<p class="page-subtitle">Organize questions for your doctors, track record requests, and review recorded replies.</p>' +
          '</div>' +
          '<div style="display:flex;gap:8px;">' +
            '<span class="pill pill-champagne tabular-nums">' + pendingCount + ' Pending</span>' +
            '<span class="pill pill-sage tabular-nums">' + answeredCount + ' Answered</span>' +
          '</div>' +
        '</div>' +

        '<div class="inquiries-layout">' +
          '<div class="card">' +
            '<div class="card-header">' +
              '<div>' +
                '<h2 class="card-title">New Patient Inquiry</h2>' +
                '<p class="card-subtitle">Prepare and log a question or record request</p>' +
              '</div>' +
            '</div>' +
            '<form id="new-inquiry-form" style="display:flex;flex-direction:column;gap:14px;">' +
              '<div class="form-field">' +
                '<label class="form-label" for="inq-subject">Subject / Question Summary</label>' +
                '<input class="input" id="inq-subject" type="text" placeholder="e.g., Clarification on fasting timing before lipid panel" required />' +
              '</div>' +
              '<div class="form-field">' +
                '<label class="form-label" for="inq-category">Inquiry Category</label>' +
                '<select class="select" id="inq-category">' +
                  INQUIRY_CATEGORIES.map((c) => '<option value="' + c + '">' + c + '</option>').join('') +
                '</select>' +
              '</div>' +
              '<div class="form-field">' +
                '<label class="form-label" for="inq-provider">Hospital / Doctor Reference <span style="font-weight:400;color:var(--color-muted);">(Information only)</span></label>' +
                '<select class="select" id="inq-provider">' +
                  REFERENCE_PROVIDERS.map((p) => '<option value="' + utils.escapeHtml(p) + '">' + utils.escapeHtml(p) + '</option>').join('') +
                '</select>' +
                '<span class="form-hint">Used purely to organize who this inquiry pertains to in your personal records.</span>' +
              '</div>' +
              '<div class="form-field">' +
                '<label class="form-label" for="inq-report">Related Health Report (Optional)</label>' +
                '<select class="select" id="inq-report">' + reportOpts + '</select>' +
              '</div>' +
              '<div class="form-field">' +
                '<label class="form-label" for="inq-message">Detailed Question or Request</label>' +
                '<textarea class="textarea" id="inq-message" placeholder="Write your question clearly so you have a complete record..." required></textarea>' +
              '</div>' +
              '<button type="submit" class="btn btn-primary btn-block" id="inq-submit-btn">' +
                icons.get('send') + ' Submit Inquiry' +
              '</button>' +
            '</form>' +
          '</div>' +

          '<div style="display:flex;flex-direction:column;gap:16px;">' +
            '<div class="filter-pills">' +
              ['All', 'Pending', 'Answered']
                .map(
                  (tab) =>
                    '<button type="button" class="filter-pill' + (filter === tab ? ' active' : '') + '" data-inq-tab="' + tab + '">' +
                      tab +
                    '</button>'
                )
                .join('') +
            '</div>' +
            '<div style="display:flex;flex-direction:column;gap:14px;">' + cardsHtml + '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function bindInquiriesEvents(root) {
    const store = global.HealthApp.store;

    root.querySelectorAll('[data-inq-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        store.setState({ inquiryFilter: btn.getAttribute('data-inq-tab') });
      });
    });

    root.querySelectorAll('[data-inq-report]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const rep = store.getState().reports.find((r) => r.id === btn.getAttribute('data-inq-report'));
        if (rep) global.HealthApp.modals.openReportPreview(rep);
      });
    });

    const form = root.querySelector('#new-inquiry-form');
    if (form) {
      form.addEventListener('submit', async function (e) {
        e.preventDefault();
        const btn = root.querySelector('#inq-submit-btn');
        btn.disabled = true;
        btn.textContent = 'Submitting...';

        const state = store.getState();
        const userId = state.profile && state.profile.id;
        const newInquiry = {
          subject: root.querySelector('#inq-subject').value.trim(),
          category: root.querySelector('#inq-category').value,
          referenceProvider: root.querySelector('#inq-provider').value,
          relatedReportId: root.querySelector('#inq-report').value || null,
          message: root.querySelector('#inq-message').value.trim()
        };

        try {
          if (userId) {
            await global.HealthApp.snsWebhookService.submitHealthcareInquiry(userId, newInquiry);
            await store.loadUserData(userId);
          }
          store.addActivity('inquiries', 'Submitted healthcare inquiry: ' + newInquiry.subject);
          global.HealthApp.utils.showToast('Inquiry submitted', 'Saved to database as Pending.');
          form.reset();
        } catch (err) {
          global.HealthApp.utils.showToast('Error', err.message || 'Unable to save inquiry to database.');
        } finally {
          btn.disabled = false;
          btn.textContent = 'Submit Inquiry';
        }
      });
    }
  }

  global.HealthApp = global.HealthApp || {};
  global.HealthApp.pages = global.HealthApp.pages || {};
  global.HealthApp.pages.inquiries = {
    render: renderInquiriesPage,
    bind: bindInquiriesEvents
  };
})(window);
