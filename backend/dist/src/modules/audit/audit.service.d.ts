import { PrismaService } from '../../database/prisma.service';
import { QueryAuditDto } from './dto/query-audit.dto';
import { Prisma, Role } from '@prisma/client';
export declare class AuditService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(query: QueryAuditDto, actor: {
        role: Role;
        tenantId: string | null;
    }): Promise<{
        items: ({
            tenant: {
                id: string;
                name: string;
                slug: string;
            } | null;
            user: {
                id: string;
                name: string;
                email: string;
                role: import(".prisma/client").$Enums.Role;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            tenantId: string | null;
            userId: string | null;
            action: import(".prisma/client").$Enums.AuditAction;
            entity: string;
            entityId: string | null;
            oldValue: Prisma.JsonValue | null;
            newValue: Prisma.JsonValue | null;
            ipAddress: string | null;
            userAgent: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string, actor: {
        role: Role;
        tenantId: string | null;
    }): Promise<{
        tenant: {
            id: string;
            name: string;
        } | null;
        user: {
            id: string;
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        tenantId: string | null;
        userId: string | null;
        action: import(".prisma/client").$Enums.AuditAction;
        entity: string;
        entityId: string | null;
        oldValue: Prisma.JsonValue | null;
        newValue: Prisma.JsonValue | null;
        ipAddress: string | null;
        userAgent: string | null;
    }>;
    getSummary(actor: {
        role: Role;
        tenantId: string | null;
    }): Promise<{
        recentActivity: number;
        byAction: {
            action: import(".prisma/client").$Enums.AuditAction;
            count: number;
        }[];
        byEntity: {
            entity: string;
            count: number;
        }[];
        topUsers: {
            userId: string | null;
            user: {
                id: string;
                name: string;
                role: import(".prisma/client").$Enums.Role;
            } | undefined;
            actionsCount: number;
        }[];
    }>;
}
