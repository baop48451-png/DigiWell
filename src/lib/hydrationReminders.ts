import { Capacitor } from '@capacitor/core';
import {
  LocalNotifications,
  type ActionPerformed,
  type LocalNotificationDescriptor,
  type LocalNotificationSchema,
} from '@capacitor/local-notifications';

export type HydrationReminderSettings = {
  enabled: boolean;
  intervalMinutes: number;
  startTime: string;
  endTime: string;
};

export const DEFAULT_HYDRATION_REMINDER_SETTINGS: HydrationReminderSettings = {
  enabled: false,
  intervalMinutes: 120,
  startTime: '08:00',
  endTime: '22:00',
};

const REMINDER_CHANNEL_ID = 'hydration-reminders';
const REMINDER_CHANNEL_NAME = 'Hydration Reminders';
const REMINDER_ID_BASE = 7300;
const REMINDER_ID_COUNT = 24;
const SNOOZE_NOTIFICATION_ID = 7399;

export const HYDRATION_REMINDER_ACTION_TYPE_ID = 'hydration-reminder-actions';
export const HYDRATION_NOTIFICATION_ACTION_IDS = {
  add250: 'hydration-add-250',
  add500: 'hydration-add-500',
  snooze15: 'hydration-snooze-15',
} as const;

export type HydrationNotificationIntent =
  | { kind: 'add'; amount: number; name: string }
  | { kind: 'snooze'; minutes: number };

type ReminderSlot = {
  hour: number;
  minute: number;
  label: string;
};

const parseTimeToMinutes = (value: string) => {
  const [hourRaw, minuteRaw] = value.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return hour * 60 + minute;
};

