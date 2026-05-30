import { MunicipalitiesService } from './municipalities.service';
import { QueryMunicipalityDto } from './dto/query-municipality.dto';
export declare class MunicipalitiesController {
    private readonly municipalitiesService;
    constructor(municipalitiesService: MunicipalitiesService);
    findAll(query: QueryMunicipalityDto): Promise<{
        items: ({
            state: {
                id: string;
                abbreviation: string;
                name: string;
            };
        } & {
            id: string;
            ibgeCode: string;
            name: string;
            createdAt: Date;
            stateId: string;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        state: {
            id: string;
            abbreviation: string;
            name: string;
        };
        _count: {
            regionLinks: number;
            voters: number;
        };
    } & {
        id: string;
        ibgeCode: string;
        name: string;
        createdAt: Date;
        stateId: string;
    }>;
    findByState(stateId: string): Promise<{
        id: string;
        ibgeCode: string;
        name: string;
    }[]>;
}
