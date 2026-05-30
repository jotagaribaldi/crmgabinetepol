import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { QueryTenantDto } from './dto/query-tenant.dto';
import { AuditAction, Prisma } from '@prisma/client';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Create ───────────────────────────────────────────────────────────

  async create(dto: CreateTenantDto, actorUserId: string) {
    const existing = await this.prisma.tenant.findFirst({
      where: {
        OR: [
          { slug: dto.slug },
          ...(dto.document ? [{ document: dto.document }] : []),
        ],
      },
    });

    if (existing) {
      if (existing.slug === dto.slug) {
        throw new ConflictException(`Slug '${dto.slug}' já está em uso`);
      }
      throw new ConflictException('Documento já cadastrado para outro candidato');
    }

    const tenant = await this.prisma.tenant.create({ data: dto });

    await this.auditLog(actorUserId, null, AuditAction.CREATE, 'Tenant', tenant.id, null, tenant);

    return tenant;
  }

  // ── Find All ─────────────────────────────────────────────────────────

  async findAll(query: QueryTenantDto) {
    const { search, state, party, isActive, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TenantWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
          { party: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(state && { state }),
      ...(party && { party: { contains: party, mode: 'insensitive' } }),
      ...(isActive !== undefined && { isActive }),
    };

    const [items, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              users: true,
              voters: true,
            },
          },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ── Find One ─────────────────────────────────────────────────────────

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            voters: true,
            regions: true,
            segments: true,
          },
        },
      },
    });

    if (!tenant) throw new NotFoundException(`Candidato não encontrado`);
    return tenant;
  }

  // ── Update ───────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateTenantDto, actorUserId: string) {
    const existing = await this.findOne(id);

    // Verifica conflito de slug
    if (dto.slug && dto.slug !== existing.slug) {
      const slugConflict = await this.prisma.tenant.findFirst({
        where: { slug: dto.slug, id: { not: id } },
      });
      if (slugConflict) throw new ConflictException(`Slug '${dto.slug}' já está em uso`);
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: dto,
    });

    await this.auditLog(actorUserId, null, AuditAction.UPDATE, 'Tenant', id, existing, updated);

    return updated;
  }

  // ── Remove ───────────────────────────────────────────────────────────

  async remove(id: string, actorUserId: string) {
    const tenant = await this.findOne(id);

    // Verifica se há eleitores cadastrados
    const votersCount = await this.prisma.voter.count({ where: { tenantId: id } });
    if (votersCount > 0) {
      throw new ForbiddenException(
        `Não é possível excluir: candidato possui ${votersCount} eleitores cadastrados. Desative o tenant em vez de excluir.`,
      );
    }

    await this.prisma.tenant.delete({ where: { id } });
    await this.auditLog(actorUserId, null, AuditAction.DELETE, 'Tenant', id, tenant, null);

    return { message: 'Candidato excluído com sucesso' };
  }

  // ── Stats (para dashboard ROOT) ───────────────────────────────────────

  async getStats() {
    const [totalTenants, totalVoters, totalUsers, byState] = await Promise.all([
      this.prisma.tenant.count({ where: { isActive: true } }),
      this.prisma.voter.count(),
      this.prisma.user.count({ where: { role: { not: 'ROOT' } } }),
      this.prisma.tenant.groupBy({
        by: ['state'],
        _count: { id: true },
        where: { isActive: true, state: { not: null } },
        orderBy: { _count: { id: 'desc' } },
      }),
    ]);

    return { totalTenants, totalVoters, totalUsers, byState };
  }

  // ── Audit helper ─────────────────────────────────────────────────────

  private async auditLog(
    userId: string,
    tenantId: string | null,
    action: AuditAction,
    entity: string,
    entityId: string,
    oldValue: any,
    newValue: any,
  ) {
    await this.prisma.auditLog.create({
      data: { userId, tenantId, action, entity, entityId, oldValue, newValue },
    });
  }
}
