/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TestPilot — QA Checklists Persistence, Validation & Progress Store (Prompt 2)
 * Manages browser localStorage persistence under versioned keys completely
 * independent of unrelated TestPilot project storage.
 */

export const CHECKLISTS_STORAGE_KEY = 'testpilot_qa_checklists_v1';
export const ACTIVE_RUNNER_STORAGE_KEY = 'testpilot_qa_active_runner_v1';
export const SCHEMA_VERSION = 1;

export const TEST_STATUS = Object.freeze({
  NOT_STARTED: 'Not Started',
  COMPLETED: 'Completed'
});

let fallbackCounter = 1;

export function generateStableId(prefix = 'id') {
  fallbackCounter += 1;
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${rand}_${fallbackCounter}`;
}

/**
 * Memory fallback used only if browser localStorage is disabled/blocked or in headless tests.
 */
function createMemoryStorage() {
  const map = new Map();
  return {
    getItem(k) {
      return map.has(k) ? map.get(k) : null;
    },
    setItem(k, v) {
      map.set(k, String(v));
    },
    removeItem(k) {
      map.delete(k);
    }
  };
}

let memoryFallback = null;
let customStorageAdapter = null;

export function setStorageAdapterForTesting(adapterOrNull) {
  customStorageAdapter = adapterOrNull;
}

function getStorageBackend() {
  if (customStorageAdapter) {
    return { backend: customStorageAdapter, isFallback: false };
  }
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const probeKey = '__tp_qa_probe__';
      window.localStorage.setItem(probeKey, '1');
      window.localStorage.removeItem(probeKey);
      return { backend: window.localStorage, isFallback: false };
    }
  } catch (_err) {
    // localStorage blocked (e.g. strict privacy mode)
  }
  if (!memoryFallback) {
    memoryFallback = createMemoryStorage();
  }
  return { backend: memoryFallback, isFallback: true };
}

// ============================================================================
// Normalization & Schema Validation
// ============================================================================

function normalizeTestRecord(rawTest) {
  if (!rawTest || typeof rawTest !== 'object') return null;
  const text = typeof rawTest.text === 'string'
    ? rawTest.text.trim()
    : (rawTest.text !== undefined && rawTest.text !== null ? String(rawTest.text).trim() : '');
  const testId = typeof rawTest.testId === 'string'
    ? rawTest.testId.trim()
    : (rawTest.testId !== undefined && rawTest.testId !== null ? String(rawTest.testId).trim() : '');
  const priority = typeof rawTest.priority === 'string'
    ? rawTest.priority.trim()
    : (rawTest.priority !== undefined && rawTest.priority !== null ? String(rawTest.priority).trim() : '');

  const rawStatusStr = typeof rawTest.status === 'string' ? rawTest.status.trim() : '';
  const isRecognizedStatus =
    rawStatusStr.toLowerCase() === TEST_STATUS.COMPLETED.toLowerCase() ||
    rawStatusStr.toLowerCase() === TEST_STATUS.NOT_STARTED.toLowerCase();

  const isCompleted = isRecognizedStatus
    ? rawStatusStr.toLowerCase() === TEST_STATUS.COMPLETED.toLowerCase()
    : rawTest.completed === true;

  return {
    id: typeof rawTest.id === 'string' && rawTest.id.trim() ? rawTest.id.trim() : generateStableId('test'),
    testId,
    priority,
    text: text !== '' ? text : 'Untitled test item',
    status: isCompleted ? TEST_STATUS.COMPLETED : TEST_STATUS.NOT_STARTED,
    completed: isCompleted
  };
}

function normalizeNoteRecord(rawNote) {
  if (!rawNote || typeof rawNote !== 'object') return null;
  const text = typeof rawNote.text === 'string'
    ? rawNote.text.trim()
    : (rawNote.text !== undefined && rawNote.text !== null ? String(rawNote.text).trim() : '');
  if (!text) return null;
  const validKinds = ['environment', 'instruction', 'note'];
  return {
    id: typeof rawNote.id === 'string' && rawNote.id.trim() ? rawNote.id.trim() : generateStableId('note'),
    kind: validKinds.includes(rawNote.kind) ? rawNote.kind : 'note',
    text
  };
}

function normalizeSectionRecord(rawSec) {
  if (!rawSec || typeof rawSec !== 'object') return null;
  const type = rawSec.type === 'category' ? 'category' : 'direct';
  const name = type === 'category'
    ? (typeof rawSec.name === 'string' && rawSec.name.trim()
        ? rawSec.name.trim()
        : (rawSec.name !== undefined && rawSec.name !== null && String(rawSec.name).trim() !== ''
            ? String(rawSec.name).trim()
            : 'Category'))
    : '';

  const notes = Array.isArray(rawSec.notes)
    ? rawSec.notes.map(normalizeNoteRecord).filter(Boolean)
    : [];

  const seenTestIds = new Set();
  const tests = Array.isArray(rawSec.tests)
    ? rawSec.tests
        .map(normalizeTestRecord)
        .filter(Boolean)
        .map(tc => {
          if (seenTestIds.has(tc.id)) {
            return { ...tc, id: generateStableId('test') };
          }
          seenTestIds.add(tc.id);
          return tc;
        })
    : [];

  return {
    id: typeof rawSec.id === 'string' && rawSec.id.trim() ? rawSec.id.trim() : generateStableId('sec'),
    type,
    name,
    notes,
    tests
  };
}

export function derivePhaseNumberFromLabel(phaseLabel, fallbackNumber = '') {
  const lbl = typeof phaseLabel === 'string'
    ? phaseLabel.trim()
    : (phaseLabel !== undefined && phaseLabel !== null ? String(phaseLabel).trim() : '');
  const fallbackStr = typeof fallbackNumber === 'string'
    ? fallbackNumber.trim()
    : (typeof fallbackNumber === 'number' ? String(fallbackNumber) : '');
  if (!lbl) return fallbackStr;
  const cleaned = lbl.replace(/[:—–\-.]+$/, '').trim();
  const tokenMatch =
    cleaned.match(/(?:#|\s)([0-9]+(?:\.[0-9]+)*|[A-Za-z0-9]+)$/) ||
    cleaned.match(/^([0-9]+(?:\.[0-9]+)*)$/);
  if (tokenMatch) {
    const token = tokenMatch[1].trim();
    if (['phase', 'stage', 'testing', 'qa', 'unknown'].includes(token.toLowerCase())) {
      return fallbackStr;
    }
    return token;
  }
  return fallbackStr;
}

export function parsePhaseNumber(val) {
  if (typeof val === 'number') {
    return Number.isFinite(val) ? val : null;
  }
  if (typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (!trimmed) return null;
  const token = derivePhaseNumberFromLabel(trimmed, trimmed);
  const match = token.match(/^(\d+(?:\.\d+)?)/);
  if (match) {
    const parsed = parseFloat(match[1]);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function comparePhaseNumbers(numA, numB) {
  const valA = parsePhaseNumber(numA);
  const valB = parsePhaseNumber(numB);

  if (valA !== null && valB !== null) {
    if (valA !== valB) {
      return valA - valB;
    }
    return String(numA ?? '').localeCompare(String(numB ?? ''), undefined, { numeric: true, sensitivity: 'base' });
  }

  if (valA !== null && valB === null) return -1;
  if (valA === null && valB !== null) return 1;

  return String(numA ?? '').localeCompare(String(numB ?? ''), undefined, { numeric: true, sensitivity: 'base' });
}

export function comparePhases(phaseA, phaseB) {
  if (!phaseA && !phaseB) return 0;
  if (!phaseA) return 1;
  if (!phaseB) return -1;

  if (typeof phaseA.order === 'number' && typeof phaseB.order === 'number' && phaseA.order !== phaseB.order) {
    return phaseA.order - phaseB.order;
  }

  const numA = (phaseA.phaseNumber !== undefined && phaseA.phaseNumber !== null && phaseA.phaseNumber !== '')
    ? String(phaseA.phaseNumber)
    : (typeof phaseA.phaseLabel === 'string' ? derivePhaseNumberFromLabel(phaseA.phaseLabel, '') : '');
  const numB = (phaseB.phaseNumber !== undefined && phaseB.phaseNumber !== null && phaseB.phaseNumber !== '')
    ? String(phaseB.phaseNumber)
    : (typeof phaseB.phaseLabel === 'string' ? derivePhaseNumberFromLabel(phaseB.phaseLabel, '') : '');

  if ((numA !== '' && numA !== undefined && numA !== null) || (numB !== '' && numB !== undefined && numB !== null)) {
    const comp = comparePhaseNumbers(numA, numB);
    if (comp !== 0) return comp;
  }

  const nameA = phaseA.name !== undefined && phaseA.name !== null ? String(phaseA.name) : '';
  const nameB = phaseB.name !== undefined && phaseB.name !== null ? String(phaseB.name) : '';
  return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' });
}

export function sortPhases(phases) {
  if (!Array.isArray(phases)) return [];
  return [...phases].sort(comparePhases);
}

function normalizePhaseRecord(rawPhase, idx = 0) {
  if (!rawPhase || typeof rawPhase !== 'object') return null;

  const phaseLabel = typeof rawPhase.phaseLabel === 'string'
    ? rawPhase.phaseLabel.trim()
    : (rawPhase.phaseLabel !== undefined && rawPhase.phaseLabel !== null ? String(rawPhase.phaseLabel).trim() : '');
  const rawPhaseNumber = typeof rawPhase.phaseNumber === 'string'
    ? rawPhase.phaseNumber.trim()
    : (typeof rawPhase.phaseNumber === 'number' ? String(rawPhase.phaseNumber) : '');
  const phaseNumber = phaseLabel ? derivePhaseNumberFromLabel(phaseLabel, rawPhaseNumber) : rawPhaseNumber;
  const name =
    rawPhase.name !== undefined && rawPhase.name !== null && String(rawPhase.name).trim()
      ? String(rawPhase.name).trim()
      : `Phase ${idx + 1}`;
  const description = typeof rawPhase.description === 'string' ? rawPhase.description.trim() : '';

  const notes = Array.isArray(rawPhase.notes)
    ? rawPhase.notes.map(normalizeNoteRecord).filter(Boolean)
    : [];

  const seenSectionIds = new Set();
  const sections = Array.isArray(rawPhase.sections)
    ? rawPhase.sections
        .map(normalizeSectionRecord)
        .filter(Boolean)
        .map(sec => {
          if (seenSectionIds.has(sec.id)) {
            return { ...sec, id: generateStableId('sec') };
          }
          seenSectionIds.add(sec.id);
          return sec;
        })
    : [];

  return {
    id: typeof rawPhase.id === 'string' && rawPhase.id.trim() ? rawPhase.id.trim() : generateStableId('phase'),
    phaseLabel,
    phaseNumber,
    name,
    isImplicit: Boolean(rawPhase.isImplicit),
    description,
    expanded: rawPhase.expanded !== false, // Expanded by default
    notes,
    sections
  };
}

export function normalizeChecklistRecord(rawChecklist) {
  if (!rawChecklist || typeof rawChecklist !== 'object') return null;

  const nowIso = new Date().toISOString();
  const createdAt =
    typeof rawChecklist.createdAt === 'string' && !Number.isNaN(Date.parse(rawChecklist.createdAt))
      ? rawChecklist.createdAt
      : nowIso;
  const updatedAt =
    typeof rawChecklist.updatedAt === 'string' && !Number.isNaN(Date.parse(rawChecklist.updatedAt))
      ? rawChecklist.updatedAt
      : createdAt;

  const title =
    rawChecklist.title !== undefined && rawChecklist.title !== null && String(rawChecklist.title).trim()
      ? String(rawChecklist.title).trim()
      : 'Untitled QA Checklist';

  const documentNotes = Array.isArray(rawChecklist.documentNotes)
    ? rawChecklist.documentNotes.map(normalizeNoteRecord).filter(Boolean)
    : [];

  const seenPhaseIds = new Set();
  const seenGlobalTestIds = new Set();

  const phases = Array.isArray(rawChecklist.phases)
    ? rawChecklist.phases
        .map((ph, idx) => normalizePhaseRecord(ph, idx))
        .filter(Boolean)
        .map(ph => {
          const safePhase = seenPhaseIds.has(ph.id) ? { ...ph, id: generateStableId('phase') } : ph;
          seenPhaseIds.add(safePhase.id);
          safePhase.sections = safePhase.sections.map(sec => ({
            ...sec,
            tests: sec.tests.map(tc => {
              if (seenGlobalTestIds.has(tc.id)) {
                const freshId = generateStableId('test');
                seenGlobalTestIds.add(freshId);
                return { ...tc, id: freshId };
              }
              seenGlobalTestIds.add(tc.id);
              return tc;
            })
          }));
          return safePhase;
        })
    : [];

  return {
    id:
      typeof rawChecklist.id === 'string' && rawChecklist.id.trim()
        ? rawChecklist.id.trim()
        : generateStableId('chk'),
    schemaVersion: SCHEMA_VERSION,
    title,
    createdAt,
    updatedAt,
    documentNotes,
    phases
  };
}

// ============================================================================
// Progress Calculations (Requirement 10)
// ============================================================================

function computeSafePercentage(completedCount, totalCount) {
  if (!totalCount || totalCount <= 0 || completedCount <= 0) {
    return 0;
  }
  if (completedCount >= totalCount) {
    return 100;
  }
  // Never round an incomplete checklist up to 100%, and never round non-zero progress down to 0%
  const rawPct = Math.round((completedCount / totalCount) * 100);
  return Math.min(99, Math.max(1, rawPct));
}

export function calculatePhaseProgress(phase) {
  if (!phase || !Array.isArray(phase.sections)) {
    return {
      totalTests: 0,
      completedTests: 0,
      remainingTests: 0,
      percentage: 0,
      isComplete: false
    };
  }

  let totalTests = 0;
  let completedTests = 0;

  for (const sec of phase.sections) {
    if (!Array.isArray(sec.tests)) continue;
    for (const tc of sec.tests) {
      totalTests += 1;
      if (tc.status === TEST_STATUS.COMPLETED || tc.completed === true) {
        completedTests += 1;
      }
    }
  }

  const remainingTests = Math.max(0, totalTests - completedTests);
  const percentage = computeSafePercentage(completedTests, totalTests);

  return {
    totalTests,
    completedTests,
    remainingTests,
    percentage,
    isComplete: totalTests > 0 && completedTests === totalTests
  };
}

export function calculateChecklistProgress(checklist) {
  if (!checklist || !Array.isArray(checklist.phases)) {
    return {
      totalPhases: 0,
      totalTests: 0,
      completedTests: 0,
      remainingTests: 0,
      percentage: 0,
      isComplete: false
    };
  }

  let totalTests = 0;
  let completedTests = 0;

  for (const phase of checklist.phases) {
    const pp = calculatePhaseProgress(phase);
    totalTests += pp.totalTests;
    completedTests += pp.completedTests;
  }

  const remainingTests = Math.max(0, totalTests - completedTests);
  const percentage = computeSafePercentage(completedTests, totalTests);

  return {
    totalPhases: checklist.phases.length,
    totalTests,
    completedTests,
    remainingTests,
    percentage,
    isComplete: totalTests > 0 && completedTests === totalTests
  };
}

// ============================================================================
// Title Derivation Helper
// ============================================================================

export function deriveDefaultChecklistTitle(parsedPlan) {
  if (parsedPlan) {
    if (parsedPlan.documentTitle !== undefined && parsedPlan.documentTitle !== null && String(parsedPlan.documentTitle).trim() !== '') {
      return String(parsedPlan.documentTitle).trim();
    }
    if (parsedPlan.title !== undefined && parsedPlan.title !== null && String(parsedPlan.title).trim() !== '') {
      return String(parsedPlan.title).trim();
    }
  }

  if (parsedPlan && Array.isArray(parsedPlan.phases) && parsedPlan.phases.length > 0) {
    const firstNamed = parsedPlan.phases.find(p => !p.isImplicit && p.name !== undefined && p.name !== null && String(p.name).trim() !== '');
    if (firstNamed) {
      const cleanName = String(firstNamed.name).trim();
      if (parsedPlan.phases.length === 1) {
        return `${cleanName} QA Checklist`;
      }
      return `QA Checklist — ${cleanName} (+${parsedPlan.phases.length - 1} more)`;
    }
  }

  const dateStr = new Date().toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  return `Manual QA Checklist (${dateStr})`;
}

// ============================================================================
// Storage Read / Write Operations
// ============================================================================

export function loadAllChecklists() {
  const { backend, isFallback } = getStorageBackend();
  try {
    const raw = backend.getItem(CHECKLISTS_STORAGE_KEY);
    if (!raw) {
      return { checklists: [], warning: isFallback ? 'Local storage is restricted; using session memory.' : null };
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (_parseErr) {
      console.warn('TestPilot: Malformed JSON in testpilot_qa_checklists_v1; recovering safely.');
      return {
        checklists: [],
        warning: 'Stored checklist data appeared corrupted and could not be parsed. Starting with a clean state.'
      };
    }

    const rawItems = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === 'object' && Array.isArray(parsed.checklists)
        ? parsed.checklists
        : null;

    if (!rawItems) {
      return {
        checklists: [],
        warning: 'Stored checklist format was invalid and was safely ignored.'
      };
    }

    const seenChecklistIds = new Set();
    const checklists = rawItems
      .map(normalizeChecklistRecord)
      .filter(Boolean)
      .map(chk => {
        if (seenChecklistIds.has(chk.id)) {
          const repairedId = generateStableId('chk');
          seenChecklistIds.add(repairedId);
          return { ...chk, id: repairedId };
        }
        seenChecklistIds.add(chk.id);
        return chk;
      });

    return {
      checklists,
      warning: isFallback ? 'Browser localStorage is unavailable; changes will only persist for this tab session.' : null
    };
  } catch (err) {
    console.error('TestPilot: Failed reading QA checklists', err);
    return {
      checklists: [],
      warning: 'Unable to access browser storage.'
    };
  }
}

export function saveAllChecklists(checklistsArray) {
  const { backend, isFallback } = getStorageBackend();
  try {
    const normalized = Array.isArray(checklistsArray)
      ? checklistsArray.map(normalizeChecklistRecord).filter(Boolean)
      : [];

    const payload = JSON.stringify({
      schemaVersion: SCHEMA_VERSION,
      savedAt: new Date().toISOString(),
      checklists: normalized
    });

    backend.setItem(CHECKLISTS_STORAGE_KEY, payload);
    return {
      ok: true,
      isFallback,
      error: null
    };
  } catch (err) {
    const isQuota =
      err &&
      (err.name === 'QuotaExceededError' ||
        err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        err.code === 22 ||
        err.code === 1014);

    console.error('TestPilot: Failed saving QA checklists', err);
    return {
      ok: false,
      isFallback,
      error: isQuota
        ? 'Browser storage quota exceeded. Delete unused checklists or export old projects to free space.'
        : 'Unable to save checklist progress to browser localStorage.'
    };
  }
}

export function getActiveRunnerState() {
  const { backend } = getStorageBackend();
  try {
    const raw = backend.getItem(ACTIVE_RUNNER_STORAGE_KEY);
    if (!raw) return { activeChecklistId: null, lastQaView: null };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return { activeChecklistId: null, lastQaView: null };
    }
    return {
      activeChecklistId: typeof parsed.activeChecklistId === 'string' ? parsed.activeChecklistId : null,
      lastQaView: typeof parsed.lastQaView === 'string' ? parsed.lastQaView : null
    };
  } catch (_err) {
    return { activeChecklistId: null, lastQaView: null };
  }
}

export function saveActiveRunnerState(partialState) {
  const { backend } = getStorageBackend();
  try {
    const current = getActiveRunnerState();
    const next = {
      activeChecklistId:
        partialState && 'activeChecklistId' in partialState
          ? partialState.activeChecklistId
          : current.activeChecklistId,
      lastQaView:
        partialState && 'lastQaView' in partialState
          ? partialState.lastQaView
          : current.lastQaView
    };
    if (
      next.activeChecklistId === current.activeChecklistId &&
      next.lastQaView === current.lastQaView
    ) {
      return true;
    }
    backend.setItem(ACTIVE_RUNNER_STORAGE_KEY, JSON.stringify(next));
    return true;
  } catch (_err) {
    return false;
  }
}

export function getChecklistById(checklistId) {
  if (!checklistId) return null;
  const { checklists } = loadAllChecklists();
  return checklists.find(c => c.id === checklistId) || null;
}

// ============================================================================
// Checklist Lifecycle & Granular Runner Mutations
// ============================================================================

export function createChecklistFromParsedPlan(parsedPlan, customTitle = '') {
  if (!parsedPlan || !Array.isArray(parsedPlan.phases) || parsedPlan.phases.length === 0) {
    return {
      ok: false,
      checklist: null,
      error: 'Cannot start testing: the checklist contains no phases.'
    };
  }

  // Filter out completely blank placeholder test rows that user added and left empty, while preserving valid tests
  const cleanedPhases = parsedPlan.phases.map((ph, pIdx) => {
    const cleanedSections = (Array.isArray(ph.sections) ? ph.sections : [])
      .map(sec => {
        const validTests = (Array.isArray(sec.tests) ? sec.tests : [])
          .filter(t => t && (typeof t.text === 'string' ? t.text.trim().length > 0 : (t.text !== undefined && t.text !== null && String(t.text).trim().length > 0)))
          .map(t => ({
            id: generateStableId('test'),
            testId: typeof t.testId === 'string' ? t.testId.trim() : (t.testId !== undefined && t.testId !== null ? String(t.testId).trim() : ''),
            priority: typeof t.priority === 'string' ? t.priority.trim() : (t.priority !== undefined && t.priority !== null ? String(t.priority).trim() : ''),
            text: String(t.text).trim(),
            status: TEST_STATUS.NOT_STARTED,
            completed: false
          }));

        return {
          id: generateStableId('sec'),
          type: sec.type === 'category' ? 'category' : 'direct',
          name: sec.type === 'category' ? ((sec.name !== undefined && sec.name !== null && String(sec.name).trim() !== '') ? String(sec.name).trim() : 'Category') : '',
          notes: Array.isArray(sec.notes)
            ? sec.notes
                .filter(n => n && (typeof n.text === 'string' ? n.text.trim() : (n.text !== undefined && n.text !== null && String(n.text).trim())))
                .map(n => ({
                  id: generateStableId('note'),
                  kind: n.kind || 'note',
                  text: String(n.text).trim()
                }))
            : [],
          tests: validTests
        };
      })
      .filter(sec => sec.type === 'category' || sec.tests.length > 0 || sec.notes.length > 0);

    const cleanedLabel = typeof ph.phaseLabel === 'string'
      ? ph.phaseLabel.trim()
      : (ph.phaseLabel !== undefined && ph.phaseLabel !== null ? String(ph.phaseLabel).trim() : '');
    const cleanedNum = typeof ph.phaseNumber === 'string'
      ? ph.phaseNumber.trim()
      : (typeof ph.phaseNumber === 'number' ? String(ph.phaseNumber) : '');

    return {
      id: generateStableId('phase'),
      phaseLabel: cleanedLabel,
      phaseNumber: cleanedLabel ? derivePhaseNumberFromLabel(cleanedLabel, cleanedNum) : (cleanedNum !== '' ? cleanedNum : ''),
      name: (ph.name !== undefined && ph.name !== null && String(ph.name).trim()) ? String(ph.name).trim() : `Phase ${pIdx + 1}`,
      isImplicit: Boolean(ph.isImplicit),
      description: typeof ph.description === 'string' ? ph.description.trim() : '',
      expanded: true,
      notes: Array.isArray(ph.notes)
        ? ph.notes
            .filter(n => n && typeof n.text === 'string' && n.text.trim())
            .map(n => ({
              id: generateStableId('note'),
              kind: n.kind || 'note',
              text: n.text.trim()
            }))
        : [],
      sections: cleanedSections
    };
  });

  const totalValidTests = cleanedPhases.reduce(
    (sum, ph) => sum + ph.sections.reduce((sAcc, sec) => sAcc + sec.tests.length, 0),
    0
  );

  if (totalValidTests === 0) {
    return {
      ok: false,
      checklist: null,
      error: 'Add at least one test item before starting manual testing.'
    };
  }

  const nowIso = new Date().toISOString();
  const resolvedTitle =
    (customTitle !== undefined && customTitle !== null && String(customTitle).trim() !== '')
      ? String(customTitle).trim()
      : deriveDefaultChecklistTitle(parsedPlan);

  const newChecklist = normalizeChecklistRecord({
    id: generateStableId('chk'),
    schemaVersion: SCHEMA_VERSION,
    title: resolvedTitle,
    createdAt: nowIso,
    updatedAt: nowIso,
    documentNotes: Array.isArray(parsedPlan.documentNotes) ? parsedPlan.documentNotes : [],
    phases: cleanedPhases
  });

  const { checklists } = loadAllChecklists();
  // Prepend new checklist without overwriting any existing checklist
  const existingIds = new Set(checklists.map(c => c.id));
  while (existingIds.has(newChecklist.id)) {
    newChecklist.id = generateStableId('chk');
  }

  const nextList = [newChecklist, ...checklists];
  const saveRes = saveAllChecklists(nextList);
  if (!saveRes.ok) {
    return {
      ok: false,
      checklist: null,
      error: saveRes.error
    };
  }

  saveActiveRunnerState({
    activeChecklistId: newChecklist.id,
    lastQaView: 'qa-runner'
  });

  return {
    ok: true,
    checklist: newChecklist,
    isFallback: saveRes.isFallback,
    error: null
  };
}

function mutateChecklistById(checklistId, mutatorFn, touchUpdatedAt = true) {
  const { checklists } = loadAllChecklists();
  const idx = checklists.findIndex(c => c.id === checklistId);
  if (idx === -1) {
    return { ok: false, checklist: null, error: 'Checklist not found.' };
  }

  const target = checklists[idx];
  const didMutate = mutatorFn(target);
  if (didMutate === false) {
    return { ok: false, checklist: target, error: 'Requested item could not be found.' };
  }

  if (touchUpdatedAt) {
    target.updatedAt = new Date().toISOString();
  }

  const saveRes = saveAllChecklists(checklists);
  if (!saveRes.ok) {
    return { ok: false, checklist: target, error: saveRes.error };
  }

  return { ok: true, checklist: target, error: null };
}

export function toggleChecklistTest(checklistId, targetTestId, completedState) {
  let matchedPhaseId = null;
  let updatedTest = null;

  const res = mutateChecklistById(checklistId, checklist => {
    for (const phase of checklist.phases) {
      for (const sec of phase.sections) {
        const tc = sec.tests.find(t => t.id === targetTestId);
        if (tc) {
          const nextBool = typeof completedState === 'boolean' ? completedState : !tc.completed;
          tc.completed = nextBool;
          tc.status = nextBool ? TEST_STATUS.COMPLETED : TEST_STATUS.NOT_STARTED;
          matchedPhaseId = phase.id;
          updatedTest = tc;
          return true;
        }
      }
    }
    return false;
  });

  return {
    ...res,
    phaseId: matchedPhaseId,
    test: updatedTest
  };
}

export function setChecklistPhaseExpanded(checklistId, phaseId, expandedBool) {
  return mutateChecklistById(
    checklistId,
    checklist => {
      const ph = checklist.phases.find(p => p.id === phaseId);
      if (!ph) return false;
      ph.expanded = Boolean(expandedBool);
      return true;
    },
    false // Expanding/collapsing UI section shouldn't alter content updatedAt timestamp
  );
}

export function setAllChecklistPhasesExpanded(checklistId, expandedBool) {
  return mutateChecklistById(
    checklistId,
    checklist => {
      for (const ph of checklist.phases) {
        ph.expanded = Boolean(expandedBool);
      }
      return true;
    },
    false
  );
}

export function renameChecklistById(checklistId, newTitle) {
  const cleanTitle = typeof newTitle === 'string' ? newTitle.trim() : '';
  if (!cleanTitle) {
    return { ok: false, checklist: null, error: 'Checklist title cannot be empty.' };
  }
  return mutateChecklistById(checklistId, checklist => {
    checklist.title = cleanTitle;
    return true;
  });
}

export function deleteChecklistById(checklistId) {
  const { checklists } = loadAllChecklists();
  const nextList = checklists.filter(c => c.id !== checklistId);
  if (nextList.length === checklists.length) {
    return { ok: false, remaining: checklists, error: 'Checklist not found.' };
  }

  const saveRes = saveAllChecklists(nextList);
  if (!saveRes.ok) {
    return { ok: false, remaining: checklists, error: saveRes.error };
  }

  const activeState = getActiveRunnerState();
  if (activeState.activeChecklistId === checklistId) {
    saveActiveRunnerState({
      activeChecklistId: nextList.length > 0 ? nextList[0].id : null,
      lastQaView: nextList.length > 0 ? activeState.lastQaView : 'my-checklists'
    });
  }

  return { ok: true, remaining: nextList, error: null };
}

// ============================================================================
// Runner In-Place Editing Operations (Requirement 9 — Preserves Completion State)
// ============================================================================

export function updateDocumentNotesInChecklist(checklistId, nextNotesArray) {
  return mutateChecklistById(checklistId, checklist => {
    checklist.documentNotes = Array.isArray(nextNotesArray)
      ? nextNotesArray.map(normalizeNoteRecord).filter(Boolean)
      : [];
    return true;
  });
}

export function updatePhaseInChecklist(checklistId, phaseId, updates = {}) {
  return mutateChecklistById(checklistId, checklist => {
    const phase = checklist.phases.find(p => p.id === phaseId);
    if (!phase) return false;
    if (typeof updates.phaseLabel === 'string' || typeof updates.phaseLabel === 'number') {
      phase.phaseLabel = String(updates.phaseLabel).trim();
      phase.phaseNumber = phase.phaseLabel
        ? derivePhaseNumberFromLabel(phase.phaseLabel, phase.phaseNumber)
        : '';
      phase.isImplicit = false;
    }
    if (typeof updates.phaseNumber === 'string') {
      phase.phaseNumber = updates.phaseNumber.trim();
      phase.isImplicit = false;
    } else if (typeof updates.phaseNumber === 'number') {
      phase.phaseNumber = String(updates.phaseNumber);
      phase.isImplicit = false;
    }
    if (typeof updates.name === 'string' || typeof updates.name === 'number') {
      const trimmedName = String(updates.name).trim();
      if (trimmedName) {
        phase.name = trimmedName;
        phase.isImplicit = false;
      }
    }
    if (typeof updates.description === 'string') {
      phase.description = updates.description.trim();
    }
    if (Array.isArray(updates.notes)) {
      phase.notes = updates.notes.map(normalizeNoteRecord).filter(Boolean);
    }
    return true;
  });
}

export function addPhaseToChecklist(checklistId, { phaseLabel = '', name = 'New Phase', description = '' } = {}) {
  let createdPhase = null;
  const res = mutateChecklistById(checklistId, checklist => {
    const defaultLabel = `Phase ${checklist.phases.length + 1}`;
    const assignedLabel = phaseLabel.trim() || defaultLabel;
    const assignedNum = phaseLabel.trim()
      ? derivePhaseNumberFromLabel(assignedLabel, String(checklist.phases.length + 1))
      : String(checklist.phases.length + 1);
    createdPhase = {
      id: generateStableId('phase'),
      phaseLabel: assignedLabel,
      phaseNumber: assignedNum,
      name: name.trim() || 'New Phase',
      isImplicit: false,
      description: description.trim(),
      expanded: true,
      notes: [],
      sections: []
    };
    checklist.phases.push(createdPhase);
    return true;
  });
  return { ...res, phase: createdPhase };
}

export function removePhaseFromChecklist(checklistId, phaseId) {
  return mutateChecklistById(checklistId, checklist => {
    const idx = checklist.phases.findIndex(p => p.id === phaseId);
    if (idx === -1) return false;
    checklist.phases.splice(idx, 1);
    return true;
  });
}

export function updateCategoryInChecklist(checklistId, phaseId, sectionId, newCategoryName) {
  const cleanName = typeof newCategoryName === 'string' ? newCategoryName.trim() : '';
  if (!cleanName) {
    return { ok: false, checklist: null, error: 'Category name cannot be empty.' };
  }
  return mutateChecklistById(checklistId, checklist => {
    const phase = checklist.phases.find(p => p.id === phaseId);
    if (!phase) return false;
    const sec = phase.sections.find(s => s.id === sectionId && s.type === 'category');
    if (!sec) return false;
    sec.name = cleanName;
    return true;
  });
}

export function addCategoryToChecklistPhase(checklistId, phaseId, categoryName = 'New Category') {
  let createdSection = null;
  const res = mutateChecklistById(checklistId, checklist => {
    const phase = checklist.phases.find(p => p.id === phaseId);
    if (!phase) return false;
    createdSection = {
      id: generateStableId('sec'),
      type: 'category',
      name: categoryName.trim() || 'New Category',
      notes: [],
      tests: []
    };
    phase.sections.push(createdSection);
    phase.expanded = true;
    return true;
  });
  return { ...res, section: createdSection };
}

export function updateTestInChecklist(checklistId, targetTestId, updates = {}) {
  return mutateChecklistById(checklistId, checklist => {
    for (const phase of checklist.phases) {
      for (const sec of phase.sections) {
        const tc = sec.tests.find(t => t.id === targetTestId);
        if (tc) {
          if (typeof updates.text === 'string') {
            const cleanText = updates.text.trim();
            if (!cleanText) return false;
            tc.text = cleanText;
          }
          if (typeof updates.testId === 'string') {
            tc.testId = updates.testId.trim();
          }
          if (typeof updates.priority === 'string') {
            tc.priority = updates.priority.trim();
          }
          // Strictly preserve tc.completed & tc.status!
          return true;
        }
      }
    }
    return false;
  });
}

export function addTestToChecklistPhase(
  checklistId,
  phaseId,
  sectionIdOrNull = null,
  { testId = '', priority = '', text = '' } = {}
) {
  const cleanText = typeof text === 'string' ? text.trim() : '';
  if (!cleanText) {
    return { ok: false, checklist: null, error: 'Test description cannot be empty.' };
  }

  let createdTest = null;

  const res = mutateChecklistById(checklistId, checklist => {
    const phase = checklist.phases.find(p => p.id === phaseId);
    if (!phase) return false;

    let targetSec = sectionIdOrNull
      ? phase.sections.find(s => s.id === sectionIdOrNull)
      : null;

    if (!targetSec) {
      targetSec = phase.sections.find(s => s.type === 'direct');
      if (!targetSec) {
        targetSec = {
          id: generateStableId('sec'),
          type: 'direct',
          name: '',
          notes: [],
          tests: []
        };
        phase.sections.push(targetSec);
      }
    }

    createdTest = {
      id: generateStableId('test'),
      testId: typeof testId === 'string' ? testId.trim() : '',
      priority: typeof priority === 'string' ? priority.trim() : '',
      text: cleanText,
      status: TEST_STATUS.NOT_STARTED,
      completed: false
    };

    targetSec.tests.push(createdTest);
    phase.expanded = true;
    return true;
  });

  return { ...res, test: createdTest };
}

export function removeTestFromChecklist(checklistId, targetTestId) {
  return mutateChecklistById(checklistId, checklist => {
    for (const phase of checklist.phases) {
      for (const sec of phase.sections) {
        const tIdx = sec.tests.findIndex(t => t.id === targetTestId);
        if (tIdx !== -1) {
          sec.tests.splice(tIdx, 1);
          return true;
        }
      }
    }
    return false;
  });
}
