/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PriorityType = 'high' | 'medium' | 'low';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  estimatedMinutes: number;
  deadline?: string;
}

export interface FocusBlock {
  startTime: string;
  endTime: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string; // 'Work', 'Personal', 'Health', 'Finance', 'Education', etc.
  deadline: string; // ISO date string (YYYY-MM-DD)
  estimatedHours: number;
  priority: PriorityType;
  aiPriorityReason?: string;
  aiPredictedHours?: number;
  aiRiskLevel?: 'high_risk' | 'on_track' | 'normal';
  status: 'todo' | 'in_progress' | 'completed';
  parentGoalId?: string | null;
  subtasks: Subtask[];
  dependencies: string[]; // List of other Task IDs
  createdAt: string;
  completedAt?: string | null;
  focusBlocks: FocusBlock[];
}

export interface HabitLog {
  date: string; // YYYY-MM-DD
  completed: boolean;
}

export interface Habit {
  id: string;
  title: string;
  category: string;
  frequency: 'daily' | 'weekly';
  currentStreak: number;
  bestStreak: number;
  history: HabitLog[];
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  category: string;
  targetDate: string; // YYYY-MM-DD
  progress: number; // 0 to 100
  subgoals: { id: string; title: string; completed: boolean }[];
  createdAt: string;
}

export interface AICoachingInsight {
  id: string;
  title: string;
  content: string;
  type: 'insight' | 'warning' | 'tip' | 'procrastination' | 'burnout';
  actionText: string | null;
  category: string;
  createdAt: string;
  read: boolean;
}

export interface AgendaSlot {
  time: string; // HH:MM
  taskId: string | null;
  type: 'focus' | 'meeting' | 'break' | 'buffer';
  title: string;
  durationMinutes: number;
}

export interface DailyAgenda {
  date: string; // YYYY-MM-DD
  slots: AgendaSlot[];
}

export interface IntegrationConfig {
  googleCalendar: boolean;
  outlookCalendar: boolean;
  slack: boolean;
  github: boolean;
  notion: boolean;
}

export interface ProductivityStats {
  taskCompletionRate: number; // percentage
  tasksCompletedThisWeek: number;
  focusHoursCompleted: number;
  streakCount: number;
  focusScore: number; // 0 to 100
  burnoutRisk: 'low' | 'moderate' | 'high';
  categoryDistribution: { name: string; value: number; color: string }[];
  weeklyCompletionTrend: { day: string; completed: number; focusMinutes: number }[];
}
