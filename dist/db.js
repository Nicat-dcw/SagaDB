"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FastJsonDB = void 0;
const node_cache_1 = __importDefault(require("node-cache"));
const json_1 = require("./json");
class FastJsonDB {
    constructor(options = {}) {
        this.dbPath = options.dbPath || 'db.json';
        this.backup = options.backup;
        this.cache = new node_cache_1.default({ stdTTL: 0 });
        this.data = {};
        this.initialized = false;
        this.jsonHandler = new json_1.JsonHandler();
    }
    async init() {
        try {
            this.data = await this.jsonHandler.read(this.dbPath);
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
        await this.jsonHandler.write(this.dbPath, this.data);
        if (this.backup) {
            try {
                await this.backup.save(this.data);
            }
            catch (error) {
                console.error('Backup failed:', error instanceof Error ? error.message : error);
            }
        }
    }
}
exports.FastJsonDB = FastJsonDB;
