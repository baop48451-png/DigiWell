/**
 * Week Comparison Module
 * So sánh tuần này vs tuần trước
 */

import { loadStoredWaterEntries } from './waterStorage';

export type WeekData = {
  weekLabel: string;
  startDate: string;
  endDate: string;
  days: DayData[];
  totalMl: number;
  averageMl: number;
  perfectDays: number;
  trend: 'up' | 'down' | 'stable';
};

export type DayData = {
  date: string;
  dayOfWeek: string;
  dayName: string;
  totalMl: number;
  goalMl: number;
  percentage: number;
  isComplete: boolean;
  isToday: boolean;
  entryCount: number;
};

// Lấy ngày đầu tuần (Thứ 2)
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  return new Date(d.setDate(diff));
};

// Load water data cho một ngày
const loadDayData = (userId: string, date: Date, goalMl: number): DayData => {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const entries = loadStoredWaterEntries(userId, dateStr);
  const totalMl = entries.reduce((sum, e) => sum + (e.actual_ml || e.amount), 0);
  const percentage = goalMl > 0 ? Math.round((totalMl / goalMl) * 100) : 0;
  
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const dayOfWeek = dayNames[date.getDay()];
  
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  
  return {
    date: dateStr,
    dayOfWeek,
    dayName: date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' }),
    totalMl,
    goalMl,
    percentage,
    isComplete: percentage >= 100,
    isToday,
    entryCount: entries.length,
  };
};

// Load data cho cả tuần
export const loadWeekData = (userId: string, weekStart: Date, defaultGoal: number = 2500): WeekData => {
  const days: DayData[] = [];
  let totalMl = 0;
  let perfectDays = 0;
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    const dayData = loadDayData(userId, date, defaultGoal);
    days.push(dayData);
    totalMl += dayData.totalMl;
    if (dayData.isComplete) perfectDays++;
  }
  
  const averageMl = Math.round(totalMl / 7);
  const weekLabel = `${days[0].dayName} - ${days[6].dayName}`;
  
  return {
    weekLabel,
    startDate: days[0].date,
    endDate: days[6].date,
    days,
    totalMl,
    averageMl,
    perfectDays,
    trend: 'stable',
  };
};

// So sánh 2 tuần
export const compareWeeks = (
  thisWeek: WeekData,
  lastWeek: WeekData
): {
  totalChange: number;
  totalChangePercent: number;
  avgChange: number;
  avgChangePercent: number;
  perfectDaysChange: number;
  bestDay: DayData | null;
  worstDay: DayData | null;
  comparison: 'better' | 'worse' | 'same';
} => {
  const totalChange = thisWeek.totalMl - lastWeek.totalMl;
  const totalChangePercent = lastWeek.totalMl > 0 
    ? Math.round((totalChange / lastWeek.totalMl) * 100) 
    : 0;
  
  const avgChange = thisWeek.averageMl - lastWeek.averageMl;
  const avgChangePercent = lastWeek.averageMl > 0 
    ? Math.round((avgChange / lastWeek.averageMl) * 100) 
    : 0;
  
  const perfectDaysChange = thisWeek.perfectDays - lastWeek.perfectDays;
  
  // Tìm ngày tốt nhất và tệ nhất của tuần này
  const thisWeekDays = thisWeek.days.filter(d => !d.isToday);
  const bestDay = thisWeekDays.length > 0 
    ? thisWeekDays.reduce((best, d) => d.totalMl > best.totalMl ? d : best, thisWeekDays[0])
    : null;
  const worstDay = thisWeekDays.length > 0 
    ? thisWeekDays.reduce((worst, d) => d.totalMl < worst.totalMl ? d : worst, thisWeekDays[0])
    : null;
  
  // Xác định comparison
  let comparison: 'better' | 'worse' | 'same' = 'same';
  if (totalChangePercent > 5) comparison = 'better';
  else if (totalChangePercent < -5) comparison = 'worse';
  
  return {
    totalChange,
    totalChangePercent,
    avgChange,
    avgChangePercent,
    perfectDaysChange,
    bestDay,
    worstDay,
    comparison,
  };
};

