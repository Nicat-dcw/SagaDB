import { mkdir, readdir, unlink } from "node:fs/promises";
import { join } from 'path';
import { BackupStrategy, NetworkBackupConfig, LocalBackupConfig } from '../types/types';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const exists = async (path: string): Promise<boolean> => {
  return await Bun.file(path).exists();
};

const readFile = async (path: string, encoding: string): Promise<string> => {
  return await Bun.file(path).text();
};

const write = async (path: string, data: string): Promise<void> => {
  await Bun.write(path, data);
};

export const useLocalBackup = (config: LocalBackupConfig): BackupStrategy => {
  const maxBackups = config.maxBackups || 5;
  const backupIntervalDays = config.backupIntervalDays || 5;
  const lastBackupFile = join(config.backupPath, 'lastBackupTime.txt');

  const cleanupOldBackups = async (backupPath: string): Promise<void> => {
    const dir = await readdir(backupPath);
    if (dir.length > maxBackups) {
      const backupFiles = await Promise.all(
        dir.map(async (f: string) => ({
          name: f,
          time: Bun.file(join(backupPath, f)).lastModified
        }))
      );
      const sortedFiles = backupFiles.sort((a, b) => Number(b.time) - Number(a.time));
      
      for (let i = maxBackups; i < sortedFiles.length; i++) {
        await unlink(join(backupPath, sortedFiles[i].name));
      }
    }
  };

  const shouldBackup = async (): Promise<boolean> => {
    try {
      const fileExists = await exists(lastBackupFile);
      if (!fileExists) return true;
      
      const lastBackup = await readFile(lastBackupFile, 'utf8');
      const lastBackupTime = new Date(lastBackup);
      const now = new Date();
      return (now.getTime() - lastBackupTime.getTime()) >= backupIntervalDays * DAY_IN_MS;
    } catch {
      return true;
    }
  };

  const updateLastBackupTime = async (): Promise<void> => {
    await write(lastBackupFile, new Date().toISOString());
  };

  return {
    save: async (data: any): Promise<void> => {
      if (await shouldBackup()) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = join(config.backupPath, `backup-${timestamp}.json`);

        await mkdir(config.backupPath, { recursive: true });
        await write(backupFile, JSON.stringify(data, null, 2));
        await cleanupOldBackups(config.backupPath);
        await updateLastBackupTime();
      }
    },
  };
};

export const useNetworkBackup = (config: NetworkBackupConfig): BackupStrategy => {
  const maxRetries = config.retries || 3;
  const localBackup = config.backupPath ? useLocalBackup({ backupPath: config.backupPath, backupIntervalDays: 5 }) : null;

  return {
    save: async (data: any): Promise<void> => {
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response = await fetch(config.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              timestamp: new Date().toISOString(),
              data: data,
            }),
          });

          if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
          }

          return;
        } catch (error) {
          lastError = error as Error;
          if (attempt === maxRetries) {
            console.error(`Network backup failed after ${maxRetries} attempts`);
            break;
          }
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        }
      }

      if (localBackup) {
        await localBackup.save(data);
      } else if (lastError) {
        throw lastError;
      }
    },
  };
};