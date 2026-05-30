import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSegmentDto } from './dto/create-segment.dto';
import { UpdateSegmentDto } from './dto/update-segment.dto';
import { AuditAction, Prisma, Role } from '@prisma/client';

// Segmentos padrão criados automaticamente para cada novo tenant
export const DEFAULT_SEGMENTS = [
  'Juventude', 'Evangélicos', 'Universitários', 'Agricultores',
  'Pescadores', 'Comerciantes', 'Empresários', 'Servidores Públicos',
  'Mulheres', 'Idosos',
];

@Injectable()
export class SegmentsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Seed de segmentos padrão para novos tenants ────────────────────

  async seedDefaultSegments(tenantId: string, actorUserId: string) {
    const data = DEFAULT_SEGMENTS.map((name) => ({ tenantId, name }));
    await this.prisma.segment.createMany({ data, skipDuplicates: true });
    await this.auditLog(actorUserId, tenantId, AuditAction.CREATE, 'Segment', tenantId, null, { seeded: DEFAULT_SEGMENTS });
  }

  // ── Create ───────────────────────────────────────────────────────────

  async create(
    dto: CreateSegmentDto,
    actor: { id: string; role: Role; tenantId: string | null },
  ) {
    const tenantId = actor.tenantId;
    if (!tenantId) throw new ForbiddenException('ROOT não pode criar segmentos sem tenant');

    const existing = await this.prisma.segment.findFirst({
      where: { tenantId, name: { equals: dto.name, mode: 'insensitive' } },
    });
    if (existing) throw new ConflictException(`Segmento '${dto.name}' já existe neste tenant`);

    const segment = await this.prisma.segment.create({
      data: { tenantId, name: dto.name },
    });

    await this.auditLog(actor.id, tenantId, AuditAction.CREATE, 'Segment', segment.id, null, segment);
    return segment;
  }

  // ── Find All ─────────────────────────────────────────────────────────

  async findAll(
    query: { search?: string; isActive?: boolean; page?: number; limit?: number },
    actor: { role: Role; tenantId: string | null },
  ) {
    const { search, isActive, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const tenantId = actor.tenantId ?? undefined;
    const where: Prisma.SegmentWhereInput = {
      ...(tenantId !== undefined ? { tenantId } : {}),
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
      ...(isActive !== undefined && { isActive }),
    };

    const [items, total] = await Promise.all([
      this.prisma.segment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: { _count: { select: { voters: true } } },
      }),
      this.prisma.segment.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Find One ─────────────────────────────────────────────────────────

  async findOne(id: string, actor: { role: Role; tenantId: string | null }) {
    const segment = await this.prisma.segment.findUnique({
      where: { id },
      include: { _count: { select: { voters: true } } },
    });
    if (!segment) throw new NotFoundException('Segmento não encontrado');
    if (actor.role !== Role.ROOT && segment.tenantId !== actor.tenantId) {
      throw new ForbiddenException('Acesso negado');
    }
    return segment;
  }

  // ── Update ───────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateSegmentDto,
    actor: { id: string; role: Role; tenantId: string | null },
  ) {
    const existing = await this.findOne(id, actor);

    if (dto.name && dto.name !== existing.name) {
      const conflict = await this.prisma.segment.findFirst({
        where: {
          tenantId: existing.tenantId,
          name: { equals: dto.name, mode: 'insensitive' },
          id: { not: id },
        },
      });
      if (conflict) throw new ConflictException(`Segmento '${dto.name}' já existe neste tenant`);
    }

    const updated = await this.prisma.segment.update({ where: { id }, data: dto });
    await this.auditLog(actor.id, actor.tenantId, AuditAction.UPDATE, 'Segment', id, existing, updated);
    return updated;
  }

  // ── Remove ───────────────────────────────────────────────────────────

  async remove(id: string, actor: { id: string; role: Role; tenantId: string | null }) {
    const segment = await this.findOne(id, actor);

    const votersCount = await this.prisma.voter.count({ where: { segmentId: id } });
    if (votersCount > 0) {
      throw new ForbiddenException(
        `Não é possível excluir: segmento possui ${votersCount} eleitores. Desative o segmento.`,
      );
    }

    await this.prisma.segment.delete({ where: { id } });
    await this.auditLog(actor.id, actor.tenantId, AuditAction.DELETE, 'Segment', id, segment, null);
    return { message: 'Segmento excluído com sucesso' };
  }

  private async auditLog(userId: string, tenantId: string | null, action: AuditAction, entity: string, entityId: string, oldValue: any, newValue: any) {
    await this.prisma.auditLog.create({ data: { userId, tenantId, action, entity, entityId, oldValue, newValue } });
  }
}
