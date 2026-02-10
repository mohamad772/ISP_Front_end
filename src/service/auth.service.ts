import apiClient from "@/utils/apiClient";
import { UserRole, type LoginRequest, type LoginResponse, type User } from "@/types/api.types";

type RawLoginResponse = {
  access_token?: string;
  accessToken?: string;
  token?: string;
  user?: User;
  userData?: User;
  userInfo?: User;
  profile?: User;
  permissions?: string[];
  data?: unknown;
  result?: unknown;
  payload?: unknown;
  response?: unknown;
};

type JwtPayload = {
  sub?: string;
  userId?: string;
  username?: string;
  role?: User["role"] | string;
  capabilities?: string[];
  posId?: string | null;
  email?: string;
};

function normalizeRole(role: unknown): UserRole | undefined {
  if (typeof role !== "string") return undefined;
  if (Object.values(UserRole).includes(role as UserRole)) {
    return role as UserRole;
  }

  const normalized = role.trim().toUpperCase();
  const legacyMap: Record<string, UserRole> = {
    ADMIN: UserRole.WSP_ADMIN,
    WSP_ADMIN: UserRole.WSP_ADMIN,
    SUB_ADMIN: UserRole.SUB_ADMIN,
    POS_MANAGER: UserRole.POS_MANAGER,
    CLIENT: UserRole.CLIENT,
  };
  return legacyMap[normalized];
}

function extractToken(candidate: RawLoginResponse | undefined): string | undefined {
  if (!candidate) return undefined;
  return candidate.access_token ?? candidate.accessToken ?? candidate.token;
}

function extractUser(candidate: RawLoginResponse | undefined): User | undefined {
  if (!candidate) return undefined;
  return (
    candidate.user ?? candidate.userData ?? candidate.userInfo ?? candidate.profile
  );
}

function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const json = atob(padded);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

function buildUserFromToken(token: string): User | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const username = payload.username ?? "user";
  const id = payload.sub ?? payload.userId ?? "unknown";
  const now = new Date().toISOString();
  const role = normalizeRole(payload.role) ?? UserRole.WSP_ADMIN;

  return {
    id,
    username,
    email: payload.email ?? `${username}@local`,
    role,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    posId: payload.posId ?? undefined,
    capabilities: payload.capabilities ?? [],
  };
}

function normalizeLoginResponse(raw: RawLoginResponse): LoginResponse {
  const candidates: Array<RawLoginResponse | undefined> = [
    raw,
    raw?.data as RawLoginResponse | undefined,
    raw?.result as RawLoginResponse | undefined,
    raw?.payload as RawLoginResponse | undefined,
    raw?.response as RawLoginResponse | undefined,
    (raw?.data as RawLoginResponse | undefined)?.data as
      | RawLoginResponse
      | undefined,
  ];

  let access_token: string | undefined;
  let user: User | undefined;

  for (const candidate of candidates) {
    access_token = access_token ?? extractToken(candidate);
    user = user ?? extractUser(candidate);
    if (access_token && user) break;
  }

  if (!user && access_token) {
    user = buildUserFromToken(access_token) ?? undefined;
  }

  if (user) {
    const permissions =
      (user as unknown as { permissions?: string[] })?.permissions ??
      (raw as unknown as { permissions?: string[] })?.permissions ??
      (raw?.data as { permissions?: string[] } | undefined)?.permissions;
    if ((!user.capabilities || user.capabilities.length === 0) && permissions) {
      user = { ...user, capabilities: permissions };
    }
    const role = normalizeRole(user.role);
    if (!role && access_token) {
      const tokenUser = buildUserFromToken(access_token);
      if (tokenUser) {
        user = { ...tokenUser, ...user };
      }
    } else if (role) {
      user = { ...user, role };
    }
  }

  if (!access_token || !user) {
    throw new Error("Login response missing user or access token");
  }
  if (!user.role) {
    throw new Error("Login response missing user role");
  }
  const allowedRoles: UserRole[] = [
    UserRole.WSP_ADMIN,
    UserRole.SUB_ADMIN,
    UserRole.POS_MANAGER,
  ];
  if (!allowedRoles.includes(user.role)) {  
    throw new Error("Role is not allowed to sign in");
  }

  return { access_token, user };
}

/**
 * Login user and receive access token
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post("/auth/login", credentials);
  return normalizeLoginResponse(response.data as RawLoginResponse);
}

/**
 * Logout current user
 */
export async function logout(): Promise<void> {
  const response = await apiClient.post("/auth/logout");
  return response.data;
}

/**
 * Refresh access token
 */
export async function refreshToken(): Promise<LoginResponse> {
  const response = await apiClient.post("/auth/refresh");
  return normalizeLoginResponse(response.data as RawLoginResponse);
}
