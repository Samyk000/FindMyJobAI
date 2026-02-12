# FindMyJobAI - Intelligent Job Search Assistant

An AI-powered job search application that aggregates job listings from multiple sources (LinkedIn, Indeed, Glassdoor) and provides intelligent filtering and organization.

## Features

- 🔍 **Multi-Platform Job Search**: Search jobs from LinkedIn, Indeed, and Glassdoor simultaneously
- 🤖 **AI-Powered Filtering**: Intelligent deduplication and relevance scoring
- 💾 **Job Management**: Save, reject, and organize job listings
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🌓 **Dark/Light Theme**: Toggle between themes with smooth transitions
- ⚡ **Real-Time Progress**: Live progress tracking during job searches

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Lucide Icons** - Beautiful, consistent icons

### Backend
- **FastAPI** - Python web framework
- **SQLite** - Lightweight database
- **Selenium** - Web scraping for job sites

## Project Structure

```
linkedin-job-bot/
├── frontend/                # Next.js frontend application
│   ├── app/                 # App Router pages
│   ├── components/          # React components
│   └── public/              # Static assets
├── backend/                 # FastAPI backend
│   ├── main.py              # API endpoints
│   ├── job_bot.py           # Job scraping logic
│   └── middleware/          # Rate limiting, etc.
└── plans/                   # Project documentation
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- Chrome browser (for Selenium)

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

Create a `.env` file in the backend directory:

```env
CHROME_PROFILE_PATH=/path/to/chrome/profile
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
| `/jobs/search` | POST | Start a new job search |
| `/jobs` | GET | Get all jobs with optional filters |
| `/jobs/{id}/status` | PATCH | Update job status |
| `/jobs/{id}` | DELETE | Delete a job |
| `/settings` | GET | Get application settings |
| `/logs/{batch_id}` | GET | Get search logs |

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
- Inspired by the need for efficient job searching
- Designed with user experience as the top priority
