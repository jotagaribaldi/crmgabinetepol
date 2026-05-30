import { Sex, SupportStatus } from '@prisma/client';
export declare class CreateVoterDto {
    name: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
    cpf?: string;
    birthDate?: string;
    sex?: Sex;
    address?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    zipCode?: string;
    municipalityId?: string;
    regionId?: string;
    segmentId?: string;
    coordinatorId?: string;
    regionalLeaderId?: string;
    localLeaderId?: string;
    supportStatus?: SupportStatus;
    observations?: string;
}
