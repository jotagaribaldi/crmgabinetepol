import { Role } from '@prisma/client';
export declare class QueryUserDto {
    search?: string;
    role?: Role;
    tenantId?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
}
