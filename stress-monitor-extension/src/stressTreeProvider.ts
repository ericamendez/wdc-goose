import * as vscode from 'vscode';
import { StressMonitor, StressLevel, StressEntry, CodingSession } from './stressMonitor';

export class StressTreeProvider implements vscode.TreeDataProvider<StressItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<StressItem | undefined | null | void> = new vscode.EventEmitter<StressItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<StressItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private stressMonitor: StressMonitor) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: StressItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: StressItem): Thenable<StressItem[]> {
        if (!element) {
            // Root level items
            const currentSession = this.stressMonitor.getCurrentSession();
            const currentSessionDuration = this.stressMonitor.getCurrentSessionDuration();
            const totalTimeToday = this.stressMonitor.getTotalCodingTimeToday();
            
            return Promise.resolve([
                new StressItem(
                    'Current Status',
                    `${this.getStressEmoji(this.stressMonitor.getCurrentLevel())} ${this.stressMonitor.getCurrentLevel()}`,
                    vscode.TreeItemCollapsibleState.None,
                    'current'
                ),
                new StressItem(
                    'Current Session',
                    currentSession && currentSession.isActive 
                        ? `⏱️ ${currentSessionDuration} minutes` 
                        : 'No active session',
                    vscode.TreeItemCollapsibleState.None,
                    'current-session'
                ),
                new StressItem(
                    'Today\'s Summary',
                    '',
                    vscode.TreeItemCollapsibleState.Expanded,
                    'summary'
                ),
                new StressItem(
                    'Coding Sessions',
                    `${this.stressMonitor.getTodaysSessions().length} sessions today`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'coding-sessions'
                ),
                new StressItem(
                    'Stress Events',
                    `${this.stressMonitor.getTodaysEntries().length} events`,
                    vscode.TreeItemCollapsibleState.Expanded,
                    'stress-events'
                ),
                new StressItem(
                    'Quick Actions',
                    '',
                    vscode.TreeItemCollapsibleState.Expanded,
                    'actions'
                )
            ]);
        } else if (element.contextValue === 'summary') {
            const totalTimeToday = this.stressMonitor.getTotalCodingTimeToday();
            const stats = this.stressMonitor.getSessionStats();
            const todaysSessions = this.stressMonitor.getTodaysSessions();
            
            return Promise.resolve([
                new StressItem(
                    `📊 Total Time Today`,
                    `${totalTimeToday} minutes`,
                    vscode.TreeItemCollapsibleState.None,
                    'stat'
                ),
                new StressItem(
                    `📈 Sessions Today`,
                    `${todaysSessions.length} sessions`,
                    vscode.TreeItemCollapsibleState.None,
                    'stat'
                ),
                new StressItem(
                    `⏱️ Average Session`,
                    `${stats.averageSessionLength} minutes`,
                    vscode.TreeItemCollapsibleState.None,
                    'stat'
                ),
                new StressItem(
                    `🏆 Longest Session`,
                    `${stats.longestSession} minutes`,
                    vscode.TreeItemCollapsibleState.None,
                    'stat'
                )
            ]);
        } else if (element.contextValue === 'coding-sessions') {
            const sessions = this.stressMonitor.getTodaysSessions();
            return Promise.resolve(
                sessions.map((session, index) => {
                    const duration = session.isActive 
                        ? this.stressMonitor.getCurrentSessionDuration()
                        : session.duration || 0;
                    const status = session.isActive ? ' (Active)' : '';
                    const stressCount = session.stressEvents.length;
                    
                    return new StressItem(
                        `Session ${index + 1}${status}`,
                        `${duration}min, ${stressCount} stress events`,
                        vscode.TreeItemCollapsibleState.Collapsed,
                        'session-detail',
                        session
                    );
                })
            );
        } else if (element.contextValue === 'session-detail' && element.session) {
            // Show stress events for this specific session
            return Promise.resolve(
                element.session.stressEvents.map(entry => new StressItem(
                    `${entry.timestamp.toLocaleTimeString()} - ${this.getStressEmoji(entry.level)} ${entry.level}`,
                    entry.notes || '',
                    vscode.TreeItemCollapsibleState.None,
                    'session-entry'
                ))
            );
        } else if (element.contextValue === 'stress-events') {
            // Show today's stress entries
            const entries = this.stressMonitor.getTodaysEntries();
            return Promise.resolve(
                entries.map(entry => new StressItem(
                    `${entry.timestamp.toLocaleTimeString()} - ${this.getStressEmoji(entry.level)} ${entry.level}`,
                    entry.notes || '',
                    vscode.TreeItemCollapsibleState.None,
                    'entry'
                ))
            );
        } else if (element.contextValue === 'actions') {
            const currentSession = this.stressMonitor.getCurrentSession();
            const actions = [
                new StressItem(
                    '😰 Report Stress',
                    'Click to log high stress',
                    vscode.TreeItemCollapsibleState.None,
                    'action-stress'
                ),
                new StressItem(
                    '😌 Report Calm',
                    'Click to log calm state',
                    vscode.TreeItemCollapsibleState.None,
                    'action-calm'
                )
            ];

            // Add session control actions
            if (currentSession && currentSession.isActive) {
                actions.push(new StressItem(
                    '⏹️ End Session',
                    'Stop current coding session',
                    vscode.TreeItemCollapsibleState.None,
                    'action-end-session'
                ));
            } else {
                actions.push(new StressItem(
                    '▶️ Start Session',
                    'Begin new coding session',
                    vscode.TreeItemCollapsibleState.None,
                    'action-start-session'
                ));
            }

            // Add dashboard action
            actions.push(new StressItem(
                '📊 Open Dashboard',
                'View detailed analytics',
                vscode.TreeItemCollapsibleState.None,
                'action-dashboard'
            ));

            return Promise.resolve(actions);
        }
        return Promise.resolve([]);
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

export class StressItem extends vscode.TreeItem {
    public readonly session?: CodingSession;

