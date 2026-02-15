# FindMyJob - Job Search Assistant

Job search application that aggregates job listings from multiple sources (LinkedIn, Indeed, Glassdoor) with intelligent filtering and organization.

## Features

- 🔍 **Multi-Platform Job Search**: Search jobs from LinkedIn, Indeed, and Glassdoor simultaneously
- 🔄 **Duplicate Detection**: Automatically skips duplicate job listings
-  **Job Management**: Save, reject, and organize job listings
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🌓 **Dark/Light Theme**: Toggle between themes with smooth transitions
- ⚡ **Real-Time Progress**: Live progress tracking during job searches

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Lucide Icons** - Beautiful, consistent icons

### Backend
- **FastAPI** - Python web framework
- **SQLAlchemy** - ORM for database operations
- **SQLite** - Lightweight database
- **python-jobspy** - Job scraping library

## Project Structure

```
linkedin-job-bot/
├── frontend/                # Next.js frontend application
│   ├── app/                 # App Router pages
│   ├── components/          # React components
│   ├── lib/                 # Utilities and API client
│   └── types/               # TypeScript type definitions
├── backend/                 # FastAPI backend
│   ├── main.py              # Application entry point
│   ├── config.py            # Configuration and constants
│   ├── database.py          # Database engine and sessions
│   ├── models.py            # SQLAlchemy ORM models
│   ├── schemas.py           # Pydantic request/response models
│   ├── routes/              # API route handlers
│   │   ├── jobs.py          # Job CRUD endpoints
│   │   ├── search.py        # Search and scrape endpoints
│   │   └── settings.py      # Settings endpoints
│   ├── services/            # Business logic
│   │   ├── job_service.py   # Job operations
│   │   ├── scraper.py       # Scraping service
│   │   └── pipeline.py      # Pipeline state management
│   ├── utils/               # Utility functions
│   │   ├── exceptions.py    # Custom exceptions
│   │   └── helpers.py       # Helper functions
│   └── job_bot.py           # Job scraping wrapper
└── plans/                   # Project documentation
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
python -m uvicorn main:app --reload
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the backend directory (optional):

```env
# Database URL (defaults to SQLite)
DB_URL=sqlite:///jobs.db

# CORS origins (defaults to * for development)
CORS_ORIGINS=*

# Rate limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=5
RATE_LIMIT_WINDOW=60

# Logging level
LOG_LEVEL=INFO
```

## Usage

1. Open the frontend at `http://localhost:3000`
2. Enter job titles and locations to search
3. Filter results by portal, location, or keywords
4. Save interesting jobs or reject irrelevant ones
5. Manage your saved jobs in different tabs

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/jobs/search` | GET | Get jobs with filters |
| `/jobs/{id}` | GET | Get a single job |
| `/jobs/{id}` | PATCH | Update job status |
| `/jobs/{id}` | DELETE | Delete a job |
| `/jobs/clear` | POST | Clear all jobs |
| `/run/scrape` | POST | Start a new job search |
| `/logs/{job_id}` | GET | Get search logs |
| `/settings` | GET | Get application settings |
| `/settings` | POST | Update settings |
| `/stats` | GET | Get job statistics |

## Troubleshooting

### Common Issues

1. **"Cannot connect to server"**
   - Ensure the backend is running on `http://localhost:8000`
   - Check if port 8000 is available

2. **"No jobs found"**
   - Try broader search terms
   - Check if the job sites are accessible
   - Verify your internet connection

3. **Duplicate jobs appearing**
   - The app now automatically skips duplicates based on normalized URLs
   - Run the migration script if you have an older database: `python backend/migrate_remove_is_duplicate.py`

### Database Migration

If you're upgrading from an older version, run the migration script:

```bash
cd backend
python migrate_remove_is_duplicate.py
```

This will remove the old `is_duplicate` column and preserve your existing jobs.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with modern web technologies
- Job scraping powered by [python-jobspy](https://github.com/cullenwatson/JobSpy)
- Inspired by the need for efficient job searching
- Designed with user experience as the top priority
