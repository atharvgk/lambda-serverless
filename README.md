# Lambda Serverless Platform

A serverless function platform that allows you to run Python and Node.js code in isolated containers (Docker) or via local fallback (for demo environments like Vercel).

## Features

- **Multi-Language Support**: Run Python and Node.js functions.
- **Isolated Execution**: Uses Docker containers for security (falls back to local subprocess if Docker is missing).
- **Web Dashboard**: Built-in UI to upload, manage, and monitor functions.
- **Monitoring**: Real-time execution logs and performance charts.
- **Vercel Ready**: Optimized for serverless deployment.

## Prerequisites

- Python 3.10+
- Docker (Optional, recommended for secure execution)
- Node.js 18+ (for Node.js functions)

## Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/atharvgk/lambda-serverless.git
cd lambda-serverless
```

### 2. Create a Virtual Environment
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the Application
Start the backend server (which also serves the frontend):
```bash
uvicorn backend.main:app --reload
```

### 5. Access the App
Open your browser and navigate to:
- **Dashboard**: [http://localhost:8000](http://localhost:8000)
- **API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

## Project Structure

```
lambda-serverless-function/
├── backend/
│   ├── api/           # API routes
│   ├── core/          # Execution engine (Docker/Local)
│   ├── db/            # Database models
│   ├── static/        # Frontend (HTML/CSS/JS)
│   ├── tests/         # Unit tests
│   └── main.py        # Application entry point
├── vercel.json        # Deployment config
└── requirements.txt   # Dependencies
```
