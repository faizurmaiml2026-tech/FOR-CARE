/**
 * AI HEALTH RECORDS — Self-Contained Local Client Data & Intelligence Service
 * --------------------------------------------------------------------------
 * Completely self-contained in-browser architecture:
 * 1. Storage: Native IndexedDB per authenticated user ID (`AIHealthRecordsDB_${userId}`).
 *    Stores reports, raw PDF file blobs, AI explanations, medicine reminders, inquiries,
 *    and patient profile details with 100% per-user data isolation.
 * 2. PDF Processing: Local text extraction using Mozilla pdf.js (no network/CDN).
 * 3. Clinical Intelligence: Built-in rule-based clinical engine (clinicalEngine.js)
 *    evaluating lab values against standard reference ranges, writing plain-English
 *    summaries, comparing tests, and answering patient questions.
 * 4. Zero dependencies on external database tables, cloud storage buckets, or webhooks.
 *
 * Strict Rules:
 * - No demo or dummy data.
 * - Never diagnoses or prescribes. Always attaches informational medical disclaimer.
 */
(function (global) {
  'use strict';

  const MEDICAL_DISCLAIMER = 'This explanation is for informational purposes only. Always consult a qualified healthcare professional. Do not self-diagnose or change treatments based on this summary.';
  const IDB_VERSION = 1;

  // =========================================================================
  // 1. INDEXEDDB PERSISTENCE PER AUTHENTICATED USER
  // =========================================================================

  function openUserDatabase(userId) {
    return new Promise((resolve) => {
      if (!window.indexedDB) {
        console.warn('IndexedDB not available in current window.');
        return resolve(null);
      }
      const safeId = (userId || 'guest_user').replace(/[^a-zA-Z0-9_-]/g, '_');
      const dbName = 'AIHealthRecordsDB_' + safeId;
      const req = window.indexedDB.open(dbName, IDB_VERSION);

      req.onupgradeneeded = function (event) {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('profiles')) {
          db.createObjectStore('profiles', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('health_records')) {
          db.createObjectStore('health_records', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('ai_explanations')) {
          db.createObjectStore('ai_explanations', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('medicine_reminders')) {
          db.createObjectStore('medicine_reminders', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('healthcare_inquiries')) {
          db.createObjectStore('healthcare_inquiries', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'id' });
        }
      };

      req.onsuccess = function (event) {
        resolve(event.target.result);
      };

      req.onerror = function (event) {
        console.error('IndexedDB open error:', event.target.error);
        resolve(null);
      };
    });
  }

  function idbGetAll(db, storeName) {
    return new Promise((resolve) => {
      if (!db || !db.objectStoreNames.contains(storeName)) return resolve([]);
      try {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch (_) {
        resolve([]);
      }
    });
  }

  function idbGet(db, storeName, key) {
    return new Promise((resolve) => {
      if (!db || !db.objectStoreNames.contains(storeName)) return resolve(null);
      try {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch (_) {
        resolve(null);
      }
    });
  }

  function idbPut(db, storeName, item) {
    return new Promise((resolve) => {
      if (!db || !db.objectStoreNames.contains(storeName)) return resolve(item);
      try {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(item);
        req.onsuccess = () => resolve(item);
        req.onerror = (e) => {
          console.error('IndexedDB put error on ' + storeName, e);
          resolve(item);
        };
      } catch (_) {
        resolve(item);
      }
    });
  }

  function idbDelete(db, storeName, key) {
    return new Promise((resolve) => {
      if (!db || !db.objectStoreNames.contains(storeName)) return resolve(true);
      try {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.delete(key);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      } catch (_) {
        resolve(false);
      }
    });
  }

  // =========================================================================
  // 2. DATA SERVICE METHODS (All Self-Contained in Browser)
  // =========================================================================

  async function fetchAllUserData(userId) {
    if (!userId) {
      return { profile: null, reports: [], reminders: [], inquiries: [] };
    }

    const db = await openUserDatabase(userId);
    if (!db) {
      return { profile: null, reports: [], reminders: [], inquiries: [] };
    }

    const [idbProfile, idbRecords, idbAiList, idbReminders, idbInquiries, idbFiles] = await Promise.all([
      idbGet(db, 'profiles', userId),
      idbGetAll(db, 'health_records'),
      idbGetAll(db, 'ai_explanations'),
      idbGetAll(db, 'medicine_reminders'),
      idbGetAll(db, 'healthcare_inquiries'),
      idbGetAll(db, 'files')
    ]);

    // Map stored file blobs to instant object URLs
    const fileUrlMap = {};
    (idbFiles || []).forEach((f) => {
      if (f && f.blob) {
        try {
          fileUrlMap[f.id] = URL.createObjectURL(f.blob);
        } catch (_) {}
      }
    });

    // Map AI explanations by record ID
    const aiMap = {};
    (idbAiList || []).forEach((ai) => {
      if (ai && (ai.record_id || ai.id)) {
        aiMap[ai.record_id || ai.id] = ai;
      }
    });

    // Sort reports chronologically by date descending
    const rawRecords = (idbRecords || []).slice();
    rawRecords.sort((a, b) => new Date(b.record_date || b.created_at || 0) - new Date(a.record_date || a.created_at || 0));

    const reports = rawRecords.map((r) => {
      const ai = aiMap[r.id] || null;
      const fileUrl = fileUrlMap[r.id] || r.file_url || '';
      return {
        id: r.id,
        fileName: r.file_name,
        title: r.title || r.file_name,
        category: r.category || 'Other',
        hospital: r.hospital || 'Personal Upload',
        date: r.record_date || (r.created_at ? r.created_at.slice(0, 10) : ''),
        status: r.status || 'ready',
        link: fileUrl,
        summaryUrl: r.summary_url || '',
        fileUrl: fileUrl,
        fileSize: r.file_size || 0,
        extractedText: r.extracted_text || '',
        metrics: (ai && ai.markers) || [],
        aiExplanation: ai ? {
          overview: ai.overview || 'AI summary of the uploaded report.',
          simpleExplanation: Array.isArray(ai.simple_explanation)
            ? ai.simple_explanation
            : [ai.simple_explanation || 'Report reviewed and archived in vault.'],
          markers: ai.markers || [],
          disclaimer: ai.disclaimer || MEDICAL_DISCLAIMER
        } : null
      };
    });

    const reminders = (idbReminders || []).map((m) => ({
      id: m.id,
      name: m.name,
      dosage: m.dosage || '',
      frequency: m.frequency || '',
      period: m.period || 'Morning',
      time: m.time || '',
      mealInstruction: m.meal_instruction || '',
      purpose: m.purpose || '',
      active: Boolean(m.active),
      takenToday: Boolean(m.taken_today)
    }));

    const rawInquiries = (idbInquiries || []).slice();
    rawInquiries.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    const inquiries = rawInquiries.map((i) => ({
      id: i.id,
      subject: i.subject,
      category: i.category || 'General',
      referenceProvider: i.reference_provider || '',
      message: i.message,
      status: i.status || 'Pending',
      submittedDate: i.created_at ? i.created_at.slice(0, 10) : '',
      response: i.response_text ? {
        authorNote: 'Care Team Response',
        respondedDate: i.response_date ? i.response_date.slice(0, 10) : '',
        text: i.response_text
      } : null,
      relatedReportId: i.related_record_id
    }));

    return {
      profile: idbProfile || null,
      reports,
      reminders,
      inquiries
    };
  }

  async function deleteHealthRecord(userId, recordId) {
    if (!userId || !recordId) return false;
    const db = await openUserDatabase(userId);
    if (!db) return false;

    await Promise.all([
      idbDelete(db, 'health_records', recordId),
      idbDelete(db, 'ai_explanations', 'ai_' + recordId),
      idbDelete(db, 'ai_explanations', recordId),
      idbDelete(db, 'files', recordId)
    ]);
    return true;
  }

  async function saveHealthRecord(userId, recordData) {
    if (!userId || !recordData) throw new Error('Not authenticated');
    const db = await openUserDatabase(userId);
    if (!db) throw new Error('Database unavailable');

    const id = recordData.id || 'rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const row = {
      id: id,
      user_id: userId,
      file_name: recordData.fileName || 'Milestone Note',
      title: recordData.title || 'Milestone Note',
      category: recordData.category || 'Consultation',
      hospital: recordData.hospital || 'Personal Milestone',
      record_date: recordData.date || new Date().toISOString().slice(0, 10),
      file_url: recordData.fileUrl || '',
      file_size: recordData.fileSize || 0,
      status: 'ready',
      summary_url: recordData.summaryUrl || '',
      extracted_text: recordData.extractedText || recordData.summary || '',
      created_at: new Date().toISOString()
    };

    await idbPut(db, 'health_records', row);
    return row;
  }

  async function fetchAiExplanation(userId, recordId) {
    if (!recordId) return null;
    const db = await openUserDatabase(userId);
    if (!db) return null;

    const allAi = await idbGetAll(db, 'ai_explanations');
    const found = allAi.find((a) => a.record_id === recordId || a.id === 'ai_' + recordId || a.id === recordId);
    if (found) {
      return {
        overview: found.overview || 'Report summary',
        simpleExplanation: Array.isArray(found.simple_explanation)
          ? found.simple_explanation
          : [found.simple_explanation || 'Report reviewed and archived in vault.'],
        markers: found.markers || [],
        disclaimer: found.disclaimer || MEDICAL_DISCLAIMER
      };
    }

    // If not found in AI explanations table, check if record has extracted text and analyze on the fly
    const rec = await idbGet(db, 'health_records', recordId);
    if (rec && rec.extracted_text && global.HealthApp.clinicalEngine) {
      const generated = global.HealthApp.clinicalEngine.analyzeReportText(rec.extracted_text, rec.category, rec.title);
      return generated;
    }

    return null;
  }

  async function saveMedicineReminder(userId, reminder) {
    if (!userId || !reminder) throw new Error('Not authenticated');
    const db = await openUserDatabase(userId);
    if (!db) throw new Error('Database unavailable');

    const id = reminder.id && !String(reminder.id).startsWith('med-temp-')
      ? reminder.id
      : 'med_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

    const row = {
      id: id,
      user_id: userId,
      name: reminder.name,
      dosage: reminder.dosage || '',
      frequency: reminder.frequency || '',
      period: reminder.period || 'Morning',
      time: reminder.time || '',
      meal_instruction: reminder.mealInstruction || '',
      purpose: reminder.purpose || '',
      active: reminder.active !== false,
      taken_today: Boolean(reminder.takenToday),
      created_at: new Date().toISOString()
    };

    await idbPut(db, 'medicine_reminders', row);
    return row;
  }

  async function deleteMedicineReminder(userId, reminderId) {
    if (!userId || !reminderId) return false;
    const db = await openUserDatabase(userId);
    if (!db) return false;
    await idbDelete(db, 'medicine_reminders', reminderId);
    return true;
  }

  async function toggleMedicineReminderTaken(userId, reminderId, takenToday) {
    if (!userId || !reminderId) return null;
    const db = await openUserDatabase(userId);
    if (!db) return null;

    const existing = await idbGet(db, 'medicine_reminders', reminderId);
    if (existing) {
      existing.taken_today = Boolean(takenToday);
      existing.last_taken_date = takenToday ? new Date().toISOString().slice(0, 10) : null;
      await idbPut(db, 'medicine_reminders', existing);
      return existing;
    }
    return null;
  }

  async function submitHealthcareInquiry(userId, inquiry) {
    if (!userId || !inquiry) throw new Error('Not authenticated');
    const db = await openUserDatabase(userId);
    if (!db) throw new Error('Database unavailable');

    const id = 'inq_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const row = {
      id: id,
      user_id: userId,
      related_record_id: inquiry.relatedReportId || null,
      subject: inquiry.subject,
      category: inquiry.category || 'General',
      reference_provider: inquiry.referenceProvider || '',
      message: inquiry.message,
      status: 'Pending',
      created_at: new Date().toISOString()
    };

    await idbPut(db, 'healthcare_inquiries', row);
    return row;
  }

  async function updatePatientProfile(userId, profileData) {
    if (!userId || !profileData) throw new Error('Not authenticated');
    const db = await openUserDatabase(userId);
    if (!db) throw new Error('Database unavailable');

    const row = {
      id: userId,
      user_id: userId,
      name: profileData.fullName || profileData.name || '',
      email: profileData.email || '',
      phone: profileData.phone || '',
      date_of_birth: profileData.dateOfBirth || null,
      blood_group: profileData.bloodGroup || '',
      city: profileData.city || '',
      height: profileData.height || '',
      weight: profileData.weight || '',
      emergency_contact_name: (profileData.emergencyContact && profileData.emergencyContact.name) || '',
      emergency_contact_phone: (profileData.emergencyContact && profileData.emergencyContact.phone) || '',
      allergies: profileData.allergies || [],
      updated_at: new Date().toISOString()
    };

    await idbPut(db, 'profiles', row);
    return row;
  }

  // =========================================================================
  // 3. WORKFLOWS: UPLOAD, COMPARE, ASSISTANT (In-Browser Execution)
  // =========================================================================

  /**
   * Upload Report Workflow:
   * 1. Validates PDF file and size (max 10 MB).
   * 2. Extracts digital text using local pdf.js.
   * 3. Analyzes biomarkers and generates plain-English explanation via clinicalEngine.js.
   * 4. Persists the PDF blob and record into IndexedDB.
   */
  async function uploadReportWorkflow(payload) {
    const userId = payload.userId;
    const file = payload.file;
    const title = (payload.title || (file && file.name) || 'Medical Report').trim();
    const category = payload.category || 'Blood Work';
    const hospital = (payload.hospital || 'Personal Upload').trim();
    const date = payload.date || new Date().toISOString().slice(0, 10);
    const autoExplain = payload.autoExplain !== false;

    if (!userId) {
      return { ok: false, error: 'User session not active. Please sign in again.' };
    }
    if (!file) {
      return { ok: false, error: 'No PDF file selected for upload.' };
    }
    if (file.size > 10 * 1024 * 1024) {
      return { ok: false, error: 'File size exceeds 10 MB limit. Please select a smaller PDF file.' };
    }

    const db = await openUserDatabase(userId);
    if (!db) {
      return { ok: false, error: 'Unable to open secure local database.' };
    }

    const recordId = 'rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 7);

    // Step 1: Extract text locally via pdfExtractor
    let extractedText = '';
    let isScanned = false;
    if (global.HealthApp.pdfExtractor) {
      const pdfResult = await global.HealthApp.pdfExtractor.extractText(file);
      if (!pdfResult.success) {
        return { ok: false, error: pdfResult.error || 'Unable to read PDF file format.' };
      }
      extractedText = pdfResult.text || '';
      isScanned = Boolean(pdfResult.isScanned);
    }

    // Step 2: Generate Clinical AI Explanation locally
    let explanation = null;
    if (autoExplain && global.HealthApp.clinicalEngine) {
      explanation = global.HealthApp.clinicalEngine.analyzeReportText(extractedText, category, title);
    } else {
      explanation = {
        overview: title + ' archived in vault.',
        simpleExplanation: ['Document saved to your personal records.'],
        markers: [],
        disclaimer: MEDICAL_DISCLAIMER
      };
    }

    // Step 3: Store File Blob in IndexedDB
    let localBlobUrl = '';
    try {
      await idbPut(db, 'files', {
        id: recordId,
        name: file.name,
        type: file.type || 'application/pdf',
        size: file.size,
        blob: file
      });
      localBlobUrl = URL.createObjectURL(file);
    } catch (fErr) {
      console.warn('Failed to store file blob in IndexedDB:', fErr);
    }

    // Step 4: Store Health Record in IndexedDB
    const recordRow = {
      id: recordId,
      user_id: userId,
      file_name: file.name,
      title: title,
      category: category,
      hospital: hospital,
      record_date: date,
      file_url: localBlobUrl,
      file_size: file.size,
      status: 'ready',
      summary_url: '',
      extracted_text: extractedText,
      created_at: new Date().toISOString()
    };
    await idbPut(db, 'health_records', recordRow);

    // Step 5: Store AI Explanation in IndexedDB
    if (explanation) {
      const aiRow = {
        id: 'ai_' + recordId,
        user_id: userId,
        record_id: recordId,
        overview: explanation.overview,
        simple_explanation: explanation.simpleExplanation,
        markers: explanation.markers || [],
        disclaimer: explanation.disclaimer || MEDICAL_DISCLAIMER,
        created_at: new Date().toISOString()
      };
      await idbPut(db, 'ai_explanations', aiRow);
    }

    return {
      ok: true,
      data: {
        recordId: recordId,
        summaryLink: '',
        explanation: explanation,
        fileUrl: localBlobUrl
      }
    };
  }

  /**
   * Compare Reports Workflow:
   * Compares two user-selected reports and returns side-by-side metric shifts.
   */
  async function compareReportsWorkflow(reportA, reportB, userId) {
    if (!reportA || !reportB) {
      return { ok: false, error: 'Please choose two reports to compare.' };
    }

    if (!global.HealthApp.clinicalEngine) {
      return { ok: false, error: 'Clinical comparison engine unavailable.' };
    }

    const res = global.HealthApp.clinicalEngine.compareTwoReports(reportA, reportB);
    return {
      ok: true,
      data: {
        comparison: res.comparison
      }
    };
  }

  /**
   * AI Health Assistant Workflow:
   * Answers questions based exclusively on the patient's saved data.
   */
  async function sendAssistantQuestionWorkflow(payload) {
    let question = '';
    let userId = '';
    let attachedReport = null;

    if (typeof payload === 'object' && payload !== null) {
      question = payload.message || payload.question || '';
      userId = payload.userId || (global.HealthApp.store && global.HealthApp.store.getState().profile.id) || '';
      attachedReport = payload.attachedReport || null;
    } else {
      question = payload || '';
      userId = (global.HealthApp.store && global.HealthApp.store.getState().profile.id) || '';
    }

    if (!question.trim()) {
      return { ok: false, error: 'Please enter a question.' };
    }

    if (!global.HealthApp.clinicalEngine) {
      return { ok: false, error: 'AI Assistant engine unavailable.' };
    }

    const state = global.HealthApp.store ? global.HealthApp.store.getState() : {};
    const context = {
      profile: state.profile || {},
      reminders: state.reminders || [],
      reports: state.reports || [],
      attachedReport: attachedReport
    };

    const res = global.HealthApp.clinicalEngine.answerHealthQuestion(question, context);
    return {
      ok: true,
      data: {
        reply: res.reply
      }
    };
  }

  // Export Unified Service Interface
  global.HealthApp = global.HealthApp || {};
  global.HealthApp.snsWebhookService = {
    fetchAllUserData,
    deleteHealthRecord,
    saveHealthRecord,
    fetchAiExplanation,
    saveMedicineReminder,
    deleteMedicineReminder,
    toggleMedicineReminderTaken,
    submitHealthcareInquiry,
    updatePatientProfile,
    uploadReport: uploadReportWorkflow,
    compareReports: compareReportsWorkflow,
    sendAssistantMessage: sendAssistantQuestionWorkflow,
    disclaimer: MEDICAL_DISCLAIMER
  };
})(window);
