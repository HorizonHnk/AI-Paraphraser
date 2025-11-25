# AI Paraphraser

> Transform AI-generated text into natural, human-like content that bypasses AI detection tools.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://ai-paraphraser.replit.app)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-green)](https://nodejs.org)

---

## Overview

AI Paraphraser is a full-stack web application that helps users transform text to appear more human-written. It uses advanced AI (GPT-5) to rephrase content while maintaining the original meaning, making it undetectable by AI content detection tools.

### Key Benefits

- **Humanize AI Content** - Convert ChatGPT, Claude, or other AI-generated text into natural-sounding prose
- **Bypass AI Detection** - Restructure content to pass plagiarism and AI detection checks
- **Multiple Writing Styles** - Choose from Standard, Creative, Formal, or Casual tones
- **Real-time Analysis** - See readability scores, word counts, and change percentages instantly

---

## Features

### Core Paraphrasing
| Feature | Description |
|---------|-------------|
| **4 Paraphrasing Modes** | Standard, Creative, Formal, and Casual styles |
| **Text Diff Highlighting** | Visual comparison showing what changed |
| **Synchronized Scrolling** | Both panels scroll together for easy comparison |

### AI Analysis Tools
| Feature | Description |
|---------|-------------|
| **Plagiarism Checker** | Detect potential plagiarism with originality scoring |
| **AI Content Detection** | Identify AI-generated content probability |
| **Grammar Check** | AI-powered grammar analysis with corrections |
| **Readability Score** | Flesch-Kincaid grade level calculation |

### Productivity Features
| Feature | Description |
|---------|-------------|
| **History & Sessions** | Save and reload previous paraphrases |
| **Batch Processing** | Process up to 10 texts simultaneously |
| **Export Options** | Download as TXT or PDF |
| **Daily Usage Tracking** | 5,000 words/day free tier with progress indicator |

### User Experience
| Feature | Description |
|---------|-------------|
| **Dark/Light Mode** | Toggle between themes |
| **Smart Header** | Auto-hide on scroll for more workspace |
| **Responsive Design** | Works on desktop and mobile |
| **Copy to Clipboard** | One-click copying of results |

---

## Tech Stack

### Frontend
```
React 18          - UI library
TypeScript        - Type safety
Tailwind CSS      - Styling
Radix UI          - Accessible components
TanStack Query    - Server state management
Wouter            - Client-side routing
Vite              - Build tool
```

### Backend
```
Express.js        - Web framework
Node.js           - Runtime
OpenAI GPT-5      - AI processing
Drizzle ORM       - Database toolkit
PostgreSQL        - Database (optional)
```

### Design System
```
shadcn/ui         - Component library
Lucide React      - Icons
Inter             - UI typography
JetBrains Mono    - Monospace font
```

---

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API access (via Replit AI Integrations)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/HorizonHnk/AI-Paraphraser.git
   cd AI-Paraphraser
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file with:
   SESSION_SECRET=your-session-secret
   
   # If using Replit AI Integrations (automatic):
   # AI_INTEGRATIONS_OPENAI_API_KEY (auto-configured)
   # AI_INTEGRATIONS_OPENAI_BASE_URL (auto-configured)
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5000
   ```

---

## API Reference

### Paraphrase Text

```http
POST /api/paraphrase
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `text` | `string` | **Required**. Text to paraphrase |
| `mode` | `string` | Paraphrasing mode: `standard`, `creative`, `formal`, `casual` |

**Response:**
```json
{
  "originalText": "...",
  "paraphrasedText": "...",
  "mode": "standard",
  "stats": {
    "originalWordCount": 50,
    "paraphrasedWordCount": 48,
    "originalCharCount": 280,
    "paraphrasedCharCount": 275
  }
}
```

### Batch Paraphrase

```http
POST /api/paraphrase/batch
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `texts` | `string[]` | **Required**. Array of texts (max 10) |
| `mode` | `string` | Paraphrasing mode |

### Check Plagiarism

```http
POST /api/check-plagiarism
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `text` | `string` | **Required**. Text to analyze |

**Response:**
```json
{
  "originalityScore": 85,
  "aiProbability": 15,
  "riskLevel": "low",
  "flaggedPassages": [...],
  "recommendations": [...]
}
```

### Grammar Check

```http
POST /api/check-grammar
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `text` | `string` | **Required**. Text to check |

**Response:**
```json
{
  "issues": [
    {
      "type": "grammar",
      "message": "Subject-verb agreement",
      "suggestion": "...",
      "position": { "start": 0, "end": 10 }
    }
  ],
  "correctedText": "...",
  "score": 95
}
```

### Usage Stats

```http
GET /api/usage
```

**Response:**
```json
{
  "wordsUsedToday": 1500,
  "dailyLimit": 5000,
  "resetTime": "2025-11-26T00:00:00.000Z"
}
```

### History

```http
GET /api/history
DELETE /api/history/:id
DELETE /api/history
```

---

## Project Structure

```
AI-Paraphraser/
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   └── ui/         # shadcn/ui components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and helpers
│   │   │   ├── queryClient.ts
│   │   │   └── text-diff.ts
│   │   ├── pages/          # Page components
│   │   │   └── home.tsx    # Main application page
│   │   ├── App.tsx         # Root component
│   │   └── index.css       # Global styles
│   └── index.html
├── server/                 # Backend Express app
│   ├── lib/
│   │   └── openai.ts       # OpenAI integration
│   ├── routes.ts           # API routes
│   ├── storage.ts          # Data storage layer
│   └── index-dev.ts        # Development entry
├── shared/                 # Shared types
│   └── schema.ts           # Data models & validation
├── package.json
├── tailwind.config.ts
├── vite.config.ts
└── tsconfig.json
```

---

## Paraphrasing Modes

### Standard Mode
> Balanced rephrasing that maintains clarity while changing sentence structure and vocabulary.

### Creative Mode
> More dramatic transformations with varied sentence patterns and expressive language.

### Formal Mode
> Professional, academic-style writing suitable for business or scholarly contexts.

### Casual Mode
> Relaxed, conversational tone ideal for blogs, social media, or informal communication.

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Contact

**Horizon Hnk**

- GitHub: [@HorizonHnk](https://github.com/HorizonHnk)
- Email: hhnk3693@gmail.com
- Discord: [Join Server](https://discord.gg/CvSdnQVczk)
- Twitter: [@AiHorizon85134](https://x.com/AiHorizon85134)
- YouTube: [@Horizon-Hnk](https://www.youtube.com/@Horizon-Hnk)
- TikTok: [@horizon.hnk](https://www.tiktok.com/@horizon.hnk)
- Instagram: [@horizon.hnk](https://www.instagram.com/horizon.hnk)

---

## Acknowledgments

- [OpenAI](https://openai.com) - GPT-5 API
- [Replit](https://replit.com) - Hosting & AI Integrations
- [shadcn/ui](https://ui.shadcn.com) - Beautiful UI components
- [Radix UI](https://radix-ui.com) - Accessible primitives
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS

---

<div align="center">

**[Live Demo](https://ai-paraphraser.replit.app)** · **[Report Bug](https://github.com/HorizonHnk/AI-Paraphraser/issues)** · **[Request Feature](https://github.com/HorizonHnk/AI-Paraphraser/issues)**

Made with passion by Horizon Hnk

</div>
