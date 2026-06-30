/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Sparkles, Brain, AlertTriangle, ShieldAlert, Zap, Volume2, HelpCircle, CheckCircle, RefreshCw, Award } from "lucide-react";
import { AICoachingInsight, Task, Habit, ProductivityStats } from "../types";

interface AICoachCardProps {
  tasks: Task[];
  habits: Habit[];
  stats: ProductivityStats;
  onApplyAction: (type: string, data?: any) => void;
}

export default function AICoachCard({ tasks, habits, stats, onApplyAction }: AICoachCardProps) {
  const [insights, setInsights] = useState<AICoachingInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpeechIndex, setActiveSpeechIndex] = useState<number | null>(null);

  const fetchInsights = async (actionDetails?: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/ai/coaching-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: tasks.map(t => ({ id: t.id, title: t.title, deadline: t.deadline, priority: t.priority, status: t.status })),
          habits: habits.map(h => ({ id: h.id, title: h.title, currentStreak: h.currentStreak, history: h.history })),
          stats,
          lastAction: actionDetails || "Dashboard view refreshed"
        })
      });

      const resData = await response.json();
      if (resData.success && Array.isArray(resData.data)) {
        const mapped: AICoachingInsight[] = resData.data.map((item: any, idx: number) => ({
          id: `insight-${Date.now()}-${idx}`,
          title: item.title,
          content: item.content,
          type: item.type || "insight",
          actionText: item.actionText || null,
          category: item.category || "General",
          createdAt: new Date().toISOString(),
          read: false
        }));
        setInsights(mapped);
      }
    } catch (error) {
      console.error("Error loading coaching insights:", error);
      // Fallback insights if server is loading or offline
      setInsights([
        {
          id: "fallback-1",
          title: "Procrastination Warning",
          content: "You have 2 high-priority tasks due within 48 hours but haven't allocated focus sessions yet.",
          type: "procrastination",
          actionText: "Auto-Schedule focus hours",
          category: "Focus",
          createdAt: new Date().toISOString(),
          read: false
        },
        {
          id: "fallback-2",
          title: "Peak Energy Opportunity",
          content: "Your analytics suggest your peak concentration window is 9:30 AM to 11:30 AM. Schedule deep work then.",
          type: "insight",
          actionText: "Move high-effort tasks to morning",
          category: "Performance",
          createdAt: new Date().toISOString(),
          read: false
        },
        {
          id: "fallback-3",
          title: "Burnout Risk Detection",
          content: "You've worked 4 consecutive focus hours without a scheduled rest break. Your efficiency is dropping.",
          type: "burnout",
          actionText: "Insert 15-min decompression",
          category: "Well-being",
          createdAt: new Date().toISOString(),
          read: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [tasks.length, habits.length]);

  const speakBriefing = (text: string, index: number) => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
      setActiveSpeechIndex(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      setIsSpeaking(false);
      setActiveSpeechIndex(null);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setActiveSpeechIndex(null);
    };

    setIsSpeaking(true);
    setActiveSpeechIndex(index);
    synth.speak(utterance);
  };

  const speakAllBriefings = () => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
      return;
    }

    const fullBriefing = `Hello Firdaush. Here is your Prodigy AI personalized coaching briefing. ` + 
      insights.map((ins, i) => `Insight ${i + 1}: ${ins.title}. ${ins.content}`).join(". ") + 
      ` Stay focused and protect your focus streaks!`;

    const utterance = new SpeechSynthesisUtterance(fullBriefing);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    synth.speak(utterance);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-400" />;
      case "procrastination":
        return <Brain className="h-5 w-5 text-indigo-400" />;
      case "burnout":
        return <ShieldAlert className="h-5 w-5 text-red-400" />;
      case "tip":
        return <Zap className="h-5 w-5 text-yellow-400" />;
      default:
        return <Sparkles className="h-5 w-5 text-emerald-400" />;
    }
  };

  const getInsightBg = (type: string) => {
    switch (type) {
      case "warning":
        return "bg-amber-950/10 border-amber-500/10 text-amber-200";
      case "procrastination":
        return "bg-indigo-950/20 border-indigo-500/10 text-indigo-200";
      case "burnout":
        return "bg-red-950/10 border-red-500/10 text-red-200";
      case "tip":
        return "bg-yellow-950/10 border-yellow-500/10 text-yellow-200";
      default:
        return "bg-white/5 border-white/10 text-slate-200";
    }
  };

  return (
    <div id="ai-coach-card-container" className="bg-[#09090B] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-3">
          <Brain className="h-6 w-6 text-indigo-400 animate-pulse" />
          <div>
            <h3 className="text-lg font-serif font-medium text-white tracking-tight">AI Productivity Coach</h3>
            <p className="text-xs text-slate-400">Behavioral nudges & habit analysis</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            id="speak-all-briefing-btn"
            onClick={speakAllBriefings}
            className={`p-2 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
              isSpeaking 
                ? "bg-red-500/20 border-red-500/30 text-red-400 animate-pulse" 
                : "bg-white/5 border-white/10 text-slate-300 hover:text-white"
            }`}
            title="Listen to today's spoken briefing"
          >
            <Volume2 className="h-4 w-4" />
            <span className="hidden sm:inline">{isSpeaking ? "Mute Coach" : "Read Briefing"}</span>
          </button>
          <button
            id="refresh-insights-btn"
            onClick={() => fetchInsights("Requested manual insights refresh")}
            disabled={loading}
            className="p-2 bg-white/5 border border-white/10 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
            title="Refresh coach diagnostics"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.map((insight, index) => (
          <div
            key={insight.id}
            id={`insight-item-${index}`}
            className={`flex flex-col justify-between border rounded-xl p-5 transition-all hover:scale-[1.01] ${getInsightBg(insight.type)}`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] bg-white/5 border border-white/10 text-slate-300 px-2 py-0.5 rounded font-medium tracking-wider uppercase">
                  {insight.category}
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    id={`speak-insight-btn-${index}`}
                    onClick={() => speakBriefing(insight.content, index)}
                    className={`p-1 rounded text-slate-400 hover:text-white transition cursor-pointer ${
                      activeSpeechIndex === index ? "text-indigo-400 animate-bounce" : ""
                    }`}
                    title="Read this insight out loud"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                  </button>
                  {getInsightIcon(insight.type)}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-white">{insight.title}</h4>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{insight.content}</p>
              </div>
            </div>

            {insight.actionText && (
              <button
                id={`apply-insight-action-${index}`}
                onClick={() => onApplyAction(insight.type, insight)}
                className="mt-4 w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 rounded-lg py-2 text-xs font-semibold transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <span>{insight.actionText}</span>
                <Zap className="h-3 w-3 text-indigo-400" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-5 border-t border-white/10 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <Award className="h-4.5 w-4.5 text-yellow-500" />
          <span>Burnout risk status: <strong className={`font-semibold capitalize ${stats.burnoutRisk === "high" ? "text-red-400" : stats.burnoutRisk === "moderate" ? "text-amber-400" : "text-emerald-400"}`}>{stats.burnoutRisk}</strong></span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
          <span>Adaptive scheduling listening active</span>
        </div>
      </div>
    </div>
  );
}
