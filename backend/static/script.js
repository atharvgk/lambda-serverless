const API_URL = '';
let myTimeChart = null;
let myCpuChart = null;

document.addEventListener('DOMContentLoaded', () => {
    fetchFunctions();
    populateMonitorSelect();

    document.getElementById('uploadForm').addEventListener('submit', handleUpload);
    document.getElementById('refreshBtn').addEventListener('click', () => {
        fetchFunctions();
        populateMonitorSelect();
    });
});

// Tab Logic
function switchTab(tabId) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    // Show active tab
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`button[onclick="switchTab('${tabId}')"]`).classList.add('active');
}

// Modal Logic
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// Fetch Functions
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
                    <button class="btn action" onclick="editFunction(${id})">📝 Edit</button>
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

// Upload Function
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, language, timeout, code })
        });

        if (response.ok) {
            msgDiv.textContent = 'Function uploaded successfully!';
            msgDiv.classList.add('success');
            document.getElementById('uploadForm').reset();
            fetchFunctions();
            populateMonitorSelect();
            setTimeout(() => switchTab('manage'), 1000);
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

// Delete Function
async function deleteFunction(id) {
    if (!confirm('Are you sure you want to delete this function?')) return;
    try {
        const response = await fetch(`${API_URL}/functions/${id}`, { method: 'DELETE' });
        if (response.ok) {
            fetchFunctions();
            populateMonitorSelect();
        } else {
            alert('Failed to delete function');
        }
    } catch (error) {
        alert('Error deleting function');
    }
}

// View Logs
async function viewLogs(id) {
    const modal = document.getElementById('logsModal');
    const content = document.getElementById('logsContent');
    modal.style.display = 'block';

    // Position modal close logic
    modal.querySelector('.close').onclick = () => closeModal('logsModal');

    content.textContent = 'Loading logs...';
    try {
        const response = await fetch(`${API_URL}/functions/${id}/logs`);
        if (response.ok) {
            const logs = await response.json();
            content.textContent = logs.length ? JSON.stringify(logs, null, 2) : 'No logs available.';
        } else {
            content.textContent = 'No logs found.';
        }
    } catch (error) {
        content.textContent = 'Error fetching logs.';
    }
}

// Run Function
async function runFunction(id) {
    const modal = document.getElementById('logsModal');
    const content = document.getElementById('logsContent');
    modal.style.display = 'block';
    modal.querySelector('.close').onclick = () => closeModal('logsModal');

    content.textContent = 'Running function...';

    try {
        const response = await fetch(`${API_URL}/functions/${id}/run`, { method: 'POST' });
        if (response.ok) {
            const result = await response.json();
            content.textContent = `Result:\n${result.result}\n\nExecution Time: ${result.exec_time}s\nRuntime: ${result.runtime}`;
            // Refresh monitor if that tab is active
            populateMonitorSelect();
        } else {
            const error = await response.json();
            content.textContent = `Error: ${error.detail || 'Execution failed'}`;
        }
    } catch (error) {
        content.textContent = 'Error executing function.';
    }
}

// Edit Function
async function editFunction(id) {
    const modal = document.getElementById('editModal');
    const codeArea = document.getElementById('editFnCode');
    document.getElementById('editFnId').value = id;

    modal.style.display = 'block';
    codeArea.value = 'Loading code...';

    try {
        const response = await fetch(`${API_URL}/functions/${id}/code`);
        if (response.ok) {
            const data = await response.json();
            codeArea.value = data.code;
        } else {
            codeArea.value = 'Error fetching code.';
        }
    } catch (error) {
        codeArea.value = 'Error fetching code.';
    }
}

async function saveCode() {
    const id = document.getElementById('editFnId').value;
    const code = document.getElementById('editFnCode').value;

    try {
        const response = await fetch(`${API_URL}/functions/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });

        if (response.ok) {
            alert('Code updated successfully!');
            closeModal('editModal');
            fetchFunctions();
        } else {
            alert('Failed to update code.');
        }
    } catch (error) {
        alert('Error updating code.');
    }
}

// Monitoring Dashboard
async function populateMonitorSelect() {
    const select = document.getElementById('monitorSelect');
    try {
        const response = await fetch(`${API_URL}/functions/`);
        const functions = await response.json();

        select.innerHTML = '<option value="">Select a function...</option>';
        functions.forEach(func => {
            const option = document.createElement('option');
            option.value = func[0]; // ID
            option.textContent = func[1]; // Name
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching functions for monitor');
    }
}

async function fetchMetrics() {
    const id = document.getElementById('monitorSelect').value;
    const grid = document.getElementById('metricsGrid');
    const charts = document.getElementById('chartsContainer');

    if (!id) {
        grid.classList.add('hidden');
        charts.classList.add('hidden');
        return;
    }

    try {
        // Fetch Aggregated Metrics
        const metricsRes = await fetch(`${API_URL}/functions/${id}/metrics`);
        const metrics = await metricsRes.json();

        document.getElementById('totalRuns').textContent = metrics.total_runs;
        document.getElementById('avgTime').textContent = metrics.avg_exec_time + 's';
        document.getElementById('avgCpu').textContent = metrics.avg_cpu_percent + '%';
        document.getElementById('lastRun').textContent = metrics.last_run_time || '-';

        grid.classList.remove('hidden');
        charts.classList.remove('hidden');

        // Fetch Logs for Charts
        const logsRes = await fetch(`${API_URL}/functions/${id}/logs`);
        const logs = await logsRes.json();

        renderCharts(logs);

    } catch (error) {
        console.error('Error fetching metrics', error);
    }
}

function renderCharts(logs) {
    // Process logs (reverse chronological order usually, so reverse for chart)
    const data = logs.reverse().slice(-20); // Last 20 runs
    const labels = data.map(l => new Date(l[6]).toLocaleTimeString());
    const times = data.map(l => l[2]);
    const cpu = data.map(l => parseFloat(l[4]));

    const timeCtx = document.getElementById('timeChart').getContext('2d');
    const cpuCtx = document.getElementById('cpuChart').getContext('2d');

    // Destroy existing charts if they exist
    if (myTimeChart) myTimeChart.destroy();
    if (myCpuChart) myCpuChart.destroy();

    myTimeChart = new Chart(timeCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Execution Time (s)',
                data: times,
                borderColor: '#60a5fa',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: { title: { display: true, text: 'Recent Execution Times' } },
            scales: { y: { beginAtZero: true } }
        }
    });

    myCpuChart = new Chart(cpuCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'CPU Usage (%)',
                data: cpu,
                backgroundColor: '#a855f7'
            }]
        },
        options: {
            responsive: true,
            plugins: { title: { display: true, text: 'Recent CPU Usage' } },
            scales: { y: { beginAtZero: true } }
        }
    });
}
