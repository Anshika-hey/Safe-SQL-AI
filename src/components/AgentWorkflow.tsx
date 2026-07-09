import React, { useState } from "react";
import { 
  Bot, ShieldCheck, Activity, Settings, Cpu, ChevronRight, Zap, 
  HelpCircle, AlertTriangle, CheckCircle, Flame, Server, Code, FileText
} from "lucide-react";
import { PipelineResult, AgentLog } from "../types.js";

interface AgentWorkflowProps {
  pipelineResult: PipelineResult | null;
  isLoading: boolean;
}

export default function AgentWorkflow({ pipelineResult, isLoading }: AgentWorkflowProps) {
  const [selectedLog, setSelectedLog] = useState<AgentLog | null>(null);

  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center h-full min-h-[400px]">
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-slate-800 border-t-emerald-500 rounded-full animate-spin" />
          <Bot className="w-6 h-6 text-emerald-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <p className="font-semibold text-slate-100 text-sm tracking-wide">Multi-Agent Engine Engaged</p>
        <p className="text-xs text-slate-400 mt-2 text-center max-w-sm leading-relaxed">
          Orchestrating specialized agents: routing database, generating dialect queries, validating security guidelines, compiling in-memory, and testing query optimizations...
        </p>
        
        {/* Animated timeline skeleton */}
        <div className="mt-8 space-y-3 w-full max-w-md">
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-6 h-6 rounded-full bg-slate-800" />
            <div className="h-3 bg-slate-800 rounded-md w-1/3" />
            <div className="h-3 bg-slate-850 rounded-md w-1/2 ml-auto" />
          </div>
          <div className="flex items-center gap-3 animate-pulse delay-100">
            <div className="w-6 h-6 rounded-full bg-slate-800" />
            <div className="h-3 bg-slate-800 rounded-md w-1/2" />
            <div className="h-3 bg-slate-850 rounded-md w-1/4 ml-auto" />
          </div>
          <div className="flex items-center gap-3 animate-pulse delay-200">
            <div className="w-6 h-6 rounded-full bg-slate-800" />
            <div className="h-3 bg-slate-850 rounded-md w-2/3" />
            <div className="h-3 bg-slate-800 rounded-md w-1/3 ml-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (!pipelineResult) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
        <Bot className="w-12 h-12 text-slate-600 mb-4 animate-bounce" />
        <p className="font-semibold text-slate-200 text-sm tracking-wider uppercase">Explainable Multi-Agent Board</p>
        <p className="text-xs text-slate-500 mt-2 max-w-sm leading-relaxed">
          Submit a natural language analytic question to observe real-time orchestration logs, security guardrails, cost estimations, and self-repairing compiler operations.
        </p>
      </div>
    );
  }

  const { logs, wasHealed, healingAttempts, confidenceScore } = pipelineResult;

  // Group logs by Agent to map icons
  const getAgentIcon = (name: string, status: string) => {
    if (status === "error") return <AlertTriangle className="w-4 h-4 text-rose-400" />;
    if (status === "corrected") return <Flame className="w-4 h-4 text-amber-400 animate-pulse" />;
    
    switch (name) {
      case "System Router":
        return <Server className="w-4 h-4 text-blue-400" />;
      case "Generator Agent":
        return <Cpu className="w-4 h-4 text-purple-400" />;
      case "Guardian Agent":
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case "Healer Agent":
        return <Activity className="w-4 h-4 text-cyan-400" />;
      case "Optimizer Agent":
        return <Settings className="w-4 h-4 text-amber-400" />;
      case "Explainer Agent":
        return <Bot className="w-4 h-4 text-pink-400" />;
      default:
        return <Bot className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "success":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "warning":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "corrected":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse";
      case "error":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default:
        return "bg-slate-800 text-slate-400 border-transparent";
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-full shadow-xl overflow-hidden">
      {/* Top Header */}
      <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-emerald-400" />
          <h3 className="font-semibold text-slate-100 text-xs uppercase tracking-wider">
            AI Multi-Agent Timeline
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-mono">
            <span className="text-slate-500">Confidence:</span>
            <span className={confidenceScore > 0.8 ? "text-emerald-400 font-semibold" : "text-yellow-400 font-semibold"}>
              {Math.round(confidenceScore * 100)}%
            </span>
          </div>

          {wasHealed && (
            <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[10px] rounded-full font-bold flex items-center gap-1 animate-pulse">
              ⚡ HEALED
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {/* Visual Stepper / Pipeline logs */}
        <div className="relative border-l border-slate-800/80 ml-3.5 pl-5 space-y-4 py-1">
          {logs.map((log, idx) => {
            const isSelected = selectedLog?.timestamp === log.timestamp && selectedLog?.agentName === log.agentName;
            
            return (
              <div 
                key={idx} 
                className={`relative group cursor-pointer transition-all ${
                  isSelected ? "scale-[1.01]" : ""
                }`}
                onClick={() => setSelectedLog(isSelected ? null : log)}
              >
                {/* Visual Connector Dot */}
                <span className={`absolute -left-[27px] top-1.5 w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                  log.status === "error" 
                    ? "bg-slate-900 border-rose-500" 
                    : log.status === "corrected" 
                    ? "bg-slate-900 border-amber-400 animate-pulse" 
                    : "bg-slate-900 border-slate-700 group-hover:border-emerald-500"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    log.status === "error" 
                      ? "bg-rose-500" 
                      : log.status === "corrected" 
                      ? "bg-amber-400" 
                      : "bg-emerald-400"
                  }`} />
                </span>

                <div className={`p-3 bg-slate-950/40 border hover:border-slate-700 rounded-xl transition-all ${
                  isSelected ? "border-emerald-500 bg-slate-950" : "border-slate-800/70"
                }`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-200 font-mono flex items-center gap-1.5">
                      {getAgentIcon(log.agentName, log.status)}
                      {log.agentName}
                    </span>
                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${getStatusBadgeClass(log.status)}`}>
                      {log.status === "corrected" ? "HEALED" : log.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 mt-1 leading-normal font-sans">
                    {log.message}
                  </p>

                  <div className="flex items-center justify-between text-[9px] text-slate-500 mt-2 font-mono">
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span className="text-emerald-500/80 group-hover:text-emerald-400 flex items-center gap-0.5">
                      {isSelected ? "Collapse Details" : "Inspect Payload →"}
                    </span>
                  </div>

                  {/* Expandable Details Container */}
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-slate-800/60 text-[10px] text-slate-400 space-y-2 font-mono overflow-x-auto bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                      {log.details ? (
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                            <Code className="w-3.5 h-3.5 text-blue-400" /> Inspected Payload Logs:
                          </p>
                          <pre className="text-[9px] leading-relaxed text-slate-300 max-h-[150px] overflow-y-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </div>
                      ) : (
                        <p className="text-slate-500 italic">No additional metadata parameters recorded for this event.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Healing Event Alert */}
        {wasHealed && (
          <div className="p-3.5 bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/20 rounded-xl flex gap-3 items-start animate-fade-in mt-4">
            <Flame className="w-5 h-5 text-amber-400 flex-shrink-0 animate-bounce mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-400">Self-Healing Execution Succeeded</h4>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                An initial query generated by the primary model failed sandboxed execution (total failures: {healingAttempts}). The **Healer Agent** analyzed the compiler error, executed a correction repair query against database metadata, and healed the query without user intervention.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* governance / safety audit overview */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-400 flex items-center gap-2 font-mono">
        <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <span className="truncate">Guardrail: Isolation secure. Active Role: {pipelineResult.security.userRole}</span>
        <span className="ml-auto text-slate-600">v1.1</span>
      </div>
    </div>
  );
}
