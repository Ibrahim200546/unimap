const SUPABASE_URL = "https://gjljsxmkyyelcalqavfk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_k5RVr6Gts3tPA8OJ-unjrA_DoS1lJ2R";
const SESSION_STORAGE_KEY = "smart-campus-supabase-session";

interface SupabaseAuthError {
  error?: string;
  error_description?: string;
  msg?: string;
  message?: string;
}

export interface SupabaseUser {
  id: string;
  email?: string;
}

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in?: number;
  token_type: string;
  user: SupabaseUser;
}

export interface FeedbackRequestPayload {
  accessToken: string;
  userId: string;
  topic: string;
  message: string;
  locale: "ru" | "kk" | "en";
}

export interface FeedbackRequestRecord {
  id: string;
  user_id: string;
  topic: string;
  message: string;
  locale: "ru" | "kk" | "en";
  status: string;
  created_at: string;
  updated_at: string;
}

function getAuthHeaders(token?: string) {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${token ?? SUPABASE_PUBLISHABLE_KEY}`,
    "Content-Type": "application/json",
  };
}

async function readAuthResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as
    | T
    | SupabaseAuthError;

  if (!response.ok) {
    const authError = payload as SupabaseAuthError;
    throw new Error(
      authError.error_description ??
        authError.message ??
        authError.msg ??
        authError.error ??
        "Supabase authorization failed"
    );
  }

  return payload as T;
}

function normalizeSession(session: SupabaseSession): SupabaseSession {
  const expiresAt =
    session.expires_at ??
    (session.expires_in
      ? Math.floor(Date.now() / 1000) + session.expires_in
      : undefined);

  return {
    ...session,
    expires_at: expiresAt,
  };
}

export function saveStoredSession(session: SupabaseSession) {
  window.localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify(normalizeSession(session))
  );
}

export function readStoredSession(): SupabaseSession | null {
  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as SupabaseSession;
    if (!session.access_token || !session.refresh_token) return null;
    return session;
  } catch {
    return null;
  }
}

export function clearStoredSession() {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export async function signInWithPassword(email: string, password: string) {
  const response = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, password }),
    }
  );

  return normalizeSession(await readAuthResponse<SupabaseSession>(response));
}

export async function signUpWithPassword(email: string, password: string) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ email, password }),
  });

  return readAuthResponse<Partial<SupabaseSession> & { user?: SupabaseUser }>(
    response
  );
}

export async function sendPasswordReset(email: string) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      email,
      redirect_to: window.location.origin,
    }),
  });

  await readAuthResponse<Record<string, unknown>>(response);
}

export async function refreshSession(refreshToken: string) {
  const response = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ refresh_token: refreshToken }),
    }
  );

  return normalizeSession(await readAuthResponse<SupabaseSession>(response));
}

export async function getCurrentUser(accessToken: string) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: "GET",
    headers: getAuthHeaders(accessToken),
  });

  return readAuthResponse<SupabaseUser>(response);
}

export async function createFeedbackRequest({
  accessToken,
  userId,
  topic,
  message,
  locale,
}: FeedbackRequestPayload) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/feedback_requests`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(accessToken),
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      user_id: userId,
      topic,
      message,
      locale,
    }),
  });

  const rows = await readAuthResponse<FeedbackRequestRecord[]>(response);
  return rows[0] ?? null;
}
