"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const auth_service_1 = require("../services/auth.service");
async function authMiddleware(req, res, next) {
    try {
        const openid = req.headers['x-wx-openid'];
        if (!openid || !openid.trim()) {
            return res.status(401).json({
                ok: false,
                data: null,
                error: { code: 'MISSING_OPENID', message: 'x-wx-openid header is required' },
            });
        }
        const user = await (0, auth_service_1.findOrCreateUser)(openid);
        req.user = user;
        next();
    }
    catch (error) {
        res.status(500).json({
            ok: false,
            data: null,
            error: {
                code: 'AUTH_ERROR',
                message: error instanceof Error ? error.message : 'Authentication failed',
            },
        });
    }
}
//# sourceMappingURL=auth.js.map