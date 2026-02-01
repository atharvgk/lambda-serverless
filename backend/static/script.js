const API_URL = '';

document.addEventListener('DOMContentLoaded', () => {
    fetchFunctions();

    document.getElementById('uploadForm').addEventListener('submit', handleUpload);
    document.getElementById('refreshBtn').addEventListener('click', fetchFunctions);

    // Close modal logic
    document.querySelector('.close').onclick = function () {
        document.getElementById('logsModal').style.display = 'none';
    }
    window.onclick = function (event) {
        if (event.target == document.getElementById('logsModal')) {
            document.getElementById('logsModal').style.display = 'none';
        }
    }
});

async function fetchFunctions() {
    const listContainer = document.getElementById('functionsList');
    listContainer.innerHTML = '<div class="loading">Loading functions...</div>';

    try {
        const response = await fetch(`${API_URL}/functions/`);
        const functions = await response.json();

        if (functions.length === 0) {
            listContainer.innerHTML = '<div class="message">No functions found. Upload one to get started!</div>';
            return;
        }

        listContainer.innerHTML = '';
        functions.forEach(func => {
            // Returns [id, name, language, code, timeout]
            const [id, name, language, code, timeout] = func;

            const card = document.createElement('div');
            card.className = 'function-item';
            card.innerHTML = `
                <div class="function-header">
                    <div>
                        <div class="function-name">
                            ${name}
                            <span class="tag ${language}">${language}</span>
                        </div>
                        <div class="function-meta">ID: ${id} • Timeout: ${timeout}s</div>
                    </div>
                </div>
                <div class="function-actions">
                    <button class="btn action" onclick="viewLogs(${id})">📄 Logs</button>
                    <button class="btn action" onclick="runFunction(${id})">▶ Run</button>
                    <button class="btn danger" onclick="deleteFunction(${id})">🗑 Delete</button>
                </div>
            `;
            listContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Error fetching functions:', error);
        listContainer.innerHTML = '<div class="message error">Failed to load functions.</div>';
    }
}

async function handleUpload(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const msgDiv = document.getElementById('uploadMessage');

    const name = document.getElementById('fnName').value;
    const language = document.getElementById('fnLanguage').value;
    const timeout = parseInt(document.getElementById('fnTimeout').value);
    const code = document.getElementById('fnCode').value;

    btn.disabled = true;
    btn.textContent = 'Uploading...';
    msgDiv.textContent = '';
    msgDiv.className = 'message';

    try {
        const response = await fetch(`${API_URL}/functions/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, language, timeout, code })
        });

        if (response.ok) {
            msgDiv.textContent = 'Function uploaded successfully!';
            msgDiv.classList.add('success');
            document.getElementById('uploadForm').reset();
            fetchFunctions();
        } else {
            const err = await response.json();
            throw new Error(err.detail || 'Upload failed');
        }
    } catch (error) {
        msgDiv.textContent = error.message;
        msgDiv.classList.add('error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Upload Function';
    }
}

async function deleteFunction(id) {
    if (!confirm('Are you sure you want to delete this function?')) return;

    try {
        const response = await fetch(`${API_URL}/functions/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            fetchFunctions();
        } else {
            alert('Failed to delete function');
        }
    } catch (error) {
        console.error('Error deleting function:', error);
        alert('Error deleting function');
    }
}

async function viewLogs(id) {
    const modal = document.getElementById('logsModal');
    const content = document.getElementById('logsContent');
    modal.style.display = 'block';
    content.textContent = 'Loading logs...';

    try {
        const response = await fetch(`${API_URL}/functions/${id}/logs`);
        if (response.ok) {
            const logs = await response.json();
            content.textContent = JSON.stringify(logs, null, 2);
        } else {
            content.textContent = 'No logs found or error fetching logs.';
        }
    } catch (error) {
        content.textContent = 'Error fetching logs.';
    }
}

async function runFunction(id) {
    const modal = document.getElementById('logsModal');
    const content = document.getElementById('logsContent');
    modal.style.display = 'block';
    content.textContent = 'Running function...';

    try {
        const response = await fetch(`${API_URL}/functions/${id}/run`, { method: 'POST' });
        if (response.ok) {
            const result = await response.json();
            content.textContent = `Result:\n${result.result}\n\nExecution Time: ${result.exec_time}s\nRuntime: ${result.runtime}`;
        } else {
            const error = await response.json();
            content.textContent = `Error: ${error.detail || 'Execution failed'}`;
        }
    } catch (error) {
        content.textContent = 'Error executing function.';
    }
}
