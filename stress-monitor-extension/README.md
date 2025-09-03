# Stress Monitor VS Code Extension

A VS Code extension that monitors coding stress levels using galvanic skin response (GSR) sensors.

## Features

- **Explorer Panel Integration**: Monitor stress levels directly in the VS Code Explorer
- **Manual Stress Reporting**: Buttons to manually report stress and calm states
- **Session Tracking**: View today's stress entries with timestamps
- **Real-time Updates**: Live stress level display
- **Future Hardware Integration**: Ready for GSR sensor integration

## Current Features (Manual Mode)

### Stress Monitoring
- 😰 **Report Stress** button - Log when you're feeling stressed
- 😌 **Report Calm** button - Log when you're feeling calm
- 📊 **Current Status** - Shows your current stress level with emoji indicator

### Session Tracking
- ⏱️ **Current Session** - Shows active coding session duration
- ▶️ **Start Session** button - Begin a new coding session
- ⏹️ **End Session** button - End the current coding session
- 📈 **Today's Summary** - Statistics about coding time and sessions
- 🔍 **Coding Sessions** - Detailed view of all sessions with stress events

### Data Insights
- **Total Time Today** - Sum of all coding session durations
- **Sessions Today** - Count of completed and active sessions
- **Average Session Length** - Mean duration across all sessions
- **Longest Session** - Your record coding session length
- **Session Details** - Expandable view showing stress events per session

### Additional Features
- 📊 **Stress Events** - Timeline of all stress/calm reports
- 🗑️ **Clear History** - Reset all logged data and sessions
- 🔄 **Auto-refresh** - UI updates every minute to show current session time

## How to Use

### 🖱️ Mouse Interface
1. Install the extension
2. Look for "Stress Monitor" in the Explorer panel
3. Use the quick action buttons to log your stress levels
4. Monitor your patterns throughout the day

### ⌨️ Keyboard Shortcuts
| Action | Windows/Linux | macOS | Description |
|--------|---------------|-------|-------------|
| **Start Session** | `Ctrl+Shift+Alt+S` | `Cmd+Shift+Alt+S` | 🚀 Begin coding session |
| **End Session** | `Ctrl+Shift+Alt+E` | `Cmd+Shift+Alt+E` | ⏹️ End current session |
| **Report Stress** | `Ctrl+Shift+Alt+X` | `Cmd+Shift+Alt+X` | 😰 Emergency stress button |
| **Report Calm** | `Ctrl+Shift+Alt+C` | `Cmd+Shift+Alt+C` | 😌 Log calm state |
| **Debug Help** | `Ctrl+Shift+Alt+D` | `Cmd+Shift+Alt+D` | 🐛 Get Goose debugging assistance |

> 💡 **Quick Tip**: `Ctrl+Shift+Alt+X` is your emergency stress shortcut - "X marks the stress!"

## Development

This extension is built with TypeScript and uses the VS Code Extension API.

### Project Structure
```
src/
├── extension.ts          # Main extension entry point
├── stressMonitor.ts      # Core stress monitoring logic
└── stressTreeProvider.ts # Explorer panel tree view
```

### Future Enhancements
- Hardware GSR sensor integration
- Stress pattern analysis
- Break recommendations
- Team stress dashboards
- Calendar integration

## Installation for Development

1. Clone this repository
2. Run `npm install`
3. Run `npm run compile`
4. Press F5 to open Extension Development Host
5. Look for "Stress Monitor" in the Explorer panel

## Contributing

This project is in active development. Contributions welcome!
