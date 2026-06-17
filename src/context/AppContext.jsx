import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const AppContext = createContext(null);

const defaultState = {
  session: null,
  activePanel: 'dashboard',
  repositories: [],
  subRepositories: [],
  uploads: [],
  documentStore: [],
  users: [],
  auditLog: [],
  notifications: [],
  isLoading: true,
};

function appReducer(state, action) {
  switch (action.type) {
    case 'LOAD_INITIAL_DATA':
      return {
        ...state,
        repositories: action.payload.repositories || [],
        subRepositories: action.payload.subRepositories || [],
        uploads: action.payload.uploads || [],
        auditLog: action.payload.auditLog || [],
        users: action.payload.users || [],
        isLoading: false,
      };
    case 'SET_SESSION':
      return { ...state, session: action.payload };
    case 'CLEAR_SESSION':
      return { ...defaultState, session: null, isLoading: false };
    case 'SET_ACTIVE_PANEL':
      return { ...state, activePanel: action.payload };
    case 'ADD_REPOSITORY':
      return { ...state, repositories: [...state.repositories, action.payload] };
    case 'UPDATE_REPOSITORY':
      return {
        ...state,
        repositories: state.repositories.map(r => r.id === action.payload.id ? { ...r, ...action.payload } : r),
      };
    case 'DELETE_REPOSITORY': {
      const repoId = action.payload;
      const deletedSubRepoIds = state.subRepositories.filter(sr => sr.repositoryId === repoId).map(sr => sr.id);
      return {
        ...state,
        repositories: state.repositories.filter(r => r.id !== repoId),
        subRepositories: state.subRepositories.filter(sr => sr.repositoryId !== repoId),
        uploads: state.uploads.filter(u => !deletedSubRepoIds.includes(u.subRepositoryId)),
        documentStore: state.documentStore.filter(d => !deletedSubRepoIds.includes(d.subRepositoryId)),
      };
    }
    case 'ADD_SUB_REPOSITORY':
      return { ...state, subRepositories: [...state.subRepositories, action.payload] };
    case 'UPDATE_SUB_REPOSITORY':
      return {
        ...state,
        subRepositories: state.subRepositories.map(sr => sr.id === action.payload.id ? { ...sr, ...action.payload } : sr),
      };
    case 'DELETE_SUB_REPOSITORY':
      return {
        ...state,
        subRepositories: state.subRepositories.filter(sr => sr.id !== action.payload),
        uploads: state.uploads.filter(u => u.subRepositoryId !== action.payload),
        documentStore: state.documentStore.filter(d => d.subRepositoryId !== action.payload),
      };
    case 'ADD_UPLOAD':
      return { ...state, uploads: [...state.uploads, action.payload] };
    case 'UPDATE_UPLOAD':
      return {
        ...state,
        uploads: state.uploads.map(u => u.id === action.payload.id ? { ...u, ...action.payload } : u),
      };
    case 'DELETE_UPLOAD':
      return { ...state, uploads: state.uploads.filter(u => u.id !== action.payload) };
    case 'ADD_USER':
      return { ...state, users: [...state.users, action.payload] };
    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map(u => u.id === action.payload.id ? { ...u, ...action.payload } : u),
      };
    case 'DELETE_USER':
      return { ...state, users: state.users.filter(u => u.id !== action.payload) };
    case 'ADD_AUDIT_LOG':
      return { ...state, auditLog: [action.payload, ...state.auditLog] };
    case 'ADD_DOCUMENT':
      return { ...state, documentStore: [...state.documentStore, action.payload] };
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

// Custom hook to intercept dispatches and mirror to Supabase
function useAppReducerWithSupabase(reducer, initialState) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const dispatchWithSupabase = async (action) => {
    // 1. Optimistic UI update
    dispatch(action);

    // 2. Mirror to Supabase
    try {
      let result;
      switch (action.type) {
        case 'ADD_REPOSITORY':
          result = await supabase.from('repositories').insert([{
             id: action.payload.id,
             name: action.payload.name,
             description: action.payload.description,
             created_at: action.payload.createdAt
          }]);
          if (result.error) throw result.error;
          break;
        case 'UPDATE_REPOSITORY':
          result = await supabase.from('repositories').update({
             name: action.payload.name,
             description: action.payload.description,
          }).eq('id', action.payload.id);
          if (result.error) throw result.error;
          break;
        case 'DELETE_REPOSITORY':
          result = await supabase.from('repositories').delete().eq('id', action.payload);
          if (result.error) throw result.error;
          break;
        case 'ADD_SUB_REPOSITORY':
          result = await supabase.from('sub_repositories').insert([{
             id: action.payload.id,
             repository_id: action.payload.repositoryId,
             name: action.payload.name,
             description: action.payload.description,
             headers: action.payload.headers,
             upload_count: action.payload.uploadCount,
             last_upload: action.payload.lastUpload,
             created_at: action.payload.createdAt
          }]);
          if (result.error) throw result.error;
          break;
        case 'UPDATE_SUB_REPOSITORY':
          result = await supabase.from('sub_repositories').update({
             name: action.payload.name,
             description: action.payload.description,
             headers: action.payload.headers,
             upload_count: action.payload.uploadCount,
             last_upload: action.payload.lastUpload,
          }).eq('id', action.payload.id);
          if (result.error) throw result.error;
          break;
        case 'DELETE_SUB_REPOSITORY':
          result = await supabase.from('sub_repositories').delete().eq('id', action.payload);
          if (result.error) throw result.error;
          break;
        case 'ADD_UPLOAD':
          result = await supabase.from('uploads').insert([{
             id: action.payload.id,
             sub_repository_id: action.payload.subRepositoryId,
             document_name: action.payload.documentName,
             upload_date: action.payload.uploadDate,
             committed: action.payload.committed,
             line_items: action.payload.lineItems
          }]);
          if (result.error) throw result.error;
          break;
        case 'UPDATE_UPLOAD':
          result = await supabase.from('uploads').update({
             line_items: action.payload.lineItems
          }).eq('id', action.payload.id);
          if (result.error) throw result.error;
          break;
        case 'DELETE_UPLOAD':
          result = await supabase.from('uploads').delete().eq('id', action.payload);
          if (result.error) throw result.error;
          break;
        case 'ADD_AUDIT_LOG':
          result = await supabase.from('audit_logs').insert([{
             id: action.payload.id,
             user_id: action.payload.userId,
             user_email: action.payload.userEmail,
             action: action.payload.action,
             details: action.payload.details,
             timestamp: action.payload.timestamp
          }]);
          if (result.error) throw result.error;
          break;
        case 'ADD_USER':
          result = await supabase.from('users').insert([{
             id: action.payload.id,
             auth_id: action.payload.authId,
             email: action.payload.email,
             display_name: action.payload.displayName,
             role: action.payload.role,
             created_at: action.payload.createdAt
          }]);
          if (result.error) throw result.error;
          break;
        case 'UPDATE_USER':
          result = await supabase.from('users').update({
             display_name: action.payload.displayName,
             role: action.payload.role,
          }).eq('id', action.payload.id);
          if (result.error) throw result.error;
          break;
        case 'DELETE_USER':
          result = await supabase.from('users').delete().eq('id', action.payload);
          if (result.error) throw result.error;
          break;
      }
    } catch (err) {
      console.error('Supabase sync error:', action.type, err);
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: { message: `Cloud sync failed: ${err.message || 'Unknown error'}`, variant: 'error' },
      });
    }
  };

  return [state, dispatchWithSupabase, dispatch];
}

