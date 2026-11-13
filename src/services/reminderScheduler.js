/**
 * AI HEALTH RECORDS — Client-Side Medication Reminder Scheduler
 * Checks active reminders on a regular interval and triggers browser
 * desktop notifications and in-app toasts at the scheduled dose time.
 */
(function (global) {
  'use strict';

  let timerId = null;
  const notifiedKeys = new Set();

  function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        Notification.requestPermission();
      } catch (_) {}
    }
  }

  function parseTimeMinutes(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const clean = timeStr.trim();
    // 12-hour format e.g. "08:30 AM", "8:00 pm"
    const match12 = clean.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
    if (match12) {
      let h = parseInt(match12[1], 10);
      const m = parseInt(match12[2], 10);
      const ampm = match12[3].toLowerCase();
      if (ampm === 'pm' && h < 12) h += 12;
      if (ampm === 'am' && h === 12) h = 0;
      return h * 60 + m;
    }

    // 24-hour format e.g. "08:30", "14:15"
    const match24 = clean.match(/^(\d{1,2}):(\d{2})$/);
    if (match24) {
      const h = parseInt(match24[1], 10);
      const m = parseInt(match24[2], 10);
      return h * 60 + m;
    }
    return null;
  }

  function checkDueReminders() {
    if (!global.HealthApp || !global.HealthApp.store) return;
    const state = global.HealthApp.store.getState();
    if (!state.isAuthenticated || !state.reminders || !state.reminders.length) return;

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const todayStr = now.toISOString().slice(0, 10);

    state.reminders.forEach((med) => {
      if (!med.active || med.takenToday) return;
      const scheduledMins = parseTimeMinutes(med.time);
      if (scheduledMins === null) return;

      // Check within a 2-minute window
      const diff = Math.abs(currentMins - scheduledMins);
      if (diff <= 2) {
        const notifyKey = todayStr + '_' + med.id + '_' + scheduledMins;
        if (!notifiedKeys.has(notifyKey)) {
          notifiedKeys.add(notifyKey);

          // 1. In-app toast
          if (global.HealthApp.utils && global.HealthApp.utils.showToast) {
            global.HealthApp.utils.showToast(
              'Medication Reminder',
              'Time to take ' + med.name + ' (' + (med.dosage || 'prescribed dose') + ') · ' + (med.mealInstruction || med.period)
            );
          }

          // 2. Desktop Notification
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('Medication Reminder: ' + med.name, {
                body: 'Time to take ' + med.name + ' (' + med.dosage + '). Scheduled for ' + med.period + ' (' + med.time + ').',
                icon: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 32 32\'%3E%3Crect width=\'32\' height=\'32\' rx=\'8\' fill=\'%23176B55\'/%3E%3Cpath d=\'M16 8v16M8 16h16\' stroke=\'%23FFFFFF\' stroke-width=\'2.8\' stroke-linecap=\'round\'/%3E%3C/svg%3E'
              });
            } catch (_) {}
          }
        }
      }
    });
  }

  function startScheduler() {
    if (timerId) clearInterval(timerId);
    requestNotificationPermission();
    checkDueReminders();
    timerId = setInterval(checkDueReminders, 30000); // Check every 30 seconds
  }

  function stopScheduler() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  global.HealthApp = global.HealthApp || {};
  global.HealthApp.reminderScheduler = {
    start: startScheduler,
    stop: stopScheduler,
    requestPermission: requestNotificationPermission,
    checkNow: checkDueReminders
  };

  // Start scheduler once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startScheduler);
  } else {
    startScheduler();
  }
})(window);
