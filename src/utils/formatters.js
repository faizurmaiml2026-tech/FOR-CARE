/**
 * AI HEALTH RECORDS — Formatting, Escaping & Toast Utilities
 */
(function (global) {
  'use strict';

  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
    if (isNaN(d.getTime())) return escapeHtml(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
  }

  function formatMonthYear(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
    if (isNaN(d.getTime())) return escapeHtml(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  function getInitials(fullName) {
    const parts = String(fullName || 'Patient').trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function formatFileSize(bytes) {
    if (!bytes && bytes !== 0) return '—';
    if (typeof bytes === 'string') return bytes;
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function formatAiRichText(text) {
    const safe = escapeHtml(text || '');
    const withBold = safe.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    const withItalic = withBold.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    return withItalic
      .split('\n\n')
      .map((para) => '<p style="margin-bottom:8px;">' + para.replace(/\n/g, '<br>') + '</p>')
      .join('');
  }

  function showToast(title, message, variant) {
    const container = document.getElementById('toast-stack');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast' + (variant ? ' toast-' + variant : '');
    const iconName = variant === 'error' ? 'alertCircle' : 'checkCircle';
    toast.innerHTML =
      '<div style="margin-top:2px;flex-shrink:0;">' +
      global.HealthApp.icons.get(iconName) +
      '</div>' +
      '<div class="toast-body">' +
      '<div class="toast-title">' + escapeHtml(title) + '</div>' +
      (message ? '<div class="toast-msg">' + escapeHtml(message) + '</div>' : '') +
      '</div>';

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(6px)';
      toast.style.transition = 'opacity 180ms ease, transform 180ms ease';
      setTimeout(() => toast.remove(), 200);
    }, 3400);
  }

  function renderSkeletonBlock(rows) {
    const count = rows || 3;
    let html = '<div class="card"><div class="skeleton skeleton-title"></div>';
    for (let i = 0; i < count; i++) {
      const w = i === count - 1 ? '68%' : i % 2 === 0 ? '96%' : '84%';
      html += '<div class="skeleton skeleton-line" style="width:' + w + '"></div>';
    }
    html += '</div>';
    return html;
  }

  global.HealthApp = global.HealthApp || {};
  global.HealthApp.utils = {
    escapeHtml,
    formatDate,
    formatMonthYear,
    getGreeting,
    getInitials,
    formatFileSize,
    formatAiRichText,
    showToast,
    renderSkeletonBlock
  };
})(window);
