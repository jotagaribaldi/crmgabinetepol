"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const client_1 = require("@prisma/client");
let DashboardService = class DashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getRootDashboard(filter) {
        if (filter.stateAbbr) {
            const state = await this.prisma.state.findUnique({
                where: { abbreviation: filter.stateAbbr.toUpperCase() },
                select: { id: true },
            });
            if (!state)
                throw new common_1.ForbiddenException(`Estado '${filter.stateAbbr}' não encontrado`);
        }
        const dateFilter = this.buildDateFilter(filter);
        const last30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const last7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const [totalTenants, activeTenants, totalUsers, totalVoters, totalRegions, newTenantsLast30, newVotersLast30, newVotersLast7, tenantsByState, tenantsByParty, votersBySupport, topTenantsByVoters, recentLogins, importExportStats,] = await Promise.all([
            this.prisma.tenant.count(),
            this.prisma.tenant.count({ where: { isActive: true } }),
            this.prisma.user.count({ where: { role: { not: client_1.Role.ROOT } } }),
            this.prisma.voter.count(),
            this.prisma.region.count(),
            this.prisma.tenant.count({ where: { createdAt: { gte: last30 } } }),
            this.prisma.voter.count({ where: { createdAt: { gte: last30 } } }),
            this.prisma.voter.count({ where: { createdAt: { gte: last7 } } }),
            this.prisma.tenant.groupBy({
                by: ['state'],
                _count: { id: true },
                where: { isActive: true, state: { not: null } },
                orderBy: { _count: { id: 'desc' } },
                take: 10,
            }),
            this.prisma.tenant.groupBy({
                by: ['party'],
                _count: { id: true },
                where: { isActive: true, party: { not: null } },
                orderBy: { _count: { id: 'desc' } },
                take: 10,
            }),
            this.prisma.voter.groupBy({
                by: ['supportStatus'],
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
            }),
            this.prisma.tenant.findMany({
                where: { isActive: true },
                include: {
                    _count: { select: { voters: true, users: true } },
                },
                orderBy: { voters: { _count: 'desc' } },
                take: 10,
            }),
            this.prisma.auditLog.count({
                where: {
                    action: client_1.AuditAction.LOGIN,
                    createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                },
            }),
            this.prisma.auditLog.groupBy({
                by: ['action'],
                where: { action: { in: [client_1.AuditAction.IMPORT, client_1.AuditAction.EXPORT] } },
                _count: { id: true },
            }),
        ]);
        const growthByDay = await this.getGrowthByDay(null, 7);
        return {
            overview: {
                totalTenants,
                activeTenants,
                inactiveTenants: totalTenants - activeTenants,
                totalUsers,
                totalVoters,
                totalRegions,
            },
            growth: {
                newTenantsLast30,
                newVotersLast30,
                newVotersLast7,
                recentLoginsLast24h: recentLogins,
                byDay: growthByDay,
            },
            distribution: {
                tenantsByState: tenantsByState.map((s) => ({ state: s.state, count: s._count.id })),
                tenantsByParty: tenantsByParty.map((p) => ({ party: p.party, count: p._count.id })),
                votersBySupport: votersBySupport.map((s) => ({ status: s.supportStatus, count: s._count.id })),
            },
            topTenants: topTenantsByVoters,
            activity: {
                importExport: importExportStats.map((s) => ({ action: s.action, count: s._count.id })),
            },
        };
    }
    async getTenantDashboard(filter, actor) {
        const tenantId = actor.tenantId;
        if (!tenantId)
            throw new common_1.ForbiddenException('ROOT deve usar o dashboard global');
        const last30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const last7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const dateFilter = this.buildDateFilter(filter);
        const voterBase = { tenantId };
        const voterDateBase = { tenantId, ...dateFilter };
        const [totalVoters, activeVoters, newVotersLast30, newVotersLast7, totalRegions, totalSegments, totalUsers, votersBySupport, votersBySegment, votersByRegion, votersBySex, votersByMunicipality, topLeaders, recentVoters,] = await Promise.all([
            this.prisma.voter.count({ where: voterBase }),
            this.prisma.voter.count({ where: { ...voterBase, isActive: true } }),
            this.prisma.voter.count({ where: { ...voterBase, createdAt: { gte: last30 } } }),
            this.prisma.voter.count({ where: { ...voterBase, createdAt: { gte: last7 } } }),
            this.prisma.region.count({ where: { tenantId } }),
            this.prisma.segment.count({ where: { tenantId } }),
            this.prisma.user.count({ where: { tenantId } }),
            this.prisma.voter.groupBy({
                by: ['supportStatus'],
                where: voterDateBase,
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
            }),
            this.prisma.voter.groupBy({
                by: ['segmentId'],
                where: { tenantId, segmentId: { not: null } },
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 10,
            }),
            this.prisma.voter.groupBy({
                by: ['regionId'],
                where: { tenantId, regionId: { not: null } },
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 10,
            }),
            this.prisma.voter.groupBy({
                by: ['sex'],
                where: { tenantId, sex: { not: null } },
                _count: { id: true },
            }),
            this.prisma.voter.groupBy({
                by: ['municipalityId'],
                where: { tenantId, municipalityId: { not: null } },
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 15,
            }),
            this.prisma.voter.groupBy({
                by: ['localLeaderId'],
                where: { tenantId, localLeaderId: { not: null } },
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 10,
            }),
            this.prisma.voter.findMany({
                where: voterBase,
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: {
                    id: true,
                    name: true,
                    supportStatus: true,
                    createdAt: true,
                    municipality: { select: { name: true } },
                    segment: { select: { name: true } },
                    createdBy: { select: { name: true } },
                },
            }),
        ]);
        const growthByDay = await this.getGrowthByDay(tenantId, 30);
        const [segmentNames, regionNames, municipalityNames, leaderNames] = await Promise.all([
            this.prisma.segment.findMany({
                where: { id: { in: votersBySegment.map((s) => s.segmentId).filter(Boolean) } },
                select: { id: true, name: true },
            }),
            this.prisma.region.findMany({
                where: { id: { in: votersByRegion.map((r) => r.regionId).filter(Boolean) } },
                select: { id: true, name: true },
            }),
            this.prisma.municipality.findMany({
                where: { id: { in: votersByMunicipality.map((m) => m.municipalityId).filter(Boolean) } },
                select: { id: true, name: true },
            }),
            this.prisma.user.findMany({
                where: { id: { in: topLeaders.map((l) => l.localLeaderId).filter(Boolean) } },
                select: { id: true, name: true },
            }),
        ]);
        const segMap = new Map(segmentNames.map((s) => [s.id, s.name]));
        const regMap = new Map(regionNames.map((r) => [r.id, r.name]));
        const munMap = new Map(municipalityNames.map((m) => [m.id, m.name]));
        const leadMap = new Map(leaderNames.map((l) => [l.id, l.name]));
        const confirmed = votersBySupport.find((s) => s.supportStatus === client_1.SupportStatus.CONFIRMADO)?._count.id ?? 0;
        const probable = votersBySupport.find((s) => s.supportStatus === client_1.SupportStatus.PROVAVEL)?._count.id ?? 0;
        const supportRate = totalVoters > 0 ? (((confirmed + probable) / totalVoters) * 100).toFixed(1) : '0.0';
        return {
            overview: {
                totalVoters,
                activeVoters,
                inactiveVoters: totalVoters - activeVoters,
                newVotersLast30,
                newVotersLast7,
                totalRegions,
                totalSegments,
                totalUsers,
                supportRate: `${supportRate}%`,
            },
            growth: { byDay: growthByDay },
            votersBySupport: votersBySupport.map((s) => ({
                status: s.supportStatus,
                count: s._count.id,
                percentage: totalVoters > 0 ? ((s._count.id / totalVoters) * 100).toFixed(1) : '0.0',
            })),
            votersBySex: votersBySex.map((s) => ({ sex: s.sex, count: s._count.id })),
            votersBySegment: votersBySegment.map((s) => ({
                segmentId: s.segmentId,
                segmentName: segMap.get(s.segmentId) ?? 'Desconhecido',
                count: s._count.id,
            })),
            votersByRegion: votersByRegion.map((r) => ({
                regionId: r.regionId,
                regionName: regMap.get(r.regionId) ?? 'Desconhecido',
                count: r._count.id,
            })),
            votersByMunicipality: votersByMunicipality.map((m) => ({
                municipalityId: m.municipalityId,
                municipalityName: munMap.get(m.municipalityId) ?? 'Desconhecido',
                count: m._count.id,
            })),
            topLeaders: topLeaders.map((l) => ({
                leaderId: l.localLeaderId,
                leaderName: leadMap.get(l.localLeaderId) ?? 'Desconhecido',
                votersCount: l._count.id,
            })),
            recentVoters,
        };
    }
    async getGrowthByDay(tenantId, days) {
        const results = [];
        const now = new Date();
        for (let i = days; i >= 0; i--) {
            const start = new Date(now);
            start.setDate(start.getDate() - i);
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setHours(23, 59, 59, 999);
            const where = { createdAt: { gte: start, lte: end } };
            if (tenantId)
                where.tenantId = tenantId;
            const count = await this.prisma.voter.count({ where });
            results.push({
                date: start.toISOString().split('T')[0],
                count,
            });
        }
        return results;
    }
    buildDateFilter(filter) {
        if (!filter.dateFrom && !filter.dateTo)
            return {};
        return {
            createdAt: {
                ...(filter.dateFrom && { gte: new Date(filter.dateFrom) }),
                ...(filter.dateTo && { lte: new Date(filter.dateTo + 'T23:59:59.999Z') }),
            },
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map