/**
 * AI HEALTH RECORDS — Custom SVG Data Visualizations
 * Strictly uses Deep Emerald, Dark Forest, Soft Sage, Champagne, and Neutrals.
 */
(function (global) {
  'use strict';

  const CATEGORY_PALETTE = [
    '#176B55', // Deep Emerald
    '#123F34', // Dark Forest
    '#D6BE91', // Champagne Accent
    '#8EA894', // Muted Sage Green
    '#858B84', // Muted Grey
    '#4A5E54'  // Deep Slate Sage
  ];

  function renderCategoryDonut(reports) {
    const counts = {};
    (reports || []).forEach((r) => {
      const cat = r.category || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const total = (reports || []).length || 1;

    const size = 176;
    const cx = size / 2;
    const cy = size / 2;
    const r = 64;
    const circumference = 2 * Math.PI * r;

    let cumulativeOffset = 0;
    const segmentsHtml = entries
      .map((entry, idx) => {
        const count = entry[1];
        const fraction = count / total;
        const dash = fraction * circumference;
        const gap = circumference - dash;
        const color = CATEGORY_PALETTE[idx % CATEGORY_PALETTE.length];
        const offset = -cumulativeOffset;
        cumulativeOffset += dash;

        return (
          '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" ' +
          'fill="none" stroke="' + color + '" stroke-width="18" ' +
          'stroke-dasharray="' + dash.toFixed(2) + ' ' + gap.toFixed(2) + '" ' +
          'stroke-dashoffset="' + offset.toFixed(2) + '" ' +
          'transform="rotate(-90 ' + cx + ' ' + cy + ')" ' +
          'style="transition: stroke-dasharray 300ms ease;"></circle>'
        );
      })
      .join('');

    const legendHtml = entries
      .map((entry, idx) => {
        const cat = entry[0];
        const count = entry[1];
        const pct = Math.round((count / total) * 100);
        const color = CATEGORY_PALETTE[idx % CATEGORY_PALETTE.length];
        return (
          '<div class="chart-legend-row">' +
            '<div class="legend-left">' +
              '<span class="legend-swatch" style="background:' + color + ';"></span>' +
              '<span style="color:var(--color-charcoal);font-weight:500;">' + global.HealthApp.utils.escapeHtml(cat) + '</span>' +
            '</div>' +
            '<span class="tabular-nums" style="color:var(--color-muted);font-weight:600;">' + count + ' (' + pct + '%)</span>' +
          '</div>'
        );
      })
      .join('');

    return (
      '<div class="chart-split">' +
        '<div style="position:relative;width:' + size + 'px;height:' + size + 'px;flex-shrink:0;margin:0 auto;">' +
          '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" aria-label="Report category breakdown">' +
            '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="#EEF4EF" stroke-width="18"></circle>' +
            segmentsHtml +
          '</svg>' +
          '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;">' +
            '<strong class="tabular-nums" style="font-size:1.55rem;line-height:1;color:var(--color-charcoal);">' + (reports || []).length + '</strong>' +
            '<span style="font-size:0.72rem;color:var(--color-muted);margin-top:4px;">Records</span>' +
          '</div>' +
        '</div>' +
        '<div class="chart-legend">' + legendHtml + '</div>' +
      '</div>'
    );
  }

  function renderComparisonBarChart(rows, labelA, labelB) {
    const utils = global.HealthApp.utils;
    if (!rows || !rows.length) {
      return (
        '<div class="empty-state" style="padding:28px 18px;">' +
          '<p style="margin:0;">Select two reports with matching numerical biomarkers to visualize side-by-side differences.</p>' +
        '</div>'
      );
    }

    const barsHtml = rows
      .map((row) => {
        const valA = Number(row.a.numericValue) || 0;
        const valB = Number(row.b.numericValue) || 0;
        const ceiling = Math.max(valA, valB, row.a.rangeMax || 0, 1) * 1.15;
        const pctA = Math.min(100, Math.max(4, (valA / ceiling) * 100));
        const pctB = Math.min(100, Math.max(4, (valB / ceiling) * 100));

        return (
          '<div style="padding:12px 14px;border-radius:var(--radius-md);background:var(--color-ivory-elevated);border:1px solid var(--color-border);">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px;">' +
              '<strong style="font-size:0.875rem;color:var(--color-charcoal);">' + utils.escapeHtml(row.name) + '</strong>' +
              '<span class="tabular-nums" style="font-size:0.78rem;color:var(--color-muted);">Ref: ' + utils.escapeHtml(row.a.referenceRange) + '</span>' +
            '</div>' +
            '<div style="display:flex;flex-direction:column;gap:7px;">' +
              '<div style="display:grid;grid-template-columns:110px 1fr 78px;align-items:center;gap:10px;">' +
                '<span style="font-size:0.74rem;color:var(--color-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + utils.escapeHtml(labelA) + '</span>' +
                '<div style="height:10px;background:#EAECE5;border-radius:999px;overflow:hidden;">' +
                  '<div style="height:100%;width:' + pctA.toFixed(1) + '%;background:#D6BE91;border-radius:999px;transition:width 320ms ease;"></div>' +
                '</div>' +
                '<span class="tabular-nums" style="font-size:0.78rem;font-weight:600;text-align:right;color:var(--color-charcoal);">' + utils.escapeHtml(row.a.value) + '</span>' +
              '</div>' +
              '<div style="display:grid;grid-template-columns:110px 1fr 78px;align-items:center;gap:10px;">' +
                '<span style="font-size:0.74rem;color:var(--color-forest);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + utils.escapeHtml(labelB) + '</span>' +
                '<div style="height:10px;background:#EAECE5;border-radius:999px;overflow:hidden;">' +
                  '<div style="height:100%;width:' + pctB.toFixed(1) + '%;background:#176B55;border-radius:999px;transition:width 320ms ease;"></div>' +
                '</div>' +
                '<span class="tabular-nums" style="font-size:0.78rem;font-weight:700;text-align:right;color:var(--color-forest);">' + utils.escapeHtml(row.b.value) + '</span>' +
              '</div>' +
            '</div>' +
          '</div>'
        );
      })
      .join('');

    return (
      '<div>' +
        '<div style="display:flex;align-items:center;gap:18px;margin-bottom:14px;font-size:0.78rem;">' +
          '<span style="display:inline-flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;border-radius:3px;background:#D6BE91;display:inline-block;"></span>' + utils.escapeHtml(labelA) + '</span>' +
          '<span style="display:inline-flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;border-radius:3px;background:#176B55;display:inline-block;"></span>' + utils.escapeHtml(labelB) + '</span>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;gap:10px;">' + barsHtml + '</div>' +
      '</div>'
    );
  }

  global.HealthApp = global.HealthApp || {};
  global.HealthApp.charts = {
    renderCategoryDonut,
    renderComparisonBarChart
  };
})(window);
