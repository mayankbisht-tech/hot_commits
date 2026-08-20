// Frontend API client — typed fetch wrappers used by SWR and mutations
export { downloadCSV } from '@/lib/utils';


const BASE = "";

// ─── Generic fetcher for SWR ──────────────────────────────────────────────────
export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error || "Login failed");
  return res.json();
}

export async function apiSignup(data: Record<string, unknown>) {
  const res = await fetch(`${BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error || "Signup failed");
  return res.json();
}

export async function apiLogout() {
  await fetch(`${BASE}/api/auth/logout`, { method: "POST", credentials: "include" });
}

export async function apiMe() {
  const res = await fetch(`${BASE}/api/auth/me`, { credentials: "include" });
  if (!res.ok) return null;
  return res.json();
}

// ─── Drives ───────────────────────────────────────────────────────────────────
export async function apiCreateDrive(data: Record<string, unknown>) {
  const res = await fetch(`${BASE}/api/drives`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error || "Failed to create drive");
  return res.json();
}

export async function apiUpdateDrive(id: string, data: Record<string, unknown>) {
  const res = await fetch(`${BASE}/api/drives/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error || "Failed to update drive");
  return res.json();
}

// ─── Applications ─────────────────────────────────────────────────────────────
export async function apiApply(driveId: string, coverNote?: string) {
  const res = await fetch(`${BASE}/api/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ driveId, coverNote }),
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error || "Failed to apply");
  return res.json();
}

export async function apiUpdateApplication(id: string, data: Record<string, unknown>) {
  const res = await fetch(`${BASE}/api/applications/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error || "Failed to update application");
  return res.json();
}

// ─── Training ─────────────────────────────────────────────────────────────────
export async function apiEnroll(trainingId: string) {
  const res = await fetch(`${BASE}/api/training/${trainingId}/enroll`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error || "Failed to enroll");
  return res.json();
}

export async function apiCreateTraining(data: Record<string, unknown>) {
  const res = await fetch(`${BASE}/api/training`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error || "Failed to create training");
  return res.json();
}

// ─── Students ─────────────────────────────────────────────────────────────────
export async function apiUpdateStudent(id: string, data: Record<string, unknown>) {
  const res = await fetch(`${BASE}/api/students/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) throw new Error((await res.json()).error || "Failed to update student");
  return res.json();
}

export const apiApplyDrive = apiApply;
export const apiEnrollTraining = apiEnroll;
