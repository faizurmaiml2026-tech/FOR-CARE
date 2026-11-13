/**
 * AI HEALTH RECORDS — Split-Screen Patient Login & Registration
 */
(function (global) {
  'use strict';

  function renderEditorialVisualSvg() {
    return (
      '<div class="auth-visual-frame">' +
        '<svg viewBox="0 0 460 220" width="100%" style="display:block;height:auto;" aria-hidden="true">' +
          '<defs>' +
            '<linearGradient id="emeraldWave" x1="0" y1="0" x2="1" y2="0">' +
              '<stop offset="0%" stop-color="#176B55" stop-opacity="0.15"/>' +
              '<stop offset="50%" stop-color="#176B55" stop-opacity="0.85"/>' +
              '<stop offset="100%" stop-color="#D6BE91" stop-opacity="0.9"/>' +
            '</linearGradient>' +
          '</defs>' +
          '<rect x="10" y="14" width="210" height="128" rx="14" fill="#FAF9F4" stroke="#CFD4C8" stroke-width="1"/>' +
          '<rect x="26" y="30" width="54" height="18" rx="9" fill="#DDE9DF"/>' +
          '<text x="37" y="42" font-family="Inter, sans-serif" font-size="9" font-weight="600" fill="#123F34">LAB PANEL</text>' +
          '<rect x="26" y="58" width="142" height="10" rx="5" fill="#252C29" fill-opacity="0.85"/>' +
          '<rect x="26" y="76" width="110" height="7" rx="3.5" fill="#858B84" fill-opacity="0.45"/>' +
          '<rect x="26" y="96" width="84" height="28" rx="8" fill="#EEF4EF" stroke="#C6D8C9"/>' +
          '<text x="36" y="114" font-family="Manrope, sans-serif" font-size="11" font-weight="700" fill="#176B55">HbA1c · 5.6%</text>' +
          '<rect x="118" y="96" width="86" height="28" rx="8" fill="#F6F0E3" stroke="#D6BE91"/>' +
          '<text x="128" y="114" font-family="Manrope, sans-serif" font-size="11" font-weight="700" fill="#7D6231">LDL · 112</text>' +

          '<rect x="242" y="24" width="206" height="108" rx="14" fill="#FFFFFF" stroke="#C6D8C9" stroke-width="1"/>' +
          '<circle cx="268" cy="50" r="11" fill="#DDE9DF"/>' +
          '<path d="M268 45v10M263 50h10" stroke="#176B55" stroke-width="1.8" stroke-linecap="round"/>' +
          '<text x="288" y="48" font-family="Plus Jakarta Sans, sans-serif" font-size="10.5" font-weight="700" fill="#123F34">AI Clinical Clarity</text>' +
          '<text x="288" y="61" font-family="Inter, sans-serif" font-size="8.5" fill="#858B84">Plain-English Report Summary</text>' +
          '<rect x="258" y="76" width="170" height="7" rx="3.5" fill="#DDE9DF"/>' +
          '<rect x="258" y="91" width="144" height="7" rx="3.5" fill="#DDE9DF"/>' +
          '<rect x="258" y="106" width="116" height="7" rx="3.5" fill="#EAECE5"/>' +

          '<path d="M18 182 L106 182 L124 182 L138 158 L152 198 L166 146 L180 189 L194 176 L212 182 L442 182" fill="none" stroke="url(#emeraldWave)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' +
          '<circle cx="166" cy="146" r="4" fill="#176B55"/>' +
          '<circle cx="348" cy="182" r="4" fill="#D6BE91"/>' +
          '<text x="26" y="205" font-family="Inter, sans-serif" font-size="8.5" font-weight="600" fill="#123F34">CONTINUOUS PATIENT TIMELINE · 2024 — 2026</text>' +
        '</svg>' +
      '</div>'
    );
  }

  function renderAuthPage(state) {
    const icons = global.HealthApp.icons;
    const isRegister = state.authMode === 'register';

    const formContent = isRegister
      ? '<div class="auth-card-header">' +
          '<h2 class="auth-card-title">Create your patient account</h2>' +
          '<p class="auth-card-subtitle">Start organizing your reports, medications, and history in one private space.</p>' +
        '</div>' +
        '<form class="auth-form" id="register-form">' +
          '<div class="form-field">' +
            '<label class="form-label" for="reg-name">Full Name</label>' +
            '<input class="input" id="reg-name" type="text" placeholder="e.g., Ananya Sharma" required />' +
          '</div>' +
          '<div class="form-grid" style="gap:12px;">' +
            '<div class="form-field">' +
              '<label class="form-label" for="reg-email">Email Address</label>' +
              '<input class="input" id="reg-email" type="email" placeholder="you@example.com" required />' +
            '</div>' +
            '<div class="form-field">' +
              '<label class="form-label" for="reg-dob">Date of Birth</label>' +
              '<input class="input" id="reg-dob" type="date" value="1992-04-18" required />' +
            '</div>' +
          '</div>' +
          '<div class="form-field">' +
            '<label class="form-label" for="reg-password">Password</label>' +
            '<div class="input-with-icon">' +
              '<input class="input" id="reg-password" type="password" placeholder="At least 6 characters" minlength="6" required />' +
              '<button type="button" class="input-action-btn" data-toggle-pw="reg-password" aria-label="Show password">' +
                icons.get('eye') +
              '</button>' +
            '</div>' +
          '</div>' +
          '<div class="form-field">' +
            '<label class="form-label" for="reg-confirm">Confirm Password</label>' +
            '<div class="input-with-icon">' +
              '<input class="input" id="reg-confirm" type="password" placeholder="Re-enter password" minlength="6" required />' +
              '<button type="button" class="input-action-btn" data-toggle-pw="reg-confirm" aria-label="Show password">' +
                icons.get('eye') +
              '</button>' +
            '</div>' +
          '</div>' +
          '<label class="auth-checkbox" style="font-size:0.8rem;">' +
            '<input type="checkbox" id="reg-agree" checked required />' +
            '<span>I understand AI Health Records is a personal patient health organizer.</span>' +
          '</label>' +
          '<div id="auth-error-msg" class="pill pill-error" style="display:none;padding:10px 12px;border-radius:var(--radius-sm);white-space:normal;"></div>' +
          '<button type="submit" class="btn btn-primary btn-lg btn-block" id="auth-submit-btn">Create Patient Account</button>' +
        '</form>' +
        '<div class="auth-switch-footer">' +
          'Already have an account? <button type="button" class="auth-link-btn" id="switch-to-login">Sign in</button>' +
        '</div>'
      : '<div class="auth-card-header">' +
          '<h2 class="auth-card-title">Welcome back</h2>' +
          '<p class="auth-card-subtitle">Sign in to access your medical records, AI explanations, and reminders.</p>' +
        '</div>' +
        '<form class="auth-form" id="login-form">' +
          '<div class="form-field">' +
            '<label class="form-label" for="login-email">Email Address</label>' +
            '<input class="input" id="login-email" type="email" placeholder="you@example.com" required />' +
          '</div>' +
          '<div class="form-field">' +
            '<label class="form-label" for="login-password">Password</label>' +
            '<div class="input-with-icon">' +
              '<input class="input" id="login-password" type="password" placeholder="Enter your password" required />' +
              '<button type="button" class="input-action-btn" data-toggle-pw="login-password" aria-label="Show password">' +
                icons.get('eye') +
              '</button>' +
            '</div>' +
          '</div>' +
          '<div class="auth-row-between">' +
            '<label class="auth-checkbox">' +
              '<input type="checkbox" id="login-remember" checked />' +
              '<span>Keep me signed in</span>' +
            '</label>' +
            '<button type="button" class="auth-link-btn" id="forgot-pw-btn">Forgot password?</button>' +
          '</div>' +
          '<div id="auth-error-msg" class="pill pill-error" style="display:none;padding:10px 12px;border-radius:var(--radius-sm);white-space:normal;"></div>' +
          '<button type="submit" class="btn btn-primary btn-lg btn-block" id="auth-submit-btn">Sign In</button>' +
        '</form>' +
        '<div class="auth-demo-hint">' +
          '<span><strong>Patient Portal:</strong> Login info syncs directly to your connected database.</span>' +
          '<span class="pill pill-sage" style="font-size:0.7rem;">DB Connected</span>' +
        '</div>' +
        '<div class="auth-switch-footer">' +
          'New to AI Health Records? <button type="button" class="auth-link-btn" id="switch-to-register">Create an account</button>' +
        '</div>';

    return (
      '<div class="auth-shell">' +
        '<section class="auth-editorial">' +
          '<div class="auth-brand">' +
            '<div class="brand-mark">' + icons.get('brandMark') + '</div>' +
            '<div class="brand-text">' +
              '<span class="brand-name" style="font-size:0.95rem;">AI HEALTH RECORDS</span>' +
              '<span class="brand-tagline">Your Health. Your History. One Intelligent Platform.</span>' +
            '</div>' +
          '</div>' +
          '<div class="auth-editorial-body">' +
            '<div class="auth-eyebrow">' +
              icons.get('shield') +
              '<span>Personal Patient Health Intelligence</span>' +
            '</div>' +
            '<h1 class="auth-headline">Your complete health story, beautifully organized.</h1>' +
            '<p class="auth-subcopy">' +
              'Keep lab reports, scans, prescriptions, and medication schedules in one calm sanctuary — ' +
              'with plain-English AI clarity designed exclusively for patients.' +
            '</p>' +
            renderEditorialVisualSvg() +
          '</div>' +
          '<div class="auth-editorial-footer">' +
            '<span>Built exclusively for patients</span>' +
            '<span>SNS Agent Workbench API Ready</span>' +
          '</div>' +
        '</section>' +
        '<section class="auth-form-pane">' +
          '<div class="auth-mobile-brand">' +
            '<div class="brand-mark">' + icons.get('brandMark') + '</div>' +
            '<div class="brand-text">' +
              '<span class="brand-name">AI HEALTH RECORDS</span>' +
              '<span class="brand-tagline">Your Health. Your History.</span>' +
            '</div>' +
          '</div>' +
          '<div class="auth-card">' + formContent + '</div>' +
        '</section>' +
      '</div>'
    );
  }

  function openForgotPasswordModal() {
    const utils = global.HealthApp.utils;
    global.HealthApp.modals.open({
      title: 'Reset your password',
      subtitle: 'Enter your patient account email to receive reset instructions',
      size: 'sm',
      bodyHtml:
        '<form id="forgot-pw-form" style="display:flex;flex-direction:column;gap:14px;">' +
          '<div class="form-field">' +
            '<label class="form-label" for="reset-email">Email Address</label>' +
            '<input class="input" id="reset-email" type="email" placeholder="you@example.com" required />' +
          '</div>' +
          '<div id="reset-feedback" style="display:none;font-size:0.85rem;"></div>' +
          '<button type="submit" class="btn btn-primary btn-block" id="reset-send-btn">Send Reset Link</button>' +
        '</form>',
      onMount: function (root, close) {
        const form = root.querySelector('#forgot-pw-form');
        const feedback = root.querySelector('#reset-feedback');
        const btn = root.querySelector('#reset-send-btn');

        form.addEventListener('submit', async function (e) {
          e.preventDefault();
          const email = root.querySelector('#reset-email').value.trim();
          btn.disabled = true;
          btn.textContent = 'Sending...';
          const res = await global.HealthApp.snsWebhookService.requestPasswordReset(email);
          btn.disabled = false;
          btn.textContent = 'Send Reset Link';
          if (res.ok) {
            feedback.style.display = 'block';
            feedback.className = 'card-sage';
            feedback.innerHTML =
              '<strong style="color:var(--color-forest);">Check your inbox.</strong> If an account matches <strong>' +
              utils.escapeHtml(email) +
              '</strong>, a reset link is on the way.';
            setTimeout(close, 2200);
          } else {
            feedback.style.display = 'block';
            feedback.className = 'pill pill-error';
            feedback.textContent = res.error;
          }
        });
      }
    });
  }

  function showAuthMessage(box, text, isSuccess) {
    if (!box) return;
    if (isSuccess) {
      box.className = 'card-sage';
      box.style.cssText = 'display:block;padding:12px 14px;font-size:0.85rem;color:var(--color-forest);border-radius:var(--radius-sm);';
    } else {
      box.className = 'pill pill-error';
      box.style.cssText = 'display:block;padding:10px 12px;border-radius:var(--radius-sm);white-space:normal;';
    }
    box.textContent = text;
  }

  function mapSignUpError(error) {
    var msg = ((error && error.message) || '').toLowerCase();
    if (msg.indexOf('already registered') !== -1 || msg.indexOf('already exists') !== -1 || msg.indexOf('already been registered') !== -1) {
      return 'An account with this email is already registered.';
    }
    if (msg.indexOf('password') !== -1 && (msg.indexOf('6') !== -1 || msg.indexOf('short') !== -1 || msg.indexOf('least') !== -1 || msg.indexOf('weak') !== -1)) {
      return 'Password is too short. Please use at least 6 characters.';
    }
    if (msg.indexOf('invalid') !== -1 && msg.indexOf('email') !== -1) {
      return 'Please enter a valid email address.';
    }
    if (msg.indexOf('rate limit') !== -1 || msg.indexOf('too many') !== -1) {
      return 'Too many attempts. Please wait a moment and try again.';
    }
    return (error && error.message) || 'Unable to create account. Please try again.';
  }

  function mapLoginError(error) {
    console.log('login error', error && error.message, error && error.status, error && error.code);
    var msg = ((error && error.message) || '').toLowerCase();
    var code = ((error && error.code) || '').toLowerCase();
    var status = error && error.status;

    if (msg.indexOf('invalid login credentials') !== -1 || code === 'invalid_credentials') {
      return 'Invalid email or password.';
    }
    if (msg.indexOf('email not confirmed') !== -1 || code === 'email_not_confirmed') {
      return 'Email not confirmed. Turn off "Confirm email" in Supabase Authentication settings, or confirm your email first.';
    }
    if (status === 429 || msg.indexOf('rate limit') !== -1 || msg.indexOf('too many') !== -1 || code === 'over_request_rate_limit') {
      return 'Too many login attempts. Please wait a moment and try again.';
    }
    if (msg.indexOf('failed to fetch') !== -1 || msg.indexOf('network') !== -1 || msg.indexOf('fetch') !== -1) {
      return 'Network error reaching Supabase. Please check your internet connection and try again.';
    }
    return (error && error.message) || 'Unable to sign in right now. Please try again.';
  }

  function deriveNameFromUser(user, fallbackEmail) {
    var metaName = user && user.user_metadata && user.user_metadata.name;
    var rawName = (metaName || '').trim();
    if (!rawName && fallbackEmail) {
      rawName = fallbackEmail
        .split('@')[0]
        .replace(/[._-]+/g, ' ')
        .trim()
        .split(/\s+/)
        .map(function (w) { return w ? w.charAt(0).toUpperCase() + w.slice(1) : ''; })
        .join(' ');
    }
    var full = rawName || 'Patient';
    var parts = full.split(/\s+/);
    return {
      fullName: full,
      firstName: parts[0] || full,
      lastName: parts.slice(1).join(' ')
    };
  }

  function bindAuthEvents(root) {
    const store = global.HealthApp.store;
    const icons = global.HealthApp.icons;

    root.querySelectorAll('[data-toggle-pw]').forEach((btn) => {
      btn.addEventListener('click', function () {
        const input = root.querySelector('#' + btn.getAttribute('data-toggle-pw'));
        if (!input) return;
        const nextType = input.type === 'password' ? 'text' : 'password';
        input.type = nextType;
        btn.innerHTML = icons.get(nextType === 'text' ? 'eyeOff' : 'eye');
        btn.setAttribute('aria-label', nextType === 'text' ? 'Hide password' : 'Show password');
      });
    });

    const toReg = root.querySelector('#switch-to-register');
    if (toReg) {
      toReg.addEventListener('click', () => store.setState({ authMode: 'register' }));
    }

    const toLogin = root.querySelector('#switch-to-login');
    if (toLogin) {
      toLogin.addEventListener('click', () => store.setState({ authMode: 'login' }));
    }

    const forgotBtn = root.querySelector('#forgot-pw-btn');
    if (forgotBtn) {
      forgotBtn.addEventListener('click', openForgotPasswordModal);
    }

    const loginForm = root.querySelector('#login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const email = root.querySelector('#login-email').value.trim();
        const password = root.querySelector('#login-password').value;
        const rememberEl = root.querySelector('#login-remember');
        const rememberMe = rememberEl ? rememberEl.checked : true;
        const errBox = root.querySelector('#auth-error-msg');
        const submitBtn = root.querySelector('#auth-submit-btn');

        errBox.style.display = 'none';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';

        let authResult = null;
        try {
          if (typeof global.setSupabaseRememberMe === 'function') {
            global.setSupabaseRememberMe(rememberMe);
          }

          if (!global.supabaseClient) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
            showAuthMessage(errBox, 'Authentication client failed to load. Please refresh the page.', false);
            return;
          }

          authResult = await global.supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
          });
        } catch (err) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign In';
          showAuthMessage(errBox, mapLoginError(err), false);
          return;
        }

        if (authResult && authResult.error) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign In';
          showAuthMessage(errBox, mapLoginError(authResult.error), false);
          return;
        }

        const data = authResult && authResult.data;
        if (!data || !data.session || !data.user) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign In';
          showAuthMessage(errBox, 'No active session returned. Please check Supabase Auth settings.', false);
          return;
        }

        var nameInfo = deriveNameFromUser(data.user, data.user.email || email);

        store.setState((s) => ({
          isAuthenticated: true,
          currentPage: 'dashboard',
          settings: {
            ...s.settings,
            privacy: {
              ...s.settings.privacy,
              localSessionPersistence: rememberMe
            }
          },
          profile: {
            ...s.profile,
            id: data.user.id,
            email: data.user.email || email,
            fullName: nameInfo.fullName,
            firstName: nameInfo.firstName,
            lastName: nameInfo.lastName,
            lastLoginAt: new Date().toISOString()
          }
        }));
        await store.loadUserData(data.user.id);
        store.addActivity('profile', 'Signed in via Supabase Auth');
        global.HealthApp.utils.showToast('Welcome back', 'Your patient health workspace is ready.');

        // replaced by Supabase Auth
        // const res = await global.HealthApp.snsWebhookService.login({ email, password, rememberMe });
        // if (res.ok) {
        //   store.setState((s) => ({
        //     isAuthenticated: true,
        //     currentPage: 'dashboard',
        //     profile: { ...s.profile, email: email }
        //   }));
        // } else {
        //   errBox.textContent = res.error;
        //   errBox.style.display = 'block';
        // }
      });
    }

    const regForm = root.querySelector('#register-form');
    if (regForm) {
      regForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const fullName = root.querySelector('#reg-name').value.trim();
        const email = root.querySelector('#reg-email').value.trim();
        const dob = root.querySelector('#reg-dob').value;
        const password = root.querySelector('#reg-password').value;
        const confirm = root.querySelector('#reg-confirm').value;
        const errBox = root.querySelector('#auth-error-msg');
        const submitBtn = root.querySelector('#auth-submit-btn');

        if (password !== confirm) {
          showAuthMessage(errBox, 'Passwords do not match. Please re-enter carefully.', false);
          return;
        }

        errBox.style.display = 'none';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account...';

        try {
          if (!global.supabaseClient) {
            throw new Error('Authentication client unavailable.');
          }

          const { data, error } = await global.supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
              data: {
                name: fullName
              }
            }
          });

          if (error) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Patient Account';
            showAuthMessage(errBox, mapSignUpError(error), false);
            return;
          }

          // Supabase returns empty identities array when email is already registered & confirmation is enabled
          if (data && data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Patient Account';
            showAuthMessage(errBox, 'An account with this email is already registered.', false);
            return;
          }

          showAuthMessage(errBox, 'Account created successfully.', true);

          if (!data || !data.session) {
            global.HealthApp.utils.showToast('Account created successfully.', 'You can now sign in with your account.');
            setTimeout(function () {
              store.setState({ authMode: 'login' });
            }, 600);
            return;
          }

          const nameInfo = deriveNameFromUser(data.user, email);
          global.HealthApp.utils.showToast('Account created successfully.', 'Welcome to AI Health Records, ' + nameInfo.firstName + '.');
          setTimeout(function () {
            store.setState((s) => ({
              isAuthenticated: true,
              currentPage: 'dashboard',
              profile: {
                ...s.profile,
                fullName: nameInfo.fullName,
                firstName: nameInfo.firstName,
                lastName: nameInfo.lastName,
                email: (data.user && data.user.email) || email,
                dateOfBirth: dob
              }
            }));
          }, 600);
        } catch (err) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create Patient Account';
          showAuthMessage(errBox, mapSignUpError(err), false);
        }

        // replaced by Supabase Auth
        // const res = await global.HealthApp.snsWebhookService.register({ fullName, email, dob, password });
        // if (res.ok) {
        //   const parts = fullName.split(/\s+/);
        //   store.setState((s) => ({
        //     isAuthenticated: true,
        //     currentPage: 'dashboard',
        //     profile: {
        //       ...s.profile,
        //       fullName,
        //       firstName: parts[0] || fullName,
        //       lastName: parts.slice(1).join(' '),
        //       email,
        //       dateOfBirth: dob
        //     }
        //   }));
        // } else {
        //   errBox.textContent = res.error;
        //   errBox.style.display = 'block';
        // }
      });
    }
  }

  global.HealthApp = global.HealthApp || {};
  global.HealthApp.pages = global.HealthApp.pages || {};
  global.HealthApp.pages.auth = {
    render: renderAuthPage,
    bind: bindAuthEvents
  };
})(window);
