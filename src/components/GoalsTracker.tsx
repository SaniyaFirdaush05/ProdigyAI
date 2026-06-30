/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Award, CheckCircle, Plus, Sparkles, TrendingUp, Zap, Trash2, CheckCircle2, Circle, Flame, Calendar } from "lucide-react";
import { Habit, Goal } from "../types";

interface GoalsTrackerProps {
  habits: Habit[];
  goals: Goal[];
  onToggleHabit: (habitId: string, date: string) => void;
  onAddHabit: (title: string, category: string, frequency: "daily" | "weekly") => void;
  onDeleteHabit: (habitId: string) => void;
  onAddGoal: (title: string, category: string, targetDate: string, subgoals: string[]) => void;
  onToggleSubgoal: (goalId: string, subgoalId: string) => void;
  onDeleteGoal: (goalId: string) => void;
}

export default function GoalsTracker({
  habits,
  goals,
  onToggleHabit,
  onAddHabit,
  onDeleteHabit,
  onAddGoal,
  onToggleSubgoal,
  onDeleteGoal
}: GoalsTrackerProps) {
  // Add Habit Form states
  const [habitTitle, setHabitTitle] = useState("");
  const [habitCategory, setHabitCategory] = useState("Focus");
  const [habitFrequency, setHabitFrequency] = useState<"daily" | "weekly">("daily");
  const [showHabitForm, setShowHabitForm] = useState(false);

  // Add Goal Form states
  const [goalTitle, setGoalTitle] = useState("");
  const [goalCategory, setGoalCategory] = useState("Work");
  const [goalDate, setGoalDate] = useState("2026-07-31");
  const [rawSubgoals, setRawSubgoals] = useState("");
  const [showGoalForm, setShowGoalForm] = useState(false);

  // Today's date YYYY-MM-DD
  const todayStr = "2026-06-28";

  // Last 7 days helper for display
  const last7Days = [
    { label: "Mon", date: "2026-06-22" },
    { label: "Tue", date: "2026-06-23" },
    { label: "Wed", date: "2026-06-24" },
    { label: "Thu", date: "2026-06-25" },
    { label: "Fri", date: "2026-06-26" },
    { label: "Sat", date: "2026-06-27" },
    { label: "Sun", date: "2026-06-28" }
  ];

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitTitle.trim()) return;
    onAddHabit(habitTitle, habitCategory, habitFrequency);
    setHabitTitle("");
    setShowHabitForm(false);
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    const subgoalsArray = rawSubgoals
      .split("\n")
      .map(s => s.trim())
      .filter(s => s.length > 0);
    onAddGoal(goalTitle, goalCategory, goalDate, subgoalsArray);
    setGoalTitle("");
    setRawSubgoals("");
    setShowGoalForm(false);
  };

  const isHabitCompletedOnDate = (habit: Habit, dateStr: string) => {
    return habit.history.some(log => log.date === dateStr && log.completed);
  };

  return (
    <div id="goals-tracker-wrapper" className="space-y-6">
      {/* Habits & Streaks Panel */}
      <div className="bg-[#09090B] border border-white/10 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 tracking-tight">Habit Streaks Tracker</h3>
            <p className="text-xs text-slate-400">Perform daily items to build consistency</p>
          </div>
          <button
            id="toggle-habit-form-btn"
            onClick={() => setShowHabitForm(!showHabitForm)}
            className="bg-white hover:bg-slate-200 text-black px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1 cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>New Habit</span>
          </button>
        </div>

        {/* New Habit Form */}
        {showHabitForm && (
          <form onSubmit={handleCreateHabit} className="bg-[#09090B] border border-white/10 p-4 rounded-xl mb-4 space-y-3 animate-slideDown">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                id="habit-title-input"
                type="text"
                placeholder="What is the habit? (e.g. Focus 90 minutes)"
                value={habitTitle}
                onChange={(e) => setHabitTitle(e.target.value)}
                className="col-span-1 sm:col-span-2 bg-black border border-white/10 text-xs text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
                required
              />
              <select
                id="habit-category-select"
                value={habitCategory}
                onChange={(e) => setHabitCategory(e.target.value)}
                className="bg-black border border-white/10 text-xs text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
              >
                <option value="Focus">Focus</option>
                <option value="Health">Health</option>
                <option value="Education">Education</option>
                <option value="Social">Social</option>
              </select>
            </div>
            <div className="flex items-center justify-between text-xs mt-1 pt-1">
              <div className="flex items-center space-x-3">
                <span className="text-slate-400 font-medium">Frequency:</span>
                <label className="flex items-center space-x-1.5 text-slate-300">
                  <input
                    type="radio"
                    checked={habitFrequency === "daily"}
                    onChange={() => setHabitFrequency("daily")}
                    className="accent-indigo-500"
                  />
                  <span>Daily</span>
                </label>
                <label className="flex items-center space-x-1.5 text-slate-300">
                  <input
                    type="radio"
                    checked={habitFrequency === "weekly"}
                    onChange={() => setHabitFrequency("weekly")}
                    className="accent-indigo-500"
                  />
                  <span>Weekly</span>
                </label>
              </div>
              <button
                id="submit-habit-btn"
                type="submit"
                className="bg-white hover:bg-slate-200 text-black px-4 py-1.5 rounded-lg font-bold transition cursor-pointer"
              >
                Add Habit
              </button>
            </div>
          </form>
        )}

        {/* Habits list */}
        <div className="space-y-3">
          {habits.map((habit) => {
            const completedToday = isHabitCompletedOnDate(habit, todayStr);

            return (
              <div
                key={habit.id}
                id={`habit-row-${habit.id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between bg-black/40 border border-white/10 p-4 rounded-xl gap-4 hover:border-white/20 transition"
              >
                <div className="flex items-start space-x-3">
                  <button
                    id={`tick-habit-btn-${habit.id}`}
                    onClick={() => onToggleHabit(habit.id, todayStr)}
                    className={`mt-0.5 p-1 rounded-md border transition-all cursor-pointer ${
                      completedToday 
                        ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" 
                        : "bg-white/5 border-white/10 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </button>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">{habit.title}</h4>
                    <div className="flex space-x-2 mt-1">
                      <span className="text-[9px] bg-white/5 border border-white/10 text-slate-400 px-1.5 py-0.5 rounded font-medium">
                        {habit.category}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {habit.frequency}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Grid of last 7 days */}
                <div className="flex items-center space-x-4">
                  <div className="flex space-x-1 bg-[#09090B] p-1.5 rounded-lg border border-white/5">
                    {last7Days.map((day) => {
                      const done = isHabitCompletedOnDate(habit, day.date);
                      return (
                        <div
                          key={day.date}
                          className="flex flex-col items-center"
                          title={`${day.label}: ${done ? "Completed" : "Not completed"}`}
                        >
                          <span className="text-[8px] text-slate-500 font-bold mb-0.5 uppercase">{day.label[0]}</span>
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                            done 
                              ? "bg-white text-black" 
                              : day.date === todayStr 
                                ? "border border-dashed border-white/20 bg-white/5" 
                                : "bg-white/5 border border-white/5"
                          }`}>
                            {done && <CheckCircle className="h-2.5 w-2.5 text-black" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Streaks count */}
                  <div className="flex items-center bg-orange-500/10 border border-orange-500/20 px-2.5 py-1.5 rounded-lg text-orange-400 font-semibold text-xs space-x-1">
                    <Flame className="h-4 w-4 fill-orange-500/20" />
                    <span>{habit.currentStreak}d</span>
                  </div>

                  <button
                    id={`delete-habit-btn-${habit.id}`}
                    onClick={() => onDeleteHabit(habit.id)}
                    className="p-1 hover:bg-white/5 text-slate-500 hover:text-red-400 rounded transition cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Long-Term Goals Progress Panel */}
      <div className="bg-[#09090B] border border-white/10 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 tracking-tight">Long-Term Goals Management</h3>
            <p className="text-xs text-slate-400">Establish milestones and track achievement progress</p>
          </div>
          <button
            id="toggle-goal-form-btn"
            onClick={() => setShowGoalForm(!showGoalForm)}
            className="bg-white hover:bg-slate-200 text-black px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1 cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>New Goal</span>
          </button>
        </div>

        {/* New Goal Form */}
        {showGoalForm && (
          <form onSubmit={handleCreateGoal} className="bg-[#09090B] border border-white/10 p-4 rounded-xl mb-4 space-y-3 animate-slideDown">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                id="goal-title-input"
                type="text"
                placeholder="What is your long-term goal? (e.g. Master Financial analysis)"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                className="bg-black border border-white/10 text-xs text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  id="goal-category-select"
                  value={goalCategory}
                  onChange={(e) => setGoalCategory(e.target.value)}
                  className="bg-black border border-white/10 text-xs text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
                >
                  <option value="Work">Work</option>
                  <option value="Health">Health</option>
                  <option value="Education">Education</option>
                  <option value="Social">Social</option>
                </select>
                <input
                  id="goal-date-input"
                  type="date"
                  value={goalDate}
                  onChange={(e) => setGoalDate(e.target.value)}
                  className="bg-black border border-white/10 text-xs text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <textarea
              id="goal-subtasks-textarea"
              rows={2}
              placeholder="Add subgoals / milestone steps (one per line)"
              value={rawSubgoals}
              onChange={(e) => setRawSubgoals(e.target.value)}
              className="w-full bg-black border border-white/10 text-xs text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500 resize-none"
            />

            <div className="flex justify-end pt-1">
              <button
                id="submit-goal-btn"
                type="submit"
                className="bg-white hover:bg-slate-200 text-black px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Add Goal
              </button>
            </div>
          </form>
        )}

        {/* Goals List */}
        <div className="space-y-4">
          {goals.map((goal) => (
            <div
              key={goal.id}
              id={`goal-row-${goal.id}`}
              className="bg-black/40 border border-white/10 p-4 rounded-xl hover:border-white/20 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-100">{goal.title}</h4>
                  <div className="flex space-x-2 mt-1">
                    <span className="text-[9px] bg-white/5 text-slate-400 px-1.5 py-0.5 rounded border border-white/10 font-medium">
                      {goal.category}
                    </span>
                    <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Target: {goal.targetDate}</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-indigo-400">{goal.progress}%</span>
                  <button
                    id={`delete-goal-btn-${goal.id}`}
                    onClick={() => onDeleteGoal(goal.id)}
                    className="p-1 hover:bg-white/5 text-slate-500 hover:text-red-400 rounded transition cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-white/5 h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${goal.progress}%` }}
                ></div>
              </div>

              {/* Subgoals checklists */}
              {goal.subgoals.length > 0 && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#09090B] p-2.5 rounded-lg border border-white/10 animate-slideDown">
                  {goal.subgoals.map((sg) => (
                    <button
                      key={sg.id}
                      id={`toggle-subgoal-btn-${goal.id}-${sg.id}`}
                      onClick={() => onToggleSubgoal(goal.id, sg.id)}
                      className="flex items-center space-x-2 text-left text-[11px] text-slate-300 hover:text-white py-1 transition select-none cursor-pointer"
                    >
                      {sg.completed ? (
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Circle className="h-4 w-4 text-slate-600" />
                      )}
                      <span className={sg.completed ? "line-through text-slate-500" : ""}>{sg.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
