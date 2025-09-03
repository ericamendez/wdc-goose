import * as vscode from 'vscode';
import { StressTreeProvider } from './stressTreeProvider';
import { StressMonitor } from './stressMonitor';
import { StressWebviewPanel } from './webviewPanel';
import { RecipeExecutor } from './recipeExecutor';

export function activate(context: vscode.ExtensionContext) {
    console.log('Stress Monitor extension is now active!');
    
    const stressMonitor = new StressMonitor();
    const stressTreeProvider = new StressTreeProvider(stressMonitor);
    
    // Create status bar item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    updateStatusBar(statusBarItem, stressMonitor);
    statusBarItem.show();
    
    // Register the tree view
    const treeView = vscode.window.createTreeView('stressMonitor', {
        treeDataProvider: stressTreeProvider,
        showCollapseAll: true
    });

    // Dynamic refresh system that adjusts interval based on Goose status
    let refreshInterval: NodeJS.Timeout;
    let currentRefreshRate = 60000; // Start with slow refresh
    
    const refreshUI = () => {
        stressTreeProvider.refresh();
        updateStatusBar(statusBarItem, stressMonitor);
        updateRefreshRate(); // Check if refresh rate needs to change
    };
    
    const updateRefreshRate = () => {
        const gooseStatus = stressMonitor.getGooseStatus();
        const newRefreshRate = (gooseStatus !== 'idle' && gooseStatus !== 'completed') ? 2000 : 60000;
        
        // Only update interval if rate changed
        if (newRefreshRate !== currentRefreshRate) {
            currentRefreshRate = newRefreshRate;
            clearInterval(refreshInterval);
            refreshInterval = setInterval(refreshUI, currentRefreshRate);
            console.log(`Refresh rate changed to ${currentRefreshRate}ms (Goose status: ${gooseStatus})`);
        }
    };

    // Set up stress level change callback for auto-triggering recipes
    stressMonitor.setStressLevelChangeCallback(async (newLevel, previousLevel) => {
        if (newLevel === 'high') {
            // Automatically trigger Universal Development Assistant without asking
            vscode.window.showInformationMessage('🤖 Stress detected! Auto-activating Universal Development Assistant...');
            await RecipeExecutor.executeStressDebugRecipe(context, stressMonitor, refreshUI);
        }
    });

    // Register commands
    const reportStressCommand = vscode.commands.registerCommand(
        'stressMonitor.reportStress', 
        () => {
            stressMonitor.reportStressWithCallback();
            stressTreeProvider.refresh();
            updateStatusBar(statusBarItem, stressMonitor);
            vscode.window.showInformationMessage('Stress level recorded! 😰');
        }
    );

    const reportCalmCommand = vscode.commands.registerCommand(
        'stressMonitor.reportCalm', 
        () => {
            stressMonitor.reportCalmWithCallback();
            stressTreeProvider.refresh();
            updateStatusBar(statusBarItem, stressMonitor);
            vscode.window.showInformationMessage('Feeling better! 😌');
        }
    );

    const clearHistoryCommand = vscode.commands.registerCommand(
        'stressMonitor.clearHistory', 
        () => {
            stressMonitor.clearHistory();
            stressTreeProvider.refresh();
            vscode.window.showInformationMessage('History cleared!');
        }
    );

    const startSessionCommand = vscode.commands.registerCommand(
        'stressMonitor.startSession',
        () => {
            stressMonitor.startCodingSession();
            stressTreeProvider.refresh();
            vscode.window.showInformationMessage('Coding session started! ⏱️');
        }
    );

    const endSessionCommand = vscode.commands.registerCommand(
        'stressMonitor.endSession',
        () => {
            const currentSession = stressMonitor.getCurrentSession();
            if (currentSession && currentSession.isActive) {
                const duration = stressMonitor.getCurrentSessionDuration();
                stressMonitor.endCodingSession();
                stressTreeProvider.refresh();
                vscode.window.showInformationMessage(`Session ended! Duration: ${duration} minutes 🎯`);
            } else {
                vscode.window.showWarningMessage('No active session to end.');
            }
        }
    );

    const openDashboardCommand = vscode.commands.registerCommand(
        'stressMonitor.openDashboard',
        () => {
            StressWebviewPanel.createOrShow(context.extensionUri, stressMonitor);
        }
    );

    const triggerDebugRecipeCommand = vscode.commands.registerCommand(
        'stressMonitor.triggerDebugRecipe',
        async () => {
            vscode.window.showInformationMessage('🤖 Starting Goose Debug Assistant...');
            await RecipeExecutor.executeStressDebugRecipe(context, stressMonitor, refreshUI);
        }
    );

    const markGooseIdleCommand = vscode.commands.registerCommand(
        'stressMonitor.markGooseIdle',
        () => {
            stressMonitor.setGooseStatus('idle');
            stressMonitor.setGooseAction('');
            refreshUI();
            vscode.window.showInformationMessage('🛌 Goose marked as idle');
        }
    );

    const stopGooseCommand = vscode.commands.registerCommand(
        'stressMonitor.stopGoose',
        () => {
            stressMonitor.setGooseStatus('idle');
            stressMonitor.setGooseAction('');
            refreshUI();
            vscode.window.showInformationMessage('🛑 Goose stopped');
        }
    );

    // Initial interval setup
    refreshInterval = setInterval(refreshUI, currentRefreshRate);

    context.subscriptions.push(
        treeView,
        statusBarItem,
        reportStressCommand,
        reportCalmCommand,
        clearHistoryCommand,
        startSessionCommand,
        endSessionCommand,
        openDashboardCommand,
        triggerDebugRecipeCommand,
        markGooseIdleCommand,
        stopGooseCommand,
        { dispose: () => clearInterval(refreshInterval) }
    );
}

function updateStatusBar(statusBarItem: vscode.StatusBarItem, stressMonitor: StressMonitor): void {
    const currentLevel = stressMonitor.getCurrentLevel();
    const currentSession = stressMonitor.getCurrentSession();
    const sessionDuration = stressMonitor.getCurrentSessionDuration();
    
    let icon = '';
    let color = '';
    
    switch (currentLevel) {
        case 'high':
            icon = '$(warning)';
            color = 'errorForeground';
            break;
        case 'medium':
            icon = '$(info)';
            color = 'notificationsWarningIcon.foreground';
            break;
        case 'low':
            icon = '$(check)';
            color = 'testing.iconPassed';
            break;
    }
    
    const sessionInfo = currentSession && currentSession.isActive 
        ? ` | ${sessionDuration}min`
        : '';
    
    statusBarItem.text = `${icon} Stress: ${currentLevel}${sessionInfo}`;
    statusBarItem.color = new vscode.ThemeColor(color);
    statusBarItem.tooltip = `Current stress level: ${currentLevel}${sessionInfo ? ` | Session duration: ${sessionDuration} minutes` : ''}`;
    statusBarItem.command = 'stressMonitor.reportStress';
}

export function deactivate() {}
