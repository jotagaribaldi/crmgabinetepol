import { PrismaService } from '../../../database/prisma.service';
import { QueryStateDto } from './dto/query-state.dto';
export declare class StatesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(query: QueryStateDto): Promise<{
        items: ({
            _count: {
                municipalities: number;
            };
        } & {
            id: string;
            abbreviation: string;
            ibgeCode: string;
            name: string;
            createdAt: Date;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        _count: {
            municipalities: number;
            regions: number;
        };
    } & {
        id: string;
        abbreviation: string;
        ibgeCode: string;
        name: string;
        createdAt: Date;
    }>;
    findByAbbreviation(abbreviation: string): Promise<{
        id: string;
        abbreviation: string;
        ibgeCode: string;
        name: string;
        createdAt: Date;
    }>;
}
