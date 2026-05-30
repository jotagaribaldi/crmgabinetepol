import { SegmentsService } from './segments.service';
import { CreateSegmentDto } from './dto/create-segment.dto';
import { UpdateSegmentDto } from './dto/update-segment.dto';
import { Role } from '@prisma/client';
export declare class SegmentsController {
    private readonly segmentsService;
    constructor(segmentsService: SegmentsService);
    create(dto: CreateSegmentDto, actor: {
        sub: string;
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
    findAll(query: any, actor: {
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
        sub: string;
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
        sub: string;
        role: Role;
        tenantId: string | null;
    }): Promise<{
        message: string;
    }>;
}
