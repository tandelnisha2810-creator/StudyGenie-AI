// Planner service — backend-driven (MongoDB via Express APIs)

import { getPlannerApiBaseUrl } from "./plannerApi";

export type PlannerTask = {
  id: string;
  title: string;
  subject?: string;
  dueTime?: string; // "HH:mm" or "11:30 AM" (client decides)
  completed: boolean;
  createdAt: number;
  updatedAt: number;
};

export type PlannerExamReminder = {
  id: string;
  examTitle: string;
  subject?: string;
  examDate: string; // "YYYY-MM-DD"
  examTime: string; // "HH:mm" or "11:00 AM" (client decides)
  notificationMinutesBefore?: number[];
  createdAt: number;
  updatedAt: number;
};

export type PlannerTimerHistory = {
  id: string;
  durationMinutes: number;
  startedAt: Date;
  endedAt: Date;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type ApiResponse<T> = {
  success: boolean;
  [key: string]: any;
} & (
  | { success: true; tasks: T }
  | { success: true; reminders: T }
  | { success: true; timers: T }
  | { success: true; stats: any }
  | { success: true; task: any }
  | { success: true; reminder: any }
  | { success: true; timer: any }
  | { success: true; deletedId: string }
  | { success: false; message?: string }
);

function toPlannerTask(doc: any): PlannerTask {
  return {
    id: String(doc._id ?? doc.id),
    title: doc.title,
    subject: doc.subject,
    dueTime: doc.dueTime,
    completed: !!doc.completed,
    createdAt: new Date(doc.createdAt).getTime(),
    updatedAt: new Date(doc.updatedAt).getTime(),
  };
}

function toPlannerReminder(doc: any): PlannerExamReminder {
  return {
    id: String(doc._id ?? doc.id),
    examTitle: doc.examName ?? doc.examTitle,
    subject: doc.subject,
    examDate: doc.examDate,
    examTime: doc.examTime,
    notificationMinutesBefore: doc.notificationMinutesBefore ?? undefined,
    createdAt: new Date(doc.createdAt).getTime(),
    updatedAt: new Date(doc.updatedAt).getTime(),
  };
}

function toUserIdHint(userId: string | undefined) {
  return userId;
}

async function apiFetch<T>(path: string, opts: RequestInit & { userId?: string } = {}): Promise<T> {
  const baseUrl = getPlannerApiBaseUrl();
  const url = `${baseUrl}${path}`;

  const res = await fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || json?.success === false) {
    const message = json?.message || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return json;
}

function mapMaybeStringNumberArray(input: any): number[] | undefined {
  if (!Array.isArray(input)) return undefined;
  const nums = input
    .map((x) => (typeof x === "string" ? Number(x) : x))
    .filter((n) => Number.isFinite(n) && n >= 0);
  return nums.length ? nums : undefined;
}

// =====================
// TASK APIs
// =====================

export async function getTasks(userId: string): Promise<PlannerTask[]> {
  const json = await apiFetch<{ tasks: any[] }>("/api/planner/tasks", {
    method: "GET",
    headers: {
      "x-user-id": userId,
    },
  });

  return (json.tasks || []).map(toPlannerTask);
}

export async function createTask(input: {
  userId: string;
  title: string;
  subject?: string;
  dueTime?: string;
  completed?: boolean;
}): Promise<PlannerTask> {
  const json = await apiFetch<any>("/api/planner/tasks", {
    method: "POST",
    body: JSON.stringify({
      userId: input.userId,
      title: input.title,
      subject: input.subject ?? "",
      dueTime: input.dueTime ?? "",
      completed: input.completed ?? false,
    }),
  });

  return toPlannerTask(json.task);
}

export async function updateTask(input: {
  userId: string;
  id: string;
  title?: string;
  subject?: string;
  dueTime?: string;
  completed?: boolean;
}): Promise<PlannerTask> {
  const json = await apiFetch<any>(`/api/planner/tasks/${input.id}`, {
    method: "PUT",
    body: JSON.stringify({
      userId: input.userId,
      title: input.title,
      subject: input.subject,
      dueTime: input.dueTime,
      completed: input.completed,
    }),
  });

  return toPlannerTask(json.task);
}

export async function deleteTask(userId: string, id: string): Promise<string> {
  const json = await apiFetch<any>(`/api/planner/tasks/${id}`, {
    method: "DELETE",
    body: JSON.stringify({ userId: toUserIdHint(userId) }),
    headers: {
      "x-user-id": userId,
    },
  });

  return json.deletedId;
}

export async function toggleTaskCompleted(userId: string, id: string) {
  // Backend toggling isn't implemented; do a read-modify-write via updateTask.
  // This is only used by the current UI.
  const tasks = await getTasks(userId);
  const existing = tasks.find((t) => t.id === id);
  const nextCompleted = existing ? !existing.completed : true;

  const json = await apiFetch<any>(`/api/planner/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      userId,
      completed: nextCompleted,
    }),
    headers: { "x-user-id": userId },
  });

  return toPlannerTask(json.task);
}


// =====================
// REMINDER APIs
// =====================

export async function getReminders(userId: string): Promise<PlannerExamReminder[]> {
  const json = await apiFetch<{ reminders: any[] }>("/api/planner/reminders", {
    method: "GET",
    headers: {
      "x-user-id": userId,
    },
  });

  return (json.reminders || []).map(toPlannerReminder);
}

export async function createReminder(input: {
  userId: string;
  examTitle: string;
  subject?: string;
  examDate: string;
  examTime: string;
  notificationMinutesBefore?: number[];
  notificationEnabled?: boolean;
}): Promise<PlannerExamReminder> {
  const json = await apiFetch<any>("/api/planner/reminders", {
    method: "POST",
    body: JSON.stringify({
      userId: input.userId,
      examName: input.examTitle,
      subject: input.subject ?? "",
      examDate: input.examDate,
      examTime: input.examTime,
      notificationEnabled: input.notificationEnabled ?? true,
      notificationMinutesBefore: mapMaybeStringNumberArray(input.notificationMinutesBefore),
    }),
  });

  return toPlannerReminder(json.reminder);
}

export async function updateReminder(input: {
  userId: string;
  id: string;
  examTitle?: string;
  subject?: string;
  examDate?: string;
  examTime?: string;
  notificationMinutesBefore?: number[];
  notificationEnabled?: boolean;
}): Promise<PlannerExamReminder> {
  const json = await apiFetch<any>(`/api/planner/reminders/${input.id}`, {
    method: "PUT",
    body: JSON.stringify({
      userId: input.userId,
      examName: input.examTitle,
      subject: input.subject,
      examDate: input.examDate,
      examTime: input.examTime,
      notificationEnabled: input.notificationEnabled,
      notificationMinutesBefore: mapMaybeStringNumberArray(input.notificationMinutesBefore),
    }),
    headers: { "x-user-id": input.userId },
  });

  return toPlannerReminder(json.reminder);
}

export async function deleteReminder(userId: string, id: string): Promise<string> {
  const json = await apiFetch<any>(`/api/planner/reminders/${id}`, {
    method: "DELETE",
    body: JSON.stringify({ userId }),
    headers: { "x-user-id": userId },
  });

  return json.deletedId;
}

// =====================
// TIMER API
// =====================

export async function saveTimerSession(input: {
  userId: string;
  durationMinutes: number;
  startedAt?: Date;
  endedAt?: Date;
  completed?: boolean;
}) {
  const json = await apiFetch<any>("/api/planner/timers", {
    method: "POST",
    body: JSON.stringify({
      userId: input.userId,
      durationMinutes: input.durationMinutes,
      startedAt: input.startedAt ? input.startedAt.toISOString() : undefined,
      endedAt: input.endedAt ? input.endedAt.toISOString() : undefined,
      completed: input.completed ?? true,
    }),
  });

  return json.timer;
}

export async function getStats(userId: string): Promise<{
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  upcomingExams: number;
  completedPomodoroSessions: number;
}> {
  const json = await apiFetch<any>("/api/planner/stats", {
    method: "GET",
    headers: { "x-user-id": userId },
  });

  return json.stats;
}

// =====================
// Non-CRUD helpers
// =====================

export function getNearestExam(reminders: PlannerExamReminder[]) {
  const toMs = (r: PlannerExamReminder) => {
    const [y, m, d] = r.examDate.split("-").map((x) => Number(x));
    const [hh, mm] = r.examTime.split(":").map((x) => Number(x));
    const dt = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
    return dt.getTime();
  };
  return [...reminders].sort((a, b) => toMs(a) - toMs(b));
}


