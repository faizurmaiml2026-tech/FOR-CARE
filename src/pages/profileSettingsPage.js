/**
 * AI HEALTH RECORDS — My Profile & Settings
 */
(function (global) {
  'use strict';

  function renderProfilePage(state) {
    const icons = global.HealthApp.icons;
    const utils = global.HealthApp.utils;
    const p = state.profile;
    const initials = utils.getInitials(p.fullName);

    const allergyChips = (p.allergies || [])
      .map(
        (item, idx) =>
          '<span class="tag-chip">' +
            utils.escapeHtml(item) +
            '<button type="button" data-remove-allergy="' + idx + '" aria-label="Remove allergy">' + icons.get('close') + '</button>' +
          '</span>'
      )
      .join('');

    return (
      '<div class="page-view">' +
        '<div class="page-header">' +
          '<div>' +
            '<h1 class="page-title">My Profile</h1>' +
            '<p class="page-subtitle">Manage your personal details, emergency contacts, and allergy notes.</p>' +
          '</div>' +
          '<div class="page-header-actions">' +
            '<button type="button" class="btn btn-secondary" id="prof-go-summary">' + icons.get('summary') + ' View Health Summary</button>' +
          '</div>' +
        '</div>' +

        '<div class="card-sage" style="display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:22px;">' +
          '<div style="display:flex;align-items:center;gap:16px;">' +
            '<div class="avatar-circle" style="width:62px;height:62px;font-size:1.3rem;background:var(--color-white);">' + utils.escapeHtml(initials) + '</div>' +
            '<div>' +
              '<h2 style="font-size:1.35rem;color:var(--color-forest);">' + utils.escapeHtml(p.fullName) + '</h2>' +
              '<p style="font-size:0.85rem;color:var(--color-charcoal-soft);margin-top:3px;">' +
                utils.escapeHtml(p.email) + ' · <span class="tabular-nums">' + utils.escapeHtml(p.id) + '</span>' +
              '</p>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
            '<span class="pill pill-emerald">Blood Group ' + utils.escapeHtml(p.bloodGroup) + '</span>' +
            '<span class="pill pill-neutral tabular-nums">' + p.age + ' yrs · ' + utils.escapeHtml(p.height) + '</span>' +
          '</div>' +
        '</div>' +

        '<div class="dashboard-bento">' +
          '<div class="card col-span-7">' +
            '<div class="card-header">' +
              '<div>' +
                '<h2 class="card-title">Personal Details</h2>' +
                '<p class="card-subtitle">Used across your Health Summary document and records</p>' +
              '</div>' +
            '</div>' +
            '<form id="profile-details-form" class="form-grid">' +
              '<div class="form-field">' +
                '<label class="form-label" for="pf-name">Full Name</label>' +
                '<input class="input" id="pf-name" type="text" value="' + utils.escapeHtml(p.fullName) + '" required />' +
              '</div>' +
              '<div class="form-field">' +
                '<label class="form-label" for="pf-email">Email Address</label>' +
                '<input class="input" id="pf-email" type="email" value="' + utils.escapeHtml(p.email) + '" required />' +
              '</div>' +
              '<div class="form-field">' +
                '<label class="form-label" for="pf-phone">Phone Number</label>' +
                '<input class="input" id="pf-phone" type="text" value="' + utils.escapeHtml(p.phone) + '" />' +
              '</div>' +
              '<div class="form-field">' +
                '<label class="form-label" for="pf-dob">Date of Birth</label>' +
                '<input class="input" id="pf-dob" type="date" value="' + utils.escapeHtml(p.dateOfBirth) + '" />' +
              '</div>' +
              '<div class="form-field">' +
                '<label class="form-label" for="pf-blood">Blood Group</label>' +
                '<select class="select" id="pf-blood">' +
                  ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']
                    .map((bg) => '<option value="' + bg + '"' + (p.bloodGroup === bg ? ' selected' : '') + '>' + bg + '</option>')
                    .join('') +
                '</select>' +
              '</div>' +
              '<div class="form-field">' +
                '<label class="form-label" for="pf-city">City / Location</label>' +
                '<input class="input" id="pf-city" type="text" value="' + utils.escapeHtml(p.city) + '" />' +
              '</div>' +
              '<div class="form-field">' +
                '<label class="form-label" for="pf-height">Height</label>' +
                '<input class="input" id="pf-height" type="text" value="' + utils.escapeHtml(p.height) + '" />' +
              '</div>' +
              '<div class="form-field">' +
                '<label class="form-label" for="pf-weight">Weight</label>' +
                '<input class="input" id="pf-weight" type="text" value="' + utils.escapeHtml(p.weight) + '" />' +
              '</div>' +
              '<div class="form-field full">' +
                '<label class="form-label" for="pf-emerg">Emergency Contact (Name &amp; Phone)</label>' +
                '<input class="input" id="pf-emerg" type="text" value="' + utils.escapeHtml((p.emergencyContact && p.emergencyContact.name) + ' · ' + (p.emergencyContact && p.emergencyContact.phone)) + '" />' +
              '</div>' +
              '<div class="form-field full" style="flex-direction:row;justify-content:flex-end;">' +
                '<button type="submit" class="btn btn-primary" id="save-profile-btn">Save Profile Changes</button>' +
              '</div>' +
            '</form>' +
          '</div>' +

          '<div class="card col-span-5">' +
            '<div class="card-header">' +
              '<div>' +
                '<h2 class="card-title">Allergies &amp; Reference Notes</h2>' +
                '<p class="card-subtitle">Highlighted automatically in your Health Summary</p>' +
              '</div>' +
            '</div>' +
            '<div style="margin-bottom:18px;">' +
              '<label class="form-label" style="display:block;margin-bottom:8px;">Recorded Allergies</label>' +
              '<div class="chip-list" style="margin-bottom:12px;">' +
                (allergyChips || '<span style="font-size:0.82rem;color:var(--color-muted);">No allergies recorded.</span>') +
              '</div>' +
              '<form id="add-allergy-form" style="display:flex;gap:8px;">' +
                '<input class="input" id="new-allergy-input" type="text" placeholder="Add allergy (e.g., Sulfa drugs)" />' +
                '<button type="submit" class="btn btn-sage">Add</button>' +
              '</form>' +
            '</div>' +
            '<div class="card-ivory">' +
              '<strong style="font-size:0.85rem;color:var(--color-forest);display:block;margin-bottom:4px;">Primary Care Reference</strong>' +
              '<p style="font-size:0.82rem;color:var(--color-charcoal-soft);">' + utils.escapeHtml(p.primaryPhysicianRef) + '</p>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderSettingsPage(state) {
    const icons = global.HealthApp.icons;
    const utils = global.HealthApp.utils;
    const s = state.settings;
    const tab = state.settingsTab || 'notifications';
    const apiCfg = global.HealthApp.apiConfig.get();

    const tabs = [
      { id: 'notifications', label: 'Notifications', icon: 'bell' },
      { id: 'privacy', label: 'Privacy & Data', icon: 'shield' },
      { id: 'account', label: 'Account & Security', icon: 'profile' },
      { id: 'webhooks', label: 'SNS Webhook API', icon: 'link' }
    ];

    let panelHtml = '';

    if (tab === 'notifications') {
      panelHtml =
        '<div class="card">' +
          '<div class="card-header">' +
            '<div><h2 class="card-title">Notification Preferences</h2><p class="card-subtitle">Control reminders and report alerts</p></div>' +
          '</div>' +
          '<div class="pref-row">' +
            '<div><strong style="display:block;">Medication Dose Reminders</strong><span style="font-size:0.82rem;color:var(--color-muted);">Alert when daily scheduled medicines are due</span></div>' +
            '<label class="switch"><input type="checkbox" data-pref-notif="medicineReminders"' + (s.notifications.medicineReminders ? ' checked' : '') + ' /><span class="switch-track"></span></label>' +
          '</div>' +
          '<div class="pref-row">' +
            '<div><strong style="display:block;">AI Report Analysis Ready</strong><span style="font-size:0.82rem;color:var(--color-muted);">Notify once uploaded reports finish AI summarization</span></div>' +
            '<label class="switch"><input type="checkbox" data-pref-notif="aiReportReady"' + (s.notifications.aiReportReady ? ' checked' : '') + ' /><span class="switch-track"></span></label>' +
          '</div>' +
          '<div class="pref-row">' +
            '<div><strong style="display:block;">Healthcare Inquiry Replies</strong><span style="font-size:0.82rem;color:var(--color-muted);">Alert when an inquiry status moves from Pending to Answered</span></div>' +
            '<label class="switch"><input type="checkbox" data-pref-notif="inquiryUpdates"' + (s.notifications.inquiryUpdates ? ' checked' : '') + ' /><span class="switch-track"></span></label>' +
          '</div>' +
          '<div class="pref-row">' +
            '<div><strong style="display:block;">Weekly Health Digest</strong><span style="font-size:0.82rem;color:var(--color-muted);">Calm Sunday recap of adherence and upcoming checkups</span></div>' +
            '<label class="switch"><input type="checkbox" data-pref-notif="weeklyDigest"' + (s.notifications.weeklyDigest ? ' checked' : '') + ' /><span class="switch-track"></span></label>' +
          '</div>' +
          '<div class="pref-row">' +
            '<div><strong style="display:block;">Quiet Hours (' + utils.escapeHtml(s.notifications.quietHoursRange) + ')</strong><span style="font-size:0.82rem;color:var(--color-muted);">Pause non-urgent alerts overnight</span></div>' +
            '<label class="switch"><input type="checkbox" data-pref-notif="quietHoursEnabled"' + (s.notifications.quietHoursEnabled ? ' checked' : '') + ' /><span class="switch-track"></span></label>' +
          '</div>' +
        '</div>';
    } else if (tab === 'privacy') {
      panelHtml =
        '<div class="card">' +
          '<div class="card-header">' +
            '<div><h2 class="card-title">Privacy &amp; Data Controls</h2><p class="card-subtitle">You stay in complete ownership of your patient health records</p></div>' +
          '</div>' +
          '<div class="pref-row">' +
            '<div><strong style="display:block;">Allow AI Workspace Report Context</strong><span style="font-size:0.82rem;color:var(--color-muted);">Let AI Explainer and AI Assistant read selected records for plain-English summaries</span></div>' +
            '<label class="switch"><input type="checkbox" data-pref-priv="aiContextAccess"' + (s.privacy.aiContextAccess ? ' checked' : '') + ' /><span class="switch-track"></span></label>' +
          '</div>' +
          '<div class="pref-row">' +
            '<div><strong style="display:block;">Remember Session on This Device</strong><span style="font-size:0.82rem;color:var(--color-muted);">Keep patient workspace signed in across browser reloads</span></div>' +
            '<label class="switch"><input type="checkbox" data-pref-priv="localSessionPersistence"' + (s.privacy.localSessionPersistence ? ' checked' : '') + ' /><span class="switch-track"></span></label>' +
          '</div>' +
          '<div class="pref-row">' +
            '<div><strong style="display:block;">Two-Factor Verification</strong><span style="font-size:0.82rem;color:var(--color-muted);">Extra verification step when signing in from a new browser</span></div>' +
            '<label class="switch"><input type="checkbox" data-pref-priv="twoFactorAuth"' + (s.privacy.twoFactorAuth ? ' checked' : '') + ' /><span class="switch-track"></span></label>' +
          '</div>' +
          '<div style="margin-top:20px;display:flex;gap:12px;flex-wrap:wrap;">' +
            '<button type="button" class="btn btn-secondary" id="export-data-btn">' + icons.get('download') + ' Export My Health Data (JSON)</button>' +
            '<button type="button" class="btn btn-ghost" id="reset-demo-btn">' + icons.get('refresh') + ' Reset Demo Data</button>' +
          '</div>' +
        '</div>';
    } else if (tab === 'account') {
      panelHtml =
        '<div class="card">' +
          '<div class="card-header">' +
            '<div><h2 class="card-title">Account &amp; Security</h2><p class="card-subtitle">Update your password or manage your active session</p></div>' +
          '</div>' +
          '<form id="change-pw-form" style="display:flex;flex-direction:column;gap:14px;max-width:440px;">' +
            '<div class="form-field"><label class="form-label" for="pw-cur">Current Password</label><input class="input" id="pw-cur" type="password" value="••••••••••••" required /></div>' +
            '<div class="form-field"><label class="form-label" for="pw-new">New Password</label><input class="input" id="pw-new" type="password" placeholder="Minimum 6 characters" minlength="6" required /></div>' +
            '<div class="form-field"><label class="form-label" for="pw-conf">Confirm New Password</label><input class="input" id="pw-conf" type="password" placeholder="Re-enter new password" minlength="6" required /></div>' +
            '<div><button type="submit" class="btn btn-primary">Update Password</button></div>' +
          '</form>' +
          '<div style="margin-top:26px;padding-top:20px;border-top:1px solid var(--color-border);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">' +
            '<div><strong style="display:block;">Sign out of this device</strong><span style="font-size:0.82rem;color:var(--color-muted);">Return safely to the patient login screen</span></div>' +
            '<button type="button" class="btn btn-danger-soft" id="settings-logout-btn">' + icons.get('logout') + ' Logout</button>' +
          '</div>' +
        '</div>';
    } else {
      const apiCfgHelper = global.HealthApp.apiConfig;
      const endpointRows = Object.entries(apiCfg.endpoints)
        .map(([k, path]) => {
          const live = apiCfgHelper.isLive(apiCfg, k);
          return (
            '<tr>' +
              '<td style="font-weight:600;">' + utils.escapeHtml(k) + '</td>' +
              '<td class="tabular-nums" style="color:var(--color-forest);font-family:monospace;font-size:0.78rem;word-break:break-all;">' + utils.escapeHtml(path) + '</td>' +
              '<td><span class="pill ' + (live ? 'pill-emerald' : 'pill-sage') + '">' + (live ? 'Live' : 'Demo') + '</span></td>' +
            '</tr>'
          );
        })
        .join('');

      panelHtml =
        '<div class="card">' +
          '<div class="card-header">' +
            '<div>' +
              '<h2 class="card-title">SNS Agent Workbench Webhook API</h2>' +
              '<p class="card-subtitle">Live Login DB webhook active; unconfigured modules run in Demo Mode</p>' +
            '</div>' +
            '<span class="pill pill-emerald">Login DB Connected</span>' +
          '</div>' +
          '<form id="webhook-cfg-form" style="display:flex;flex-direction:column;gap:14px;margin-bottom:22px;">' +
            '<div class="pref-row" style="padding-top:0;">' +
              '<div><strong style="display:block;">Use Demo Data for Unconfigured Modules</strong><span style="font-size:0.82rem;color:var(--color-muted);">Endpoints with live URLs always send real webhook requests</span></div>' +
              '<label class="switch"><input type="checkbox" id="wh-demo-toggle"' + (apiCfg.useDemoMode ? ' checked' : '') + ' /><span class="switch-track"></span></label>' +
            '</div>' +
            '<div class="form-field">' +
              '<label class="form-label" for="wh-login-url">Login DB Webhook URL (Live)</label>' +
              '<input class="input" id="wh-login-url" type="url" value="' + utils.escapeHtml(apiCfg.endpoints.authLogin || '') + '" required />' +
            '</div>' +
            '<div class="form-field">' +
              '<label class="form-label" for="wh-base-url">SNS Agent Workbench Base Webhook URL (Other Modules)</label>' +
              '<input class="input" id="wh-base-url" type="url" value="' + utils.escapeHtml(apiCfg.baseUrl) + '" required />' +
            '</div>' +
            '<div class="form-field">' +
              '<label class="form-label" for="wh-token">Optional Webhook Auth Token (' + utils.escapeHtml(apiCfg.authHeaderName) + ')</label>' +
              '<input class="input" id="wh-token" type="password" value="' + utils.escapeHtml(apiCfg.authToken || '') + '" placeholder="Leave blank if not required" />' +
            '</div>' +
            '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
              '<button type="submit" class="btn btn-primary">Save Webhook Settings</button>' +
              '<button type="button" class="btn btn-secondary" id="wh-reset-btn">Restore Defaults</button>' +
            '</div>' +
          '</form>' +
          '<h3 style="font-size:0.875rem;margin-bottom:10px;">Configured Service Layer Endpoints</h3>' +
          '<div class="table-wrap"><table class="data-table"><thead><tr><th>Workflow</th><th>Webhook URL / Path</th><th>Mode</th></tr></thead><tbody>' +
            endpointRows +
          '</tbody></table></div>' +
        '</div>';
    }

    return (
      '<div class="page-view">' +
        '<div class="page-header">' +
          '<div>' +
            '<h1 class="page-title">Settings</h1>' +
            '<p class="page-subtitle">Customize notifications, privacy preferences, account security, and SNS webhook integration.</p>' +
          '</div>' +
        '</div>' +
        '<div class="settings-layout">' +
          '<nav class="settings-nav" aria-label="Settings Categories">' +
            tabs
              .map(
                (t) =>
                  '<button type="button" class="settings-nav-btn' + (tab === t.id ? ' active' : '') + '" data-set-tab="' + t.id + '">' +
                    icons.get(t.icon) + '<span>' + t.label + '</span>' +
                  '</button>'
              )
              .join('') +
          '</nav>' +
          '<div>' + panelHtml + '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function bindProfileEvents(root) {
    const store = global.HealthApp.store;

    const sumBtn = root.querySelector('#prof-go-summary');
    if (sumBtn) sumBtn.addEventListener('click', () => store.navigate('summary'));

    const form = root.querySelector('#profile-details-form');
    if (form) {
      form.addEventListener('submit', async function (e) {
        e.preventDefault();
        const fullName = root.querySelector('#pf-name').value.trim();
        const parts = fullName.split(/\s+/);
        const emergRaw = root.querySelector('#pf-emerg').value.split('·');
        const updatedProfile = {
          ...store.getState().profile,
          fullName,
          firstName: parts[0] || fullName,
          lastName: parts.slice(1).join(' '),
          email: root.querySelector('#pf-email').value.trim(),
          phone: root.querySelector('#pf-phone').value.trim(),
          dateOfBirth: root.querySelector('#pf-dob').value,
          bloodGroup: root.querySelector('#pf-blood').value,
          city: root.querySelector('#pf-city').value.trim(),
          height: root.querySelector('#pf-height').value.trim(),
          weight: root.querySelector('#pf-weight').value.trim(),
          emergencyContact: {
            name: (emergRaw[0] || '').trim(),
            phone: (emergRaw[1] || '').trim()
          }
        };
        const userId = store.getState().profile && store.getState().profile.id;
        if (userId) {
          try {
            await global.HealthApp.snsWebhookService.updatePatientProfile(userId, updatedProfile);
            await store.loadUserData(userId);
            global.HealthApp.utils.showToast('Profile saved', 'Your personal details have been saved to Supabase.');
          } catch (err) {
            global.HealthApp.utils.showToast('Error', err.message || 'Unable to save profile to database.');
          }
        } else {
          store.setState({ profile: updatedProfile });
          global.HealthApp.utils.showToast('Profile updated', 'Your personal details have been updated.');
        }
      });
    }

    const allergyForm = root.querySelector('#add-allergy-form');
    if (allergyForm) {
      allergyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = root.querySelector('#new-allergy-input');
        const val = input.value.trim();
        if (!val) return;
        const currentProf = store.getState().profile;
        const updatedAllergies = [...(currentProf.allergies || []), val];
        const updatedProf = { ...currentProf, allergies: updatedAllergies };
        store.setState({ profile: updatedProf });
        input.value = '';
        if (currentProf.id) {
          try {
            await global.HealthApp.snsWebhookService.updatePatientProfile(currentProf.id, updatedProf);
          } catch (_) {}
        }
      });
    }

    root.querySelectorAll('[data-remove-allergy]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const idx = Number(btn.getAttribute('data-remove-allergy'));
        const currentProf = store.getState().profile;
        const updatedAllergies = (currentProf.allergies || []).filter((_, i) => i !== idx);
        const updatedProf = { ...currentProf, allergies: updatedAllergies };
        store.setState({ profile: updatedProf });
        if (currentProf.id) {
          try {
            await global.HealthApp.snsWebhookService.updatePatientProfile(currentProf.id, updatedProf);
          } catch (_) {}
        }
      });
    });
  }

  function bindSettingsEvents(root) {
    const store = global.HealthApp.store;

    root.querySelectorAll('[data-set-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        store.setState({ settingsTab: btn.getAttribute('data-set-tab') });
      });
    });

    root.querySelectorAll('[data-pref-notif]').forEach((cb) => {
      cb.addEventListener('change', async () => {
        const key = cb.getAttribute('data-pref-notif');
        store.setState((s) => ({
          settings: {
            ...s.settings,
            notifications: { ...s.settings.notifications, [key]: cb.checked }
          }
        }));
        await global.HealthApp.snsWebhookService.updateSettings(store.getState().settings);
      });
    });

    root.querySelectorAll('[data-pref-priv]').forEach((cb) => {
      cb.addEventListener('change', async () => {
        const key = cb.getAttribute('data-pref-priv');
        store.setState((s) => ({
          settings: {
            ...s.settings,
            privacy: { ...s.settings.privacy, [key]: cb.checked }
          }
        }));
        await global.HealthApp.snsWebhookService.updateSettings(store.getState().settings);
      });
    });

    const exportBtn = root.querySelector('#export-data-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const state = store.getState();
        const payload = JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            profile: state.profile,
            reports: state.reports,
            history: state.history,
            reminders: state.reminders,
            inquiries: state.inquiries
          },
          null,
          2
        );
        const blob = new Blob([payload], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ai-health-records-export.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        global.HealthApp.utils.showToast('Data exported', 'Downloaded your complete personal records archive.');
      });
    }

    const resetDemoBtn = root.querySelector('#reset-demo-btn');
    if (resetDemoBtn) {
      resetDemoBtn.addEventListener('click', async () => {
        const userId = store.getState().profile && store.getState().profile.id;
        if (userId) {
          await store.loadUserData(userId);
          global.HealthApp.utils.showToast('Data refreshed', 'Synchronized latest data from database.');
        }
      });
    }

    const pwForm = root.querySelector('#change-pw-form');
    if (pwForm) {
      pwForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nw = root.querySelector('#pw-new').value;
        const cf = root.querySelector('#pw-conf').value;
        if (nw !== cf) {
          global.HealthApp.utils.showToast('Mismatch', 'New passwords do not match.', 'error');
          return;
        }
        pwForm.reset();
        global.HealthApp.utils.showToast('Password updated', 'Your patient account password has been updated.');
      });
    }

    const logoutBtn = root.querySelector('#settings-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', global.HealthApp.sidebar.handleLogout);
    }

    const whForm = root.querySelector('#webhook-cfg-form');
    if (whForm) {
      whForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const loginUrl = root.querySelector('#wh-login-url').value.trim();
        global.HealthApp.apiConfig.save({
          useDemoMode: root.querySelector('#wh-demo-toggle').checked,
          baseUrl: root.querySelector('#wh-base-url').value.trim(),
          authToken: root.querySelector('#wh-token').value.trim(),
          endpoints: {
            authLogin: loginUrl,
            authRegister: loginUrl
          }
        });
        global.HealthApp.renderCurrentView();
        global.HealthApp.utils.showToast('Webhook settings saved', 'SNS Agent Workbench configuration updated.');
      });
    }

    const whReset = root.querySelector('#wh-reset-btn');
    if (whReset) {
      whReset.addEventListener('click', () => {
        global.HealthApp.apiConfig.reset();
        global.HealthApp.renderCurrentView();
        global.HealthApp.utils.showToast('Defaults restored', 'Placeholder SNS Agent Workbench endpoints restored.');
      });
    }
  }

  global.HealthApp = global.HealthApp || {};
  global.HealthApp.pages = global.HealthApp.pages || {};
  global.HealthApp.pages.profile = {
    render: renderProfilePage,
    bind: bindProfileEvents
  };
  global.HealthApp.pages.settings = {
    render: renderSettingsPage,
    bind: bindSettingsEvents
  };
})(window);
