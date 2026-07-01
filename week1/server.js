const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let chatHistory = [];

// ─── FAQ Knowledge Base ──────────────────────────────────────────────────────
const faqEntries = [
  {
    keywords: ["hello","hi","hey","good morning","good afternoon","howdy","greetings","sup","what's up"],
    answer: `Hello! 👋 I'm **Aether**, your intelligent chat assistant.\n\nI can help you with:\n- **Programming & code** questions\n- **Concept explanations** (tech, science, math)\n- **Writing assistance** (emails, essays, summaries)\n- **Brainstorming** ideas\n- **General knowledge** & FAQs\n\nWhat would you like to explore today?`
  },
  {
    keywords: ["who are you","what are you","about you","what is aether","tell me about yourself","your name","introduce yourself"],
    answer: `I'm **Aether**, a locally-hosted chat assistant powered by a REST API backend.\n\n**Built with:**\n- Backend: PowerShell or Node.js/Express (REST API)\n- Frontend: Vanilla HTML, CSS & JavaScript\n- Design: Claude-inspired warm light theme\n\n**Capabilities:**\n- FAQ-style knowledge base with keyword matching\n- Markdown response formatting\n- Text-to-speech (TTS) via Web Speech API\n- Clipboard copy for messages & code\n- Suggestion chips for quick-start prompts\n\nI run entirely on your local machine — no internet or API keys needed!`
  },
  {
    keywords: ["what is rest api","rest api","restful","api design","http api","api endpoint","api request","api response"],
    answer: `## What is a REST API?\n\nA **REST API** (Representational State Transfer) is a set of rules for software systems to communicate over HTTP.\n\n**Core HTTP Methods:**\n- **GET** — Retrieve data (e.g. \`GET /api/history\`)\n- **POST** — Send new data (e.g. \`POST /api/chat\`)\n- **PUT** — Update existing data\n- **DELETE** — Remove data (e.g. \`DELETE /api/history\`)\n\n**Key Principles:**\n- **Stateless** — each request is self-contained\n- **Client-Server** — frontend and backend are decoupled\n- **Uniform Interface** — consistent URL structure\n- **JSON** — standard data format\n\n**This chatbot's REST endpoints:**\n\`\`\`\nPOST   /api/chat      → send a message\nGET    /api/history   → fetch chat history\nDELETE /api/history   → clear chat history\n\`\`\``
  },
  {
    keywords: ["javascript","js","ecmascript","vanilla js"],
    answer: `## JavaScript Overview\n\n**JavaScript** is the language of the web — it runs in every browser.\n\n**Key Concepts:**\n- **Variables:** \`let\`, \`const\`, \`var\`\n- **Functions:** regular, arrow (\`=>\`), async/await\n- **DOM Manipulation:** \`document.getElementById()\`, \`querySelector()\`\n- **Events:** \`addEventListener('click', handler)\`\n- **Fetch API:** making HTTP requests\n\n**Quick Example:**\n\`\`\`javascript\nconst sendMessage = async (msg) => {\n  const res = await fetch('/api/chat', {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json' },\n    body: JSON.stringify({ message: msg })\n  });\n  const data = await res.json();\n  console.log(data.text);\n};\nsendMessage('hello');\n\`\`\``
  },
  {
    keywords: ["python","python3","learn python"],
    answer: `## Python Overview\n\n**Python** is high-level, readable, and great for beginners and experts alike.\n\n**Key Features:**\n- Simple, English-like syntax\n- Huge standard library\n- Great for web (Flask, Django), data science, AI/ML\n\n**Quick Example:**\n\`\`\`python\nfrom flask import Flask, request, jsonify\n\napp = Flask(__name__)\nhistory = []\n\n@app.route('/api/chat', methods=['POST'])\ndef chat():\n    data = request.get_json()\n    msg = data.get('message', '')\n    reply = f'You said: {msg}'\n    history.append({'user': msg, 'bot': reply})\n    return jsonify({'text': reply})\n\nif __name__ == '__main__':\n    app.run(port=3000)\n\`\`\``
  },
  {
    keywords: ["async","synchronous","asynchronous","async await","promise","callback","event loop","non-blocking"],
    answer: `## Synchronous vs Asynchronous Code\n\n**Synchronous** — code runs line by line, each step waits.\n**Asynchronous** — code doesn't block; other tasks run while waiting.\n\n**Sync Example:**\n\`\`\`javascript\nconsole.log('Start');\nconst data = readFileSync('file.txt'); // BLOCKS here\nconsole.log('Done');\n\`\`\`\n\n**Async Example (async/await):**\n\`\`\`javascript\nconsole.log('Start');\nconst data = await fetch('/api/chat'); // doesn't block\nconsole.log('Done');\n\`\`\`\n\n**Why it matters:**\n- API calls, file reads, DB queries are slow\n- Async prevents your UI from freezing\n- JavaScript uses an **Event Loop** to handle async operations`
  },
  {
    keywords: ["html","html5","markup","semantic html","tags","elements"],
    answer: `## HTML (HyperText Markup Language)\n\nHTML is the **structure** of every web page.\n\n**Basic Structure:**\n\`\`\`html\n<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>My Page</title>\n</head>\n<body>\n  <h1>Hello, World!</h1>\n  <p>A paragraph.</p>\n  <button id="btn">Click Me</button>\n</body>\n</html>\n\`\`\`\n\n**Semantic Tags:**\n- \`<header>\` — page header\n- \`<nav>\` — navigation links\n- \`<main>\` — main content\n- \`<section>\` — logical sections\n- \`<footer>\` — page footer\n- \`<article>\` — self-contained content`
  },
  {
    keywords: ["css","stylesheet","flexbox","grid","responsive","media query","animations"],
    answer: `## CSS (Cascading Style Sheets)\n\nCSS controls the **visual presentation** of HTML.\n\n**Key Concepts:**\n- **Box Model:** margin → border → padding → content\n- **Flexbox:** 1D layout (\`display: flex\`)\n- **Grid:** 2D layout (\`display: grid\`)\n- **CSS Variables:** \`--accent: #d97757\`\n- **Media Queries:** responsive breakpoints\n\n**Example:**\n\`\`\`css\n:root {\n  --primary: #d97757;\n}\n\n.chat-form {\n  display: flex;\n  gap: 12px;\n  align-items: center;\n}\n\n@media (max-width: 768px) {\n  .sidebar { display: none; }\n}\n\`\`\``
  },
  {
    keywords: ["node","nodejs","node.js","express","npm","backend"],
    answer: `## Node.js & Express\n\n**Node.js** runs JavaScript on the server side.\n**Express** is a lightweight web framework for Node.\n\n**Setup:**\n\`\`\`bash\nnpm init -y\nnpm install express cors\n\`\`\`\n\n**Simple REST Server:**\n\`\`\`javascript\nconst express = require('express');\nconst app = express();\napp.use(express.json());\n\nlet history = [];\n\napp.get('/api/history', (req, res) => res.json(history));\n\napp.post('/api/chat', (req, res) => {\n  const { message } = req.body;\n  const reply = { sender: 'bot', text: 'Got: ' + message };\n  history.push(reply);\n  res.json(reply);\n});\n\napp.listen(3000, () => console.log('Running on port 3000'));\n\`\`\``
  },
  {
    keywords: ["git","github","version control","commit","branch","merge","pull request","repository","clone"],
    answer: `## Git Version Control\n\n**Git** tracks code changes and enables collaboration.\n\n**Essential Commands:**\n\`\`\`bash\n# Initialize & commit\ngit init\ngit add .\ngit commit -m "Initial commit"\n\n# Connect to GitHub\ngit remote add origin https://github.com/user/repo.git\ngit push -u origin main\n\n# Branching\ngit checkout -b feature/my-feature\ngit merge feature/my-feature\n\n# Undo last commit (keep changes)\ngit reset --soft HEAD~1\n\`\`\`\n\n**Best Practices:**\n- Commit often with descriptive messages\n- Use branches for every feature/fix\n- Always pull before you push`
  },
  {
    keywords: ["database","sql","mysql","postgresql","mongodb","sqlite","nosql","query","schema"],
    answer: `## Databases Overview\n\n**Relational (SQL):** data in tables\n- Examples: MySQL, PostgreSQL, SQLite\n\n**Non-Relational (NoSQL):** flexible document storage\n- Examples: MongoDB, Redis, Firebase\n\n**SQL Quick Reference:**\n\`\`\`sql\nCREATE TABLE users (\n  id INTEGER PRIMARY KEY,\n  name TEXT NOT NULL,\n  email TEXT UNIQUE\n);\n\nINSERT INTO users (name, email) VALUES ('Alice', 'a@email.com');\nSELECT * FROM users WHERE name = 'Alice';\nUPDATE users SET email = 'new@email.com' WHERE id = 1;\nDELETE FROM users WHERE id = 1;\n\`\`\``
  },
  {
    keywords: ["machine learning","ml","artificial intelligence","ai","deep learning","neural network","llm","gpt","training","model","nlp"],
    answer: `## Machine Learning & AI\n\n**AI:** systems simulating human intelligence.\n**ML:** AI that learns from data without explicit programming.\n\n**Types of ML:**\n- **Supervised** — labeled data (spam detection)\n- **Unsupervised** — finds patterns (clustering)\n- **Reinforcement** — learns via reward (game bots)\n\n**LLMs (Large Language Models):**\n- Trained on billions of text documents\n- Generate human-like responses via next-token prediction\n- Examples: GPT-4, Claude, Gemini\n\n**Simple Python Example:**\n\`\`\`python\nfrom sklearn.linear_model import LinearRegression\nimport numpy as np\n\nX = np.array([[1],[2],[3],[4]])\ny = np.array([2, 4, 6, 8])\n\nmodel = LinearRegression().fit(X, y)\nprint(model.predict([[5]]))  # [10]\n\`\`\``
  },
  {
    keywords: ["docker","container","kubernetes","devops","ci/cd","deployment","dockerfile"],
    answer: `## Docker & DevOps\n\n**Docker** packages apps into portable **containers**.\n\n**Dockerfile Example:**\n\`\`\`dockerfile\nFROM node:18-alpine\nWORKDIR /app\nCOPY package*.json .\nRUN npm install\nCOPY . .\nEXPOSE 3000\nCMD ["node", "server.js"]\n\`\`\`\n\n**Common Commands:**\n\`\`\`bash\ndocker build -t my-app .\ndocker run -p 3000:3000 my-app\ndocker-compose up -d\n\`\`\`\n\n**DevOps Pipeline:**\nCode → Build → Test → Containerize → Deploy → Monitor`
  },
  {
    keywords: ["security","cybersecurity","encryption","https","ssl","xss","sql injection","authentication","jwt","password","hash"],
    answer: `## Cybersecurity Essentials\n\n**Common Vulnerabilities:**\n- **XSS** — injecting malicious scripts into pages\n- **SQL Injection** — inserting SQL into queries\n- **CSRF** — tricking users into unauthorized requests\n\n**Best Practices:**\n- Always **escape user input** before rendering HTML\n- Use **parameterized SQL queries**\n- Hash passwords with **bcrypt** (never plain text)\n- Use **HTTPS** (TLS/SSL) for all data in transit\n- Implement **JWT** or **OAuth 2.0** for auth\n\n**Password Hashing (Node.js):**\n\`\`\`javascript\nconst bcrypt = require('bcrypt');\nconst hash = await bcrypt.hash('myPassword', 10);\nconst match = await bcrypt.compare('myPassword', hash); // true\n\`\`\``
  },
  {
    keywords: ["email","draft email","write email","professional email","project update","follow up"],
    answer: `## Professional Email Template\n\n**Subject:** Project Status Update Request — [Project Name]\n\nDear [Recipient's Name],\n\nI hope this message finds you well. I wanted to touch base regarding **[Project Name]** and ensure we're aligned on progress and milestones.\n\nCould you please provide an update on:\n- **Current progress** against the planned timeline\n- Any **blockers or challenges** needing attention\n- **Next steps** and estimated completion dates\n\nYour timely response would be greatly appreciated.\n\nBest regards,\n[Your Name] | [Your Title]\n\n---\n**Tips:**\n- Keep subject lines clear and specific\n- Be concise — get to the point quickly\n- Use bullet points for multiple items\n- Always include a clear call-to-action`
  },
  {
    keywords: ["brainstorm","startup","ideas","business idea","gardening","green tech","agritech","innovation"],
    answer: `## 🌱 Tech + Gardening Startup Ideas\n\n**1. SmartRoot — AI Plant Health Monitor**\nUse computer vision to diagnose plant diseases & pests via phone camera. Subscription model with personalized treatment plans.\n\n**2. HydroConnect — IoT Irrigation Network**\nSmart soil sensors + automated watering valves via mobile app. Saves water by irrigating only when needed.\n\n**3. SeedBank Marketplace**\nHyperlocal seed & sapling exchange platform — gardeners list excess seeds, neighbors buy/trade locally.\n\n**4. GrowCoach — AI Garden Planner**\nSeasonal planting calendar based on location, soil type, and climate data. Sends smart reminders and tracks progress.\n\n**5. VermiLink — Composting-as-a-Service**\nSubscription vermicomposting kits with live worm colonies, app-guided feeding schedules, and organic compost pickup.`
  },
  {
    keywords: ["sort","sorting","bubble sort","merge sort","quick sort","algorithm","time complexity","big o"],
    answer: `## Sorting Algorithms\n\n| Algorithm   | Best       | Average    | Worst    | Space     |\n|-------------|------------|------------|----------|-----------|\n| Bubble Sort | O(n)       | O(n²)      | O(n²)    | O(1)      |\n| Merge Sort  | O(n log n) | O(n log n) | O(n log n)| O(n)     |\n| Quick Sort  | O(n log n) | O(n log n) | O(n²)    | O(log n)  |\n\n**Quick Sort in JavaScript:**\n\`\`\`javascript\nfunction quickSort(arr) {\n  if (arr.length <= 1) return arr;\n  const pivot = arr[Math.floor(arr.length / 2)];\n  const left  = arr.filter(x => x < pivot);\n  const mid   = arr.filter(x => x === pivot);\n  const right = arr.filter(x => x > pivot);\n  return [...quickSort(left), ...mid, ...quickSort(right)];\n}\nconsole.log(quickSort([3,1,4,1,5,9,2,6]));\n// [1,1,2,3,4,5,6,9]\n\`\`\``
  },
  {
    keywords: ["how does this work","how does the chatbot work","how are you built","tech stack","technologies used"],
    answer: `## How This Chatbot Works\n\n**Architecture:**\n\`\`\`\nBrowser (Frontend)\n   │  HTTP Requests (REST API)\n   ▼\nPowerShell / Node.js HTTP Server (Backend)\n   │  Keyword Pattern Matching\n   ▼\nFAQ Knowledge Base → Structured Answer\n\`\`\`\n\n**Tech Stack:**\n- **Backend:** PowerShell \`System.Net.HttpListener\` or Node.js + Express\n- **Frontend:** Vanilla HTML5, CSS3, JavaScript (ES6+)\n- **Endpoints:**\n  - \`POST /api/chat\` — send a message\n  - \`GET /api/history\` — load history\n  - \`DELETE /api/history\` — clear chat\n\n**Response Engine:**\nYour message is scanned against 15+ keyword categories. The best match returns a rich, markdown-formatted FAQ answer — no external AI needed!`
  },
  {
    keywords: ["joke","funny","laugh","humor","tell me a joke","make me laugh"],
    answer: `Here are some developer classics 😄\n\n**Joke 1:**\nWhy do programmers prefer dark mode?\n*Because light attracts bugs!* 🐛\n\n**Joke 2:**\nA SQL query walks into a bar, walks up to two tables and asks:\n*"Can I join you?"* 😂\n\n**Joke 3:**\nThere are only 10 types of people in the world:\n*Those who understand binary, and those who don't.*\n\n**Joke 4:**\nWhy did the developer go broke?\n*Because he used up all his cache!* 💸`
  },
  {
    keywords: ["thank","thanks","thank you","appreciate","helpful","great","awesome","perfect"],
    answer: `You're very welcome! 😊 I'm glad I could help.\n\nFeel free to ask me anything else — code, concepts, writing, or just a quick question. I'm here whenever you need me! 🚀`
  },
  {
    keywords: ["help","commands","what can you do","capabilities","features","topics","list","options"],
    answer: `## What I Can Help With\n\nHere are the topics I have detailed knowledge on:\n\n- 🌐 **REST API** — design, endpoints, HTTP methods\n- 💻 **JavaScript** — syntax, async/await, fetch API\n- 🐍 **Python** — Flask, basics, ML examples\n- ⚛️  **HTML & CSS** — structure, flexbox, responsive design\n- 🖥️ **Node.js / Express** — server setup, routing\n- 🔀 **Git & GitHub** — version control, branching\n- 🗄️ **Databases** — SQL, NoSQL, queries\n- 🤖 **AI / ML** — concepts, LLMs, scikit-learn\n- 🐳 **Docker / DevOps** — containers, CI/CD\n- 🔒 **Cybersecurity** — XSS, SQL injection, JWT\n- 📧 **Email Writing** — professional templates\n- 💡 **Brainstorming** — startup & creative ideas\n- 📊 **Algorithms** — sorting, Big O notation\n- 😄 **Jokes** — developer humor\n\nJust type any topic or question!`
  }
];

// ─── Match Engine ─────────────────────────────────────────────────────────────
function getBotResponse(userInput) {
  const inputLower = userInput.toLowerCase();
  for (const entry of faqEntries) {
    for (const kw of entry.keywords) {
      if (inputLower.includes(kw)) {
        return entry.answer;
      }
    }
  }
  return `I'm not sure I have a specific answer for that yet! 🤔\n\nTry asking about:\n- Programming (JavaScript, Python, Node.js, REST APIs)\n- Web development (HTML, CSS, databases)\n- Tech concepts (AI/ML, Docker, Git, security)\n- Writing (emails, summaries)\n- Brainstorming ideas\n\nType **'help'** to see all available topics.`;
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/api/history', (req, res) => res.json(chatHistory));

app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required.' });

  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const botText   = getBotResponse(message);

  chatHistory.push({ sender: 'user', text: message, timestamp });
  const botMsg = { sender: 'bot', text: botText, timestamp };
  chatHistory.push(botMsg);

  res.json(botMsg);
});

app.delete('/api/history', (req, res) => {
  chatHistory = [];
  res.json({ message: 'Chat history cleared.' });
});

app.listen(PORT, () => console.log(`Aether server running on http://localhost:${PORT}`));
