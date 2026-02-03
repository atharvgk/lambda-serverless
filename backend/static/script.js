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

    // Clear form when switching to Upload tab
    document.querySelector('button[onclick="switchTab(\'upload\')"]').addEventListener('click', () => {
        document.getElementById('uploadForm').reset();
        document.getElementById('uploadFnId').value = '';
        document.querySelector('#uploadForm button[type="submit"]').textContent = 'Upload Function';
        document.querySelector('#upload h2').textContent = '🚀 Upload A New Function';
    });
});

// Tab Logic
// Tab Logic
function switchTab(tabId) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    // Show active tab
    const tabContent = document.getElementById(tabId);
    if (tabContent) tabContent.classList.add('active');

    // Highlight active button (Robust matching)
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        if (btn.getAttribute('onclick').includes(tabId)) {
            btn.classList.add('active');
        }
    });
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
                    <button class="btn action" onclick="openFunctionDetails(${id})">▶ Open Console</button>
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

    const fnId = document.getElementById('uploadFnId').value;
    const isEdit = !!fnId;
    const url = isEdit ? `${API_URL}/functions/${fnId}` : `${API_URL}/functions/`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
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

// Unified "Function Details" Modal (Restoring Streamlit-like feel)
async function openFunctionDetails(id) {
    const modal = document.getElementById('detailsModal');
    const title = document.getElementById('detailsTitle');
    const codePre = document.getElementById('detailsCode');
    const logsPre = document.getElementById('detailsLogs');
    const outputPre = document.getElementById('detailsOutput');

    // Reset contents
    modal.style.display = 'block';
    title.textContent = `Function ID: ${id}`;
    codePre.textContent = 'Loading...';
    logsPre.textContent = 'Loading logs...';
    outputPre.textContent = 'Ready to run...'; // Reset output

    // Store active function ID for the "Run" button inside the modal
    document.getElementById('detailsRunBtn').onclick = () => runFunctionInsideModal(id);
    document.getElementById('detailsCloseBtn').onclick = () => closeModal('detailsModal');

    try {
        // 1. Fetch Code
        const codeRes = await fetch(`${API_URL}/functions/${id}/code`);
        if (codeRes.ok) {
            const data = await codeRes.json();
            codePre.textContent = data.code;
        }

        // 2. Fetch Logs
        fetchLogsForModal(id);

    } catch (e) {
        console.error(e);
    }
}

async function fetchLogsForModal(id) {
    const logsPre = document.getElementById('detailsLogs');
    try {
        const res = await fetch(`${API_URL}/functions/${id}/logs`);
        if (res.ok) {
            const logs = await res.json();
            if (logs.length === 0) {
                logsPre.textContent = "No logs yet.";
                return;
            }
            // Sort by latest first
            const sortedLogs = logs.reverse();

            // Format logs nicely
            const formatted = sortedLogs.map(l => {
                const time = l[6] ? new Date(l[6]).toLocaleTimeString() : 'Unknown';
                const status = (l[5] || 'Unknown').toUpperCase();
                const exec = l[2] || 0;
                // Log structure: [id, func_id, exec_time, output, mem, status, time]
                // Output is at index 3
                let rawOutput = l[3] || '';
                let snippet = rawOutput.length > 50 ? rawOutput.substring(0, 50) + '...' : rawOutput;
                snippet = snippet.replace(/\n/g, ' '); // linearize for list view

                return `[${time}] ${status} | ${exec}s | Out: ${snippet}`;
            }).join('\n');

            logsPre.textContent = formatted;
        } else {
            logsPre.textContent = "No logs found.";
        }
    } catch (e) {
        logsPre.textContent = "Error fetching logs.";
    }
}

async function runFunctionInsideModal(id) {
    const outputPre = document.getElementById('detailsOutput');
    const runtimeSelect = document.getElementById('detailsRuntime');
    // Hack: Send the chosen runtime as the gVisor flag (true=gVisor, false=Docker)
    const useGvisor = runtimeSelect ? (runtimeSelect.value === 'true') : false;
    outputPre.textContent = 'Executing...';

    try {
        const response = await fetch(`${API_URL}/functions/${id}/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ use_gvisor: useGvisor })
        });

        if (response.ok) {
            const result = await response.json();
            outputPre.textContent = `> Output:\n${result.result}\n\n> Stats:\nTime: ${result.exec_time}s\nRuntime: ${result.runtime}`;
            // Refresh logs pane
            fetchLogsForModal(id);
            // Refresh charts if needed
            fetchMetrics();
        } else {
            const error = await response.json();
            outputPre.textContent = `Error: ${error.detail || 'Failed'}`;
        }
    } catch (error) {
        outputPre.textContent = 'Network Error executing function.';
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

        let lastRun = '-';
        if (metrics.last_run_time) {
            try {
                const d = new Date(metrics.last_run_time);
                lastRun = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
                    ', ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
            } catch (e) { lastRun = metrics.last_run_time; }
        }
        document.getElementById('lastRun').textContent = lastRun;

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

// Edit Function
async function editFunction(id) {
    try {
        const codeRes = await fetch(`${API_URL}/functions/${id}/code`);
        const codeData = await codeRes.json();
        const code = codeData.code;
        const res = await fetch(`${API_URL}/functions/`);
        const functions = await res.json();
        const func = functions.find(f => f[0] === id);
        if (func) {
            document.getElementById('fnName').value = func[1];
            document.getElementById('fnLanguage').value = func[2];
            document.getElementById('fnCode').value = code;
            document.getElementById('fnTimeout').value = func[4];
            switchTab('upload');
            window.scrollTo(0, 0);
            document.getElementById('uploadFnId').value = id; // Set hidden ID
            document.querySelector('#uploadForm button[type="submit"]').textContent = 'Update Function';
            document.querySelector('#upload h2').textContent = '📝 Edit Function';
            const msgDiv = document.getElementById('uploadMessage');
            msgDiv.textContent = 'Editing Function ID: ' + id;
            msgDiv.className = 'message';
        }
    } catch (e) { console.error('Error editing', e); alert('Failed to load function data.'); }
}
