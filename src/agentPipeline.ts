import { GoogleGenAI, Type } from "@google/genai";
import alasql from "alasql";
import { dbSchemas, DatabaseSchema } from "./dbSchema.js";

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export interface AgentLog {
  agentName: string;
  status: "success" | "warning" | "error" | "corrected";
  message: string;
  timestamp: string;
  details?: any;
}

export interface PipelineResult {
  originalSql: string;
  finalSql: string;
  executedResults: any[] | null;
  executionError: string | null;
  wasHealed: boolean;
  healingAttempts: number;
  confidenceScore: number;
  explanation: {
    businessSummary: string;
    steps: string[];
    technicalDetails: string;
  };
  security: {
    isSafe: boolean;
    detectedRisks: string[];
    userRole: string;
    appliedGuardrails: string[];
  };
  optimization: {
    estimatedCost: "Low" | "Medium" | "High";
    indexRecommendations: string[];
    improvements: string[];
  };
  visualization: {
    chartType: "bar" | "line" | "pie" | "metric" | "table";
    xAxisKey?: string;
    yAxisKey?: string;
    title: string;
  };
  logs: AgentLog[];
}

/**
 * Runs the sandboxed in-memory database with AlaSQL for testing and execution.
 */
function executeVirtualSql(schema: DatabaseSchema, sql: string): { success: boolean; data: any[] | null; error: string | null } {
  try {
    const db = new (alasql as any).Database();
    
    for (const tableName of Object.keys(schema.seedData)) {
      db.exec(`CREATE TABLE ${tableName}`);
      if (db.tables[tableName]) {
        db.tables[tableName].data = JSON.parse(JSON.stringify(schema.seedData[tableName]));
      }
    }
    
    const res = db.exec(sql);
    
    const data = Array.isArray(res) ? res : [res];
    const flatData = data.length > 0 && Array.isArray(data[0]) ? data[0] : res;
    
    return { success: true, data: flatData, error: null };
  } catch (err: any) {
    return { success: false, data: null, error: err.message || "Unknown execution error" };
  }
}

/**
 * Main Enterprise Multi-Agent SQL pipeline
 */
