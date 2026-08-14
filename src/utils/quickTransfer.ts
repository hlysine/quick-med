import { STORAGE_KEY as TODOS_STORAGE_KEY } from '../routes/todo';

/**
 * Base URL of the quick transfer cloud service (serverless function).
 * Configured via the VITE_TRANSFER_API_URL environment variable.
 * Returns an empty string when not configured.
 */
export function getTransferApiBase(): string {
  return String(import.meta.env.VITE_TRANSFER_API_URL ?? '')
    .trim()
    .replace(/\/+$/, '');
}

/**
 * Link opened by the QR code on the receiving device.
 * On the deployed site this is /import?id=...
 */
export function buildImportLink(id: string): string {
  return `${window.location.origin}/import?id=${encodeURIComponent(id)}`;
}

/**
 * Serializes all local storage entries into a single JSON string
 * (max 1mb accepted by the transfer service).
 */
export function exportLocalData(): string {
  const data: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key === null) continue;
    const value = localStorage.getItem(key);
    if (value !== null) data[key] = value;
  }
  return JSON.stringify(data);
}

function getId(item: unknown): string | null {
  if (typeof item !== 'object' || item === null) return null;
  const id = (item as Record<string, unknown>).id;
  return typeof id === 'string' ? id : null;
}

/**
 * Merges imported tasks with local tasks: tasks from both sides are kept,
 * but imported tasks overwrite local tasks when IDs collide.
 */
function mergeTodos(importedRaw: string): void {
  let importedParsed: unknown;
  try {
    importedParsed = JSON.parse(importedRaw);
  } catch {
    return;
  }
  if (!Array.isArray(importedParsed)) return;
  const imported: unknown[] = importedParsed;

  let localParsed: unknown;
  try {
    localParsed = JSON.parse(localStorage.getItem(TODOS_STORAGE_KEY) ?? '[]');
  } catch {
    localParsed = [];
  }
  const local: unknown[] = Array.isArray(localParsed) ? localParsed : [];

  const importedIds = new Set(
    imported.map(getId).filter((id): id is string => id !== null)
  );
  const localOnly = local.filter(item => {
    const id = getId(item);
    return id === null || !importedIds.has(id);
  });

  const merged = [...localOnly, ...imported].sort((a, b) => {
    const aTime = (a as Record<string, unknown>).createdAt;
    const bTime = (b as Record<string, unknown>).createdAt;
    return (
      (typeof aTime === 'number' ? aTime : 0) -
      (typeof bTime === 'number' ? bTime : 0)
    );
  });
  localStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(merged));
}

/**
 * Imports data previously exported by exportLocalData into local storage.
 * Site settings and misc info are replaced; tasks are merged by ID.
 */
export function importLocalData(json: string): void {
  const parsed: unknown = JSON.parse(json);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Invalid transfer data');
  }
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value !== 'string') continue;
    if (key === TODOS_STORAGE_KEY) {
      mergeTodos(value);
    } else {
      localStorage.setItem(key, value);
    }
  }
}

export interface TransferUpload {
  id: string;
  expiresAt: string;
}

export async function uploadLocalData(): Promise<TransferUpload> {
  const base = getTransferApiBase();
  if (!base) throw new Error('Transfer service is not configured.');
  const res = await fetch(base, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: exportLocalData(),
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status}).`);
  return (await res.json()) as TransferUpload;
}

export async function downloadLocalData(id: string): Promise<string> {
  const base = getTransferApiBase();
  if (!base) throw new Error('Transfer service is not configured.');
  const res = await fetch(`${base}/${encodeURIComponent(id)}`);
  if (!res.ok) {
    throw new Error(
      'Could not download the transfer. The link may have expired.'
    );
  }
  return res.text();
}
