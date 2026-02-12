const PROJECTS = [
  {
    "name": "Classic Towing Voice AI",
    "description": "Three-assistant VAPI voice AI system (ARIA, Andi, Lucas) handling incoming calls for receptionist routing, dispatch tow requests, and storage inquiries at Classic Towing & Storage.",
    "category": "voice-ai",
    "features": [
      {"name": "ARIA - Virtual Receptionist (call routing, staff lookup, reason lookup)", "done": true},
      {"name": "Andi - Dispatch Call-Taker (collect tow request details, submit to InTow)", "done": true},
      {"name": "Lucas - Storage Assistant (vehicle lookup, balance, release info)", "done": true},
      {"name": "Customer lookup with space-insensitive matching", "done": true},
      {"name": "Mandatory address validation via Google Places Autocomplete", "done": true},
      {"name": "Account codes in submit_call", "done": true},
      {"name": "Live agent request handling", "done": true},
      {"name": "Call logging to data tables", "done": true},
      {"name": "Storage period calculation from tow date", "done": true},
      {"name": "Toronto 24/7 hours for vehicle owners", "done": true},
      {"name": "n8n workflows (20 total across all assistants)", "done": true},
      {"name": "get_price tool - Instant quotes for cash calls", "done": false},
      {"name": "AWD/4WD question for pricing", "done": false},
      {"name": "Remove legacy call_tool from assistant", "done": false},
      {"name": "Partial payments in balance explanation", "done": false},
      {"name": "Estimated accrual info for multi-day vehicles", "done": false},
      {"name": "Accounts Agent", "done": false},
      {"name": "Driver Agent", "done": false},
      {"name": "Admin UI for managing directories", "done": false},
      {"name": "Dashboard for call analytics", "done": false}
    ],
    "progress": 80,
    "github_url": "https://github.com/elmerzc/Ai",
    "github_repo": "elmerzc/Ai"
  },
  {
    "name": "Andi",
    "description": "Voice AI dispatch assistant for Classic Towing that handles inbound tow request calls with address validation, account lookup, warm transfer to dispatch, and call memory for return callers.",
    "category": "voice-ai",
    "features": [
      {"name": "Collect caller info and tow request details", "done": true},
      {"name": "Customer lookup with account codes", "done": true},
      {"name": "Address validation via Google Places Autocomplete", "done": true},
      {"name": "Submit call to InTow dispatch via email", "done": true},
      {"name": "Warm transfer to live dispatch agent", "done": true},
      {"name": "Call memory (check_call_context, save_call_context)", "done": true},
      {"name": "Return caller flow", "done": true},
      {"name": "Email fallback for non-service calls", "done": true}
    ],
    "progress": 95,
    "github_url": "https://github.com/elmerzc/Andi",
    "github_repo": "elmerzc/Andi"
  },
  {
    "name": "ARIA",
    "description": "Virtual receptionist voice AI for Classic Towing that routes incoming calls to the correct person, department, or specialized assistant (Lucas for storage, Andi for dispatch).",
    "category": "voice-ai",
    "features": [
      {"name": "Storage/impound call detection and handoff to Lucas", "done": true},
      {"name": "Person lookup by name (staff_lookup)", "done": true},
      {"name": "Department routing", "done": true},
      {"name": "Reason-based routing (reason_lookup)", "done": true},
      {"name": "Live agent request handling", "done": true},
      {"name": "Extension request handling", "done": true},
      {"name": "Email fallback for do_not_ring staff", "done": true},
      {"name": "Call logging (log_aria_call)", "done": true},
      {"name": "Dynamic transfer", "done": true},
      {"name": "Dispatch call routing", "done": true}
    ],
    "progress": 95,
    "github_url": "https://github.com/elmerzc/Aria",
    "github_repo": "elmerzc/Aria"
  },
  {
    "name": "Aventureros",
    "description": "Web app for managing Club de Aventureros 'Toronto's 100' including member registration, award orders, payments, inventory tracking, and public sign-up.",
    "category": "web-app",
    "features": [
      {"name": "Dashboard with metrics (members, orders, deliveries, collected)", "done": true},
      {"name": "Family and member management with membership levels", "done": true},
      {"name": "Product catalog (164 products with CAD pricing)", "done": true},
      {"name": "3-step order flow with status tracking", "done": true},
      {"name": "Payment tracking (paid/partial/owing)", "done": true},
      {"name": "Inventory tracking with low stock alerts", "done": true},
      {"name": "Public sign-up form at /signup", "done": true},
      {"name": "HTML receipt with club logo (printable/shareable)", "done": true},
      {"name": "Family balance tracking and payment application", "done": true},
      {"name": "Add-on products (patches, crests, slides)", "done": true},
      {"name": "Dues tracking ($20 inscription + $10/month)", "done": false},
      {"name": "Dues reminders", "done": false},
      {"name": "Reports/exports (CSV, PDF)", "done": false},
      {"name": "Bulk order generation for Advent Source", "done": false},
      {"name": "Historical data import from Excel", "done": false}
    ],
    "progress": 85,
    "github_url": "https://github.com/elmerzc/Aventureros",
    "github_repo": "elmerzc/Aventureros"
  },
  {
    "name": "Claude Skills",
    "description": "Claude skill that processes InTow Manager CSV exports into color-coded Excel dispatch efficiency reports with performance categorization and driver rankings.",
    "category": "workflow",
    "features": [
      {"name": "CSV parsing from InTow Manager exports", "done": true},
      {"name": "Dispatch duration calculation (Call Time to Dispatch Time)", "done": true},
      {"name": "Driver response time calculation", "done": true},
      {"name": "Performance categorization (Green/Yellow/Orange/Red)", "done": true},
      {"name": "Color-coded Excel report generation", "done": true},
      {"name": "Summary statistics sheet", "done": true},
      {"name": "Interactive dashboard (React component)", "done": true},
      {"name": "Daily breakdowns for multi-day reports", "done": true}
    ],
    "progress": 100,
    "github_url": "https://github.com/elmerzc/Claude-Skills",
    "github_repo": "elmerzc/Claude-Skills"
  },
  {
    "name": "Dispatch Portal",
    "description": "Real-time web-based driver check-in portal for tow truck dispatch that tracks driver shifts, call assignments, availability status, and generates shift reports with Firebase sync.",
    "category": "web-app",
    "features": [
      {"name": "Authentication system (view-only + protected edits)", "done": true},
      {"name": "Driver check-in/sign-out management", "done": true},
      {"name": "9 call types and 9 status options", "done": true},
      {"name": "Real-time synchronization across devices", "done": true},
      {"name": "Two sort modes (sign-in time, longest idle)", "done": true},
      {"name": "CSV data export", "done": true},
      {"name": "Shift management and summaries", "done": true},
      {"name": "Call counter per driver", "done": true},
      {"name": "Driver photos/avatars", "done": false},
      {"name": "Call notes/details field", "done": false},
      {"name": "SMS notifications to drivers", "done": false},
      {"name": "Historical data viewer/reports", "done": false},
      {"name": "Mobile app version", "done": false},
      {"name": "Driver self check-in app", "done": false}
    ],
    "progress": 85,
    "github_url": "https://github.com/elmerzc/dispatch-portal",
    "github_repo": "elmerzc/dispatch-portal"
  },
  {
    "name": "Driver Onboarding Portal",
    "description": "Portal for managing driver onboarding paperwork at Classic Towing with multi-step application forms for operators and contractors, document uploads, manager approval workflow, and role-based access.",
    "category": "web-app",
    "features": [
      {"name": "Firebase project setup (Firestore, Storage, Auth)", "done": true},
      {"name": "Authentication and user management (4 roles)", "done": true},
      {"name": "Operator application form (4-step)", "done": true},
      {"name": "Contractor application form (6-step)", "done": true},
      {"name": "Manager and onboarding dashboards", "done": true},
      {"name": "Admin dashboard with user/location management", "done": true},
      {"name": "Branding and info pages", "done": true},
      {"name": "Document upload interface per applicant type", "done": true},
      {"name": "Application form bug fixes and deployment", "done": true},
      {"name": "SMS verification (real Twilio integration)", "done": false},
      {"name": "n8n email workflows (application notifications)", "done": false},
      {"name": "DocuSign email capture for signed contracts", "done": false},
      {"name": "Document expiration tracking notifications", "done": false},
      {"name": "Admin ExpiringDocuments page for applicant-specific docs", "done": false}
    ],
    "progress": 75,
    "github_url": "https://github.com/elmerzc/driver-onboarding-portal",
    "github_repo": "elmerzc/driver-onboarding-portal"
  },
  {
    "name": "Grok Voice Agent",
    "description": "Alternative voice AI receptionist using xAI's Grok Realtime API with Twilio to replace VAPI and reduce costs by ~60% while maintaining warm transfer capabilities.",
    "category": "voice-ai",
    "features": [
      {"name": "Node.js + Fastify WebSocket server", "done": true},
      {"name": "xAI Grok Realtime API integration (Ara voice)", "done": true},
      {"name": "Twilio Media Streams for phone integration", "done": true},
      {"name": "Warm transfer via Twilio Conference", "done": true},
      {"name": "Vehicle lookup, staff lookup, customer lookup tools", "done": true},
      {"name": "Auto-logging on disconnect", "done": true},
      {"name": "Extension dialing support", "done": true},
      {"name": "Barge-in (interruption) handling", "done": true},
      {"name": "Call recording via Twilio", "done": false},
      {"name": "Cold transfer option (brief dispatcher)", "done": false},
      {"name": "Voicemail fallback for failed transfers", "done": false},
      {"name": "Spanish language support", "done": false}
    ],
    "progress": 85,
    "github_url": "https://github.com/elmerzc/grok-voice-agent",
    "github_repo": "elmerzc/grok-voice-agent"
  },
  {
    "name": "La Estrella",
    "description": "Mobile-friendly web inventory system for Ferreteria La Estrella hardware store in Guatemala, replacing manual Google Sheets with real-time Firebase app for sales, purchases, and stock management.",
    "category": "web-app",
    "features": [
      {"name": "Firebase Firestore database with 1,819 products", "done": true},
      {"name": "Login system (admin + ventas roles)", "done": true},
      {"name": "Ventas module (search, stock validation, record sale)", "done": true},
      {"name": "Compras module (search, create product, record purchase)", "done": true},
      {"name": "Inventario view with search and stock display", "done": true},
      {"name": "Anular module (void sales/purchases with reason)", "done": true},
      {"name": "Zero stock filter (Agotados)", "done": true},
      {"name": "CSV export for Inventario, Ventas, Compras", "done": true},
      {"name": "Import tool for CSV data", "done": true},
      {"name": "Firebase Authentication (replace hardcoded users)", "done": false},
      {"name": "Daily Google Sheets sync", "done": false},
      {"name": "Offline mode (PWA)", "done": false},
      {"name": "Receipt/ticket printing", "done": false},
      {"name": "Low stock alerts", "done": false},
      {"name": "Sales reports/analytics dashboard", "done": false}
    ],
    "progress": 75,
    "github_url": "https://github.com/elmerzc/la-estrella",
    "github_repo": "elmerzc/la-estrella"
  },
  {
    "name": "Lucas",
    "description": "Voice AI storage assistant for Classic Towing that helps callers look up vehicles in storage, provides balances, release requirements, lot locations, and handles insurance/third-party release routing.",
    "category": "voice-ai",
    "features": [
      {"name": "Vehicle lookup by VIN last 6 or plate", "done": true},
      {"name": "Storage balance from invoice data", "done": true},
      {"name": "Storage period calculation from tow date", "done": true},
      {"name": "Lot location identification (4 locations)", "done": true},
      {"name": "Release requirements explanation", "done": true},
      {"name": "Insurance release routing to email", "done": true},
      {"name": "Third-party pickup routing to email", "done": true},
      {"name": "Fallback email for disputes/callbacks", "done": true},
      {"name": "Call logging (log_lucas_call)", "done": true},
      {"name": "Transfer to dispatch for tow requests", "done": true},
      {"name": "Hourly rate reminders", "done": true},
      {"name": "Location-specific hours (Toronto 24/7 for owners)", "done": true}
    ],
    "progress": 95,
    "github_url": "https://github.com/elmerzc/Lucas",
    "github_repo": "elmerzc/Lucas"
  },
  {
    "name": "Max",
    "description": "SMS-based AI agent using Grok via n8n workflow that handles multi-turn text conversations for Classic Towing, with vehicle lookup, address validation, and conversation memory stored in Firebase.",
    "category": "workflow",
    "features": [
      {"name": "Twilio SMS webhook integration", "done": true},
      {"name": "Grok AI agent with multi-turn conversations", "done": true},
      {"name": "Firebase conversation history (30 min expiry, 10 msg max)", "done": true},
      {"name": "7 tool integrations (vehicle lookup, address, customer, etc.)", "done": true},
      {"name": "n8n workflow with setup guide", "done": true}
    ],
    "progress": 90,
    "github_url": "https://github.com/elmerzc/Max",
    "github_repo": "elmerzc/Max"
  },
  {
    "name": "n8n Projects",
    "description": "Collection of n8n workflow exports and documentation including the save email draft workflow that creates Outlook drafts via Microsoft Graph API.",
    "category": "workflow",
    "features": [
      {"name": "Save email draft workflow (Graph API)", "done": true},
      {"name": "Address lookup workflow", "done": true},
      {"name": "Vehicle lookup workflow", "done": true},
      {"name": "Staff lookup workflow", "done": true},
      {"name": "Reason lookup workflow", "done": true},
      {"name": "Workflow creator utility", "done": true},
      {"name": "Workflow updater utility", "done": true},
      {"name": "Global error handler", "done": true}
    ],
    "progress": 100,
    "github_url": "https://github.com/elmerzc/n8n-projects",
    "github_repo": "elmerzc/n8n-projects"
  },
  {
    "name": "n8n Workflow Organization",
    "description": "Documentation and organization of all 20 n8n workflows across ARIA, Andi, Lucas, Max, Forms, and Utility folders with complete tool-to-workflow mapping.",
    "category": "workflow",
    "features": [
      {"name": "Folder structure for all 20 workflows", "done": true},
      {"name": "Cross-assistant tool usage mapping", "done": true},
      {"name": "VAPI Tool to n8n workflow mapping", "done": true},
      {"name": "Complete VAPI tool inventory with IDs", "done": true},
      {"name": "Orphaned/deleted tool identification", "done": true}
    ],
    "progress": 100,
    "github_url": "https://github.com/elmerzc/n8n-workflows",
    "github_repo": "elmerzc/n8n-workflows"
  },
  {
    "name": "Pound Access Form",
    "description": "Digital pound access request form for Classic Towing customers to request access to impounded vehicles for personal items, insurance releases, or third-party pickups.",
    "category": "form",
    "features": [
      {"name": "HTML form with personal, vehicle, ID photo, release type sections", "done": true},
      {"name": "n8n workflow JSON created", "done": true},
      {"name": "Firebase database integration (ct-vehicle-releases)", "done": true},
      {"name": "Conditional insurance/third-party sections", "done": true},
      {"name": "Photo ID upload with preview", "done": true},
      {"name": "Import workflow to n8n", "done": false},
      {"name": "Connect Outlook credentials", "done": false},
      {"name": "Activate workflow", "done": false},
      {"name": "Test form submission", "done": false},
      {"name": "Deploy form to Netlify/Firebase Hosting", "done": false},
      {"name": "Test end-to-end with ID photo", "done": false}
    ],
    "progress": 50,
    "github_url": "https://github.com/elmerzc/Pound-Access-Form",
    "github_repo": "elmerzc/Pound-Access-Form"
  },
  {
    "name": "Vehicle Release Form",
    "description": "Digital vehicle release authorization system for Classic Towing allowing owners to pre-authorize third-party pickups or insurance releases with ID photo upload and automated dispatch email.",
    "category": "form",
    "features": [
      {"name": "HTML form with owner, vehicle, release type, ID photo", "done": true},
      {"name": "n8n workflow active (ID: qZXN75m6KZLs8EVE)", "done": true},
      {"name": "Firebase Realtime Database storage", "done": true},
      {"name": "HTML formatted email to dispatch with ID attachment", "done": true},
      {"name": "Reference ID generation (REL-timestamp-random)", "done": true},
      {"name": "Third-party and insurance release support", "done": true},
      {"name": "Confirmation email to vehicle owner", "done": false},
      {"name": "SMS notification to dispatch", "done": false},
      {"name": "Status update workflow (pending to released)", "done": false},
      {"name": "Admin dashboard for managing releases", "done": false},
      {"name": "PDF generation of release authorization", "done": false},
      {"name": "Integration with InTow Manager", "done": false}
    ],
    "progress": 70,
    "github_url": "https://github.com/elmerzc/Release-form",
    "github_repo": "elmerzc/Release-form"
  },
  {
    "name": "Ronni",
    "description": "Web-based automation tool that converts InTow Manager CSV exports to TTC (Toronto Transit Commission) non-revenue reporting format with drag-and-drop upload, editable tables, and text/PDF export.",
    "category": "web-app",
    "features": [
      {"name": "Drag & drop CSV upload", "done": true},
      {"name": "Editable table with 26 columns", "done": true},
      {"name": "Dropdown selectors for Division, Position, Flags", "done": true},
      {"name": "Auto-extract KM from Services field", "done": true},
      {"name": "Auto-determine base amount ($225/$250)", "done": true},
      {"name": "Live summary totals", "done": true},
      {"name": "Toggle empty columns visibility", "done": true},
      {"name": "Export to text file (TTC format)", "done": true},
      {"name": "Export PDF summary", "done": true},
      {"name": "Python CLI backup script", "done": true}
    ],
    "progress": 100,
    "github_url": "https://github.com/elmerzc/Ronni",
    "github_repo": "elmerzc/Ronni"
  },
  {
    "name": "Task Tracker",
    "description": "Personal task tracking Excel spreadsheet with daily work logging, auto-populated by-day view with FILTER formulas, and to-do list for project tracking.",
    "category": "docs",
    "features": [
      {"name": "Daily Log sheet (append-only work logging)", "done": true},
      {"name": "By Day sheet (vertical layout, auto-populated via FILTER)", "done": true},
      {"name": "To-Do List sheet (project tracking with status/priority)", "done": true},
      {"name": "Mixed time format parsing (4h, 45m, plain numbers)", "done": true},
      {"name": "Hour totals per day", "done": true}
    ],
    "progress": 100,
    "github_url": "https://github.com/elmerzc/task-tracker",
    "github_repo": "elmerzc/task-tracker"
  },
  {
    "name": "TwinMind ASR",
    "description": "Reference documentation for TwinMind's file-based speech-to-text API (Ear-3 model) for potential post-call transcription, QA, and call logging at Classic Towing.",
    "category": "docs",
    "features": [
      {"name": "API documentation (sync and async endpoints)", "done": true},
      {"name": "Python code examples", "done": true},
      {"name": "Classic Towing integration notes and prompt", "done": true},
      {"name": "Cost analysis and model comparison", "done": true},
      {"name": "Get API key and test", "done": false},
      {"name": "Build async n8n workflow for production", "done": false},
      {"name": "Post-call transcription integration", "done": false},
      {"name": "QA batch processing workflow", "done": false}
    ],
    "progress": 25,
    "github_url": "https://github.com/elmerzc/twinmind-asr",
    "github_repo": "elmerzc/twinmind-asr"
  },
  {
    "name": "Vapi Tools",
    "description": "Collection of n8n workflow JSON exports for VAPI transfer destination and workflow updater tools used by the Classic Towing voice AI system.",
    "category": "workflow",
    "features": [
      {"name": "VAPI transfer destination workflow v1", "done": true},
      {"name": "VAPI transfer destination workflow v2", "done": true},
      {"name": "VAPI workflow updater v3", "done": true}
    ],
    "progress": 100,
    "github_url": "https://github.com/elmerzc/Vapi-Tools",
    "github_repo": "elmerzc/Vapi-Tools"
  },
  {
    "name": "Warm Transfer Fallback",
    "description": "Firebase configuration for warm transfer fallback handling in the Classic Towing voice AI system with Firestore rules and indexes.",
    "category": "workflow",
    "features": [
      {"name": "Firebase project configuration (.firebaserc)", "done": true},
      {"name": "Firestore security rules", "done": true},
      {"name": "Firestore indexes", "done": true}
    ],
    "progress": 100,
    "github_url": "https://github.com/elmerzc/warm-transfer-fallback",
    "github_repo": "elmerzc/warm-transfer-fallback"
  }
];

const CATEGORIES = {
  "voice-ai": { label: "Voice AI", color: "#a371f7" },
  "web-app": { label: "Web App", color: "#58a6ff" },
  "workflow": { label: "Workflow", color: "#3fb950" },
  "form": { label: "Form", color: "#d29922" },
  "docs": { label: "Docs", color: "#8b949e" }
};
