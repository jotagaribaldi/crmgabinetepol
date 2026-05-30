import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { LoginDto } from './dto/login.dto';
import { AuditAction } from '@prisma/client';

export interface JwtPayload {
  sub: string;       // userId
  email: string;
  role: string;
  tenantId: string | null;
  name: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    tenantId: string | null;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly REFRESH_TOKEN_TTL_DAYS = 7;
  private readonly BLACKLIST_PREFIX = 'blacklist:';
  private readonly RATE_LIMIT_PREFIX = 'rate:login:';
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly RATE_LIMIT_WINDOW = 900; // 15 min em segundos

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  // ── Login ────────────────────────────────────────────────────────────

  async login(dto: LoginDto, ip: string, userAgent: string): Promise<AuthTokens> {
    // Rate limiting por IP
    await this.checkRateLimit(ip);

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { tenant: { select: { id: true, name: true, isActive: true } } },
    });

    if (!user || !user.isActive) {
      await this.incrementRateLimit(ip);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (user.tenantId && user.tenant && !user.tenant.isActive) {
      throw new UnauthorizedException('Tenant inativo. Entre em contato com o suporte.');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      await this.incrementRateLimit(ip);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Limpa rate limit após sucesso
    await this.redis.del(`${this.RATE_LIMIT_PREFIX}${ip}`);

    // Atualiza lastLoginAt
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Gera tokens
    const tokens = await this.generateTokens(user);

    // Auditoria
    await this.createAuditLog({
      userId: user.id,
      tenantId: user.tenantId,
      action: AuditAction.LOGIN,
      entity: 'User',
      entityId: user.id,
      ipAddress: ip,
      userAgent,
    });

    return tokens;
  }

  // ── Refresh Token ────────────────────────────────────────────────────

  async refreshToken(token: string): Promise<AuthTokens> {
    // Verifica se token está na blacklist
    const isBlacklisted = await this.redis.exists(`${this.BLACKLIST_PREFIX}${token}`);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token revogado');
    }

    // Valida o refresh token no banco
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    if (!storedToken.user.isActive) {
      throw new UnauthorizedException('Usuário inativo');
    }

    // Revoga token antigo (rotação)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // Blacklist no Redis para garantia
    const remainingTTL = Math.floor(
      (storedToken.expiresAt.getTime() - Date.now()) / 1000,
    );
    if (remainingTTL > 0) {
      await this.redis.set(`${this.BLACKLIST_PREFIX}${token}`, '1', remainingTTL);
    }

    return this.generateTokens(storedToken.user);
  }

  // ── Logout ───────────────────────────────────────────────────────────

  async logout(
    userId: string,
    tenantId: string | null,
    accessToken: string,
    ip: string,
    userAgent: string,
  ): Promise<void> {
    // Revoga todos os refresh tokens do usuário
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });

    // Blacklist o access token no Redis até ele expirar
    try {
      const decoded = this.jwtService.decode(accessToken) as { exp: number };
      if (decoded?.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await this.redis.set(`${this.BLACKLIST_PREFIX}${accessToken}`, '1', ttl);
        }
      }
    } catch {
      // Ignora se não conseguir decodificar
    }

    // Auditoria
    await this.createAuditLog({
      userId,
      tenantId,
      action: AuditAction.LOGOUT,
      entity: 'User',
      entityId: userId,
      ipAddress: ip,
      userAgent,
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  private async generateTokens(user: any): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      name: user.name,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: '15m',
    });

    // Refresh token — UUID único armazenado no banco
    const refreshTokenValue = uuidv4();
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
      expiresIn: 900, // 15 min em segundos
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }

  private async checkRateLimit(ip: string): Promise<void> {
    const key = `${this.RATE_LIMIT_PREFIX}${ip}`;
    const attempts = await this.redis.get(key);
    if (attempts && parseInt(attempts) >= this.MAX_LOGIN_ATTEMPTS) {
      throw new BadRequestException(
        'Muitas tentativas de login. Aguarde 15 minutos.',
      );
    }
  }

  private async incrementRateLimit(ip: string): Promise<void> {
    const key = `${this.RATE_LIMIT_PREFIX}${ip}`;
    await this.redis.incr(key, this.RATE_LIMIT_WINDOW);
  }

  private async createAuditLog(data: {
    userId: string;
    tenantId: string | null;
    action: AuditAction;
    entity: string;
    entityId?: string;
    ipAddress: string;
    userAgent: string;
  }): Promise<void> {
    try {
      await this.prisma.auditLog.create({ data });
    } catch (err) {
      this.logger.warn(`Falha ao gravar auditoria: ${err.message}`);
    }
  }

  // ── Validar Access Token (para guards externos) ───────────────────

  async validateAccessToken(token: string): Promise<JwtPayload | null> {
    const isBlacklisted = await this.redis.exists(`${this.BLACKLIST_PREFIX}${token}`);
    if (isBlacklisted) return null;
    try {
      return this.jwtService.verify(token, {
        secret: this.config.get<string>('JWT_SECRET'),
      }) as JwtPayload;
    } catch {
      return null;
    }
  }
}
