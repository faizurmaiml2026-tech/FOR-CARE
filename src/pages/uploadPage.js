/**
 * AI HEALTH RECORDS — Patient-Friendly Upload Report Workspace
 */
(function (global) {
  'use strict';

  const REPORT_SUMMARY_WEBHOOK_URL = 'https://api.agents.snsihub.ai/webhook/256bd07f-83b1-4167-a0cb-b94a42ffe985';
  const REPORT_UPLOAD_TIMEOUT_MS = 120000;
  const SUMMARY_READY_MESSAGE = 'Your summary is ready.';
  // Switch SUMMARY_READY_MESSAGE to SUMMARY_EMAIL_SENT_MESSAGE once email delivery is connected
  const SUMMARY_EMAIL_SENT_MESSAGE = 'Your summary is ready. It has been sent to your account email.';

  const MAX_BYTES = 10 * 1024 * 1024;
  const HISTORY_KEY_PREFIX = 'ahr_report_history_';

  let sessionConsentGiven = false;
  let cachedAuthUserId = null;

  let uploadDraft = {
    file: null,
    fileName: '',
    fileSizeText: '',
    fileType: '',
    imageDataUrl: '',
    title: '',
    hospital: '',
    category: 'Blood Work',
    date: new Date().toISOString().slice(0, 10),
    autoExplain: true,
    status: 'idle', // idle | uploading | success | error
    progress: 0,
    statusText: '',
    errorMsg: '',
    createdReportId: '',
    summaryLink: ''
  };

  function getUserIdSync() {
    if (cachedAuthUserId) return cachedAuthUserId;
    try {
      var stores = [global.sessionStorage, global.localStorage];
      for (var i = 0; i < stores.length; i++) {
        var st = stores[i];
        if (!st) continue;
        for (var j = 0; j < st.length; j++) {
          var key = st.key(j);
          if (key && key.indexOf('sb-') === 0 && key.indexOf('-auth-token') !== -1) {
            var parsed = JSON.parse(st.getItem(key) || '{}');
            if (parsed && parsed.user && parsed.user.id) {
              cachedAuthUserId = parsed.user.id;
              return cachedAuthUserId;
            }
          }
        }
      }
    } catch (_) {}
    return null;
  }

  function getUserReportHistory() {
    const store = global.HealthApp.store;
    return (store && store.getState().reports) || [];
  }

  function saveUserReportRecord() {
    // Deprecated: reports are saved directly to Supabase table public.health_records
  }

  async function resolveSignedInUser() {
    if (!global.supabaseClient) return null;
    try {
      var userRes = await global.supabaseClient.auth.getUser();
      if (userRes && !userRes.error && userRes.data && userRes.data.user && userRes.data.user.email) {
        cachedAuthUserId = userRes.data.user.id;
        return userRes.data.user;
      }
      var sessRes = await global.supabaseClient.auth.getSession();
      var sessUser = sessRes && sessRes.data && sessRes.data.session && sessRes.data.session.user;
      if (sessUser && sessUser.email) {
        cachedAuthUserId = sessUser.id;
        return sessUser;
      }
    } catch (_) {}
    cachedAuthUserId = null;
    return null;
  }

  function extractSummaryLink(parsed) {
    if (!parsed || typeof parsed !== 'object') return '';
    var obj = Array.isArray(parsed) ? (parsed[0] || {}) : parsed;
    if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
      obj = obj.data;
    }
    var candidates = [
      obj.webViewLink,
      obj.summaryUrl,
      obj.pdfUrl,
      obj.driveUrl,
      obj.fileUrl,
      obj.url,
      obj.link
    ];
    for (var i = 0; i < candidates.length; i++) {
      var val = candidates[i];
      if (typeof val === 'string' && /^https?:\/\//i.test(val.trim())) {
        return val.trim();
      }
    }
    return '';
  }

  function requestUploadConsent() {
    if (sessionConsentGiven) return Promise.resolve(true);
    return new Promise(function (resolve) {
      var settled = false;
      function finish(agreed) {
        if (settled) return;
        settled = true;
        if (agreed) sessionConsentGiven = true;
        resolve(agreed);
      }

      global.HealthApp.modals.open({
        title: 'AI Report Processing Consent',
        size: 'sm',
        bodyHtml:
          '<p style="color:var(--color-charcoal-soft);line-height:1.6;">' +
            'Your medical report PDF will be processed by an AI service to generate a simple-language summary for your account email. Do you agree to continue?' +
          '</p>',
        footerHtml:
          '<button type="button" class="btn btn-secondary" id="consent-cancel-btn">Cancel</button>' +
          '<button type="button" class="btn btn-primary" id="consent-agree-btn">I Agree</button>',
        onMount: function (root, close) {
          root.querySelector('#consent-agree-btn').addEventListener('click', function () {
            close();
            finish(true);
          });
          root.querySelector('#consent-cancel-btn').addEventListener('click', function () {
            close();
            finish(false);
          });
          var closeX = root.querySelector('#modal-close-x');
          if (closeX) {
            closeX.addEventListener('click', function () { finish(false); });
          }
          var backdrop = root.querySelector('#active-modal-backdrop');
          if (backdrop) {
            backdrop.addEventListener('click', function (ev) {
              if (ev.target.id === 'active-modal-backdrop') finish(false);
            });
          }
        }
      });
    });
  }

  function validateAndStageFile(fileMeta) {
    const ext = (fileMeta.name.split('.').pop() || '').toLowerCase();
    const mimeOk = fileMeta.type ? fileMeta.type === 'application/pdf' : ext === 'pdf';
    if (!mimeOk || ext !== 'pdf') {
      uploadDraft.file = null;
      uploadDraft.fileName = '';
      uploadDraft.status = 'error';
      uploadDraft.errorMsg = 'Please choose a PDF file only (.pdf). Images and other file types are not supported yet.';
      return false;
    }
    if (fileMeta.size > MAX_BYTES) {
      uploadDraft.file = null;
      uploadDraft.fileName = '';
      uploadDraft.status = 'error';
      uploadDraft.errorMsg = 'This PDF exceeds the 10 MB limit. Please upload a smaller file.';
      return false;
    }

    const baseName = fileMeta.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
    uploadDraft.file = fileMeta.raw || null;
    uploadDraft.fileName = fileMeta.name;
    uploadDraft.fileSizeText = global.HealthApp.utils.formatFileSize(fileMeta.size);
    uploadDraft.fileType = 'PDF';
    uploadDraft.title = uploadDraft.title || baseName.charAt(0).toUpperCase() + baseName.slice(1);
    uploadDraft.status = 'idle';
    uploadDraft.errorMsg = '';
    uploadDraft.summaryLink = '';
    uploadDraft.imageDataUrl = '';
    return true;
  }

  function renderUploadPage() {
    const icons = global.HealthApp.icons;
    const utils = global.HealthApp.utils;

    const previewHtml = uploadDraft.fileName
      ? '<div class="upload-preview-card">' +
          '<div class="upload-thumb">' +
            icons.get('records') +
          '</div>' +
          '<div style="flex:1;min-width:0;">' +
            '<strong style="display:block;font-size:0.9rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' +
              utils.escapeHtml(uploadDraft.fileName) +
            '</strong>' +
            '<span style="font-size:0.78rem;color:var(--color-muted);">' +
              utils.escapeHtml(uploadDraft.fileType) + ' · ' + utils.escapeHtml(uploadDraft.fileSizeText) +
            '</span>' +
          '</div>' +
          '<button type="button" class="btn btn-ghost btn-sm" id="remove-staged-file" aria-label="Remove file"' +
            (uploadDraft.status === 'uploading' ? ' disabled' : '') + '>' +
            icons.get('close') + ' Remove' +
          '</button>' +
        '</div>'
      : '';

    let stateBoxHtml = '';
    if (uploadDraft.status === 'uploading') {
      stateBoxHtml =
        '<div class="card-ivory" style="margin-top:18px;">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;font-size:0.85rem;">' +
            '<strong style="color:var(--color-forest);">' + utils.escapeHtml(uploadDraft.statusText) + '</strong>' +
          '</div>' +
          '<div class="progress-track"><div class="progress-fill" style="width:' + uploadDraft.progress + '%;"></div></div>' +
          '<p style="font-size:0.76rem;color:var(--color-muted);">Please keep this tab open while your report is processed.</p>' +
        '</div>';
    } else if (uploadDraft.status === 'success') {
      stateBoxHtml =
        '<div class="upload-state-box success">' +
          '<div style="display:flex;align-items:flex-start;gap:12px;">' +
            '<div style="color:var(--color-emerald);margin-top:2px;">' + icons.get('checkCircle') + '</div>' +
            '<div style="flex:1;">' +
              '<strong style="color:var(--color-forest);display:block;margin-bottom:4px;">' + utils.escapeHtml(SUMMARY_READY_MESSAGE) + '</strong>' +
              '<p style="font-size:0.85rem;color:var(--color-charcoal-soft);margin-bottom:14px;">' +
                utils.escapeHtml(uploadDraft.fileName) + ' has been processed.' +
              '</p>' +
              '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
                (uploadDraft.summaryLink
                  ? '<a href="' + utils.escapeHtml(uploadDraft.summaryLink) + '" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" id="open-summary-link">' + icons.get('link') + ' Open summary</a>'
                  : '') +
                '<button type="button" class="btn btn-secondary btn-sm" id="upload-go-records">View in My Records</button>' +
                '<button type="button" class="btn btn-ghost btn-sm" id="upload-another-btn">Upload Another</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
    } else if (uploadDraft.status === 'error') {
      stateBoxHtml =
        '<div class="upload-state-box error">' +
          '<div style="display:flex;align-items:flex-start;gap:12px;">' +
            '<div style="color:var(--color-terracotta);margin-top:2px;">' + icons.get('alertCircle') + '</div>' +
            '<div style="flex:1;">' +
              '<strong style="color:var(--color-terracotta);display:block;margin-bottom:4px;">Unable to complete upload</strong>' +
              '<p style="font-size:0.85rem;color:var(--color-charcoal);margin-bottom:12px;">' + utils.escapeHtml(uploadDraft.errorMsg) + '</p>' +
              '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
                '<button type="button" class="btn btn-primary btn-sm" id="retry-upload-btn">' + icons.get('refresh') + ' Retry Upload</button>' +
                '<button type="button" class="btn btn-secondary btn-sm" id="reset-upload-error-btn">Choose Different File</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
    }

    return (
      '<div class="page-view">' +
        '<div class="page-header">' +
          '<div>' +
            '<h1 class="page-title">Upload Medical Report</h1>' +
            '<p class="page-subtitle">Add lab tests, scans, prescriptions, or discharge notes in just a few clicks.</p>' +
          '</div>' +
        '</div>' +

        '<div class="upload-layout">' +
          '<div class="card">' +
            '<input type="file" id="hidden-file-input" accept=".pdf,application/pdf" style="display:none;" />' +
            '<div class="dropzone" id="report-dropzone" tabindex="0" role="button" aria-label="Drag and drop medical report or click to browse">' +
              '<div class="dropzone-icon">' + icons.get('upload') + '</div>' +
              '<h2 class="dropzone-title">Drag and drop your medical report here</h2>' +
              '<p class="dropzone-subtitle">' +
                'Supports PDF files up to 10 MB. No technical formatting required.' +
              '</p>' +
              '<span class="btn btn-primary" style="pointer-events:none;">Browse From Device</span>' +
            '</div>' +

            previewHtml +
            stateBoxHtml +

            '<div style="margin-top:20px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;">' +
              '<div class="card-ivory" style="padding:12px 14px;">' +
                '<strong style="font-size:0.8rem;color:var(--color-forest);display:block;">1. Select File</strong>' +
                '<span style="font-size:0.75rem;color:var(--color-muted);">PDF report up to 10 MB</span>' +
              '</div>' +
              '<div class="card-ivory" style="padding:12px 14px;">' +
                '<strong style="font-size:0.8rem;color:var(--color-forest);display:block;">2. Add Details</strong>' +
                '<span style="font-size:0.75rem;color:var(--color-muted);">Hospital name &amp; test date</span>' +
              '</div>' +
              '<div class="card-ivory" style="padding:12px 14px;">' +
                '<strong style="font-size:0.8rem;color:var(--color-forest);display:block;">3. AI Clarity</strong>' +
                '<span style="font-size:0.75rem;color:var(--color-muted);">Simple-language PDF summary</span>' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div class="card">' +
            '<div class="card-header">' +
              '<div>' +
                '<h2 class="card-title">Report Details</h2>' +
                '<p class="card-subtitle">Helpful context so you can find this record later</p>' +
              '</div>' +
            '</div>' +
            '<form id="upload-meta-form" style="display:flex;flex-direction:column;gap:14px;">' +
              '<div class="form-field">' +
                '<label class="form-label" for="up-title">Report Name</label>' +
                '<input class="input" id="up-title" type="text" value="' + utils.escapeHtml(uploadDraft.title) + '" placeholder="e.g., Thyroid & Vitamin B12 Panel" required />' +
              '</div>' +
              '<div class="form-grid" style="gap:12px;">' +
                '<div class="form-field">' +
                  '<label class="form-label" for="up-category">Category</label>' +
                  '<select class="select" id="up-category">' +
                    ['Blood Work', 'Cardiology', 'Imaging', 'Prescription', 'Checkup', 'Other']
                      .map((c) => '<option value="' + c + '"' + (uploadDraft.category === c ? ' selected' : '') + '>' + c + '</option>')
                      .join('') +
                  '</select>' +
                '</div>' +
                '<div class="form-field">' +
                  '<label class="form-label" for="up-date">Report Date</label>' +
                  '<input class="input" id="up-date" type="date" value="' + utils.escapeHtml(uploadDraft.date) + '" required />' +
                '</div>' +
              '</div>' +
              '<div class="form-field">' +
                '<label class="form-label" for="up-hospital">Hospital, Clinic, or Lab Name</label>' +
                '<input class="input" id="up-hospital" type="text" value="' + utils.escapeHtml(uploadDraft.hospital) + '" placeholder="e.g., City Care Diagnostics" required />' +
              '</div>' +
              '<div class="pref-row" style="padding:10px 0;border-bottom:none;">' +
                '<div>' +
                  '<strong style="font-size:0.85rem;display:block;">Prepare AI Explanation</strong>' +
                  '<span style="font-size:0.76rem;color:var(--color-muted);">Automatically summarize medical terms after saving</span>' +
                '</div>' +
                '<label class="switch"><input type="checkbox" id="up-auto-explain"' + (uploadDraft.autoExplain ? ' checked' : '') + ' /><span class="switch-track"></span></label>' +
              '</div>' +
              '<button type="submit" class="btn btn-primary btn-lg btn-block" id="up-submit-btn"' +
                (uploadDraft.status === 'uploading' ? ' disabled' : '') + '>' +
                icons.get('upload') + ' Save to My Health Records' +
              '</button>' +
            '</form>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function rerenderUpload() {
    global.HealthApp.renderCurrentView();
  }

  async function runUploadSubmission() {
    const user = await resolveSignedInUser();
    if (!user || !user.email) {
      global.HealthApp.store.setState({
        isAuthenticated: false,
        authMode: 'login',
        currentPage: 'dashboard'
      });
      return;
    }

    if (!uploadDraft.file || !uploadDraft.fileName) {
      uploadDraft.status = 'error';
      uploadDraft.errorMsg = 'Please choose a PDF file to upload.';
      rerenderUpload();
      return;
    }

    const ext = (uploadDraft.fileName.split('.').pop() || '').toLowerCase();
    const mimeOk = uploadDraft.file.type ? uploadDraft.file.type === 'application/pdf' : ext === 'pdf';
    if (!mimeOk || ext !== 'pdf') {
      uploadDraft.status = 'error';
      uploadDraft.errorMsg = 'Please choose a PDF file only (.pdf).';
      rerenderUpload();
      return;
    }

    if (uploadDraft.file.size > MAX_BYTES) {
      uploadDraft.status = 'error';
      uploadDraft.errorMsg = 'This PDF exceeds the 10 MB limit. Please upload a smaller file.';
      rerenderUpload();
      return;
    }

    const consented = await requestUploadConsent();
    if (!consented) {
      return;
    }

    uploadDraft.status = 'uploading';
    uploadDraft.progress = 50;
    uploadDraft.statusText = 'Extracting PDF text and analyzing clinical biomarkers...';
    uploadDraft.summaryLink = '';
    rerenderUpload();

    const todayIso = new Date().toISOString().slice(0, 10);

    const result = await global.HealthApp.snsWebhookService.uploadReport({
      file: uploadDraft.file,
      email: user.email,
      userId: user.id,
      title: uploadDraft.title || uploadDraft.fileName,
      category: uploadDraft.category || 'Blood Work',
      hospital: uploadDraft.hospital || 'Personal Upload',
      date: uploadDraft.date || todayIso,
      autoExplain: uploadDraft.autoExplain
    });

    if (result.ok) {
      uploadDraft.progress = 100;
      uploadDraft.status = 'success';
      uploadDraft.summaryLink = (result.data && result.data.summaryLink) || '';
      uploadDraft.createdReportId = (result.data && result.data.recordId) || '';
      await global.HealthApp.store.loadUserData(user.id);
      global.HealthApp.store.addActivity('upload', 'Uploaded report: ' + (uploadDraft.title || uploadDraft.fileName));
      rerenderUpload();
      global.HealthApp.utils.showToast('Report Ready', 'Report saved to your health vault with AI clinical analysis.');
    } else {
      uploadDraft.status = 'error';
      uploadDraft.errorMsg = result.error || 'Something went wrong while processing your report. Please try again.';
      await global.HealthApp.store.loadUserData(user.id);
      rerenderUpload();
    }

    // demo data removed
    // const res = await global.HealthApp.snsWebhookService.uploadReport({
    //   title: uploadDraft.title,
    //   category: uploadDraft.category,
    //   hospital: uploadDraft.hospital,
    //   date: uploadDraft.date,
    //   fileName: uploadDraft.fileName,
    //   autoExplain: uploadDraft.autoExplain,
    //   simulateFailure: uploadDraft.simulateFailure
    // });
    // const newId = res.data.reportId || 'rep-' + Date.now();
    // const newReport = {
    //   id: newId,
    //   title: uploadDraft.title || uploadDraft.fileName,
    //   hospital: uploadDraft.hospital || 'Personal Uploaded Document',
    //   doctorRef: 'Uploaded directly by patient',
    //   date: uploadDraft.date || '2026-11-11',
    //   category: uploadDraft.category || 'Blood Work',
    //   fileType: uploadDraft.fileType || 'PDF',
    //   fileSize: uploadDraft.fileSizeText || '1.1 MB',
    //   imageDataUrl: uploadDraft.imageDataUrl || '',
    //   summary: 'Patient-uploaded ' + uploadDraft.category + ' document archived on ' + global.HealthApp.utils.formatDate(uploadDraft.date) + '.',
    //   metrics: [
    //     {
    //       name: 'Vitamin B12',
    //       value: '462 pg/mL',
    //       numericValue: 462,
    //       unit: 'pg/mL',
    //       referenceRange: '200 – 900 pg/mL',
    //       rangeMin: 200,
    //       rangeMax: 900,
    //       statusLabel: 'Within Reference Range'
    //     },
    //     {
    //       name: 'TSH (Thyroid)',
    //       value: '2.1 mIU/L',
    //       numericValue: 2.1,
    //       unit: 'mIU/L',
    //       referenceRange: '0.4 – 4.2 mIU/L',
    //       rangeMin: 0.4,
    //       rangeMax: 4.2,
    //       statusLabel: 'Within Reference Range'
    //     }
    //   ]
    // };
    // const store = global.HealthApp.store;
    // store.setState((s) => ({
    //   reports: [newReport, ...s.reports],
    //   history: [
    //     {
    //       id: 'hist-' + Date.now(),
    //       date: newReport.date,
    //       category: 'Lab Work',
    //       title: newReport.title,
    //       hospital: newReport.hospital,
    //       summary: 'Uploaded and archived by patient (' + newReport.fileType + ', ' + newReport.fileSize + ').',
    //       reportId: newId
    //     },
    //     ...s.history
    //   ],
    //   selectedReportId: newId
    // }));
    // store.addActivity('upload', 'Uploaded report: ' + newReport.title);
  }

  function handleFilePicked(file) {
    if (!file) return;
    validateAndStageFile({ name: file.name, size: file.size, type: file.type, raw: file });
    rerenderUpload();
  }

  function bindUploadEvents(root) {
    const dropzone = root.querySelector('#report-dropzone');
    const fileInput = root.querySelector('#hidden-file-input');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());
      dropzone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          fileInput.click();
        }
      });
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('drag-over');
      });
      dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleFilePicked(e.dataTransfer.files[0]);
        }
      });
      fileInput.addEventListener('change', () => {
        if (fileInput.files && fileInput.files[0]) {
          handleFilePicked(fileInput.files[0]);
        }
      });
    }

    const removeBtn = root.querySelector('#remove-staged-file');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        uploadDraft.file = null;
        uploadDraft.fileName = '';
        uploadDraft.imageDataUrl = '';
        uploadDraft.status = 'idle';
        uploadDraft.summaryLink = '';
        rerenderUpload();
      });
    }

    const titleIn = root.querySelector('#up-title');
    const catIn = root.querySelector('#up-category');
    const dateIn = root.querySelector('#up-date');
    const hospIn = root.querySelector('#up-hospital');
    const autoIn = root.querySelector('#up-auto-explain');

    if (titleIn) titleIn.addEventListener('input', () => { uploadDraft.title = titleIn.value; });
    if (catIn) catIn.addEventListener('change', () => { uploadDraft.category = catIn.value; });
    if (dateIn) dateIn.addEventListener('change', () => { uploadDraft.date = dateIn.value; });
    if (hospIn) hospIn.addEventListener('input', () => { uploadDraft.hospital = hospIn.value; });
    if (autoIn) autoIn.addEventListener('change', () => { uploadDraft.autoExplain = autoIn.checked; });

    const form = root.querySelector('#upload-meta-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        runUploadSubmission();
      });
    }

    const retryBtn = root.querySelector('#retry-upload-btn');
    if (retryBtn) retryBtn.addEventListener('click', runUploadSubmission);

    const resetErrBtn = root.querySelector('#reset-upload-error-btn');
    if (resetErrBtn) {
      resetErrBtn.addEventListener('click', () => {
        uploadDraft.status = 'idle';
        uploadDraft.file = null;
        uploadDraft.fileName = '';
        rerenderUpload();
      });
    }

    const goRecBtn = root.querySelector('#upload-go-records');
    if (goRecBtn) {
      goRecBtn.addEventListener('click', () => global.HealthApp.store.navigate('records'));
    }

    const anotherBtn = root.querySelector('#upload-another-btn');
    if (anotherBtn) {
      anotherBtn.addEventListener('click', () => {
        uploadDraft = {
          file: null,
          fileName: '',
          fileSizeText: '',
          fileType: '',
          imageDataUrl: '',
          title: '',
          hospital: '',
          category: 'Blood Work',
          date: new Date().toISOString().slice(0, 10),
          autoExplain: true,
          status: 'idle',
          progress: 0,
          statusText: '',
          errorMsg: '',
          createdReportId: '',
          summaryLink: ''
        };
        rerenderUpload();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (global.supabaseClient) {
      resolveSignedInUser();
      global.supabaseClient.auth.onAuthStateChange(function (event, session) {
        if (event === 'SIGNED_OUT') {
          cachedAuthUserId = null;
          sessionConsentGiven = false;
          uploadDraft.file = null;
          uploadDraft.fileName = '';
          uploadDraft.status = 'idle';
          uploadDraft.summaryLink = '';
        } else if (session && session.user && session.user.id) {
          cachedAuthUserId = session.user.id;
        }
      });
    }
  });

  global.HealthApp = global.HealthApp || {};
  global.HealthApp.getUserReportHistory = getUserReportHistory;
  global.HealthApp.pages = global.HealthApp.pages || {};
  global.HealthApp.pages.upload = {
    render: renderUploadPage,
    bind: bindUploadEvents
  };
})(window);
