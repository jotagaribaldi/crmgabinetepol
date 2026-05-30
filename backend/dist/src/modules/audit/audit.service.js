"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const client_1 = require("@prisma/client");
let AuditService = class AuditService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query, actor) {
        const { action, entity, entityId, userId, dateFrom, dateTo, page = 1, limit = 30 } = query;
        const skip = (page - 1) * limit;
        const tenantId = actor.role === client_1.Role.ROOT
            ? query.tenantId ?? undefined
            : actor.tenantId ?? undefined;
        const where = {
            ...(tenantId !== undefined ? { tenantId } : {}),
            ...(action && { action }),
            ...(entity && { entity }),
            ...(entityId && { entityId }),
            ...(userId && { userId }),
            ...(dateFrom || dateTo
                ? {
                    createdAt: {
                        ...(dateFrom && { gte: new Date(dateFrom) }),
                        ...(dateTo && { lte: new Date(dateTo + 'T23:59:59.999Z') }),
                    },
                }
                : {}),
        };
        const [items, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, name: true, email: true, role: true } },
                    tenant: { select: { id: true, name: true, slug: true } },
                },
            }),
            this.prisma.auditLog.count({ where }),
        ]);
        return {
            items,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async findOne(id, actor) {
        const log = await this.prisma.auditLog.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, email: true, role: true } },
                tenant: { select: { id: true, name: true } },
            },
        });
        if (!log)
            throw new common_1.NotFoundException('Log de auditoria não encontrado');
        if (actor.role !== client_1.Role.ROOT && log.tenantId !== actor.tenantId) {
            throw new common_1.ForbiddenException('Acesso negado');
        }
        return log;
    }
    async getSummary(actor) {
        const tenantId = actor.role === client_1.Role.ROOT ? undefined : (actor.tenantId ?? undefined);
        const where = tenantId !== undefined ? { tenantId } : {};
        const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const [byAction, byEntity, recentActivity, topUsers] = await Promise.all([
            this.prisma.auditLog.groupBy({
                by: ['action'],
                where,
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
            }),
            this.prisma.auditLog.groupBy({
                by: ['entity'],
                where,
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 10,
            }),
            this.prisma.auditLog.count({
                where: { ...where, createdAt: { gte: last30Days } },
            }),
            this.prisma.auditLog.groupBy({
                by: ['userId'],
                where: { ...where, userId: { not: null } },
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 10,
            }),
        ]);
        const userIds = topUsers.map((u) => u.userId).filter(Boolean);
        const users = await this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, role: true },
        });
        const userMap = new Map(users.map((u) => [u.id, u]));
        return {
            recentActivity,
            byAction: byAction.map((a) => ({ action: a.action, count: a._count.id })),
            byEntity: byEntity.map((e) => ({ entity: e.entity, count: e._count.id })),
            topUsers: topUsers.map((u) => ({
                userId: u.userId,
                user: userMap.get(u.userId),
                actionsCount: u._count.id,
            })),
        };
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
//# sourceMappingURL=audit.service.js.map