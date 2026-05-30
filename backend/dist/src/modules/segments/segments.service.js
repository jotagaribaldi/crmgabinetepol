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
exports.SegmentsService = exports.DEFAULT_SEGMENTS = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const client_1 = require("@prisma/client");
exports.DEFAULT_SEGMENTS = [
    'Juventude', 'Evangélicos', 'Universitários', 'Agricultores',
    'Pescadores', 'Comerciantes', 'Empresários', 'Servidores Públicos',
    'Mulheres', 'Idosos',
];
let SegmentsService = class SegmentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async seedDefaultSegments(tenantId, actorUserId) {
        const data = exports.DEFAULT_SEGMENTS.map((name) => ({ tenantId, name }));
        await this.prisma.segment.createMany({ data, skipDuplicates: true });
        await this.auditLog(actorUserId, tenantId, client_1.AuditAction.CREATE, 'Segment', tenantId, null, { seeded: exports.DEFAULT_SEGMENTS });
    }
    async create(dto, actor) {
        const tenantId = actor.tenantId;
        if (!tenantId)
            throw new common_1.ForbiddenException('ROOT não pode criar segmentos sem tenant');
        const existing = await this.prisma.segment.findFirst({
            where: { tenantId, name: { equals: dto.name, mode: 'insensitive' } },
        });
        if (existing)
            throw new common_1.ConflictException(`Segmento '${dto.name}' já existe neste tenant`);
        const segment = await this.prisma.segment.create({
            data: { tenantId, name: dto.name },
        });
        await this.auditLog(actor.id, tenantId, client_1.AuditAction.CREATE, 'Segment', segment.id, null, segment);
        return segment;
    }
    async findAll(query, actor) {
        const { search, isActive, page = 1, limit = 50 } = query;
        const skip = (page - 1) * limit;
        const tenantId = actor.tenantId ?? undefined;
        const where = {
            ...(tenantId !== undefined ? { tenantId } : {}),
            ...(search && { name: { contains: search, mode: 'insensitive' } }),
            ...(isActive !== undefined && { isActive }),
        };
        const [items, total] = await Promise.all([
            this.prisma.segment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
                include: { _count: { select: { voters: true } } },
            }),
            this.prisma.segment.count({ where }),
        ]);
        return {
            items,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async findOne(id, actor) {
        const segment = await this.prisma.segment.findUnique({
            where: { id },
            include: { _count: { select: { voters: true } } },
        });
        if (!segment)
            throw new common_1.NotFoundException('Segmento não encontrado');
        if (actor.role !== client_1.Role.ROOT && segment.tenantId !== actor.tenantId) {
            throw new common_1.ForbiddenException('Acesso negado');
        }
        return segment;
    }
    async update(id, dto, actor) {
        const existing = await this.findOne(id, actor);
        if (dto.name && dto.name !== existing.name) {
            const conflict = await this.prisma.segment.findFirst({
                where: {
                    tenantId: existing.tenantId,
                    name: { equals: dto.name, mode: 'insensitive' },
                    id: { not: id },
                },
            });
            if (conflict)
                throw new common_1.ConflictException(`Segmento '${dto.name}' já existe neste tenant`);
        }
        const updated = await this.prisma.segment.update({ where: { id }, data: dto });
        await this.auditLog(actor.id, actor.tenantId, client_1.AuditAction.UPDATE, 'Segment', id, existing, updated);
        return updated;
    }
    async remove(id, actor) {
        const segment = await this.findOne(id, actor);
        const votersCount = await this.prisma.voter.count({ where: { segmentId: id } });
        if (votersCount > 0) {
            throw new common_1.ForbiddenException(`Não é possível excluir: segmento possui ${votersCount} eleitores. Desative o segmento.`);
        }
        await this.prisma.segment.delete({ where: { id } });
        await this.auditLog(actor.id, actor.tenantId, client_1.AuditAction.DELETE, 'Segment', id, segment, null);
        return { message: 'Segmento excluído com sucesso' };
    }
    async auditLog(userId, tenantId, action, entity, entityId, oldValue, newValue) {
        await this.prisma.auditLog.create({ data: { userId, tenantId, action, entity, entityId, oldValue, newValue } });
    }
};
exports.SegmentsService = SegmentsService;
exports.SegmentsService = SegmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SegmentsService);
//# sourceMappingURL=segments.service.js.map