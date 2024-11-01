import { promises as fs } from 'fs';
import path from 'path';
import { BackupStrategy, NetworkBackupConfig, LocalBackupConfig } from '../types/types';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const useLocalBackup = (config: LocalBackupConfig): BackupStrategy => {
  const maxBackups = config.maxBackups || 5;
  const backupIntervalDays = config.backupIntervalDays || 5;
  const lastBackupFile = path.join(config.backupPath, 'lastBackupTime.txt');

  const cleanupOldBackups = async (backupPath: string): Promise<void> => {
    const files = await fs.readdir(backupPath);
    if (files.length > maxBackups) {
      const backupFiles = await Promise.all(
        files.map(async (f) => ({
          name: f,
          time: (await fs.stat(path.join(backupPath, f))).mtime,
        }))
      );

      const sortedFiles = backupFiles.sort((a, b) => b.time.getTime() - a.time.getTime());
      
      for (let i = maxBackups; i < sortedFiles.length; i++) {
        await fs.unlink(path.join(backupPath, sortedFiles[i].name));
      }
    }
  };

  const shouldBackup = async (): Promise<boolean> => {
    try {
      const lastBackup = await fs.readFile(lastBackupFile, 'utf8');
      const lastBackupTime = new Date(lastBackup);
      const now = new Date();
      return (now.getTime() - lastBackupTime.getTime()) >= backupIntervalDays * DAY_IN_MS;
    } catch {
      return true;
    }
  };

  const updateLastBackupTime = async (): Promise<void> => {
    await fs.writeFile(lastBackupFile, new Date().toISOString());
  };

  return {
    save: async (data: any): Promise<void> => {
      if (await shouldBackup()) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(config.backupPath, `backup-${timestamp}.json`);

        await fs.mkdir(config.backupPath, { recursive: true });
        await fs.writeFile(backupFile, JSON.stringify(data, null, 2));
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