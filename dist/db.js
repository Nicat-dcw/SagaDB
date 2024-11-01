"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SagaDB = void 0;
const node_cache_1 = __importDefault(require("node-cache"));
const json_1 = require("./json");
class SagaDB {
    constructor(options = {}) {
        this.dbPath = options.dbPath || 'db.json';
        this.backup = options.backup;
        this.cache = new node_cache_1.default({ stdTTL: 0 });
        this.data = {};
        this.initialized = false;
        this.jsonHandler = new json_1.JsonHandler();
        this.encryption = options.encryption;
    }
    async init() {
        try {
            let fileData = await this.jsonHandler.read(this.dbPath);
            if (this.encryption && Object.keys(fileData).length > 0) {
                fileData = await this.encryption.decrypt(fileData);
            }
            this.data = fileData;
            this.cache.mset(Object.entries(this.data).map(([k, v]) => ({ key: k, val: v })));
        }
        catch (err) {
            if (err.code === 'ENOENT') {
                await this.save();
            }
            else {
                throw err;
            }
        }
        this.initialized = true;
    }
    async get(key) {
        if (!this.initialized)
            await this.init();
        const cached = this.cache.get(key);
        if (cached !== undefined)
            return cached;
        return this.data[key];
    }
    async set(key, value) {
        if (!this.initialized)
            await this.init();
        this.data[key] = value;
        this.cache.set(key, value);
        await this.save();
        return value;
    }
    async delete(key) {
        if (!this.initialized)
            await this.init();
        delete this.data[key];
        this.cache.del(key);
        await this.save();
    }
    async save() {
        let dataToSave = this.data;
        if (this.encryption) {
            dataToSave = await this.encryption.encrypt(this.data);
        }
        await this.jsonHandler.write(this.dbPath, dataToSave);
        if (this.backup) {
            try {
                await this.backup.save(dataToSave);
            }
            catch (error) {
                console.error('Backup failed:', error.message);
            }
        }
    }
}
exports.SagaDB = SagaDB;
