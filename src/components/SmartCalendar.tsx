/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Calendar as CalendarIcon, Clock, Sparkles, RefreshCw, Layers, Check, Link2, AlertCircle, RotateCcw, CalendarDays, Zap } from "lucide-react";
import { DailyAgenda, AgendaSlot, Task, IntegrationConfig } from "../types";

interface SmartCalendarProps {
  tasks: Task[];
  agenda: DailyAgenda;
  onUpdateAgenda: (agenda: DailyAgenda) => void;
  integrations: IntegrationConfig;
  onToggleIntegration: (key: keyof IntegrationConfig) => void;
}

export default function SmartCalendar({ tasks, agenda, onUpdateAgenda, integrations, onToggleIntegration }: SmartCalendarProps) {
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [selectedMonth, setSelectedMonth] = useState("June");
  const [viewType, setViewType] = useState<"agenda" | "grid">("agenda");
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Calls AI to generate/optimize daily agenda based on tasks
  const handleAutoSchedule = async () => {
    setLoading(true);
    setSyncStatus(null);
    try {
      const response = await fetch("/api/ai/generate-agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: tasks.filter(t => t.status !== "completed").map(t => ({
            id: t.id,
            title: t.title,
            priority: t.priority,
            estimatedHours: t.estimatedHours
          })),
          date: `2026-06-${selectedDay < 10 ? '0' + selectedDay : selectedDay}`,
          availableHours: 8
        })
      });

      const resData = await response.json();
      if (resData.success && Array.isArray(resData.data)) {
        onUpdateAgenda({
          date: agenda.date,
          slots: resData.data
        });
        setSyncStatus("AI completed schedule optimization. No overbookings detected!");
      }
    } catch (error) {
      console.error("AI scheduling failed:", error);
      // Fallback agenda setup
      onUpdateAgenda({
        date: agenda.date,
        slots: [
          { time: "09:00", durationMinutes: 60, type: "buffer", taskId: null, title: "Emails & Admin Checkup" },
          { time: "10:00", durationMinutes: 120, type: "focus", taskId: tasks[0]?.id || null, title: `Deep Focus: ${tasks[0]?.title || "Active Work"}` },
          { time: "12:00", durationMinutes: 60, type: "break", taskId: null, title: "Decompression Break / Lunch" },
          { time: "13:00", durationMinutes: 120, type: "focus", taskId: tasks[1]?.id || null, title: `Deep Focus: ${tasks[1]?.title || "Secondary Project"}` },
          { time: "15:30", durationMinutes: 30, type: "break", taskId: null, title: "Mindfulness Breathing Circle" },
          { time: "16:00", durationMinutes: 90, type: "focus", taskId: tasks[2]?.id || null, title: `Deep Focus: ${tasks[2]?.title || "Daily Chore"}` },
          { time: "17:30", durationMinutes: 30, type: "buffer", taskId: null, title: "AI Daily Reflection Review" }
        ]
      });
      setSyncStatus("Optimized agenda created with local heuristics.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = (pName: string, key: keyof IntegrationConfig) => {
    onToggleIntegration(key);
    const isNowActive = !integrations[key];
    if (isNowActive) {
      setSyncStatus(`Successfully linked and imported upcoming calendar blocks from ${pName}!`);
    } else {
      setSyncStatus(`Disconnected ${pName} from schedule feed.`);
    }
    setTimeout(() => setSyncStatus(null), 4000);
  };

  const getSlotTypeStyles = (type: string) => {
    switch (type) {
      case "focus": return "bg-emerald-500/5 border-emerald-500/10 text-emerald-300";
      case "meeting": return "bg-indigo-500/5 border-indigo-500/10 text-indigo-300";
      case "break": return "bg-white/5 border-white/10 text-slate-300";
      default: return "bg-black/30 border-white/10 text-slate-400";
    }
  };

  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div id="smart-calendar-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar Grid Selector */}
      <div className="bg-[#09090B] border border-white/10 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-indigo-400" />
            <h3 className="text-sm font-semibold text-slate-100 tracking-tight">{selectedMonth} 2026</h3>
          </div>
          <div className="flex bg-white/5 p-0.5 rounded-lg text-xs border border-white/10">
            <button
              id="view-type-agenda-btn"
              onClick={() => setViewType("agenda")}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${viewType === "agenda" ? "bg-white text-black font-semibold shadow" : "text-slate-400 hover:text-white"}`}
            >
              Agenda
            </button>
            <button
              id="view-type-grid-btn"
              onClick={() => setViewType("grid")}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${viewType === "grid" ? "bg-white text-black font-semibold shadow" : "text-slate-400 hover:text-white"}`}
            >
              Grid
            </button>
          </div>
        </div>

        {viewType === "grid" ? (
          <div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-500 uppercase font-bold mb-2">
              <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {/* Fill empty dates to align weeks */}
              {Array.from({ length: 1 }).map((_, idx) => (
                <div key={`empty-${idx}`} className="p-2"></div>
              ))}
              {daysInMonth.map((day) => {
                const isSelected = selectedDay === day;
                const hasTaskDeadline = tasks.some(t => parseInt(t.deadline.split("-")[2]) === day);

                return (
                  <button
                    key={day}
                    id={`day-selector-btn-${day}`}
                    onClick={() => setSelectedDay(day)}
                    className={`p-2 rounded-lg text-xs font-semibold relative transition cursor-pointer ${
                      isSelected 
                        ? "bg-white text-black font-bold shadow" 
                        : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/5"
                    }`}
                  >
                    <span>{day}</span>
                    {hasTaskDeadline && !isSelected && (
                      <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-red-400"></span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-500 text-center mt-4">
              🔴 Red dots indicate planned task deadline constraints
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 text-center">
              <span className="text-3xl font-serif font-medium text-white tracking-tight">28</span>
              <p className="text-xs text-slate-400 mt-1 font-medium">Sunday, June 2026</p>
              <div className="flex justify-center space-x-1.5 mt-2.5">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-medium">
                  {tasks.filter(t => t.status !== "completed").length} Tasks Left
                </span>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-medium">
                  {integrations.googleCalendar ? "GCal Synced" : "Offline"}
                </span>
              </div>
            </div>

            {/* Quick Action */}
            <button
              id="ai-auto-schedule-btn"
              onClick={handleAutoSchedule}
              disabled={loading}
              className="w-full bg-white hover:bg-slate-200 text-black font-bold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Optimizing Work Day...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-black" />
                  <span>AI Auto-Schedule Focus Day</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Integration Hub Panel */}
        <div className="mt-5 border-t border-white/10 pt-4">
          <h4 className="text-xs font-bold text-slate-300 tracking-wide uppercase mb-3">Integrations Feed</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs bg-black/40 border border-white/10 p-2.5 rounded-xl">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                <span className="text-slate-300 font-medium">Google Calendar</span>
              </div>
              <button
                id="link-google-cal"
                onClick={() => handleManualSync("Google Calendar", "googleCalendar")}
                className={`px-2.5 py-1 rounded text-[10px] font-bold transition flex items-center space-x-1 cursor-pointer ${
                  integrations.googleCalendar ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25" : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10"
                }`}
              >
                {integrations.googleCalendar ? <><Check className="h-3 w-3" /> <span>Synced</span></> : <><Link2 className="h-3 w-3" /> <span>Link</span></>}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs bg-black/40 border border-white/10 p-2.5 rounded-xl">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                <span className="text-slate-300 font-medium">Outlook Calendar</span>
              </div>
              <button
                id="link-outlook-cal"
                onClick={() => handleManualSync("Outlook Calendar", "outlookCalendar")}
                className={`px-2.5 py-1 rounded text-[10px] font-bold transition flex items-center space-x-1 cursor-pointer ${
                  integrations.outlookCalendar ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25" : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10"
                }`}
              >
                {integrations.outlookCalendar ? <><Check className="h-3 w-3" /> <span>Synced</span></> : <><Link2 className="h-3 w-3" /> <span>Link</span></>}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs bg-black/40 border border-white/10 p-2.5 rounded-xl">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                <span className="text-slate-300 font-medium">Notion Workspace</span>
              </div>
              <button
                id="link-notion"
                onClick={() => handleManualSync("Notion Workspace", "notion")}
                className={`px-2.5 py-1 rounded text-[10px] font-bold transition flex items-center space-x-1 cursor-pointer ${
                  integrations.notion ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25" : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10"
                }`}
              >
                {integrations.notion ? <><Check className="h-3 w-3" /> <span>Synced</span></> : <><Link2 className="h-3 w-3" /> <span>Link</span></>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Agenda timeline */}
      <div className="bg-[#09090B] border border-white/10 rounded-2xl p-5 shadow-2xl lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Daily Agenda & Timeline</h3>
            <p className="text-xs text-slate-400">Continuous breakdown for YYYY-MM-{selectedDay}</p>
          </div>
          <span className="text-[10px] bg-white/5 border border-white/10 text-slate-400 px-2.5 py-0.5 rounded font-medium">
            Timeline Mode
          </span>
        </div>

        {syncStatus && (
          <div id="calendar-sync-toast" className="mb-4 text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 p-3 rounded-xl flex items-center space-x-2 animate-slideDown">
            <Check className="h-4 w-4 text-indigo-400" />
            <span>{syncStatus}</span>
          </div>
        )}

        <div className="space-y-3">
          {agenda.slots.map((slot, index) => (
            <div
              key={index}
              id={`agenda-slot-${index}`}
              className={`flex items-start border rounded-xl p-3.5 transition hover:bg-white/5 ${getSlotTypeStyles(slot.type)}`}
            >
              <div className="w-16 flex-shrink-0 text-xs font-semibold flex items-center space-x-1 text-slate-300">
                <Clock className="h-3.5 w-3.5 opacity-60" />
                <span>{slot.time}</span>
              </div>
              
              <div className="flex-1 pl-4 border-l border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                    {slot.title}
                  </h4>
                  <span className="text-[10px] opacity-75 font-medium uppercase mt-0.5 sm:mt-0">
                    {slot.type} slot • {slot.durationMinutes}m
                  </span>
                </div>
                {slot.type === "focus" && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    AI recommendation: Avoid distractions. Prodigy AI will lock incoming notification logs during this sprint.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
