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
exports.RegionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../database/prisma.service");
const client_1 = require("@prisma/client");
const REGION_SELECT = {
    id: true,
    tenantId: true,
    stateId: true,
    coordinatorId: true,
    name: true,
    description: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    state: { select: { id: true, name: true, abbreviation: true } },
    coordinator: { select: { id: true, name: true, email: true, role: true } },
    municipalities: {
        include: {
            municipality: { select: { id: true, name: true, ibgeCode: true } },
        },
    },
    _count: { select: { voters: true, municipalities: true } },
};
let RegionsService = class RegionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, actor) {
        const tenantId = actor.tenantId;
        if (!tenantId)
            throw new common_1.ForbiddenException('ROOT não pode criar regiões sem tenant');
        const existing = await this.prisma.region.findFirst({
            where: { tenantId, name: { equals: dto.name, mode: 'insensitive' } },
        });
        if (existing)
            throw new common_1.ConflictException(`Região '${dto.name}' já existe neste tenant`);
        const state = await this.prisma.state.findUnique({ where: { id: dto.stateId } });
        if (!state)
            throw new common_1.NotFoundException('Estado não encontrado');
        if (dto.coordinatorId) {
            await this.validateCoordinator(dto.coordinatorId, tenantId);
        }
        if (dto.municipalityIds?.length) {
            await this.validateMunicipalities(dto.municipalityIds, dto.stateId);
        }
        const region = await this.prisma.$transaction(async (tx) => {
            const created = await tx.region.create({
                data: {
                    tenantId,
                    stateId: dto.stateId,
                    coordinatorId: dto.coordinatorId,
                    name: dto.name,
                    description: dto.description,
                },
            });
            if (dto.municipalityIds?.length) {
                await tx.regionMunicipality.createMany({
                    data: dto.municipalityIds.map((municipalityId) => ({
                        regionId: created.id,
                        municipalityId,
                    })),
                    skipDuplicates: true,
                });
            }
            return tx.region.findUnique({ where: { id: created.id }, select: REGION_SELECT });
        });
        await this.auditLog(actor.id, tenantId, client_1.AuditAction.CREATE, 'Region', region.id, null, region);
        return region;
    }
    async findAll(query, actor) {
        const { search, stateId, coordinatorId, isActive, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;
        const tenantId = actor.role === client_1.Role.ROOT ? undefined : (actor.tenantId ?? undefined);
        const where = {
            ...(tenantId !== undefined ? { tenantId } : {}),
            ...(search && { name: { contains: search, mode: 'insensitive' } }),
            ...(stateId && { stateId }),
            ...(coordinatorId && { coordinatorId }),
            ...(isActive !== undefined && { isActive }),
        };
        const [items, total] = await Promise.all([
            this.prisma.region.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' },
                select: REGION_SELECT,
            }),
            this.prisma.region.count({ where }),
        ]);
        return {
            items,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async findOne(id, actor) {
        const region = await this.prisma.region.findUnique({
            where: { id },
            select: REGION_SELECT,
        });
        if (!region)
            throw new common_1.NotFoundException('Região não encontrada');
        if (actor.role !== client_1.Role.ROOT && region.tenantId !== actor.tenantId) {
            throw new common_1.ForbiddenException('Acesso negado');
        }
        return region;
    }
    async update(id, dto, actor) {
        const existing = await this.findOne(id, actor);
        if (dto.name && dto.name !== existing.name) {
            const nameConflict = await this.prisma.region.findFirst({
                where: {
                    tenantId: existing.tenantId,
                    name: { equals: dto.name, mode: 'insensitive' },
                    id: { not: id },
                },
            });
            if (nameConflict)
                throw new common_1.ConflictException(`Região '${dto.name}' já existe neste tenant`);
        }
        if (dto.stateId && dto.stateId !== existing.stateId) {
            const state = await this.prisma.state.findUnique({ where: { id: dto.stateId } });
            if (!state)
                throw new common_1.NotFoundException('Estado não encontrado');
        }
        if (dto.coordinatorId) {
            await this.validateCoordinator(dto.coordinatorId, existing.tenantId);
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            await tx.region.update({
                where: { id },
                data: {
                    name: dto.name,
                    description: dto.description,
                    stateId: dto.stateId,
                    coordinatorId: dto.coordinatorId,
                    isActive: dto.isActive,
                },
            });
            if (dto.municipalityIds !== undefined) {
                if (dto.municipalityIds.length > 0) {
                    const targetStateId = dto.stateId ?? existing.stateId;
                    await this.validateMunicipalities(dto.municipalityIds, targetStateId);
                }
                await tx.regionMunicipality.deleteMany({ where: { regionId: id } });
                if (dto.municipalityIds.length > 0) {
                    await tx.regionMunicipality.createMany({
                        data: dto.municipalityIds.map((municipalityId) => ({
                            regionId: id,
                            municipalityId,
                        })),
                        skipDuplicates: true,
                    });
                }
            }
            return tx.region.findUnique({ where: { id }, select: REGION_SELECT });
        });
        await this.auditLog(actor.id, actor.tenantId, client_1.AuditAction.UPDATE, 'Region', id, existing, updated);
        return updated;
    }
    async addMunicipalities(id, municipalityIds, actor) {
        const region = await this.findOne(id, actor);
        await this.validateMunicipalities(municipalityIds, region.stateId);
        await this.prisma.regionMunicipality.createMany({
            data: municipalityIds.map((municipalityId) => ({ regionId: id, municipalityId })),
            skipDuplicates: true,
        });
        return this.findOne(id, actor);
    }
    async removeMunicipalities(id, municipalityIds, actor) {
        await this.findOne(id, actor);
        await this.prisma.regionMunicipality.deleteMany({
            where: { regionId: id, municipalityId: { in: municipalityIds } },
        });
        return this.findOne(id, actor);
    }
    async assignCoordinator(id, coordinatorId, actor) {
        const region = await this.findOne(id, actor);
        if (coordinatorId) {
            await this.validateCoordinator(coordinatorId, region.tenantId);
        }
        const updated = await this.prisma.region.update({
            where: { id },
            data: { coordinatorId },
            select: REGION_SELECT,
        });
        await this.auditLog(actor.id, actor.tenantId, client_1.AuditAction.UPDATE, 'Region', id, region, updated);
        return updated;
    }
    async remove(id, actor) {
        const region = await this.findOne(id, actor);
        const votersCount = await this.prisma.voter.count({ where: { regionId: id } });
        if (votersCount > 0) {
            throw new common_1.ForbiddenException(`Não é possível excluir: região possui ${votersCount} eleitores. Desative a região em vez de excluir.`);
        }
        await this.prisma.region.delete({ where: { id } });
        await this.auditLog(actor.id, actor.tenantId, client_1.AuditAction.DELETE, 'Region', id, region, null);
        return { message: 'Região excluída com sucesso' };
    }
    async validateCoordinator(coordinatorId, tenantId) {
        const coordinator = await this.prisma.user.findUnique({
            where: { id: coordinatorId },
        });
        if (!coordinator)
            throw new common_1.NotFoundException('Coordenador não encontrado');
        if (coordinator.role !== client_1.Role.COORDENADOR) {
            throw new common_1.BadRequestException(`Usuário '${coordinator.name}' não possui perfil COORDENADOR`);
        }
        if (coordinator.tenantId !== tenantId) {
            throw new common_1.ForbiddenException('Coordenador pertence a outro tenant');
        }
        if (!coordinator.isActive) {
            throw new common_1.BadRequestException('Coordenador está inativo');
        }
    }
    async validateMunicipalities(municipalityIds, stateId) {
        const municipalities = await this.prisma.municipality.findMany({
            where: { id: { in: municipalityIds } },
            select: { id: true, stateId: true, name: true },
        });
        if (municipalities.length !== municipalityIds.length) {
            const foundIds = municipalities.map((m) => m.id);
            const notFound = municipalityIds.filter((id) => !foundIds.includes(id));
            throw new common_1.NotFoundException(`Municípios não encontrados: ${notFound.join(', ')}`);
        }
        const wrongState = municipalities.filter((m) => m.stateId !== stateId);
        if (wrongState.length > 0) {
            throw new common_1.BadRequestException(`Os seguintes municípios não pertencem ao estado selecionado: ${wrongState.map((m) => m.name).join(', ')}`);
        }
    }
    async auditLog(userId, tenantId, action, entity, entityId, oldValue, newValue) {
        await this.prisma.auditLog.create({
            data: { userId, tenantId, action, entity, entityId, oldValue, newValue },
        });
    }
};
exports.RegionsService = RegionsService;
exports.RegionsService = RegionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RegionsService);
//# sourceMappingURL=regions.service.js.map