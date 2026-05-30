import { StatesService } from './states.service';
import { QueryStateDto } from './dto/query-state.dto';
export declare class StatesController {
    private readonly statesService;
    constructor(statesService: StatesService);
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
    findByAbbr(abbreviation: string): Promise<{
        id: string;
        abbreviation: string;
        ibgeCode: string;
        name: string;
        createdAt: Date;
    }>;
}
