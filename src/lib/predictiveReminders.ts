/**
 * Predictive Hydration Reminder System
 * AI dự đoán khi nào user sẽ quên uống nước
 */

import type { WaterEntry } from './waterStorage';

export type PredictionResult = {
  nextReminderTime: Date;
  confidence: number; // 0-100%
  reason: string;
  suggestedAmount: number;
};

export type UserHydrationPattern = {
  averageIntakePerHour: number;
  peakHours: number[]; // 0-23
  lowHours: number[]; // 0-23
  averageDailyIntake: number;
  preferredDrinkTimes: { hour: number; count: number }[];
  recentTrend: 'increasing' | 'stable' | 'decreasing';
};

// Phân tích pattern uống nước của user
export const analyzeHydrationPattern = (
  entries: WaterEntry[],
  days: number = 7
): UserHydrationPattern => {
  const now = Date.now();
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  
  // Filter entries trong khoảng thời gian
  const recentEntries = entries.filter(e => e.timestamp >= cutoff);
  
  if (recentEntries.length === 0) {
    return {
      averageIntakePerHour: 0,
      peakHours: [],
      lowHours: [],
      averageDailyIntake: 0,
      preferredDrinkTimes: [],
      recentTrend: 'stable',
    };
  }

  // Tính tổng theo ngày
  const dailyTotals = new Map<string, number>();
  recentEntries.forEach(e => {
    const date = new Date(e.timestamp).toISOString().split('T')[0];
    const current = dailyTotals.get(date) || 0;
    dailyTotals.set(date, current + (e.actual_ml || e.amount));
  });

  // Tính trung bình ngày
  const daysWithData = dailyTotals.size;
  const totalMl = Array.from(dailyTotals.values()).reduce((a, b) => a + b, 0);
  const averageDailyIntake = daysWithData > 0 ? totalMl / daysWithData : 0;

  // Tính trung bình theo giờ
  const hourlyTotals = new Map<number, { total: number; count: number }>();
  for (let h = 0; h < 24; h++) {
    hourlyTotals.set(h, { total: 0, count: 0 });
  }
  recentEntries.forEach(e => {
    const hour = new Date(e.timestamp).getHours();
    const current = hourlyTotals.get(hour)!;
    current.total += e.actual_ml || e.amount;
    current.count += 1;
  });

  // Peak hours (giờ uống nhiều nhất)
  const hourlyAvg: { hour: number; avg: number }[] = [];
  hourlyTotals.forEach((v, h) => {
    hourlyAvg.push({ hour: h, avg: v.count > 0 ? v.total / v.count : 0 });
  });
  hourlyAvg.sort((a, b) => b.avg - a.avg);
  const peakHours = hourlyAvg.slice(0, 3).map(h => h.hour);

  // Low hours (giờ hiếm khi uống)
  const lowHours = hourlyAvg.filter(h => h.avg === 0).slice(0, 3).map(h => h.hour);

  // Preferred drink times
  const preferredDrinkTimes = Array.from(hourlyTotals.entries())
    .filter(([_, v]) => v.count > 0)
    .map(([hour, v]) => ({ hour, count: v.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Calculate trend (so sánh 3 ngày gần nhất với 4 ngày trước đó)
  const recentDays = Math.min(3, Math.floor(daysWithData / 2));
  const olderDays = Math.min(4, daysWithData - recentDays);
  
  let recentTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
  if (recentDays > 0 && olderDays > 0) {
    const sortedDays = Array.from(dailyTotals.entries()).sort((a, b) => b[0].localeCompare(a[0]));
    const recentTotal = sortedDays.slice(0, recentDays).reduce((a, b) => a + b[1], 0) / recentDays;
    const olderTotal = sortedDays.slice(recentDays, recentDays + olderDays).reduce((a, b) => a + b[1], 0) / olderDays;
    
    if (recentTotal > olderTotal * 1.1) recentTrend = 'increasing';
    else if (recentTotal < olderTotal * 0.9) recentTrend = 'decreasing';
  }

  // Average intake per hour
  const averageIntakePerHour = (averageDailyIntake / 16); // Giả định 16 tiếng thức

  return {
    averageIntakePerHour,
    peakHours,
    lowHours,
    averageDailyIntake,
    preferredDrinkTimes,
    recentTrend,
  };
};

// Dự đoán thời điểm cần nhắc
export const predictNextReminder = (
  entries: WaterEntry[],
  currentIntake: number,
  dailyGoal: number,
  settings: {
    startHour: number;
    endHour: number;
    intervalMinutes: number;
  }
): PredictionResult | null => {
  const now = new Date();
  const currentHour = now.getHours();
  
  // Không nhắc ngoài giờ hoạt động
  if (currentHour < settings.startHour || currentHour > settings.endHour) {
    return null;
  }

  const pattern = analyzeHydrationPattern(entries);
  
  // Tính remaining
  const remaining = dailyGoal - currentIntake;
  if (remaining <= 0) {
    return null; // Đã hoàn thành
  }

  // Ước tính thời gian còn lại trong ngày
  const hoursLeft = settings.endHour - currentHour;
  if (hoursLeft <= 0) {
    return null;
  }

  // Tính pace cần thiết
  const paceNeeded = remaining / hoursLeft; // ml/hour

  // So sánh với pattern
  const avgPace = pattern.averageIntakePerHour;
  
  let confidence = 70;
  let reason = '';
  let suggestedAmount = Math.round(remaining / Math.max(hoursLeft - 1, 1));

  // Nếu pace cần cao hơn bình thường -> cần nhắc sớm hơn
  if (paceNeeded > avgPace * 1.3) {
    confidence = 85;
    reason = `Bạn đang uống chậm hơn bình thường. Cần tăng tốc!`;
    suggestedAmount = Math.round(paceNeeded * 1.2);
  }
  // Nếu đang trending down
  else if (pattern.recentTrend === 'decreasing') {
    confidence = 80;
    reason = `Xu hướng uống nước đang giảm. Hãy cải thiện!`;
    suggestedAmount = Math.round(remaining * 0.3); // 30% remaining mỗi lần
  }
  // Nếu đang trending up
  else if (pattern.recentTrend === 'increasing') {
    confidence = 75;
    reason = `Tuyệt vời! Bạn đang duy trì tốt. Tiếp tục nhé!`;
    suggestedAmount = Math.round(remaining / Math.max(hoursLeft - 1, 1));
  }
  // Bình thường
  else {
    confidence = 70;
    reason = `Duy trì nhịp uống nước đều đặn`;
    suggestedAmount = Math.round(remaining / Math.max(hoursLeft - 1, 1));
  }

  // Kiểm tra giờ thấp điểm
  const nextHour = currentHour + 1;
  if (pattern.lowHours.includes(nextHour)) {
    // Nếu giờ tới là giờ hiếm khi uống -> nhắc sớm hơn
    suggestedAmount = Math.round(suggestedAmount * 1.5);
    reason += ' (Giờ tới là giờ bạn thường ít uống nước)';
  }

  // Calculate next reminder time
  const nextReminderTime = new Date(now.getTime() + settings.intervalMinutes * 60 * 1000);
  
  // Adjust nếu trùng giờ thấp điểm
  if (pattern.lowHours.includes(nextReminderTime.getHours())) {
    nextReminderTime.setMinutes(nextReminderTime.getMinutes() + 15);
  }

  return {
    nextReminderTime,
    confidence,
    reason,
    suggestedAmount: Math.min(suggestedAmount, 300), // Max 300ml mỗi lần
  };
};

// Generate smart reminder message
export const generateReminderMessage = (
  prediction: PredictionResult,
  currentIntake: number,
  dailyGoal: number
): string => {
  const remaining = dailyGoal - currentIntake;
  const percentRemaining = Math.round((remaining / dailyGoal) * 100);
  
  if (prediction.confidence >= 80) {
    return `⚠️ Cần chú ý! Bạn còn thiếu ${remaining}ml (${percentRemaining}%) nhưng đang uống chậm. Uống ngay ${prediction.suggestedAmount}ml để giữ nhịp nhé!`;
  } else if (prediction.confidence >= 70) {
    return `💧 Nhắc nhở: Còn ${remaining}ml nữa để hoàn thành. ${prediction.reason}`;
  } else {
    return `💧 Đã uống ${currentIntake}ml/${dailyGoal}ml. ${prediction.reason}`;
  }
};

// Lấy thời gian reminder tối ưu trong ngày
export const getOptimalReminderSchedule = (
  pattern: UserHydrationPattern,
  dailyGoal: number,
  settings: {
    remindersPerDay: number;
    startHour: number;
    endHour: number;
  }
): Date[] => {
  const reminders: Date[] = [];
  const now = new Date();
  
  // Tạo reminder schedule dựa trên pattern
  const hoursToSchedule = settings.endHour - settings.startHour;
  const interval = Math.floor(hoursToSchedule / settings.remindersPerDay);
  
  for (let i = 0; i < settings.remindersPerDay; i++) {
    const hour = settings.startHour + i * interval;
    const reminderTime = new Date(now);
    reminderTime.setHours(hour, 0, 0, 0);
    
    // Nếu giờ đã qua trong ngày -> chuyển sang ngày mai
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }
    
    // Ưu tiên giờ cao điểm
    if (pattern.peakHours.includes(hour)) {
      reminders.unshift(reminderTime); // Ưu tiên giờ cao điểm
    } else {
      reminders.push(reminderTime);
    }
  }
  
  return reminders.slice(0, settings.remindersPerDay);
};

// Kiểm tra xem có nên gửi reminder không
export const shouldSendReminder = (
  entries: WaterEntry[],
  currentIntake: number,
  dailyGoal: number,
  lastReminderTime: Date | null,
  settings: {
    intervalMinutes: number;
    startHour: number;
    endHour: number;
  }
): boolean => {
  const now = new Date();
  const currentHour = now.getHours();
  
  // Không nhắc ngoài giờ hoạt động
  if (currentHour < settings.startHour || currentHour > settings.endHour) {
    return false;
  }
  
  // Kiểm tra interval
  if (lastReminderTime) {
    const minutesSinceLastReminder = (now.getTime() - lastReminderTime.getTime()) / (1000 * 60);
    if (minutesSinceLastReminder < settings.intervalMinutes) {
      return false;
    }
  }
  
  // Kiểm tra xem đã uống trong 30 phút gần đây chưa
  const thirtyMinutesAgo = now.getTime() - 30 * 60 * 1000;
  const recentEntry = entries.some(e => e.timestamp >= thirtyMinutesAgo);
  if (recentEntry) {
    return false; // Đã uống gần đây, không cần nhắc
  }
  
  // Kiểm tra tiến độ
  const hoursPassed = currentHour - settings.startHour;
  const expectedProgress = (hoursPassed / (settings.endHour - settings.startHour)) * dailyGoal;
  
  // Nhắc nếu đang chậm hơn 20% so với expected
  if (currentIntake < expectedProgress * 0.8) {
    return true;
  }
  
  return false;
};
