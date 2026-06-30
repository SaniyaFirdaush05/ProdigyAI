/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Sparkles, Send, FileText, AlertCircle, CheckCircle, Plus } from "lucide-react";
import { Task, PriorityType } from "../types";

interface AICommandPanelProps {
  onTaskCreated: (task: Partial<Task>) => void;
  currentDateString: string;
}

export default function AICommandPanel({ onTaskCreated, currentDateString }: AICommandPanelProps) {
  const [activeTab, setActiveTab] = useState<"nlu" | "summarize">("nlu");
  const [commandText, setCommandText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);

  // Document summarizer states
  const [docText, setDocText] = useState("");
  const [docSourceType, setDocSourceType] = useState<"email" | "notion" | "document">("email");
  const [summaryResult, setSummaryResult] = useState<{
    summary: string;
    keyTakeaways: string[];
    suggestedTasks: { title: string; priority: string; estimatedHours: number }[];
  } | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if browser supports Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsRecording(true);
        setError(null);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCommandText(transcript);
      };

      rec.onerror = (e: any) => {
        console.error("Speech recognition error", e);
        setError("Voice input failed or was interrupted. Please try again.");
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleRecording = () => {
    if (!voiceSupported) {
      setError("Speech recognition is not supported in this browser. Please type your command.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setCommandText("");
      setError(null);
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
        setError("Could not start microphone. Check browser permissions.");
      }
    }
  };

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandText.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/parse-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: commandText, currentDate: currentDateString })
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        const parsed = resData.data;
        
        // Structure the parsed task
        const newTask: Partial<Task> = {
          title: parsed.title || "Untitled AI Task",
          description: parsed.description || commandText,
          category: parsed.category || "Work",
          deadline: parsed.deadline || currentDateString,
          priority: (parsed.priority?.toLowerCase() as PriorityType) || "medium",
          estimatedHours: parsed.estimatedHours || 1,
          status: "todo",
          subtasks: parsed.subtasks ? parsed.subtasks.map((st: string, idx: number) => ({
            id: `sub-${Date.now()}-${idx}`,
            title: st,
            completed: false,
            estimatedMinutes: Math.round((parsed.estimatedHours / (parsed.subtasks.length || 1)) * 60)
          })) : []
        };

        onTaskCreated(newTask);
        setCommandText("");
        // Confirmed visual feedback
        const synth = window.speechSynthesis;
        if (synth) {
          const utter = new SpeechSynthesisUtterance(`Added task: ${newTask.title}`);
          utter.rate = 1.1;
          synth.speak(utter);
        }
      } else {
        throw new Error(resData.error || "Failed to process task structure.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while communicating with the planning assistant.");
    } finally {
      setLoading(false);
    }
  };

  const handleDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docText.trim()) return;

    setLoading(true);
    setError(null);
    setSummaryResult(null);

    try {
      const response = await fetch("/api/ai/summarize-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: docText, sourceType: docSourceType })
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        setSummaryResult(resData.data);
      } else {
        throw new Error(resData.error || "Failed to parse document content.");
      }
    } catch (err: any) {
      setError(err.message || "Could not analyze the document. Please check the API state.");
    } finally {
      setLoading(false);
    }
  };

  const addDocTask = (task: { title: string; priority: string; estimatedHours: number }) => {
    onTaskCreated({
      title: task.title,
      description: `Extracted from summarized ${docSourceType}`,
      category: docSourceType === "email" ? "Communication" : "Work",
      deadline: currentDateString,
      priority: (task.priority.toLowerCase() as PriorityType) || "medium",
      estimatedHours: task.estimatedHours || 1,
      status: "todo",
      subtasks: []
    });

    if (summaryResult) {
      setSummaryResult({
        ...summaryResult,
        suggestedTasks: summaryResult.suggestedTasks.filter(t => t.title !== task.title)
      });
    }
  };

  return (
    <div id="ai-companion-panel" className="bg-[#09090B] border border-white/10 rounded-2xl p-6 shadow-2xl mb-6 text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-serif font-medium tracking-tight">Prodigy Autonomous Agent</h2>
            <p className="text-xs text-slate-400">Natural Language & Document Intelligence</p>
          </div>
        </div>

        <div className="flex bg-white/5 p-1 rounded-lg text-xs font-medium border border-white/10 self-start sm:self-auto">
          <button
            id="tab-btn-nlu"
            onClick={() => { setActiveTab("nlu"); setError(null); }}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${activeTab === "nlu" ? "bg-white text-black font-semibold shadow" : "text-slate-400 hover:text-white"}`}
          >
            Voice & Text Input
          </button>
          <button
            id="tab-btn-summarize"
            onClick={() => { setActiveTab("summarize"); setError(null); }}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${activeTab === "summarize" ? "bg-white text-black font-semibold shadow" : "text-slate-400 hover:text-white"}`}
          >
            Doc Summarizer
          </button>
        </div>
      </div>

      {activeTab === "nlu" ? (
        <div className="relative z-10">
          <form onSubmit={handleCommandSubmit} className="space-y-4">
            <div className="relative flex items-center bg-black/40 rounded-xl border border-white/10 p-1.5 focus-within:border-indigo-500/50 transition">
              <button
                id="mic-toggle-btn"
                type="button"
                onClick={toggleRecording}
                className={`p-3 rounded-lg transition-all cursor-pointer ${
                  isRecording 
                    ? "bg-red-600 text-white animate-pulse" 
                    : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                }`}
                title={voiceSupported ? "Record task command" : "Voice not supported in this browser"}
              >
                {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>

              <input
                id="ai-command-input"
                type="text"
                placeholder={isRecording ? "Listening..." : "Tell the AI what to schedule... (e.g. 'Draft slides by tomorrow night, high priority')"}
                value={commandText}
                onChange={(e) => setCommandText(e.target.value)}
                disabled={loading}
                className="w-full bg-transparent px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
              />

              <button
                id="submit-command-btn"
                type="submit"
                disabled={loading || !commandText.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-slate-600 text-white p-3 rounded-lg font-medium transition flex items-center space-x-1 cursor-pointer"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-slate-400 pl-1">
              <span className="text-slate-500 font-medium self-center">Try speaking:</span>
              <button
                id="try-command-1"
                type="button"
                onClick={() => setCommandText("Set up a study plan for financial modeling due by Friday, low priority, 4 hours effort")}
                className="bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1 rounded-md transition text-slate-300 cursor-pointer text-left"
              >
                "Study plan for financial modeling..."
              </button>
              <button
                id="try-command-2"
                type="button"
                onClick={() => setCommandText("Add urgent bug fix task to resolve memory leak by tonight, takes 2 hours")}
                className="bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1 rounded-md transition text-slate-300 cursor-pointer text-left"
              >
                "Urgent bug fix task..."
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="relative z-10 space-y-4">
          <form onSubmit={handleDocSubmit} className="space-y-4">
            <div className="flex items-center space-x-3 text-xs text-slate-400">
              <span className="font-medium text-slate-300">Document Type:</span>
              {(["email", "notion", "document"] as const).map((type) => (
                <label key={type} className="flex items-center space-x-1.5 cursor-pointer capitalize">
                  <input
                    type="radio"
                    name="sourceType"
                    checked={docSourceType === type}
                    onChange={() => setDocSourceType(type)}
                    className="accent-indigo-500"
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>

            <div className="relative bg-black/40 rounded-xl border border-white/10 focus-within:border-indigo-500/50 transition">
              <textarea
                id="doc-textarea"
                rows={4}
                placeholder="Paste your email thread, project scope, or Slack meeting minutes here to extract scheduled actions..."
                value={docText}
                onChange={(e) => setDocText(e.target.value)}
                disabled={loading}
                className="w-full bg-transparent px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none resize-none"
              />
              <div className="flex justify-end p-2 border-t border-white/5">
                <button
                  id="doc-summarize-btn"
                  type="submit"
                  disabled={loading || !docText.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-slate-600 text-white px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Analyzing Document...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="h-3.5 w-3.5" />
                      <span>Extract Tasks</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {summaryResult && (
            <div id="summary-result-card" className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4 animate-fadeIn">
              <div>
                <h3 className="text-xs font-semibold text-indigo-400 tracking-wider uppercase mb-1">AI Document Summary</h3>
                <p className="text-sm text-slate-200">{summaryResult.summary}</p>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-indigo-400 tracking-wider uppercase mb-1.5">Key Takeaways</h3>
                <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                  {summaryResult.keyTakeaways.map((takeaway, idx) => (
                    <li key={idx}>{takeaway}</li>
                  ))}
                </ul>
              </div>

              {summaryResult.suggestedTasks.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-indigo-400 tracking-wider uppercase mb-2">Suggested Action Items</h3>
                  <div className="space-y-2">
                    {summaryResult.suggestedTasks.map((st, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-black/40 border border-white/10 px-3 py-2.5 rounded-lg">
                        <div>
                          <p className="text-xs font-medium text-slate-100">{st.title}</p>
                          <div className="flex space-x-2 mt-1">
                            <span className="text-[10px] bg-white/5 text-slate-400 px-1.5 py-0.5 rounded uppercase font-semibold">
                              {st.priority} priority
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {st.estimatedHours}h estimated
                            </span>
                          </div>
                        </div>
                        <button
                          id={`add-extracted-task-${idx}`}
                          onClick={() => addDocTask(st)}
                          className="bg-white/5 hover:bg-indigo-600 text-slate-200 p-1.5 rounded-md hover:text-white transition cursor-pointer"
                          title="Schedule this task"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div id="ai-command-error" className="flex items-center space-x-2 text-red-400 text-xs mt-3 bg-red-500/10 border border-red-500/20 px-3 py-2.5 rounded-lg animate-shake">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
