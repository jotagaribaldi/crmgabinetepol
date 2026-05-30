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
exports.TenantsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const client_1 = require("@prisma/client");
let TenantsService = class TenantsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, actorUserId) {
        const existing = await this.prisma.tenant.findFirst({
            where: {
                OR: [
                    { slug: dto.slug },
                    ...(dto.document ? [{ document: dto.document }] : []),
                ],
            },
        });
        if (existing) {
            if (existing.slug === dto.slug) {
                throw new common_1.ConflictException(`Slug '${dto.slug}' já está em uso`);
            }
            throw new common_1.ConflictException('Documento já cadastrado para outro candidato');
        }
        const tenant = await this.prisma.tenant.create({ data: dto });
        await this.auditLog(actorUserId, null, client_1.AuditAction.CREATE, 'Tenant', tenant.id, null, tenant);
        return tenant;
    }
    async findAll(query) {
        const { search, state, party, isActive, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;
        const where = {
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { slug: { contains: search, mode: 'insensitive' } },
                    { party: { contains: search, mode: 'insensitive' } },
                ],
            }),
            ...(state && { state }),
            ...(party && { party: { contains: party, mode: 'insensitive' } }),
            ...(isActive !== undefined && { isActive }),
        };
        const [items, total] = await Promise.all([
            this.prisma.tenant.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: {
                            users: true,
                            voters: true,
                        },
                    },
                },
            }),
            this.prisma.tenant.count({ where }),
        ]);
        return {
            items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        users: true,
                        voters: true,
                        regions: true,
                        segments: true,
                    },
                },
            },
        });
        if (!tenant)
            throw new common_1.NotFoundException(`Candidato não encontrado`);
        return tenant;
    }
    async update(id, dto, actorUserId) {
        const existing = await this.findOne(id);
        if (dto.slug && dto.slug !== existing.slug) {
            const slugConflict = await this.prisma.tenant.findFirst({
                where: { slug: dto.slug, id: { not: id } },
            });
            if (slugConflict)
                throw new common_1.ConflictException(`Slug '${dto.slug}' já está em uso`);
        }
        const updated = await this.prisma.tenant.update({
            where: { id },
            data: dto,
        });
        await this.auditLog(actorUserId, null, client_1.AuditAction.UPDATE, 'Tenant', id, existing, updated);
        return updated;
    }
    async remove(id, actorUserId) {
        const tenant = await this.findOne(id);
        const votersCount = await this.prisma.voter.count({ where: { tenantId: id } });
        if (votersCount > 0) {
            throw new common_1.ForbiddenException(`Não é possível excluir: candidato possui ${votersCount} eleitores cadastrados. Desative o tenant em vez de excluir.`);
        }
        await this.prisma.tenant.delete({ where: { id } });
        await this.auditLog(actorUserId, null, client_1.AuditAction.DELETE, 'Tenant', id, tenant, null);
        return { message: 'Candidato excluído com sucesso' };
    }
    async getStats() {
        const [totalTenants, totalVoters, totalUsers, byState] = await Promise.all([
            this.prisma.tenant.count({ where: { isActive: true } }),
            this.prisma.voter.count(),
            this.prisma.user.count({ where: { role: { not: 'ROOT' } } }),
            this.prisma.tenant.groupBy({
                by: ['state'],
                _count: { id: true },
                where: { isActive: true, state: { not: null } },
                orderBy: { _count: { id: 'desc' } },
            }),
        ]);
        return { totalTenants, totalVoters, totalUsers, byState };
    }
    async auditLog(userId, tenantId, action, entity, entityId, oldValue, newValue) {
        await this.prisma.auditLog.create({
            data: { userId, tenantId, action, entity, entityId, oldValue, newValue },
        });
    }
};
exports.TenantsService = TenantsService;
exports.TenantsService = TenantsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TenantsService);
//# sourceMappingURL=tenants.service.js.map