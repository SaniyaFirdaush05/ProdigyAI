/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Sparkles, Brain, AlertTriangle, Info, Bell, Plus, Calendar, Clock, Check, Loader2 } from "lucide-react";
import Sidebar from "./components/Sidebar";
import AICommandPanel from "./components/AICommandPanel";
import AICoachCard from "./components/AICoachCard";
import KanbanBoard from "./components/KanbanBoard";
import DashboardStats from "./components/DashboardStats";
import SmartCalendar from "./components/SmartCalendar";
import GoalsTracker from "./components/GoalsTracker";
import { Task, Habit, Goal, DailyAgenda, IntegrationConfig, ProductivityStats, PriorityType } from "./types";

const INITIAL_TASKS: Task[] = [
  {
    id: "task-1",
    title: "Complete marketing slide review for Q3 product launch",
    description: "Prepare and refine final charts, focus categories, and value propositions for the executive board review. Needs deep analytics alignment.",
    category: "Work",
    deadline: "2026-06-28",
    estimatedHours: 3,
    priority: "high",
    aiPredictedHours: 3.5,
    aiRiskLevel: "high_risk",
    aiPriorityReason: "Tight deadline relative to the Q3 presentation timing tomorrow. High risk.",
    status: "todo",
    createdAt: "2026-06-25T10:00:00Z",
    subtasks: [
      { id: "st-1-1", title: "Outline Q3 performance metrics and charts", completed: true, estimatedMinutes: 60 },
      { id: "st-1-2", title: "Draft product value propositions section", completed: false, estimatedMinutes: 90 },
      { id: "st-1-3", title: "Format visual layout in Material theme", completed: false, estimatedMinutes: 60 }
    ],
    dependencies: [],
    focusBlocks: []
  },
  {
    id: "task-2",
    title: "Write technical product specifications for AI scheduler",
    description: "Define the algorithmic constraints, data mapping structures, and API payloads for our automatic scheduling engine.",
    category: "Work",
    deadline: "2026-06-30",
    estimatedHours: 4,
    priority: "medium",
    status: "in_progress",
    createdAt: "2026-06-26T11:00:00Z",
    subtasks: [
      { id: "st-2-1", title: "Draft JSON Schema inputs for schedule solver", completed: true, estimatedMinutes: 90 },
      { id: "st-2-2", title: "Review performance limits with database architect", completed: false, estimatedMinutes: 120 }
    ],
    dependencies: [],
    focusBlocks: []
  },
  {
    id: "task-3",
    title: "45-minute aerobic endurance running training",
    description: "Targeting sustained heart rate Zone 2 for optimal physical recovery and mental refresh.",
    category: "Health",
    deadline: "2026-06-29",
    estimatedHours: 1,
    priority: "low",
    status: "todo",
    createdAt: "2026-06-27T08:00:00Z",
    subtasks: [],
    dependencies: [],
    focusBlocks: []
  },
  {
    id: "task-4",
    title: "Re-align personal investment portfolio indices",
    description: "Rebalance allocations based on mid-year economic analysis and individual savings milestones.",
    category: "Finance",
    deadline: "2026-07-05",
    estimatedHours: 2,
    priority: "low",
    status: "completed",
    completedAt: "2026-06-27T16:30:00Z",
    createdAt: "2026-06-24T09:00:00Z",
    subtasks: [
      { id: "st-4-1", title: "Check current asset ratio allocations", completed: true, estimatedMinutes: 45 },
      { id: "st-4-2", title: "Execute rebalance orders on brokerage", completed: true, estimatedMinutes: 75 }
    ],
    dependencies: [],
    focusBlocks: []
  },
  {
    id: "task-5",
    title: "Publish Notion integration roadmap feedback",
    description: "Synthesize team notes on product boards, Slack alignment discussions, and Notion webhook bugs.",
    category: "Work",
    deadline: "2026-06-27",
    estimatedHours: 1.5,
    priority: "medium",
    status: "completed",
    completedAt: "2026-06-27T14:00:00Z",
    createdAt: "2026-06-25T14:00:00Z",
    subtasks: [],
    dependencies: [],
    focusBlocks: []
  }
];

