# Lambda Serverless Platform

A serverless function platform that allows you to run Python and Node.js code in isolated containers, similar to AWS Lambda.

## Features

- Run Python and Node.js code in isolated Docker containers (or local fallback)
- Support for multiple programming languages
- Container isolation for security
- Memory limits and timeout controls
- Simple REST API for function management
- Built-in code execution monitoring
- **New:** Simulated "gVisor" Runtime mode
- **New:** Live Edit & Hot-Reload of Functions

## Architecture Diagram
![WhatsApp Image 2025-04-21 at 08 50 20_dc455af8](https://github.com/user-attachments/assets/ea5b8202-4f89-4624-a408-8b6862771702)

## Prerequisites

- Python 3.10+
- Docker (Required for isolated execution)
- Node.js 18+ (Required for Node.js functions)
- MongoDB (Optional, for data persistence)

## Setup Instructions

1. Clone the Repository
```bash
git clone https://github.com/atharvgk/lambda-serverless.git
cd lambda-serverless
```

2. Create a Virtual Environment
```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
```

3. Install Dependencies
```bash
pip install -r requirements.txt
```

4. Start the Application (Backend + Frontend)
```bash
uvicorn backend.main:app --reload
```

5. Access the App
- **Dashboard**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

*Note: The Frontend is served directly by the Backend. No separate `streamlit run` command is needed.*

## Supported Languages
- Python 3
- JavaScript (Node.js)

## API Endpoints

### Function Management

- `POST /functions/` - Upload a new function
- `GET /functions/` - List all functions
- `GET /functions/{function_id}` - Get function details
- `PUT /functions/{function_id}` - Update function code
- `POST /functions/{function_id}/run` - Execute a function
- `DELETE /functions/{function_id}` - Delete a function

### Monitoring

- `GET /functions/{function_id}/metrics` - Get execution stats
- `GET /functions/{function_id}/logs` - Get execution logs

## Project Structure

```
lambda-serverless-function/
├── backend/
│   ├── api/           # FastAPI routes and endpoints
│   ├── core/          # Docker execution logic
│   ├── db/            # Database configurations
│   ├── schemas/       # Pydantic models
│   ├── static/        # Frontend (HTML/JS/CSS)
│   ├── tests/         # Test cases
│   └── main.py        # Entry point
├── docker/            # Docker configuration files
├── requirements.txt   # Python dependencies
```
