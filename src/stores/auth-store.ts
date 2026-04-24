import { create } from 'zustand';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

interface OrgInfo {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  organizations: OrgInfo[];
  activeOrgId: string | null;
  setAuth: (user: AuthUser, orgs: OrgInfo[]) => void;
  setActiveOrg: (orgId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  organizations: [],
  activeOrgId: typeof window !== 'undefined' ? localStorage.getItem('active_org_id') : null,

  setAuth: (user, organizations) => {
    const stored = localStorage.getItem('active_org_id');
    // Use stored org if it's still in the user's org list, otherwise pick first
    const validStored = stored && organizations.some((o) => o.id === stored) ? stored : null;
    const activeOrgId = validStored || organizations[0]?.id || null;
    if (activeOrgId) localStorage.setItem('active_org_id', activeOrgId);
    set({ user, organizations, activeOrgId });
  },

  setActiveOrg: (orgId) => {
    localStorage.setItem('active_org_id', orgId);
    set({ activeOrgId: orgId });
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('active_org_id');
    set({ user: null, organizations: [], activeOrgId: null });
    window.location.href = '/login';
  },
}));