export function AppProvider({ children }) {
  const [state, dispatchWithSupabase, rawDispatch] = useAppReducerWithSupabase(appReducer, defaultState);
  const auth = useAuth();

  // Sync auth state to app context
  useEffect(() => {
    if (auth.userProfile) {
      rawDispatch({
        type: 'SET_SESSION',
        payload: {
          user: {
            id: auth.userProfile.id,
            email: auth.userProfile.email,
            displayName: auth.userProfile.displayName,
          },
          role: auth.userProfile.role,
        },
      });
    } else if (!auth.loading) {
      rawDispatch({ type: 'CLEAR_SESSION' });
    }
  }, [auth.userProfile, auth.loading, rawDispatch]);

  // Initial Data Fetch — only when authenticated
  useEffect(() => {
    if (!auth.isAuthenticated) return;

    async function loadData() {
      try {
        const [reposRes, subReposRes, uploadsRes, auditRes, usersRes] = await Promise.all([
          supabase.from('repositories').select('*'),
          supabase.from('sub_repositories').select('*'),
          supabase.from('uploads').select('*'),
          supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(100),
          supabase.from('users').select('*'),
        ]);

        if (reposRes.error) console.error('repos error:', reposRes.error);
        if (subReposRes.error) console.error('subRepos error:', subReposRes.error);
        if (uploadsRes.error) console.error('uploads error:', uploadsRes.error);
        if (usersRes.error) console.error('users error:', usersRes.error);

        const mappedRepos = (reposRes.data || []).map(r => ({
          id: r.id, name: r.name, description: r.description, createdAt: r.created_at
        }));

        const mappedSubRepos = (subReposRes.data || []).map(sr => ({
          id: sr.id, repositoryId: sr.repository_id, name: sr.name, description: sr.description,
          headers: sr.headers, uploadCount: sr.upload_count, lastUpload: sr.last_upload, createdAt: sr.created_at
        }));

        const mappedUploads = (uploadsRes.data || []).map(u => ({
          id: u.id, subRepositoryId: u.sub_repository_id, documentName: u.document_name,
          uploadDate: u.upload_date, committed: u.committed, lineItems: u.line_items
        }));

        const mappedAudit = (auditRes.data || []).map(a => ({
          id: a.id, userId: a.user_id, userEmail: a.user_email, action: a.action, details: a.details, timestamp: a.timestamp
        }));

        const mappedUsers = (usersRes.data || []).map(u => ({
          id: u.id, authId: u.auth_id, displayName: u.display_name, email: u.email, role: u.role, createdAt: u.created_at
        }));

        rawDispatch({
          type: 'LOAD_INITIAL_DATA',
          payload: {
            repositories: mappedRepos,
            subRepositories: mappedSubRepos,
            uploads: mappedUploads,
            auditLog: mappedAudit,
            users: mappedUsers,
          }
        });
      } catch (err) {
        console.error('Failed to load initial data from Supabase', err);
        rawDispatch({ type: 'LOAD_INITIAL_DATA', payload: {} });
      }
    }

    loadData();
  }, [auth.isAuthenticated, rawDispatch]);

  return (
    <AppContext.Provider value={{ state, dispatch: dispatchWithSupabase, auth }}>
      {state.isLoading && auth.isAuthenticated ? (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0f1a', color: '#10b981', fontFamily: "'Inter', sans-serif" }}>
          Loading Cloud Database...
        </div>
      ) : (
        children
      )}
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
