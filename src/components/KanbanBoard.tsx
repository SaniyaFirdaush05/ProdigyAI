/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Plus, CheckSquare, Calendar, Clock, AlertTriangle, ChevronRight, Zap, Sparkles, CheckSquare2, FileText, Loader2, Trash2 } from "lucide-react";
import { Task, PriorityType } from "../types";

interface KanbanBoardProps {
  tasks: Task[];
  onUpdateTaskStatus: (taskId: string, status: 'todo' | 'in_progress' | 'completed') => void;
  onUpdateSubtasks: (taskId: string, subtasks: Task['subtasks']) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: (column: 'todo' | 'in_progress' | 'completed') => void;
}

export default function KanbanBoard({ tasks, onUpdateTaskStatus, onUpdateSubtasks, onDeleteTask, onAddTask }: KanbanBoardProps) {
  const [breakdownLoadingId, setBreakdownLoadingId] = useState<string | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: 'todo' | 'in_progress' | 'completed') => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      onUpdateTaskStatus(taskId, status);
    }
  };

  // Triggers the Autonomous Planning Agent to break a task down
  const handleAIBreakdown = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setBreakdownLoadingId(task.id);

    try {
      const response = await fetch("/api/ai/generate-breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: task.title, description: task.description })
      });

      const resData = await response.json();
      if (resData.success && Array.isArray(resData.data)) {
        const subtasks = resData.data.map((item: any, idx: number) => ({
          id: `sub-${Date.now()}-${idx}`,
          title: item.title,
          completed: false,
          estimatedMinutes: item.estimatedMinutes || 30
        }));

        onUpdateSubtasks(task.id, subtasks);
        setExpandedCardId(task.id); // Expand card to show new plan
      }
    } catch (err) {
      console.error("AI breakdown failed", err);
    } finally {
      setBreakdownLoadingId(null);
    }
  };

  const handleSubtaskToggle = (task: Task, subtaskId: string) => {
    const updated = task.subtasks.map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    onUpdateSubtasks(task.id, updated);
  };

  const getPriorityColor = (priority: PriorityType) => {
    switch (priority) {
      case "high":
        return "text-red-400 bg-red-500/10 border-red-500/20";
      case "medium":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      default:
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    }
  };

  const columns = [
    { id: "todo", title: "Todo / Backlog", bg: "bg-[#09090B]/60" },
    { id: "in_progress", title: "Active / Focus", bg: "bg-[#09090B]/60" },
    { id: "completed", title: "Completed", bg: "bg-[#09090B]/60" }
  ] as const;

  return (
    <div id="kanban-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {columns.map((column) => {
        const columnTasks = tasks.filter(t => t.status === column.id);

        return (
          <div
            key={column.id}
            id={`kanban-column-${column.id}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
            className={`flex flex-col rounded-2xl p-4 min-h-[550px] border border-white/10 ${column.bg}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center space-x-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  column.id === "todo" ? "bg-slate-500" : column.id === "in_progress" ? "bg-indigo-500 animate-pulse" : "bg-emerald-500"
                }`}></span>
                <h3 className="text-sm font-semibold text-slate-100 tracking-tight">{column.title}</h3>
                <span className="text-xs bg-white/5 text-slate-400 px-2 py-0.5 rounded-full font-medium border border-white/10">
                  {columnTasks.length}
                </span>
              </div>
              <button
                id={`add-task-col-btn-${column.id}`}
                onClick={() => onAddTask(column.id)}
                className="p-1 hover:bg-white/5 text-slate-400 hover:text-white rounded transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Tasks list */}
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[75vh] pr-1">
              {columnTasks.length === 0 ? (
                <div className="border border-dashed border-white/10 rounded-xl p-8 text-center text-xs text-slate-500">
                  Drag tasks here or click '+' to schedule one
                </div>
              ) : (
                columnTasks.map((task) => {
                  const completedSubtasksCount = task.subtasks.filter(s => s.completed).length;
                  const totalSubtasksCount = task.subtasks.length;
                  const isExpanded = expandedCardId === task.id;

                  // High risk calculations (aiPredictedHours > remaining available time, or user estimation warning)
                  const isAtRisk = task.aiRiskLevel === "high_risk" || (task.priority === "high" && column.id !== "completed");

                  return (
                    <div
                      key={task.id}
                      id={`task-card-${task.id}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className={`bg-[#09090B] border hover:border-white/20 rounded-xl p-4 shadow-2xl transition-all cursor-grab active:cursor-grabbing group ${
                        isAtRisk ? "border-red-500/20 hover:border-red-500/35 bg-red-950/10" : "border-white/10"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex flex-wrap gap-1.5">
                          <span className={`text-[9px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className="text-[9px] bg-white/5 border border-white/10 text-slate-400 px-2 py-0.5 rounded font-medium">
                            {task.category}
                          </span>
                        </div>
                        <button
                          id={`delete-task-btn-${task.id}`}
                          onClick={() => onDeleteTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/5 text-slate-500 hover:text-red-400 rounded transition cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <h4 className="text-sm font-semibold text-slate-200 mt-2.5 tracking-tight group-hover:text-white transition">
                        {task.title}
                      </h4>
                      
                      {task.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* AI Priority Reason if predicted */}
                      {task.aiPriorityReason && column.id !== "completed" && (
                        <div className="mt-2 text-[11px] bg-indigo-950/20 border border-indigo-500/10 p-2 rounded-lg text-indigo-300 flex items-start space-x-1.5">
                          <Sparkles className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 animate-pulse text-indigo-400" />
                          <span>{task.aiPriorityReason}</span>
                        </div>
                      )}

                      {/* Warnings */}
                      {isAtRisk && column.id !== "completed" && (
                        <div className="mt-2 text-[11px] bg-red-500/10 border border-red-500/20 p-2 rounded-lg text-red-400 flex items-center space-x-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 animate-bounce" />
                          <span>AI predicted deadline risk detected</span>
                        </div>
                      )}

                      {/* Footer elements */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 pt-3 border-t border-white/5 text-[10px] text-slate-400 font-medium">
                        <div className="flex items-center space-x-1" title="Deadline">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{task.deadline}</span>
                        </div>
                        <div className="flex items-center space-x-1" title="Estimated effort">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {task.aiPredictedHours ? `${task.aiPredictedHours}h (AI)` : `${task.estimatedHours}h`}
                          </span>
                        </div>
                        {totalSubtasksCount > 0 && (
                          <div className="flex items-center space-x-1" title="Subtasks completion">
                            <CheckSquare className="h-3.5 w-3.5" />
                            <span>{completedSubtasksCount}/{totalSubtasksCount}</span>
                          </div>
                        )}
                      </div>

                      {/* Subtasks collapse panel */}
                      {totalSubtasksCount > 0 && (
                        <div className="mt-3">
                          <button
                            id={`toggle-subtasks-btn-${task.id}`}
                            onClick={() => setExpandedCardId(isExpanded ? null : task.id)}
                            className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-200 py-1 font-medium border-t border-white/5 cursor-pointer"
                          >
                            <span>{isExpanded ? "Hide Execution Plan" : "View Execution Plan"}</span>
                            <ChevronRight className={`h-3 w-3 transform transition ${isExpanded ? "rotate-90" : ""}`} />
                          </button>

                          {isExpanded && (
                            <div className="mt-2 space-y-1.5 bg-[#09090B] p-2.5 rounded-lg border border-white/10 animate-slideDown">
                              {task.subtasks.map((st) => (
                                <label
                                  key={st.id}
                                  className="flex items-start space-x-2 text-[11px] text-slate-300 hover:text-white cursor-pointer select-none py-0.5"
                                >
                                  <input
                                    type="checkbox"
                                    checked={st.completed}
                                    onChange={() => handleSubtaskToggle(task, st.id)}
                                    className="accent-indigo-500 mt-0.5 rounded cursor-pointer"
                                  />
                                  <span className={st.completed ? "line-through text-slate-500" : ""}>
                                    {st.title} <span className="text-[10px] text-slate-500">({st.estimatedMinutes}m)</span>
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* AI breakdown trigger */}
                      {totalSubtasksCount === 0 && column.id !== "completed" && (
                        <button
                          id={`ai-breakdown-btn-${task.id}`}
                          onClick={(e) => handleAIBreakdown(e, task)}
                          disabled={breakdownLoadingId !== null}
                          className="mt-3 w-full bg-white/5 hover:bg-white/10 disabled:bg-[#09090B] border border-white/10 text-indigo-400 hover:text-indigo-300 rounded-lg py-2 text-[11px] font-semibold transition flex items-center justify-center space-x-1.5 cursor-pointer"
                        >
                          {breakdownLoadingId === task.id ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>Decomposing Project...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                              <span>AI Execution Breakdown</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
