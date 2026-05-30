"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../../database/prisma.service");
const client_1 = require("@prisma/client");
const USER_SELECT = {
    id: true,
    tenantId: true,
    name: true,
    email: true,
    role: true,
    phone: true,
    isActive: true,
    lastLoginAt: true,
    createdAt: true,
    updatedAt: true,
    tenant: { select: { id: true, name: true, slug: true } },
};
const CREATION_HIERARCHY = {
    [client_1.Role.ROOT]: [client_1.Role.ROOT, client_1.Role.POLITICO, client_1.Role.CHEFEGAB, client_1.Role.COORDENADOR, client_1.Role.LIDERREG, client_1.Role.LIDERLOCAL],
    [client_1.Role.POLITICO]: [client_1.Role.CHEFEGAB],
    [client_1.Role.CHEFEGAB]: [client_1.Role.COORDENADOR],
    [client_1.Role.COORDENADOR]: [client_1.Role.LIDERREG],
    [client_1.Role.LIDERREG]: [client_1.Role.LIDERLOCAL],
};
let UsersService = class UsersService {
    prisma;
    BCRYPT_ROUNDS = 12;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto, actor) {
        const allowedRoles = CREATION_HIERARCHY[actor.role];
        if (!allowedRoles || !allowedRoles.includes(dto.role)) {
            throw new common_1.ForbiddenException(`Perfil '${actor.role}' não pode criar usuários com perfil '${dto.role}'`);
        }
        const tenantId = actor.role === client_1.Role.ROOT ? dto.tenantId ?? null : actor.tenantId;
        if (dto.role !== client_1.Role.ROOT && !tenantId) {
            throw new common_1.BadRequestException('tenantId é obrigatório para este perfil de usuário');
        }
        if (tenantId) {
            const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
            if (!tenant)
                throw new common_1.NotFoundException('Tenant não encontrado');
            if (!tenant.isActive)
                throw new common_1.ForbiddenException('Tenant inativo');
        }
        const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
        if (existingEmail)
            throw new common_1.ConflictException('E-mail já cadastrado');
        const passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_ROUNDS);
        const user = await this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email.toLowerCase(),
                passwordHash,
                role: dto.role,
                phone: dto.phone,
                tenantId,
            },
            select: USER_SELECT,
        });
        await this.auditLog(actor.id, actor.tenantId, client_1.AuditAction.CREATE, 'User', user.id, null, { ...user });
        return user;
    }
    async findAll(query, actor) {
        const { search, role, isActive, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;
        const tenantId = actor.role === client_1.Role.ROOT
            ? query.tenantId ?? undefined
            : actor.tenantId ?? undefined;
        const where = {
            ...(tenantId !== undefined ? { tenantId } : {}),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            }),
            ...(role && { role }),
            ...(isActive !== undefined && { isActive }),
        };
        const [items, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: USER_SELECT,
            }),
            this.prisma.user.count({ where }),
        ]);
        return {
            items,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async findOne(id, actor) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: USER_SELECT,
        });
        if (!user)
            throw new common_1.NotFoundException('Usuário não encontrado');
        if (actor.role !== client_1.Role.ROOT && user.tenantId !== actor.tenantId) {
            throw new common_1.ForbiddenException('Acesso negado');
        }
        return user;
    }
    async update(id, dto, actor) {
        const existing = await this.findOne(id, actor);
        if (actor.id === id && actor.role !== client_1.Role.ROOT) {
            if (dto.role !== undefined && dto.role !== actor.role) {
                throw new common_1.ForbiddenException('Você não pode alterar seu próprio perfil');
            }
            if (dto.isActive === false) {
                throw new common_1.ForbiddenException('Você não pode desativar sua própria conta');
            }
        }
        if (dto.email && dto.email.toLowerCase() !== existing.email) {
            const emailConflict = await this.prisma.user.findUnique({
                where: { email: dto.email.toLowerCase() },
            });
            if (emailConflict)
                throw new common_1.ConflictException('E-mail já cadastrado');
        }
        const updateData = { ...dto };
        if (dto.email)
            updateData.email = dto.email.toLowerCase();
        if (dto.password) {
            updateData.passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_ROUNDS);
            delete updateData.password;
        }
        const updated = await this.prisma.user.update({
            where: { id },
            data: updateData,
            select: USER_SELECT,
        });
        await this.auditLog(actor.id, actor.tenantId, client_1.AuditAction.UPDATE, 'User', id, existing, updated);
        return updated;
    }
    async remove(id, actor) {
        if (actor.id === id) {
            throw new common_1.ForbiddenException('Você não pode excluir sua própria conta');
        }
        const user = await this.findOne(id, actor);
        if (user.role === client_1.Role.ROOT && actor.role === client_1.Role.ROOT) {
            const rootCount = await this.prisma.user.count({ where: { role: client_1.Role.ROOT } });
            if (rootCount <= 1) {
                throw new common_1.ForbiddenException('Não é possível excluir o único usuário ROOT do sistema');
            }
        }
        await this.prisma.user.delete({ where: { id } });
        await this.auditLog(actor.id, actor.tenantId, client_1.AuditAction.DELETE, 'User', id, user, null);
        return { message: 'Usuário excluído com sucesso' };
    }
    async resetPassword(id, newPassword, actor) {
        await this.findOne(id, actor);
        const passwordHash = await bcrypt.hash(newPassword, this.BCRYPT_ROUNDS);
        await this.prisma.user.update({ where: { id }, data: { passwordHash } });
        await this.prisma.refreshToken.updateMany({
            where: { userId: id, isRevoked: false },
            data: { isRevoked: true },
        });
        return { message: 'Senha redefinida com sucesso. Sessões anteriores foram encerradas.' };
    }
    async auditLog(userId, tenantId, action, entity, entityId, oldValue, newValue) {
        await this.prisma.auditLog.create({
            data: { userId, tenantId, action, entity, entityId, oldValue, newValue },
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map