    constructor(
        public readonly label: string,
        public readonly description: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue: string,
        session?: CodingSession
    ) {
        super(label, collapsibleState);
        this.description = description;
        this.contextValue = contextValue;
        this.session = session;

        // Set icons and styling based on context
        this.setAppearance();

        // Add click commands for action items
        if (contextValue === 'action-stress') {
            this.command = {
                command: 'stressMonitor.reportStress',
                title: 'Report Stress'
            };
        } else if (contextValue === 'action-calm') {
            this.command = {
                command: 'stressMonitor.reportCalm',
                title: 'Report Calm'
            };
        } else if (contextValue === 'action-start-session') {
            this.command = {
                command: 'stressMonitor.startSession',
                title: 'Start Session'
            };
        } else if (contextValue === 'action-end-session') {
            this.command = {
                command: 'stressMonitor.endSession',
                title: 'End Session'
            };
        } else if (contextValue === 'action-dashboard') {
            this.command = {
                command: 'stressMonitor.openDashboard',
                title: 'Open Dashboard'
            };
        }
    }

    private setAppearance(): void {
        switch (this.contextValue) {
            case 'current':
                // Color-code current status
                if (this.label.includes('high')) {
                    this.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('errorForeground'));
                } else if (this.label.includes('medium')) {
                    this.iconPath = new vscode.ThemeIcon('info', new vscode.ThemeColor('notificationsWarningIcon.foreground'));
                } else {
                    this.iconPath = new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed'));
                }
                break;
            case 'current-session':
                this.iconPath = new vscode.ThemeIcon('clock');
                break;
            case 'summary':
                this.iconPath = new vscode.ThemeIcon('graph');
                break;
            case 'coding-sessions':
                this.iconPath = new vscode.ThemeIcon('history');
                break;
            case 'stress-events':
                this.iconPath = new vscode.ThemeIcon('pulse');
                break;
            case 'actions':
                this.iconPath = new vscode.ThemeIcon('rocket');
                break;
            case 'session-detail':
                if (this.label.includes('Active')) {
                    this.iconPath = new vscode.ThemeIcon('play-circle', new vscode.ThemeColor('testing.iconPassed'));
                } else {
                    this.iconPath = new vscode.ThemeIcon('circle-outline');
                }
                break;
            case 'action-stress':
                this.iconPath = new vscode.ThemeIcon('warning', new vscode.ThemeColor('errorForeground'));
                break;
            case 'action-calm':
                this.iconPath = new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed'));
                break;
            case 'action-start-session':
                this.iconPath = new vscode.ThemeIcon('play', new vscode.ThemeColor('testing.iconPassed'));
                break;
            case 'action-end-session':
                this.iconPath = new vscode.ThemeIcon('stop-circle', new vscode.ThemeColor('errorForeground'));
                break;
            case 'action-dashboard':
                this.iconPath = new vscode.ThemeIcon('dashboard', new vscode.ThemeColor('textLink.foreground'));
                break;
            case 'entry':
            case 'session-entry':
                // Color-code stress entries
                if (this.label.includes('😰') || this.label.includes('high')) {
                    this.iconPath = new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('errorForeground'));
                } else if (this.label.includes('😐') || this.label.includes('medium')) {
                    this.iconPath = new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('notificationsWarningIcon.foreground'));
                } else {
                    this.iconPath = new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor('testing.iconPassed'));
                }
                break;
            case 'stat':
                this.iconPath = new vscode.ThemeIcon('dashboard');
                break;
        }
    }
}
