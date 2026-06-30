/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Sparkles, LayoutDashboard, Kanban, Calendar, Award, Settings, Brain, CheckSquare } from "lucide-react";

interface SidebarProps {
  currentTab: string;
  onChangeTab: (tab: string) => void;
}

export default function Sidebar({ currentTab, onChangeTab }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "kanban", label: "Kanban Board", icon: Kanban },
    { id: "calendar", label: "Smart Scheduler", icon: Calendar },
    { id: "goals", label: "Goals & Habits", icon: Award },
    { id: "coach", label: "Coaching Center", icon: Brain }
  ];

  return (
    <div id="sidebar-container" className="w-full lg:w-64 bg-[#09090B] border-r border-white/10 flex flex-col justify-between p-6 text-slate-300">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center space-x-3 px-1">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/20">
            P
          </div>
          <div>
            <h1 className="text-xl font-serif font-medium tracking-tight text-white leading-none">Prodigy AI</h1>
            <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-widest">Companion</span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                id={`sidebar-link-${item.id}`}
                onClick={() => onChangeTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                  isActive 
                    ? "bg-white/5 text-white font-semibold" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="space-y-6">
        {/* Voice Assistant Indicator */}
        <div id="voice-indicator-card" className="p-4 bg-indigo-950/20 border border-indigo-500/10 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex gap-0.5 items-end h-4">
              <div className="w-1 h-2 bg-indigo-400 animate-pulse"></div>
              <div className="w-1 h-3.5 bg-indigo-400"></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 animate-pulse"></div>
            </div>
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Voice Active</span>
          </div>
          <p className="text-[11px] text-indigo-200/60 leading-relaxed italic">
            "Add a follow-up task for the Notion architecture meeting tomorrow."
          </p>
        </div>

        {/* User profile footer */}
        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center space-x-3 px-1">
            <div className="h-9 w-9 bg-indigo-600/10 border border-indigo-500/20 rounded-full flex items-center justify-center font-bold text-indigo-400 uppercase text-xs">
              F
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">Firdaush Saniya</p>
              <p className="text-[10px] text-slate-500 truncate">Prodigy AI User</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[10px] text-slate-500 font-medium px-1">
            <span>v1.2.0-MVP</span>
            <span className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
              <span>Offline Ready</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
