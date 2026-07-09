export interface SchemaColumn {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  foreignKey?: { table: string; column: string };
  description: string;
}

export interface SchemaTable {
  name: string;
  description: string;
  columns: SchemaColumn[];
}

export interface DatabaseSchema {
  id: string;
  name: string;
  description: string;
  tables: SchemaTable[];
  seedData: Record<string, any[]>;
}

export const dbSchemas: DatabaseSchema[] = [
  {
    id: "saas_crm",
    name: "SaaS CRM & Subscription Platform",
    description: "Enterprise software-as-a-service application database tracking client accounts, recurring subscription tiers, billing transactions, and real-time API feature consumption metrics.",
    tables: [
      {
        name: "users",
        description: "Primary table storing account metadata, emails, and assigned account tier mapping.",
        columns: [
          { name: "id", type: "INT", isPrimaryKey: true, description: "Unique auto-incrementing identifier for each user account." },
          { name: "email", type: "VARCHAR(255)", isPrimaryKey: false, description: "Primary login email address." },
          { name: "name", type: "VARCHAR(100)", isPrimaryKey: false, description: "Full name of the user." },
          { name: "role", type: "VARCHAR(50)", isPrimaryKey: false, description: "Account role: 'Owner', 'Administrator', 'Member'." },
          { name: "plan_id", type: "INT", isPrimaryKey: false, description: "Mapping ID for the tier plan: 1=Free, 2=Professional, 3=Enterprise." },
          { name: "created_at", type: "DATE", isPrimaryKey: false, description: "Date the account was initially registered." }
        ]
      },
      {
        name: "subscriptions",
        description: "Tracks user recurring subscription history, dates of activation, and financial state.",
        columns: [
          { name: "id", type: "INT", isPrimaryKey: true, description: "Unique subscription identifier." },
          { name: "user_id", type: "INT", isPrimaryKey: false, foreignKey: { table: "users", column: "id" }, description: "Foreign key mapping back to users.id." },
          { name: "status", type: "VARCHAR(50)", isPrimaryKey: false, description: "Status indicator: 'Active', 'Cancelled', 'Delinquent', 'Expired'." },
          { name: "price", type: "DECIMAL(10,2)", isPrimaryKey: false, description: "Monthly price billed in USD." },
          { name: "started_at", type: "DATE", isPrimaryKey: false, description: "Subscription start date." },
          { name: "ends_at", type: "DATE", isPrimaryKey: false, description: "Subscription end/renewal date." }
        ]
      },
      {
        name: "usage_logs",
        description: "Tracks hourly micro-billing usage, active api resource counts, and features consumed.",
        columns: [
          { name: "id", type: "INT", isPrimaryKey: true, description: "Unique transaction identifier for usage logs." },
          { name: "user_id", type: "INT", isPrimaryKey: false, foreignKey: { table: "users", column: "id" }, description: "User consumed the API feature." },
          { name: "feature_name", type: "VARCHAR(100)", isPrimaryKey: false, description: "Feature triggered: 'AI_Text_Gen', 'Vector_Index', 'Bulk_Export'." },
          { name: "request_count", type: "INT", isPrimaryKey: false, description: "Quantity of server invocations or requests." },
          { name: "timestamp", type: "TIMESTAMP", isPrimaryKey: false, description: "Universal timestamp of resource utilization." }
        ]
      },
      {
        name: "payments",
        description: "Records of successful and failed cash ledger entries with historical billing metadata.",
        columns: [
          { name: "id", type: "INT", isPrimaryKey: true, description: "Unique payment identification number." },
          { name: "user_id", type: "INT", isPrimaryKey: false, foreignKey: { table: "users", column: "id" }, description: "User associated with this transaction." },
          { name: "amount", type: "DECIMAL(10,2)", isPrimaryKey: false, description: "Cash volume in USD." },
          { name: "status", type: "VARCHAR(50)", isPrimaryKey: false, description: "State: 'Succeeded', 'Failed', 'Refunded'." },
          { name: "date", type: "DATE", isPrimaryKey: false, description: "Date transaction was executed." },
          { name: "payment_method", type: "VARCHAR(50)", isPrimaryKey: false, description: "Processor: 'Credit_Card', 'ACH_Bank', 'PayPal', 'Crypto'." }
        ]
      }
    ],
    seedData: {
      users: [
        { id: 1, email: "john.doe@enterprise.com", name: "John Doe", role: "Owner", plan_id: 3, created_at: "2025-01-15" },
        { id: 2, email: "jane.smith@startup.co", name: "Jane Smith", role: "Administrator", plan_id: 2, created_at: "2025-02-10" },
        { id: 3, email: "bob.harris@freelance.org", name: "Bob Harris", role: "Member", plan_id: 1, created_at: "2025-03-01" },
        { id: 4, email: "alice.vance@megacorp.com", name: "Alice Vance", role: "Administrator", plan_id: 3, created_at: "2025-03-12" },
        { id: 5, email: "charlie.brown@peanuts.net", name: "Charlie Brown", role: "Member", plan_id: 1, created_at: "2025-04-19" },
        { id: 6, email: "david.miller@techflow.io", name: "David Miller", role: "Owner", plan_id: 2, created_at: "2025-05-02" }
      ],
      subscriptions: [
        { id: 101, user_id: 1, status: "Active", price: 299.00, started_at: "2025-01-15", ends_at: "2026-01-15" },
        { id: 102, user_id: 2, status: "Active", price: 49.00, started_at: "2025-02-10", ends_at: "2025-08-10" },
        { id: 103, user_id: 3, status: "Expired", price: 0.00, started_at: "2025-03-01", ends_at: "2025-04-01" },
        { id: 104, user_id: 4, status: "Active", price: 499.00, started_at: "2025-03-12", ends_at: "2026-03-12" },
        { id: 105, user_id: 5, status: "Cancelled", price: 0.00, started_at: "2025-04-19", ends_at: "2025-05-19" },
        { id: 106, user_id: 6, status: "Active", price: 49.00, started_at: "2025-05-02", ends_at: "2025-11-02" }
      ],
      usage_logs: [
        { id: 1001, user_id: 1, feature_name: "AI_Text_Gen", request_count: 350, timestamp: "2025-06-15 09:30:00" },
        { id: 1002, user_id: 1, feature_name: "Vector_Index", request_count: 89, timestamp: "2025-06-15 10:45:00" },
        { id: 1003, user_id: 2, feature_name: "AI_Text_Gen", request_count: 42, timestamp: "2025-06-15 11:15:00" },
        { id: 1004, user_id: 4, feature_name: "Bulk_Export", request_count: 15, timestamp: "2025-06-15 12:00:00" },
        { id: 1005, user_id: 4, feature_name: "AI_Text_Gen", request_count: 750, timestamp: "2025-06-15 13:10:00" },
        { id: 1006, user_id: 6, feature_name: "Vector_Index", request_count: 22, timestamp: "2025-06-15 14:22:00" },
        { id: 1007, user_id: 1, feature_name: "Bulk_Export", request_count: 8, timestamp: "2025-06-15 15:40:00" }
      ],
      payments: [
        { id: 2001, user_id: 1, amount: 299.00, status: "Succeeded", date: "2025-01-15", payment_method: "Credit_Card" },
        { id: 2002, user_id: 1, amount: 299.00, status: "Succeeded", date: "2025-02-15", payment_method: "Credit_Card" },
        { id: 2003, user_id: 2, amount: 49.00, status: "Succeeded", date: "2025-02-10", payment_method: "PayPal" },
        { id: 2004, user_id: 2, amount: 49.00, status: "Failed", date: "2025-03-10", payment_method: "PayPal" },
        { id: 2005, user_id: 4, amount: 499.00, status: "Succeeded", date: "2025-03-12", payment_method: "ACH_Bank" },
        { id: 2006, user_id: 6, amount: 49.00, status: "Succeeded", date: "2025-05-02", payment_method: "Crypto" }
      ]
    }
  },
  {
    id: "ecommerce_logistics",
    name: "E-Commerce Logistics & Analytics",
    description: "Retail operations dataset managing customer demographics, physical inventory levels, customer purchasing behavior, and invoice line items.",
    tables: [
      {
        name: "customers",
        description: "Detailed lookup containing user locations, sign-up channels, and profile data.",
        columns: [
          { name: "id", type: "INT", isPrimaryKey: true, description: "Unique customer identifier." },
          { name: "email", type: "VARCHAR(255)", isPrimaryKey: false, description: "Customer primary email." },
          { name: "first_name", type: "VARCHAR(50)", isPrimaryKey: false, description: "Customer first name." },
          { name: "last_name", type: "VARCHAR(50)", isPrimaryKey: false, description: "Customer family name." },
          { name: "country", type: "VARCHAR(100)", isPrimaryKey: false, description: "Geographic nation code or full country name." },
          { name: "acquired_source", type: "VARCHAR(100)", isPrimaryKey: false, description: "Marketing funnel: 'Organic_Search', 'Google_Ads', 'Tiktok', 'Referral'." }
        ]
      },
      {
        name: "products",
        description: "Active items database catalog, inventory counts, retail prices, and reviews.",
        columns: [
          { name: "id", type: "INT", isPrimaryKey: true, description: "Unique product catalog code." },
          { name: "title", type: "VARCHAR(200)", isPrimaryKey: false, description: "Consumer-facing product label." },
          { name: "category", type: "VARCHAR(100)", isPrimaryKey: false, description: "Product taxonomy: 'Electronics', 'Apparel', 'Home_Decor', 'Fitness'." },
          { name: "price", type: "DECIMAL(10,2)", isPrimaryKey: false, description: "Listed retail unit price." },
          { name: "stock", type: "INT", isPrimaryKey: false, description: "Units available in physical distribution warehouses." },
          { name: "rating", type: "DECIMAL(2,1)", isPrimaryKey: false, description: "Average product review rating (1.0 to 5.0)." }
        ]
      },
      {
        name: "orders",
        description: "Cart checkouts detailing dates, shipping outcomes, and financial totals.",
        columns: [
          { name: "id", type: "INT", isPrimaryKey: true, description: "Unique order order code." },
          { name: "customer_id", type: "INT", isPrimaryKey: false, foreignKey: { table: "customers", column: "id" }, description: "Customer ID mapping back to customers.id." },
          { name: "order_date", type: "DATE", isPrimaryKey: false, description: "Calendar date checkout was placed." },
          { name: "status", type: "VARCHAR(50)", isPrimaryKey: false, description: "Order status: 'Delivered', 'Processing', 'Shipped', 'Returned'." },
          { name: "total_amount", type: "DECIMAL(10,2)", isPrimaryKey: false, description: "Aggregate order total in USD." }
        ]
      },
      {
        name: "order_items",
        description: "Relational sub-table mapping products bought inside single order receipts.",
        columns: [
          { name: "id", type: "INT", isPrimaryKey: true, description: "Unique order item identifier." },
          { name: "order_id", type: "INT", isPrimaryKey: false, foreignKey: { table: "orders", column: "id" }, description: "Foreign key mapping back to orders.id." },
          { name: "product_id", type: "INT", isPrimaryKey: false, foreignKey: { table: "products", column: "id" }, description: "Foreign key mapping back to products.id." },
          { name: "quantity", type: "INT", isPrimaryKey: false, description: "Aggregate product volume purchased." },
          { name: "unit_price", type: "DECIMAL(10,2)", isPrimaryKey: false, description: "Retail unit price of item when order was placed." }
        ]
      }
    ],
    seedData: {
      customers: [
        { id: 10, email: "sarah.connor@sky.net", first_name: "Sarah", last_name: "Connor", country: "United States", acquired_source: "Google_Ads" },
        { id: 11, email: "mario.rossi@nintendo.it", first_name: "Mario", last_name: "Rossi", country: "Italy", acquired_source: "Organic_Search" },
        { id: 12, email: "yuki.sato@cyber.jp", first_name: "Yuki", last_name: "Sato", country: "Japan", acquired_source: "Referral" },
        { id: 13, email: "lisa.vander@amsterdam.nl", first_name: "Lisa", last_name: "Vander", country: "Netherlands", acquired_source: "Tiktok" },
        { id: 14, email: "gabriel.silva@brasil.br", first_name: "Gabriel", last_name: "Silva", country: "Brazil", acquired_source: "Organic_Search" }
      ],
      products: [
        { id: 501, title: "Supercharged Noise-Cancelling Headphones", category: "Electronics", price: 249.99, stock: 120, rating: 4.8 },
        { id: 502, title: "Ergonomic Premium Mechanical Keyboard", category: "Electronics", price: 129.50, stock: 45, rating: 4.5 },
        { id: 503, title: "Weatherproof Active Running Shoes", category: "Fitness", price: 89.00, stock: 210, rating: 4.2 },
        { id: 504, title: "Organic Cotton Comfy Hoodie", category: "Apparel", price: 59.99, stock: 350, rating: 4.6 },
        { id: 505, title: "Ambient Minimalist Bedside Lamp", category: "Home_Decor", price: 39.95, stock: 75, rating: 4.1 }
      ],
      orders: [
        { id: 8001, customer_id: 10, order_date: "2025-05-10", status: "Delivered", total_amount: 379.49 },
        { id: 8002, customer_id: 11, order_date: "2025-05-12", status: "Shipped", total_amount: 129.50 },
        { id: 8003, customer_id: 12, order_date: "2025-05-15", status: "Delivered", total_amount: 89.00 },
        { id: 8004, customer_id: 13, order_date: "2025-05-18", status: "Processing", total_amount: 349.93 },
        { id: 8005, customer_id: 14, order_date: "2025-05-20", status: "Returned", total_amount: 59.99 }
      ],
      order_items: [
        { id: 9001, order_id: 8001, product_id: 501, quantity: 1, unit_price: 249.99 },
        { id: 9002, order_id: 8001, product_id: 502, quantity: 1, unit_price: 129.50 },
        { id: 9003, order_id: 8002, product_id: 502, quantity: 1, unit_price: 129.50 },
        { id: 9004, order_id: 8003, product_id: 503, quantity: 1, unit_price: 89.00 },
        { id: 9005, order_id: 8004, product_id: 501, quantity: 1, unit_price: 249.99 },
        { id: 9006, order_id: 8004, product_id: 505, quantity: 2, unit_price: 39.95 },
        { id: 9007, order_id: 8005, product_id: 504, quantity: 1, unit_price: 59.99 }
      ]
    }
  },
  {
    id: "healthcare_ledger",
    name: "Healthcare Patient Ledger & Appointments",
    description: "Clinical patient care registry containing demographic details, physician shift allocations, patient appointments, diagnostic logs, and pharmacy medication costs.",
    tables: [
      {
        name: "patients",
        description: "Demographic lookup, clinical ages, blood groups, and urgent contacts.",
        columns: [
          { name: "id", type: "INT", isPrimaryKey: true, description: "Unique patient code identifier." },
          { name: "name", type: "VARCHAR(150)", isPrimaryKey: false, description: "Patient's full legal name." },
          { name: "age", type: "INT", isPrimaryKey: false, description: "Age of patient in years." },
          { name: "gender", type: "VARCHAR(30)", isPrimaryKey: false, description: "Gender identifier." },
          { name: "blood_type", type: "VARCHAR(5)", isPrimaryKey: false, description: "Clinical blood categorization: 'A+', 'O-', 'B+', etc." },
          { name: "emergency_contact", type: "VARCHAR(100)", isPrimaryKey: false, description: "Primary emergency relative contact name." }
        ]
      },
      {
        name: "doctors",
        description: "Hospital physician register, specialties, and location coordinates.",
        columns: [
          { name: "id", type: "INT", isPrimaryKey: true, description: "Unique doctor register code." },
          { name: "name", type: "VARCHAR(150)", isPrimaryKey: false, description: "Full practitioner name." },
          { name: "specialty", type: "VARCHAR(100)", isPrimaryKey: false, description: "Medical vertical: 'Cardiology', 'Pediatrics', 'Neurology', 'General_Practice'." },
          { name: "clinic_room", type: "VARCHAR(20)", isPrimaryKey: false, description: "In-facility room name." },
          { name: "availability", type: "VARCHAR(100)", isPrimaryKey: false, description: "Work shift: 'Morning', 'Evening', 'On-Call'." }
        ]
      },
      {
        name: "appointments",
        description: "Calendar bookings bridging patients to healthcare physicians.",
        columns: [
          { name: "id", type: "INT", isPrimaryKey: true, description: "Unique booking identifier." },
          { name: "patient_id", type: "INT", isPrimaryKey: false, foreignKey: { table: "patients", column: "id" }, description: "Foreign key mapping back to patients.id." },
          { name: "doctor_id", type: "INT", isPrimaryKey: false, foreignKey: { table: "doctors", column: "id" }, description: "Foreign key mapping back to doctors.id." },
          { name: "date", type: "DATE", isPrimaryKey: false, description: "Scheduled calendar appointment date." },
          { name: "status", type: "VARCHAR(50)", isPrimaryKey: false, description: "Status: 'Completed', 'Scheduled', 'No-Show', 'Cancelled'." },
          { name: "notes", type: "TEXT", isPrimaryKey: false, description: "Initial triage remarks or physical signs." }
        ]
      },
      {
        name: "prescriptions",
        description: "Post-appointment treatment logs, prescribed medicine, dosing timelines, and expenses.",
        columns: [
          { name: "id", type: "INT", isPrimaryKey: true, description: "Unique receipt code." },
          { name: "appointment_id", type: "INT", isPrimaryKey: false, foreignKey: { table: "appointments", column: "id" }, description: "Foreign key mapping back to appointments.id." },
          { name: "medication", type: "VARCHAR(150)", isPrimaryKey: false, description: "Trade name of medication prescribed." },
          { name: "dosage", type: "VARCHAR(100)", isPrimaryKey: false, description: "Frequency instructions: '500mg daily', 'Twice a day'." },
          { name: "days", type: "INT", isPrimaryKey: false, description: "Course duration." },
          { name: "cost", type: "DECIMAL(10,2)", isPrimaryKey: false, description: "Out-of-pocket pharmacy price in USD." }
        ]
      }
    ],
    seedData: {
      patients: [
        { id: 201, name: "Arthur Dent", age: 42, gender: "Male", blood_type: "O-", emergency_contact: "Tricia McMillan" },
        { id: 202, name: "Ellen Ripley", age: 34, gender: "Female", blood_type: "A+", emergency_contact: "Wey-Yut Corp" },
        { id: 203, name: "Spock", age: 154, gender: "Male", blood_type: "B-", emergency_contact: "Sarek of Vulcan" },
        { id: 204, name: "Dana Scully", age: 31, gender: "Female", blood_type: "AB+", emergency_contact: "Fox Mulder" },
        { id: 205, name: "Bruce Wayne", age: 39, gender: "Male", blood_type: "O+", emergency_contact: "Alfred Pennyworth" }
      ],
      doctors: [
        { id: 51, name: "Dr. Leonard McCoy", specialty: "General_Practice", clinic_room: "Room 101-B", availability: "Morning" },
        { id: 52, name: "Dr. Beverly Crusher", specialty: "Cardiology", clinic_room: "Sickbay Alpha", availability: "Evening" },
        { id: 53, name: "Dr. Gregory House", specialty: "Neurology", clinic_room: "Room 404", availability: "On-Call" },
        { id: 54, name: "Dr. Stephen Strange", specialty: "Neurology", clinic_room: "Sanctum Main", availability: "Evening" }
      ],
      appointments: [
        { id: 3001, patient_id: 201, doctor_id: 51, date: "2025-06-10", status: "Completed", notes: "Mild panic attack, suggested carrying a towel." },
        { id: 3002, patient_id: 202, doctor_id: 52, date: "2025-06-11", status: "Completed", notes: "Exhaustion due to long space travel. High adrenaline." },
        { id: 3003, patient_id: 203, doctor_id: 53, date: "2025-06-12", status: "Scheduled", notes: "Sub-clinical cognitive fatigue. Unusual green blood properties." },
        { id: 3004, patient_id: 204, doctor_id: 51, date: "2025-06-13", status: "Completed", notes: "Routine checkup following specialized field work." },
        { id: 3005, patient_id: 205, doctor_id: 54, date: "2025-06-14", status: "No-Show", notes: "Stated he had urgent night-time commitments in the city." }
      ],
      prescriptions: [
        { id: 4001, appointment_id: 3001, medication: "Pan-Galactic Gargle Sedative", dosage: "10ml before bedtime", days: 7, cost: 45.50 },
        { id: 4002, appointment_id: 3002, medication: "Deep-Sleep Melatonin Pro", dosage: "50mg before cycle", days: 14, cost: 22.00 },
        { id: 4003, appointment_id: 3004, medication: "Multivitamin Complex X", dosage: "1 capsule daily", days: 30, cost: 15.00 },
        { id: 4004, appointment_id: 3001, medication: "Chamomile Tonic Extra", dosage: "As needed for anxiety", days: 10, cost: 8.50 }
      ]
    }
  }
];
