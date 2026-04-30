"use client";

import Image from "next/image";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  clearStoredSession,
  getCurrentUser,
  readStoredSession,
  refreshSession,
  saveStoredSession,
  sendPasswordReset,
  signInWithPassword,
  signUpWithPassword,
  type SupabaseSession,
} from "@/lib/supabase-auth";

interface AuthContextValue {
  session: SupabaseSession;
  userEmail: string;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthGate");
  }

  return context;
}

export default function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const storedSession = readStoredSession();
      if (!storedSession) {
        setIsCheckingSession(false);
        return;
      }

      try {
        const now = Math.floor(Date.now() / 1000);
        const sessionToUse =
          storedSession.expires_at && storedSession.expires_at - now < 60
            ? await refreshSession(storedSession.refresh_token)
            : storedSession;

        const user = await getCurrentUser(sessionToUse.access_token);
        const verifiedSession = { ...sessionToUse, user };

        if (!cancelled) {
          saveStoredSession(verifiedSession);
          setSession(verifiedSession);
        }
      } catch {
        clearStoredSession();
      } finally {
        if (!cancelled) setIsCheckingSession(false);
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const authContext = useMemo<AuthContextValue | null>(() => {
    if (!session) return null;

    return {
      session,
      userEmail: session.user.email ?? email,
      signOut: () => {
        clearStoredSession();
        setSession(null);
        setPassword("");
      },
    };
  }, [email, session]);

  const handleSignIn = async () => {
    setError(null);
    setStatus(null);

    if (!email.trim() || !password.trim()) {
      setError("Enter your email and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const nextSession = await signInWithPassword(email.trim(), password);
      saveStoredSession(nextSession);
      setSession(nextSession);
    } catch (authError) {
      setError(
        authError instanceof Error ? authError.message : "Unable to log in."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async () => {
    setError(null);
    setStatus(null);

    if (!email.trim() || !password.trim()) {
      setError("Enter your email and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = await signUpWithPassword(email.trim(), password);
      if (payload.access_token && payload.refresh_token && payload.user) {
        const nextSession = payload as SupabaseSession;
        saveStoredSession(nextSession);
        setSession(nextSession);
      } else {
        setStatus("Account created. Check your email to confirm sign up.");
      }
    } catch (authError) {
      setError(
        authError instanceof Error ? authError.message : "Unable to sign up."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    setError(null);
    setStatus(null);

    if (!email.trim()) {
      setError("Enter your email first.");
      return;
    }

    setIsSubmitting(true);

    try {
      await sendPasswordReset(email.trim());
      setStatus("Password reset link has been sent to your email.");
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : "Unable to send reset link."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f4f6f8] text-[#1f4565]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2bbf78]/20 border-t-[#2bbf78]" />
      </div>
    );
  }

  if (session && authContext) {
    return (
      <AuthContext.Provider value={authContext}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f6f8] px-4 py-10 text-[#1f4565]">
      <section className="relative w-full max-w-[410px] rounded-[4px] border border-[#d9e0e6] bg-white px-7 pb-8 pt-14 shadow-[0_1px_4px_rgba(15,23,42,0.18)] sm:px-8">
        <div className="absolute left-1/2 top-0 flex h-[58px] w-[58px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-sm">
          <Image
            src="/favicon.svg"
            alt="UniMap"
            width={46}
            height={46}
            priority
          />
        </div>

        <h1 className="text-center text-[20px] font-semibold leading-7 text-[#1f4565]">
          Log in to UniMap
        </h1>

        <form
          className="mt-8 space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            handleSignIn();
          }}
        >
          <label className="block text-[13px] font-semibold text-[#496985]">
            Email *
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              className="mt-2 h-[38px] w-full rounded-[2px] border border-[#c8d2dc] px-3 text-[13px] font-normal text-[#1f4565] outline-none transition focus:border-[#7bbdf5] focus:ring-2 focus:ring-[#7bbdf5]/60"
            />
          </label>

          <label className="block text-[13px] font-semibold text-[#496985]">
            Password *
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="mt-2 h-[38px] w-full rounded-[2px] border border-[#c8d2dc] px-3 text-[13px] font-normal text-[#1f4565] outline-none transition focus:border-[#7bbdf5] focus:ring-2 focus:ring-[#7bbdf5]/60"
            />
          </label>

          {error ? (
            <p className="rounded-[3px] border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
              {error}
            </p>
          ) : null}

          {status ? (
            <p className="rounded-[3px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-700">
              {status}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-[35px] w-full rounded-[2px] bg-[#28b875] text-[13px] font-semibold text-white transition hover:bg-[#21a669] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Please wait..." : "Log in"}
          </button>
        </form>

        <div className="mt-7 text-center text-[13px] leading-5 text-[#2e5575]">
          <p>
            Forgot your password?{" "}
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={isSubmitting}
              className="font-medium text-[#28b875] underline underline-offset-2 disabled:opacity-60"
            >
              Reset your password
            </button>{" "}
            <span className="text-[#28b875]">›</span>
          </p>
          <p>
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={handleSignUp}
              disabled={isSubmitting}
              className="font-medium text-[#28b875] underline underline-offset-2 disabled:opacity-60"
            >
              Sign up
            </button>{" "}
            <span className="text-[#28b875]">›</span>
          </p>
        </div>
      </section>
    </main>
  );
}
