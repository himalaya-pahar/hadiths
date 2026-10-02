# Hadith Explorer

A full-stack web application for browsing, searching, and exploring Islamic Hadith collections across multiple books, languages, and chapters.

---

## Features

- **Multiple Hadith Books** — Bukhari, Muslim, Nasai, Abu Dawud, Tirmidhi, Ibn Majah, Malik, Nawawi, and more
- **Trilingual Support** — Arabic, English, and Bangla translations side by side
- **Random Hadith** — Get a random hadith, optionally filtered by book or chapter
- **Hadith Search** — Search by hadith number with intelligent pattern matching
- **Paginated Browsing** — Navigate hadiths with clean pagination
- **In-Memory Caching** — Fast dropdown responses for sources and chapters
- **Report Issues** — Users can report translation errors or issues directly from the UI

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| [FastAPI](https://fastapi.tiangolo.com/) | REST API framework |
| [Supabase](https://supabase.com/) | PostgreSQL database & client |
| [Pydantic](https://docs.pydantic.dev/) | Data validation |
| [Uvicorn](https://www.uvicorn.org/) | ASGI server |
| [Python Dotenv](https://pypi.org/project/python-dotenv/) | Environment variable management |

### Frontend
| Technology | Purpose |
|---|---|
| [Next.js 16](https://nextjs.org/) | React framework |
| [React 19](https://react.dev/) | UI library |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe JavaScript |
| [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first styling |
| [html-to-image](https://www.npmjs.com/package/html-to-image) | Save hadith as image |

---

## Project Structure

```
hadith/
├── backend/
│   ├── main.py              # FastAPI app & all API routes
│   ├── seed.py              # Database seeding script (JSON → Supabase)
│   ├── requirements.txt     # Python dependencies
│   ├── .env                 # Environment variables (not committed)
│   ├── ara-*.json           # Arabic hadith source files
│   ├── eng-*.json           # English hadith source files
│   └── ben-*.json           # Bangla hadith source files
└── frontend/
    ├── app/
    │   ├── page.tsx         # Main application page
    │   ├── layout.tsx       # Root layout
    │   └── globals.css      # Global styles
    ├── package.json
    └── next.config.ts
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- A [Supabase](https://supabase.com/) project with the `hadiths_v2` table set up

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd hadith
```

### 2. Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file with your Supabase credentials
```

**.env file:**
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-anon-or-service-role-key
```

**Run the backend server:**
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

The frontend will be available at `http://localhost:3000`.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `GET` | `/sources` | List all available hadith books |
| `GET` | `/chapters?source=<book>` | List all chapters for a given book |
| `GET` | `/random-hadith` | Get a random hadith (optional: `source`, `chapter_no`) |
| `GET` | `/hadiths` | Get paginated hadiths (params: `source`, `chapter_no`, `page`, `limit`, `hadith_no`) |
| `POST` | `/report-issue` | Submit a report for a hadith issue |

---

## Database Seeding

To seed the Supabase database with hadith data from the JSON source files:

```bash
cd backend
python seed.py
```

This script merges Arabic, English, and Bangla JSON files for all books and uploads them to the `hadiths_v2` table in Supabase in batches of 100.

---

## Acknowledgements

Hadith data sourced from open Islamic text repositories. JazakAllah Khair to all contributors who made these translations available.

---

## License

This project is open source. Feel free to use and contribute.
