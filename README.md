# TestPilot — Manual QA Testing Manager

TestPilot is a browser-based manual QA testing management tool that allows users to paste structured QA testing plans, automatically organize phases and test cases, review and edit generated checklists, and manually track testing progress through interactive checkboxes.

Progress is automatically saved in browser `localStorage` so users can return and continue testing later. TestPilot is project-agnostic and works with manual QA testing plans across different software applications and teams without requiring a backend server, database, or external API.

- **Live Demo:** [https://hannankhan203.github.io/Test-Pilot/](https://hannankhan203.github.io/Test-Pilot/)
- **Repository:** [https://github.com/Hannankhan203/Test-Pilot](https://github.com/Hannankhan203/Test-Pilot)

---

## Key Features

### Generic QA Checklist Generator
- Paste structured plain-text or Markdown QA testing plans, or load a built-in sample plan.
- Automatically detect document titles, plan-level notes, phases, and phase descriptions.
- Extract testing categories/subheadings and individual test cases across common plan formats, including explicit `Phase` headings, numbered sections and decimal items, Markdown headings (`#`, `##`, `###`), bulleted or checkbox lists, and final regression or release checklists.
- Preserve test IDs (such as `AUTH-001`, `[TC-104]`, or `1.1`) and priority labels (`Critical`, `High`, `Medium`, `Low`, `P0`–`P4`) where present.
- Switch between **Edit & Review** mode and **Clean Preview** mode before starting test execution.
- Edit phase labels, phase names, descriptions, supporting notes, categories, test IDs, priorities, and test descriptions inline.
- Add, remove, and reorder tests within sections, or add and remove phases and categories.
- Review ambiguous or unstructured lines in an **Unclassified Content** panel and convert them into phases, categories, tests, or notes.

### Interactive Manual QA Test Runner
- Convert any reviewed plan into an interactive checklist with all test items initialized as `Not Started`.
- Mark individual tests as `Not Started` or `Completed` using interactive checkboxes.
- Track real-time phase-level completion counts, percentages, and progress bars.
- Track overall checklist progress (total phases, total tests, completed tests, remaining tests, and overall completion percentage).
- Expand and collapse individual phase sections, or expand/collapse all phases at once.
- Toggle **Edit Checklist** mode during testing to update titles, notes, phases, categories, or test items while preserving existing completion states.

### Checklist Management
- Create and store multiple independent QA checklists in **My QA Checklists**.
- Search saved checklists by title and switch between checklists from the runner selector.
- Open and resume saved checklists from the sidebar, checklist cards, or quick-resume banner.
- Rename checklists inline and delete checklists with modal confirmation.
- View creation and last-saved timestamps alongside status badges (`Not Started`, `In Progress`, `Completed`).

### Automatic Data Persistence
- Automatically save checklist creation, inline edits, checkbox state changes, phase expand/collapse states, and active runner session state in browser `localStorage`.
- Restore the active checklist and view after refreshing or reopening the browser, and synchronize updates across open tabs in the same browser.
- Maintain isolated state across multiple saved checklists.
- Recover safely from malformed `localStorage` data, repair duplicate record IDs on load, and surface clear warnings if browser storage quota is exceeded.

### Transfer Between Devices
- Generate a portable transfer code (`TPX1.*`) on one device from **Data Management → Transfer Between Devices** without manually exporting or importing JSON files.
- Copy the generated code on the sending device and paste it into TestPilot on the receiving device to import saved QA checklists.
- Preserves checklist structure, phases, descriptions, categories, notes, priorities, checklist IDs, and completed test progress.
- Validates incoming transfer codes locally in the browser using Web Crypto `SHA-256` integrity checks and native stream compression before any data is written.
- Supports **Merge with Existing Data** (default, preventing accidental overwrites) and **Replace Existing Workspace Data** (with automatic pre-replace rollback snapshot).
- Requires no Firebase, backend server, user account, or paid service—performing a manual point-in-time transfer rather than automatic real-time synchronization.

### Project Workspaces, Backup, and Restore
- **Additional Project QA Views:** Includes optional client-side workspaces (`Dashboard`, `My Projects`, `Test Plans`, `Test Execution`, `Defects`, and `Reports`) for step-based test suites, defect logging, and printable reports.
- **Full Application Backup & Import:** Export a single `.json` backup containing both QA checklists (`qaChecklists`) and project workspaces (`projects`, `activities`) from **Data Management**, and re-import backups using **Merge** or **Replace** modes after schema validation.
- **Rollback & Workspace Reset:** Automatically saves a pre-restore/pre-reset snapshot in `sessionStorage` for one-click rollback within the current session, and provides a confirmation-gated workspace reset.

### Interface
- Responsive layout supporting mobile, tablet, and desktop viewports.
- Dark and light themes with persisted preference.
- Keyboard-accessible controls, visible focus indicators, `aria-expanded` phase toggles, and modal focus trapping/restoration.

---

## Technology Stack

- **HTML5** — Semantic single-page layout and accessible modal/view containers (`index.html`).
- **CSS3 & Tailwind CSS** — Custom CSS design tokens, Flexbox/Grid layouts, dark/light themes, print styles (`style.css`), and `@tailwindcss/vite` build integration.
- **Vanilla JavaScript (ES6+)** — Modular client-side architecture (`qaParser.js`, `checklistGeneratorUI.js`, `qaChecklistStore.js`, `qaRunnerUI.js`, `qaChecklistTransfer.js`, `qaChecklistTransferUI.js`, `script.js`) using safe DOM APIs, Web Crypto (`SHA-256`), and `CompressionStream` / `DecompressionStream`.
- **Browser Web Storage** — `localStorage` for persistent checklists, projects, and theme preferences; `sessionStorage` for temporary rollback snapshots.
- **Vite** — Local development server and static production bundler (`vite.config.ts`).
- **TypeScript (`tsc`)** — Static configuration check via `npm run lint` (`tsconfig.json`).

TestPilot runs entirely in the browser with Vanilla JavaScript. It does not use React at runtime, and it does not rely on a backend server, cloud database, AI API, or automated browser-testing engine.

---

## Project Structure

```text
Test-Pilot/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions workflow for GitHub Pages deployment
├── public/                     # Favicons, web app icons, and site.webmanifest
├── index.html                  # Application shell, navigation, views, and modals
├── style.css                   # Theme tokens, component styles, and responsive rules
├── script.js                   # App bootstrap, view router, project workspaces, and backups
├── qaParser.js                 # Generic plain-text/Markdown QA plan parser
├── checklistGeneratorUI.js     # Create QA Checklist view, preview, and inline editor UI
├── qaChecklistStore.js         # Checklist localStorage persistence, validation, and progress math
├── qaRunnerUI.js               # Manual QA Test Runner and My QA Checklists UI controller
├── qaChecklistTransfer.js      # Portable transfer code encoding, compression, and SHA-256 validation
├── qaChecklistTransferUI.js    # Transfer Between Devices UI controller (Send, Receive, Merge/Replace)
├── vite.config.ts              # Vite dev server and base-path build configuration
├── tsconfig.json               # TypeScript static verification config
└── package.json                # Scripts and build tooling dependencies
```

---

## Getting Started

### Prerequisites

- **Node.js** (v20 or later recommended)
- **npm**
- **Git** (optional, for cloning the repository)

### Installation and Running Locally

```bash
git clone https://github.com/Hannankhan203/Test-Pilot.git
cd Test-Pilot
npm install
npm run dev
```

> **Note:** If your npm version reports peer-dependency conflicts during installation, run `npm install --legacy-peer-deps` (as used in the CI workflow).

Once started, open the local development URL in your browser:

```text
http://localhost:3000
```

### Production Build and Scripts

Build the static production bundle:

```bash
npm run build
```

Vite outputs the compiled HTML, CSS, and JavaScript assets to the `dist/` directory.

Additional scripts defined in `package.json`:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server on port `3000` (`0.0.0.0`). |
| `npm run build` | Builds the static production bundle into `dist/`. |
| `npm run preview` | Previews the production build locally via Vite. |
| `npm run lint` | Runs `tsc --noEmit` to validate TypeScript configuration. |
| `npm run clean` | Removes the `dist/` build output directory. |

---

## GitHub Pages Deployment

TestPilot is configured for automated deployment to GitHub Pages via `.github/workflows/deploy.yml`:

- **Live Deployment:** [https://hannankhan203.github.io/Test-Pilot/](https://hannankhan203.github.io/Test-Pilot/)
- **Trigger:** Runs automatically on every push to the `main` branch, or manually via `workflow_dispatch`.
- **Base Path Handling:** During GitHub Actions builds (`GITHUB_ACTIONS=true`), `vite.config.ts` sets Vite's `base` path to `/Test-Pilot/` (overridable via `VITE_BASE_PATH`).
- **Repository Configuration:** In GitHub repository **Settings → Pages**, ensure **Build and deployment → Source** is set to **GitHub Actions** so the workflow can publish the `./dist` artifact.

---

## Data Storage and Privacy

- **Local Browser Storage:** QA checklists (`testpilot_qa_checklists_v1`), active runner state (`testpilot_qa_active_runner_v1`), project workspaces (`testpilot_projects_v1`), activity logs (`testpilot_activities_v1`), and theme settings (`testpilot_theme_preference`) are stored locally in the browser's `localStorage`.
- **No Cloud Synchronization:** Checklist and testing data stays inside the local browser and is not synced automatically to any external server, Firebase instance, or cloud account.
- **Browser-Specific Scope:** Saved checklists are tied to the specific browser profile and device where they were created unless manually moved via **Transfer Between Devices** or a JSON backup.
- **Data Retention:** Clearing browser site data or storage will remove saved checklists and projects. Generate a transfer code or export a JSON backup from **Data Management** whenever you need to preserve or move your data.

---

## Limitations

- **Manual Transfer Only (No Real-Time Sync):** Data does not sync automatically across devices or browsers. **Transfer Between Devices** performs a manual point-in-time transfer via copy/paste codes, and local storage remains subject to standard browser `localStorage` quotas (typically ~5 MB per origin).
- **Heuristic Plan Parsing:** Plain-text and Markdown plans vary widely; lines without recognizable headings, numbering, bullets, or metadata labels are surfaced in **Unclassified Content** for manual review rather than inferred automatically.
- **Manual Execution Only:** The QA Test Runner tracks manual completion (`Not Started` / `Completed`) and does not execute automated tests.

---

## Contributing

1. Fork the repository and create a feature or bugfix branch.
2. Verify your changes locally with `npm run lint` and `npm run build`.
3. Open a pull request describing the change clearly.