// Get tuần hiện tại và tuần trước
export const getWeeklyComparison = (userId: string, defaultGoal: number = 2500) => {
  const now = new Date();
  
  // Tuần này
  const thisWeekStart = getWeekStart(now);
  const thisWeek = loadWeekData(userId, thisWeekStart, defaultGoal);
  
  // Tuần trước
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeek = loadWeekData(userId, lastWeekStart, defaultGoal);
  
  // So sánh
  const comparison = compareWeeks(thisWeek, lastWeek);
  
  return {
    thisWeek,
    lastWeek,
    comparison,
  };
};

// Format số ml để hiển thị
export const formatMl = (ml: number): string => {
  if (ml >= 1000) {
    return `${(ml / 1000).toFixed(1)}L`;
  }
  return `${ml}ml`;
};

// Get màu sắc dựa trên performance
export const getPerformanceColor = (percentage: number): {
  bg: string;
  border: string;
  text: string;
} => {
  if (percentage >= 100) {
    return { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)', text: '#22c55e' };
  } else if (percentage >= 70) {
    return { bg: 'rgba(6,182,212,0.15)', border: 'rgba(6,182,212,0.3)', text: '#06b6d4' };
  } else if (percentage >= 40) {
    return { bg: 'rgba(234,179,8,0.15)', border: 'rgba(234,179,8,0.3)', text: '#eab308' };
  }
  return { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', text: '#ef4444' };
};

// Get trend icon
export const getTrendIcon = (trend: 'up' | 'down' | 'stable'): string => {
  switch (trend) {
    case 'up': return '📈';
    case 'down': return '📉';
    default: return '➡️';
  }
};

// Get trend message
export const getTrendMessage = (comparison: 'better' | 'worse' | 'same', changePercent: number): string => {
  if (comparison === 'better') {
    return `Tuyệt vời! Tuần này bạn uống nhiều hơn ${Math.abs(changePercent)}% so với tuần trước! 🎉`;
  } else if (comparison === 'worse') {
    return `Cố gắng hơn tuần này nhé! Bạn uống ít hơn ${Math.abs(changePercent)}% so với tuần trước. 💪`;
  }
  return 'Không có thay đổi đáng kể so với tuần trước. Giữ vững nhịp đều nhé! 💧';
};

// Get summary stats cho comparison
export const getComparisonSummary = (thisWeek: WeekData, lastWeek: WeekData) => {
  const thisWeekValidDays = thisWeek.days.filter(d => !d.isToday);
  const lastWeekValidDays = lastWeek.days.filter(d => !d.isToday);
  
  const thisWeekAvg = thisWeekValidDays.length > 0 
    ? thisWeekValidDays.reduce((sum, d) => sum + d.totalMl, 0) / thisWeekValidDays.length 
    : 0;
  
  const lastWeekAvg = lastWeekValidDays.length > 0 
    ? lastWeekValidDays.reduce((sum, d) => sum + d.totalMl, 0) / lastWeekValidDays.length 
    : 0;
  
  const avgDiff = thisWeekAvg - lastWeekAvg;
  const avgDiffPercent = lastWeekAvg > 0 ? Math.round((avgDiff / lastWeekAvg) * 100) : 0;
  
  const totalDiff = thisWeek.totalMl - lastWeek.totalMl;
  const totalDiffPercent = lastWeek.totalMl > 0 ? Math.round((totalDiff / lastWeek.totalMl) * 100) : 0;
  
  return {
    thisWeekTotal: thisWeek.totalMl,
    lastWeekTotal: lastWeek.totalMl,
    totalDiff,
    totalDiffPercent,
    thisWeekAvg: Math.round(thisWeekAvg),
    lastWeekAvg: Math.round(lastWeekAvg),
    avgDiff: Math.round(avgDiff),
    avgDiffPercent,
    perfectDaysThisWeek: thisWeek.perfectDays,
    perfectDaysLastWeek: lastWeek.perfectDays,
    perfectDaysDiff: thisWeek.perfectDays - lastWeek.perfectDays,
  };
};
