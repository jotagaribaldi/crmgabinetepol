import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { QueryTenantDto } from './dto/query-tenant.dto';
export declare class TenantsController {
    private readonly tenantsService;
    constructor(tenantsService: TenantsService);
    create(dto: CreateTenantDto, userId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        state: string | null;
        email: string | null;
        phone: string | null;
        isActive: boolean;
        updatedAt: Date;
        slug: string;
        document: string | null;
        party: string | null;
        position: string | null;
        city: string | null;
    }>;
    findAll(query: QueryTenantDto): Promise<{
        items: ({
            _count: {
                voters: number;
                users: number;
            };
        } & {
            id: string;
            name: string;
            createdAt: Date;
            state: string | null;
            email: string | null;
            phone: string | null;
            isActive: boolean;
            updatedAt: Date;
            slug: string;
            document: string | null;
            party: string | null;
            position: string | null;
            city: string | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getStats(): Promise<{
        totalTenants: number;
        totalVoters: number;
        totalUsers: number;
        byState: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.TenantGroupByOutputType, "state"[]> & {
            _count: {
                id: number;
            };
        })[];
    }>;
    findOne(id: string): Promise<{
        _count: {
            regions: number;
            voters: number;
            users: number;
            segments: number;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        state: string | null;
        email: string | null;
        phone: string | null;
        isActive: boolean;
        updatedAt: Date;
        slug: string;
        document: string | null;
        party: string | null;
        position: string | null;
        city: string | null;
    }>;
    update(id: string, dto: UpdateTenantDto, userId: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        state: string | null;
        email: string | null;
        phone: string | null;
        isActive: boolean;
        updatedAt: Date;
        slug: string;
        document: string | null;
        party: string | null;
        position: string | null;
        city: string | null;
    }>;
    remove(id: string, userId: string): Promise<{
        message: string;
    }>;
}
