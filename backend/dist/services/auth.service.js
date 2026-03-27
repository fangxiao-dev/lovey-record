"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findOrCreateUser = findOrCreateUser;
const prisma_1 = __importDefault(require("../db/prisma"));
async function findOrCreateUser(openid) {
    const user = await prisma_1.default.user.findUnique({
        where: { openid },
    });
    if (user) {
        return user;
    }
    return prisma_1.default.user.create({
        data: { openid },
    });
}
//# sourceMappingURL=auth.service.js.map