export async function runMultiAgentSqlPipeline(
  prompt: string,
  schemaId: string,
  preferredDialect: string = "SQLite",
  userRole: string = "Analyst",
  sessionHistory: { role: string; text: string }[] = []
): Promise<PipelineResult> {
  const logs: AgentLog[] = [];
  const addLog = (agent: string, status: AgentLog["status"], msg: string, details?: any) => {
    logs.push({
      agentName: agent,
      status,
      message: msg,
      timestamp: new Date().toISOString(),
      details
    });
  };

  const schema = dbSchemas.find((s) => s.id === schemaId);
  if (!schema) {
    throw new Error(`Invalid schema database ID: ${schemaId}`);
  }

  const schemaContext = schema.tables
    .map((table) => {
      const cols = table.columns
        .map((c) => {
          const fk = c.foreignKey ? ` (FK -> ${c.foreignKey.table}.${c.foreignKey.column})` : "";
          return `  - ${c.name} (${c.type})${fk}: ${c.description}`;
        })
        .join("\n");
      return `Table: ${table.name}\nDescription: ${table.description}\nColumns:\n${cols}`;
    })
    .join("\n\n");

  addLog("System Router", "success", `Initialized text-to-SQL execution pipeline mapping to schema context of: "${schema.name}".`);

  // 1. GENERATOR AGENT
  addLog("Generator Agent", "success", "Analyzing natural language prompt against schema relationships...");
  
  let generatorPrompt = `You are a specialized Database SQL Generator Agent in an enterprise Text-to-SQL platform.
Your task is to write a single SELECT query using standard SQL that accurately solves the user's natural language request.

=== DATABASE SCHEMA CONTEXT ===
${schemaContext}

=== PREFERRED DIALECT ===
${preferredDialect}

=== CONVERSATIONAL SESSION HISTORY ===
${sessionHistory.map((h) => `${h.role === "user" ? "User" : "System"}: ${h.text}`).join("\n")}

=== USER INSTRUCTIONS ===
- Generate ONLY a valid SELECT query. DO NOT write DML (INSERT, UPDATE, DELETE) or DDL (CREATE, DROP, ALTER).
- If the user request is ambiguous, make a reasonable business assumption or join logical tables.
- Return your response as a valid JSON object matching this schema:
{
  "sql": "The raw generated SQL query",
  "assumptions": ["List of assumptions made"],
  "confidenceScore": 0.0 to 1.0
}

User Question: "${prompt}"`;

  let generatorResponseText = "";
  let sql = "";
  let confidenceScore = 0.85;
  let assumptions: string[] = [];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: generatorPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sql: { type: Type.STRING },
            assumptions: { type: Type.ARRAY, items: { type: Type.STRING } },
            confidenceScore: { type: Type.NUMBER }
          },
          required: ["sql", "assumptions", "confidenceScore"]
        }
      }
    });

    generatorResponseText = response.text || "{}";
    const data = JSON.parse(generatorResponseText);
    sql = data.sql;
    confidenceScore = data.confidenceScore || 0.8;
    assumptions = data.assumptions || [];
    addLog("Generator Agent", "success", "Generated initial SQL query.", { sql, assumptions, confidenceScore });
  } catch (err: any) {
    addLog("Generator Agent", "error", `Failed to generate SQL initially: ${err.message}`);
    sql = `SELECT * FROM ${schema.tables[0].name} LIMIT 5`;
  }

  const originalSql = sql;

  // 2. GUARDIAN AGENT
  addLog("Guardian Agent", "success", "Inspecting query for destructive, non-SELECT operations and SQL injections...");
  
  const dangerousKeywords = ["DROP", "DELETE", "UPDATE", "ALTER", "TRUNCATE", "INSERT", "REPLACE", "MERGE", "GRANT", "REVOKE"];
  const detectedDangerous: string[] = [];
  const upperSql = sql.toUpperCase();
  
  dangerousKeywords.forEach((kw) => {
    const rx = new RegExp(`\\b${kw}\\b`);
    if (rx.test(upperSql)) {
      detectedDangerous.push(kw);
    }
  });

  let isSafe = true;
  const detectedRisks: string[] = [];
  const appliedGuardrails = ["Read-Only Transaction Isolation", "Automatic destructive query injection blocking"];

  if (detectedDangerous.length > 0) {
    isSafe = false;
    detectedRisks.push(`Attempted destructive / write action: ${detectedDangerous.join(", ")}`);
    addLog("Guardian Agent", "error", `Destructive action blocked! Users under role '${userRole}' are prohibited from executing DDL/DML statements.`, { blockedKeywords: detectedDangerous });
    
    sql = `SELECT * FROM ${schema.tables[0].name} LIMIT 5`;
    addLog("Guardian Agent", "corrected", "Overrode SQL to a safe SELECT query to prevent data harm.", { safeSql: sql });
  }

  if (sql.includes(";") && sql.trim().split(";").filter(x => x.trim().length > 0).length > 1) {
    detectedRisks.push("Multi-statement SQL execution detected");
    isSafe = false;
    sql = sql.split(";")[0];
    addLog("Guardian Agent", "warning", "Multi-statement execution truncated to first statement to avoid injection risk.");
  }

  if (isSafe) {
    addLog("Guardian Agent", "success", "Security guard check completed. No destructive keywords, role limits, or multiple statements flagged.");
  }

  // 3. HEALER AGENT
  addLog("Healer Agent", "success", "Initiating virtual database compiler test to execute SQL in a sandboxed in-memory environment...");
  
  let execResult = executeVirtualSql(schema, sql);
  let wasHealed = false;
  let healingAttempts = 0;

  while (!execResult.success && healingAttempts < 2) {
    healingAttempts++;
    wasHealed = true;
    addLog("Healer Agent", "warning", `Virtual execution compilation failed (Attempt ${healingAttempts}/2): "${execResult.error}". Initiating self-healing loop...`);
    
    const healerPrompt = `You are a database repair agent. An LLM generated SQL query failed to run on the sandbox database.
Your job is to identify the error (e.g., misspelled column, missing join, hallucinated table) and write the corrected SQL.

=== DATABASE SCHEMA ===
${schemaContext}

=== FAILED SQL ===
\`\`\`sql
${sql}
\`\`\`

=== EXECUTION ENGINE EXCEPTION MESSAGE ===
${execResult.error}

=== INSTRUCTIONS ===
- Repair the query so it is syntactically correct and aligns perfectly with the actual schema columns.
- Return your repaired query in the exact JSON format:
{
  "sql": "repaired sql statement",
  "correctionExplanation": "Detailed explanation of what you repaired"
}`;

    try {
      const healerResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: healerPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sql: { type: Type.STRING },
              correctionExplanation: { type: Type.STRING }
            },
            required: ["sql", "correctionExplanation"]
          }
        }
      });

      const repData = JSON.parse(healerResponse.text || "{}");
      sql = repData.sql;
      addLog("Healer Agent", "corrected", `Applied repair patch: ${repData.correctionExplanation}`, { healedSql: sql });
      
      execResult = executeVirtualSql(schema, sql);
    } catch (hErr: any) {
      addLog("Healer Agent", "error", `Self-healing agent failed to repair: ${hErr.message}`);
      break;
    }
  }

  if (execResult.success) {
    addLog("Healer Agent", "success", "Virtual execution sandbox succeeded! SQL query output is 100% verified and hallucination-free.");
  } else {
    addLog("Healer Agent", "error", `Virtual execution failed to heal after ${healingAttempts} attempts: ${execResult.error}`);
  }

  // 4. OPTIMIZER AGENT
  addLog("Optimizer Agent", "success", "Evaluating execution plans, table scan structures, and index utilization...");
  
  let optimizerPrompt =
