import { PrismaService } from '../../database/prisma.service';
import { GenerateReportDto } from './dto/generate-report.dto';
import { Role } from '@prisma/client';
export declare class ReportsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    generate(dto: GenerateReportDto, actor: {
        id: string;
        role: Role;
        tenantId: string | null;
    }): Promise<{
        filename: string;
        contentType: string;
        buffer: Buffer;
    }>;
    private buildVotersReport;
    private buildVotersByRegionReport;
    private buildVotersBySegmentReport;
    private buildVotersByMunicipalityReport;
    private buildLeadersPerformanceReport;
    private buildAuditSummaryReport;
}
