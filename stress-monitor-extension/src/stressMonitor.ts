export type StressLevel = 'low' | 'medium' | 'high';

export interface StressEntry {
    timestamp: Date;
    level: StressLevel;
    notes?: string;
}

export interface CodingSession {
    startTime: Date;
    endTime?: Date;
    duration?: number; // in minutes
    stressEvents: StressEntry[];
    isActive: boolean;
}

export class StressMonitor {
    private entries: StressEntry[] = [];
    private currentLevel: StressLevel = 'low';
    private currentSession: CodingSession | null = null;
    private sessions: CodingSession[] = [];
    private sessionTimeout: NodeJS.Timeout | null = null;
    private readonly SESSION_TIMEOUT_MINUTES = 30; // End session after 30 minutes of inactivity

    reportStress(): void {
        this.ensureSessionStarted();
        this.currentLevel = 'high';
        const entry = {
            timestamp: new Date(),
            level: 'high' as StressLevel,
            notes: 'Manual stress report'
        };
        this.entries.push(entry);
        this.addEntryToCurrentSession(entry);
        this.resetSessionTimeout();
    }

    reportCalm(): void {
        this.ensureSessionStarted();
        this.currentLevel = 'low';
        const entry = {
            timestamp: new Date(),
            level: 'low' as StressLevel,
            notes: 'Manual calm report'
        };
        this.entries.push(entry);
        this.addEntryToCurrentSession(entry);
        this.resetSessionTimeout();
    }

    getCurrentLevel(): StressLevel {
        return this.currentLevel;
    }

    getTodaysEntries(): StressEntry[] {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return this.entries.filter(entry => 
            entry.timestamp >= today
        );
    }

    clearHistory(): void {
        this.entries = [];
        this.currentLevel = 'low';
        this.endCurrentSession();
        this.sessions = [];
    }

    // Session Management Methods
    private ensureSessionStarted(): void {
        if (!this.currentSession || !this.currentSession.isActive) {
            this.startNewSession();
        }
    }

    private startNewSession(): void {
        // End previous session if it exists
        this.endCurrentSession();
        
        this.currentSession = {
            startTime: new Date(),
            stressEvents: [],
            isActive: true
        };
        this.sessions.push(this.currentSession);
    }

    private addEntryToCurrentSession(entry: StressEntry): void {
        if (this.currentSession && this.currentSession.isActive) {
            this.currentSession.stressEvents.push(entry);
        }
    }

    private resetSessionTimeout(): void {
        if (this.sessionTimeout) {
            clearTimeout(this.sessionTimeout);
        }
        
        this.sessionTimeout = setTimeout(() => {
            this.endCurrentSession();
        }, this.SESSION_TIMEOUT_MINUTES * 60 * 1000);
    }

    private endCurrentSession(): void {
        if (this.currentSession && this.currentSession.isActive) {
            this.currentSession.endTime = new Date();
            this.currentSession.duration = Math.round(
                (this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime()) / (1000 * 60)
            );
            this.currentSession.isActive = false;
        }
        
        if (this.sessionTimeout) {
            clearTimeout(this.sessionTimeout);
            this.sessionTimeout = null;
        }
    }

    // Public Session Methods
    getCurrentSession(): CodingSession | null {
        return this.currentSession;
    }

    getTodaysSessions(): CodingSession[] {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return this.sessions.filter(session => 
            session.startTime >= today
        );
    }

    getAllSessions(): CodingSession[] {
        return this.sessions;
    }

    getCurrentSessionDuration(): number {
        if (!this.currentSession || !this.currentSession.isActive) {
            return 0;
        }
        
        return Math.round(
            (new Date().getTime() - this.currentSession.startTime.getTime()) / (1000 * 60)
        );
    }

    getTotalCodingTimeToday(): number {
        const todaysSessions = this.getTodaysSessions();
        let total = 0;
        
        for (const session of todaysSessions) {
            if (session.duration) {
                total += session.duration;
            } else if (session.isActive) {
                // Add current session time
                total += this.getCurrentSessionDuration();
            }
        }
        
        return total;
    }

    getSessionStats(): { averageSessionLength: number; totalSessions: number; longestSession: number } {
        const completedSessions = this.sessions.filter(s => s.duration && s.duration > 0);
        
        if (completedSessions.length === 0) {
            return { averageSessionLength: 0, totalSessions: 0, longestSession: 0 };
        }
        
        const totalTime = completedSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
        const longestSession = Math.max(...completedSessions.map(s => s.duration || 0));
        
        return {
            averageSessionLength: Math.round(totalTime / completedSessions.length),
            totalSessions: completedSessions.length,
            longestSession
        };
    }

    // Future: This is where you'll integrate hardware data
    updateFromHardware(gsrValue: number): void {
        this.ensureSessionStarted();
        
        // Convert GSR value to stress level
        let level: StressLevel;
        if (gsrValue > 80) {
            level = 'high';
        } else if (gsrValue > 40) {
            level = 'medium';
        } else {
            level = 'low';
        }

        this.currentLevel = level;
        const entry = {
            timestamp: new Date(),
            level: level,
            notes: `GSR: ${gsrValue}`
        };
        
        this.entries.push(entry);
        this.addEntryToCurrentSession(entry);
        this.resetSessionTimeout();
    }

    getAllEntries(): StressEntry[] {
        return this.entries;
    }

    // Manual session control
    startCodingSession(): void {
        this.startNewSession();
        this.resetSessionTimeout();
    }

    endCodingSession(): void {
        this.endCurrentSession();
    }

    // Stress level change detection
    private onStressLevelChanged?: (level: StressLevel, previousLevel: StressLevel) => void;

    setStressLevelChangeCallback(callback: (level: StressLevel, previousLevel: StressLevel) => void): void {
        this.onStressLevelChanged = callback;
    }

    private notifyStressLevelChange(newLevel: StressLevel): void {
        const previousLevel = this.currentLevel;
        if (this.onStressLevelChanged && newLevel !== previousLevel) {
            this.onStressLevelChanged(newLevel, previousLevel);
        }
        this.currentLevel = newLevel;
    }

    // Recipe integration methods
    async triggerStressRecipe(): Promise<void> {
        // This will be called when high stress is detected
        // Extension will handle the actual recipe execution
        console.log('High stress detected - stress recipe should be triggered');
    }

    // Enhanced stress reporting with level change detection
    reportStressWithCallback(): void {
        this.ensureSessionStarted();
        const previousLevel = this.currentLevel;
        const entry = {
            timestamp: new Date(),
            level: 'high' as StressLevel,
            notes: 'Manual stress report'
        };
        this.entries.push(entry);
        this.addEntryToCurrentSession(entry);
        this.resetSessionTimeout();
        
        // Notify about stress level change
        this.notifyStressLevelChange('high');
        
        // Trigger stress recipe if moving to high stress
        if (previousLevel !== 'high') {
            this.triggerStressRecipe();
        }
    }

    reportCalmWithCallback(): void {
        this.ensureSessionStarted();
        const previousLevel = this.currentLevel;
        const entry = {
            timestamp: new Date(),
            level: 'low' as StressLevel,
            notes: 'Manual calm report'
        };
        this.entries.push(entry);
        this.addEntryToCurrentSession(entry);
        this.resetSessionTimeout();
        
        // Notify about stress level change
        this.notifyStressLevelChange('low');
    }
}
