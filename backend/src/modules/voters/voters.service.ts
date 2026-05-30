import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CreateVoterDto } from './dto/create-voter.dto';
import { UpdateVoterDto } from './dto/update-voter.dto';
import { QueryVoterDto } from './dto/query-voter.dto';
import { AuditAction, Prisma, Role } from '@prisma/client';

// Campos de relacionamento retornados nas consultas
const VOTER_INCLUDE = {
  municipality: { select: { id: true, name: true } },
  region: { select: { id: true, name: true } },
  segment: { select: { id: true, name: true } },
  coordinator: { select: { id: true, name: true } },
  regionalLeader: { select: { id: true, name: true } },
  localLeader: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
} as const;

// Campos permitidos para ordenação
const ALLOWED_SORT_FIELDS = ['name', 'createdAt', 'updatedAt', 'supportStatus', 'birthDate'];

@Injectable()
export class VotersService {
  private readonly logger = new Logger(VotersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ── Helpers de normalização ─────────────────────────────────────────

  private normalizeCpf(cpf: string): string {
    return cpf.replace(/\D/g, '');
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  // ── Verificação de duplicidade ────────────────────────────────────────

  private async checkDuplicates(
    tenantId: string,
    dto: { cpf?: string; phone?: string; whatsapp?: string },
    excludeId?: string,
  ) {
    const conditions: Prisma.VoterWhereInput[] = [];

    if (dto.cpf) {
      const normalizedCpf = this.normalizeCpf(dto.cpf);
      conditions.push({ tenantId, cpf: normalizedCpf });
    }
    if (dto.phone) {
      const normalizedPhone = this.normalizePhone(dto.phone);
      conditions.push({ tenantId, phone: normalizedPhone });
    }
    if (dto.whatsapp) {
      const normalizedWa = this.normalizePhone(dto.whatsapp);
      conditions.push({ tenantId, whatsapp: normalizedWa });
    }

    if (conditions.length === 0) return;

    const existing = await this.prisma.voter.findFirst({
      where: {
        OR: conditions,
        ...(excludeId && { id: { not: excludeId } }),
      },
      select: { id: true, name: true, cpf: true, phone: true, whatsapp: true },
    });

    if (existing) {
      const fields: string[] = [];
      if (existing.cpf && dto.cpf && this.normalizeCpf(dto.cpf) === existing.cpf) fields.push('CPF');
      if (existing.phone && dto.phone && this.normalizePhone(dto.phone) === existing.phone) fields.push('telefone');
      if (existing.whatsapp && dto.whatsapp && this.normalizePhone(dto.whatsapp) === existing.whatsapp) fields.push('WhatsApp');
      throw new ConflictException(
        `Eleitor duplicado: ${fields.join(', ')} já cadastrado para "${existing.name}"`,
      );
    }
  }

  // ── Create ───────────────────────────────────────────────────────────

  async create(
    dto: CreateVoterDto,
    actor: { id: string; role: Role; tenantId: string | null },
  ) {
    const tenantId = actor.tenantId;
    if (!tenantId) throw new ForbiddenException('ROOT não pode cadastrar eleitores sem tenant');

    await this.checkDuplicates(tenantId, dto);

    // Normaliza campos
    const data: Prisma.VoterCreateInput = {
      tenant: { connect: { id: tenantId } },
      name: dto.name,
      phone: dto.phone ? this.normalizePhone(dto.phone) : undefined,
      whatsapp: dto.whatsapp ? this.normalizePhone(dto.whatsapp) : undefined,
      email: dto.email?.toLowerCase(),
      cpf: dto.cpf ? this.normalizeCpf(dto.cpf) : undefined,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      sex: dto.sex,
      address: dto.address,
      number: dto.number,
      complement: dto.complement,
      neighborhood: dto.neighborhood,
      zipCode: dto.zipCode,
      supportStatus: dto.supportStatus,
      observations: dto.observations,
      createdBy: { connect: { id: actor.id } },
      ...(dto.municipalityId && { municipality: { connect: { id: dto.municipalityId } } }),
      ...(dto.regionId && { region: { connect: { id: dto.regionId } } }),
      ...(dto.segmentId && { segment: { connect: { id: dto.segmentId } } }),
      ...(dto.coordinatorId && { coordinator: { connect: { id: dto.coordinatorId } } }),
      ...(dto.regionalLeaderId && { regionalLeader: { connect: { id: dto.regionalLeaderId } } }),
      ...(dto.localLeaderId && { localLeader: { connect: { id: dto.localLeaderId } } }),
    };

    const voter = await this.prisma.voter.create({ data, include: VOTER_INCLUDE });

    // Invalida cache de contagem do tenant
    await this.redis.del(`voter:count:${tenantId}`);

    await this.auditLog(actor.id, tenantId, AuditAction.CREATE, 'Voter', voter.id, null, voter);
    return voter;
  }

  // ── Find All (busca avançada server-side) ─────────────────────────────

  async findAll(
    query: QueryVoterDto,
    actor: { role: Role; tenantId: string | null },
  ) {
    const {
      name, phone, cpf, municipalityId, regionId, segmentId,
      coordinatorId, regionalLeaderId, localLeaderId,
      sex, supportStatus, createdFrom, createdTo, isActive,
      sortBy = 'createdAt', sortOrder = 'desc',
      page = 1, limit = 25,
    } = query;

    const tenantId = actor.tenantId ?? undefined;
    const skip = (page - 1) * limit;

    // Valida campo de ordenação
    const orderField = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';

    const where: Prisma.VoterWhereInput = {
      ...(tenantId !== undefined ? { tenantId } : {}),
      ...(name && { name: { contains: name, mode: 'insensitive' } }),
      ...(phone && { phone: { contains: this.normalizePhone(phone) } }),
      ...(cpf && { cpf: { contains: this.normalizeCpf(cpf) } }),
      ...(municipalityId && { municipalityId }),
      ...(regionId && { regionId }),
      ...(segmentId && { segmentId }),
      ...(coordinatorId && { coordinatorId }),
      ...(regionalLeaderId && { regionalLeaderId }),
      ...(localLeaderId && { localLeaderId }),
      ...(sex && { sex }),
      ...(supportStatus && { supportStatus }),
      ...(isActive !== undefined && { isActive }),
      ...(createdFrom || createdTo
        ? {
            createdAt: {
              ...(createdFrom && { gte: new Date(createdFrom) }),
              ...(createdTo && { lte: new Date(createdTo + 'T23:59:59.999Z') }),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.voter.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderField]: sortOrder },
        include: VOTER_INCLUDE,
      }),
      this.prisma.voter.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Find One ─────────────────────────────────────────────────────────

  async findOne(id: string, actor: { role: Role; tenantId: string | null }) {
    const voter = await this.prisma.voter.findUnique({
      where: { id },
      include: VOTER_INCLUDE,
    });
    if (!voter) throw new NotFoundException('Eleitor não encontrado');
    if (actor.role !== Role.ROOT && voter.tenantId !== actor.tenantId) {
      throw new ForbiddenException('Acesso negado');
    }
    return voter;
  }

  // ── Update ───────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateVoterDto,
    actor: { id: string; role: Role; tenantId: string | null },
  ) {
    const existing = await this.findOne(id, actor);

    await this.checkDuplicates(existing.tenantId, dto, id);

    // Monta os dados de atualização
    const updateData: any = {
      name: dto.name,
      email: dto.email?.toLowerCase(),
      cpf: dto.cpf ? this.normalizeCpf(dto.cpf) : undefined,
      phone: dto.phone ? this.normalizePhone(dto.phone) : undefined,
      whatsapp: dto.whatsapp ? this.normalizePhone(dto.whatsapp) : undefined,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      sex: dto.sex,
      address: dto.address,
      number: dto.number,
      complement: dto.complement,
      neighborhood: dto.neighborhood,
      zipCode: dto.zipCode,
      supportStatus: dto.supportStatus,
      observations: dto.observations,
      isActive: dto.isActive,
    };

    // Relacionamentos opcionais
    if (dto.municipalityId !== undefined)
      updateData.municipality = dto.municipalityId ? { connect: { id: dto.municipalityId } } : { disconnect: true };
    if (dto.regionId !== undefined)
      updateData.region = dto.regionId ? { connect: { id: dto.regionId } } : { disconnect: true };
    if (dto.segmentId !== undefined)
      updateData.segment = dto.segmentId ? { connect: { id: dto.segmentId } } : { disconnect: true };
    if (dto.coordinatorId !== undefined)
      updateData.coordinator = dto.coordinatorId ? { connect: { id: dto.coordinatorId } } : { disconnect: true };
    if (dto.regionalLeaderId !== undefined)
      updateData.regionalLeader = dto.regionalLeaderId ? { connect: { id: dto.regionalLeaderId } } : { disconnect: true };
    if (dto.localLeaderId !== undefined)
      updateData.localLeader = dto.localLeaderId ? { connect: { id: dto.localLeaderId } } : { disconnect: true };

    // Remove campos undefined para não sobrescrever com null
    Object.keys(updateData).forEach((k) => updateData[k] === undefined && delete updateData[k]);

    const updated = await this.prisma.voter.update({
      where: { id },
      data: updateData,
      include: VOTER_INCLUDE,
    });

    await this.auditLog(actor.id, actor.tenantId, AuditAction.UPDATE, 'Voter', id, existing, updated);
    return updated;
  }

  // ── Remove ───────────────────────────────────────────────────────────

  async remove(id: string, actor: { id: string; role: Role; tenantId: string | null }) {
    const voter = await this.findOne(id, actor);
    await this.prisma.voter.delete({ where: { id } });
    await this.redis.del(`voter:count:${voter.tenantId}`);
    await this.auditLog(actor.id, actor.tenantId, AuditAction.DELETE, 'Voter', id, voter, null);
    return { message: 'Eleitor excluído com sucesso' };
  }

  // ── CSV Import ────────────────────────────────────────────────────────

  async importCsv(
    rows: Record<string, string>[],
    actor: { id: string; role: Role; tenantId: string | null },
  ): Promise<{ success: number; errors: Array<{ row: number; data: any; error: string }> }> {
    const tenantId = actor.tenantId;
    if (!tenantId) throw new ForbiddenException('ROOT não pode importar eleitores sem tenant');

    const results = { success: 0, errors: [] as any[] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 porque linha 1 é o cabeçalho

      try {
        if (!row.nome && !row.name) {
          throw new Error('Nome é obrigatório');
        }

        const dto: CreateVoterDto = {
          name: row.nome || row.name,
          phone: row.telefone || row.phone || undefined,
          whatsapp: row.whatsapp || undefined,
          email: row.email || undefined,
          cpf: row.cpf || undefined,
          birthDate: row.data_nascimento || row.birthDate || undefined,
          address: row.endereco || row.address || undefined,
          neighborhood: row.bairro || row.neighborhood || undefined,
          zipCode: row.cep || row.zipCode || undefined,
          observations: row.observacoes || row.observations || undefined,
        };

        // Valida data de nascimento
        if (dto.birthDate && isNaN(new Date(dto.birthDate).getTime())) {
          throw new Error('Data de nascimento inválida');
        }

        // Verifica duplicidade
        await this.checkDuplicates(tenantId, dto);

        const normalizedData: Prisma.VoterCreateInput = {
          tenant: { connect: { id: tenantId } },
          name: dto.name,
          phone: dto.phone ? this.normalizePhone(dto.phone) : undefined,
          whatsapp: dto.whatsapp ? this.normalizePhone(dto.whatsapp) : undefined,
          email: dto.email?.toLowerCase(),
          cpf: dto.cpf ? this.normalizeCpf(dto.cpf) : undefined,
          birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
          address: dto.address,
          neighborhood: dto.neighborhood,
          zipCode: dto.zipCode,
          observations: dto.observations,
          createdBy: { connect: { id: actor.id } },
        };

        await this.prisma.voter.create({ data: normalizedData });
        results.success++;
      } catch (err: any) {
        results.errors.push({ row: rowNum, data: row, error: err.message || 'Erro desconhecido' });
      }
    }

    await this.redis.del(`voter:count:${tenantId}`);
    await this.auditLog(actor.id, tenantId, AuditAction.IMPORT, 'Voter', tenantId, null, {
      total: rows.length,
      success: results.success,
      errors: results.errors.length,
    });

    return results;
  }

  // ── Export Data ───────────────────────────────────────────────────────

  async exportData(
    query: QueryVoterDto,
    actor: { id: string; role: Role; tenantId: string | null },
  ) {
    // Usa findAll sem limite para export (máx 50k)
    const exportQuery = { ...query, page: 1, limit: 50000 };
    const result = await this.findAll(exportQuery, actor);

    await this.auditLog(actor.id, actor.tenantId, AuditAction.EXPORT, 'Voter', actor.tenantId ?? 'root', null, {
      exported: result.meta.total,
    });

    return result.items;
  }

  // ── Stats por tenant ─────────────────────────────────────────────────

  async getStats(actor: { role: Role; tenantId: string | null }) {
    const tenantId = actor.tenantId;
    if (!tenantId) throw new ForbiddenException('Use o dashboard ROOT para estatísticas globais');

    const [
      total,
      bySegment,
      byMunicipality,
      byRegion,
      bySupportStatus,
      bySex,
      recentGrowth,
    ] = await Promise.all([
      this.prisma.voter.count({ where: { tenantId } }),
      this.prisma.voter.groupBy({
        by: ['segmentId'],
        where: { tenantId, segmentId: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      this.prisma.voter.groupBy({
        by: ['municipalityId'],
        where: { tenantId, municipalityId: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      this.prisma.voter.groupBy({
        by: ['regionId'],
        where: { tenantId, regionId: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      this.prisma.voter.groupBy({
        by: ['supportStatus'],
        where: { tenantId },
        _count: { id: true },
      }),
      this.prisma.voter.groupBy({
        by: ['sex'],
        where: { tenantId, sex: { not: null } },
        _count: { id: true },
      }),
      // Crescimento últimos 30 dias
      this.prisma.voter.count({
        where: {
          tenantId,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    // Resolução de nomes de segmentos
    const segmentIds = bySegment.map((s) => s.segmentId!).filter(Boolean);
    const segments = await this.prisma.segment.findMany({
      where: { id: { in: segmentIds } },
      select: { id: true, name: true },
    });
    const segmentMap = new Map(segments.map((s) => [s.id, s.name]));

    // Resolução de nomes de municípios
    const munIds = byMunicipality.map((m) => m.municipalityId!).filter(Boolean);
    const municipalities = await this.prisma.municipality.findMany({
      where: { id: { in: munIds } },
      select: { id: true, name: true },
    });
    const munMap = new Map(municipalities.map((m) => [m.id, m.name]));

    return {
      total,
      recentGrowth,
      bySupportStatus: bySupportStatus.map((s) => ({ status: s.supportStatus, count: s._count.id })),
      bySex: bySex.map((s) => ({ sex: s.sex, count: s._count.id })),
      bySegment: bySegment.map((s) => ({
        segmentId: s.segmentId,
        segmentName: segmentMap.get(s.segmentId!) ?? 'Sem segmento',
        count: s._count.id,
      })),
      byMunicipality: byMunicipality.map((m) => ({
        municipalityId: m.municipalityId,
        municipalityName: munMap.get(m.municipalityId!) ?? 'Sem município',
        count: m._count.id,
      })),
      byRegion: byRegion.map((r) => ({ regionId: r.regionId, count: r._count.id })),
    };
  }

  // ── Audit helper ─────────────────────────────────────────────────────

  private async auditLog(userId: string, tenantId: string | null, action: AuditAction, entity: string, entityId: string, oldValue: any, newValue: any) {
    try {
      await this.prisma.auditLog.create({ data: { userId, tenantId, action, entity, entityId, oldValue, newValue } });
    } catch (err) {
      this.logger.warn(`Auditoria falhou: ${err.message}`);
    }
  }
}
