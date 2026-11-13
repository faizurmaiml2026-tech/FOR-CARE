/**
 * AI HEALTH RECORDS — Reactive Application State Store
 * --------------------------------------------------------------------------
 * Pure patient data store connected to Supabase.
 * Strictly no demo or dummy data.
 */
(function (global) {
  'use strict';

  const listeners = new Set();

  function createBlankProfile() {
    return {
      id: '',
      fullName: 'Patient',
      firstName: 'Patient',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      age: '—',
      bloodGroup: '—',
      city: '',
      height: '—',
      weight: '—',
      emergencyContact: { name: '', phone: '' },
      allergies: [],
      focusAreas: []
    };
  }

  function createInitialState() {
    return {
      isAuthenticated: false,
      authMode: 'login',
      currentPage: 'dashboard',
      sidebarCollapsed: false,
      mobileMenuOpen: false,

      profile: createBlankProfile(),
      reports: [],
      history: [],
      reminders: [],
      inquiries: [],
      threads: [],
      notifications: [],
      recentActivity: [],
      settings: {
        notifications: { email: true, push: false, reminders: true },
        privacy: { localSessionPersistence: true, shareWithDoctor: false }
      },

      selectedReportId: null,
      compareReportAId: null,
      compareReportBId: null,
      activeThreadId: null,

      recordsFilter: {
        search: '',
        category: 'All',
        year: 'All',
        sort: 'newest',
        viewMode: 'grid'
      },
      historyFilter: {
        category: 'All',
        year: 'All'
      },
      inquiryFilter: 'All',
      settingsTab: 'notifications'
    };
  }

  let state = null;

  function ensureState() {
    if (!state) state = createInitialState();
    return state;
  }

  function notify() {
    listeners.forEach((fn) => {
      try {
        fn(ensureState());
      } catch (err) {
        console.error('State subscriber error:', err);
      }
    });
  }

  function getState() {
    return ensureState();
  }

  function setState(updater, options) {
    const current = ensureState();
    const patch = typeof updater === 'function' ? updater(current) : updater;
    Object.assign(current, patch);
    if (!options || !options.silent) {
      notify();
    }
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function navigate(pageId, extra) {
    setState((s) => ({
      currentPage: pageId,
      mobileMenuOpen: false,
      ...(extra || {})
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function addActivity(icon, text) {
    const s = ensureState();
    s.recentActivity.unshift({
      id: 'act-' + Date.now(),
      icon: icon || 'sparkles',
      text,
      time: 'Just now'
    });
    if (s.recentActivity.length > 12) s.recentActivity.length = 12;
    notify();
  }

  async function loadUserData(userId) {
    if (!userId || !global.HealthApp.snsWebhookService) return;
    try {
      const data = await global.HealthApp.snsWebhookService.fetchAllUserData(userId);
      const s = ensureState();

      // Build history items directly from saved reports
      const historyList = (data.reports || []).map((r) => ({
        id: 'hist-' + r.id,
        date: r.date,
        category: r.category || 'Lab Work',
        title: r.title,
        hospital: r.hospital,
        summary: r.aiExplanation ? (r.aiExplanation.overview || r.aiExplanation.simpleExplanation[0] || 'Report indexed.') : 'Uploaded and archived report.',
        reportId: r.id
      }));

      // Profile details
      let profObj = s.profile;
      if (data.profile) {
        const p = data.profile;
        const nameParts = (p.name || s.profile.fullName || 'Patient').trim().split(/\s+/);
        let ageStr = '—';
        if (p.date_of_birth) {
          const birthYear = new Date(p.date_of_birth).getFullYear();
          const currYear = new Date().getFullYear();
          if (!isNaN(birthYear) && birthYear > 1900) {
            ageStr = String(currYear - birthYear);
          }
        }
        profObj = {
          id: p.id,
          fullName: p.name || s.profile.fullName,
          firstName: nameParts[0] || 'Patient',
          lastName: nameParts.slice(1).join(' '),
          email: p.email || s.profile.email,
          phone: p.phone || '',
          dateOfBirth: p.date_of_birth || '',
          age: ageStr,
          bloodGroup: p.blood_group || '—',
          city: p.city || '',
          height: p.height || '—',
          weight: p.weight || '—',
          emergencyContact: {
            name: p.emergency_contact_name || '',
            phone: p.emergency_contact_phone || ''
          },
          allergies: Array.isArray(p.allergies) ? p.allergies : [],
          focusAreas: []
        };
      }

      const activeRepId = s.selectedReportId || (data.reports.length ? data.reports[0].id : null);
      const repA = s.compareReportAId || (data.reports.length > 1 ? data.reports[1].id : (data.reports[0] ? data.reports[0].id : null));
      const repB = s.compareReportBId || (data.reports.length ? data.reports[0].id : null);

      // Generate live notifications based strictly on user's active due doses and pending inquiries
      const notifs = [];
      (data.reminders || []).filter((m) => m.active && !m.takenToday).forEach((m) => {
        notifs.push({
          id: 'notif-med-' + m.id,
          title: 'Dose Due: ' + m.name,
          detail: (m.dosage || 'Prescribed dose') + ' scheduled for ' + m.period + ' (' + (m.time || 'Today') + ')',
          time: m.time || 'Today',
          unread: true,
          targetPage: 'reminders'
        });
      });
      (data.inquiries || []).filter((i) => i.status === 'Pending').forEach((i) => {
        notifs.push({
          id: 'notif-inq-' + i.id,
          title: 'Inquiry Pending: ' + i.subject,
          detail: 'Submitted to Care Team · ' + i.category,
          time: i.submittedDate || 'Recent',
          unread: true,
          targetPage: 'inquiries'
        });
      });

      setState({
        profile: profObj,
        reports: data.reports,
        history: historyList,
        reminders: data.reminders,
        inquiries: data.inquiries,
        notifications: notifs,
        selectedReportId: activeRepId,
        compareReportAId: repA,
        compareReportBId: repB
      });
    } catch (err) {
      console.error('Error loading user data from Supabase:', err);
    }
  }

  function clearUserData() {
    state = createInitialState();
    notify();
  }

  global.HealthApp = global.HealthApp || {};
  global.HealthApp.store = {
    getState,
    setState,
    subscribe,
    navigate,
    addActivity,
    loadUserData,
    clearUserData
  };
})(window);
