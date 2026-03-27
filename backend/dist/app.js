"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("./middleware/auth");
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Health check (public, no auth required)
app.get('/health', (_req, res) => {
    res.json({ ok: true, status: 'healthy' });
});
// Auth middleware — attach user from x-wx-openid header for all routes below
app.use(auth_1.authMiddleware);
// Routes will be mounted here in later phases
// Error handler — must be last middleware
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map