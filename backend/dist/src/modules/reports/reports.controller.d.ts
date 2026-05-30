import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { GenerateReportDto } from './dto/generate-report.dto';
import { Role } from '@prisma/client';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    generate(dto: GenerateReportDto, actor: {
        sub: string;
        role: Role;
        tenantId: string | null;
    }, res: Response): Promise<void>;
}
