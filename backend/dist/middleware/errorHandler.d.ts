import { Request, Response, NextFunction } from 'express';
interface CustomError extends Error {
    code?: string;
    statusCode?: number;
}
export declare function errorHandler(err: CustomError, _req: Request, res: Response, _next: NextFunction): void;
export {};
//# sourceMappingURL=errorHandler.d.ts.map