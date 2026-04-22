import * as Notifications from "expo-notifications";
import { router } from "expo-router";

const REMINDER_IDENTIFIER = "aquatrack-6h-reminder";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestPermissions() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    await Notifications.requestPermissionsAsync();
  }
}

export async function sendAlert(title, body, data = {}) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data },
    trigger: null,
  });
}

export async function scheduleReminder() {
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  const exists = pending.some((item) => item.content?.data?.reminderId === REMINDER_IDENTIFIER);
  if (exists) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "AquaTrack Reminder",
      body: "You haven't checked your hydration today. Tap to log a reading.",
      data: { screen: "index", reminderId: REMINDER_IDENTIFIER },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 21600, repeats: true },
  });
}

export async function cancelReminder() {
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  const targets = pending.filter((item) => item.content?.data?.reminderId === REMINDER_IDENTIFIER);
  await Promise.all(targets.map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)));
}

export function handleNotificationTap(data) {
  if (!data) return;
  if (data.screen === "Results") {
    router.push({ pathname: "/history", params: { readingId: data.readingId } });
    return;
  }
  if (data.screen) {
    router.push(`/${data.screen}`);
  }
}
