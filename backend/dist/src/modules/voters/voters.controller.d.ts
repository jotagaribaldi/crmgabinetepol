import type { Response } from 'express';
import { VotersService } from './voters.service';
import { CreateVoterDto } from './dto/create-voter.dto';
import { UpdateVoterDto } from './dto/update-voter.dto';
import { QueryVoterDto } from './dto/query-voter.dto';
import { Role } from '@prisma/client';
export declare class VotersController {
    private readonly votersService;
    constructor(votersService: VotersService);
    create(dto: CreateVoterDto, actor: {
        sub: string;
        role: Role;
        tenantId: string | null;
    }): Promise<{
        municipality: {
            id: string;
            name: string;
        } | null;
        region: {
            id: string;
            name: string;
        } | null;
        segment: {
            id: string;
            name: string;
        } | null;
        coordinator: {
            id: string;
            name: string;
        } | null;
        regionalLeader: {
            id: string;
            name: string;
        } | null;
        localLeader: {
            id: string;
            name: string;
        } | null;
        createdBy: {
            id: string;
            name: string;
        } | null;
    } & {
        number: string | null;
        id: string;
        name: string;
        createdAt: Date;
        email: string | null;
        tenantId: string;
        phone: string | null;
        isActive: boolean;
        updatedAt: Date;
        coordinatorId: string | null;
        regionId: string | null;
        municipalityId: string | null;
        segmentId: string | null;
        whatsapp: string | null;
        cpf: string | null;
        birthDate: Date | null;
        sex: import(".prisma/client").$Enums.Sex | null;
        address: string | null;
        complement: string | null;
        neighborhood: string | null;
        zipCode: string | null;
        regionalLeaderId: string | null;
        localLeaderId: string | null;
        supportStatus: import(".prisma/client").$Enums.SupportStatus;
        observations: string | null;
        createdById: string | null;
    }>;
    findAll(query: QueryVoterDto, actor: {
        role: Role;
        tenantId: string | null;
    }): Promise<{
        items: ({
            municipality: {
                id: string;
                name: string;
            } | null;
            region: {
                id: string;
                name: string;
            } | null;
            segment: {
                id: string;
                name: string;
            } | null;
            coordinator: {
                id: string;
                name: string;
            } | null;
            regionalLeader: {
                id: string;
                name: string;
            } | null;
            localLeader: {
                id: string;
                name: string;
            } | null;
            createdBy: {
                id: string;
                name: string;
            } | null;
        } & {
            number: string | null;
            id: string;
            name: string;
            createdAt: Date;
            email: string | null;
            tenantId: string;
            phone: string | null;
            isActive: boolean;
            updatedAt: Date;
            coordinatorId: string | null;
            regionId: string | null;
            municipalityId: string | null;
            segmentId: string | null;
            whatsapp: string | null;
            cpf: string | null;
            birthDate: Date | null;
            sex: import(".prisma/client").$Enums.Sex | null;
            address: string | null;
            complement: string | null;
            neighborhood: string | null;
            zipCode: string | null;
            regionalLeaderId: string | null;
            localLeaderId: string | null;
            supportStatus: import(".prisma/client").$Enums.SupportStatus;
            observations: string | null;
            createdById: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getStats(actor: {
        role: Role;
        tenantId: string | null;
    }): Promise<{
        total: number;
        recentGrowth: number;
        bySupportStatus: {
            status: import(".prisma/client").$Enums.SupportStatus;
            count: number;
        }[];
        bySex: {
            sex: import(".prisma/client").$Enums.Sex | null;
            count: number;
        }[];
        bySegment: {
            segmentId: string | null;
            segmentName: string;
            count: number;
        }[];
        byMunicipality: {
            municipalityId: string | null;
            municipalityName: string;
            count: number;
        }[];
        byRegion: {
            regionId: string | null;
            count: number;
        }[];
    }>;
    findOne(id: string, actor: {
        role: Role;
        tenantId: string | null;
    }): Promise<{
        municipality: {
            id: string;
            name: string;
        } | null;
        region: {
            id: string;
            name: string;
        } | null;
        segment: {
            id: string;
            name: string;
        } | null;
        coordinator: {
            id: string;
            name: string;
        } | null;
        regionalLeader: {
            id: string;
            name: string;
        } | null;
        localLeader: {
            id: string;
            name: string;
        } | null;
        createdBy: {
            id: string;
            name: string;
        } | null;
    } & {
        number: string | null;
        id: string;
        name: string;
        createdAt: Date;
        email: string | null;
        tenantId: string;
        phone: string | null;
        isActive: boolean;
        updatedAt: Date;
        coordinatorId: string | null;
        regionId: string | null;
        municipalityId: string | null;
        segmentId: string | null;
        whatsapp: string | null;
        cpf: string | null;
        birthDate: Date | null;
        sex: import(".prisma/client").$Enums.Sex | null;
        address: string | null;
        complement: string | null;
        neighborhood: string | null;
        zipCode: string | null;
        regionalLeaderId: string | null;
        localLeaderId: string | null;
        supportStatus: import(".prisma/client").$Enums.SupportStatus;
        observations: string | null;
        createdById: string | null;
    }>;
    update(id: string, dto: UpdateVoterDto, actor: {
        sub: string;
        role: Role;
        tenantId: string | null;
    }): Promise<{
        municipality: {
            id: string;
            name: string;
        } | null;
        region: {
            id: string;
            name: string;
        } | null;
        segment: {
            id: string;
            name: string;
        } | null;
        coordinator: {
            id: string;
            name: string;
        } | null;
        regionalLeader: {
            id: string;
            name: string;
        } | null;
        localLeader: {
            id: string;
            name: string;
        } | null;
        createdBy: {
            id: string;
            name: string;
        } | null;
    } & {
        number: string | null;
        id: string;
        name: string;
        createdAt: Date;
        email: string | null;
        tenantId: string;
        phone: string | null;
        isActive: boolean;
        updatedAt: Date;
        coordinatorId: string | null;
        regionId: string | null;
        municipalityId: string | null;
        segmentId: string | null;
        whatsapp: string | null;
        cpf: string | null;
        birthDate: Date | null;
        sex: import(".prisma/client").$Enums.Sex | null;
        address: string | null;
        complement: string | null;
        neighborhood: string | null;
        zipCode: string | null;
        regionalLeaderId: string | null;
        localLeaderId: string | null;
        supportStatus: import(".prisma/client").$Enums.SupportStatus;
        observations: string | null;
        createdById: string | null;
    }>;
    remove(id: string, actor: {
        sub: string;
        role: Role;
        tenantId: string | null;
    }): Promise<{
        message: string;
    }>;
    importCsv(file: Express.Multer.File, actor: {
        sub: string;
        role: Role;
        tenantId: string | null;
    }): Promise<{
        success: number;
        errors: Array<{
            row: number;
            data: any;
            error: string;
        }>;
    } | {
        success: boolean;
        parseErrors: any;
    }>;
    exportCsv(query: QueryVoterDto, actor: {
        sub: string;
        role: Role;
        tenantId: string | null;
    }, res: Response): Promise<void>;
    exportXlsx(query: QueryVoterDto, actor: {
        sub: string;
        role: Role;
        tenantId: string | null;
    }, res: Response): Promise<void>;
}