const INITIAL_HABITS: Habit[] = [
  {
    id: "habit-1",
    title: "Log morning goals & task priorities in Prodigy",
    category: "Focus",
    frequency: "daily",
    currentStreak: 5,
    bestStreak: 5,
    history: [
      { date: "2026-06-22", completed: true },
      { date: "2026-06-23", completed: true },
      { date: "2026-06-24", completed: true },
      { date: "2026-06-25", completed: true },
      { date: "2026-06-26", completed: true },
      { date: "2026-06-27", completed: true },
      { date: "2026-06-28", completed: true }
    ],
    createdAt: "2026-06-22T08:00:00Z"
  },
  {
    id: "habit-2",
    title: "Complete 90-minute deep work focus block",
    category: "Focus",
    frequency: "daily",
    currentStreak: 3,
    bestStreak: 6,
    history: [
      { date: "2026-06-22", completed: true },
      { date: "2026-06-23", completed: false },
      { date: "2026-06-24", completed: true },
      { date: "2026-06-25", completed: true },
      { date: "2026-06-26", completed: true },
      { date: "2026-06-27", completed: true },
      { date: "2026-06-28", completed: false }
    ],
    createdAt: "2026-06-22T08:00:00Z"
  },
  {
    id: "habit-3",
    title: "Decompress stretch session (15-min)",
    category: "Health",
    frequency: "daily",
    currentStreak: 1,
    bestStreak: 4,
    history: [
      { date: "2026-06-26", completed: false },
      { date: "2026-06-27", completed: true },
      { date: "2026-06-28", completed: false }
    ],
    createdAt: "2026-06-25T20:00:00Z"
  }
];

const INITIAL_GOALS: Goal[] = [
  {
    id: "goal-1",
    title: "Master full-stack financial modeling frameworks",
    category: "Education",
    targetDate: "2026-07-31",
    progress: 40,
    createdAt: "2026-06-20T09:00:00Z",
    subgoals: [
      { id: "sg-1", title: "Complete Advanced Excel valuation models course", completed: true },
      { id: "sg-2", title: "Analyze 3 real-world corporate balance sheets", completed: true },
      { id: "sg-3", title: "Draft personal portfolio DCF models", completed: false },
      { id: "sg-4", title: "Deliver presentation modeling slide review", completed: false },
      { id: "sg-5", title: "Review outputs with corporate audit coach", completed: false }
    ]
  },
  {
    id: "goal-2",
    title: "Achieve optimum cardiovascular stamina milestones",
    category: "Health",
    targetDate: "2026-08-15",
    progress: 50,
    createdAt: "2026-06-20T09:00:00Z",
    subgoals: [
      { id: "sg-6", title: "Log 10 complete 45-min Zone 2 running sessions", completed: true },
      { id: "sg-7", title: "Complete 100 consecutive pushups baseline", completed: false }
    ]
  }
];

const INITIAL_AGENDA: DailyAgenda = {
  date: "2026-06-28",
  slots: [
    { time: "09:00", durationMinutes: 60, type: "buffer", taskId: null, title: "Emails & Morning Slack Sync" },
    { time: "10:00", durationMinutes: 120, type: "focus", taskId: "task-1", title: "Deep Focus: Marketing slide review (High Risk)" },
    { time: "12:00", durationMinutes: 60, type: "break", taskId: null, title: "Lunch & Outdoor Walk" },
    { time: "13:00", durationMinutes: 120, type: "focus", taskId: "task-2", title: "Deep Focus: AI scheduler algorithms spec" },
    { time: "15:00", durationMinutes: 30, type: "break", taskId: null, title: "Decompress Stretching & Tea" },
    { time: "15:30", durationMinutes: 90, type: "focus", taskId: "task-3", title: "Focus Block: Aerobic running training" },
    { time: "17:00", durationMinutes: 60, type: "buffer", taskId: null, title: "Admin Cleanup & Tomorrow's Agenda Planning" }
  ]
};

