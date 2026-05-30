import { PrismaService } from '../../database/prisma.service';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';
import { Role } from '@prisma/client';
export declare class DashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getRootDashboard(filter: DashboardFilterDto): Promise<{
        overview: {
            totalTenants: number;
            activeTenants: number;
            inactiveTenants: number;
            totalUsers: number;
            totalVoters: number;
            totalRegions: number;
        };
        growth: {
            newTenantsLast30: number;
            newVotersLast30: number;
            newVotersLast7: number;
            recentLoginsLast24h: number;
            byDay: {
                date: string;
                count: number;
            }[];
        };
        distribution: {
            tenantsByState: {
                state: string | null;
                count: number;
            }[];
            tenantsByParty: {
                party: string | null;
                count: number;
            }[];
            votersBySupport: {
                status: import(".prisma/client").$Enums.SupportStatus;
                count: number;
            }[];
        };
        topTenants: ({
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
        activity: {
            importExport: {
                action: import(".prisma/client").$Enums.AuditAction;
                count: number;
            }[];
        };
    }>;
    getTenantDashboard(filter: DashboardFilterDto, actor: {
        role: Role;
        tenantId: string | null;
    }): Promise<{
        overview: {
            totalVoters: number;
            activeVoters: number;
            inactiveVoters: number;
            newVotersLast30: number;
            newVotersLast7: number;
            totalRegions: number;
            totalSegments: number;
            totalUsers: number;
            supportRate: string;
        };
        growth: {
            byDay: {
                date: string;
                count: number;
            }[];
        };
        votersBySupport: {
            status: import(".prisma/client").$Enums.SupportStatus;
            count: number;
            percentage: string;
        }[];
        votersBySex: {
            sex: import(".prisma/client").$Enums.Sex | null;
            count: number;
        }[];
        votersBySegment: {
            segmentId: string | null;
            segmentName: string;
            count: number;
        }[];
        votersByRegion: {
            regionId: string | null;
            regionName: string;
            count: number;
        }[];
        votersByMunicipality: {
            municipalityId: string | null;
            municipalityName: string;
            count: number;
        }[];
        topLeaders: {
            leaderId: string | null;
            leaderName: string;
            votersCount: number;
        }[];
        recentVoters: {
            id: string;
            name: string;
            createdAt: Date;
            municipality: {
                name: string;
            } | null;
            segment: {
                name: string;
            } | null;
            supportStatus: import(".prisma/client").$Enums.SupportStatus;
            createdBy: {
                name: string;
            } | null;
        }[];
    }>;
    private getGrowthByDay;
    private buildDateFilter;
}
