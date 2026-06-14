import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AppContext = createContext(null);

const STORAGE_KEY = 'crms_app_state';

const defaultState = {
  session: {
    user: { email: 'admin@crms.io', id: 'dev-user-1', displayName: 'Admin User' },
    role: 'admin',
  },
  activePanel: 'dashboard',
  repositories: [],
  subRepositories: [],
  uploads: [],
  documentStore: [],
  users: [
    { id: 'dev-user-1', displayName: 'Admin User', email: 'admin@crms.io', role: 'admin', createdAt: '2026-01-01T00:00:00Z' },
  ],
  auditLog: [],
  notifications: [],
};

/**
 * Load persisted state from localStorage.
 * Notifications are never persisted — they are transient.
 */
function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const saved = JSON.parse(raw);
    return {
      ...defaultState,
      ...saved,
      notifications: [], // never restore notifications
    };
  } catch (e) {
    console.warn('Failed to load persisted state:', e);
    return defaultState;
  }
}

/**
 * Save state to localStorage.
 * Strips notifications before saving.
 */
function persistState(state) {
  try {
    const toPersist = { ...state, notifications: [] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));
  } catch (e) {
    console.warn('Failed to persist state:', e);
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      console.error('CRMS: localStorage quota exceeded. Data may not be saved.');
    }
  }
}

function appReducer(state, action) {
  switch (action.type) {
    // --- Session ---
    case 'SET_SESSION':
      return { ...state, session: action.payload };
    case 'CLEAR_SESSION':
      return { ...state, session: null, activePanel: 'dashboard' };

    // --- Navigation ---
    case 'SET_ACTIVE_PANEL':
      return { ...state, activePanel: action.payload };

    // --- Repositories ---
    case 'ADD_REPOSITORY':
      return { ...state, repositories: [...state.repositories, action.payload] };
    case 'UPDATE_REPOSITORY':
      return {
        ...state,
        repositories: state.repositories.map(r =>
          r.id === action.payload.id ? { ...r, ...action.payload } : r
        ),
      };
    case 'DELETE_REPOSITORY': {
      const repoId = action.payload;
      const deletedSubRepoIds = state.subRepositories
        .filter(sr => sr.repositoryId === repoId)
        .map(sr => sr.id);
      return {
        ...state,
        repositories: state.repositories.filter(r => r.id !== repoId),
        subRepositories: state.subRepositories.filter(sr => sr.repositoryId !== repoId),
        uploads: state.uploads.filter(u => !deletedSubRepoIds.includes(u.subRepositoryId)),
        documentStore: state.documentStore.filter(d => !deletedSubRepoIds.includes(d.subRepositoryId)),
      };
    }

    // --- Sub-Repositories ---
    case 'ADD_SUB_REPOSITORY':
      return { ...state, subRepositories: [...state.subRepositories, action.payload] };
    case 'UPDATE_SUB_REPOSITORY':
      return {
        ...state,
        subRepositories: state.subRepositories.map(sr =>
          sr.id === action.payload.id ? { ...sr, ...action.payload } : sr
        ),
      };
    case 'DELETE_SUB_REPOSITORY':
      return {
        ...state,
        subRepositories: state.subRepositories.filter(sr => sr.id !== action.payload),
        uploads: state.uploads.filter(u => u.subRepositoryId !== action.payload),
        documentStore: state.documentStore.filter(d => d.subRepositoryId !== action.payload),
      };

    // --- Uploads ---
    case 'ADD_UPLOAD':
      return { ...state, uploads: [...state.uploads, action.payload] };
    case 'UPDATE_UPLOAD':
      return {
        ...state,
        uploads: state.uploads.map(u =>
          u.id === action.payload.id ? { ...u, ...action.payload } : u
        ),
      };
    case 'DELETE_UPLOAD':
      return { ...state, uploads: state.uploads.filter(u => u.id !== action.payload) };

    // --- Users ---
    case 'ADD_USER':
      return { ...state, users: [...state.users, action.payload] };
    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map(u =>
          u.id === action.payload.id ? { ...u, ...action.payload } : u
        ),
      };
    case 'DELETE_USER':
      return { ...state, users: state.users.filter(u => u.id !== action.payload) };

    // --- Audit Log ---
    case 'ADD_AUDIT_LOG':
      return { ...state, auditLog: [action.payload, ...state.auditLog] };

    // --- Document Store ---
    case 'ADD_DOCUMENT':
      return { ...state, documentStore: [...state.documentStore, action.payload] };

    // --- Notifications (max 3) ---
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [
          ...state.notifications.slice(-(3 - 1)),
          { id: crypto.randomUUID(), timestamp: Date.now(), ...action.payload },
        ],
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };

    default:
      console.warn('Unknown action type:', action.type);
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, null, loadPersistedState);

  // Persist state to localStorage on every change
  useEffect(() => {
    persistState(state);
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
