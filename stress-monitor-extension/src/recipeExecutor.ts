import * as vscode from 'vscode';
import * as path from 'path';

export class RecipeExecutor {
    
    /**
     * Execute a Goose recipe by opening the terminal and running the goose command
     */
    static async executeStressDebugRecipe(context: vscode.ExtensionContext): Promise<void> {
        try {
            // Get the workspace folder
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('No workspace folder found. Please open a folder to use the debug recipe.');
                return;
            }

            // Path to the recipe file
            const recipePath = path.join(workspaceFolder.uri.fsPath, '..', 'smart-stress-debug.yaml');
            
            // Get current file context
            const activeEditor = vscode.window.activeTextEditor;
            let contextInfo = '';
            
            if (activeEditor) {
                const document = activeEditor.document;
                const selection = activeEditor.selection;
                const currentLine = selection.active.line + 1;
                
                contextInfo = `Currently working on: ${document.fileName} at line ${currentLine}`;
            }

            // Show notification that recipe is starting
            vscode.window.showInformationMessage(
                '🤖 Starting Goose Debug Assistant...', 
                'Open Terminal'
            ).then(selection => {
                if (selection === 'Open Terminal') {
                    vscode.commands.executeCommand('workbench.action.terminal.focus');
                }
            });

            // Create or get terminal
            const terminal = vscode.window.createTerminal({
                name: 'Goose Debug Assistant',
                cwd: workspaceFolder.uri.fsPath
            });

            // Show the terminal
            terminal.show();

            // Execute the recipe
            const command = `goose run ${recipePath}`;
            terminal.sendText(command);

            // Add context information
            if (contextInfo) {
                setTimeout(() => {
                    terminal.sendText(`# ${contextInfo}`);
                }, 1000);
            }

        } catch (error) {
            console.error('Error executing stress debug recipe:', error);
            vscode.window.showErrorMessage(`Failed to execute debug recipe: ${error}`);
        }
    }

    /**
     * Execute a recipe with custom parameters
     */
    static async executeRecipeWithContext(recipePath: string, context: any): Promise<void> {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('No workspace folder found.');
                return;
            }

            const terminal = vscode.window.createTerminal({
                name: 'Goose Assistant',
                cwd: workspaceFolder.uri.fsPath
            });

            terminal.show();
            
            // Execute the recipe
            terminal.sendText(`goose run ${recipePath}`);
            
            // Send context information as initial input
            if (context.currentFile) {
                setTimeout(() => {
                    terminal.sendText(`Currently working on: ${context.currentFile} at line ${context.currentLine}`);
                }, 1000);
            }

        } catch (error) {
            console.error('Error executing recipe:', error);
            vscode.window.showErrorMessage(`Failed to execute recipe: ${error}`);
        }
    }

    /**
     * Get current VS Code context for recipe execution
     */
    static getCurrentContext(): any {
        const activeEditor = vscode.window.activeTextEditor;
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        
        const context = {
            workspaceFolder: workspaceFolder?.uri.fsPath,
            timestamp: new Date().toISOString()
        };

        if (activeEditor) {
            const document = activeEditor.document;
            const selection = activeEditor.selection;
            
            Object.assign(context, {
                currentFile: document.fileName,
                currentLine: selection.active.line + 1,
                currentColumn: selection.active.character + 1,
                selectedText: document.getText(selection),
                languageId: document.languageId,
                isDirty: document.isDirty
            });
        }

        return context;
    }

    /**
     * Check if Goose is available in the system
     */
    static async checkGooseAvailability(): Promise<boolean> {
        try {
            const terminal = vscode.window.createTerminal({
                name: 'Goose Check',
                hideFromUser: true
            });
            
            return new Promise((resolve) => {
                terminal.sendText('goose --version');
                
                // Simple check - if command doesn't fail immediately, assume it's available
                setTimeout(() => {
                    terminal.dispose();
                    resolve(true);
                }, 2000);
            });
            
        } catch (error) {
            return false;
        }
    }

    /**
     * Show recipe selection dialog
     */
    static async showRecipeSelector(): Promise<void> {
        const recipes = [
            {
                label: '🚨 Stress Debug Assistant',
                description: 'Get help debugging your current code when stressed',
                path: 'smart-stress-debug.yaml'
            },
            {
                label: '🔍 Basic Debug Helper',
                description: 'Simple debugging assistance',
                path: 'stress-triggered-debug.yaml'
            }
        ];

        const selected = await vscode.window.showQuickPick(recipes, {
            placeHolder: 'Select a debugging recipe to run'
        });

        if (selected) {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (workspaceFolder) {
                const fullPath = path.join(workspaceFolder.uri.fsPath, '..', selected.path);
                await this.executeRecipeWithContext(fullPath, this.getCurrentContext());
            }
        }
    }
}
