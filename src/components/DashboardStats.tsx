/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, Legend } from "recharts";
import { Award, Zap, ShieldAlert, CheckCircle, TrendingUp, Calendar, Smile } from "lucide-react";
import { ProductivityStats, Task, Habit } from "../types";

interface DashboardStatsProps {
  stats: ProductivityStats;
  tasks: Task[];
  habits: Habit[];
}

export default function DashboardStats({ stats, tasks, habits }: DashboardStatsProps) {
  // Safe default values if lists are empty
  const activeTasksCount = tasks.filter(t => t.status !== "completed").length;
  const completedTasksCount = tasks.filter(t => t.status === "completed").length;
  const highPriorityTasksCount = tasks.filter(t => t.priority === "high" && t.status !== "completed").length;

  const getBurnoutLabelColor = (risk: string) => {
    switch (risk) {
      case "high": return "text-red-400 bg-red-500/10 border-red-500/20";
      case "moderate": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      default: return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    }
  };

  const getFocusScoreDescription = (score: number) => {
    if (score >= 85) return "Exceptional Focus (Flow state achieved)";
    if (score >= 70) return "High Focus (Optimal performance)";
    if (score >= 50) return "Moderate Focus (Balanced output)";
    return "Low Focus (Slightly distracted)";
  };

  // Custom tooltips for nice contrast
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#09090B] border border-white/10 p-3 rounded-lg shadow-2xl text-xs">
          <p className="font-semibold text-white">{label}</p>
          {payload.map((item: any, idx: number) => (
            <p key={idx} style={{ color: item.color || item.fill }} className="mt-1">
              {item.name}: <strong className="font-semibold text-white">{item.value}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div id="stats-dashboard-grid" className="space-y-6">
      {/* 4 Quick Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#09090B] border border-white/10 rounded-xl p-5 shadow-2xl flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Completion Rate</p>
            <h4 className="text-2xl font-serif font-medium text-white tracking-tight">{stats.taskCompletionRate}%</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">{completedTasksCount} finished / {tasks.length} total</p>
          </div>
        </div>

        <div className="bg-[#09090B] border border-white/10 rounded-xl p-5 shadow-2xl flex items-center space-x-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Focus Score</p>
            <h4 className="text-2xl font-serif font-medium text-white tracking-tight">{stats.focusScore}/100</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">{getFocusScoreDescription(stats.focusScore)}</p>
          </div>
        </div>

        <div className="bg-[#09090B] border border-white/10 rounded-xl p-5 shadow-2xl flex items-center space-x-4">
          <div className="p-3 bg-indigo-600/10 text-indigo-300 rounded-xl border border-indigo-500/20">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Focus Minutes</p>
            <h4 className="text-2xl font-serif font-medium text-white tracking-tight">{stats.focusHoursCompleted * 60}m</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">{stats.focusHoursCompleted.toFixed(1)} hours of deep work</p>
          </div>
        </div>

        <div className="bg-[#09090B] border border-white/10 rounded-xl p-5 shadow-2xl flex items-center space-x-4">
          <div className="p-3 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Burnout Risk</p>
            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-md border mt-1 ${getBurnoutLabelColor(stats.burnoutRisk)}`}>
              {stats.burnoutRisk} Risk
            </span>
            <p className="text-[10px] text-slate-500 mt-1">{highPriorityTasksCount} outstanding critical items</p>
          </div>
        </div>
      </div>

      {/* Primary Visualizations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Weekly completion trends */}
        <div className="bg-[#09090B] border border-white/10 rounded-2xl p-5 shadow-2xl lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Weekly Performance Report</h3>
            <p className="text-xs text-slate-400">Comparing total tasks completed with logged focus minutes</p>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.weeklyCompletionTrend}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#4b5563" fontSize={11} tickLine={false} />
                <YAxis stroke="#4b5563" fontSize={11} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Area name="Tasks Completed" type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" />
                <Area name="Focus (Minutes)" type="monotone" dataKey="focusMinutes" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorFocus)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Task allocation by category */}
        <div className="bg-[#09090B] border border-white/10 rounded-2xl p-5 shadow-2xl">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Category Allocation</h3>
            <p className="text-xs text-slate-400">Distribution of active and completed workloads</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center relative">
            {stats.categoryDistribution.length === 0 ? (
              <div className="text-xs text-slate-500">No category data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {stats.categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-serif font-medium text-white">{activeTasksCount}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Active</span>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs mt-2 pl-2">
            {stats.categoryDistribution.map((entry, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }}></span>
                <span className="text-slate-300 truncate">{entry.name}</span>
                <span className="text-slate-500 font-semibold">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Upcoming Critical Items and Streaks Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Critical deadlines */}
        <div className="bg-[#09090B] border border-white/10 rounded-2xl p-5 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Upcoming High-Risk Deadlines</h3>
              <p className="text-xs text-slate-400">Items requiring urgent attention from the coach</p>
            </div>
            <Calendar className="h-4.5 w-4.5 text-red-400" />
          </div>

          <div className="space-y-3 max-h-56 overflow-y-auto">
            {tasks.filter(t => t.status !== "completed" && t.priority === "high").length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                🎉 No pending high priority deadlines! You're on track.
              </div>
            ) : (
              tasks
                .filter(t => t.status !== "completed" && t.priority === "high")
                .slice(0, 4)
                .map((task) => (
                  <div key={task.id} className="flex items-center justify-between bg-black/40 border border-white/10 px-3.5 py-3 rounded-xl">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">{task.title}</h4>
                      <div className="flex space-x-2 mt-1">
                        <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded font-semibold">
                          Due {task.deadline}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {task.estimatedHours}h effort
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-white/5 text-slate-300 px-2 py-1 rounded-md capitalize font-semibold">
                      {task.status.replace("_", " ")}
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Gamified Achievements & Streaks */}
        <div className="bg-[#09090B] border border-white/10 rounded-2xl p-5 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Prodigy Milestones</h3>
              <p className="text-xs text-slate-400">Track and gamify habit consistency goals</p>
            </div>
            <Award className="h-4.5 w-4.5 text-yellow-500" />
          </div>

          <div className="space-y-3">
            {/* Habit Milestone */}
            <div className="bg-black/40 border border-white/10 p-3.5 rounded-xl flex items-start space-x-3">
              <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-lg">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-200">Habit Streaker</h4>
                  <span className="text-[10px] text-slate-500 font-semibold">{stats.streakCount} Day Streak</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full mt-2">
                  <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: `${Math.min(stats.streakCount * 14.2, 100)}%` }}></div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">Perform 7 consecutive habit ticks to achieve next title.</p>
              </div>
            </div>

            {/* Completion Milestone */}
            <div className="bg-black/40 border border-white/10 p-3.5 rounded-xl flex items-start space-x-3">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-200">Task Crusher</h4>
                  <span className="text-[10px] text-slate-500 font-semibold">{completedTasksCount}/10 completed</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full mt-2">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(completedTasksCount * 10, 100)}%` }}></div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">Achieve 10 total task completions to gain Prodigy Tier 2 badge.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
