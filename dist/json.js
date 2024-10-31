"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonHandler = void 0;
const fs_1 = __importDefault(require("fs"));
const ajv_1 = __importDefault(require("ajv"));
class JsonHandler {
    constructor() {
        this.ajv = new ajv_1.default();
    }
    async read(filePath) {
        try {
            const data = await fs_1.default.promises.readFile(filePath, 'utf8');
            return JSON.parse(data);
        }
        catch (err) {
            if (err.code === 'ENOENT') {
                return {};
            }
            throw err;
        }
    }
    async write(filePath, data) {
        const jsonString = JSON.stringify(data, null, 2);
        fs_1.default.writeFileSync(filePath, jsonString);
    }
    validate(data, schema) {
        if (!schema)
            return true;
        const validate = this.ajv.compile(schema);
        return validate(data);
    }
}
exports.JsonHandler = JsonHandler;
