/**
 * AI HEALTH RECORDS — Unified Application & Webhook Configuration
 * --------------------------------------------------------------------------
 * Keep all keys and URLs in this configuration file.
 * Clear placeholders are provided where values have not yet been assigned.
 */
(function (global) {
  'use strict';

  // Supabase Configuration
  const SUPABASE_CONFIG = {
    url: 'https://lrtosvimbnzzhqaeunkr.supabase.co',
    anonKey: 'sb_publishable_eP6DXTRm_FxZabTG1LsMRA_0t__k1gK'
  };

  // SNS Agent Workbench Webhook URLs
  const WORKBENCH_WEBHOOK_URLS = {
    // 1. Report Upload & AI Summary Delivery Webhook (Webhook Trigger -> Extract From PDF -> AI Agent -> PDF Generator -> Upload/Email)
    reportUpload: 'https://api.agents.snsihub.ai/webhook/256bd07f-83b1-4167-a0cb-b94a42ffe985',

    // 2. Report Compare Webhook (send two selected reports' extracted text to AI Agent)
    reportCompare: 'https://api.agents.snsihub.ai/webhook/YOUR_COMPARE_WEBHOOK_ID',

    // 3. AI Health Assistant Webhook (send patient questions to AI Agent)
    healthAssistant: 'https://api.agents.snsihub.ai/webhook/YOUR_ASSISTANT_WEBHOOK_ID'
  };

  const STORAGE_KEY = 'ahr_app_config_v2';

  function loadStoredConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          supabase: { ...SUPABASE_CONFIG, ...(parsed.supabase || {}) },
          webhooks: { ...WORKBENCH_WEBHOOK_URLS, ...(parsed.webhooks || {}) },
          timeoutMs: parsed.timeoutMs || 120000
        };
      }
    } catch (_) {}
    return {
      supabase: { ...SUPABASE_CONFIG },
      webhooks: { ...WORKBENCH_WEBHOOK_URLS },
      timeoutMs: 120000
    };
  }

  function saveConfig(patch) {
    const current = loadStoredConfig();
    const updated = {
      supabase: { ...current.supabase, ...(patch.supabase || {}) },
      webhooks: { ...current.webhooks, ...(patch.webhooks || {}) },
      timeoutMs: patch.timeoutMs || current.timeoutMs
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (_) {}
    return updated;
  }

  global.HealthApp = global.HealthApp || {};
  global.HealthApp.config = {
    get: loadStoredConfig,
    save: saveConfig,
    defaults: {
      supabase: SUPABASE_CONFIG,
      webhooks: WORKBENCH_WEBHOOK_URLS
    }
  };

  // Backwards compatibility shim for existing UI references
  global.HealthApp.apiConfig = {
    get: function () {
      const c = loadStoredConfig();
      return {
        useDemoMode: false,
        baseUrl: '',
        timeoutMs: c.timeoutMs,
        endpoints: {
          reportUpload: c.webhooks.reportUpload,
          aiReportCompare: c.webhooks.reportCompare,
          aiHealthAssistant: c.webhooks.healthAssistant
        }
      };
    },
    save: function (p) {
      if (p && p.endpoints) {
        saveConfig({ webhooks: p.endpoints });
      }
    },
    resolveUrl: function (cfg, key) {
      const c = loadStoredConfig();
      return c.webhooks[key] || (cfg && cfg.endpoints && cfg.endpoints[key]) || '';
    },
    isLive: function () {
      return true;
    }
  };
})(window);
