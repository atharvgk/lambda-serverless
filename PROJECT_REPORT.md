# Project Report: Serverless Function Platform

## 1. Executive Summary
This project implements a serverless function execution platform similar to AWS Lambda. It allows users to Upload, Manage, and Execute Python and JavaScript functions via a web interface. The system ensures isolation using Docker containers (with a fallback to local execution for demo environments), enforces timeouts, and provides a real-time monitoring dashboard for metrics.

## 2. System Architecture

### 2.1 Technology Stack
- **Backend**: FastAPI (Python) - chosen for high performance and easy async support.
- **Database**: SQLite - chosen for simplicity and portability (`/tmp/functions.db`).
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla) - chosen for lightweight deployment.
- **Visualization**: Chart.js - for rendering real-time execution metrics.
- **Containerization**: Docker - for isolated function execution.

### 2.2 Core Components
1.  **API Layer (`backend/api/`)**: Handles HTTP requests for uploading code and triggering execution.
2.  **Execution Engine (`backend/core/`)**:
    - **Docker Mode**: Spins up ephemeral containers to run user code securely.
    - **Simulation Mode**: Uses `subprocess` to run code locally when Docker is unavailable (e.g., Vercel Free Tier).
3.  **Metrics Engine**: Captures CPU usage, Memory usage, and Execution time for every run.

## 3. Design Decisions & Trade-offs

### 3.1 Database: SQLite vs PostgreSQL
- **Decision**: Used SQLite.
- **Reasoning**: The requirement was for a self-contained prototype. SQLite requires no external server setup, making the project easier to run locally and deploy as a demo. We utilized `/tmp` storage to ensure compatibility with read-only serverless filesystems.

### 3.2 Frontend: Static vs Streamlit
- **Decision**: Migrated from Streamlit to Static HTML/JS.
- **Reasoning**: Streamlit was excellent for rapid prototyping (Week 1), but for the final submission (Week 3), a custom frontend provided:
    - Lower bundle size (critical for Vercel deployment).
    - Better control over UI/UX (Tabs, Modals).
    - Ability to integrate custom Chart.js visualizations.

### 3.3 Execution Strategy: Lazy Loading
- **Decision**: Implemented "Lazy" Docker client initialization.
- **Reasoning**: Initializing Docker on app startup caused crashes in environments where Docker wasn't present. Moving this to the "execution time" allowed the app to remain stable even without Docker (falling back to simulation).

## 4. Challenges & Solutions

### 4.1 Challenge: Vercel Read-Only Filesystem
- **Issue**: The application crashed when trying to save the SQLite database to the root directory on Vercel.
- **Solution**: We implemented a dynamic path selection using python's `tempfile` module `os.path.join(tempfile.gettempdir(), "functions.db")`. This automatically selects a writable location on any OS (Windows/Linux).

### 4.2 Challenge: Docker in Serverless
- **Issue**: Vercel and similar free PaaS providers do not support running Docker inside their containers (Docker-in-Docker is expensive/security risk).
- **Solution**: We built a **Dual-Mode Executor**. The system checks if Docker is available. If yes, it uses containers (Secure). If no, it falls back to `subprocess` execution (Simulation). This ensures the "Live Link" works for the demo while preserving the "Real" architecture for local use.

### 4.3 Challenge: Metrics Visualization
- **Issue**: Visualizing real-time data efficiently.
- **Solution**: We implemented an endpoint `/functions/{id}/metrics` that aggregates data on the SQL side, minimizing the processing done by the frontend. Chart.js was used to render this responsive data.

## 5. Future Scope
- **gVisor Integration**: Fully enable the `runsc` runtime for enhanced security (logic is present, requires configured host).
- **Authentication**: Add User auth for multi-user isolation.
- **Horizontal Scaling**: Use Kubernetes to manage the container pool across multiple nodes.
