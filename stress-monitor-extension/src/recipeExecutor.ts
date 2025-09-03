import * as vscode from 'vscode';
import * as path from 'path';

export class RecipeExecutor {
    
    /**
     * Execute the Universal Development Assistant recipe from Goose Desktop app
     */
    static async executeStressDebugRecipe(context: vscode.ExtensionContext): Promise<void> {
        try {
            // Get the workspace folder
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('No workspace folder found. Please open a folder to trigger Universal Development Assistant.');
                return;
            }

            // Get current file context
            const activeEditor = vscode.window.activeTextEditor;
            let contextInfo = '';
            
            if (activeEditor) {
                const document = activeEditor.document;
                const selection = activeEditor.selection;
                const currentLine = selection.active.line + 1;
                const currentColumn = selection.active.character + 1;
                const currentLineText = document.lineAt(selection.active.line).text.trim();
                const selectedText = document.getText(selection);
                
                // Get surrounding context for better debugging
                const startLine = Math.max(0, selection.active.line - 3);
                const endLine = Math.min(document.lineCount - 1, selection.active.line + 3);
                const surroundingCode = document.getText(new vscode.Range(startLine, 0, endLine, document.lineAt(endLine).text.length));
                
                contextInfo = `DEBUGGING CONTEXT - I need help fixing code at line ${currentLine} in ${path.basename(document.fileName)}.\n\nCURRENT PROBLEMATIC LINE (${currentLine}): ${currentLineText}\n\nSURROUNDING CODE:\n${surroundingCode}`;
                
                if (selectedText) {
                    contextInfo += `\n\nSELECTED TEXT TO FIX: ${selectedText}`;
                }
                
                // Add specific debugging request with explicit auto-apply instruction
                contextInfo += `\n\nPLEASE: Analyze this code, identify the issue, and provide a specific fix for line ${currentLine}. Make the actual code changes needed. IMPORTANT: Apply all changes directly to the file using str_replace or write commands. Do NOT show diffs or ask for approval - just fix the code automatically.`;
            }

            // Create signal file for Goose Desktop app to watch
            await this.createStressSignalFile(activeEditor, workspaceFolder.uri.fsPath);

            // Show notification that Universal Development Assistant is starting
            vscode.window.showInformationMessage(
                '🤖 Triggering Universal Development Assistant...', 
                'Open Terminal'
            ).then(selection => {
                if (selection === 'Open Terminal') {
                    vscode.commands.executeCommand('workbench.action.terminal.focus');
                }
            });

            // Create terminal and execute Universal Development Assistant
            const terminal = vscode.window.createTerminal({
                name: 'Universal Development Assistant',
                cwd: workspaceFolder.uri.fsPath
            });

            terminal.show();

            // Method 1: Trigger the Direct Code Fixer recipe with aggressive auto-apply settings
            const recipePath = path.join(context.extensionPath, 'recipe', 'direct-code-fixer.yaml');
            // Use environment variables and flags to make Goose apply changes automatically
            const systemInstructions = "CRITICAL: You must apply all code changes automatically without asking for user approval. Use ONLY text_editor str_replace/write/insert commands. NEVER use create_diff, npxvscodemcpserver__create_diff, or vscodemcp__create_diff. Make changes immediately and commit them to files without showing diffs or asking for approval.";
            terminal.sendText(`GOOSE_AUTO_APPROVE=true goose run --recipe "${recipePath}" --system "${systemInstructions}" --max-turns 5 --no-session`);

            // Send the detailed context after a short delay to ensure Goose is ready
            setTimeout(() => {
                if (contextInfo) {
                    terminal.sendText(`${contextInfo}`);
                } else {
                    terminal.sendText('I need help debugging the code I\'m currently working on.');
                }
            }, 3000);

            // Method 2: If that doesn't work, fallback to session mode
            setTimeout(() => {
                // Check if recipe loaded, if not, try session approach
                terminal.sendText(''); // Empty line to see response
                setTimeout(() => {
                    terminal.sendText('goose session');
                    setTimeout(() => {
                        terminal.sendText(`${contextInfo}`);
                    }, 2000);
                }, 1000);
            }, 8000);

        } catch (error) {
            console.error('Error executing Universal Development Assistant:', error);
            vscode.window.showErrorMessage(`Failed to execute Universal Development Assistant: ${error}`);
        }
    }

    /**
     * Create a signal file that Goose Desktop app can watch for stress events
     */
    static async createStressSignalFile(activeEditor: vscode.TextEditor | undefined, workspacePath: string): Promise<void> {
        try {
            const fs = require('fs').promises;
            const path = require('path');
            
            const signalData = {
                event: 'stress_detected',
                timestamp: new Date().toISOString(),
                trigger: 'vscode_extension',
                recipe: 'Universal Development Assistant',
                action: 'auto_debug_assist',
                debug_instruction: 'Analyze the problematic code, identify the issue, and make the necessary changes to fix it.',
                context: activeEditor ? {
                    filePath: activeEditor.document.fileName,
                    fileName: path.basename(activeEditor.document.fileName),
                    line: activeEditor.selection.active.line + 1,
                    column: activeEditor.selection.active.character + 1,
                    currentLine: activeEditor.document.lineAt(activeEditor.selection.active.line).text.trim(),
                    selectedText: activeEditor.document.getText(activeEditor.selection),
                    language: activeEditor.document.languageId,
                    isDirty: activeEditor.document.isDirty,
                    // Add surrounding code context
                    surroundingCode: this.getSurroundingCode(activeEditor)
                } : null
            };

            // Create signal file in workspace root
            const signalFilePath = path.join(workspacePath, '.goose-stress-signal.json');
            await fs.writeFile(signalFilePath, JSON.stringify(signalData, null, 2));
            
            console.log(`Stress signal file created: ${signalFilePath}`);
            vscode.window.showInformationMessage('📡 Stress signal sent to Goose Desktop');
            
            // Auto-cleanup after 60 seconds
            setTimeout(async () => {
                try {
                    await fs.unlink(signalFilePath);
                    console.log('Stress signal file cleaned up');
                } catch (error) {
                    // File might already be processed
                }
            }, 60000);
            
        } catch (error) {
            console.error('Error creating stress signal file:', error);
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
     * Get surrounding code context for better debugging
     */
    static getSurroundingCode(activeEditor: vscode.TextEditor): string {
        const document = activeEditor.document;
        const currentLine = activeEditor.selection.active.line;
        
        // Get 5 lines before and after current line
        const startLine = Math.max(0, currentLine - 5);
        const endLine = Math.min(document.lineCount - 1, currentLine + 5);
        
        let surroundingCode = '';
        for (let i = startLine; i <= endLine; i++) {
            const lineText = document.lineAt(i).text;
            const marker = i === currentLine ? ' <-- PROBLEM LINE' : '';
            surroundingCode += `${i + 1}: ${lineText}${marker}\n`;
        }
        
        return surroundingCode;
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
