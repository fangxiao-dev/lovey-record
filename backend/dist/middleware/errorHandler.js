"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, _req, res, _next) {
    const statusCode = err.statusCode || 500;
    const code = err.code || 'INTERNAL_ERROR';
    const message = err.message || 'Internal server error';
    res.status(statusCode).json({
        ok: false,
        data: null,
        error: { code, message },
    });
}
//# sourceMappingURL=errorHandler.js.map