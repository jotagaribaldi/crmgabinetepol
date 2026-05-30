import { Sex, SupportStatus } from '@prisma/client';
export declare class QueryVoterDto {
    name?: string;
    phone?: string;
    cpf?: string;
    municipalityId?: string;
    regionId?: string;
    segmentId?: string;
    coordinatorId?: string;
    regionalLeaderId?: string;
    localLeaderId?: string;
    sex?: Sex;
    supportStatus?: SupportStatus;
    createdFrom?: string;
    createdTo?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}
