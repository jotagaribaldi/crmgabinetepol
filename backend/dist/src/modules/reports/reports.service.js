"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const Papa = __importStar(require("papaparse"));
const XLSX = __importStar(require("xlsx"));
const prisma_service_1 = require("../../database/prisma.service");
const generate_report_dto_1 = require("./dto/generate-report.dto");
const client_1 = require("@prisma/client");
let ReportsService = class ReportsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generate(dto, actor) {
        const tenantId = actor.tenantId;
        if (!tenantId && actor.role !== client_1.Role.ROOT) {
            throw new common_1.ForbiddenException('Tenant obrigatório');
        }
        const dateFilter = dto.dateFrom || dto.dateTo
            ? {
                createdAt: {
                    ...(dto.dateFrom && { gte: new Date(dto.dateFrom) }),
                    ...(dto.dateTo && { lte: new Date(dto.dateTo + 'T23:59:59.999Z') }),
                },
            }
            : {};
        let rows = [];
        let reportTitle = '';
        switch (dto.type) {
            case generate_report_dto_1.ReportType.VOTERS:
                rows = await this.buildVotersReport(tenantId, dto, dateFilter);
                reportTitle = 'eleitores';
                break;
            case generate_report_dto_1.ReportType.VOTERS_BY_REGION:
                rows = await this.buildVotersByRegionReport(tenantId, dateFilter);
                reportTitle = 'eleitores_por_regiao';
                break;
            case generate_report_dto_1.ReportType.VOTERS_BY_SEGMENT:
                rows = await this.buildVotersBySegmentReport(tenantId, dateFilter);
                reportTitle = 'eleitores_por_segmento';
                break;
            case generate_report_dto_1.ReportType.VOTERS_BY_MUNICIPALITY:
                rows = await this.buildVotersByMunicipalityReport(tenantId, dateFilter);
                reportTitle = 'eleitores_por_municipio';
                break;
            case generate_report_dto_1.ReportType.LEADERS_PERFORMANCE:
                rows = await this.buildLeadersPerformanceReport(tenantId, dateFilter);
                reportTitle = 'desempenho_lideres';
                break;
            case generate_report_dto_1.ReportType.AUDIT_SUMMARY:
                rows = await this.buildAuditSummaryReport(tenantId, dto, actor.role);
                reportTitle = 'auditoria';
                break;
            default:
                throw new common_1.BadRequestException('Tipo de relatório inválido');
        }
        const date = new Date().toISOString().split('T')[0];
        const filename = `${reportTitle}_${date}.${dto.format}`;
        if (dto.format === generate_report_dto_1.ReportFormat.CSV) {
            const csv = Papa.unparse(rows);
            return {
                filename,
                contentType: 'text/csv; charset=utf-8',
                buffer: Buffer.from('\uFEFF' + csv, 'utf-8'),
            };
        }
        else {
            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, reportTitle.substring(0, 31));
            const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
            return {
                filename,
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                buffer,
            };
        }
    }
    async buildVotersReport(tenantId, dto, dateFilter) {
        const where = {
            ...(tenantId ? { tenantId } : {}),
            ...dateFilter,
            ...(dto.regionId && { regionId: dto.regionId }),
            ...(dto.segmentId && { segmentId: dto.segmentId }),
            ...(dto.municipalityId && { municipalityId: dto.municipalityId }),
        };
        const voters = await this.prisma.voter.findMany({
            where,
            orderBy: { name: 'asc' },
            take: 50000,
            include: {
                municipality: { select: { name: true } },
                region: { select: { name: true } },
                segment: { select: { name: true } },
                coordinator: { select: { name: true } },
                regionalLeader: { select: { name: true } },
                localLeader: { select: { name: true } },
                createdBy: { select: { name: true } },
            },
        });
        return voters.map((v) => ({
            ID: v.id,
            Nome: v.name,
            CPF: v.cpf || '',
            Telefone: v.phone || '',
            WhatsApp: v.whatsapp || '',
            Email: v.email || '',
            Sexo: v.sex || '',
            Nascimento: v.birthDate ? new Date(v.birthDate).toLocaleDateString('pt-BR') : '',
            Endereço: [v.address, v.number, v.complement].filter(Boolean).join(', '),
            Bairro: v.neighborhood || '',
            CEP: v.zipCode || '',
            Município: v.municipality?.name || '',
            Região: v.region?.name || '',
            Segmento: v.segment?.name || '',
            'Status de Apoio': v.supportStatus,
            Coordenador: v.coordinator?.name || '',
            'Líder Regional': v.regionalLeader?.name || '',
            'Líder Local': v.localLeader?.name || '',
            'Cadastrado Por': v.createdBy?.name || '',
            'Data de Cadastro': new Date(v.createdAt).toLocaleDateString('pt-BR'),
            Observações: v.observations || '',
            Status: v.isActive ? 'Ativo' : 'Inativo',
        }));
    }
    async buildVotersByRegionReport(tenantId, dateFilter) {
        const where = {
            ...(tenantId ? { tenantId } : {}),
            ...dateFilter,
        };
        const regions = await this.prisma.region.findMany({
            where: tenantId ? { tenantId } : {},
            include: {
                state: { select: { name: true, abbreviation: true } },
                coordinator: { select: { name: true } },
                _count: { select: { voters: true, municipalities: true } },
                voters: {
                    where: dateFilter,
                    select: { supportStatus: true, isActive: true },
                },
            },
            orderBy: { name: 'asc' },
        });
        return regions.map((r) => {
            const voterCounts = r.voters.reduce((acc, v) => {
                acc[v.supportStatus] = (acc[v.supportStatus] || 0) + 1;
                return acc;
            }, {});
            return {
                Região: r.name,
                Estado: `${r.state?.name} (${r.state?.abbreviation})`,
                Coordenador: r.coordinator?.name || 'Não atribuído',
                Municípios: r._count.municipalities,
                'Total Eleitores': r._count.voters,
                Confirmados: voterCounts['CONFIRMADO'] || 0,
                Prováveis: voterCounts['PROVAVEL'] || 0,
                Indefinidos: voterCounts['INDEFINIDO'] || 0,
                Contrários: voterCounts['CONTRARIO'] || 0,
                'Status': r.isActive ? 'Ativa' : 'Inativa',
            };
        });
    }
    async buildVotersBySegmentReport(tenantId, dateFilter) {
        const segments = await this.prisma.segment.findMany({
            where: tenantId ? { tenantId } : {},
            include: {
                _count: { select: { voters: true } },
                voters: {
                    where: dateFilter,
                    select: { supportStatus: true },
                },
            },
            orderBy: { name: 'asc' },
        });
        return segments.map((s) => {
            const voterCounts = s.voters.reduce((acc, v) => {
                acc[v.supportStatus] = (acc[v.supportStatus] || 0) + 1;
                return acc;
            }, {});
            return {
                Segmento: s.name,
                'Total Eleitores': s._count.voters,
                Confirmados: voterCounts['CONFIRMADO'] || 0,
                Prováveis: voterCounts['PROVAVEL'] || 0,
                Indefinidos: voterCounts['INDEFINIDO'] || 0,
                Contrários: voterCounts['CONTRARIO'] || 0,
                Status: s.isActive ? 'Ativo' : 'Inativo',
            };
        });
    }
    async buildVotersByMunicipalityReport(tenantId, dateFilter) {
        const grouped = await this.prisma.voter.groupBy({
            by: ['municipalityId', 'supportStatus'],
            where: {
                ...(tenantId ? { tenantId } : {}),
                municipalityId: { not: null },
                ...dateFilter,
            },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
        });
        const munIds = [...new Set(grouped.map((g) => g.municipalityId).filter(Boolean))];
        const municipalities = await this.prisma.municipality.findMany({
            where: { id: { in: munIds } },
            include: { state: { select: { abbreviation: true } } },
        });
        const munMap = new Map(municipalities.map((m) => [m.id, m]));
        const byMun = new Map();
        for (const row of grouped) {
            if (!row.municipalityId)
                continue;
            const mun = munMap.get(row.municipalityId);
            if (!mun)
                continue;
            if (!byMun.has(row.municipalityId)) {
                byMun.set(row.municipalityId, {
                    Município: mun.name,
                    Estado: mun.state.abbreviation,
                    CONFIRMADO: 0, PROVAVEL: 0, INDEFINIDO: 0, CONTRARIO: 0, Total: 0,
                });
            }
            const entry = byMun.get(row.municipalityId);
            entry[row.supportStatus] = (entry[row.supportStatus] || 0) + row._count.id;
            entry.Total += row._count.id;
        }
        return [...byMun.values()].sort((a, b) => b.Total - a.Total).map((m) => ({
            Município: m.Município,
            Estado: m.Estado,
            'Total Eleitores': m.Total,
            Confirmados: m.CONFIRMADO,
            Prováveis: m.PROVAVEL,
            Indefinidos: m.INDEFINIDO,
            Contrários: m.CONTRARIO,
        }));
    }
    async buildLeadersPerformanceReport(tenantId, dateFilter) {
        const where = {
            ...(tenantId ? { tenantId } : {}),
            localLeaderId: { not: null },
            ...dateFilter,
        };
        const grouped = await this.prisma.voter.groupBy({
            by: ['localLeaderId', 'supportStatus'],
            where,
            _count: { id: true },
        });
        const leaderIds = [...new Set(grouped.map((g) => g.localLeaderId).filter(Boolean))];
        const leaders = await this.prisma.user.findMany({
            where: { id: { in: leaderIds } },
            select: { id: true, name: true, email: true },
        });
        const leaderMap = new Map(leaders.map((l) => [l.id, l]));
        const byLeader = new Map();
        for (const row of grouped) {
            if (!row.localLeaderId)
                continue;
            const leader = leaderMap.get(row.localLeaderId);
            if (!leader)
                continue;
            if (!byLeader.has(row.localLeaderId)) {
                byLeader.set(row.localLeaderId, {
                    'Líder': leader.name,
                    'E-mail': leader.email,
                    CONFIRMADO: 0, PROVAVEL: 0, INDEFINIDO: 0, CONTRARIO: 0, Total: 0,
                });
            }
            const entry = byLeader.get(row.localLeaderId);
            entry[row.supportStatus] += row._count.id;
            entry.Total += row._count.id;
        }
        return [...byLeader.values()].sort((a, b) => b.Total - a.Total).map((l) => ({
            'Líder Local': l['Líder'],
            'E-mail': l['E-mail'],
            'Total Eleitores': l.Total,
            Confirmados: l.CONFIRMADO,
            Prováveis: l.PROVAVEL,
            Indefinidos: l.INDEFINIDO,
            Contrários: l.CONTRARIO,
            'Taxa de Confirmação (%)': l.Total > 0 ? ((l.CONFIRMADO / l.Total) * 100).toFixed(1) : '0.0',
        }));
    }
    async buildAuditSummaryReport(tenantId, dto, role) {
        const dateFilter = dto.dateFrom || dto.dateTo
            ? {
                createdAt: {
                    ...(dto.dateFrom && { gte: new Date(dto.dateFrom) }),
                    ...(dto.dateTo && { lte: new Date(dto.dateTo + 'T23:59:59.999Z') }),
                },
            }
            : {};
        const logs = await this.prisma.auditLog.findMany({
            where: {
                ...(tenantId ? { tenantId } : {}),
                ...dateFilter,
            },
            orderBy: { createdAt: 'desc' },
            take: 10000,
            include: {
                user: { select: { name: true, role: true } },
                tenant: { select: { name: true } },
            },
        });
        return logs.map((l) => ({
            'Data/Hora': new Date(l.createdAt).toLocaleString('pt-BR'),
            Ação: l.action,
            Entidade: l.entity,
            'ID da Entidade': l.entityId || '',
            Usuário: l.user?.name || 'Sistema',
            'Perfil': l.user?.role || '',
            Tenant: l.tenant?.name || (role === client_1.Role.ROOT ? 'Global' : ''),
            'IP': l.ipAddress || '',
        }));
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map