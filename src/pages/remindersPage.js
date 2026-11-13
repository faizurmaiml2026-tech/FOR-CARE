/**
 * AI HEALTH RECORDS — Daily Medication Planner & Reminders
 */
(function (global) {
  'use strict';

  const PERIODS = ['Morning', 'Afternoon', 'Evening', 'Night'];

  function renderRemindersPage(state) {
    const icons = global.HealthApp.icons;
    const utils = global.HealthApp.utils;
    const reminders = state.reminders || [];
    const active = reminders.filter((r) => r.active);
    const takenCount = active.filter((r) => r.takenToday).length;
    const pct = active.length ? Math.round((takenCount / active.length) * 100) : 0;

    const groupsHtml = PERIODS.map((period) => {
      const items = reminders.filter((r) => r.period === period);
      if (!items.length) return '';

      const cards = items
        .map((m) => {
          const statusBadge = !m.active
            ? '<span class="pill pill-neutral">Paused</span>'
            : m.takenToday
            ? '<span class="pill pill-emerald">' + icons.get('check') + ' Taken</span>'
            : '<span class="pill pill-champagne">Scheduled</span>';

          return (
            '<article class="medicine-card' + (m.takenToday && m.active ? ' taken' : '') + '">' +
              '<div class="medicine-card-top">' +
                '<div>' +
                  '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px;">' +
                    '<span class="medicine-time-badge">' + icons.get('history') + ' ' + utils.escapeHtml(m.time) + '</span>' +
                    statusBadge +
                  '</div>' +
                  '<h3 style="font-size:1.05rem;font-weight:700;color:var(--color-charcoal);">' +
                    utils.escapeHtml(m.name) + ' <span class="tabular-nums" style="color:var(--color-emerald);font-weight:600;">' + utils.escapeHtml(m.dosage) + '</span>' +
                  '</h3>' +
                  '<p style="font-size:0.82rem;color:var(--color-muted);margin-top:3px;">' +
                    utils.escapeHtml(m.frequency) + ' · ' + utils.escapeHtml(m.mealInstruction) +
                  '</p>' +
                '</div>' +
                '<button type="button" class="btn btn-sm ' + (m.takenToday ? 'btn-sage' : 'btn-primary') + '" data-med-toggle="' + m.id + '"' + (!m.active ? ' disabled' : '') + '>' +
                  (m.takenToday ? 'Completed' : 'Mark Taken') +
                '</button>' +
              '</div>' +
              (m.purpose ? '<p style="font-size:0.83rem;color:var(--color-charcoal-soft);">Purpose: ' + utils.escapeHtml(m.purpose) + '</p>' : '') +
              '<div class="medicine-card-footer">' +
                '<span style="font-size:0.76rem;color:var(--color-muted);">' + (m.active ? 'Daily reminder active' : 'Reminder paused') + '</span>' +
                '<div style="display:flex;gap:8px;">' +
                  '<button type="button" class="btn btn-ghost btn-sm" data-med-edit="' + m.id + '">' + icons.get('edit') + ' Edit</button>' +
                  '<button type="button" class="btn btn-ghost btn-sm" data-med-delete="' + m.id + '" style="color:var(--color-terracotta);">' + icons.get('trash') + ' Delete</button>' +
                '</div>' +
              '</div>' +
            '</article>'
          );
        })
        .join('');

      return (
        '<section class="schedule-group">' +
          '<h2 class="schedule-group-header">' +
            '<span style="width:10px;height:10px;border-radius:50%;background:var(--color-emerald);display:inline-block;"></span>' +
            period + ' Schedule' +
          '</h2>' +
          '<div class="medicine-grid">' + cards + '</div>' +
        '</section>'
      );
    }).join('');

    return (
      '<div class="page-view">' +
        '<div class="page-header">' +
          '<div>' +
            '<h1 class="page-title">Medicine Reminders</h1>' +
            '<p class="page-subtitle">Stay consistent with your daily medications and preventive supplements.</p>' +
          '</div>' +
          '<div class="page-header-actions">' +
            '<button type="button" class="btn btn-primary" id="add-reminder-btn">' + icons.get('plus') + ' Add Reminder</button>' +
          '</div>' +
        '</div>' +

        '<div class="card-sage reminders-summary-banner">' +
          '<div style="flex:1;min-width:240px;">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
              '<strong style="color:var(--color-forest);font-size:1rem;">Today’s Adherence</strong>' +
              '<span class="tabular-nums" style="font-weight:700;color:var(--color-forest);">' + takenCount + ' of ' + active.length + ' doses taken (' + pct + '%)</span>' +
            '</div>' +
            '<div class="progress-track" style="margin:0;"><div class="progress-fill" style="width:' + pct + '%;"></div></div>' +
          '</div>' +
          '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
            '<span class="pill pill-emerald">' + active.length + ' Active Reminders</span>' +
            '<button type="button" class="btn btn-secondary btn-sm" id="reset-today-doses-btn">Reset Today’s Checkoffs</button>' +
          '</div>' +
        '</div>' +

        (reminders.length
          ? groupsHtml
          : '<div class="empty-state">' +
              '<div class="empty-state-icon">' + icons.get('pill') + '</div>' +
              '<h3>No medication reminders scheduled</h3>' +
              '<p>Add your prescriptions or daily vitamins to keep your morning and evening schedule organized.</p>' +
              '<button type="button" class="btn btn-primary" id="empty-add-med-btn">Add First Reminder</button>' +
            '</div>') +
      '</div>'
    );
  }

  function openReminderModal(existing) {
    const store = global.HealthApp.store;
    const utils = global.HealthApp.utils;
    const isEdit = Boolean(existing);
    const data = existing || {
      name: '',
      dosage: '',
      frequency: 'Once Daily',
      period: 'Morning',
      time: '08:30 AM',
      mealInstruction: 'With meal',
      purpose: '',
      active: true
    };

    global.HealthApp.modals.open({
      title: isEdit ? 'Edit Medicine Reminder' : 'Add Medicine Reminder',
      subtitle: 'Configure timing and meal notes for your daily routine',
      bodyHtml:
        '<form id="med-modal-form" style="display:flex;flex-direction:column;gap:14px;">' +
          '<div class="form-grid" style="gap:12px;">' +
            '<div class="form-field">' +
              '<label class="form-label" for="m-name">Medicine / Supplement Name</label>' +
              '<input class="input" id="m-name" type="text" value="' + utils.escapeHtml(data.name) + '" placeholder="e.g., Magnesium Glycinate" required />' +
            '</div>' +
            '<div class="form-field">' +
              '<label class="form-label" for="m-dosage">Dosage</label>' +
              '<input class="input" id="m-dosage" type="text" value="' + utils.escapeHtml(data.dosage) + '" placeholder="e.g., 200 mg" required />' +
            '</div>' +
          '</div>' +
          '<div class="form-grid" style="gap:12px;">' +
            '<div class="form-field">' +
              '<label class="form-label" for="m-period">Time of Day</label>' +
              '<select class="select" id="m-period">' +
                PERIODS.map((p) => '<option value="' + p + '"' + (data.period === p ? ' selected' : '') + '>' + p + '</option>').join('') +
              '</select>' +
            '</div>' +
            '<div class="form-field">' +
              '<label class="form-label" for="m-time">Exact Time</label>' +
              '<input class="input" id="m-time" type="text" value="' + utils.escapeHtml(data.time) + '" placeholder="e.g., 08:30 AM" required />' +
            '</div>' +
          '</div>' +
          '<div class="form-grid" style="gap:12px;">' +
            '<div class="form-field">' +
              '<label class="form-label" for="m-freq">Frequency</label>' +
              '<select class="select" id="m-freq">' +
                ['Once Daily', 'Twice Daily', 'Weekly', 'As Needed']
                  .map((fr) => '<option value="' + fr + '"' + (data.frequency === fr ? ' selected' : '') + '>' + fr + '</option>')
                  .join('') +
              '</select>' +
            '</div>' +
            '<div class="form-field">' +
              '<label class="form-label" for="m-meal">Meal Instruction</label>' +
              '<select class="select" id="m-meal">' +
                ['Before meal', 'With breakfast', 'With lunch', 'With dinner', 'With meal', 'Before sleep', 'Anytime']
                  .map((ml) => '<option value="' + ml + '"' + (data.mealInstruction === ml ? ' selected' : '') + '>' + ml + '</option>')
                  .join('') +
              '</select>' +
            '</div>' +
          '</div>' +
          '<div class="form-field">' +
            '<label class="form-label" for="m-purpose">Purpose / Note (Optional)</label>' +
            '<input class="input" id="m-purpose" type="text" value="' + utils.escapeHtml(data.purpose) + '" placeholder="e.g., Sleep & muscle relaxation" />' +
          '</div>' +
          '<div class="pref-row" style="padding:8px 0;border-bottom:none;">' +
            '<strong style="font-size:0.875rem;">Reminder Active</strong>' +
            '<label class="switch"><input type="checkbox" id="m-active"' + (data.active ? ' checked' : '') + ' /><span class="switch-track"></span></label>' +
          '</div>' +
          '<div style="display:flex;justify-content:flex-end;gap:10px;">' +
            '<button type="button" class="btn btn-secondary" id="m-cancel-btn">Cancel</button>' +
            '<button type="submit" class="btn btn-primary">' + (isEdit ? 'Update Reminder' : 'Save Reminder') + '</button>' +
          '</div>' +
        '</form>',
      onMount: function (root, close) {
        root.querySelector('#m-cancel-btn').addEventListener('click', close);
        root.querySelector('#med-modal-form').addEventListener('submit', async function (e) {
          e.preventDefault();
          const state = store.getState();
          const userId = state.profile && state.profile.id;
          const item = {
            id: isEdit ? existing.id : undefined,
            name: root.querySelector('#m-name').value.trim(),
            dosage: root.querySelector('#m-dosage').value.trim(),
            period: root.querySelector('#m-period').value,
            time: root.querySelector('#m-time').value.trim(),
            frequency: root.querySelector('#m-freq').value,
            mealInstruction: root.querySelector('#m-meal').value,
            purpose: root.querySelector('#m-purpose').value.trim(),
            active: root.querySelector('#m-active').checked,
            takenToday: isEdit ? existing.takenToday : false
          };

          try {
            if (userId) {
              await global.HealthApp.snsWebhookService.saveMedicineReminder(userId, item);
              await store.loadUserData(userId);
            }
            store.addActivity('pill', (isEdit ? 'Updated' : 'Added') + ' medication reminder: ' + item.name);
            close();
            global.HealthApp.utils.showToast(isEdit ? 'Reminder updated' : 'Reminder added', item.name + ' scheduled at ' + item.time + '.');
          } catch (err) {
            global.HealthApp.utils.showToast('Error', err.message || 'Unable to save reminder to database.');
          }
        });
      }
    });
  }

  function bindRemindersEvents(root) {
    const store = global.HealthApp.store;

    const addBtn = root.querySelector('#add-reminder-btn');
    const emptyAddBtn = root.querySelector('#empty-add-med-btn');
    [addBtn, emptyAddBtn].forEach((b) => {
      if (b) b.addEventListener('click', () => openReminderModal(null));
    });

    const resetBtn = root.querySelector('#reset-today-doses-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        store.setState((s) => ({
          reminders: s.reminders.map((r) => ({ ...r, takenToday: false }))
        }));
        global.HealthApp.utils.showToast('Schedule reset', 'All reminders ready for a fresh daily checklist.');
      });
    }

    root.querySelectorAll('[data-med-toggle]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-med-toggle');
        const state = store.getState();
        const med = state.reminders.find((r) => r.id === id);
        if (!med) return;
        const nextVal = !med.takenToday;
        store.setState((s) => ({
          reminders: s.reminders.map((r) => (r.id === id ? { ...r, takenToday: nextVal } : r))
        }));
        const userId = state.profile && state.profile.id;
        if (userId) {
          try {
            await global.HealthApp.snsWebhookService.toggleMedicineReminderTaken(userId, id, nextVal);
          } catch (err) {
            console.error('Failed to toggle reminder in DB:', err);
          }
        }
      });
    });

    root.querySelectorAll('[data-med-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const med = store.getState().reminders.find((r) => r.id === btn.getAttribute('data-med-edit'));
        if (med) openReminderModal(med);
      });
    });

    root.querySelectorAll('[data-med-delete]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-med-delete');
        const med = store.getState().reminders.find((r) => r.id === id);
        if (!med) return;
        global.HealthApp.modals.confirm({
          title: 'Delete medication reminder?',
          message: 'Remove "' + med.name + ' (' + med.dosage + ')" from your daily schedule?',
          confirmLabel: 'Delete Reminder',
          variant: 'danger',
          onConfirm: async function () {
            store.setState((s) => ({
              reminders: s.reminders.filter((r) => r.id !== id)
            }));
            const userId = store.getState().profile && store.getState().profile.id;
            if (userId) {
              try {
                await global.HealthApp.snsWebhookService.deleteMedicineReminder(userId, id);
              } catch (err) {
                console.error('Failed to delete reminder from DB:', err);
              }
            }
            global.HealthApp.utils.showToast('Reminder deleted', med.name + ' removed.');
          }
        });
      });
    });
  }

  global.HealthApp = global.HealthApp || {};
  global.HealthApp.pages = global.HealthApp.pages || {};
  global.HealthApp.pages.reminders = {
    render: renderRemindersPage,
    bind: bindRemindersEvents
  };
})(window);
