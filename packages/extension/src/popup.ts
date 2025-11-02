/**
 * DOMINATRIX Popup UI
 */

// Check connection status
const statusIndicator = document.getElementById('status')!;
const statusText = document.getElementById('status-text')!;

// Try to connect to check if server is running
const ws = new WebSocket('ws://localhost:9222');

ws.onopen = () => {
  statusIndicator.classList.add('connected');
  statusText.textContent = 'Connected to server';
  ws.close();
};

ws.onerror = () => {
  statusIndicator.classList.add('disconnected');
  statusText.textContent = 'Server not running';
};

ws.onclose = () => {
  if (!statusIndicator.classList.contains('connected')) {
    statusIndicator.classList.add('disconnected');
    statusText.textContent = 'Server not running';
  }
};
