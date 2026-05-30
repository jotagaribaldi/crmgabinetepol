import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { PrismaService } from '../../database/prisma.service';
import { GenerateReportDto, ReportFormat, ReportType } from './dto/generate-report.dto';
import { AuditAction, Role } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(
    dto: GenerateReportDto,
    actor: { id: string; role: Role; tenantId: string | null },
  ): Promise<{ filename: string; contentType: string; buffer: Buffer }> {
    const tenantId = actor.tenantId;
    if (!tenantId && actor.role !== Role.ROOT) {
      throw new ForbiddenException('Tenant obrigatório');
    }

    const dateFilter: any =
      dto.dateFrom || dto.dateTo
        ? {
            createdAt: {
              ...(dto.dateFrom && { gte: new Date(dto.dateFrom) }),
              ...(dto.dateTo && { lte: new Date(dto.dateTo + 'T23:59:59.999Z') }),
            },
          }
        : {};

    let rows: Record<string, any>[] = [];
    let reportTitle = '';

    switch (dto.type) {
      case ReportType.VOTERS:
        rows = await this.buildVotersReport(tenantId, dto, dateFilter);
        reportTitle = 'eleitores';
        break;

      case ReportType.VOTERS_BY_REGION:
        rows = await this.buildVotersByRegionReport(tenantId, dateFilter);
        reportTitle = 'eleitores_por_regiao';
        break;

      case ReportType.VOTERS_BY_SEGMENT:
        rows = await this.buildVotersBySegmentReport(tenantId, dateFilter);
        reportTitle = 'eleitores_por_segmento';
        break;

      case ReportType.VOTERS_BY_MUNICIPALITY:
        rows = await this.buildVotersByMunicipalityReport(tenantId, dateFilter);
        reportTitle = 'eleitores_por_municipio';
        break;

      case ReportType.LEADERS_PERFORMANCE:
        rows = await this.buildLeadersPerformanceReport(tenantId, dateFilter);
        reportTitle = 'desempenho_lideres';
        break;

      case ReportType.AUDIT_SUMMARY:
        rows = await this.buildAuditSummaryReport(tenantId, dto, actor.role);
        reportTitle = 'auditoria';
        break;

      default:
        throw new BadRequestException('Tipo de relatório inválido');
    }

    const date = new Date().toISOString().split('T')[0];
    const filename = `${reportTitle}_${date}.${dto.format}`;

    if (dto.format === ReportFormat.CSV) {
      const csv = Papa.unparse(rows);
      return {
        filename,
        contentType: 'text/csv; charset=utf-8',
        buffer: Buffer.from('\uFEFF' + csv, 'utf-8'),
      };
    } else {
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

  // ── Relatórios específicos ────────────────────────────────────────────

  private async buildVotersReport(
    tenantId: string | null,
    dto: GenerateReportDto,
    dateFilter: any,
  ) {
    const where: any = {
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

  private async buildVotersByRegionReport(tenantId: string | null, dateFilter: any) {
    const where: any = {
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
      const voterCounts = r.voters.reduce((acc: any, v) => {
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

  private async buildVotersBySegmentReport(tenantId: string | null, dateFilter: any) {
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
      const voterCounts = s.voters.reduce((acc: any, v) => {
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

  private async buildVotersByMunicipalityReport(tenantId: string | null, dateFilter: any) {
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

    const munIds = [...new Set(grouped.map((g) => g.municipalityId!).filter(Boolean))];
    const municipalities = await this.prisma.municipality.findMany({
      where: { id: { in: munIds } },
      include: { state: { select: { abbreviation: true } } },
    });
    const munMap = new Map(municipalities.map((m) => [m.id, m]));

    // Agrupa por município
    const byMun = new Map<string, any>();
    for (const row of grouped) {
      if (!row.municipalityId) continue;
      const mun = munMap.get(row.municipalityId);
      if (!mun) continue;
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

  private async buildLeadersPerformanceReport(tenantId: string | null, dateFilter: any) {
    const where: any = {
      ...(tenantId ? { tenantId } : {}),
      localLeaderId: { not: null },
      ...dateFilter,
    };

    const grouped = await this.prisma.voter.groupBy({
      by: ['localLeaderId', 'supportStatus'],
      where,
      _count: { id: true },
    });

    const leaderIds = [...new Set(grouped.map((g) => g.localLeaderId!).filter(Boolean))];
    const leaders = await this.prisma.user.findMany({
      where: { id: { in: leaderIds } },
      select: { id: true, name: true, email: true },
    });
    const leaderMap = new Map(leaders.map((l) => [l.id, l]));

    const byLeader = new Map<string, any>();
    for (const row of grouped) {
      if (!row.localLeaderId) continue;
      const leader = leaderMap.get(row.localLeaderId);
      if (!leader) continue;
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

  private async buildAuditSummaryReport(
    tenantId: string | null,
    dto: GenerateReportDto,
    role: Role,
  ) {
    const dateFilter: any =
      dto.dateFrom || dto.dateTo
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
      Tenant: l.tenant?.name || (role === Role.ROOT ? 'Global' : ''),
      'IP': l.ipAddress || '',
    }));
  }
}
