import { PrismaService } from '../../database/prisma.service';
import { CreateSegmentDto } from './dto/create-segment.dto';
import { UpdateSegmentDto } from './dto/update-segment.dto';
import { Role } from '@prisma/client';
export declare const DEFAULT_SEGMENTS: string[];
export declare class SegmentsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    seedDefaultSegments(tenantId: string, actorUserId: string): Promise<void>;
    create(dto: CreateSegmentDto, actor: {
        id: string;
        role: Role;
        tenantId: string | null;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        tenantId: string;
        isActive: boolean;
        updatedAt: Date;
    }>;
    findAll(query: {
        search?: string;
        isActive?: boolean;
        page?: number;
        limit?: number;
    }, actor: {
        role: Role;
        tenantId: string | null;
    }): Promise<{
        items: ({
            _count: {
                voters: number;
            };
        } & {
            id: string;
            name: string;
            createdAt: Date;
            tenantId: string;
            isActive: boolean;
            updatedAt: Date;
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
        _count: {
            voters: number;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        tenantId: string;
        isActive: boolean;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateSegmentDto, actor: {
        id: string;
        role: Role;
        tenantId: string | null;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        tenantId: string;
        isActive: boolean;
        updatedAt: Date;
    }>;
    remove(id: string, actor: {
        id: string;
        role: Role;
        tenantId: string | null;
    }): Promise<{
        message: string;
    }>;
    private auditLog;
}
