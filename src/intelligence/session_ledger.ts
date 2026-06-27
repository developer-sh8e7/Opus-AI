import fs from 'node:fs';
import path from 'node:path';

export interface LedgerEntry {
  id: string;
  name: string;
  type: 'channel' | 'category' | 'role' | 'member_state';
  action: 'created' | 'deleted' | 'modified' | 'moved';
  timestamp: Date;
  parentId?: string;
  aliases?: string[];
  details?: Record<string, unknown>;
}

export interface SessionLedger {
  guildId: string;
  sessionStart: Date;
  lastUpdated: Date;
  entries: LedgerEntry[];
  summary: string;
}

const SESSION_INACTIVITY_MS = 4 * 60 * 60 * 1000; // 4 hours
const SUMMARY_INTERVAL = 6; // every 6 entries regenerate summary

export class SessionLedgerManager {
  private ledgers = new Map<string, SessionLedger>();
  private turnCounters = new Map<string, number>();
  private dataDir: string;

  constructor(dataDir = 'data') {
    this.dataDir = dataDir;
    fs.mkdirSync(dataDir, { recursive: true });
  }

  private filePath(guildId: string): string {
    return path.join(this.dataDir, `ledger_${guildId}.json`);
  }

  private getOrCreate(guildId: string): SessionLedger {
    let ledger = this.ledgers.get(guildId);
    if (!ledger) {
      // Try loading from disk
      const fp = this.filePath(guildId);
      if (fs.existsSync(fp)) {
        try {
          const raw = fs.readFileSync(fp, 'utf8');
          ledger = JSON.parse(raw) as SessionLedger;
          ledger.sessionStart = new Date(ledger.sessionStart);
          ledger.lastUpdated = new Date(ledger.lastUpdated);
          ledger.entries.forEach(e => { e.timestamp = new Date(e.timestamp); });
        } catch { /* corrupt file, start fresh */ }
      }
      if (!ledger) {
        ledger = {
          guildId,
          sessionStart: new Date(),
          lastUpdated: new Date(),
          entries: [],
          summary: '',
        };
      }
      this.ledgers.set(guildId, ledger);
      this.turnCounters.set(guildId, 0);
    }
    ledger.lastUpdated = new Date();
    return ledger;
  }

  private persist(guildId: string): void {
    const ledger = this.ledgers.get(guildId);
    if (!ledger) return;
    try {
      fs.writeFileSync(this.filePath(guildId), JSON.stringify(ledger, null, 2), 'utf8');
    } catch (err) {
      console.error(`[SessionLedger] Failed to persist ledger for ${guildId}:`, err);
    }
  }

  recordEntry(guildId: string, entry: Omit<LedgerEntry, 'timestamp'>): void {
    const ledger = this.getOrCreate(guildId);
    const fullEntry: LedgerEntry = { ...entry, timestamp: new Date() };
    ledger.entries.push(fullEntry);
    ledger.lastUpdated = new Date();

    // Rolling summary every SUMMARY_INTERVAL entries
    const counter = (this.turnCounters.get(guildId) ?? 0) + 1;
    this.turnCounters.set(guildId, counter);
    if (counter % SUMMARY_INTERVAL === 0) {
      ledger.summary = this.generateSummary(guildId);
    }

    this.persist(guildId);
  }

  resolve(guildId: string, name: string): { entries: LedgerEntry[]; deleted: boolean } {
    const ledger = this.ledgers.get(guildId) ?? this.getOrCreate(guildId);
    const normalized = name.normalize('NFKC').toLowerCase().trim();
    
    const matches = ledger.entries.filter(e => {
      const entryName = e.name.normalize('NFKC').toLowerCase().trim();
      const aliasMatch = e.aliases?.some(a => a.normalize('NFKC').toLowerCase().trim() === normalized);
      return entryName === normalized || entryName.includes(normalized) || normalized.includes(entryName) || aliasMatch;
    });

    const deleted = matches.some(e => e.action === 'deleted');
    return { entries: matches.filter(e => e.action !== 'deleted'), deleted };
  }

  isDeletedThisSession(guildId: string, name: string): boolean {
    const ledger = this.ledgers.get(guildId) ?? this.getOrCreate(guildId);
    const normalized = name.normalize('NFKC').toLowerCase().trim();
    return ledger.entries.some(e => {
      const entryName = e.name.normalize('NFKC').toLowerCase().trim();
      return entryName === normalized && e.action === 'deleted';
    });
  }

  generateSummary(guildId: string): string {
    const ledger = this.ledgers.get(guildId);
    if (!ledger || ledger.entries.length === 0) return '';

    const created = ledger.entries.filter(e => e.action === 'created').map(e => e.name);
    const deleted = ledger.entries.filter(e => e.action === 'deleted').map(e => e.name);
    const modified = ledger.entries.filter(e => e.action === 'modified').map(e => e.name);
    const moved = ledger.entries.filter(e => e.action === 'moved').map(e => e.name);
    const lastAction = ledger.entries[ledger.entries.length - 1];

    const parts = ['[ملخص الجلسة]'];
    if (created.length > 0) parts.push(`أنشأنا: ${created.join(', ')}`);
    if (deleted.length > 0) parts.push(`حذفنا: ${deleted.join(', ')}`);
    if (modified.length > 0) parts.push(`عدّلنا: ${modified.join(', ')}`);
    if (moved.length > 0) parts.push(`نقلنا: ${moved.join(', ')}`);
    if (lastAction) parts.push(`آخر إجراء: ${lastAction.name} (${lastAction.action})`);

    return parts.join(' | ');
  }

  getRecentEntries(guildId: string, limit = 10): LedgerEntry[] {
    const ledger = this.ledgers.get(guildId);
    if (!ledger) return [];
    return ledger.entries.slice(-limit);
  }

  getEntryCount(guildId: string): number {
    const ledger = this.ledgers.get(guildId);
    return ledger?.entries.length ?? 0;
  }

  getSummary(guildId: string): string {
    const ledger = this.ledgers.get(guildId);
    return ledger?.summary ?? '';
  }

  clear(guildId: string): void {
    this.ledgers.delete(guildId);
    this.turnCounters.delete(guildId);
    const fp = this.filePath(guildId);
    if (fs.existsSync(fp)) {
      try { fs.unlinkSync(fp); } catch { /* ignore */ }
    }
  }

  cleanup(): void {
    const now = Date.now();
    for (const [guildId, ledger] of this.ledgers) {
      const elapsed = now - ledger.lastUpdated.getTime();
      if (elapsed > SESSION_INACTIVITY_MS) {
        this.persist(guildId); // save before removing from memory
        this.ledgers.delete(guildId);
        this.turnCounters.delete(guildId);
      }
    }
  }
}

export const sessionLedgerManager = new SessionLedgerManager();
