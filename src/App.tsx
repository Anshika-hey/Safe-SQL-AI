import React, { useState, useEffect, useRef } from "react";
import { 
  Database, Shield, Zap, Terminal, ArrowRight, Sparkles, Bot, Send, 
  Trash2, UserCheck, Globe, RefreshCw, Layers, CheckCircle2, ChevronDown
} from "lucide-react";
import SchemaExplorer from "./components/SchemaExplorer.js";
import AgentWorkflow from "./components/AgentWorkflow.js";
import ResultsDisplay from "./components/ResultsDisplay.js";
import { DatabaseSchema, SuggestedPrompt, ChatMessage, PipelineResult } from "./types.js";

export default function App() {
  const [schemas, setSchemas] = useState<DatabaseSchema[]>([]);
  const [activeSchemaId, setActiveSchemaId] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("Analyst");
  const [dialect, setDialect] = useState<string>("SQLite");
  const [promptInput, setPromptInput] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<SuggestedPrompt[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch initial preloaded schemas catalog
  useEffect(() => {
    const fetchSchemas = async () => {
      try {
        const res = await fetch("/api/schemas");
        if (!res.ok) throw new Error("Failed to load schema registry.");
        const data = await res.json();
        setSchemas(data);
        if (data.length > 0) {
          setActiveSchemaId(data[0].id);
        }
      } catch (err: any) {
        setServerError(err.message || "Could not connect to backend server.");
      }
    };
    fetchSchemas();
  }, []);

  // 2. Load suggestions when schema changes
  useEffect(() => {
    if (!activeSchemaId) return;
    
    const fetchSuggestions = async () => {
      try {
        const res = await fetch(`/api/suggestions/${activeSchemaId}`);
        if (res.ok) {
          const list = await res.json();
          setSuggestedPrompts(list);
        }
      } catch (err) {
        console.error("Error loaded suggestions:", err);
      }
    };

    fetchSuggestions();
    
    // Clear current result and memory when switching database context to prevent leaks
    setPipelineResult(null);
    setChatHistory([]);
  }, [activeSchemaId]);

  // Scroll to bottom of chat automatically on new thread entries
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isLoading]);

  const activeSchema = schemas.find((s) => s.id === activeSchemaId);

  // 3. Handle Natural Language submission via Multi-Agent pipeline
  const handleSubmitQuery = async (customPrompt?: string) => {
    const activePrompt = (customPrompt || promptInput).trim();
    if (!activePrompt || isLoading) return;

    // Clear input
    if (!customPrompt) setPromptInput("");

    // Create user log entry
    const userMsgId = Math.random().toString();
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      text: activePrompt,
      timestamp: new Date().toISOString()
    };

    setChatHistory((prev) => [...prev, newUserMsg]);
    setIsLoading(true);
    setServerError(null);

    // Context history memory mapping
    const historyPayload = chatHistory.map((h) => ({
      role: h.role,
      text: h.text
    }));

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: activePrompt,
          schemaId: activeSchemaId,
          dialect,
          userRole,
          sessionHistory: historyPayload
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "A backend server-side compiling error occurred.");
      }

      const result: PipelineResult = await response.json();
      setPipelineResult(result);

      // Append AI conversational reply with reasoning context
      const assistantMsg: ChatMessage = {
        id: Math.random().toString(),
        role: "assistant",
        text: result.explanation.businessSummary,
        timestamp: new Date().toISOString(),
        result
      };

      setChatHistory((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setServerError(err.message || "Failed to execute multi-agent query orchestration.");
      // Append fail message
      const failMsg: ChatMessage = {
        id: Math.random().toString(),
        role: "assistant",
        text: `Pipeline Orchestration Error: ${err.message || "The multi-agent server did not reply correctly."}`,
        timestamp: new Date().toISOString()
      };
      setChatHistory((prev) => [...prev, failMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Handle direct manual terminal execution
  const handleExecuteCustomSql = async (sql: string): Promise<any[] | string> => {
    try {
      const res = await fetch("/api/sql-execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sql,
          schemaId: activeSchemaId,
          userRole
        })
      });

      const data = await res.json();
      if (!res.ok) {
        return data.error || "An execution compilation error occurred.";
      }
      return data.data;
    } catch (err: any) {
      return err.message || "Network execution error.";
    }
  };

  const clearSessionMemory = () => {
    setChatHistory([]);
    setPipelineResult(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500/20 selection:text-emerald-400">
      
      {/* Top Corporate Branding & Policy Rail */}
      <header className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between sticky top-0 z-40 shadow-md">
        
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Layers className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-base tracking-tight text-slate-50">Enterprise AI SQL Studio</h1>
              <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-bold text-emerald-400 font-mono tracking-wider">
                MULTI-AGENT CORES ACTIVE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans tracking-normal mt-0.5">
              Production-grade Text-to-SQL compiler with self-healing RAG orchestration & security sandboxes
            </p>
          </div>
        </div>

        {/* Global Configuration Controls (Dialect and Role Clearance) */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          
          {/* Dialect translation control */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 gap-1.5">
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Dialect:</span>
            <select
              value={dialect}
              onChange={(e) => setDialect(e.target.value)}
              className="bg-transparent border-none text-[11px] font-semibold text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="SQLite">SQLite Sandbox</option>
              <option value="PostgreSQL">PostgreSQL Server</option>
              <option value="MySQL">MySQL Server</option>
              <option value="SQL Server">Microsoft SQL Server</option>
            </select>
          </div>

          {/* User access governance role clearance control */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Role Clearance:</span>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              className="bg-transparent border-none text-[11px] font-semibold text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="Analyst">Analyst (Read-Only)</option>
              <option value="Data Engineer">Data Engineer (Restricted)</option>
              <option value="DB Admin">Database Administrator</option>
            </select>
          </div>

        </div>
      </header>

      {/* Main split dashboard view */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Visual Database Catalog & ER Mappers (Column size: 3.5 / 12) */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col h-[calc(100vh-135px)] min-h-[500px]">
          {activeSchema ? (
            <SchemaExplorer
              activeSchema={activeSchema}
              schemas={schemas}
              onSchemaChange={(id) => setActiveSchemaId(id)}
            />
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center h-full animate-pulse">
              <Database className="w-8 h-8 text-slate-750 mb-3" />
              <div className="h-4 bg-slate-800 rounded-md w-1/2 mb-2" />
              <div className="h-3 bg-slate-850 rounded-md w-3/4" />
            </div>
          )}
        </div>

        {/* Right Column: AI Query Composer, Conversational Chats, Results & Visual Workflow Steppers (Column size: 8 / 12) */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6 h-[calc(100vh-135px)] overflow-y-auto pr-1 custom-scrollbar">
          
          {/* Section A: Multi-Agent Query Input area */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 font-mono">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Describe your query in natural business English</span>
              </div>
              <span className="text-[10px] text-slate-500 font-sans">
                Press enter to compile and execute
              </span>
            </div>

            {/* Input Composer text field */}
            <div className="relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden focus-within:border-emerald-500 transition-all flex items-center pr-2">
              <textarea
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitQuery();
                  }
                }}
                rows={1}
                placeholder={`Ask anything about "${activeSchema?.name || 'the schema'}". E.g. ${suggestedPrompts[0]?.text || 'Query records'}`}
                className="w-full bg-transparent p-4 text-sm font-sans focus:outline-none resize-none placeholder-slate-500 leading-relaxed pr-12 text-slate-100"
              />
              <button
                onClick={() => handleSubmitQuery()}
                disabled={isLoading || !promptInput.trim()}
                className="w-10 h-10 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 text-slate-950 disabled:text-slate-600 flex items-center justify-center transition-all shadow-md shadow-emerald-500/10 cursor-pointer flex-shrink-0"
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Suggested Prompts Actions Widgets */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                Suggested complex queries for {activeSchema?.name}:
              </span>
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSubmitQuery(sug.text)}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 hover:border-slate-700 disabled:opacity-50 border border-slate-800 rounded-xl text-[11px] text-slate-300 text-left transition-all flex items-center gap-1.5 cursor-pointer max-w-full"
                    title={sug.description}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      sug.difficulty === "Easy" ? "bg-emerald-400" : sug.difficulty === "Medium" ? "bg-yellow-400" : "bg-rose-400"
                    }`} />
                    <span className="truncate">{sug.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section B: Errors container if any */}
          {serverError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-start gap-3 text-xs leading-normal font-mono animate-fade-in">
              <Trash2 className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-200 block mb-0.5">Pipeline System Warning</span>
                {serverError}
              </div>
            </div>
          )}

          {/* Section C: Split workspace logs and charts if pipeline result is loaded */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch flex-1">
            
            {/* Left panel: Interactive results sheet & SQL sandboxes (Column size: 7 / 12) */}
            <div className="xl:col-span-7 flex flex-col h-full min-h-[480px]">
              {pipelineResult ? (
                <ResultsDisplay
                  pipelineResult={pipelineResult}
                  schemaId={activeSchemaId}
                  userRole={userRole}
                  onExecuteCustomSql={handleExecuteCustomSql}
                />
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[480px]">
                  <Database className="w-12 h-12 text-slate-750 mb-4 stroke-1 animate-pulse" />
                  <p className="font-semibold text-slate-300 text-xs uppercase tracking-wider">
                    Interactive Workspace Ready
                  </p>
                  <p className="text-[11px] text-slate-500 mt-2 max-w-xs leading-relaxed">
                    Once compiled, the resulting SQL execution output, interactive data charts, and terminal sandbox console will reside here.
                  </p>
                </div>
              )}
            </div>

            {/* Right panel: Multi-agent visual steppers & corrections logs (Column size: 5 / 12) */}
            <div className="xl:col-span-5 flex flex-col h-full min-h-[480px]">
              <AgentWorkflow
                pipelineResult={pipelineResult}
                isLoading={isLoading}
              />
            </div>

          </div>

          {/* Section D: Follow-up Analytics chat memory loop (Visible at bottom when chats exist) */}
          {chatHistory.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-200 font-mono flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-emerald-400" />
                  Conversational analytics session thread
                </span>
                <button
                  onClick={clearSessionMemory}
                  className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-[10px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-all font-mono cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Reset Session
                </button>
              </div>

              <div className="max-h-[180px] overflow-y-auto space-y-3 pr-2 custom-scrollbar text-xs leading-relaxed">
                {chatHistory.map((chat) => (
                  <div key={chat.id} className={`flex gap-3 items-start p-2.5 rounded-xl ${
                    chat.role === "user" ? "bg-slate-950/40" : "bg-slate-950/10 border border-slate-850"
                  }`}>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 font-mono font-bold text-[10px] ${
                      chat.role === "user" ? "bg-slate-800 text-slate-300" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}>
                      {chat.role === "user" ? "U" : "AI"}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[11px] text-slate-200">
                          {chat.role === "user" ? "You" : "Studio Explainer Agent"}
                        </span>
                        <span className="text-[9px] text-slate-500">{new Date(chat.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {chat.text}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
