import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { LoginDto } from './dto/login.dto';
export interface JwtPayload {
    sub: string;
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
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly config;
    private readonly redis;
    private readonly logger;
    private readonly REFRESH_TOKEN_TTL_DAYS;
    private readonly BLACKLIST_PREFIX;
    private readonly RATE_LIMIT_PREFIX;
    private readonly MAX_LOGIN_ATTEMPTS;
    private readonly RATE_LIMIT_WINDOW;
    constructor(prisma: PrismaService, jwtService: JwtService, config: ConfigService, redis: RedisService);
    login(dto: LoginDto, ip: string, userAgent: string): Promise<AuthTokens>;
    refreshToken(token: string): Promise<AuthTokens>;
    logout(userId: string, tenantId: string | null, accessToken: string, ip: string, userAgent: string): Promise<void>;
    private generateTokens;
    private checkRateLimit;
    private incrementRateLimit;
    private createAuditLog;
    validateAccessToken(token: string): Promise<JwtPayload | null>;
}
