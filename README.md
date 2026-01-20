# QforMedia - YouTube Studio Copilot

A browser extension that enhances YouTube Studio with AI-powered metadata optimization and quality checks. Built to help content creators polish their videos before publishing.

![Chrome Extension](https://img.shields.io/badge/Platform-Chrome%20Extension-blue)
![Python](https://img.shields.io/badge/Backend-Python%203.11+-green)
![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6)

---

## 🎯 Overview

QforMedia is a Chrome extension that integrates directly into YouTube Studio's video editor page. It provides two main features:

1. **Scan** - Automated quality checks for video metadata (title, description, tags, chapters)
2. **LLM Assistant** - AI-powered description rewriting and chapter generation

The extension injects a collapsible sidebar into YouTube Studio, giving creators quick access to optimization tools without leaving their workflow.

---

## ✨ Features

### 📋 Scan Tab
- **Title validation** - Checks length (≤70 characters recommended)
- **Description presence** - Ensures description is not empty
- **Tags check** - Verifies tags are present
- **Required sections** - Flags missing Links/Credits/Disclaimer sections
- **Hashtag limit** - Warns if more than 3 hashtags
- **Chapter validation** - Ensures timestamps start at 00:00

### 🤖 LLM Tab
- **Description Rewriter** - Generates polished descriptions based on video metadata
- **Iterative refinement** - Chat interface to refine descriptions with feedback
- **Chapter Generator** - Creates timestamp chapters within video duration
- **Smart validation** - Server-side filtering of invalid timestamps

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **FastAPI** | REST API framework |
| **OpenAI API** | LLM integration (GPT-4.1-mini) |
| **SQLModel** | ORM with Pydantic integration |
| **SQLite** | Local database storage |
| **Pydantic Settings** | Environment configuration |

### Frontend (Chrome Extension)
| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tooling |
| **Chrome Extension Manifest V3** | Extension architecture |
| **Shadow DOM** | Style isolation from YouTube |

---

## 📁 Project Structure

```
qformedia-yt-ops-copilot/
├── backend/
│   ├── .env                    # Environment variables (create this)
│   ├── requirements.txt        # Python dependencies
│   └── app/
│       ├── main.py             # FastAPI app + CORS config
│       ├── db.py               # Database engine + session
│       ├── deps.py             # Dependency injection (OpenAI client)
│       ├── llm.py              # LLM logic (prompts, response parsing)
│       ├── rules.py            # Scan rule definitions
│       ├── schemas.py          # Pydantic models
│       ├── core/
│       │   └── config.py       # Settings management
│       └── routes/
│           ├── llm.py          # /llm/suggest endpoint
│           └── rules.py        # /rules endpoint
│
└── frontend/
    └── chrome-extension/
        ├── manifest.json       # Extension manifest (MV3)
        ├── package.json        # Node dependencies
        ├── vite.config.ts      # Main Vite config
        ├── vite.content.config.ts
        ├── vite.background.config.ts
        └── src/
            ├── background/
            │   └── index.ts    # Service worker
            ├── content/
            │   ├── inject.ts   # Content script entry
            │   ├── routeWatch.ts   # SPA navigation detection
            │   └── studioAdapter.ts # YouTube Studio DOM scraping
            └── ui/
                ├── mount.tsx   # Shadow DOM + CSS injection
                ├── SidebarApp.tsx  # Main sidebar component
                ├── storage.ts  # Chrome storage wrapper
                ├── types.ts    # TypeScript types
                └── tabs/
                    ├── HomeTab.tsx
                    ├── ScanTab.tsx
                    └── LlmTab.tsx
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **OpenAI API Key**
- **Google Chrome**

---

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/qformedia-yt-ops-copilot.git
   cd qformedia-yt-ops-copilot
   ```

2. **Create and activate virtual environment**
   ```bash
   cd backend
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create environment file**
   ```bash
   # Create .env file in backend/ directory
   touch .env   # or manually create on Windows
   ```

   Add the following to `.env`:
   ```env
   OPENAI_API_KEY=sk-your-openai-api-key-here
   OPENAI_MODEL=gpt-4.1-mini
   DATABASE_URL=sqlite:///./app.db
   ```

5. **Run the backend server**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   The API will be available at `http://localhost:8000`

6. **Verify it's running**
   ```bash
   curl http://localhost:8000/health
   # Expected: {"ok":true}
   ```

---

### Frontend Setup (Chrome Extension)

1. **Navigate to frontend**
   ```bash
   cd frontend/chrome-extension
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

   This creates a `dist/` folder with the compiled extension.

4. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top-right)
   - Click **Load unpacked**
   - Select the `frontend/chrome-extension/dist` folder

5. **Test the extension**
   - Navigate to [YouTube Studio](https://studio.youtube.com)
   - Open any video's edit/details page
   - The QforMedia sidebar should appear on the right

---

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/rules` | Get scan rule definitions |
| `POST` | `/llm/suggest` | Generate description or chapters |

### POST /llm/suggest

**Request Body:**
```json
{
  "task": "rewrite_description",
  "video": {
    "platform": "youtube-studio",
    "videoId": "abc123",
    "title": "My Video Title",
    "description": "Current description...",
    "tags": ["tag1", "tag2"],
    "durationSeconds": 300
  },
  "styleProfile": null,
  "chat": {
    "currentDraft": "Previous draft...",
    "messages": [
      {"role": "user", "content": "Make it shorter"}
    ]
  }
}
```

**Response:**
```json
{
  "description": "Polished description text...",
  "chapters": null,
  "notes": ["Applied user feedback", "Shortened intro"]
}
```

---

## 🔒 Security Notes

- The backend runs locally (`localhost:8000`) - not exposed to the internet
- OpenAI API key is stored in `.env` and never committed
- CORS is configured to only allow requests from YouTube Studio and the extension
- No user data is stored permanently (SQLite is for future features)

---

## 🧪 Development

### Backend (with hot reload)
```bash
cd backend
uvicorn app.main:app --reload
```

### Frontend (rebuild on change)
```bash
cd frontend/chrome-extension
npm run build
# Then reload the extension in chrome://extensions/
```

---

## 📝 Configuration

### Backend Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | - | Your OpenAI API key |
| `OPENAI_MODEL` | No | `gpt-4.1-mini` | Model to use |
| `DATABASE_URL` | No | `sqlite:///./app.db` | Database connection string |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

Built with ❤️ for the QforMedia interview project
