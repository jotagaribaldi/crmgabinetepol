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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
const uuid_1 = require("uuid");
const prisma_service_1 = require("../../database/prisma.service");
const redis_service_1 = require("../../redis/redis.service");
const client_1 = require("@prisma/client");
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwtService;
    config;
    redis;
    logger = new common_1.Logger(AuthService_1.name);
    REFRESH_TOKEN_TTL_DAYS = 7;
    BLACKLIST_PREFIX = 'blacklist:';
    RATE_LIMIT_PREFIX = 'rate:login:';
    MAX_LOGIN_ATTEMPTS = 5;
    RATE_LIMIT_WINDOW = 900;
    constructor(prisma, jwtService, config, redis) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.config = config;
        this.redis = redis;
    }
    async login(dto, ip, userAgent) {
        await this.checkRateLimit(ip);
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
            include: { tenant: { select: { id: true, name: true, isActive: true } } },
        });
        if (!user || !user.isActive) {
            await this.incrementRateLimit(ip);
            throw new common_1.UnauthorizedException('Credenciais inválidas');
        }
        if (user.tenantId && user.tenant && !user.tenant.isActive) {
            throw new common_1.UnauthorizedException('Tenant inativo. Entre em contato com o suporte.');
        }
        const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
        if (!passwordMatch) {
            await this.incrementRateLimit(ip);
            throw new common_1.UnauthorizedException('Credenciais inválidas');
        }
        await this.redis.del(`${this.RATE_LIMIT_PREFIX}${ip}`);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        const tokens = await this.generateTokens(user);
        await this.createAuditLog({
            userId: user.id,
            tenantId: user.tenantId,
            action: client_1.AuditAction.LOGIN,
            entity: 'User',
            entityId: user.id,
            ipAddress: ip,
            userAgent,
        });
        return tokens;
    }
    async refreshToken(token) {
        const isBlacklisted = await this.redis.exists(`${this.BLACKLIST_PREFIX}${token}`);
        if (isBlacklisted) {
            throw new common_1.UnauthorizedException('Token revogado');
        }
        const storedToken = await this.prisma.refreshToken.findUnique({
            where: { token },
            include: { user: true },
        });
        if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Refresh token inválido ou expirado');
        }
        if (!storedToken.user.isActive) {
            throw new common_1.UnauthorizedException('Usuário inativo');
        }
        await this.prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: { isRevoked: true },
        });
        const remainingTTL = Math.floor((storedToken.expiresAt.getTime() - Date.now()) / 1000);
        if (remainingTTL > 0) {
            await this.redis.set(`${this.BLACKLIST_PREFIX}${token}`, '1', remainingTTL);
        }
        return this.generateTokens(storedToken.user);
    }
    async logout(userId, tenantId, accessToken, ip, userAgent) {
        await this.prisma.refreshToken.updateMany({
            where: { userId, isRevoked: false },
            data: { isRevoked: true },
        });
        try {
            const decoded = this.jwtService.decode(accessToken);
            if (decoded?.exp) {
                const ttl = decoded.exp - Math.floor(Date.now() / 1000);
                if (ttl > 0) {
                    await this.redis.set(`${this.BLACKLIST_PREFIX}${accessToken}`, '1', ttl);
                }
            }
        }
        catch {
        }
        await this.createAuditLog({
            userId,
            tenantId,
            action: client_1.AuditAction.LOGOUT,
            entity: 'User',
            entityId: userId,
            ipAddress: ip,
            userAgent,
        });
    }
    async generateTokens(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId,
            name: user.name,
        };
        const accessToken = this.jwtService.sign(payload, {
            secret: this.config.get('JWT_SECRET'),
            expiresIn: '15m',
        });
        const refreshTokenValue = (0, uuid_1.v4)();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + this.REFRESH_TOKEN_TTL_DAYS);
        await this.prisma.refreshToken.create({
            data: {
                token: refreshTokenValue,
                userId: user.id,
                tenantId: user.tenantId,
                expiresAt,
            },
        });
        return {
            accessToken,
            refreshToken: refreshTokenValue,
            expiresIn: 900,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                tenantId: user.tenantId,
            },
        };
    }
    async checkRateLimit(ip) {
        const key = `${this.RATE_LIMIT_PREFIX}${ip}`;
        const attempts = await this.redis.get(key);
        if (attempts && parseInt(attempts) >= this.MAX_LOGIN_ATTEMPTS) {
            throw new common_1.BadRequestException('Muitas tentativas de login. Aguarde 15 minutos.');
        }
    }
    async incrementRateLimit(ip) {
        const key = `${this.RATE_LIMIT_PREFIX}${ip}`;
        await this.redis.incr(key, this.RATE_LIMIT_WINDOW);
    }
    async createAuditLog(data) {
        try {
            await this.prisma.auditLog.create({ data });
        }
        catch (err) {
            this.logger.warn(`Falha ao gravar auditoria: ${err.message}`);
        }
    }
    async validateAccessToken(token) {
        const isBlacklisted = await this.redis.exists(`${this.BLACKLIST_PREFIX}${token}`);
        if (isBlacklisted)
            return null;
        try {
            return this.jwtService.verify(token, {
                secret: this.config.get('JWT_SECRET'),
            });
        }
        catch {
            return null;
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        redis_service_1.RedisService])
], AuthService);
//# sourceMappingURL=auth.service.js.map