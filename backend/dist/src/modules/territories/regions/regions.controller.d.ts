import { RegionsService } from './regions.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { QueryRegionDto } from './dto/query-region.dto';
import { Role } from '@prisma/client';
declare class MunicipalityIdsDto {
    municipalityIds: string[];
}
declare class AssignCoordinatorDto {
    coordinatorId: string;
}
export declare class RegionsController {
    private readonly regionsService;
    constructor(regionsService: RegionsService);
    create(dto: CreateRegionDto, actor: {
        sub: string;
        role: Role;
        tenantId: string | null;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        municipalities: ({
            municipality: {
                id: string;
                ibgeCode: string;
                name: string;
            };
        } & {
            id: string;
            regionId: string;
            municipalityId: string;
        })[];
        state: {
            id: string;
            abbreviation: string;
            name: string;
        };
        _count: {
            municipalities: number;
            voters: number;
        };
        stateId: string;
        tenantId: string;
        isActive: boolean;
        updatedAt: Date;
        description: string | null;
        coordinatorId: string | null;
        coordinator: {
            id: string;
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        } | null;
    } | null>;
    findAll(query: QueryRegionDto, actor: {
        role: Role;
        tenantId: string | null;
    }): Promise<{
        items: {
            id: string;
            name: string;
            createdAt: Date;
            municipalities: ({
                municipality: {
                    id: string;
                    ibgeCode: string;
                    name: string;
                };
            } & {
                id: string;
                regionId: string;
                municipalityId: string;
            })[];
            state: {
                id: string;
                abbreviation: string;
                name: string;
            };
            _count: {
                municipalities: number;
                voters: number;
            };
            stateId: string;
            tenantId: string;
            isActive: boolean;
            updatedAt: Date;
            description: string | null;
            coordinatorId: string | null;
            coordinator: {
                id: string;
                name: string;
                email: string;
                role: import(".prisma/client").$Enums.Role;
            } | null;
        }[];
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
        id: string;
        name: string;
        createdAt: Date;
        municipalities: ({
            municipality: {
                id: string;
                ibgeCode: string;
                name: string;
            };
        } & {
            id: string;
            regionId: string;
            municipalityId: string;
        })[];
        state: {
            id: string;
            abbreviation: string;
            name: string;
        };
        _count: {
            municipalities: number;
            voters: number;
        };
        stateId: string;
        tenantId: string;
        isActive: boolean;
        updatedAt: Date;
        description: string | null;
        coordinatorId: string | null;
        coordinator: {
            id: string;
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        } | null;
    }>;
    update(id: string, dto: UpdateRegionDto, actor: {
        sub: string;
        role: Role;
        tenantId: string | null;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        municipalities: ({
            municipality: {
                id: string;
                ibgeCode: string;
                name: string;
            };
        } & {
            id: string;
            regionId: string;
            municipalityId: string;
        })[];
        state: {
            id: string;
            abbreviation: string;
            name: string;
        };
        _count: {
            municipalities: number;
            voters: number;
        };
        stateId: string;
        tenantId: string;
        isActive: boolean;
        updatedAt: Date;
        description: string | null;
        coordinatorId: string | null;
        coordinator: {
            id: string;
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        } | null;
    } | null>;
    addMunicipalities(id: string, dto: MunicipalityIdsDto, actor: {
        sub: string;
        role: Role;
        tenantId: string | null;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        municipalities: ({
            municipality: {
                id: string;
                ibgeCode: string;
                name: string;
            };
        } & {
            id: string;
            regionId: string;
            municipalityId: string;
        })[];
        state: {
            id: string;
            abbreviation: string;
            name: string;
        };
        _count: {
            municipalities: number;
            voters: number;
        };
        stateId: string;
        tenantId: string;
        isActive: boolean;
        updatedAt: Date;
        description: string | null;
        coordinatorId: string | null;
        coordinator: {
            id: string;
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        } | null;
    }>;
    removeMunicipalities(id: string, dto: MunicipalityIdsDto, actor: {
        sub: string;
        role: Role;
        tenantId: string | null;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        municipalities: ({
            municipality: {
                id: string;
                ibgeCode: string;
                name: string;
            };
        } & {
            id: string;
            regionId: string;
            municipalityId: string;
        })[];
        state: {
            id: string;
            abbreviation: string;
            name: string;
        };
        _count: {
            municipalities: number;
            voters: number;
        };
        stateId: string;
        tenantId: string;
        isActive: boolean;
        updatedAt: Date;
        description: string | null;
        coordinatorId: string | null;
        coordinator: {
            id: string;
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        } | null;
    }>;
    assignCoordinator(id: string, dto: AssignCoordinatorDto, actor: {
        sub: string;
        role: Role;
        tenantId: string | null;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        municipalities: ({
            municipality: {
                id: string;
                ibgeCode: string;
                name: string;
            };
        } & {
            id: string;
            regionId: string;
            municipalityId: string;
        })[];
        state: {
            id: string;
            abbreviation: string;
            name: string;
        };
        _count: {
            municipalities: number;
            voters: number;
        };
        stateId: string;
        tenantId: string;
        isActive: boolean;
        updatedAt: Date;
        description: string | null;
        coordinatorId: string | null;
        coordinator: {
            id: string;
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        } | null;
    }>;
    removeCoordinator(id: string, actor: {
        sub: string;
        role: Role;
        tenantId: string | null;
    }): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        municipalities: ({
            municipality: {
                id: string;
                ibgeCode: string;
                name: string;
            };
        } & {
            id: string;
            regionId: string;
            municipalityId: string;
        })[];
        state: {
            id: string;
            abbreviation: string;
            name: string;
        };
        _count: {
            municipalities: number;
            voters: number;
        };
        stateId: string;
        tenantId: string;
        isActive: boolean;
        updatedAt: Date;
        description: string | null;
        coordinatorId: string | null;
        coordinator: {
            id: string;
            name: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        } | null;
    }>;
    remove(id: string, actor: {
        sub: string;
        role: Role;
        tenantId: string | null;
    }): Promise<{
        message: string;
    }>;
}
export {};
