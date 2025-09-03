import * as vscode from 'vscode';
import { StressMonitor, StressLevel } from './stressMonitor';

export class StressWebviewPanel {
    public static currentPanel: StressWebviewPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri, stressMonitor: StressMonitor) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (StressWebviewPanel.currentPanel) {
            StressWebviewPanel.currentPanel._panel.reveal(column);
            StressWebviewPanel.currentPanel.update(stressMonitor);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            'stressMonitorDashboard',
            'Stress Monitor Dashboard',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media'),
                    vscode.Uri.joinPath(extensionUri, 'out', 'compiled')
                ]
            }
        );

        StressWebviewPanel.currentPanel = new StressWebviewPanel(panel, extensionUri, stressMonitor);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, stressMonitor: StressMonitor) {
        this._panel = panel;

        // Set the webview's initial html content
        this.update(stressMonitor);

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programmatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    public update(stressMonitor: StressMonitor) {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview, stressMonitor);
    }

    public dispose() {
        StressWebviewPanel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview, stressMonitor: StressMonitor) {
        const currentLevel = stressMonitor.getCurrentLevel();
        const currentSession = stressMonitor.getCurrentSession();
        const todaysSessions = stressMonitor.getTodaysSessions();
        const todaysEntries = stressMonitor.getTodaysEntries();
        const stats = stressMonitor.getSessionStats();
        const totalTimeToday = stressMonitor.getTotalCodingTimeToday();

        // Color scheme based on stress level
        const getStressColor = (level: StressLevel) => {
            switch (level) {
                case 'high': return '#ff6b6b';
                case 'medium': return '#ffa726';
                case 'low': return '#66bb6a';
                default: return '#757575';
            }
        };

        const currentColor = getStressColor(currentLevel);

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Stress Monitor Dashboard</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    padding: 20px;
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    margin: 0;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding: 20px;
                    background: linear-gradient(135deg, ${currentColor}20, ${currentColor}10);
                    border-radius: 10px;
                    border: 2px solid ${currentColor};
                }
                .current-status {
                    font-size: 2em;
                    font-weight: bold;
                    color: ${currentColor};
                    margin-bottom: 10px;
                }
                .dashboard-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .card {
                    background-color: var(--vscode-panel-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 8px;
                    padding: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .card h3 {
                    margin-top: 0;
                    color: var(--vscode-textLink-foreground);
                    border-bottom: 2px solid var(--vscode-textLink-foreground);
                    padding-bottom: 10px;
                }
                .stat-value {
                    font-size: 1.5em;
                    font-weight: bold;
                    margin: 10px 0;
                }
                .stress-timeline {
                    background-color: var(--vscode-panel-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 8px;
                    padding: 20px;
                    margin-top: 20px;
                }
                .timeline-entry {
                    display: flex;
                    align-items: center;
                    margin: 10px 0;
                    padding: 8px;
                    border-radius: 5px;
                    background-color: var(--vscode-editor-background);
                }
                .timeline-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    margin-right: 15px;
                }
                .stress-high { background-color: #ff6b6b; }
                .stress-medium { background-color: #ffa726; }
                .stress-low { background-color: #66bb6a; }
                
                .session-bar {
                    width: 100%;
                    height: 20px;
                    background-color: var(--vscode-input-background);
                    border-radius: 10px;
                    margin: 10px 0;
                    position: relative;
                    overflow: hidden;
                }
                .session-progress {
                    height: 100%;
                    background: linear-gradient(90deg, #66bb6a, #4caf50);
                    border-radius: 10px;
                    transition: width 0.3s ease;
                }
                .refresh-button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin: 10px 5px;
                }
                .refresh-button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="current-status">
                    ${this.getStressEmoji(currentLevel)} Stress Level: ${currentLevel.toUpperCase()}
                </div>
                <div>
                    ${currentSession && currentSession.isActive 
                        ? `🕐 Current Session: ${stressMonitor.getCurrentSessionDuration()} minutes`
                        : '💤 No active session'
                    }
                </div>
            </div>

            <div class="dashboard-grid">
                <div class="card">
                    <h3>📊 Today's Summary</h3>
                    <div class="stat-value">${totalTimeToday} min</div>
                    <div>Total Coding Time</div>
                    <div class="stat-value">${todaysSessions.length}</div>
                    <div>Coding Sessions</div>
                    <div class="stat-value">${todaysEntries.length}</div>
                    <div>Stress Events</div>
                </div>

                <div class="card">
                    <h3>📈 Session Statistics</h3>
                    <div class="stat-value">${stats.averageSessionLength} min</div>
                    <div>Average Session</div>
                    <div class="stat-value">${stats.longestSession} min</div>
                    <div>Longest Session</div>
                    <div class="stat-value">${stats.totalSessions}</div>
                    <div>Total Sessions</div>
                </div>

                <div class="card">
                    <h3>⏱️ Current Session</h3>
                    ${currentSession && currentSession.isActive ? `
                        <div class="stat-value">${stressMonitor.getCurrentSessionDuration()} min</div>
                        <div>Duration</div>
                        <div class="session-bar">
                            <div class="session-progress" style="width: ${Math.min((stressMonitor.getCurrentSessionDuration() / 60) * 100, 100)}%"></div>
                        </div>
                        <div class="stat-value">${currentSession.stressEvents.length}</div>
                        <div>Stress Events</div>
                    ` : `
                        <div class="stat-value">-</div>
                        <div>No Active Session</div>
                        <button class="refresh-button" onclick="vscode.postMessage({command: 'startSession'})">
                            Start Session
                        </button>
                    `}
                </div>
            </div>

            <div class="stress-timeline">
                <h3>📋 Recent Stress Events</h3>
                ${todaysEntries.slice(-10).map(entry => `
                    <div class="timeline-entry">
                        <div class="timeline-dot stress-${entry.level}"></div>
                        <div>
                            <strong>${entry.timestamp.toLocaleTimeString()}</strong> - 
                            ${this.getStressEmoji(entry.level)} ${entry.level} 
                            ${entry.notes ? `(${entry.notes})` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>

            <div style="text-align: center; margin-top: 30px;">
                <button class="refresh-button" onclick="vscode.postMessage({command: 'refresh'})">
                    🔄 Refresh Dashboard
                </button>
                <button class="refresh-button" onclick="vscode.postMessage({command: 'reportStress'})">
                    😰 Report Stress
                </button>
                <button class="refresh-button" onclick="vscode.postMessage({command: 'reportCalm'})">
                    😌 Report Calm
                </button>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                
                // Auto-refresh every minute
                setInterval(() => {
                    vscode.postMessage({command: 'refresh'});
                }, 60000);
            </script>
        </body>
        </html>`;
    }

    private getStressEmoji(level: StressLevel): string {
        switch (level) {
            case 'low': return '😌';
            case 'medium': return '😐';
            case 'high': return '😰';
            default: return '❓';
        }
    }
}
