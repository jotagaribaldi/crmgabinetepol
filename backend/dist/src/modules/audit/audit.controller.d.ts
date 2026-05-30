import { AuditService } from './audit.service';
import { QueryAuditDto } from './dto/query-audit.dto';
import { Role } from '@prisma/client';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
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
            oldValue: import("@prisma/client/runtime/library").JsonValue | null;
            newValue: import("@prisma/client/runtime/library").JsonValue | null;
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
        oldValue: import("@prisma/client/runtime/library").JsonValue | null;
        newValue: import("@prisma/client/runtime/library").JsonValue | null;
        ipAddress: string | null;
        userAgent: string | null;
    }>;
}
