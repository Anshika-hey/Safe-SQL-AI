import React, { useState } from "react";
import { Database, Table as TableIcon, Key, Link as LinkIcon, Eye, Tag, HelpCircle, ArrowRight } from "lucide-react";
import { DatabaseSchema, SchemaTable, SchemaColumn } from "../types.js";

interface SchemaExplorerProps {
  activeSchema: DatabaseSchema;
  schemas: DatabaseSchema[];
  onSchemaChange: (schemaId: string) => void;
}

export default function SchemaExplorer({
  activeSchema,
  schemas,
  onSchemaChange,
}: SchemaExplorerProps) {
  const [selectedTable, setSelectedTable] = useState<SchemaTable>(activeSchema.tables[0]);
  const [activeTab, setActiveTab] = useState<"structure" | "data">("structure");

  // Keep selected table updated if active schema changes
  React.useEffect(() => {
    const tableExists = activeSchema.tables.find((t) => t.name === selectedTable?.name);
    if (!tableExists) {
      setSelectedTable(activeSchema.tables[0]);
    } else {
      const updatedTable = activeSchema.tables.find((t) => t.name === selectedTable.name);
      if (updatedTable) setSelectedTable(updatedTable);
    }
  }, [activeSchema]);

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Schema Header Selector */}
      <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-400" />
          <h2 className="font-semibold text-slate-100 text-sm tracking-wide uppercase">Database catalog</h2>
        </div>
        
        <select
          value={activeSchema.id}
          onChange={(e) => onSchemaChange(e.target.value)}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
        >
          {schemas.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        
        <p className="text-[11px] text-slate-400 leading-relaxed font-sans mt-1">
          {activeSchema.description}
        </p>
      </div>

      {/* Visual ER & Relationship Map Card */}
      <div className="p-4 bg-slate-950/20 border-b border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1">
            <LinkIcon className="w-3.5 h-3.5 text-blue-400" /> Visual ER Diagram
          </span>
          <span className="text-[9px] text-slate-500 bg-slate-800/40 px-1.5 py-0.5 rounded-full font-mono">
            Relationships mapped
          </span>
        </div>

        {/* Small Schematic Nodes with lines */}
        <div className="grid grid-cols-2 gap-2">
          {activeSchema.tables.map((table) => {
            const isSelected = selectedTable.name === table.name;
            const hasFks = table.columns.some((c) => c.foreignKey);
            
            return (
              <button
                key={table.name}
                onClick={() => setSelectedTable(table)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "bg-slate-800/80 border-emerald-500 shadow-lg shadow-emerald-500/5 scale-[1.02]"
                    : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/30"
                }`}
              >
                <div className="flex items-center gap-1.5 justify-between">
                  <div className="flex items-center gap-1 text-slate-200">
                    <TableIcon className={`w-3.5 h-3.5 ${isSelected ? "text-emerald-400" : "text-slate-400"}`} />
                    <span className="text-xs font-semibold font-mono truncate">{table.name}</span>
                  </div>
                  {hasFks && (
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" title="Has foreign keys" />
                  )}
                </div>

                <div className="text-[9px] text-slate-400 mt-1 truncate">
                  {table.columns.length} columns
                </div>

                {/* Key Relations List Preview */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {table.columns.map((col) => {
                    if (col.isPrimaryKey) {
                      return (
                        <span key={col.name} className="px-1 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-[8px] font-mono rounded text-yellow-400 flex items-center gap-0.5">
                          <Key className="w-2 h-2" /> {col.name}
                        </span>
                      );
                    }
                    if (col.foreignKey) {
                      return (
                        <span key={col.name} className="px-1 py-0.5 bg-blue-500/10 border border-blue-500/20 text-[8px] font-mono rounded text-blue-400 flex items-center gap-0.5" title={`Foreign key links to ${col.foreignKey.table}.${col.foreignKey.column}`}>
                          <LinkIcon className="w-2 h-2" /> {col.name}
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic ER Relation Connection details */}
        {selectedTable.columns.some(c => c.foreignKey) && (
          <div className="mt-3 p-2 bg-slate-900/80 border border-slate-800/80 rounded-lg text-[10px] text-blue-300 font-mono flex items-center justify-between gap-2">
            <span className="flex items-center gap-1">
              <LinkIcon className="w-3 h-3 text-blue-400" /> Relations:
            </span>
            <div className="flex flex-col items-end gap-1 text-right truncate">
              {selectedTable.columns.map(c => {
                if (c.foreignKey) {
                  return (
                    <div key={c.name} className="flex items-center gap-1 font-mono">
                      <span>{selectedTable.name}.{c.name}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="text-emerald-400">{c.foreignKey.table}.{c.foreignKey.column}</span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}
      </div>

      {/* Table Structure / Sample Data Tabs */}
      <div className="flex bg-slate-950 border-b border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab("structure")}
          className={`flex-1 py-2.5 text-center font-medium border-b-2 transition-all ${
            activeTab === "structure"
              ? "text-emerald-400 border-emerald-500 bg-slate-900/40"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          Columns & Types
        </button>
        <button
          onClick={() => setActiveTab("data")}
          className={`flex-1 py-2.5 text-center font-medium border-b-2 transition-all ${
            activeTab === "data"
              ? "text-emerald-400 border-emerald-500 bg-slate-900/40"
              : "text-slate-400 border-transparent hover:text-slate-200"
          }`}
        >
          Sample records
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeTab === "structure" ? (
          <div className="space-y-3">
            <div className="pb-2 border-b border-slate-800/60">
              <h3 className="text-xs font-bold text-slate-200 font-mono flex items-center gap-1.5">
                <TableIcon className="w-3.5 h-3.5 text-slate-400" />
                {selectedTable.name}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                {selectedTable.description}
              </p>
            </div>

            <div className="space-y-2">
              {selectedTable.columns.map((col) => (
                <div
                  key={col.name}
                  className="p-2 bg-slate-900/40 hover:bg-slate-800/40 border border-slate-800/60 rounded-lg flex flex-col gap-1 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold font-mono text-slate-100 flex items-center gap-1">
                      {col.isPrimaryKey && (
                        <Key className="w-3 h-3 text-yellow-400" title="Primary Key" />
                      )}
                      {col.foreignKey && (
                        <LinkIcon className="w-3 h-3 text-blue-400" title={`Foreign Key: links to ${col.foreignKey.table}`} />
                      )}
                      {col.name}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 bg-slate-850 px-1.5 py-0.5 rounded-md border border-slate-800/55">
                      {col.type}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-sans leading-normal">
                    {col.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3 h-full flex flex-col">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Table preview: {selectedTable.name}</span>
              <span className="text-emerald-400 font-semibold">Active sandbox</span>
            </div>

            <div className="flex-1 border border-slate-800/80 rounded-xl overflow-auto bg-slate-950 max-h-[250px]">
              <table className="w-full border-collapse text-[10px] font-mono">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-300 text-left">
                    {selectedTable.columns.map((c) => (
                      <th key={c.name} className="p-2 font-semibold">
                        {c.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-400">
                  {activeSchema.seedSample[selectedTable.name]?.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/30">
                      {selectedTable.columns.map((c) => (
                        <td key={c.name} className="p-2 whitespace-nowrap">
                          {row[c.name] === null || row[c.name] === undefined ? (
                            <span className="text-slate-600 font-sans italic">NULL</span>
                          ) : typeof row[c.name] === "number" ? (
                            <span className="text-yellow-400">{row[c.name]}</span>
                          ) : String(row[c.name]).startsWith("2025") || String(row[c.name]).startsWith("2026") ? (
                            <span className="text-purple-400">{row[c.name]}</span>
                          ) : (
                            <span className="text-slate-300">"{row[c.name]}"</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-850 text-[10px] text-slate-400 flex gap-2 items-start mt-auto">
              <HelpCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-200">Sandbox DB Engaged</p>
                <p className="text-[9px] text-slate-500 mt-0.5 leading-snug">
                  Our live in-memory database engine is preloaded with seed data matching these sample schemas. Generated queries will run against this local dataset in real-time.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
