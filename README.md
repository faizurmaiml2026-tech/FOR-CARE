# AI HEALTH RECORDS

**Your Health. Your History. One Intelligent Platform.**

A patient-exclusive healthcare SaaS frontend designed with an Emerald, Dark Forest, Warm Ivory, Soft Sage, Charcoal, and Champagne editorial palette (zero blue accents).

## Quick Start

This application has **zero runtime or build dependencies**:

- Open `index.html` directly in any modern browser, **or**
- Serve the folder using any static HTTP server (such as VS Code Live Server).

## Patient-Only Architecture

- **Authentication:** Split-screen Patient Login, Registration, and Forgot Password.
- **Dashboard:** Greeting, 4 patient metric cards, Recent Reports, Category Donut visualization, Medicine Reminders, Health History preview, Recent Activity, and Quick Actions.
- **My Health Records:** Searchable and filterable document library with Grid/List view, document preview modal, and direct AI Explainer jump.
- **Upload Report:** Non-technical drag-and-drop workflow with image preview, staged upload progress, success state, and error/retry state.
- **AI Report Explainer:** Two-column clinical clarity workspace pairing document preview with Overview, Simple Explanation, Values & Reference Ranges, Terms Glossary, and Questions for Your Doctor.
- **Health History:** Chronological vertical timeline with category/year filters and personal visit logging.
- **Compare Reports:** Side-by-side comparison workspace with neutral visualizations and explicit separation between numerical deltas and clinical interpretation.
- **Health Summary:** Printable digital health dossier with PDF export/print formatting.
- **Medicine Reminders:** Morning/Afternoon/Evening/Night daily planner with adherence tracking, add/edit/delete forms, and mark-taken toggles.
- **AI Health Assistant:** Multi-thread conversational workspace with report context attachment and suggested prompts.
- **Healthcare Inquiries:** Patient inquiry submission and `Pending` / `Answered` tracking (provider selection is for patient organization only).
- **My Profile & Settings:** Personal details, allergy tags, notification & privacy toggles, JSON data export, and SNS Webhook configuration.

## Connecting SNS Agent Workbench Webhooks

All backend interactions pass through `src/services/snsWebhookService.js` using endpoints configured in `src/config/apiConfig.js`:

1. Open `src/config/apiConfig.js` (or navigate to **Settings → SNS Webhook API** in the app).
2. Set `useDemoMode` to `false`.
3. Replace `baseUrl` with your SNS Agent Workbench webhook gateway URL and optionally configure `authToken`.
4. Each endpoint expects JSON (`POST`) or `FormData` and returns `{ "success": true, "data": ... }`.
