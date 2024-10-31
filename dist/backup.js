"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNetworkBackup = exports.useLocalBackup = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const useLocalBackup = (config) => {
    const maxBackups = config.maxBackups || 5;
    const backupIntervalDays = config.backupIntervalDays || 5;
    const lastBackupFile = path_1.default.join(config.backupPath, 'lastBackupTime.txt');
    const cleanupOldBackups = async (backupPath) => {
        const files = await fs_1.promises.readdir(backupPath);
        if (files.length > maxBackups) {
            const backupFiles = await Promise.all(files.map(async (f) => ({
                name: f,
                time: (await fs_1.promises.stat(path_1.default.join(backupPath, f))).mtime,
            })));
            const sortedFiles = backupFiles.sort((a, b) => b.time.getTime() - a.time.getTime());
            for (let i = maxBackups; i < sortedFiles.length; i++) {
                await fs_1.promises.unlink(path_1.default.join(backupPath, sortedFiles[i].name));
            }
        }
    };
    const shouldBackup = async () => {
        try {
            const lastBackup = await fs_1.promises.readFile(lastBackupFile, 'utf8');
            const lastBackupTime = new Date(lastBackup);
            const now = new Date();
            return (now.getTime() - lastBackupTime.getTime()) >= backupIntervalDays * DAY_IN_MS;
        }
        catch {
            return true;
        }
    };
    const updateLastBackupTime = async () => {
        await fs_1.promises.writeFile(lastBackupFile, new Date().toISOString());
    };
    return {
        save: async (data) => {
            if (await shouldBackup()) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const backupFile = path_1.default.join(config.backupPath, `backup-${timestamp}.json`);
                await fs_1.promises.mkdir(config.backupPath, { recursive: true });
                await fs_1.promises.writeFile(backupFile, JSON.stringify(data, null, 2));
                await cleanupOldBackups(config.backupPath);
                await updateLastBackupTime();
            }
        },
    };
};
exports.useLocalBackup = useLocalBackup;
const useNetworkBackup = (config) => {
    const maxRetries = config.retries || 3;
    const localBackup = config.backupPath ? (0, exports.useLocalBackup)({ backupPath: config.backupPath, backupIntervalDays: 5 }) : null;
    return {
        save: async (data) => {
            let lastError = null;
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
                }
                catch (error) {
                    lastError = error;
                    if (attempt === maxRetries) {
                        console.error(`Network backup failed after ${maxRetries} attempts`);
                        break;
                    }
                    await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                }
            }
            if (localBackup) {
                await localBackup.save(data);
            }
            else if (lastError) {
                throw lastError;
            }
        },
    };
};
exports.useNetworkBackup = useNetworkBackup;
