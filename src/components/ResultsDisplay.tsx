import React, { useState, useEffect } from "react";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer, CartesianGrid 
} from "recharts";
import { 
  Play, ShieldAlert, Download, Code, CheckCircle, AlertCircle, Sparkles, 
  Terminal, RefreshCw, BarChart2, Table, Eye, Search, Settings, HelpCircle, Copy
} from "lucide-react";
import { PipelineResult } from "../types.js";

interface ResultsDisplayProps {
  pipelineResult: PipelineResult;
  schemaId: string;
  userRole: string;
  onExecuteCustomSql: (sql: string) => Promise<any[] | string>;
}

export default function ResultsDisplay({
  pipelineResult,
  schemaId,
  userRole,
  onExecuteCustomSql,
}: ResultsDisplayProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "table" | "terminal" | "tuning">("dashboard");
  const [terminalSql, setTerminalSql] = useState<string>(pipelineResult.finalSql);
  const [terminalResults, setTerminalResults] = useState<any[] | null>(null);
  const [terminalError, setTerminalError] = useState<string | null>(null);
  const [isExecutingTerminal, setIsExecutingTerminal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync terminal input when a new pipeline query completes
  useEffect(() => {
    setTerminalSql(pipelineResult.finalSql);
    setTerminalResults(null);
    setTerminalError(null);
  }, [pipelineResult]);

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(terminalSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunTerminalSql = async () => {
    setIsExecutingTerminal(true);
    setTerminalError(null);
    setTerminalResults(null);
    try {
      const res = await onExecuteCustomSql(terminalSql);
      if (typeof res === "string") {
        setTerminalError(res);
      } else {
        setTerminalResults(res);
      }
    } catch (err: any) {
      setTerminalError(err.message || "Failed to execute custom SQL.");
    } finally {
      setIsExecutingTerminal(false);
    }
  };

  // Safe property extraction helper to prevent Recharts crashes from mismatched case keys
  const getChartDataAndKeys = () => {
    const rawData = pipelineResult.executedResults || [];
    if (rawData.length === 0) return { data: [], xKey: "", yKey: "" };

    const sampleRow = rawData[0];
    const rowKeys = Object.keys(sampleRow);
    
    // Grab keys suggested by agent
    let suggestX = pipelineResult.visualization.xAxisKey || "";
    let suggestY = pipelineResult.visualization.yAxisKey || "";

    // Find actual matching case-insensitive keys in the row
    let xKey = rowKeys.find(k => k.toLowerCase() === suggestX.toLowerCase()) || rowKeys[0] || "";
    let yKey = rowKeys.find(k => k.toLowerCase() === suggestY.toLowerCase()) || rowKeys[1] || "";

    // If yKey is same as xKey, try to find another numeric key
    if (xKey === yKey && rowKeys.length > 1) {
      yKey = rowKeys.find(k => k !== xKey && typeof sampleRow[k] === "number") || rowKeys[1];
    }

    // Process data to guarantee numerical values on yAxis
    const cleanedData = rawData.map(row => {
      const copy = { ...row };
      if (yKey && typeof copy[yKey] === "string") {
        const parsed = parseFloat(copy[yKey]);
        if (!isNaN(parsed)) {
          copy[yKey] = parsed;
        }
      }
      return copy;
    });

    return { data: cleanedData, xKey, yKey };
  };

  const { data: chartData, xKey, yKey } = getChartDataAndKeys();

  // Export dataset to downloadable CSV format
  const exportToCsv = () => {
    const rawData = pipelineResult.executedResults || [];
    if (rawData.length === 0) return;
    
    const headers = Object.keys(rawData[0]).join(",");
    const rows = rawData.map(row => 
      Object.values(row)
        .map(v => typeof v === "string" ? `"${v.replace(/"/g, '""')}"` : v)
        .join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sql_query_export_${schemaId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];

  // Render Dynamic Charts
  const renderChart = () => {
    if (!pipelineResult.executedResults || pipelineResult.executedResults.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center h-[280px]">
          <AlertCircle className="w-10 h-10 text-slate-600 mb-2" />
          <p className="text-xs text-slate-400 font-semibold font-mono">Empty Result Set</p>
          <p className="text-[10px] text-slate-500 mt-1 max-w-xs">
            The SQL executed successfully but returned zero active records matching the query conditions.
          </p>
        </div>
      );
    }

    const type = pipelineResult.visualization.chartType;

    if (type === "metric") {
      // Aggregate metric scorecard card
      const sampleRow = pipelineResult.executedResults[0];
      const metricKey = Object.keys(sampleRow)[0];
      const metricVal = sampleRow[metricKey];
      const displayVal = typeof metricVal === "number" 
        ? metricVal % 1 === 0 ? metricVal.toLocaleString() : metricVal.toFixed(2)
        : String(metricVal);

      return (
        <div className="flex flex-col items-center justify-center p-6 bg-slate-950/40 border border-slate-800 rounded-2xl h-[280px] max-w-md mx-auto shadow-inner">
          <Sparkles className="w-6 h-6 text-emerald-400 animate-pulse mb-3" />
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono text-center">
            {metricKey.replace(/_/g, " ")}
          </span>
          <span className="text-4xl font-extrabold text-white mt-2 font-sans tracking-tight">
            {displayVal}
          </span>
          <span className="text-[9px] text-slate-500 font-mono mt-3 text-center leading-normal">
            Single consolidated KPI scorecard aggregate value.
          </span>
        </div>
      );
    }

    if (type === "bar" && xKey && yKey) {
      return (
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey={xKey} stroke="#94a3b8" fontSize={9} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
              <ChartTooltip 
                contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }}
                labelStyle={{ color: "#94a3b8", fontSize: "10px", fontWeight: "bold" }}
                itemStyle={{ color: "#10b981", fontSize: "11px", fontFamily: "monospace" }}
              />
              <Bar dataKey={yKey} fill="#10b981" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (type === "line" && xKey && yKey) {
      return (
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey={xKey} stroke="#94a3b8" fontSize={9} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
              <ChartTooltip 
                contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }}
                labelStyle={{ color: "#94a3b8", fontSize: "10px", fontWeight: "bold" }}
                itemStyle={{ color: "#3b82f6", fontSize: "11px", fontFamily: "monospace" }}
              />
              <Line type="monotone" dataKey={yKey} stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: "#3b82f6", r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (type === "pie" && xKey && yKey) {
      return (
        <div className="h-[280px] w-full flex items-center justify-center">
          <div className="w-[60%] h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey={yKey}
                  nameKey={xKey}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip
                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }}
                  itemStyle={{ color: "#cbd5e1", fontSize: "10px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Pie Legends list */}
          <div className="w-[40%] flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-2">
            {chartData.slice(0, 5).map((row, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-[9px] font-mono truncate">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-slate-400 truncate">{String(row[xKey])}:</span>
                <span className="text-slate-200 font-bold ml-auto">{Number(row[yKey]).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Default Reports / list grid
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-[280px]">
        <Table className="w-10 h-10 text-emerald-500/80 mb-2" />
        <p className="text-xs text-slate-300 font-semibold font-mono">Detailed Grid Layout Best Fit</p>
        <p className="text-[10px] text-slate-500 mt-1 max-w-sm leading-relaxed">
          The Explainer Agent suggests rendering this high-density relational dataset in the **Data Spreadsheet Tab** for maximum analytical transparency.
        </p>
        <button
          onClick={() => setActiveTab("table")}
          className="mt-4 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-emerald-400 font-bold font-mono border border-slate-750 rounded-lg flex items-center gap-1 transition-all"
        >
          <Table className="w-3.5 h-3.5" /> View Spreadsheet Grid
        </button>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full min-h-[420px]">
      {/* Visual Navigation tabs */}
      <div className="flex bg-slate-950 border-b border-slate-800 text-xs select-none">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex-1 py-3 px-2 text-center font-semibold border-b-2 flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "dashboard"
              ? "text-emerald-400 border-emerald-500 bg-slate-900/40"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" /> Analytics Dashboard
        </button>
        <button
          onClick={() => setActiveTab("table")}
          className={`flex-1 py-3 px-2 text-center font-semibold border-b-2 flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "table"
              ? "text-emerald-400 border-emerald-500 bg-slate-900/40"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          <Table className="w-3.5 h-3.5" /> Data Table
        </button>
        <button
          onClick={() => setActiveTab("terminal")}
          className={`flex-1 py-3 px-2 text-center font-semibold border-b-2 flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "terminal"
              ? "text-emerald-400 border-emerald-500 bg-slate-900/40"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          <Terminal className="w-3.5 h-3.5" /> SQL Sandbox
        </button>
        <button
          onClick={() => setActiveTab("tuning")}
          className={`flex-1 py-3 px-2 text-center font-semibold border-b-2 flex items-center justify-center gap-1.5 transition-all ${
            activeTab === "tuning"
              ? "text-emerald-400 border-emerald-500 bg-slate-900/40"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          <Settings className="w-3.5 h-3.5" /> Explain & Optimize
        </button>
      </div>

      {/* Main Results Workspace Container */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-900/40">
        
        {/* TAB 1: DASHBOARD VISUALIZATIONS */}
        {activeTab === "dashboard" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  {pipelineResult.visualization.title}
                </h4>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Dynamic visual layout recommended by the Explainer Agent.
                </p>
              </div>
              <span className="text-[9px] font-mono uppercase bg-slate-950 px-2 py-0.5 border border-slate-800 rounded text-slate-400 font-bold">
                {pipelineResult.visualization.chartType} Layout
              </span>
            </div>

            <div className="p-4 bg-slate-950/30 border border-slate-800/80 rounded-2xl shadow-inner">
              {renderChart()}
            </div>

            <div className="p-3 bg-slate-900/80 border border-slate-850 rounded-xl text-[10.5px] text-slate-400 leading-normal font-sans">
              <span className="font-bold text-slate-300 block mb-1">Business Context Summary:</span>
              {pipelineResult.explanation.businessSummary}
            </div>
          </div>
        )}

        {/* TAB 2: EXCEL SPREADSHEET */}
        {activeTab === "table" && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <span>Result:</span>
                <span className="text-emerald-400 font-bold">
                  {pipelineResult.executedResults?.length || 0} records fetched
                </span>
              </div>
              
              {pipelineResult.executedResults && pipelineResult.executedResults.length > 0 && (
                <button
                  onClick={exportToCsv}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700/60 rounded-lg text-[9px] font-bold text-slate-300 flex items-center gap-1 transition-all"
                >
                  <Download className="w-3 h-3 text-emerald-400" /> Export CSV
                </button>
              )}
            </div>

            {!pipelineResult.executedResults || pipelineResult.executedResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-slate-950/20 border border-slate-850 rounded-xl text-center h-[220px]">
                <Table className="w-8 h-8 text-slate-650 mb-2" />
                <p className="text-xs text-slate-400 font-mono">No data returned</p>
              </div>
            ) : (
              <div className="border border-slate-800 rounded-xl overflow-auto bg-slate-950 shadow-inner max-h-[310px]">
                <table className="w-full border-collapse text-[10.5px] font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/70 text-slate-300 text-left">
                      <th className="p-2.5 font-bold text-slate-500 w-8 text-center bg-slate-950">#</th>
                      {Object.keys(pipelineResult.executedResults[0]).map((col) => (
                        <th key={col} className="p-2.5 font-bold text-slate-200">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-400">
                    {pipelineResult.executedResults.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="p-2.5 text-center text-slate-600 border-r border-slate-850 bg-slate-950/50">{idx + 1}</td>
                        {Object.keys(row).map((col) => (
                          <td key={col} className="p-2.5 whitespace-nowrap">
                            {row[col] === null || row[col] === undefined ? (
                              <span className="text-slate-600 font-sans italic">NULL</span>
                            ) : typeof row[col] === "number" ? (
                              <span className="text-yellow-400 font-semibold">{row[col].toLocaleString()}</span>
                            ) : String(row[col]).startsWith("2025") || String(row[col]).startsWith("2026") ? (
                              <span className="text-purple-400 font-semibold">{row[col]}</span>
                            ) : (
                              <span className="text-slate-300">"{row[col]}"</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DEVELOPER SQL SANDBOX & TERMINAL */}
        {activeTab === "terminal" && (
          <div className="space-y-4 animate-fade-in h-full flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-100">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Interactive SQLite compiler terminal</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={copySqlToClipboard}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-750 text-[10px] text-slate-300 border border-slate-700 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> {copied ? "Copied" : "Copy SQL"}
                </button>
                <button
                  onClick={handleRunTerminalSql}
                  disabled={isExecutingTerminal || !terminalSql.trim()}
                  className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 text-[10px] font-bold text-slate-950 disabled:text-slate-500 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                >
                  <Play className="w-3 h-3 fill-current" /> Run Statement
                </button>
              </div>
            </div>

            {/* Custom interactive text area */}
            <div className="relative border border-slate-800 rounded-xl overflow-hidden bg-slate-950 font-mono shadow-inner">
              <div className="p-2 bg-slate-900 border-b border-slate-800 flex items-center text-[10px] text-slate-400 gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="ml-2 font-mono">SQLite connection active</span>
              </div>
              <textarea
                value={terminalSql}
                onChange={(e) => setTerminalSql(e.target.value)}
                rows={5}
                className="w-full p-4 bg-slate-950 text-emerald-400 font-mono text-xs focus:outline-none resize-none leading-relaxed"
                placeholder="SELECT * FROM table..."
              />
            </div>

            {/* Custom Execution Output Display */}
            <div className="flex-1 mt-1">
              {isExecutingTerminal && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2 text-xs font-mono text-slate-400">
                  <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                  Compiling statement and evaluating permissions against role '{userRole}'...
                </div>
              )}

              {terminalError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex gap-3 text-[11px] font-mono leading-normal">
                  <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold uppercase text-[10px] block mb-1">Compiler Exception Flagged:</span>
                    {terminalError}
                  </div>
                </div>
              )}

              {terminalResults && (
                <div className="space-y-2">
                  <div className="flex items-center text-[10px] text-emerald-400 font-mono">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                    <span>Statement returned {terminalResults.length} records successfully.</span>
                  </div>

                  {terminalResults.length > 0 ? (
                    <div className="border border-slate-800 rounded-xl overflow-auto bg-slate-950 max-h-[180px]">
                      <table className="w-full border-collapse text-[10px] font-mono">
                        <thead>
                          <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-300 text-left">
                            {Object.keys(terminalResults[0]).map((col) => (
                              <th key={col} className="p-2">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850 text-slate-400">
                          {terminalResults.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/30">
                              {Object.keys(row).map((col) => (
                                <td key={col} className="p-2 whitespace-nowrap">
                                  {row[col] === null ? "NULL" : String(row[col])}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl text-center text-xs text-slate-500 italic">
                      Query returned empty set.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: EXPLANABLE REASONING & COST TUNINGS */}
        {activeTab === "tuning" && (
          <div className="space-y-4 animate-fade-in text-xs leading-relaxed font-sans">
            {/* Step-by-Step Logic Translator */}
            <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5 font-mono">
                <Code className="w-4 h-4 text-emerald-400" />
                Query Mechanics Explanation
              </h4>
              <ul className="space-y-2 text-[11px] text-slate-300 pl-4 list-decimal marker:text-emerald-400">
                {pipelineResult.explanation.steps.map((step, idx) => (
                  <li key={idx} className="pl-1">
                    {step}
                  </li>
                ))}
              </ul>
              <div className="mt-3 pt-3 border-t border-slate-800/60 text-[10px] text-slate-400 font-mono leading-relaxed">
                <span className="font-bold text-slate-300">Technical details:</span> {pipelineResult.explanation.technicalDetails}
              </div>
            </div>

            {/* Performance Optimizer Index Tuning Suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Cost and rewriting */}
              <div className="p-3.5 bg-slate-950/20 border border-slate-800 rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">
                  Execution Cost Model
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    pipelineResult.optimization.estimatedCost === "Low"
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                      : pipelineResult.optimization.estimatedCost === "Medium"
                      ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20"
                      : "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                  }`}>
                    {pipelineResult.optimization.estimatedCost} Cost Plan
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">Computed based on JOIN structures</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-2 space-y-1 pl-3 list-disc">
                  {pipelineResult.optimization.improvements.map((imp, idx) => (
                    <div key={idx} className="flex gap-1.5 items-start mt-1">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{imp}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Production Indexes */}
              <div className="p-3.5 bg-slate-950/20 border border-slate-800 rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">
                  Production Indexes Required
                </span>
                <p className="text-[9px] text-slate-500 font-mono leading-snug">
                  Apply these index files to production to optimize filters and JOIN searches:
                </p>
                <div className="space-y-1.5 mt-2">
                  {pipelineResult.optimization.indexRecommendations.length > 0 ? (
                    pipelineResult.optimization.indexRecommendations.map((idxRec, idx) => (
                      <code key={idx} className="block p-1.5 bg-slate-950 text-[9.5px] font-mono text-emerald-300 border border-slate-850 rounded">
                        {idxRec}
                      </code>
                    ))
                  ) : (
                    <span className="text-slate-500 italic text-[10px] block mt-1">No indices suggested for simple queries.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
