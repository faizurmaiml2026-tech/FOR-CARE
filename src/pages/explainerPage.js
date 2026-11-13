/**
 * AI HEALTH RECORDS — AI Medical Report Explainer Workspace
 */
(function (global) {
  'use strict';

  let isExplainerLoading = false;
  let cachedExplanationMap = {};

  function getStatusPillClass(statusLabel) {
    const s = (statusLabel || '').toLowerCase();
    if (s.includes('high') || s.includes('elevated') || s.includes('above')) {
      return 'pill-coral';
    }
    if (s.includes('low') || s.includes('below') || s.includes('borderline') || s.includes('band') || s.includes('boundary')) {
      return 'pill-champagne';
    }
    return 'pill-sage';
  }

  function renderExplainerPage(state) {
    const icons = global.HealthApp.icons;
    const utils = global.HealthApp.utils;
    const reports = state.reports || [];
    const activeReport = reports.find((r) => r.id === state.selectedReportId) || reports[0];

    if (!activeReport) {
      return (
        '<div class="page-view">' +
          '<div class="empty-state">' +
            '<div class="empty-state-icon">' + icons.get('sparkles') + '</div>' +
            '<h3>No medical reports yet</h3>' +
            '<p>Upload a lab report or prescription first to generate a plain-English AI explanation.</p>' +
            '<button type="button" class="btn btn-primary" id="exp-empty-upload">Upload Report</button>' +
          '</div>' +
        '</div>'
      );
    }

    const ai = cachedExplanationMap[activeReport.id] || activeReport.aiExplanation || {
      overview: 'Report summary for "' + (activeReport.title || activeReport.fileName) + '".',
      simpleExplanation: [
        'Document details are indexed in your personal health vault.',
        'This explanation is for educational purposes only. Always consult your doctor for medical advice.'
      ],
      disclaimer: 'This explanation is for informational purposes only. Always consult a qualified healthcare professional.',
      importantTerms: [
        {
          term: 'Reference Range',
          meaning: 'Standard benchmark range used by laboratories to contextualize tests.'
        }
      ],
      questionsToAsk: [
        'What are the key takeaways from this report given my personal medical history?',
        'Are any follow-up tests or adjustments recommended?'
      ]
    };

    const selectorOptions = reports
      .map(
        (r) =>
          '<option value="' + r.id + '"' + (r.id === activeReport.id ? ' selected' : '') + '>' +
            utils.escapeHtml(r.title) + ' (' + utils.formatDate(r.date) + ')' +
          '</option>'
      )
      .join('');

    const metricsList = (activeReport.metrics && activeReport.metrics.length)
      ? activeReport.metrics
      : ((ai && ai.markers && ai.markers.length)
          ? ai.markers.map((m) => ({
              name: m.name,
              value: m.value + ' ' + (m.unit || ''),
              referenceRange: m.referenceRange,
              statusLabel: m.status === 'Normal' ? 'In Range' : (m.status === 'High' ? 'Elevated' : 'Low')
            }))
          : []);

    const termsList = (ai.importantTerms && ai.importantTerms.length)
      ? ai.importantTerms
      : ((ai && ai.markers && ai.markers.length)
          ? ai.markers.map((m) => ({ term: m.name, meaning: m.description }))
          : [
              { term: 'Reference Range', meaning: 'The expected numerical interval where healthy individuals’ test results fall.' },
              { term: 'Biomarker', meaning: 'A biological indicator of health, cellular function, or metabolic status.' }
            ]);

    const rightColumnHtml = isExplainerLoading
      ? '<div class="ai-section-stack">' +
          utils.renderSkeletonBlock(3) +
          utils.renderSkeletonBlock(4) +
          utils.renderSkeletonBlock(3) +
        '</div>'
      : '<div class="ai-section-stack">' +
          '<div class="ai-card highlight">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px;">' +
              '<span class="ai-identity-badge"><span class="ai-pulse-dot"></span> AI Clinical Clarity</span>' +
              '<span style="font-size:0.75rem;color:var(--color-muted);">Educational patient summary</span>' +
            '</div>' +
            '<h2 style="font-size:1.1rem;margin-bottom:8px;">Report Overview</h2>' +
            '<p style="font-size:0.9rem;color:var(--color-charcoal-soft);line-height:1.6;">' + utils.escapeHtml(ai.overview) + '</p>' +
          '</div>' +

          '<div class="ai-card">' +
            '<div class="card-header" style="margin-bottom:12px;">' +
              '<h2 class="card-title">Simple Explanation</h2>' +
              '<span class="pill pill-sage">Plain English</span>' +
            '</div>' +
            '<ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:9px;color:var(--color-charcoal-soft);font-size:0.88rem;line-height:1.55;">' +
              (ai.simpleExplanation || []).map((line) => '<li>' + utils.escapeHtml(line) + '</li>').join('') +
            '</ul>' +
          '</div>' +

          '<div class="ai-card">' +
            '<div class="card-header" style="margin-bottom:12px;">' +
              '<div>' +
                '<h2 class="card-title">Values &amp; Reference Ranges</h2>' +
                '<p class="card-subtitle">Numbers placed beside lab reference benchmarks</p>' +
              '</div>' +
            '</div>' +
            (metricsList.length
              ? '<div class="table-wrap"><table class="data-table"><thead><tr><th>Metric</th><th>Your Value</th><th>Reference Range</th><th>Context</th></tr></thead><tbody>' +
                metricsList
                  .map(
                    (m) =>
                      '<tr>' +
                        '<td style="font-weight:600;">' + utils.escapeHtml(m.name) + '</td>' +
                        '<td class="tabular-nums" style="font-weight:700;color:var(--color-forest);">' + utils.escapeHtml(m.value) + '</td>' +
                        '<td class="tabular-nums" style="color:var(--color-muted);">' + utils.escapeHtml(m.referenceRange) + '</td>' +
                        '<td><span class="pill ' + getStatusPillClass(m.statusLabel) + '">' + utils.escapeHtml(m.statusLabel) + '</span></td>' +
                      '</tr>'
                  )
                  .join('') +
                '</tbody></table></div>'
              : '<p style="font-size:0.85rem;color:var(--color-muted);">No discrete tabular biomarkers were attached to this document.</p>') +
          '</div>' +

          '<div class="ai-card">' +
            '<div class="card-header" style="margin-bottom:12px;">' +
              '<h2 class="card-title">Important Terms Explained</h2>' +
            '</div>' +
            '<div class="terms-grid">' +
              termsList
                .map(
                  (t) =>
                    '<div class="term-box">' +
                      '<strong>' + utils.escapeHtml(t.term) + '</strong>' +
                      '<p>' + utils.escapeHtml(t.meaning) + '</p>' +
                    '</div>'
                )
                .join('') +
            '</div>' +
          '</div>' +

          '<div class="ai-card">' +
            '<div class="card-header" style="margin-bottom:12px;">' +
              '<div>' +
                '<h2 class="card-title">Questions to Ask Your Doctor</h2>' +
                '<p class="card-subtitle">Prepare for your next appointment or save as an inquiry</p>' +
              '</div>' +
              '<button type="button" class="btn btn-secondary btn-sm" id="exp-copy-qs">' + icons.get('copy') + ' Copy All</button>' +
            '</div>' +
            '<div class="question-checklist">' +
              (ai.questionsToAsk || [])
                .map(
                  (q, idx) =>
                    '<div class="question-row">' +
                      '<span style="flex:1;color:var(--color-charcoal);">' + utils.escapeHtml(q) + '</span>' +
                      '<button type="button" class="btn btn-ghost btn-sm" data-save-inquiry-q="' + idx + '">Save to Inquiries</button>' +
                    '</div>'
                )
                .join('') +
            '</div>' +
            '<div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--color-border);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">' +
              '<span style="font-size:0.75rem;color:var(--color-muted);">Informational aid only — confirm clinical decisions with your doctor.</span>' +
              '<button type="button" class="btn btn-sage btn-sm" id="exp-ask-assistant">' + icons.get('assistant') + ' Ask Follow-up in AI Assistant</button>' +
            '</div>' +
          '</div>' +
        '</div>';

    return (
      '<div class="page-view">' +
        '<div class="page-header">' +
          '<div>' +
            '<h1 class="page-title">AI Medical Report Explainer</h1>' +
            '<p class="page-subtitle">Understand laboratory values, medical terminology, and key questions without guesswork.</p>' +
          '</div>' +
          '<div class="page-header-actions">' +
            '<button type="button" class="btn btn-secondary" id="exp-refresh-btn">' + icons.get('refresh') + ' Refresh AI Explanation</button>' +
          '</div>' +
        '</div>' +

        '<div class="explainer-selector-bar">' +
          '<div style="display:flex;align-items:center;gap:12px;flex:1;min-width:240px;">' +
            '<label for="exp-report-select" style="font-size:0.825rem;font-weight:700;color:var(--color-forest);white-space:nowrap;">Selected Report:</label>' +
            '<select class="select" id="exp-report-select">' + selectorOptions + '</select>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
            '<span class="pill pill-sage">' + utils.escapeHtml(activeReport.category) + '</span>' +
            '<button type="button" class="btn btn-ghost btn-sm" id="exp-compare-btn">' + icons.get('compare') + ' Compare with Earlier</button>' +
          '</div>' +
        '</div>' +

        '<div class="explainer-workspace">' +
          '<div class="doc-preview-shell">' +
            '<div class="doc-preview-toolbar">' +
              '<div style="display:flex;align-items:center;gap:8px;">' +
                icons.get('records') +
                '<strong style="font-size:0.84rem;">Document Preview</strong>' +
              '</div>' +
              '<button type="button" class="btn btn-ghost btn-sm" id="exp-fullscreen-btn">' + icons.get('eye') + ' Expand</button>' +
            '</div>' +
            global.HealthApp.modals.renderDocumentSheetHtml(activeReport, state.profile) +
          '</div>' +

          '<div>' + rightColumnHtml + '</div>' +
        '</div>' +
      '</div>'
    );
  }

  async function triggerAiExplain(report) {
    if (!report) return;
    if (report.aiExplanation) {
      cachedExplanationMap[report.id] = report.aiExplanation;
      global.HealthApp.renderCurrentView();
      return;
    }
    isExplainerLoading = true;
    global.HealthApp.renderCurrentView();

    try {
      let aiFound = null;
      if (global.HealthApp.snsWebhookService && global.HealthApp.snsWebhookService.fetchAiExplanation) {
        aiFound = await global.HealthApp.snsWebhookService.fetchAiExplanation(
          store.getState().profile && store.getState().profile.id,
          report.id
        );
      }

      if (aiFound) {
        cachedExplanationMap[report.id] = aiFound;
      } else {
        cachedExplanationMap[report.id] = {
          overview: report.summary || ('Report summary for ' + (report.title || report.fileName)),
          simpleExplanation: [
            report.extractedText || 'Original clinical report archived in your health vault.',
            'Always consult your physician to interpret clinical findings.'
          ],
          disclaimer: 'This explanation is for informational purposes only. Always consult a qualified healthcare professional.'
        };
      }
    } catch (err) {
      console.error('Explainer error:', err);
    }

    isExplainerLoading = false;
    global.HealthApp.renderCurrentView();
  }

  function bindExplainerEvents(root) {
    const store = global.HealthApp.store;
    const state = store.getState();
    const activeReport = state.reports.find((r) => r.id === state.selectedReportId) || state.reports[0];

    const emptyUpload = root.querySelector('#exp-empty-upload');
    if (emptyUpload) emptyUpload.addEventListener('click', () => store.navigate('upload'));

    const selectEl = root.querySelector('#exp-report-select');
    if (selectEl) {
      selectEl.addEventListener('change', function () {
        const nextId = selectEl.value;
        store.setState({ selectedReportId: nextId });
        const nextRep = store.getState().reports.find((r) => r.id === nextId);
        if (nextRep && !nextRep.aiExplanation && !cachedExplanationMap[nextRep.id]) {
          triggerAiExplain(nextRep);
        }
      });
    }

    const refreshBtn = root.querySelector('#exp-refresh-btn');
    if (refreshBtn && activeReport) {
      refreshBtn.addEventListener('click', () => triggerAiExplain(activeReport));
    }

    const fullBtn = root.querySelector('#exp-fullscreen-btn');
    if (fullBtn && activeReport) {
      fullBtn.addEventListener('click', () => global.HealthApp.modals.openReportPreview(activeReport));
    }

    const compareBtn = root.querySelector('#exp-compare-btn');
    if (compareBtn && activeReport) {
      compareBtn.addEventListener('click', () => {
        store.navigate('compare', { compareReportBId: activeReport.id });
      });
    }

    const copyBtn = root.querySelector('#exp-copy-qs');
    if (copyBtn && activeReport) {
      copyBtn.addEventListener('click', function () {
        const ai = cachedExplanationMap[activeReport.id] || activeReport.aiExplanation || {};
        const text = (ai.questionsToAsk || []).map((q, i) => (i + 1) + '. ' + q).join('\n');
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).catch(() => {});
        }
        global.HealthApp.utils.showToast('Questions copied', 'Ready to paste into your notes or appointment checklist.');
      });
    }

    root.querySelectorAll('[data-save-inquiry-q]').forEach((btn) => {
      btn.addEventListener('click', function () {
        const idx = Number(btn.getAttribute('data-save-inquiry-q'));
        const ai = cachedExplanationMap[activeReport.id] || activeReport.aiExplanation || {};
        const questionText = (ai.questionsToAsk || [])[idx];
        if (!questionText) return;

        const newInquiry = {
          id: 'inq-' + Date.now(),
          subject: 'Question about ' + activeReport.title,
          category: 'Report Clarification',
          referenceProvider: activeReport.hospital,
          relatedReportId: activeReport.id,
          message: questionText,
          submittedDate: '2026-11-11',
          status: 'Pending',
          response: null
        };
        store.setState((s) => ({
          inquiries: [newInquiry, ...s.inquiries]
        }));
        store.addActivity('inquiries', 'Saved doctor question to Healthcare Inquiries');
        global.HealthApp.utils.showToast('Saved to Inquiries', 'Added to your Healthcare Inquiries as Pending.');
      });
    });

    const askAssistant = root.querySelector('#exp-ask-assistant');
    if (askAssistant && activeReport) {
      askAssistant.addEventListener('click', function () {
        const threadId = 'thread-' + Date.now();
        const newThread = {
          id: threadId,
          title: 'Follow-up: ' + activeReport.title,
          attachedReportId: activeReport.id,
          updatedAt: 'Just now',
          messages: [
            {
              id: 'm-' + Date.now(),
              sender: 'ai',
              time: 'Just now',
              text:
                'I have your **' +
                activeReport.title +
                '** (' +
                global.HealthApp.utils.formatDate(activeReport.date) +
                ') attached as context. What part of these results would you like to explore further?'
            }
          ]
        };
        store.setState((s) => ({
          threads: [newThread, ...s.threads],
          activeThreadId: threadId
        }));
        store.navigate('assistant');
      });
    }
  }

  global.HealthApp = global.HealthApp || {};
  global.HealthApp.pages = global.HealthApp.pages || {};
  global.HealthApp.pages.explainer = {
    render: renderExplainerPage,
    bind: bindExplainerEvents
  };
})(window);
