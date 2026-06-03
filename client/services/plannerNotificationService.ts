import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const isWeb = Platform.OS === "web";

// Web: expo-notifications APIs are not fully supported. Avoid calling native-only methods.
if (!isWeb) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }) as any,
  });
}



export type NotificationPayload = {
  title: string;
  body?: string;
  data?: Record<string, any>;
};

export async function ensurePermissions(): Promise<boolean> {
  if (isWeb) return false;
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}


function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function makeKey(prefix: string, id: string) {
  return `${prefix}:${id}`;
}

export function timeToDateInFuture(dateYmd: string, timeHm: string, minutesOffset: number) {
  // local time date
  const [y, m, d] = dateYmd.split("-").map((x) => Number(x));
  const [hh, mm] = timeHm.split(":").map((x) => Number(x));
  const dt = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
  dt.setMinutes(dt.getMinutes() - minutesOffset);
  return dt;
}

export async function scheduleOneOffNotification(triggerDate: Date, notification: NotificationPayload) {
  if (isWeb) return "web-noop";
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: notification.title,
      body: notification.body,
      data: notification.data,
    },
    trigger: triggerDate as any,
  });
  return id;
}


export async function cancelNotificationById(id: string) {
  await Notifications.cancelScheduledNotificationAsync(id);
}

export async function cancelAllPlannerNotifications() {
  if (isWeb) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const ids = scheduled.map((s) => s.identifier);
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}


export async function notifyNow(notification: NotificationPayload) {
  if (isWeb) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: notification.title,
      body: notification.body,
      data: notification.data,
    },
    trigger: null,
  });
}

// Helpers for daily repeating reminders
export async function scheduleDailyNotification(hour: number, minute: number, notification: NotificationPayload) {
  if (isWeb) return "web-noop";

  // Set next occurrence
  const now = new Date();

  const next = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minute,
    0,
    0,
  );
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);

  // iOS: daily repeating needs calendar trigger with repeat
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: notification.title,
      body: notification.body,
      data: notification.data,
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    } as any,
  });

  return id;
}

export function defaultAlarmTitle() {
  return "Study Planner Reminder";
}