export default function App() {
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [agenda, setAgenda] = useState<DailyAgenda>({ date: "2026-06-28", slots: [] });
  const [integrations, setIntegrations] = useState<IntegrationConfig>({
    googleCalendar: false,
    outlookCalendar: false,
    slack: false,
    github: false,
    notion: false
  });

  const [coachNotification, setCoachNotification] = useState<string | null>(null);

  // Load state on mount
  useEffect(() => {
    const cachedTasks = localStorage.getItem("prodigy_tasks");
    const cachedHabits = localStorage.getItem("prodigy_habits");
    const cachedGoals = localStorage.getItem("prodigy_goals");
    const cachedAgenda = localStorage.getItem("prodigy_agenda");
    const cachedInt = localStorage.getItem("prodigy_integrations");

    setTasks(cachedTasks ? JSON.parse(cachedTasks) : INITIAL_TASKS);
    setHabits(cachedHabits ? JSON.parse(cachedHabits) : INITIAL_HABITS);
    setGoals(cachedGoals ? JSON.parse(cachedGoals) : INITIAL_GOALS);
    setAgenda(cachedAgenda ? JSON.parse(cachedAgenda) : INITIAL_AGENDA);
    setIntegrations(cachedInt ? JSON.parse(cachedInt) : {
      googleCalendar: false,
      outlookCalendar: false,
      slack: false,
      github: false,
      notion: false
    });
  }, []);

  // Save changes to localStorage helper
  const saveTasks = (updated: Task[]) => {
    setTasks(updated);
    localStorage.setItem("prodigy_tasks", JSON.stringify(updated));
  };

  const saveHabits = (updated: Habit[]) => {
    setHabits(updated);
    localStorage.setItem("prodigy_habits", JSON.stringify(updated));
  };

  const saveGoals = (updated: Goal[]) => {
    setGoals(updated);
    localStorage.setItem("prodigy_goals", JSON.stringify(updated));
  };

  const saveAgenda = (updated: DailyAgenda) => {
    setAgenda(updated);
    localStorage.setItem("prodigy_agenda", JSON.stringify(updated));
  };

  const handleToggleIntegration = (key: keyof IntegrationConfig) => {
    const updated = { ...integrations, [key]: !integrations[key] };
    setIntegrations(updated);
    localStorage.setItem("prodigy_integrations", JSON.stringify(updated));
  };

  // NLU Task Created handler
  const handleTaskCreated = (newTaskData: Partial<Task>) => {
    const completeTask: Task = {
      id: `task-${Date.now()}`,
      title: newTaskData.title || "Untitled Task",
      description: newTaskData.description || "",
      category: newTaskData.category || "Work",
      deadline: newTaskData.deadline || "2026-06-28",
      estimatedHours: newTaskData.estimatedHours || 1,
      priority: newTaskData.priority || "medium",
      status: "todo",
      subtasks: newTaskData.subtasks || [],
      dependencies: [],
      focusBlocks: [],
      createdAt: new Date().toISOString()
    };

    const updated = [completeTask, ...tasks];
    saveTasks(updated);
    setCoachNotification(`Autonomous Agent added new task: "${completeTask.title}"`);
    setTimeout(() => setCoachNotification(null), 5000);
  };

  // Kanban status update handler
  const handleUpdateTaskStatus = (taskId: string, status: 'todo' | 'in_progress' | 'completed') => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status,
          completedAt: status === "completed" ? new Date().toISOString() : null
        };
      }
      return t;
    });
    saveTasks(updated);
  };

  const handleUpdateSubtasks = (taskId: string, subtasks: Task['subtasks']) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, subtasks };
      }
      return t;
    });
    saveTasks(updated);
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter(t => t.id !== taskId);
    saveTasks(updated);
  };

  const handleAddManualTask = (column: 'todo' | 'in_progress' | 'completed') => {
    const titles = ["Review engineering scope documentation", "Organize workspace metrics report", "Write core unit tests"];
    const randomTitle = titles[Math.floor(Math.random() * titles.length)];
    
    handleTaskCreated({
      title: randomTitle,
      description: "Manually initiated focus item",
      category: "Work",
      deadline: "2026-06-29",
      priority: "medium",
      status: column
    });
  };

  // Habit operations
  const handleToggleHabit = (habitId: string, date: string) => {
    const updated = habits.map(h => {
      if (h.id === habitId) {
        const alreadyDone = h.history.some(l => l.date === date && l.completed);
        let newHistory = [];
        let newStreak = h.currentStreak;

        if (alreadyDone) {
          newHistory = h.history.filter(l => l.date !== date);
          newStreak = Math.max(0, h.currentStreak - 1);
        } else {
          newHistory = [...h.history, { date, completed: true }];
          newStreak = h.currentStreak + 1;
        }

        const best = Math.max(h.bestStreak, newStreak);
        return {
          ...h,
          history: newHistory,
          currentStreak: newStreak,
          bestStreak: best
        };
      }
      return h;
    });
    saveHabits(updated);
    
    // Play motivational noise
    const synth = window.speechSynthesis;
    if (synth) {
      synth.speak(new SpeechSynthesisUtterance("Splendid! Habit streak secured."));
    }
  };

  const handleAddHabit = (title: string, category: string, frequency: "daily" | "weekly") => {
    const newHabit: Habit = {
      id: `habit-${Date.now()}`,
      title,
      category,
      frequency,
      currentStreak: 0,
      bestStreak: 0,
      history: [],
      createdAt: new Date().toISOString()
    };
    saveHabits([...habits, newHabit]);
  };

  const handleDeleteHabit = (habitId: string) => {
    saveHabits(habits.filter(h => h.id !== habitId));
  };

  // Goals operations
  const handleAddGoal = (title: string, category: string, targetDate: string, subgoalsTitles: string[]) => {
    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      title,
      category,
      targetDate,
      progress: 0,
      createdAt: new Date().toISOString(),
      subgoals: subgoalsTitles.map((stTitle, idx) => ({
        id: `sg-${Date.now()}-${idx}`,
        title: stTitle,
        completed: false
      }))
    };
    saveGoals([...goals, newGoal]);
  };

  const handleToggleSubgoal = (goalId: string, subgoalId: string) => {
    const updated = goals.map(g => {
      if (g.id === goalId) {
        const updatedSubgoals = g.subgoals.map(sg => 
          sg.id === subgoalId ? { ...sg, completed: !sg.completed } : sg
        );
        const completedCount = updatedSubgoals.filter(s => s.completed).length;
        const progress = Math.round((completedCount / (updatedSubgoals.length || 1)) * 100);
        return {
          ...g,
          subgoals: updatedSubgoals,
          progress
        };
      }
      return g;
    });
    saveGoals(updated);
  };

  const handleDeleteGoal = (goalId: string) => {
    saveGoals(goals.filter(g => g.id !== goalId));
  };

  // Coaching Card callbacks (interactive application of suggestions!)
  const handleApplyInsightAction = async (type: string, insight: any) => {
    setCoachNotification(`Applying Coaching Adjustment: ${insight.title}`);
    
    if (type === "burnout") {
      // Insert a rest slot in daily agenda
      const updatedSlots = [
        ...agenda.slots.slice(0, 3),
        { time: "11:30", durationMinutes: 30, type: "break" as const, taskId: null, title: "Decompress: Rest & Refresh" },
        ...agenda.slots.slice(3)
      ];
      saveAgenda({ ...agenda, slots: updatedSlots });
      setCoachNotification("Inserted 30-min Decompression slot into your calendar!");
    } else if (type === "procrastination" || type === "warning") {
      // Triggers AI Priorities solver!
      setCoachNotification("Querying AI Priorities predict engine...");
      try {
        const response = await fetch("/api/ai/prioritize-tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tasks, habits, currentDate: "2026-06-28" })
        });
        const resData = await response.json();
        if (resData.success && Array.isArray(resData.data)) {
          // Merge AI predictions into existing tasks
          const merged = tasks.map(t => {
            const pred = resData.data.find((p: any) => p.id === t.id);
            if (pred) {
              return {
                ...t,
                priority: pred.aiPredictedPriority as PriorityType,
                aiPriorityReason: pred.aiPriorityReason,
                aiPredictedHours: pred.aiPredictedHours,
                aiRiskLevel: pred.aiRiskLevel
              };
            }
            return t;
          });
          saveTasks(merged);
          setCoachNotification("Tasks re-prioritized securely using smart predictions!");
        }
      } catch (err) {
        console.error("AI prioritizer failed", err);
      }
    } else {
      // General tip action: move focus to morning
      const sortedSlots = [...agenda.slots].sort((a, b) => {
        if (a.type === "focus" && b.type !== "focus") return -1;
        if (a.type !== "focus" && b.type === "focus") return 1;
        return 0;
      });
      saveAgenda({ ...agenda, slots: sortedSlots });
      setCoachNotification("Rearranged agenda: Prioritized morning focus sessions.");
    }

    setTimeout(() => setCoachNotification(null), 4000);
  };

  // Calculate stats dynamically for the dashboard stats
  const completedTasksCount = tasks.filter(t => t.status === "completed").length;
  const completionRate = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;
  
  // Custom metrics calculations
  const maxStreak = habits.length > 0 ? Math.max(...habits.map(h => h.currentStreak)) : 0;
  const focusHours = completedTasksCount * 2 + tasks.filter(t => t.status === "in_progress").length * 1.5;
  const focusScore = Math.min(100, Math.round(0.6 * completionRate + 0.4 * (maxStreak * 12)));

  const categories = Array.from(new Set(tasks.map(t => t.category))) as string[];
  const colors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899", "#14b8a6"];
  const categoryDistribution = categories.map((cat, i) => {
    const value = tasks.filter(t => t.category === cat).length;
    return { name: cat, value, color: colors[i % colors.length] };
  });

  const stats: ProductivityStats = {
    taskCompletionRate: completionRate,
    tasksCompletedThisWeek: completedTasksCount,
    focusHoursCompleted: focusHours,
    streakCount: maxStreak,
    focusScore,
    burnoutRisk: tasks.filter(t => t.priority === "high" && t.status !== "completed").length >= 2 ? "high" : "moderate",
    categoryDistribution,
    weeklyCompletionTrend: [
      { day: "Mon", completed: 1, focusMinutes: 90 },
      { day: "Tue", completed: 2, focusMinutes: 120 },
      { day: "Wed", completed: 1, focusMinutes: 60 },
      { day: "Thu", completed: 3, focusMinutes: 180 },
      { day: "Fri", completed: 2, focusMinutes: 140 },
      { day: "Sat", completed: 4, focusMinutes: 240 },
      { day: "Sun", completed: completedTasksCount, focusMinutes: Math.round(focusHours * 60) }
    ]
  };

  const renderActiveTab = () => {
    switch (currentTab) {
      case "kanban":
        return (
          <KanbanBoard
            tasks={tasks}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onUpdateSubtasks={handleUpdateSubtasks}
            onDeleteTask={handleDeleteTask}
            onAddTask={handleAddManualTask}
          />
        );
      case "calendar":
        return (
          <SmartCalendar
            tasks={tasks}
            agenda={agenda}
            onUpdateAgenda={saveAgenda}
            integrations={integrations}
            onToggleIntegration={handleToggleIntegration}
          />
        );
      case "goals":
        return (
          <GoalsTracker
            habits={habits}
            goals={goals}
            onToggleHabit={handleToggleHabit}
            onAddHabit={handleAddHabit}
            onDeleteHabit={handleDeleteHabit}
            onAddGoal={handleAddGoal}
            onToggleSubgoal={handleToggleSubgoal}
            onDeleteGoal={handleDeleteGoal}
          />
        );
      case "coach":
        return (
          <div className="space-y-6">
            <AICoachCard
              tasks={tasks}
              habits={habits}
              stats={stats}
              onApplyAction={handleApplyInsightAction}
            />
            <div className="bg-[#09090B] border border-white/10 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-sm font-semibold text-slate-100 mb-3 font-serif">Coach Diagnostics & Logs</h3>
              <div className="space-y-2 text-xs text-slate-400">
                <p>💡 <strong>Adaptive scheduling active</strong>: Prodigy is tracking focus streaks of 5 days.</p>
                <p>💡 <strong>Peak energy index computed</strong>: Concentration values show a rise in evening hours (16:00 - 18:00).</p>
                <p>💡 <strong>Procrastination patterns</strong>: Detected minor delays on high-effort 'Health' category items.</p>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <AICoachCard
              tasks={tasks}
              habits={habits}
              stats={stats}
              onApplyAction={handleApplyInsightAction}
            />
            <DashboardStats
              stats={stats}
              tasks={tasks}
              habits={habits}
            />
          </div>
        );
    }
  };

  return (
    <div id="prodigy-ai-root" className="min-h-screen bg-[#09090B] flex flex-col lg:flex-row font-sans text-slate-300">
      
      {/* Sidebar navigation */}
      <Sidebar
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header - Next Best Action */}
        <header className="min-h-20 border-b border-white/10 flex flex-col md:flex-row items-center justify-between px-6 lg:px-8 py-4 bg-black/20 gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 flex-shrink-0">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-0.5">Next Best Action</p>
              <p className="text-sm text-slate-100">
                You have <span className="font-bold text-white">22 mins</span> free. Finalize the <span className="underline underline-offset-4 decoration-indigo-500 font-medium text-white">Investor Deck</span> before the 2 PM Sync.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center space-x-2 text-[11px] text-slate-400 bg-white/5 border border-white/10 rounded-full px-3 py-1 font-semibold">
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
              <span className="capitalize">{currentTab.replace("_", " ")} • Sunday, June 28</span>
            </div>
            <button className="px-4 py-2 bg-white hover:bg-slate-200 text-black text-xs font-bold rounded-full uppercase tracking-wider transition-all duration-150 cursor-pointer">
              Start Focus Session
            </button>
          </div>
        </header>

        {/* Dynamic content scrollable pane */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-6">
          
          {/* Notifications / Toast */}
          {coachNotification && (
            <div id="coach-alert-notification" className="bg-indigo-950/40 border border-indigo-500/20 rounded-xl p-4 text-indigo-300 flex items-center space-x-3 animate-slideDown">
              <Sparkles className="h-5 w-5 animate-pulse text-indigo-400" />
              <div className="text-xs font-medium">
                {coachNotification}
              </div>
            </div>
          )}

          {/* NLP inputs shown globally in prominent tabs except calendar / goals tracker */}
          {currentTab !== "calendar" && currentTab !== "goals" && (
            <AICommandPanel
              onTaskCreated={handleTaskCreated}
              currentDateString="2026-06-28"
            />
          )}

          {/* Active view layout */}
          <div className="relative z-10">
            {renderActiveTab()}
          </div>
        </main>
      </div>
    </div>
  );
}
