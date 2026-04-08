import { create } from 'zustand';

const HISTORY_KEY = 'article_summary_history';
const SETTINGS_KEY = 'article_summary_settings';

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Storage full or unavailable
  }
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw
      ? JSON.parse(raw)
      : { defaultLength: 'medium', defaultTone: 'neutral', darkMode: false };
  } catch {
    return { defaultLength: 'medium', defaultTone: 'neutral', darkMode: false };
  }
}

function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

const useStore = create((set, get) => ({
  // --- Navigation ---
  currentPage: 'main', // 'main' | 'history' | 'settings'
  setCurrentPage: (page) => set({ currentPage: page }),

  // --- Summary state ---
  summaryResult: null,    // { summary, originalText, title }
  isLoading: false,
  streamingText: '',
  statusMessage: '',
  error: null,

  setSummaryResult: (result) => set({ summaryResult: result }),
  setIsLoading: (val) => set({ isLoading: val }),
  setStreamingText: (text) => set({ streamingText: text }),
  appendStreamingText: (chunk) =>
    set((state) => ({ streamingText: state.streamingText + chunk })),
  setStatusMessage: (msg) => set({ statusMessage: msg }),
  setError: (err) => set({ error: err }),
  clearSummary: () =>
    set({ summaryResult: null, streamingText: '', error: null, statusMessage: '' }),

  // --- History ---
  history: loadHistory(),

  addHistory: (item) => {
    const newItem = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      starred: false,
      ...item,
    };
    const updated = [newItem, ...get().history].slice(0, 100);
    saveHistory(updated);
    set({ history: updated });
    return newItem;
  },

  deleteHistory: (id) => {
    const updated = get().history.filter((h) => h.id !== id);
    saveHistory(updated);
    set({ history: updated });
  },

  toggleStar: (id) => {
    const updated = get().history.map((h) =>
      h.id === id ? { ...h, starred: !h.starred } : h
    );
    saveHistory(updated);
    set({ history: updated });
  },

  clearAllHistory: () => {
    saveHistory([]);
    set({ history: [] });
  },

  // --- Settings ---
  settings: loadSettings(),

  updateSettings: (patch) => {
    const updated = { ...get().settings, ...patch };
    saveSettings(updated);
    set({ settings: updated });

    // Apply dark mode
    if ('darkMode' in patch) {
      if (patch.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  },

  // --- Toast ---
  toasts: [],
  showToast: (message, type = 'success') => {
    const id = Date.now().toString();
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 2500);
  },
}));

export default useStore;
