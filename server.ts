import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import alasql from "alasql";
import { dbSchemas } from "./src/dbSchema.js";
import { runMultiAgentSqlPipeline } from "./src/agentPipeline.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Enable JSON body parsing (crucial for API requests)
app.use(express.json());

// Log incoming API calls
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    console.log(`[API CALL] ${req.method} ${req.path} at ${new Date().toISOString()}`);
  }
  next();
});

// API Routes

// 1. Get database schemas catalogs
app.get("/api/schemas", (req, res) => {
  // Map schemas without raw massive seed datasets to keep initial payload compact
  const simplified = dbSchemas.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    tables: s.tables,
    seedSample: Object.keys(s.seedData).reduce((acc, k) => {
      acc[k] = s.seedData[k].slice(0, 3); // return first 3 rows as preview
      return acc;
    }, {} as Record<string, any[]>)
  }));
  res.json(simplified);
});

// 2. Main multi-agent natural language conversion and execution route
app.post("/api/query", async (req, res) => {
  const { prompt, schemaId, dialect, userRole, sessionHistory } = req.body;

  if (!prompt || !schemaId) {
    return res.status(400).json({ error: "Missing required fields: prompt and schemaId are mandatory." });
  }

  try {
    const result = await runMultiAgentSqlPipeline(
      prompt,
      schemaId,
      dialect || "SQLite",
      userRole || "Analyst",
      sessionHistory || []
    );
    res.json(result);
  } catch (err: any) {
    console.error("Pipeline failure:", err);
    res.status(500).json({ error: err.message || "An internal error occurred running the multi-agent SQL pipeline." });
  }
});

// 3. Smart suggested prompts route
app.get("/api/suggestions/:schemaId", (req, res) => {
  const { schemaId } = req.params;
  
  const suggestions: Record<string, Array<{ text: string; difficulty: string; description: string }>> = {
    saas_crm: [
      {
        text: "Count our active Professional or Enterprise users and sum their total API request usage counts.",
        difficulty: "Hard",
        description: "Requires Joining 'users', 'subscriptions', and 'usage_logs' tables with aggregations and filters."
      },
      {
        text: "List failed billing payments of our users alongside their names and payment methods.",
        difficulty: "Medium",
        description: "Requires Joining 'users' and 'payments' tables with failure status constraints."
      },
      {
        text: "What is our average monthly billing revenue generated from active subscriptions?",
        difficulty: "Easy",
        description: "Simple aggregation of price filters from the 'subscriptions' table."
      }
    ],
    ecommerce_logistics: [
      {
        text: "Which products have high user ratings (above 4.4) but low warehouse stock levels (below 80)?",
        difficulty: "Easy",
        description: "Simple multi-condition column filter with custom ordering and projections."
      },
      {
        text: "Calculate total revenue and order items sold grouped by customer's country.",
        difficulty: "Hard",
        description: "Three-way JOIN between 'customers', 'orders', and 'order_items' compiling purchase aggregates."
      },
      {
        text: "List organic search customers who checked out orders with total amounts exceeding $200.",
        difficulty: "Medium",
        description: "JOIN matching customers and orders constrained by acquisition source and cost limit."
      }
    ],
    healthcare_ledger: [
      {
        text: "List patients older than 35 with blood type A+ or O- who had appointments with Dr. Leonard McCoy.",
        difficulty: "Hard",
        description: "Requires Joining 'patients', 'appointments', and 'doctors' with nested compound conditions."
      },
      {
        text: "Find the average prescription medicine cost grouped by specialized doctor room name.",
        difficulty: "Hard",
        description: "Requires joining 'doctors', 'appointments', and 'prescriptions' with numeric averages."
      },
      {
        text: "Show appointments where patients failed to show up (No-Show) alongside their emergency contacts.",
        difficulty: "Medium",
        description: "JOIN of 'patients' and 'appointments' filtered by appointment outcome states."
      }
    ]
  };

  const list = suggestions[schemaId] || suggestions.saas_crm;
  res.json(list);
});

// 4. Secure direct SQL execution (with sandbox compiling & Guardian injection blockers)
app.post("/api/sql-execute", (req, res) => {
  const { sql, schemaId, userRole } = req.body;

  if (!sql || !schemaId) {
    return res.status(400).json({ error: "Missing required fields: sql and schemaId are mandatory." });
  }

  const schema = dbSchemas.find((s) => s.id === schemaId);
  if (!schema) {
    return res.status(400).json({ error: `Schema database not found: ${schemaId}` });
  }

  // Security checks matching Guardian Agent behavior
  const dangerousKeywords = ["DROP", "DELETE", "UPDATE", "ALTER", "TRUNCATE", "INSERT", "REPLACE", "MERGE", "GRANT", "REVOKE"];
  const upperSql = sql.toUpperCase();
  const detectedDangerous: string[] = [];

  dangerousKeywords.forEach((kw) => {
    const rx = new RegExp(`\\b${kw}\\b`);
    if (rx.test(upperSql)) {
      detectedDangerous.push(kw);
    }
  });

  if (detectedDangerous.length > 0) {
    return res.status(403).json({
      error: `Security Violation: Destructive command [${detectedDangerous.join(", ")}] blocked. Direct modification commands are prohibited for role '${userRole || "Analyst"}'.`
    });
  }

  // Double query statement block
  if (sql.includes(";") && sql.trim().split(";").filter((x: string) => x.trim().length > 0).length > 1) {
    return res.status(403).json({
      error: "Security Violation: Injection attempt blocked. Executing multiple statements separated by semicolons is strictly prohibited."
    });
  }

  try {
    // Run SQL using alasql sandbox
    const db = new (alasql as any).Database();
    for (const tableName of Object.keys(schema.seedData)) {
      db.exec(`CREATE TABLE ${tableName}`);
      if (db.tables[tableName]) {
        db.tables[tableName].data = JSON.parse(JSON.stringify(schema.seedData[tableName]));
      }
    }

    const execRes = db.exec(sql);
    const data = Array.isArray(execRes) ? execRes : [execRes];
    const flatData = data.length > 0 && Array.isArray(data[0]) ? data[0] : execRes;

    res.json({ success: true, data: flatData });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || "SQL Compilation Error." });
  }
});

// Vite Middleware integration for local development or direct static serving for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with dynamic Vite asset routing.");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode. Hosting static bundles.");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Enterprise Text-to-SQL Studio running on http://localhost:${PORT}`);
  });
}

startServer();
