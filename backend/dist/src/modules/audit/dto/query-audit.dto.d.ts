import { AuditAction } from '@prisma/client';
export declare class QueryAuditDto {
    action?: AuditAction;
    entity?: string;
    entityId?: string;
    userId?: string;
    tenantId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
}
