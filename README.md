# TestPilot — Manual QA Testing Manager

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: Not Specified](https://img.shields.io/badge/License-Not%20Specified-lightgrey?style=flat-square)](#license)

TestPilot is a client-side, browser-based manual software quality assurance (QA) management dashboard. It enables QA engineers, testers, and product teams to organize projects, author structured test plans, manage test cases across distinct test phases, execute tests with step-by-step precision, record defects, analyze testing metrics with custom SVG charts, and export or backup data—all without requiring a backend server, database configuration, external API keys, or paid subscriptions.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
  - [1. Dashboard](#1-dashboard)
  - [2. Project Management](#2-project-management)
  - [3. Test Plans & Test Case Management](#3-test-plans--test-case-management)
  - [4. Test Execution](#4-test-execution)
  - [5. Defect Tracking](#5-defect-tracking)
  - [6. Reports & Analytics](#6-reports--analytics)
  - [7. Data Management & Portability](#7-data-management--portability)
- [Technology Stack](#technology-stack)
- [Application Architecture](#application-architecture)
  - [Testing Hierarchy](#testing-hierarchy)
  - [Storage Model & LocalStorage Keys](#storage-model--localstorage-keys)
- [Screenshots](#screenshots)
- [Installation & Setup](#installation--setup)
  - [Prerequisites](#prerequisites)
  - [Installation Steps](#installation-steps)
  - [Available Scripts](#available-scripts)
- [Usage Guide](#usage-guide)
- [Data Storage & Backup](#data-storage--backup)
- [Privacy & Security](#privacy--security)
- [Project Limitations](#project-limitations)
- [Project Structure](#project-structure)
- [Development & Quality Assurance](#development--quality-assurance)
- [Future Improvements](#future-improvements)
- [License](#license)
- [Author & Credits](#author--credits)

---

## Overview

Modern software development demands rigorous manual testing alongside automated testing. TestPilot provides a unified workspace for manual QA workflows:

- **100% Client-Side:** Runs completely in the user's web browser using standard Web APIs and `localStorage`.
- **Zero Infrastructure Setup:** No database provisioning, Docker containers, authentication services, or cloud billing required.
- **Hierarchical QA Structure:** Establishes a disciplined progression from high-level Projects down to granular Test Steps.
- **Data Ownership & Portability:** Complete export and import capabilities in JSON format, along with spreadsheet-ready CSV exports protected against formula injection attacks.

---

## Key Features

### 1. Dashboard
- **Live QA Metrics:** Real-time summary cards displaying Total Projects, Active Test Plans, Total Test Cases, Executions Run, Active Defects, and Overall Pass Rate.
- **QA Assessment Snapshot:** Algorithmic QA health badge classifying current test run progress (`QA Assessment: Stable Progress`, `Attention Needed`, or `Critical Blockers`).
- **Recent Projects:** Quick-access project cards showing testing progress bars, total test cases, active defects, and last updated timestamps.
- **Recent Activity Feed:** Time-stamped audit log detailing project creations, test plan updates, test case executions, and defect status changes.
- **Global Search:** Fast-access search bar with keyboard shortcut (`⌘K` / `Ctrl+K`) to jump directly to any project, plan, or test case.

### 2. Project Management
- **Full Project Lifecycle:** Create, edit, inspect, and delete testing projects.
- **Project Metadata:** Configure project name, target version/build, description, status (`Planning`, `Active`, `Paused`, `Completed`), and custom tags.
- **View Modes:** Toggle between responsive Grid View and tabular List View.
- **Search, Filter & Sort:** Instant client-side search across titles and tags; filter by project status; sort by Last Updated, Creation Date, or Alphabetical (A–Z / Z–A).
- **Cascading Deletion Safeguards:** Universal confirmation modals with automatic sanitization of child entities and defect reference unlinking.

### 3. Test Plans & Test Case Management
- **Structured Hierarchy:** Support for multiple Test Plans per project, split into dynamic Testing Phases (e.g., Smoke, Regression, Integration, UAT, System).
- **Test Suites & Categories:** Group test cases into logical suites categorized by testing scope (Functional, Non-Functional, Smoke, Regression, Security, Performance, Usability).
- **Comprehensive Test Case Authoring:**
  - Unique auto-generated test identifiers (e.g., `TC-101`).
  - Priority levels (`P1 - Critical`, `P2 - High`, `P3 - Medium`, `P4 - Low`).
  - Suite and phase assignments.
  - Preconditions and expected results.
  - Categorization tags.
- **Ordered Test Steps:** Multi-step authoring table supporting Step Number, Action/Description, and Expected Result for every individual step.

### 4. Test Execution
- **Interactive Execution Runner:** Dedicated execution modal allowing testers to step through individual test cases or execute suites in sequence.
- **Result Recording:** Assign status per test step and overall test case (`Pass`, `Fail`, `Blocked`, `Skipped`, `Not Run`).
- **Execution Metadata:** Record Actual Results, execution notes, Tester Name, and Test Environment (e.g., Staging, Production, QA-Lab, Mobile, Desktop).
- **Integrated Defect Prompt:** Automatically prompts to log a defect immediately upon recording a `Fail` status on any test step.
- **Execution History:** Chronological audit trail of past test runs with tester names, environments, timestamps, and pass/fail outcomes.

### 5. Defect Tracking
- **Defect Management:** Create, review, update, and resolve defects linked to QA activities.
- **Defect Attributes:**
  - Defect Title, Detailed Summary, and Steps to Reproduce.
  - Severity classification (`Critical`, `High`, `Medium`, `Low`).
  - Priority classification (`P1 - Critical`, `P2 - High`, `P3 - Medium`, `P4 - Low`).
  - Lifecycle Status (`Open`, `In Progress`, `Resolved`, `Closed`, `Reopened`).
  - Assigned tester/developer and environment notes.
- **Bi-Directional Relationships:** Defect records link directly to associated Test Cases and Test Executions.
- **Filtering & Search:** Filter defect lists by severity, priority, and status; search by title and description.

### 6. Reports & Analytics
- **Executive Summary Metrics:** Aggregated calculations for Total Test Cases, Completed Tests, Pass Rate, Failure Rate, and Open Defects.
- **Zero-Denominator Protection:** Built-in calculation guards ensuring `0%` is safely displayed without NaN or Infinity errors when projects are newly initialized.
- **Custom Vector SVG Charts:**
  - Donut chart rendering Pass, Fail, Blocked, and Skipped execution distributions.
  - Horizontal bar charts showing Defect Distribution by Severity.
  - Progress bar charts illustrating Test Suite Execution Coverage.
- **Date-Range Filtering:** Filter analytical records across predefined or custom date intervals.
- **QA Insights & Recommendations:** Contextual recommendations generated based on defect severity density and test completion percentages.
- **Printable Reports:** Formatted, print-ready stylesheets optimized for browser print dialogs and PDF generation.

### 7. Data Management & Portability
- **Individual Project JSON Export:** Export any selected project with its complete hierarchy (plans, phases, suites, test cases, steps, executions, defects) as a formatted JSON file (`TestPilot_ProjectName_YYYY-MM-DD.json`).
- **Complete Application JSON Backup:** Single-click full backup exporting all projects, activity logs, and settings (`TestPilot_Backup_YYYY-MM-DD.json`).
- **CSV Data Exports:**
  - Test Cases CSV (ID, title, suite, phase, priority, status, preconditions, steps count).
  - Executions CSV (ID, test case, status, tester, environment, timestamp, notes).
  - Defects CSV (ID, title, severity, priority, status, linked test case, reporter, created date).
  - **Spreadsheet Security:** Automated neutralization of spreadsheet formula injection characters (`=`, `+`, `-`, `@`, `\t`, `\r`) with UTF-8 BOM encoding for seamless Microsoft Excel and Google Sheets import.
- **JSON Import & Validation:**
  - Client-side schema validator checking structure, required fields, and data types before executing import.
  - Interactive preview modal displaying project count, case count, and defect count from the uploaded file.
  - Choice between **Merge** (appends non-duplicate records) and **Replace** (clean workspace reset and restore).
- **Session Rollback Snapshot:** Automatically captures pre-import state in `sessionStorage` (`testpilot_rollback_v1`), allowing instant one-click restoration if an import was performed accidentally.
- **Workspace Reset Safeguard:** Multi-stage confirmation dialog requiring manual typing of `RESET` with automatic backup download prompt before clearing data.

---

## Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Structure** | HTML5 | Semantic markup, accessible dialog elements, and data-driven view containers. |
| **Styling** | CSS3 & Tailwind CSS | Responsive flexbox/grid layouts, CSS custom properties (variables), Dark/Light theme switching, and `@media print` rules. |
| **Logic** | Vanilla JavaScript (ES6+) | Object-oriented modular architecture, event delegation, client-side routing, and SVG vector rendering. |
| **Persistence** | Web Storage API | Browser `localStorage` for permanent records; `sessionStorage` for rollback protection. |
| **Tooling & Bundler** | Vite | Ultra-fast local dev server and optimized production build bundling. |
| **Language Checking** | TypeScript (`tsc`) | Type-checking and static verification via `npm run lint`. |

### Key Architectural Constraint
TestPilot requires **no runtime dependencies**:
- **No** React, Angular, Vue, or UI frameworks at runtime.
- **No** Node.js runtime or backend application servers.
- **No** Firebase, Supabase, Cloud SQL, or external databases.
- **No** External paid APIs, third-party analytics, or AI services.
- **No** Heavy external charting libraries (all charts are lightweight, native inline SVG).

All devDependencies listed in `package.json` (`vite`, `@tailwindcss/vite`, `typescript`, `tsx`, `autoprefixer`) serve purely as development and build-time tooling.

---

## Application Architecture

### Testing Hierarchy

TestPilot enforces a structured six-level QA testing hierarchy:

```text
Project
 └── Test Plan
      └── Testing Phase (e.g., Smoke, Regression, Acceptance)
           └── Test Suite (e.g., Auth, Payments, Settings)
                └── Test Case (e.g., TC-101: Verify Password Reset)
                     └── Test Steps (1. Navigate, 2. Enter Email, 3. Click Submit)
```

#### Execution & Defect Relational Flow:
- **Executions:** When a Test Case is executed, an Execution Record is logged containing step-by-step results, actual notes, tester identity, and environment details.
- **Defects:** When a test step fails or an anomaly is discovered, a Defect Record is generated. The defect stores a direct pointer (`testCaseId`) to the originating test case.
- **Referential Integrity:** If a test case or suite is deleted, TestPilot safely updates related defect pointers to null/empty values without deleting the defect history itself, preventing broken references.

### Storage Model & LocalStorage Keys

All application state is serialized as JSON and managed directly in the user's browser:

| Storage Key | Type | Purpose |
|---|---|---|
| `testpilot_projects_v1` | `localStorage` | Primary array of projects containing all child test plans, phases, suites, test cases, executions, and defects. |
| `testpilot_activities_v1` | `localStorage` | Rolling audit log of recent user actions displayed on the dashboard feed. |
| `testpilot_theme_preference` | `localStorage` | User's active theme setting (`"dark"` or `"light"`). |
| `testpilot_rollback_v1` | `sessionStorage` | Temporary emergency snapshot saved immediately before performing a JSON import/restore operation. |

---

## Screenshots

*Note: Screenshots are not committed to this repository to maintain a minimal codebase footprint. Below are descriptions of the key views and where screenshots can be placed.*

- **Dashboard View** (`docs/screenshots/dashboard.png`): Overview of QA statistics cards, recent projects grid, activity stream, and QA health indicator.
- **Project Workspace** (`docs/screenshots/projects.png`): Project cards, status filtering tabs, list/grid toggle, and search controls.
- **Test Plans & Suites** (`docs/screenshots/test-plans.png`): Multi-phase test tree showing suites, test case tables, priority badges, and step drawers.
- **Test Execution Runner** (`docs/screenshots/execution-runner.png`): Modal interface for running test steps, selecting Pass/Fail/Blocked/Skipped outcomes, and entering tester notes.
- **Defects Tracker** (`docs/screenshots/defects.png`): Defect registry with severity indicators, status badges, and test case links.
- **Reports & Analytics** (`docs/screenshots/reports.png`): Visual dashboard with SVG donut charts, defect distribution bars, and printable QA summary sheets.
- **Data Management** (`docs/screenshots/data-management.png`): Four-tab workspace for JSON exports, application backups, CSV generation, and schema validation imports.

---

## Installation & Setup

### Prerequisites

- **Node.js:** v18.0.0 or higher recommended.
- **npm:** v9.0.0 or higher.

### Installation Steps

1. Clone the repository:
   ```bash
   git clone <YOUR_REPOSITORY_URL>
   cd testpilot
   ```

2. Install development dependencies:
   ```bash
   npm install
   ```

### Available Scripts

The following commands are defined in `package.json`:

| Command | Action |
|---|---|
| `npm run dev` | Starts the Vite local development server on `http://0.0.0.0:3000`. |
| `npm run build` | Compiles and bundles production-ready HTML, CSS, and JavaScript into the `dist/` directory. |
| `npm run preview` | Serves the local `dist/` production build for verification. |
| `npm run lint` | Runs TypeScript static verification (`tsc --noEmit`) to validate type contracts. |
| `npm run clean` | Cleans up the `dist/` build directory and temporary server files. |

---

## Usage Guide

Follow this step-by-step workflow to manage QA testing with TestPilot:

1. **Launch the Application:** Run `npm run dev` and open `http://localhost:3000` in your browser.
2. **Create a Project:** Click **+ New Project** on the Dashboard or My Projects view. Enter the project name, version, status, and tags.
3. **Open the Project Workspace:** Click on the project card to view its specific testing modules.
4. **Create a Test Plan:** Navigate to **Test Plans** and click **+ New Test Plan**. Specify the plan title, objective, and target scope.
5. **Define Phases & Test Suites:** Add testing phases (e.g., *Phase 1: Smoke Tests*, *Phase 2: Regression*) and create test suites (e.g., *User Authentication*, *Billing Workflow*).
6. **Author Test Cases:** Click **+ Add Test Case** within a suite. Define preconditions, priority (P1–P4), tags, and expected results.
7. **Add Ordered Steps:** In the test case editor, add individual steps with clear action instructions and expected step results.
8. **Execute Tests:** Click **Run Test** on any test case or choose bulk execution. Mark each step as `Pass`, `Fail`, `Blocked`, or `Skipped`. Add tester notes and environment details.
9. **Log Defects:** If a step fails, click the defect prompt to log an issue with severity and reproduction steps.
10. **Review Analytics & Reports:** Navigate to **Reports & Analytics** to inspect execution coverage, pass rates, and defect distribution charts.
11. **Export & Backup:** Navigate to **Data Management** to download an individual project JSON file, export CSVs for your team, or save a complete workspace backup.

---

## Data Storage & Backup

- **Browser-Local Storage:** All application data is saved directly in your web browser via `window.localStorage`.
- **Persistence Across Sessions:** Your data remains intact when closing tabs, refreshing, or quitting your browser, provided you use the same browser profile.
- **Storage Limits:** Standard browser `localStorage` typically allocates between 5MB and 10MB per origin. The application tracks storage usage and warns when space is constrained.
- **Data Loss Precautions:** Clearing your browser cache, browsing history, or website storage will delete locally stored application records.
- **Recommended Backup Practice:** Regularly download a full workspace backup via **Data Management > Backup and Restore > Download Application Backup (.json)**.
- **Rollback Safety:** Performing a JSON import automatically stores a safety snapshot in `sessionStorage`, allowing you to immediately undo the import if needed during that session.
- **Spreadsheet Compatibility:** CSV exports automatically include a UTF-8 Byte Order Mark (BOM) and sanitize leading characters (`=`, `+`, `-`, `@`) to protect against CSV formula injection.
- **PDF Generation:** To generate a PDF report, open the printable view in Reports & Analytics or Data Management and choose **Save as PDF** in the browser's native print dialog.

---

## Privacy & Security

- **No Remote Telemetry or Tracking:** TestPilot does not transmit your project names, test cases, execution results, or defects to any remote server or third-party service.
- **No User Account Required:** The application operates without requiring registration, passwords, email addresses, or session tokens.
- **No External Cloud Storage:** Data resides entirely inside your local browser sandbox.
- **Import Validation:** Uploaded JSON files are parsed through strict client-side validation schema to prevent malformed data or unauthorized property injection.
- **Formula Neutralization:** All CSV export routines prepend a single quote (`'`) to any table cell starting with formula symbols (`=`, `+`, `-`, `@`), preventing spreadsheet execution exploits in Microsoft Excel, LibreOffice, or Google Sheets.

---

## Project Limitations

- **Single-Device / Single-Browser Scope:** Because data is stored in `localStorage`, records are not automatically synchronized across different computers, mobile devices, or different browsers on the same machine.
- **No Real-Time Collaboration:** Concurrent multi-user live editing is not supported without a shared central database. Teams can share data by exporting and importing JSON project files.
- **Storage Size Boundaries:** Not intended for storing large binary attachments (e.g., high-resolution video recordings or multi-megabyte crash dumps) inside `localStorage`.
- **Browser-Driven PDF Creation:** PDF documents are produced via standard `@media print` CSS rules using the browser's print dialog rather than server-side headless browser rendering.

---

## Project Structure

```text
TestPilot/
├── .env.example         # Environment template configuration
├── .gitignore           # Git ignore patterns for node_modules, dist, etc.
├── README.md            # Comprehensive project documentation
├── index.html           # Main single-page application entry point & layout
├── metadata.json        # AI Studio application metadata and capabilities
├── package.json         # Node package configuration, scripts, and dependencies
├── script.js            # Complete application logic, state managers, and views
├── style.css            # Application stylesheets, design tokens, and themes
├── tsconfig.json        # TypeScript compiler configuration
└── vite.config.ts       # Vite bundler and development server configuration
```

---

## Development & Quality Assurance

Developers working on TestPilot can utilize the following validation workflows:

- **Static Type Checking:** Run `npm run lint` to execute `tsc --noEmit`. This ensures the TypeScript configuration and environment types pass without syntax or import errors.
- **Production Build Validation:** Run `npm run build` to verify that HTML, CSS, and JavaScript bundle cleanly into `dist/` with zero bundling errors.
- **Preview Server:** Run `npm run preview` to test the minified production distribution in an isolated local environment.
- **Manual QA Testing:** TestPilot is designed to test software applications—including itself. Use the built-in test case runner to define regression test suites for navigation, local storage persistence, and export/import round-trips.

---

## Future Improvements

Potential enhancements that could be considered for future iterations:

- **Cloud Synchronization & Backend Adapters:** Optional sync engine with Firebase, Supabase, or PostgreSQL for multi-device synchronization.
- **Team Collaboration:** Multi-tenant workspaces with role-based access control (Admin, Lead QA, Tester, Developer).
- **Issue Tracker Integrations:** Direct two-way sync with Jira, GitHub Issues, or GitLab via personal access tokens or OAuth.
- **Automated Test Ingestion:** CLI or REST endpoint to import automated test results from JUnit XML, Playwright, Cypress, or TestNG.
- **Direct PDF Export:** Client-side binary PDF generation via libraries such as `pdfmake` or `jsPDF` for one-click downloading without opening the print dialog.

---

## License

No license has been specified for this repository yet. All rights are reserved by the original project author unless otherwise indicated.

---

## Author & Credits

- **Author:** [Your Name]
- **Original Repository:** `Hannankhan203/Test-Pilot`
- **Core Technologies:** HTML5, CSS3, Modern JavaScript (ES6+), and [Vite](https://vitejs.dev/).
- **Icons:** Inline SVG iconography inspired by [Lucide Icons](https://lucide.dev/).
- **Platform:** Developed and refined with [Google AI Studio](https://ai.google.dev/).
