/**
 * AI HEALTH RECORDS — Sophisticated AI Health Assistant Workspace
 */
(function (global) {
  'use strict';

  let isAiThinking = false;

  const SUGGESTED_PROMPTS = [
    'Explain my recent cholesterol and LDL numbers in plain terms',
    'How did my HbA1c and fasting sugar shift since May 2026?',
    'What questions should I ask at my next preventive checkup?',
    'Review my daily Vitamin D3 and Metformin meal timing'
  ];

  function renderAssistantPage(state) {
    const icons = global.HealthApp.icons;
    const utils = global.HealthApp.utils;

    let threads = state.threads || [];
    if (!threads.length) {
      const defaultThread = {
        id: 'thread-default',
        title: 'Health Conversation',
        attachedReportId: (state.reports[0] && state.reports[0].id) || '',
        updatedAt: 'Just now',
        messages: [
          {
            id: 'm-intro',
            sender: 'ai',
            time: 'Just now',
            text: 'Hello. Ask me anything about your saved health records, laboratory values, or questions to prepare for your doctor.\n\n*(Note: This assistant provides educational information only and does not diagnose or prescribe. Always consult your physician.)*'
          }
        ]
      };
      threads = [defaultThread];
    }

    const activeThread = threads.find((t) => t.id === state.activeThreadId) || threads[0];
    const attachedReport = activeThread && activeThread.attachedReportId
      ? state.reports.find((r) => r.id === activeThread.attachedReportId)
      : null;

    const threadsHtml = threads
      .map(
        (t) =>
          '<button type="button" class="thread-btn' + (activeThread && t.id === activeThread.id ? ' active' : '') + '" data-thread-id="' + t.id + '">' +
            '<div class="thread-title">' + utils.escapeHtml(t.title) + '</div>' +
            '<div class="thread-meta">' + utils.escapeHtml(t.updatedAt) + ' · ' + (t.messages ? t.messages.length : 0) + ' messages</div>' +
          '</button>'
      )
      .join('');

    const messagesHtml = (activeThread ? activeThread.messages : [])
      .map((m) => {
        const isUser = m.sender === 'user';
        const avatar = isUser
          ? '<span class="avatar-circle" style="width:32px;height:32px;font-size:0.74rem;">' + utils.escapeHtml(utils.getInitials(state.profile.fullName)) + '</span>'
          : '<span class="brand-mark" style="width:32px;height:32px;border-radius:50%;">' + icons.get('sparkles') + '</span>';

        return (
          '<div class="chat-bubble-row ' + (isUser ? 'user' : 'ai') + '">' +
            avatar +
            '<div class="chat-bubble">' +
              (isUser ? '<div>' + utils.escapeHtml(m.text) + '</div>' : utils.formatAiRichText(m.text)) +
              '<div style="font-size:0.7rem;opacity:0.72;margin-top:6px;">' + utils.escapeHtml(m.time) + '</div>' +
            '</div>' +
          '</div>'
        );
      })
      .join('');

    const thinkingHtml = isAiThinking
      ? '<div class="chat-bubble-row ai">' +
          '<span class="brand-mark" style="width:32px;height:32px;border-radius:50%;">' + icons.get('sparkles') + '</span>' +
          '<div class="chat-bubble" style="display:flex;align-items:center;gap:12px;">' +
            '<div class="typing-dots"><span></span><span></span><span></span></div>' +
            '<span style="font-size:0.84rem;color:var(--color-muted);">Reviewing your records and preparing response...</span>' +
          '</div>' +
        '</div>'
      : '';

    const reportOptions =
      '<option value="">No report attached (General context)</option>' +
      state.reports
        .map(
          (r) =>
            '<option value="' + r.id + '"' + (attachedReport && r.id === attachedReport.id ? ' selected' : '') + '>' +
              utils.escapeHtml(r.title) + ' (' + utils.formatMonthYear(r.date) + ')' +
            '</option>'
        )
        .join('');

    const suggestionsHtml =
      '<div style="margin-top:8px;">' +
        '<div style="font-size:0.74rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--color-muted);margin-bottom:8px;">Suggested Prompts</div>' +
        '<div class="suggested-prompts-grid">' +
          SUGGESTED_PROMPTS.map(
            (prompt) =>
              '<button type="button" class="prompt-card-btn" data-prompt-text="' + utils.escapeHtml(prompt) + '">' +
                utils.escapeHtml(prompt) +
              '</button>'
          ).join('') +
        '</div>' +
      '</div>';

    return (
      '<div class="page-view">' +
        '<div class="page-header" style="margin-bottom:18px;">' +
          '<div>' +
            '<h1 class="page-title">AI Health Assistant</h1>' +
            '<p class="page-subtitle">Ask clear questions about your reports, medication timing, and upcoming appointments.</p>' +
          '</div>' +
          '<span class="ai-identity-badge"><span class="ai-pulse-dot"></span> Patient Education Companion</span>' +
        '</div>' +

        '<div class="assistant-shell">' +
          '<aside class="assistant-threads-panel">' +
            '<button type="button" class="btn btn-primary btn-block" id="new-chat-btn">' + icons.get('plus') + ' New Conversation</button>' +
            '<div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--color-muted);padding:4px 4px 0;">Conversation History</div>' +
            '<div class="threads-list">' + threadsHtml + '</div>' +
          '</aside>' +

          '<section class="assistant-chat-panel">' +
            '<div class="chat-header">' +
              '<div style="min-width:0;">' +
                '<strong style="font-size:0.95rem;color:var(--color-charcoal);display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' +
                  utils.escapeHtml(activeThread ? activeThread.title : 'Health Conversation') +
                '</strong>' +
                '<span style="font-size:0.76rem;color:var(--color-muted);">Responses stay grounded in your selected patient record</span>' +
              '</div>' +
              '<div style="display:flex;align-items:center;gap:8px;min-width:220px;">' +
                '<select class="select" id="assistant-attach-report" style="padding:7px 11px;font-size:0.8rem;" aria-label="Attach report context">' +
                  reportOptions +
                '</select>' +
              '</div>' +
            '</div>' +

            '<div class="chat-messages" id="chat-messages-scroll">' +
              messagesHtml +
              thinkingHtml +
              suggestionsHtml +
            '</div>' +

            '<div class="chat-composer">' +
              '<form id="assistant-chat-form" class="chat-input-box">' +
                '<textarea id="assistant-input" rows="1" placeholder="Ask about a lab value, medical term, or checkup question..."' +
                  (isAiThinking ? ' disabled' : '') + '></textarea>' +
                '<button type="submit" class="btn btn-primary btn-sm" id="assistant-send-btn"' + (isAiThinking ? ' disabled' : '') + '>' +
                  icons.get('send') + ' Send' +
                '</button>' +
              '</form>' +
              '<p style="font-size:0.72rem;color:var(--color-muted);margin-top:8px;">AI Health Assistant helps you understand your records — it does not diagnose or replace your physician.</p>' +
            '</div>' +
          '</section>' +
        '</div>' +
      '</div>'
    );
  }

  async function submitAssistantQuestion(text) {
    const clean = (text || '').trim();
    if (!clean || isAiThinking) return;

    const store = global.HealthApp.store;
    let state = store.getState();
    let activeThread = state.threads.find((t) => t.id === state.activeThreadId) || state.threads[0];
    if (!activeThread) {
      activeThread = {
        id: 'thread-' + Date.now(),
        title: 'Health Conversation',
        attachedReportId: (state.reports[0] && state.reports[0].id) || '',
        updatedAt: 'Just now',
        messages: []
      };
      store.setState((s) => ({
        threads: [activeThread, ...s.threads],
        activeThreadId: activeThread.id
      }), { silent: true });
    }

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { id: 'm-' + Date.now(), sender: 'user', time: nowTime, text: clean };

    const updatedTitle =
      (activeThread.title === 'New Health Conversation' || activeThread.title === 'Health Conversation')
        ? clean.slice(0, 44) + (clean.length > 44 ? '…' : '')
        : activeThread.title;

    store.setState((s) => ({
      threads: s.threads.map((t) =>
        t.id === activeThread.id
          ? { ...t, title: updatedTitle, updatedAt: 'Just now', messages: [...t.messages, userMsg] }
          : t
      )
    }));

    isAiThinking = true;
    global.HealthApp.renderCurrentView();
    scrollChatBottom();

    const attachedReport = activeThread.attachedReportId
      ? store.getState().reports.find((r) => r.id === activeThread.attachedReportId)
      : null;

    const res = await global.HealthApp.snsWebhookService.sendAssistantMessage({
      threadId: activeThread.id,
      message: clean,
      userId: store.getState().profile.id,
      attachedReport
    });

    isAiThinking = false;
    let replyText = res.ok && res.data && res.data.reply
      ? res.data.reply
      : (res.error || 'I am currently unable to process this request. Please try asking again.');

    if (!replyText.includes('informational') && !replyText.includes('consult')) {
      replyText += '\n\n*(Note: This information is for educational purposes only. Always consult a qualified healthcare professional.)*';
    }

    const aiMsg = {
      id: 'm-' + (Date.now() + 1),
      sender: 'ai',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: replyText
    };

    store.setState((s) => ({
      threads: s.threads.map((t) =>
        t.id === activeThread.id
          ? { ...t, updatedAt: 'Just now', messages: [...t.messages, aiMsg] }
          : t
      )
    }));
    scrollChatBottom();
  }

  function scrollChatBottom() {
    setTimeout(() => {
      const box = document.getElementById('chat-messages-scroll');
      if (box) box.scrollTop = box.scrollHeight;
    }, 30);
  }

  function bindAssistantEvents(root) {
    const store = global.HealthApp.store;

    const newBtn = root.querySelector('#new-chat-btn');
    if (newBtn) {
      newBtn.addEventListener('click', () => {
        const id = 'thread-' + Date.now();
        const fresh = {
          id,
          title: 'New Health Conversation',
          attachedReportId: store.getState().reports[0] ? store.getState().reports[0].id : '',
          updatedAt: 'Just now',
          messages: [
            {
              id: 'm-' + Date.now(),
              sender: 'ai',
              time: 'Just now',
              text: 'Hello ' + store.getState().profile.firstName + '. Ask me anything about your lab panels, medical terminology, or questions you’d like to prepare for your doctor.'
            }
          ]
        };
        store.setState((s) => ({
          threads: [fresh, ...s.threads],
          activeThreadId: id
        }));
      });
    }

    root.querySelectorAll('[data-thread-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        store.setState({ activeThreadId: btn.getAttribute('data-thread-id') });
      });
    });

    const attachSelect = root.querySelector('#assistant-attach-report');
    if (attachSelect) {
      attachSelect.addEventListener('change', () => {
        const activeId = store.getState().activeThreadId;
        store.setState((s) => ({
          threads: s.threads.map((t) => (t.id === activeId ? { ...t, attachedReportId: attachSelect.value } : t))
        }));
      });
    }

    root.querySelectorAll('[data-prompt-text]').forEach((btn) => {
      btn.addEventListener('click', () => {
        submitAssistantQuestion(btn.getAttribute('data-prompt-text'));
      });
    });

    const form = root.querySelector('#assistant-chat-form');
    const textarea = root.querySelector('#assistant-input');
    if (form && textarea) {
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          submitAssistantQuestion(textarea.value);
        }
      });
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        submitAssistantQuestion(textarea.value);
      });
    }

    scrollChatBottom();
  }

  global.HealthApp = global.HealthApp || {};
  global.HealthApp.pages = global.HealthApp.pages || {};
  global.HealthApp.pages.assistant = {
    render: renderAssistantPage,
    bind: bindAssistantEvents
  };
})(window);