const formatSlotLabel = (totalMinutes: number) => {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

const getReminderTimePoints = (settings: HydrationReminderSettings) => {
  const startMinutes = parseTimeToMinutes(settings.startTime);
  const endMinutes = parseTimeToMinutes(settings.endTime);

  if (startMinutes === null || endMinutes === null) return [];
  if (settings.intervalMinutes < 30) return [];
  if (endMinutes <= startMinutes) return [];

  const points: number[] = [];
  for (
    let totalMinutes = startMinutes;
    totalMinutes <= endMinutes && points.length < REMINDER_ID_COUNT;
    totalMinutes += settings.intervalMinutes
  ) {
    points.push(totalMinutes);
  }

  return points;
};

export const supportsNativeHydrationReminders = () => Capacitor.isNativePlatform();

export const validateHydrationReminderSettings = (settings: HydrationReminderSettings) => {
  if (!settings.startTime || !settings.endTime) {
    return 'Vui lòng chọn giờ bắt đầu và giờ kết thúc.';
  }

  if (settings.intervalMinutes < 30) {
    return 'Khoảng cách giữa các lần nhắc phải từ 30 phút trở lên.';
  }

  const slots = getReminderTimePoints(settings);
  if (slots.length === 0) {
    return 'Giờ kết thúc phải sau giờ bắt đầu để lên lịch nhắc.';
  }

  return null;
};

export const getHydrationReminderPreview = (settings: HydrationReminderSettings) => {
  const slots = getReminderTimePoints(settings);
  if (slots.length === 0) return 'Chưa có lịch nhắc hợp lệ.';

  const preview = slots.slice(0, 4).map(formatSlotLabel).join(' • ');
  return slots.length > 4
    ? `${slots.length} lần/ngày: ${preview}...`
    : `${slots.length} lần/ngày: ${preview}`;
};

const buildReminderSlots = (settings: HydrationReminderSettings): ReminderSlot[] =>
  getReminderTimePoints(settings).map(totalMinutes => ({
    hour: Math.floor(totalMinutes / 60),
    minute: totalMinutes % 60,
    label: formatSlotLabel(totalMinutes),
  }));

const getReminderDescriptors = (): LocalNotificationDescriptor[] =>
  Array.from({ length: REMINDER_ID_COUNT }, (_, index) => ({ id: REMINDER_ID_BASE + index + 1 }));

const createReminderTitle = (nickname?: string) =>
  nickname ? `${nickname}, đến giờ uống nước rồi` : 'Đến giờ uống nước rồi';

const createReminderBody = (slot: ReminderSlot, dailyGoal: number, slotCount: number) => {
  const estimatedSip = Math.max(150, Math.round(dailyGoal / Math.max(slotCount + 1, 1) / 10) * 10);
  const period =
    slot.hour < 11 ? 'buổi sáng' : slot.hour < 17 ? 'buổi trưa' : 'buổi chiều';

  return `${slot.label} rồi, uống khoảng ${estimatedSip}ml trong ${period} để bám sát mục tiêu ${dailyGoal}ml hôm nay nhé.`;
};

const ensureReminderChannel = async () => {
  if (Capacitor.getPlatform() !== 'android') return;

  await LocalNotifications.createChannel({
    id: REMINDER_CHANNEL_ID,
    name: REMINDER_CHANNEL_NAME,
    description: 'Nhắc nhở uống nước định kỳ của DigiWell',
    importance: 4,
    visibility: 1,
    vibration: true,
    lights: true,
    lightColor: '#06B6D4',
  }).catch(() => undefined);
};

export const registerHydrationReminderActions = async () => {
  if (!supportsNativeHydrationReminders()) return;

  await LocalNotifications.registerActionTypes({
    types: [
      {
        id: HYDRATION_REMINDER_ACTION_TYPE_ID,
        actions: [
          { id: HYDRATION_NOTIFICATION_ACTION_IDS.add250, title: '+250ml' },
          { id: HYDRATION_NOTIFICATION_ACTION_IDS.add500, title: '+500ml' },
          { id: HYDRATION_NOTIFICATION_ACTION_IDS.snooze15, title: 'Nhac lai 15p' },
        ],
      },
    ],
  });
};

export const checkHydrationReminderPermission = async () => {
  if (!supportsNativeHydrationReminders()) return false;
  const status = await LocalNotifications.checkPermissions();
  return status.display === 'granted';
};

export const requestHydrationReminderPermission = async () => {
  if (!supportsNativeHydrationReminders()) return false;
  const status = await LocalNotifications.requestPermissions();
  return status.display === 'granted';
};

export const clearHydrationReminders = async () => {
  if (!supportsNativeHydrationReminders()) return;
  await LocalNotifications.cancel({
    notifications: [...getReminderDescriptors(), { id: SNOOZE_NOTIFICATION_ID }],
  });
};

export const scheduleHydrationReminders = async (
  settings: HydrationReminderSettings,
  options: { dailyGoal: number; nickname?: string },
) => {
  if (!supportsNativeHydrationReminders()) {
    return { scheduled: false, count: 0 };
  }

  const validationError = validateHydrationReminderSettings(settings);
  if (validationError) throw new Error(validationError);

  const slots = buildReminderSlots(settings);
  await ensureReminderChannel();
  await clearHydrationReminders();

  if (!settings.enabled) {
    return { scheduled: false, count: 0 };
  }

  const notifications: LocalNotificationSchema[] = slots.map((slot, index) => ({
    id: REMINDER_ID_BASE + index + 1,
    title: createReminderTitle(options.nickname),
    body: createReminderBody(slot, options.dailyGoal, slots.length),
    schedule: {
      on: { hour: slot.hour, minute: slot.minute },
      allowWhileIdle: true,
    },
    channelId: REMINDER_CHANNEL_ID,
    group: REMINDER_CHANNEL_ID,
    summaryText: 'DigiWell hydration coach',
    autoCancel: true,
    actionTypeId: HYDRATION_REMINDER_ACTION_TYPE_ID,
    extra: { source: 'hydration-reminder' },
  }));

  await registerHydrationReminderActions();
  await LocalNotifications.schedule({ notifications });
  return { scheduled: true, count: notifications.length };
};

export const parseHydrationNotificationAction = (
  notificationAction: ActionPerformed,
): HydrationNotificationIntent | null => {
  if (notificationAction.notification.extra?.source !== 'hydration-reminder') {
    return null;
  }

  switch (notificationAction.actionId) {
    case HYDRATION_NOTIFICATION_ACTION_IDS.add250:
      return { kind: 'add', amount: 250, name: 'Nuoc loc (notification)' };
    case HYDRATION_NOTIFICATION_ACTION_IDS.add500:
      return { kind: 'add', amount: 500, name: 'Nuoc loc (notification)' };
    case HYDRATION_NOTIFICATION_ACTION_IDS.snooze15:
      return { kind: 'snooze', minutes: 15 };
    default:
      return null;
  }
};

export const scheduleHydrationSnooze = async (options: {
  dailyGoal: number;
  nickname?: string;
  minutes?: number;
}) => {
  if (!supportsNativeHydrationReminders()) return;

  const minutes = options.minutes ?? 15;
  await ensureReminderChannel();
  await registerHydrationReminderActions();

  await LocalNotifications.schedule({
    notifications: [
      {
        id: SNOOZE_NOTIFICATION_ID,
        title: createReminderTitle(options.nickname),
        body: `DigiWell nhac lai sau ${minutes} phut. Uong mot it nuoc de theo kip muc tieu ${options.dailyGoal}ml nhe.`,
        schedule: {
          at: new Date(Date.now() + minutes * 60 * 1000),
          allowWhileIdle: true,
        },
        channelId: REMINDER_CHANNEL_ID,
        group: REMINDER_CHANNEL_ID,
        autoCancel: true,
        actionTypeId: HYDRATION_REMINDER_ACTION_TYPE_ID,
        extra: { source: 'hydration-reminder' },
      },
    ],
  });
};
