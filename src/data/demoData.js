/**
 * AI HEALTH RECORDS — Patient Data Model Templates
 * --------------------------------------------------------------------------
 * Strictly empty templates. No demo or dummy data.
 * All real patient data loads directly from connected Supabase tables.
 */
(function (global) {
  'use strict';

  const emptyProfile = {
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

  const emptySettings = {
    notifications: {
      emailAlerts: true,
      pushAlerts: false,
      dailyReminders: true,
      inquiryUpdates: true,
      weeklyDigest: false,
      quietHoursEnabled: true,
      quietHoursRange: '10:30 PM – 07:00 AM'
    },
    privacy: {
      aiContextAccess: true,
      localSessionPersistence: true,
      twoFactorAuth: false,
      summaryLinkExpiryDays: '7 Days'
    }
  };

  global.HealthApp = global.HealthApp || {};
  global.HealthApp.demoData = {
    patientProfile: emptyProfile,
    medicalReports: [],
    healthHistory: [],
    medicineReminders: [],
    healthcareInquiries: [],
    assistantThreads: [],
    notifications: [],
    recentActivity: [],
    settings: emptySettings
  };
})(window);
