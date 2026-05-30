import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { QueryAuditDto } from './dto/query-audit.dto';
import { AuditAction, Prisma, Role } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: QueryAuditDto,
    actor: { role: Role; tenantId: string | null },
  ) {
    const { action, entity, entityId, userId, dateFrom, dateTo, page = 1, limit = 30 } = query;
    const skip = (page - 1) * limit;

    // Isolamento: não-ROOT só vê logs do próprio tenant
    const tenantId =
      actor.role === Role.ROOT
        ? query.tenantId ?? undefined
        : actor.tenantId ?? undefined;

    const where: Prisma.AuditLogWhereInput = {
      ...(tenantId !== undefined ? { tenantId } : {}),
      ...(action && { action }),
      ...(entity && { entity }),
      ...(entityId && { entityId }),
      ...(userId && { userId }),
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom && { gte: new Date(dateFrom) }),
              ...(dateTo && { lte: new Date(dateTo + 'T23:59:59.999Z') }),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          tenant: { select: { id: true, name: true, slug: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, actor: { role: Role; tenantId: string | null }) {
    const log = await this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        tenant: { select: { id: true, name: true } },
      },
    });

    if (!log) throw new NotFoundException('Log de auditoria não encontrado');
    if (actor.role !== Role.ROOT && log.tenantId !== actor.tenantId) {
      throw new ForbiddenException('Acesso negado');
    }

    return log;
  }

  async getSummary(actor: { role: Role; tenantId: string | null }) {
    const tenantId = actor.role === Role.ROOT ? undefined : (actor.tenantId ?? undefined);
    const where: Prisma.AuditLogWhereInput = tenantId !== undefined ? { tenantId } : {};

    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [byAction, byEntity, recentActivity, topUsers] = await Promise.all([
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      this.prisma.auditLog.groupBy({
        by: ['entity'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      this.prisma.auditLog.count({
        where: { ...where, createdAt: { gte: last30Days } },
      }),
      this.prisma.auditLog.groupBy({
        by: ['userId'],
        where: { ...where, userId: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ]);

    // Resolve nomes dos usuários mais ativos
    const userIds = topUsers.map((u) => u.userId!).filter(Boolean);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, role: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return {
      recentActivity,
      byAction: byAction.map((a) => ({ action: a.action, count: a._count.id })),
      byEntity: byEntity.map((e) => ({ entity: e.entity, count: e._count.id })),
      topUsers: topUsers.map((u) => ({
        userId: u.userId,
        user: userMap.get(u.userId!),
        actionsCount: u._count.id,
      })),
    };
  }
}
