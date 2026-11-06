/**
 * Local Web Database Adapter — used for Web offline outbox + cache.
 * Avoids importing expo-sqlite wasm worker which causes "Worker chunk not found"
 * in Metro web dev server.
 */

interface WebDbRecord {
  [key: string]: any;
}

class WebDatabase {
  private getStorage(table: string): WebDbRecord[] {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return [];
      const data = window.localStorage.getItem(`logbook_${table}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private setStorage(table: string, records: WebDbRecord[]) {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      window.localStorage.setItem(`logbook_${table}`, JSON.stringify(records));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  async execAsync(_sql: string): Promise<void> {
    return Promise.resolve();
  }

  async runAsync(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertRowId: number }> {
    const trimmed = sql.trim();
    if (trimmed.toUpperCase().startsWith('INSERT INTO OUTBOX')) {
      const records = this.getStorage('outbox');
      const row: WebDbRecord = {
        id: params[0],
        endpoint: params[1],
        method: params[2],
        payload: params[3],
        entityType: params[4],
        entityId: params[5],
        localState: params[6],
        status: params[7],
        attempts: params[8],
        createdAt: params[9],
        updatedAt: params[10],
      };
      records.push(row);
      this.setStorage('outbox', records);
      return { changes: 1, lastInsertRowId: 1 };
    }

    if (trimmed.toUpperCase().startsWith('UPDATE OUTBOX')) {
      const records = this.getStorage('outbox');
      let changes = 0;
      if (trimmed.includes("status='SYNCED'")) {
        const id = params[2];
        const item = records.find((r) => r.id === id);
        if (item) {
          item.status = 'SYNCED';
          item.syncedAt = params[0];
          item.updatedAt = params[1];
          changes++;
        }
      } else if (trimmed.includes("status='IN_FLIGHT'")) {
        const id = params[2];
        const item = records.find((r) => r.id === id);
        if (item) {
          item.status = 'IN_FLIGHT';
          item.lastAttemptAt = params[0];
          item.updatedAt = params[1];
          changes++;
        }
      } else if (trimmed.includes('attempts=attempts+1')) {
        const id = params[params.length - 1];
        const item = records.find((r) => r.id === id);
        if (item) {
          item.attempts = (item.attempts || 0) + 1;
          if (trimmed.includes('status=?')) {
            item.status = params[0];
            item.errorCode = params[1];
            item.errorMessage = params[2];
            item.lastAttemptAt = params[3];
            item.updatedAt = params[4];
          } else {
            item.lastAttemptAt = params[0];
            item.updatedAt = params[1];
          }
          changes++;
        }
      } else if (trimmed.includes("status='PENDING'")) {
        const id = params[1];
        const item = records.find((r) => r.id === id);
        if (item) {
          item.status = 'PENDING';
          item.errorCode = null;
          item.errorMessage = null;
          item.updatedAt = params[0];
          changes++;
        }
      }
      this.setStorage('outbox', records);
      return { changes, lastInsertRowId: 0 };
    }

    if (trimmed.toUpperCase().startsWith('DELETE FROM OUTBOX')) {
      let records = this.getStorage('outbox');
      const initial = records.length;
      if (trimmed.includes("status = 'SYNCED'")) {
        records = records.filter((r) => r.status !== 'SYNCED');
      }
      this.setStorage('outbox', records);
      return { changes: initial - records.length, lastInsertRowId: 0 };
    }

    return { changes: 0, lastInsertRowId: 0 };
  }

  async getAllAsync<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const trimmed = sql.trim().toUpperCase();
    if (trimmed.includes('FROM OUTBOX')) {
      let records = this.getStorage('outbox');
      if (params.length > 0 && trimmed.includes('WHERE STATUS = ?')) {
        records = records.filter((r) => r.status === params[0]);
      }
      return records as T[];
    }
    return [];
  }

  async getFirstAsync<T = any>(sql: string, _params: any[] = []): Promise<T | null> {
    const trimmed = sql.trim().toUpperCase();
    if (trimmed.includes('COUNT(*)') && trimmed.includes('FROM OUTBOX')) {
      const records = this.getStorage('outbox');
      const pending = records.filter((r) => ['PENDING', 'IN_FLIGHT', 'CONFLICT', 'ERROR'].includes(r.status));
      return { c: pending.length } as unknown as T;
    }
    return null;
  }
}

const _webDb = new WebDatabase();

export const db = (): any => _webDb;

export async function ensureSchema(): Promise<void> {
  return Promise.resolve();
}

