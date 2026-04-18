/**
 * Test setup — Chrome API mocks for vitest
 */
import { vi } from "vitest";

// ── Chrome API Mocks ──────────────────────────────────
const storageData = { session: {}, local: {} };

function makeStorageArea(area) {
  return {
    get: vi.fn((keys, cb) => {
      const result = {};
      const keyList = typeof keys === "string" ? [keys] : Array.isArray(keys) ? keys : Object.keys(keys || {});
      if (keys === null) {
        Object.assign(result, storageData[area]);
      } else {
        for (const k of keyList) {
          if (storageData[area][k] !== undefined) {
            result[k] = storageData[area][k];
          }
        }
      }
      if (cb) cb(result);
      return Promise.resolve(result);
    }),
    set: vi.fn((items, cb) => {
      Object.assign(storageData[area], items);
      if (cb) cb();
      return Promise.resolve();
    }),
    remove: vi.fn((keys, cb) => {
      const keyList = typeof keys === "string" ? [keys] : keys;
      for (const k of keyList) {
        delete storageData[area][k];
      }
      if (cb) cb();
      return Promise.resolve();
    }),
    getBytesInUse: vi.fn((keys, cb) => { if (cb) cb(0); return Promise.resolve(0); }),
    _data: storageData[area],
  };
}

globalThis.chrome = {
  storage: {
    session: makeStorageArea("session"),
    local: makeStorageArea("local"),
  },
  runtime: {
    lastError: null,
    sendMessage: vi.fn((msg, cb) => { if (cb) cb(null); }),
    onMessage: { addListener: vi.fn() },
    onInstalled: { addListener: vi.fn() },
    getURL: vi.fn((path) => `chrome-extension://test-id/${path}`),
    openOptionsPage: vi.fn(),
  },
  action: {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
    setTitle: vi.fn(),
    onClicked: { addListener: vi.fn() },
  },
  tabs: {
    query: vi.fn((q, cb) => { if (cb) cb([]); }),
    create: vi.fn((opts, cb) => { if (cb) cb({ id: 999 }); }),
    sendMessage: vi.fn(() => Promise.resolve()),
    remove: vi.fn((id, cb) => { if (cb) cb(); }),
    onRemoved: { addListener: vi.fn() },
    onActivated: { addListener: vi.fn() },
  },
  webNavigation: {
    onBeforeNavigate: { addListener: vi.fn() },
    onCompleted: { addListener: vi.fn() },
  },
  sidePanel: {
    open: vi.fn(),
    setPanelBehavior: vi.fn(() => Promise.resolve()),
  },
  notifications: {
    create: vi.fn((id, opts, cb) => { if (cb) cb(); }),
  },
  alarms: {
    create: vi.fn(),
    clear: vi.fn((name, cb) => { if (cb) cb(true); return Promise.resolve(true); }),
    onAlarm: { addListener: vi.fn() },
  },
};

// Reset storage between tests
export function resetStorage() {
  for (const area of ["session", "local"]) {
    for (const key of Object.keys(storageData[area])) {
      delete storageData[area][key];
    }
  }
}

// Reset all mocks between tests
beforeEach(() => {
  resetStorage();
  vi.clearAllMocks();
});
