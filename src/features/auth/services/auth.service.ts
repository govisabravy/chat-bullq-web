import { api } from '@/lib/api';

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

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

interface LoginResponse {
  user: AuthUser;
  organizations: OrgInfo[];
  accessToken: string;
  refreshToken: string;
}

interface RegisterResponse {
  user: AuthUser;
  organization: OrgInfo;
  accessToken: string;
  refreshToken: string;
}

interface MeResponse {
  user: AuthUser;
  organizations: OrgInfo[];
}

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await api.post<{ data: LoginResponse }>('/auth/login', payload);
    return data.data;
  },

  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    const { data } = await api.post<{ data: RegisterResponse }>('/auth/register', payload);
    return data.data;
  },

  async getMe(): Promise<MeResponse> {
    const { data } = await api.get<{ data: MeResponse }>('/auth/me');
    return data.data;
  },
};
