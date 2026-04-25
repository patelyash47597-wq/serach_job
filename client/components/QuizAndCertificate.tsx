"use client";

import React, { useState, useEffect, useRef } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface QuizResult {
  score: number;
  total: number;
  passed: boolean;
  answers: number[];
  completedAt: string;
}

interface QuizAndCertificateProps {
  roadmapTitle: string;
  topicContext: string; // node labels joined
  userName?: string;
}

// ── Certificate Generator ─────────────────────────────────────────────────────

async function generateCertificatePDF(
  userName: string,
  roadmapTitle: string,
  score: number,
  total: number,
  date: string
) {
  // Load jsPDF
  await new Promise<void>((res, rej) => {
    if ((window as any).jspdf) { res(); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s.onload = () => res();
    s.onerror = () => rej(new Error("jsPDF load failed"));
    document.head.appendChild(s);
  });

  const { jsPDF } = (window as any).jspdf;
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = 297, H = 210;

  // ── Background ──
  pdf.setFillColor(8, 12, 20);
  pdf.rect(0, 0, W, H, "F");

  // ── Decorative border ──
  const drawBorder = (offset: number, r: number, g: number, b: number, lw: number) => {
    pdf.setDrawColor(r, g, b);
    pdf.setLineWidth(lw);
    pdf.rect(offset, offset, W - offset * 2, H - offset * 2, "S");
  };
  drawBorder(6, 77, 201, 168, 0.5);
  drawBorder(9, 63, 185, 152, 0.3);
  drawBorder(12, 30, 50, 40, 0.2);

  // ── Corner ornaments ──
  const corners = [[18, 18], [W - 18, 18], [18, H - 18], [W - 18, H - 18]];
  corners.forEach(([x, y]) => {
    pdf.setFillColor(77, 201, 168);
    pdf.circle(x, y, 2, "F");
    pdf.setDrawColor(77, 201, 168);
    pdf.setLineWidth(0.3);
    pdf.circle(x, y, 4, "S");
  });

  // ── Top accent line ──
  pdf.setDrawColor(77, 201, 168);
  pdf.setLineWidth(1.2);
  pdf.line(40, 28, W - 40, 28);

  // ── CERTIFICATE OF COMPLETION header ──
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(77, 201, 168);
  pdf.setCharSpace(5);
  pdf.text("CERTIFICATE OF COMPLETION", W / 2, 22, { align: "center" });
  pdf.setCharSpace(0);

  // ── Decorative dots row ──
  for (let i = 0; i < 7; i++) {
    const x = W / 2 - 18 + i * 6;
    pdf.setFillColor(i === 3 ? 77 : 40, i === 3 ? 201 : 80, i === 3 ? 168 : 60);
    pdf.circle(x, 34, i === 3 ? 1.2 : 0.7, "F");
  }

  // ── "This is to certify that" ──
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(140, 150, 160);
  pdf.text("This is to certify that", W / 2, 50, { align: "center" });

  // ── Name ──
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(32);
  pdf.setTextColor(230, 237, 243);
  pdf.text(userName, W / 2, 68, { align: "center" });

  // ── Underline name ──
  const nameWidth = pdf.getTextWidth(userName);
  pdf.setDrawColor(77, 201, 168);
  pdf.setLineWidth(0.5);
  pdf.line(W / 2 - nameWidth / 2, 71, W / 2 + nameWidth / 2, 71);

  // ── "has successfully completed" ──
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(140, 150, 160);
  pdf.text("has successfully completed the learning roadmap", W / 2, 82, { align: "center" });

  // ── Roadmap Title ──
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.setTextColor(77, 201, 168);
  pdf.text(roadmapTitle, W / 2, 96, { align: "center" });

  // ── Score badge box ──
  const pct = Math.round((score / total) * 100);
  pdf.setFillColor(13, 40, 25);
  pdf.setDrawColor(63, 185, 80);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(W / 2 - 40, 104, 80, 22, 4, 4, "FD");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(63, 185, 80);
  pdf.text(`Quiz Score: ${score}/${total} (${pct}%)`, W / 2, 114, { align: "center" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(100, 160, 110);
  pdf.text("PASSED WITH DISTINCTION", W / 2, 121, { align: "center" });

  // ── Bottom separator ──
  pdf.setDrawColor(30, 50, 40);
  pdf.setLineWidth(0.3);
  pdf.line(40, 140, W - 40, 140);

  // ── Left: Date ──
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(100, 110, 120);
  pdf.text("DATE OF COMPLETION", 60, 150);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(200, 210, 220);
  pdf.text(date, 60, 157);

  // ── Center: Seal circle ──
  pdf.setFillColor(13, 25, 13);
  pdf.setDrawColor(77, 201, 168);
  pdf.setLineWidth(0.8);
  pdf.circle(W / 2, 155, 18, "FD");
  pdf.setDrawColor(63, 185, 80);
  pdf.setLineWidth(0.3);
  pdf.circle(W / 2, 155, 14, "S");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  pdf.setTextColor(77, 201, 168);
  pdf.text("VERIFIED", W / 2, 153, { align: "center" });
  pdf.text("✓", W / 2, 160, { align: "center" });

  // ── Right: Certificate ID ──
  const certId = `CERT-${Date.now().toString(36).toUpperCase()}`;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(100, 110, 120);
  pdf.text("CERTIFICATE ID", W - 60, 150, { align: "center" });
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(77, 201, 168);
  pdf.text(certId, W - 60, 157, { align: "center" });

  // ── Bottom accent line ──
  pdf.setDrawColor(77, 201, 168);
  pdf.setLineWidth(0.5);
  pdf.line(40, H - 28, W - 40, H - 28);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.setTextColor(60, 80, 70);
  pdf.setCharSpace(2);
  pdf.text("ISSUED BY LEARNING ROADMAP PLATFORM", W / 2, H - 22, { align: "center" });

  pdf.save(`${roadmapTitle.replace(/\s+/g, "_")}_Certificate.pdf`);
}

// ── Quiz Component ─────────────────────────────────────────────────────────────

type Phase = "locked" | "intro" | "loading" | "quiz" | "result" | "certificate";

export default function QuizAndCertificate({
  roadmapTitle,
  topicContext,
  userName: defaultName = "",
}: QuizAndCertificateProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [showExplain, setShowExplain] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [userName, setUserName] = useState(defaultName);
  const [nameInput, setNameInput] = useState(defaultName);
  const [genError, setGenError] = useState("");
  const [generatingCert, setGeneratingCert] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer
  useEffect(() => {
    if (phase !== "quiz") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { finishQuiz(answers); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // Generate quiz via Anthropic API
    const generateQuiz = async () => {
        setPhase("loading");
        setGenError("");

        await new Promise(r => setTimeout(r, 1200));

        const t = roadmapTitle.toLowerCase();

        // ── FRONTEND ──
        const frontendQuestions: Question[] = [
            { id: 1, question: "What does HTML stand for?", options: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyper Transfer Markup Language", "Home Tool Markup Language"], correct: 0, explanation: "HTML (Hyper Text Markup Language) is the standard language for creating web pages." },
            { id: 2, question: "Which CSS property is used to change text color?", options: ["font-color", "text-color", "color", "background-color"], correct: 2, explanation: "The 'color' property in CSS is used to set the foreground color of text." },
            { id: 3, question: "What is the CSS Box Model?", options: ["A 3D modeling tool", "Content, padding, border, margin structure", "A grid system", "A flexbox concept"], correct: 1, explanation: "The CSS Box Model describes how elements are structured with content, padding, border, and margin." },
            { id: 4, question: "What does 'responsive design' mean?", options: ["Fast loading website", "UI that adapts to different screen sizes", "Backend responsiveness", "Quick API response"], correct: 1, explanation: "Responsive design ensures websites look and work well on all devices and screen sizes." },
            { id: 5, question: "What is Flexbox used for?", options: ["3D animations", "One-dimensional layout alignment", "Database queries", "Server routing"], correct: 1, explanation: "Flexbox is a CSS layout model for distributing space and aligning items in one dimension." },
            { id: 6, question: "What is CSS Grid?", options: ["A table element", "Two-dimensional layout system", "Image gallery plugin", "A JavaScript library"], correct: 1, explanation: "CSS Grid is a two-dimensional layout system for creating complex web layouts." },
            { id: 7, question: "What is the purpose of JavaScript in frontend?", options: ["Styling pages", "Adding interactivity and dynamic behavior", "Database management", "Server configuration"], correct: 1, explanation: "JavaScript adds interactivity, dynamic content, and behavior to web pages." },
            { id: 8, question: "What is DOM manipulation?", options: ["Database operations", "Changing HTML/CSS via JavaScript", "URL routing", "API calls"], correct: 1, explanation: "DOM manipulation means using JavaScript to dynamically change HTML structure and CSS styles." },
            { id: 9, question: "What is the purpose of 'alt' attribute in img tag?", options: ["Image title", "Accessibility text when image fails to load", "Image size", "Image source"], correct: 1, explanation: "The alt attribute provides alternative text for accessibility and when images fail to load." },
            { id: 10, question: "What is a CSS preprocessor?", options: ["Browser plugin", "Tool like SASS/LESS that extends CSS with variables and functions", "JavaScript bundler", "HTML compiler"], correct: 1, explanation: "CSS preprocessors like SASS add features like variables, nesting, and functions to CSS." },
            { id: 11, question: "What is Webpack?", options: ["CSS framework", "Module bundler for JavaScript applications", "Testing library", "Browser extension"], correct: 1, explanation: "Webpack bundles JavaScript modules and assets into optimized files for production." },
            { id: 12, question: "What is the difference between 'display: none' and 'visibility: hidden'?", options: ["No difference", "display:none removes element from layout, visibility:hidden keeps space", "visibility:hidden removes element", "Both same effect"], correct: 1, explanation: "display:none removes the element from layout entirely; visibility:hidden hides it but keeps the space." },
            { id: 13, question: "What is semantic HTML?", options: ["Styled HTML", "HTML elements that convey meaning about content structure", "HTML with JavaScript", "Compressed HTML"], correct: 1, explanation: "Semantic HTML uses meaningful tags like header, nav, main, article that describe content purpose." },
            { id: 14, question: "What is CORS?", options: ["CSS optimization", "Cross-Origin Resource Sharing — browser security mechanism", "Content rendering system", "Code optimization"], correct: 1, explanation: "CORS is a browser security feature controlling how web pages request resources from different origins." },
            { id: 15, question: "What is lazy loading?", options: ["Slow website", "Loading resources only when needed", "CSS animation", "Server caching"], correct: 1, explanation: "Lazy loading defers loading of non-critical resources until they are needed, improving performance." },
            { id: 16, question: "What is a media query in CSS?", options: ["Database query", "CSS rule applying styles based on device characteristics", "JavaScript API", "HTML attribute"], correct: 1, explanation: "Media queries apply different CSS styles based on screen size, orientation, and other device properties." },
            { id: 17, question: "What does 'position: absolute' mean in CSS?", options: ["Fixed to viewport", "Positioned relative to nearest positioned ancestor", "Normal document flow", "Centered element"], correct: 1, explanation: "position:absolute removes element from normal flow and positions it relative to its nearest positioned ancestor." },
            { id: 18, question: "What is the purpose of 'z-index'?", options: ["Zoom level", "Controls stacking order of overlapping elements", "Element size", "Animation speed"], correct: 1, explanation: "z-index controls which element appears on top when elements overlap each other." },
            { id: 19, question: "What is Web Accessibility (a11y)?", options: ["Website analytics", "Making websites usable for people with disabilities", "Auto-login feature", "Performance metric"], correct: 1, explanation: "Web accessibility ensures websites are usable by people with various disabilities using assistive technologies." },
            { id: 20, question: "What is the Critical Rendering Path?", options: ["Error handling path", "Steps browser takes to convert HTML/CSS/JS to pixels", "API request path", "Build process"], correct: 1, explanation: "The Critical Rendering Path is the sequence of steps browsers take to render a webpage on screen." },
        ];

        // ── BACKEND ──
        const backendQuestions: Question[] = [
            { id: 1, question: "What is a REST API?", options: ["Database type", "Architectural style using HTTP methods for web services", "Programming language", "Frontend framework"], correct: 1, explanation: "REST API uses HTTP methods (GET, POST, PUT, DELETE) to perform CRUD operations on resources." },
            { id: 2, question: "What is the difference between GET and POST requests?", options: ["No difference", "GET retrieves data, POST sends data to server", "POST retrieves, GET sends", "Both send data"], correct: 1, explanation: "GET requests retrieve data; POST requests send data to create or update resources on the server." },
            { id: 3, question: "What is middleware in Express.js?", options: ["Database layer", "Functions that execute during request-response cycle", "Frontend component", "CSS processor"], correct: 1, explanation: "Middleware functions have access to request, response objects and execute code in the request-response cycle." },
            { id: 4, question: "What is JWT (JSON Web Token)?", options: ["Database format", "Compact token for secure authentication and information exchange", "JavaScript library", "API endpoint"], correct: 1, explanation: "JWT is a compact, URL-safe token used for securely transmitting information between parties as JSON." },
            { id: 5, question: "What is the purpose of environment variables?", options: ["CSS variables", "Storing sensitive config outside source code", "JavaScript constants", "Database tables"], correct: 1, explanation: "Environment variables store sensitive data like API keys and database URLs outside of source code." },
            { id: 6, question: "What is SQL vs NoSQL?", options: ["Same thing", "SQL is relational/structured, NoSQL is flexible/document-based", "NoSQL is outdated", "SQL is faster always"], correct: 1, explanation: "SQL databases use structured tables with relationships; NoSQL offers flexible schemas for various data types." },
            { id: 7, question: "What is database indexing?", options: ["Counting records", "Data structure to speed up database queries", "Sorting data", "Deleting duplicates"], correct: 1, explanation: "Indexes speed up data retrieval by creating efficient lookup structures on database columns." },
            { id: 8, question: "What is HTTP status code 404?", options: ["Server error", "Resource not found", "Unauthorized", "Success"], correct: 1, explanation: "404 Not Found means the server cannot find the requested resource." },
            { id: 9, question: "What is rate limiting?", options: ["Speed testing", "Controlling number of requests a client can make", "Database optimization", "Cache clearing"], correct: 1, explanation: "Rate limiting restricts how many requests a client can make in a given time period to prevent abuse." },
            { id: 10, question: "What is the difference between authentication and authorization?", options: ["Same thing", "Authentication verifies identity, authorization checks permissions", "Authorization verifies identity", "Both verify identity"], correct: 1, explanation: "Authentication confirms who you are; authorization determines what you are allowed to do." },
            { id: 11, question: "What is an ORM?", options: ["Operating Resource Manager", "Object-Relational Mapping — maps objects to database tables", "Online Request Method", "Open Resource Model"], correct: 1, explanation: "ORM maps programming objects to database tables, allowing database operations using code instead of SQL." },
            { id: 12, question: "What is caching and why is it used?", options: ["Deleting old data", "Storing frequently accessed data for faster retrieval", "Compressing files", "Encrypting data"], correct: 1, explanation: "Caching stores frequently accessed data in fast storage to reduce database load and improve response time." },
            { id: 13, question: "What is a microservices architecture?", options: ["Small CSS files", "Application as suite of small, independently deployable services", "Micro frontend", "Mini database"], correct: 1, explanation: "Microservices break applications into small, independent services that communicate via APIs." },
            { id: 14, question: "What is ACID in databases?", options: ["Chemical property", "Atomicity, Consistency, Isolation, Durability — transaction properties", "A database type", "API standard"], correct: 1, explanation: "ACID properties ensure database transactions are processed reliably and data integrity is maintained." },
            { id: 15, question: "What is a message queue?", options: ["Email system", "Asynchronous communication between services via messages", "Database queue", "Request log"], correct: 1, explanation: "Message queues enable asynchronous communication between services, decoupling sender and receiver." },
            { id: 16, question: "What is WebSocket?", options: ["Web framework", "Protocol enabling real-time bidirectional communication", "REST alternative", "Database connection"], correct: 1, explanation: "WebSocket provides full-duplex communication channels over a single TCP connection for real-time apps." },
            { id: 17, question: "What is load balancing?", options: ["Database optimization", "Distributing traffic across multiple servers", "Code optimization", "Memory management"], correct: 1, explanation: "Load balancing distributes incoming network traffic across multiple servers to ensure high availability." },
            { id: 18, question: "What is SQL injection?", options: ["Adding SQL features", "Security attack inserting malicious SQL into queries", "Database migration", "Query optimization"], correct: 1, explanation: "SQL injection is an attack where malicious SQL code is inserted into queries to manipulate databases." },
            { id: 19, question: "What is the purpose of bcrypt?", options: ["Data compression", "Hashing passwords securely", "Encrypting API keys", "Compiling code"], correct: 1, explanation: "bcrypt is a password hashing function designed to be slow and resistant to brute-force attacks." },
            { id: 20, question: "What is horizontal vs vertical scaling?", options: ["No difference", "Horizontal adds more servers, vertical adds more power to existing", "Vertical adds servers", "Both same cost"], correct: 1, explanation: "Horizontal scaling adds more servers; vertical scaling upgrades existing server's CPU/RAM/storage." },
        ];

        // ── ANDROID ──
        const androidQuestions: Question[] = [
            { id: 1, question: "What language is primarily used for Android development?", options: ["Swift", "Kotlin and Java", "Python", "C#"], correct: 1, explanation: "Kotlin is the preferred language for Android development, with Java also widely supported." },
            { id: 2, question: "What is an Activity in Android?", options: ["Background service", "Single screen with UI that user interacts with", "Database class", "Network call"], correct: 1, explanation: "An Activity represents a single screen in an Android app that the user can interact with." },
            { id: 3, question: "What is the Android Manifest file?", options: ["Build file", "XML file declaring app components, permissions, and metadata", "Layout file", "Style resource"], correct: 1, explanation: "AndroidManifest.xml declares all app components, required permissions, and app metadata." },
            { id: 4, question: "What is Jetpack Compose?", options: ["Animation library", "Modern declarative UI toolkit for Android", "Database library", "Testing framework"], correct: 1, explanation: "Jetpack Compose is Android's modern toolkit for building native UI with declarative Kotlin code." },
            { id: 5, question: "What is a Fragment in Android?", options: ["Broken activity", "Reusable UI portion that can be hosted in activities", "Background task", "API call"], correct: 1, explanation: "A Fragment is a modular UI section that can be reused across multiple activities." },
            { id: 6, question: "What is ViewModel in Android Architecture?", options: ["UI layout file", "Holds UI-related data that survives configuration changes", "Database model", "Network model"], correct: 1, explanation: "ViewModel stores and manages UI-related data, surviving screen rotations and configuration changes." },
            { id: 7, question: "What is Room database?", options: ["Chat room feature", "Abstraction layer over SQLite for local database", "Cloud database", "UI component"], correct: 1, explanation: "Room provides an abstraction layer over SQLite, making database operations easier and type-safe." },
            { id: 8, question: "What is Retrofit used for?", options: ["UI animations", "Type-safe HTTP client for Android API calls", "Database ORM", "Image loading"], correct: 1, explanation: "Retrofit is a type-safe REST client for Android that simplifies API network calls." },
            { id: 9, question: "What is the difference between Service and IntentService?", options: ["No difference", "Service runs on main thread, IntentService on background thread", "IntentService on main thread", "Both background"], correct: 1, explanation: "Service runs on main thread by default; IntentService automatically runs on a background worker thread." },
            { id: 10, question: "What is LiveData?", options: ["Real-time database", "Observable data holder aware of lifecycle", "Live streaming library", "Network listener"], correct: 1, explanation: "LiveData is a lifecycle-aware observable data holder that only updates active UI components." },
            { id: 11, question: "What is Dependency Injection in Android?", options: ["Adding dependencies to build.gradle", "Design pattern providing objects their dependencies externally", "Injecting SQL queries", "Adding SDK libraries"], correct: 1, explanation: "Dependency Injection provides objects with their dependencies from outside, improving testability and modularity." },
            { id: 12, question: "What is Hilt?", options: ["UI component", "Dependency injection library built on Dagger for Android", "Animation tool", "Database library"], correct: 1, explanation: "Hilt is Google's recommended DI library for Android, simplifying Dagger dependency injection." },
            { id: 13, question: "What is the purpose of RecyclerView?", options: ["Video player", "Efficiently displaying large scrollable lists", "Image carousel", "Tab navigation"], correct: 1, explanation: "RecyclerView efficiently displays large lists by recycling view items that scroll off screen." },
            { id: 14, question: "What is Coroutines in Kotlin?", options: ["Animation library", "Lightweight concurrency framework for async programming", "Database tool", "UI component"], correct: 1, explanation: "Kotlin Coroutines simplify asynchronous programming by allowing sequential-looking async code." },
            { id: 15, question: "What is Navigation Component?", options: ["GPS feature", "Jetpack library for implementing in-app navigation", "URL router", "Screen transition CSS"], correct: 1, explanation: "Navigation Component simplifies implementing navigation between destinations in Android apps." },
            { id: 16, question: "What is APK?", options: ["Android Project Kit", "Android Package — installable app file format", "App Performance Key", "Android Protocol Kit"], correct: 1, explanation: "APK (Android Package) is the file format used to distribute and install Android applications." },
            { id: 17, question: "What is ProGuard/R8?", options: ["Code editor", "Code shrinker, obfuscator, and optimizer for Android", "Dependency manager", "Testing tool"], correct: 1, explanation: "R8/ProGuard shrinks, obfuscates, and optimizes Android app code for smaller APK size." },
            { id: 18, question: "What is Firebase?", options: ["Android IDE", "Google's mobile platform for backend services", "UI library", "Testing framework"], correct: 1, explanation: "Firebase provides backend services like auth, database, analytics, and crash reporting for mobile apps." },
            { id: 19, question: "What is the difference between Serializable and Parcelable?", options: ["No difference", "Parcelable is Android-optimized and faster than Java Serializable", "Serializable is faster", "Both same performance"], correct: 1, explanation: "Parcelable is Android's optimized serialization that's significantly faster than Java's Serializable." },
            { id: 20, question: "What is WorkManager?", options: ["Task manager app", "API for scheduling deferrable background work", "Thread manager", "Process manager"], correct: 1, explanation: "WorkManager schedules deferrable, guaranteed background work that runs even after app restarts." },
        ];

        // ── DEVOPS ──
        const devopsQuestions: Question[] = [
            { id: 1, question: "What is CI/CD?", options: ["Code Inspection/Code Deploy", "Continuous Integration/Continuous Delivery pipeline", "Central Index/Central Data", "Component Interface/Component Design"], correct: 1, explanation: "CI/CD automates building, testing, and deploying code changes to deliver software faster and reliably." },
            { id: 2, question: "What is Docker?", options: ["Programming language", "Platform for containerizing applications", "Cloud provider", "Version control tool"], correct: 1, explanation: "Docker packages applications and dependencies into containers that run consistently across environments." },
            { id: 3, question: "What is Kubernetes?", options: ["Docker alternative", "Container orchestration platform for managing containerized apps", "CI/CD tool", "Monitoring tool"], correct: 1, explanation: "Kubernetes automates deployment, scaling, and management of containerized applications." },
            { id: 4, question: "What is Infrastructure as Code (IaC)?", options: ["Writing code documentation", "Managing infrastructure through code/config files", "Code performance metric", "Infrastructure monitoring"], correct: 1, explanation: "IaC manages and provisions infrastructure through code files instead of manual processes." },
            { id: 5, question: "What is the difference between a container and a VM?", options: ["No difference", "Containers share OS kernel, VMs have full OS — containers are lighter", "VMs are lighter", "Containers have full OS"], correct: 1, explanation: "Containers share the host OS kernel making them lightweight; VMs run full guest OS making them heavier." },
            { id: 6, question: "What is Terraform?", options: ["Cloud provider", "Infrastructure as Code tool for provisioning cloud resources", "Container tool", "Monitoring platform"], correct: 1, explanation: "Terraform provisions and manages infrastructure across cloud providers using declarative config files." },
            { id: 7, question: "What is Ansible?", options: ["Monitoring tool", "Agentless automation tool for configuration management", "Container platform", "CI/CD tool"], correct: 1, explanation: "Ansible automates configuration management, application deployment, and task automation agentlessly." },
            { id: 8, question: "What is a Kubernetes Pod?", options: ["Container image", "Smallest deployable unit containing one or more containers", "Cluster node", "Service endpoint"], correct: 1, explanation: "A Pod is Kubernetes' smallest deployable unit, wrapping one or more containers with shared storage/network." },
            { id: 9, question: "What is a reverse proxy?", options: ["Backward DNS lookup", "Server that forwards client requests to backend servers", "Database proxy", "CDN server"], correct: 1, explanation: "A reverse proxy receives client requests and forwards them to appropriate backend servers." },
            { id: 10, question: "What is the purpose of monitoring in DevOps?", options: ["Code review", "Tracking system health, performance, and detecting issues proactively", "Documentation", "Security scanning"], correct: 1, explanation: "Monitoring tracks system metrics, logs, and alerts to detect and resolve issues before users are impacted." },
            { id: 11, question: "What is Git branching strategy?", options: ["CSS branch selector", "Workflow for managing code branches in version control", "Database branch", "Network branch"], correct: 1, explanation: "Branching strategies like GitFlow define how teams create, merge, and manage code branches." },
            { id: 12, question: "What is a Dockerfile?", options: ["Docker manual", "Script of instructions to build a Docker image", "Container registry", "Deployment config"], correct: 1, explanation: "A Dockerfile contains instructions that Docker uses to automatically build a container image." },
            { id: 13, question: "What is Helm in Kubernetes?", options: ["Kubernetes dashboard", "Package manager for Kubernetes applications", "Monitoring tool", "Security scanner"], correct: 1, explanation: "Helm is the package manager for Kubernetes, managing applications as reusable charts." },
            { id: 14, question: "What is blue-green deployment?", options: ["Color-themed UI", "Running two identical environments to enable zero-downtime deployments", "Testing strategy", "Database migration"], correct: 1, explanation: "Blue-green deployment maintains two identical environments — switch traffic to new version with zero downtime." },
            { id: 15, question: "What is observability?", options: ["Code visibility", "Ability to understand system state through metrics, logs, and traces", "UI testing", "Security audit"], correct: 1, explanation: "Observability uses metrics, logs, and distributed traces to understand what's happening inside systems." },
            { id: 16, question: "What is a service mesh?", options: ["Network firewall", "Infrastructure layer handling service-to-service communication", "Database cluster", "API gateway"], correct: 1, explanation: "A service mesh manages service-to-service communication with features like load balancing and observability." },
            { id: 17, question: "What is Auto Scaling?", options: ["Font scaling", "Automatically adjusting server capacity based on demand", "Image scaling", "Code optimization"], correct: 1, explanation: "Auto Scaling automatically adds or removes servers based on traffic to maintain performance and reduce cost." },
            { id: 18, question: "What is a CDN?", options: ["Code Distribution Network", "Content Delivery Network — serves content from servers closest to users", "Central Database Node", "Continuous Deploy Network"], correct: 1, explanation: "CDN distributes content across geographically distributed servers for faster delivery to users." },
            { id: 19, question: "What is the 12-Factor App methodology?", options: ["12-step programming", "Best practices for building scalable, maintainable cloud-native apps", "12 programming languages", "12 deployment steps"], correct: 1, explanation: "12-Factor App defines 12 best practices for building modern, scalable, cloud-native applications." },
            { id: 20, question: "What is chaos engineering?", options: ["Messy code", "Intentionally injecting failures to test system resilience", "Random deployments", "Unstructured testing"], correct: 1, explanation: "Chaos engineering deliberately introduces failures to discover weaknesses before they cause real outages." },
        ];

        // ── MACHINE LEARNING ──
        const mlQuestions: Question[] = [
            { id: 1, question: "What is supervised learning?", options: ["Unsupervised training", "Learning from labeled data with input-output pairs", "Reinforcement learning", "Self-learning AI"], correct: 1, explanation: "Supervised learning trains models on labeled datasets where correct answers are provided." },
            { id: 2, question: "What is overfitting?", options: ["Too little training", "Model memorizes training data but fails on new data", "Perfect model", "Fast training"], correct: 1, explanation: "Overfitting occurs when a model learns training data too well, including noise, and fails to generalize." },
            { id: 3, question: "What is the purpose of train/test split?", options: ["Data backup", "Evaluating model performance on unseen data", "Data augmentation", "Feature selection"], correct: 1, explanation: "Train/test split evaluates how well a model generalizes to new, unseen data." },
            { id: 4, question: "What is gradient descent?", options: ["Downhill hiking algorithm", "Optimization algorithm minimizing loss by updating weights", "Data preprocessing", "Feature engineering"], correct: 1, explanation: "Gradient descent iteratively updates model parameters to minimize the loss function." },
            { id: 5, question: "What is a neural network?", options: ["Brain transplant tech", "Layers of interconnected nodes inspired by biological neurons", "Simple regression", "Decision tree variant"], correct: 1, explanation: "Neural networks consist of layers of interconnected nodes that learn patterns from data." },
            { id: 6, question: "What is the difference between classification and regression?", options: ["No difference", "Classification predicts categories, regression predicts continuous values", "Regression predicts categories", "Both predict numbers"], correct: 1, explanation: "Classification outputs discrete class labels; regression outputs continuous numerical values." },
            { id: 7, question: "What is cross-validation?", options: ["Cross-language testing", "Technique to assess model generalization using multiple train/test splits", "Data cleaning", "Feature scaling"], correct: 1, explanation: "Cross-validation evaluates model performance by training and testing on multiple data splits." },
            { id: 8, question: "What is feature engineering?", options: ["Software feature planning", "Transforming raw data into meaningful features for ML models", "Model architecture design", "Hyperparameter tuning"], correct: 1, explanation: "Feature engineering creates meaningful input features from raw data to improve model performance." },
            { id: 9, question: "What is a confusion matrix?", options: ["Unclear diagram", "Table showing correct and incorrect predictions for classification", "Loss function", "Accuracy metric only"], correct: 1, explanation: "A confusion matrix shows true positives, false positives, true negatives, and false negatives." },
            { id: 10, question: "What is the bias-variance tradeoff?", options: ["Data bias handling", "Balance between underfitting (high bias) and overfitting (high variance)", "Model speed vs accuracy", "Training vs inference"], correct: 1, explanation: "High bias causes underfitting; high variance causes overfitting — finding the balance is key." },
            { id: 11, question: "What is transfer learning?", options: ["Moving files between servers", "Using pre-trained model weights as starting point for new tasks", "Database transfer", "Code migration"], correct: 1, explanation: "Transfer learning reuses a pre-trained model's knowledge for a new but related task." },
            { id: 12, question: "What is a random forest?", options: ["Nature dataset", "Ensemble of decision trees trained on random subsets", "Neural network type", "Clustering algorithm"], correct: 1, explanation: "Random forest builds multiple decision trees and combines their outputs for better accuracy." },
            { id: 13, question: "What is unsupervised learning?", options: ["Learning without computer", "Finding patterns in unlabeled data", "Learning with labels", "Reinforcement learning"], correct: 1, explanation: "Unsupervised learning finds hidden patterns or groupings in data without labeled examples." },
            { id: 14, question: "What is regularization?", options: ["Making code regular", "Technique to prevent overfitting by penalizing complex models", "Data normalization", "Model compression"], correct: 1, explanation: "Regularization adds a penalty for complexity to prevent models from overfitting training data." },
            { id: 15, question: "What is a hyperparameter?", options: ["Super parameter", "Configuration set before training that controls learning process", "Learned model weight", "Output prediction"], correct: 1, explanation: "Hyperparameters are configuration values set before training, like learning rate and number of layers." },
            { id: 16, question: "What is NLP (Natural Language Processing)?", options: ["Network Layer Protocol", "AI field enabling computers to understand human language", "New Learning Platform", "Neural Layer Processing"], correct: 1, explanation: "NLP enables computers to understand, interpret, and generate human language text and speech." },
            { id: 17, question: "What is a CNN (Convolutional Neural Network)?", options: ["Computer Network Node", "Neural network specialized for image and visual data processing", "Content Neural Network", "Clustered Node Network"], correct: 1, explanation: "CNNs use convolutional layers to automatically learn spatial features from images." },
            { id: 18, question: "What is the purpose of activation functions?", options: ["Start the model", "Introduce non-linearity enabling learning of complex patterns", "Speed up training", "Reduce model size"], correct: 1, explanation: "Activation functions introduce non-linearity so neural networks can learn complex, non-linear patterns." },
            { id: 19, question: "What is data augmentation?", options: ["Adding more servers", "Artificially expanding training data with transformations", "Data deletion", "Feature reduction"], correct: 1, explanation: "Data augmentation creates new training examples by applying transformations like rotation, flip, crop." },
            { id: 20, question: "What is model deployment?", options: ["Creating models", "Making trained ML model available for real-world predictions", "Training process", "Data collection"], correct: 1, explanation: "Model deployment makes a trained model accessible via API or application for real-world use." },
        ];

        // ── CYBERSECURITY ──
        const cyberQuestions: Question[] = [
            { id: 1, question: "What is a firewall?", options: ["Physical wall", "Network security system monitoring and controlling traffic", "Antivirus software", "VPN service"], correct: 1, explanation: "A firewall monitors and controls incoming/outgoing network traffic based on security rules." },
            { id: 2, question: "What is phishing?", options: ["Fishing hobby", "Fraudulent attempt to steal sensitive info by impersonating trusted entities", "Network scanning", "Password cracking"], correct: 1, explanation: "Phishing tricks users into revealing sensitive data by impersonating legitimate organizations." },
            { id: 3, question: "What is encryption?", options: ["Data deletion", "Converting data into coded format readable only with decryption key", "Data compression", "Password storage"], correct: 1, explanation: "Encryption converts plaintext into ciphertext that can only be read with the correct decryption key." },
            { id: 4, question: "What is SQL injection?", options: ["Database optimization", "Attack inserting malicious SQL to manipulate databases", "SQL performance tuning", "Database backup"], correct: 1, explanation: "SQL injection inserts malicious SQL code into queries to bypass authentication or steal data." },
            { id: 5, question: "What is a DDoS attack?", options: ["Data Download of Systems", "Overwhelming a server with traffic to make it unavailable", "Distributed Data Operations", "Direct DNS Override"], correct: 1, explanation: "DDoS (Distributed Denial of Service) floods servers with traffic from multiple sources to cause downtime." },
            { id: 6, question: "What is the principle of least privilege?", options: ["Giving everyone full access", "Granting users only the minimum permissions necessary", "Admin access for all", "No access policy"], correct: 1, explanation: "Least privilege limits user permissions to only what's necessary, reducing attack surface." },
            { id: 7, question: "What is two-factor authentication (2FA)?", options: ["Two passwords", "Requiring two forms of verification to access an account", "Two usernames", "Double encryption"], correct: 1, explanation: "2FA requires something you know (password) plus something you have (phone/token) for access." },
            { id: 8, question: "What is a man-in-the-middle attack?", options: ["Employee espionage", "Attacker secretly intercepts communication between two parties", "Network monitoring", "Firewall bypass"], correct: 1, explanation: "MITM attacks secretly intercept and potentially alter communications between two parties." },
            { id: 9, question: "What is penetration testing?", options: ["Software testing", "Authorized simulated cyberattack to find vulnerabilities", "Network speed test", "Database testing"], correct: 1, explanation: "Penetration testing simulates real attacks to find and fix security vulnerabilities before attackers do." },
            { id: 10, question: "What is a zero-day vulnerability?", options: ["New software release", "Unknown security flaw with no patch available yet", "Zero importance bug", "Day-one software issue"], correct: 1, explanation: "Zero-day vulnerabilities are unknown flaws that attackers can exploit before developers create patches." },
            { id: 11, question: "What is hashing vs encryption?", options: ["Same thing", "Hashing is one-way irreversible, encryption is reversible with key", "Encryption is one-way", "Both are reversible"], correct: 1, explanation: "Hashing is one-way (can't reverse), encryption is two-way (can decrypt with key)." },
            { id: 12, question: "What is a VPN?", options: ["Very Private Network", "Virtual Private Network encrypting internet traffic", "Visual Protocol Network", "Verified Private Node"], correct: 1, explanation: "VPN creates encrypted tunnel for internet traffic, masking IP address and securing data." },
            { id: 13, question: "What is social engineering?", options: ["Social media marketing", "Manipulating people psychologically to reveal confidential information", "Network engineering", "UI design"], correct: 1, explanation: "Social engineering exploits human psychology rather than technical vulnerabilities to gain access." },
            { id: 14, question: "What is HTTPS vs HTTP?", options: ["No difference", "HTTPS encrypts data in transit using TLS/SSL, HTTP does not", "HTTP is faster only", "HTTPS is only for banks"], correct: 1, explanation: "HTTPS encrypts data between browser and server using TLS, preventing interception." },
            { id: 15, question: "What is a security audit?", options: ["Financial audit", "Systematic evaluation of security policies and controls", "Code review only", "Performance testing"], correct: 1, explanation: "Security audit evaluates an organization's security posture, policies, and controls against threats." },
            { id: 16, question: "What is ransomware?", options: ["Free software", "Malware encrypting victim's data and demanding payment for decryption", "Antivirus software", "Data backup tool"], correct: 1, explanation: "Ransomware encrypts victim files and demands ransom payment to restore access." },
            { id: 17, question: "What is XSS (Cross-Site Scripting)?", options: ["CSS framework", "Injecting malicious scripts into websites viewed by other users", "Cross-server communication", "Styling attack"], correct: 1, explanation: "XSS injects malicious client-side scripts into web pages to steal data or hijack sessions." },
            { id: 18, question: "What is network segmentation?", options: ["Internet speed division", "Dividing network into subnetworks to contain breaches", "IP address splitting", "Bandwidth allocation"], correct: 1, explanation: "Network segmentation limits breach impact by isolating network sections from each other." },
            { id: 19, question: "What is threat modeling?", options: ["3D security model", "Identifying and prioritizing potential security threats to a system", "Antivirus modeling", "Network diagram"], correct: 1, explanation: "Threat modeling identifies what can go wrong and prioritizes security controls accordingly." },
            { id: 20, question: "What is the CIA triad in security?", options: ["Central Intelligence Agency", "Confidentiality, Integrity, Availability — core security principles", "Code, Interface, Architecture", "Control, Inspect, Audit"], correct: 1, explanation: "CIA triad — Confidentiality (privacy), Integrity (accuracy), Availability (access) — are foundational security goals." },
        ];

        // ── BLOCKCHAIN ──
        const blockchainQuestions: Question[] = [
            { id: 1, question: "What is a blockchain?", options: ["Database type", "Distributed immutable ledger recording transactions across nodes", "Cryptocurrency wallet", "Mining software"], correct: 1, explanation: "Blockchain is a distributed ledger that records transactions in linked blocks across a network of computers." },
            { id: 2, question: "What is a smart contract?", options: ["Legal document", "Self-executing code stored on blockchain with predefined rules", "Digital signature", "Wallet address"], correct: 1, explanation: "Smart contracts automatically execute when predefined conditions are met, without intermediaries." },
            { id: 3, question: "What is consensus mechanism?", options: ["Voting system", "Method by which blockchain nodes agree on valid transactions", "Mining algorithm", "Wallet encryption"], correct: 1, explanation: "Consensus mechanisms ensure all nodes agree on the blockchain's state without central authority." },
            { id: 4, question: "What is Proof of Work (PoW)?", options: ["Employment proof", "Consensus requiring miners to solve complex mathematical puzzles", "Transaction proof", "Identity verification"], correct: 1, explanation: "PoW requires computational work (solving puzzles) to validate transactions and create new blocks." },
            { id: 5, question: "What is Proof of Stake (PoS)?", options: ["Stock proof", "Consensus where validators stake tokens as collateral to validate", "Mining proof", "Work certificate"], correct: 1, explanation: "PoS selects validators based on staked tokens instead of computational work, using less energy." },
            { id: 6, question: "What is a cryptocurrency wallet?", options: ["Physical wallet", "Software storing private/public keys to access blockchain assets", "Bank account", "Exchange account"], correct: 1, explanation: "Crypto wallets store cryptographic keys that prove ownership and enable transactions on blockchain." },
            { id: 7, question: "What is gas in Ethereum?", options: ["Fuel for mining", "Fee paid for computational resources to execute transactions", "Network speed", "Token type"], correct: 1, explanation: "Gas is the fee paid in ETH for computational resources required to execute Ethereum transactions." },
            { id: 8, question: "What is DeFi?", options: ["Default Finance", "Decentralized Finance — financial services without traditional intermediaries", "Digital Finance", "Defined Finance"], correct: 1, explanation: "DeFi provides financial services like lending and trading using smart contracts without banks." },
            { id: 9, question: "What is an NFT?", options: ["Network File Transfer", "Non-Fungible Token representing unique digital ownership on blockchain", "New Financial Token", "Network Function Tool"], correct: 1, explanation: "NFTs are unique digital tokens on blockchain proving ownership of a specific digital asset." },
            { id: 10, question: "What is Solidity?", options: ["Solid state drive", "Programming language for writing Ethereum smart contracts", "Blockchain database", "Crypto wallet"], correct: 1, explanation: "Solidity is an object-oriented language designed specifically for writing Ethereum smart contracts." },
            { id: 11, question: "What is a private key in blockchain?", options: ["Password", "Secret cryptographic key proving ownership and signing transactions", "Public address", "Node ID"], correct: 1, explanation: "Private key is a secret number that proves ownership of blockchain assets and signs transactions." },
            { id: 12, question: "What is a DAO?", options: ["Data Access Object", "Decentralized Autonomous Organization governed by smart contracts", "Digital Asset Owner", "Distributed App Operation"], correct: 1, explanation: "DAO is an organization governed by smart contracts and member votes rather than central authority." },
            { id: 13, question: "What is blockchain immutability?", options: ["Unchangeable prices", "Once data is recorded it cannot be altered or deleted", "Fast transactions", "Low fees"], correct: 1, explanation: "Immutability means recorded blockchain data is permanent and tamper-proof due to cryptographic linking." },
            { id: 14, question: "What is a hash function in blockchain?", options: ["Password encoder", "Function converting data of any size into fixed-length string", "Encryption method", "Mining tool"], correct: 1, explanation: "Hash functions create unique fixed-length fingerprints of data, used to link blockchain blocks." },
            { id: 15, question: "What is Layer 2 in blockchain?", options: ["Second blockchain", "Protocol built on top of base blockchain to improve scalability", "Second layer security", "Backup chain"], correct: 1, explanation: "Layer 2 solutions process transactions off the main chain and batch settle them, improving speed and cost." },
            { id: 16, question: "What is Web3?", options: ["Third version of internet HTML", "Decentralized internet built on blockchain technology", "Web 3.0 browser", "Third web framework"], correct: 1, explanation: "Web3 envisions a decentralized internet where users own their data and assets via blockchain." },
            { id: 17, question: "What is a blockchain node?", options: ["Network router", "Computer participating in blockchain network maintaining copy of ledger", "Mining machine", "Smart contract"], correct: 1, explanation: "Nodes are computers that participate in the blockchain network, validating and storing transaction history." },
            { id: 18, question: "What is token vs coin?", options: ["No difference", "Coins have own blockchain, tokens built on existing blockchains", "Tokens have own blockchain", "Both are identical"], correct: 1, explanation: "Coins (like Bitcoin, ETH) run on their own blockchain; tokens are built on existing blockchains like Ethereum." },
            { id: 19, question: "What is a 51% attack?", options: ["51% tax on crypto", "When entity controls majority of network hash rate to manipulate blockchain", "Majority vote", "Network upgrade"], correct: 1, explanation: "51% attack occurs when one entity controls majority of mining power, enabling transaction manipulation." },
            { id: 20, question: "What is cross-chain interoperability?", options: ["Cross-platform coding", "Ability for different blockchains to communicate and exchange assets", "Multi-signature wallet", "Cross-browser support"], correct: 1, explanation: "Cross-chain interoperability enables different blockchains to transfer assets and data between each other." },
        ];

        // ── DATA ANALYST ──
        const dataAnalystQuestions: Question[] = [
            { id: 1, question: "What is the difference between data analysis and data science?", options: ["Same thing", "Analysis focuses on current data insights, science builds predictive models", "Science is simpler", "Analysis uses ML only"], correct: 1, explanation: "Data analysis interprets existing data for insights; data science builds models for future predictions." },
            { id: 2, question: "What is a pivot table?", options: ["Rotating chart", "Data summarization tool that reorganizes and aggregates data", "SQL table type", "Excel formula"], correct: 1, explanation: "Pivot tables summarize, sort, and aggregate large datasets to find patterns and insights." },
            { id: 3, question: "What does ETL stand for?", options: ["Extract Test Launch", "Extract, Transform, Load — data pipeline process", "Edit, Transfer, Log", "Evaluate, Track, Learn"], correct: 1, explanation: "ETL extracts data from sources, transforms it for analysis, and loads it into a target system." },
            { id: 4, question: "What is data normalization?", options: ["Making data normal-looking", "Scaling data to standard range to remove bias from magnitude", "Removing null values", "Adding more data"], correct: 1, explanation: "Normalization scales features to comparable ranges so no single feature dominates analysis." },
            { id: 5, question: "What is a KPI?", options: ["Keyboard Performance Index", "Key Performance Indicator — measurable business success metric", "Knowledge Processing Interface", "Key Program Integration"], correct: 1, explanation: "KPIs are quantifiable metrics used to evaluate success in achieving business objectives." },
            { id: 6, question: "What is the purpose of data visualization?", options: ["Make data look pretty", "Communicate insights from data clearly through visual representations", "Store data efficiently", "Process data faster"], correct: 1, explanation: "Data visualization presents complex data in visual form to make patterns and insights easily understandable." },
            { id: 7, question: "What is a null value in data?", options: ["Zero value", "Missing or unknown data represented as absent", "Empty string", "Negative number"], correct: 1, explanation: "Null represents the absence of a value — data that is missing, unknown, or not applicable." },
            { id: 8, question: "What is correlation vs causation?", options: ["Same thing", "Correlation shows relationship, causation means one directly causes other", "Causation shows relationship", "Both prove cause"], correct: 1, explanation: "Correlation shows two variables move together; causation proves one directly causes the other." },
            { id: 9, question: "What is Power BI used for?", options: ["Power management", "Business intelligence and interactive data visualization tool", "Database management", "Code editor"], correct: 1, explanation: "Power BI is Microsoft's tool for creating interactive dashboards and visualizations from data sources." },
            { id: 10, question: "What is the difference between mean, median, and mode?", options: ["All same", "Mean is average, median is middle value, mode is most frequent", "Median is average", "Mode is middle value"], correct: 1, explanation: "Mean is the average, median is the middle value when sorted, mode is the most frequently occurring value." },
            { id: 11, question: "What is SQL GROUP BY?", options: ["Sort data", "Groups rows with same values for aggregate functions", "Join tables", "Filter rows"], correct: 1, explanation: "GROUP BY groups rows that have the same values in specified columns for aggregate calculations." },
            { id: 12, question: "What is an outlier?", options: ["Outside data source", "Data point significantly different from other observations", "Missing data", "Duplicate record"], correct: 1, explanation: "Outliers are data points that lie far outside the normal distribution of data." },
            { id: 13, question: "What is A/B testing?", options: ["Alphabet testing", "Comparing two versions to determine which performs better statistically", "Two-step testing", "Before/after analysis"], correct: 1, explanation: "A/B testing compares two variants by showing them to different user groups to measure performance." },
            { id: 14, question: "What is a data warehouse?", options: ["Physical storage facility", "Central repository storing integrated data from multiple sources for analysis", "Real-time database", "Data backup system"], correct: 1, explanation: "Data warehouses store large amounts of structured historical data optimized for analysis and reporting." },
            { id: 15, question: "What is pandas in Python?", options: ["Animal library", "Python library for data manipulation and analysis with DataFrames", "Visualization library", "Machine learning library"], correct: 1, explanation: "Pandas provides DataFrame and Series data structures for efficient data manipulation in Python." },
            { id: 16, question: "What is data cleaning?", options: ["Deleting all data", "Identifying and fixing errors, inconsistencies in datasets", "Sorting data", "Compressing data"], correct: 1, explanation: "Data cleaning fixes errors, handles missing values, and removes inconsistencies to ensure data quality." },
            { id: 17, question: "What is a dashboard?", options: ["Car dashboard", "Visual display of key metrics and data in real-time", "Data table", "Report document"], correct: 1, explanation: "Dashboards provide real-time visual overview of key metrics to monitor business performance." },
            { id: 18, question: "What is standard deviation?", options: ["Average value", "Measure of data spread around the mean", "Minimum value", "Maximum value"], correct: 1, explanation: "Standard deviation measures how spread out data points are from the mean value." },
            { id: 19, question: "What is Tableau used for?", options: ["Database management", "Interactive data visualization and business intelligence platform", "Statistical analysis only", "ETL processing"], correct: 1, explanation: "Tableau creates interactive visualizations and dashboards to help analyze and understand data." },
            { id: 20, question: "What is data governance?", options: ["Government data", "Framework ensuring data quality, security, and proper management", "Data law compliance only", "Database administration"], correct: 1, explanation: "Data governance establishes policies for data quality, security, privacy, and proper usage across organizations." },
        ];

        // ── FULLSTACK ──
        const fullstackQuestions: Question[] = [
            { id: 1, question: "What does 'full stack' development mean?", options: ["Only frontend", "Working on both frontend and backend of web applications", "Only backend", "Database only"], correct: 1, explanation: "Full stack developers work on both the client-side (frontend) and server-side (backend) of applications." },
            { id: 2, question: "What is the MERN stack?", options: ["Multiple Enterprise Resource Network", "MongoDB, Express, React, Node.js", "MySQL, Express, Redux, Node", "MongoDB, Ember, React, Nginx"], correct: 1, explanation: "MERN stack is MongoDB, Express.js, React, and Node.js — a popular full stack JavaScript combination." },
            { id: 3, question: "What is SSR (Server-Side Rendering)?", options: ["Slow Server Response", "Rendering HTML on server before sending to client", "Static Site Rendering", "Single Screen Rendering"], correct: 1, explanation: "SSR generates HTML on the server for each request, improving SEO and initial page load." },
            { id: 4, question: "What is the purpose of an API?", options: ["Application Password Interface", "Enables communication between different software applications", "Automatic Process Integration", "Application Performance Index"], correct: 1, explanation: "APIs define how software applications communicate and exchange data with each other." },
            { id: 5, question: "What is session vs token-based authentication?", options: ["No difference", "Sessions store data server-side, tokens are self-contained client-side", "Tokens are server-side", "Sessions are client-side"], correct: 1, explanation: "Sessions store user data on server; tokens (JWT) are self-contained and validated without server storage." },
            { id: 6, question: "What is GraphQL vs REST?", options: ["Same thing", "GraphQL lets clients request exactly needed data, REST has fixed endpoints", "REST is more flexible", "GraphQL is older"], correct: 1, explanation: "GraphQL allows clients to request exactly the data they need; REST returns fixed data structures." },
            { id: 7, question: "What is connection pooling in databases?", options: ["Swimming pool analogy", "Reusing database connections to avoid overhead of creating new ones", "Multiple databases", "Database clustering"], correct: 1, explanation: "Connection pooling maintains a pool of reusable database connections to improve performance." },
            { id: 8, question: "What is CORS and why does it matter?", options: ["CSS optimization", "Browser security restricting cross-origin requests — needs backend config", "Code optimization", "Server caching"], correct: 1, explanation: "CORS is a browser security mechanism requiring servers to explicitly allow cross-origin requests." },
            { id: 9, question: "What is the MVC architecture pattern?", options: ["Multi-View Compiler", "Model-View-Controller separating data, UI, and logic", "Mobile View Component", "Minimum Viable Code"], correct: 1, explanation: "MVC separates application into Model (data), View (UI), and Controller (logic) for better organization." },
            { id: 10, question: "What is deployment vs development environment?", options: ["No difference", "Dev is for coding/testing, production serves real users", "Production is for testing", "Dev is for users"], correct: 1, explanation: "Development environment is for coding and testing; production environment serves real end users." },
            { id: 11, question: "What is WebSocket used for in full stack?", options: ["Static websites", "Real-time bidirectional communication like chat apps", "File uploads", "Database connections"], correct: 1, explanation: "WebSockets enable real-time features like chat, live notifications, and collaborative tools." },
            { id: 12, question: "What is the purpose of nginx in full stack?", options: ["CSS preprocessor", "Web server and reverse proxy for serving apps and load balancing", "Database tool", "Testing framework"], correct: 1, explanation: "Nginx serves as web server, reverse proxy, and load balancer in production deployments." },
            { id: 13, question: "What is Docker's role in full stack development?", options: ["Code editor", "Containerizing apps for consistent environments across dev and prod", "Database manager", "Frontend tool"], correct: 1, explanation: "Docker ensures applications run consistently across development, testing, and production environments." },
            { id: 14, question: "What is caching strategy (Redis) in full stack?", options: ["File storage", "In-memory data store for caching frequent queries and sessions", "Message queue only", "Database backup"], correct: 1, explanation: "Redis caches frequently accessed data in memory for fast retrieval, reducing database load." },
            { id: 15, question: "What is the difference between monolithic and microservices architecture?", options: ["No difference", "Monolith is single deployable unit, microservices are independent services", "Microservices are one unit", "Monolith uses containers"], correct: 1, explanation: "Monolith deploys everything together; microservices deploy independent services that communicate via APIs." },
            { id: 16, question: "What is TypeScript and why use it?", options: ["New programming language", "Typed superset of JavaScript catching errors at compile time", "TypeScript replaces JavaScript", "Only for backend"], correct: 1, explanation: "TypeScript adds static types to JavaScript, catching errors early and improving code quality." },
            { id: 17, question: "What is CI/CD pipeline in full stack?", options: ["Code inspection tool", "Automated testing and deployment process from code to production", "Code formatting tool", "Version control"], correct: 1, explanation: "CI/CD automates testing code changes and deploying them to production reliably and quickly." },
            { id: 18, question: "What is rate limiting and why implement it?", options: ["Speed testing", "Preventing API abuse by limiting requests per time period", "Caching strategy", "Load balancing"], correct: 1, explanation: "Rate limiting prevents abuse, DDoS attacks, and ensures fair API usage across all clients." },
            { id: 19, question: "What is the purpose of environment variables?", options: ["JavaScript variables", "Storing config values and secrets outside source code", "CSS variables", "Database variables"], correct: 1, explanation: "Environment variables keep sensitive config like API keys and database URLs out of source code." },
            { id: 20, question: "What is technical debt?", options: ["Money owed for software", "Cost of future rework from choosing quick solutions over better ones", "Unpaid server bills", "Bug count"], correct: 1, explanation: "Technical debt accumulates when quick shortcuts are taken instead of proper solutions, requiring future rework." },
        ];

        // ── BI ANALYST ──
        const biAnalystQuestions: Question[] = [
            { id: 1, question: "What is Business Intelligence (BI)?", options: ["Business management degree", "Strategies and technologies for analyzing business data for decisions", "Financial intelligence", "AI for business"], correct: 1, explanation: "BI uses data analysis tools and processes to help organizations make informed business decisions." },
            { id: 2, question: "What is OLAP vs OLTP?", options: ["Same thing", "OLAP is analytical processing, OLTP is transactional processing", "OLTP is analytical", "Both are databases"], correct: 1, explanation: "OLTP handles daily transactions; OLAP handles complex analytical queries on historical data." },
            { id: 3, question: "What is a star schema in data warehousing?", options: ["Star-shaped diagram", "Central fact table surrounded by dimension tables", "Star rating system", "Network topology"], correct: 1, explanation: "Star schema has a central fact table (metrics) connected to dimension tables (categories) for fast queries." },
            { id: 4, question: "What is a fact table vs dimension table?", options: ["No difference", "Fact table has measurable metrics, dimension table has descriptive attributes", "Dimension has metrics", "Both are same"], correct: 1, explanation: "Fact tables store measurable business metrics; dimension tables store descriptive context like time and location." },
            { id: 5, question: "What is DAX in Power BI?", options: ["Data Audio Exchange", "Data Analysis Expressions — formula language for Power BI calculations", "Dashboard Axis", "Data Access Extension"], correct: 1, explanation: "DAX is Power BI's formula language for creating calculated columns, measures, and custom tables." },
            { id: 6, question: "What is a data mart?", options: ["Data marketplace", "Subset of data warehouse focused on specific business department", "Data storage unit", "Marketing database"], correct: 1, explanation: "Data mart is a focused subset of a data warehouse designed for a specific business function or team." },
            { id: 7, question: "What is the difference between descriptive and predictive analytics?", options: ["Same thing", "Descriptive explains what happened, predictive forecasts what will happen", "Predictive explains past", "Both predict future"], correct: 1, explanation: "Descriptive analytics summarizes historical data; predictive analytics forecasts future outcomes." },
            { id: 8, question: "What is data storytelling?", options: ["Writing novels with data", "Communicating data insights through narrative and visualization", "Data documentation", "Report writing"], correct: 1, explanation: "Data storytelling combines data, visuals, and narrative to communicate insights compellingly to stakeholders." },
            { id: 9, question: "What is a slowly changing dimension (SCD)?", options: ["Slow database", "Dimension table managing changes in attributes over time", "Static table", "Outdated data"], correct: 1, explanation: "SCDs track how dimension data changes over time, preserving historical context in the data warehouse." },
            { id: 10, question: "What is the purpose of data aggregation?", options: ["Data deletion", "Combining multiple data points into summary statistics", "Data duplication", "Data encryption"], correct: 1, explanation: "Data aggregation computes summary statistics like sum, average, count to reduce detail for analysis." },
            { id: 11, question: "What is a calculated measure in BI?", options: ["Ruler measurement", "Dynamic computed metric based on data using formulas", "Static database value", "Chart title"], correct: 1, explanation: "Calculated measures compute values dynamically based on filter context using DAX or similar formulas." },
            { id: 12, question: "What is data blending?", options: ["Mixing databases", "Combining data from different sources in visualization tool", "Data merging permanently", "ETL process"], correct: 1, explanation: "Data blending temporarily combines data from multiple sources within a BI tool for analysis." },
            { id: 13, question: "What is a waterfall chart?", options: ["Flowing data visual", "Chart showing cumulative effect of positive and negative values", "Waterfall effect animation", "Cascading filter"], correct: 1, explanation: "Waterfall charts visualize how sequential positive/negative values contribute to a total." },
            { id: 14, question: "What is drill-down in BI?", options: ["Mining data", "Navigating from summary data to more detailed underlying data", "Database query", "Chart zooming"], correct: 1, explanation: "Drill-down allows users to explore increasingly detailed levels of data within a BI report." },
            { id: 15, question: "What is the role of a BI analyst?", options: ["Software developer", "Translating business needs into data insights for decision making", "Database administrator", "Data engineer"], correct: 1, explanation: "BI analysts bridge business and data, analyzing information to provide actionable insights for decisions." },
            { id: 16, question: "What is a scorecard vs dashboard?", options: ["Same thing", "Scorecards track KPIs vs targets, dashboards show operational metrics", "Dashboards track targets", "Both are identical"], correct: 1, explanation: "Scorecards compare KPIs against targets/goals; dashboards monitor current operational performance." },
            { id: 17, question: "What is data lineage?", options: ["Data family tree", "Tracking data from origin through transformations to final destination", "Database backup", "Data sorting"], correct: 1, explanation: "Data lineage maps data's journey from source through transformations to its final form for auditability." },
            { id: 18, question: "What is the purpose of slicers in Power BI?", options: ["Data cutting tool", "Interactive visual filters for filtering report data", "Chart type", "Data export tool"], correct: 1, explanation: "Slicers are interactive visual filters that allow report users to filter data by selecting values." },
            { id: 19, question: "What is cohort analysis?", options: ["Group management", "Analyzing behavior of groups sharing common characteristic over time", "Team performance", "Cluster analysis"], correct: 1, explanation: "Cohort analysis tracks how groups with shared characteristics behave over time to identify trends." },
            { id: 20, question: "What is the difference between reporting and analytics?", options: ["No difference", "Reporting shows what happened, analytics explains why and predicts future", "Analytics shows what happened", "Both are the same"], correct: 1, explanation: "Reporting presents historical data; analytics digs deeper to explain causes and inform future decisions." },
        ];

        // ── TOPIC MATCHING ──
        let selectedQuestions = fullstackQuestions;

        if (t.includes("frontend")) selectedQuestions = frontendQuestions;
        else if (t.includes("backend")) selectedQuestions = backendQuestions;
        else if (t.includes("android")) selectedQuestions = androidQuestions;
        else if (t.includes("devops")) selectedQuestions = devopsQuestions;
        else if (t.includes("machine learning") || t.includes("ml")) selectedQuestions = mlQuestions;
        else if (t.includes("cyber")) selectedQuestions = cyberQuestions;
        else if (t.includes("blockchain") || t.includes("block chain")) selectedQuestions = blockchainQuestions;
        else if (t.includes("data analyst") || t.includes("dataanalyst")) selectedQuestions = dataAnalystQuestions;
        else if (t.includes("bi") || t.includes("business") || t.includes("bianalyst")) selectedQuestions = biAnalystQuestions;
        else if (t.includes("fullstack") || t.includes("full stack")) selectedQuestions = fullstackQuestions;

        setQuestions(selectedQuestions);
        setAnswers([]);
        setCurrent(0);
        setSelected(null);
        setShowExplain(false);
        setTimeLeft(30 * 60);
        setPhase("quiz");
    };

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setShowExplain(true);
  };

  const handleNext = () => {
    const newAnswers = [...answers, selected ?? -1];
    if (current >= questions.length - 1) {
      finishQuiz(newAnswers);
    } else {
      setAnswers(newAnswers);
      setCurrent(c => c + 1);
      setSelected(null);
      setShowExplain(false);
    }
  };

  const finishQuiz = (finalAnswers: number[]) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const score = questions.reduce((acc, q, i) => acc + (finalAnswers[i] === q.correct ? 1 : 0), 0);
    const res: QuizResult = {
      score,
      total: questions.length,
      passed: score / questions.length >= 0.75,
      answers: finalAnswers,
      completedAt: new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }),
    };
    setResult(res);
    setPhase("result");
  };

  const handleCertificate = async () => {
    if (!result || !userName.trim()) return;
    setGeneratingCert(true);
    await generateCertificatePDF(userName, roadmapTitle, result.score, result.total, result.completedAt);
    setGeneratingCert(false);
    setPhase("certificate");
  };

  const pct = result ? Math.round((result.score / result.total) * 100) : 0;

  // ── Phases ────────────────────────────────────────────────────────────────────

  if (phase === "intro") {
    return (
      <div style={wrapStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🏆</div>
            <h2 style={{ color: "#e6edf3", fontSize: 22, fontWeight: 800, margin: "0 0 8px" }}>
              Final Quiz
            </h2>
            <p style={{ color: "#8b949e", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
              Congratulations! Aapne <span style={{ color: "#4dc9a8", fontWeight: 700 }}>{roadmapTitle}</span> complete kar liya.<br />
              Ab final quiz do aur certificate pao! 🎓
            </p>
          </div>

          {/* Rules */}
          <div style={rulesBox}>
            {[
              ["📋", "20 Questions", "Roadmap ke topics se"],
              ["⏱️", "30 Minutes", "Time limit hai, tez raho!"],
              ["🎯", "75% Required", "15/20 minimum pass marks"],
              ["📜", "Certificate", "Pass karo aur PDF pao"],
            ].map(([icon, title, sub]) => (
              <div key={title} style={ruleItem}>
                <span style={{ fontSize: 22 }}>{icon}</span>
                <div>
                  <div style={{ color: "#e6edf3", fontWeight: 700, fontSize: 13 }}>{title}</div>
                  <div style={{ color: "#8b949e", fontSize: 11 }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Name input */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: "#8b949e", fontSize: 12, display: "block", marginBottom: 6 }}>
              Certificate pe naam likhein (required)
            </label>
            <input
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              placeholder="Apna poora naam likhein..."
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 8,
                background: "#21262d", border: "1px solid #30363d",
                color: "#e6edf3", fontSize: 14, outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={e => (e.target.style.borderColor = "#4dc9a8")}
              onBlur={e => (e.target.style.borderColor = "#30363d")}
            />
          </div>

          {genError && <div style={{ color: "#f85149", fontSize: 13, marginBottom: 12, textAlign: "center" }}>{genError}</div>}

          <button
            onClick={() => { if (nameInput.trim()) { setUserName(nameInput.trim()); generateQuiz(); } }}
            disabled={!nameInput.trim()}
            style={{
              ...btnPrimary,
              width: "100%",
              opacity: nameInput.trim() ? 1 : 0.5,
              cursor: nameInput.trim() ? "pointer" : "not-allowed",
              fontSize: 15,
              padding: "13px",
            }}
          >
            🚀 Quiz Shuru Karo
          </button>
        </div>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div style={wrapStyle}>
        <div style={{ ...cardStyle, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16, animation: "spin 2s linear infinite" }}>⚙️</div>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          <h3 style={{ color: "#4dc9a8", fontSize: 18, marginBottom: 8 }}>Questions Generate Ho Rahe Hain...</h3>
          <p style={{ color: "#8b949e", fontSize: 13 }}>AI {roadmapTitle} ke liye 20 questions bana raha hai 🤖</p>
          <div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: 6 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: "50%", background: "#4dc9a8",
                animation: `bounce 1.2s ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
          <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-10px)} }`}</style>
        </div>
      </div>
    );
  }

  if (phase === "quiz" && questions.length > 0) {
    const q = questions[current];
    const progress = ((current + 1) / questions.length) * 100;
    const timeWarning = timeLeft < 300;

    return (
      <div style={wrapStyle}>
        <div style={{ ...cardStyle, maxWidth: 680 }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <span style={{ color: "#4dc9a8", fontWeight: 700, fontSize: 14 }}>Q {current + 1}</span>
              <span style={{ color: "#484f58", fontSize: 13 }}> / {questions.length}</span>
            </div>
            <div style={{
              padding: "4px 12px", borderRadius: 20,
              background: timeWarning ? "#2d1a1a" : "#1a2332",
              border: `1px solid ${timeWarning ? "#f85149" : "#4dc9a8"}`,
              color: timeWarning ? "#f85149" : "#4dc9a8",
              fontWeight: 700, fontSize: 14, fontFamily: "monospace",
              animation: timeWarning ? "pulse 1s infinite" : "none",
            }}>
              ⏱ {formatTime(timeLeft)}
            </div>
          </div>
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>

          {/* Progress */}
          <div style={{ height: 4, background: "#21262d", borderRadius: 999, marginBottom: 24, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "#4dc9a8", borderRadius: 999, transition: "width .3s" }} />
          </div>

          {/* Question */}
          <div style={{ marginBottom: 24, padding: "16px 20px", background: "#0d1117", borderRadius: 10, borderLeft: "3px solid #4dc9a8" }}>
            <p style={{ color: "#e6edf3", fontSize: 15, lineHeight: 1.7, margin: 0, fontWeight: 500 }}>
              {q.question}
            </p>
          </div>

          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {q.options.map((opt, i) => {
              const isSelected = selected === i;
              const isCorrect = i === q.correct;
              const revealed = selected !== null;

              let bg = "#161b22", border = "#30363d", color = "#c9d1d9";
              if (revealed) {
                if (isCorrect) { bg = "#0d2818"; border = "#3fb950"; color = "#3fb950"; }
                else if (isSelected && !isCorrect) { bg = "#2d1a1a"; border = "#f85149"; color = "#f85149"; }
              } else if (isSelected) {
                bg = "#1a2332"; border = "#4dc9a8"; color = "#4dc9a8";
              }

              return (
                <button key={i} onClick={() => handleSelect(i)} disabled={revealed}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 16px", borderRadius: 8,
                    background: bg, border: `1.5px solid ${border}`, color,
                    cursor: revealed ? "default" : "pointer",
                    transition: "all .2s", textAlign: "left", fontSize: 14,
                  }}
                  onMouseEnter={e => { if (!revealed) (e.currentTarget as HTMLElement).style.borderColor = "#4dc9a8"; }}
                  onMouseLeave={e => { if (!revealed && !isSelected) (e.currentTarget as HTMLElement).style.borderColor = "#30363d"; }}
                >
                  <span style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    border: `2px solid ${border}`, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700,
                    background: revealed && isCorrect ? "#3fb950" : revealed && isSelected ? "#f85149" : "transparent",
                    color: revealed && (isCorrect || isSelected) ? "#fff" : color,
                  }}>
                    {revealed && isCorrect ? "✓" : revealed && isSelected && !isCorrect ? "✗" : "ABCD"[i]}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {showExplain && (
            <div style={{
              padding: "12px 16px", background: "#0f1e12", border: "1px solid #1f4a2a",
              borderRadius: 8, marginBottom: 16,
            }}>
              <div style={{ color: "#3fb950", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>💡 Explanation</div>
              <div style={{ color: "#a8d8b8", fontSize: 13, lineHeight: 1.6 }}>{q.explanation}</div>
            </div>
          )}

          {selected !== null && (
            <button onClick={handleNext} style={{ ...btnPrimary, width: "100%" }}>
              {current >= questions.length - 1 ? "🏁 Submit Quiz" : "Next Question →"}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (phase === "result" && result) {
    const scoreColor = result.passed ? "#3fb950" : "#f85149";
    const wrongAnswers = questions.filter((q, i) => result.answers[i] !== q.correct);

    return (
      <div style={wrapStyle}>
        <div style={{ ...cardStyle, maxWidth: 680 }}>
          {/* Score */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 60, marginBottom: 8 }}>{result.passed ? "🎉" : "😔"}</div>
            <h2 style={{ color: scoreColor, fontSize: 28, fontWeight: 900, margin: "0 0 4px" }}>
              {result.score}/{result.total}
            </h2>
            <div style={{
              display: "inline-block", padding: "4px 16px", borderRadius: 20,
              background: result.passed ? "#0d2818" : "#2d1a1a",
              border: `1px solid ${scoreColor}`, color: scoreColor,
              fontWeight: 700, fontSize: 14, marginBottom: 12,
            }}>
              {pct}% — {result.passed ? "PASSED ✓" : "FAILED ✗"}
            </div>
            <p style={{ color: "#8b949e", fontSize: 13, margin: 0 }}>
              {result.passed
                ? "Shandaar! Aapne quiz pass kar liya. Certificate ke liye naam confirm karo."
                : `Aapko ${Math.ceil(result.total * 0.75 - result.score)} aur sahi answers chahiye the. Dobara try karo!`}
            </p>
          </div>

          {/* Score bar */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ height: 12, background: "#21262d", borderRadius: 999, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${pct}%`, background: scoreColor,
                borderRadius: 999, transition: "width 1s ease",
                boxShadow: `0 0 10px ${scoreColor}88`,
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#484f58", marginTop: 4 }}>
              <span>0%</span>
              <span style={{ color: "#f59e0b" }}>75% needed</span>
              <span>100%</span>
            </div>
          </div>

          {result.passed ? (
            /* Certificate section */
            <div style={{ background: "#0d1117", borderRadius: 10, padding: "20px", marginBottom: 16 }}>
              <div style={{ color: "#4dc9a8", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>📜 Certificate Generate Karo</div>
              <label style={{ color: "#8b949e", fontSize: 12, display: "block", marginBottom: 6 }}>
                Certificate pe naam confirm karo:
              </label>
              <input
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 8,
                  background: "#21262d", border: "1px solid #30363d",
                  color: "#e6edf3", fontSize: 14, outline: "none",
                  boxSizing: "border-box", marginBottom: 12,
                }}
              />
              <button
                onClick={() => { setUserName(nameInput.trim()); handleCertificate(); }}
                disabled={!nameInput.trim() || generatingCert}
                style={{ ...btnPrimary, width: "100%", opacity: nameInput.trim() ? 1 : 0.5 }}
              >
                {generatingCert ? "⏳ Certificate Ban Raha Hai..." : "📥 Download Certificate PDF"}
              </button>
            </div>
          ) : (
            <button onClick={generateQuiz} style={{ ...btnSecondary, width: "100%", marginBottom: 16 }}>
              🔄 Dobara Try Karo
            </button>
          )}

          {/* Wrong answers review */}
          {wrongAnswers.length > 0 && (
            <details style={{ marginTop: 8 }}>
              <summary style={{ color: "#8b949e", fontSize: 13, cursor: "pointer", marginBottom: 12 }}>
                📖 Wrong Answers Review ({wrongAnswers.length} questions)
              </summary>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {wrongAnswers.map((q) => {
                  const qi = questions.indexOf(q);
                  return (
                    <div key={q.id} style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: 8, padding: "12px 14px" }}>
                      <div style={{ color: "#c9d1d9", fontSize: 13, marginBottom: 6 }}>{q.question}</div>
                      <div style={{ fontSize: 12 }}>
                        <span style={{ color: "#f85149" }}>Your answer: </span>
                        <span style={{ color: "#8b949e" }}>{result.answers[qi] >= 0 ? q.options[result.answers[qi]] : "Not answered"}</span>
                      </div>
                      <div style={{ fontSize: 12 }}>
                        <span style={{ color: "#3fb950" }}>Correct: </span>
                        <span style={{ color: "#a8d8b8" }}>{q.options[q.correct]}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#6e7681", marginTop: 4 }}>💡 {q.explanation}</div>
                    </div>
                  );
                })}
              </div>
            </details>
          )}
        </div>
      </div>
    );
  }

  if (phase === "certificate") {
    return (
      <div style={wrapStyle}>
        <div style={{ ...cardStyle, textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>🎓</div>
          <h2 style={{ color: "#3fb950", fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Certificate Download Ho Gaya!</h2>
          <p style={{ color: "#8b949e", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
            Badhai ho <span style={{ color: "#4dc9a8", fontWeight: 700 }}>{userName}</span>!<br />
            Tumhara certificate successfully generate ho gaya hai. 🌟
          </p>
          <div style={{
            background: "#0d1117", border: "1px solid #3fb950", borderRadius: 10,
            padding: "16px 24px", marginBottom: 24,
          }}>
            <div style={{ color: "#3fb950", fontSize: 13, fontWeight: 600 }}>{roadmapTitle}</div>
            <div style={{ color: "#8b949e", fontSize: 12, marginTop: 4 }}>Score: {result?.score}/{result?.total} ({pct}%) • {result?.completedAt}</div>
          </div>
          <button onClick={() => result && handleCertificate()} style={{ ...btnSecondary }}>
            📥 Dobara Download Karo
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const wrapStyle: React.CSSProperties = {
  display: "flex", justifyContent: "center", padding: "32px 16px",
  fontFamily: "'Segoe UI', system-ui, sans-serif",
};

const cardStyle: React.CSSProperties = {
  background: "#161b22", border: "1px solid #30363d",
  borderRadius: 16, padding: "32px 28px",
  width: "100%", maxWidth: 560,
  boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
};

const rulesBox: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "1fr 1fr",
  gap: 10, marginBottom: 24,
};

const ruleItem: React.CSSProperties = {
  display: "flex", alignItems: "flex-start", gap: 10,
  padding: "12px 14px", background: "#0d1117",
  border: "1px solid #21262d", borderRadius: 8,
};

const btnPrimary: React.CSSProperties = {
  background: "#238636", border: "1px solid #2ea043",
  color: "#fff", padding: "11px 24px", borderRadius: 8,
  fontWeight: 700, fontSize: 14, cursor: "pointer",
  transition: "all .2s",
};

const btnSecondary: React.CSSProperties = {
  background: "#21262d", border: "1px solid #30363d",
  color: "#c9d1d9", padding: "10px 22px", borderRadius: 8,
  fontWeight: 600, fontSize: 14, cursor: "pointer",
};
