import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { QueryRegionDto } from './dto/query-region.dto';
import { AuditAction, Prisma, Role } from '@prisma/client';

const REGION_SELECT = {
  id: true,
  tenantId: true,
  stateId: true,
  coordinatorId: true,
  name: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  state: { select: { id: true, name: true, abbreviation: true } },
  coordinator: { select: { id: true, name: true, email: true, role: true } },
  municipalities: {
    include: {
      municipality: { select: { id: true, name: true, ibgeCode: true } },
    },
  },
  _count: { select: { voters: true, municipalities: true } },
} as const;

@Injectable()
export class RegionsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Create ───────────────────────────────────────────────────────────

  async create(
    dto: CreateRegionDto,
    actor: { id: string; role: Role; tenantId: string | null },
  ) {
    const tenantId = actor.tenantId;
    if (!tenantId) throw new ForbiddenException('ROOT não pode criar regiões sem tenant');

    // Verifica nome único por tenant
    const existing = await this.prisma.region.findFirst({
      where: { tenantId, name: { equals: dto.name, mode: 'insensitive' } },
    });
    if (existing) throw new ConflictException(`Região '${dto.name}' já existe neste tenant`);

    // Valida estado
    const state = await this.prisma.state.findUnique({ where: { id: dto.stateId } });
    if (!state) throw new NotFoundException('Estado não encontrado');

    // Valida coordenador
    if (dto.coordinatorId) {
      await this.validateCoordinator(dto.coordinatorId, tenantId);
    }

    // Valida municípios
    if (dto.municipalityIds?.length) {
      await this.validateMunicipalities(dto.municipalityIds, dto.stateId);
    }

    // Cria região com municípios em transação
    const region = await this.prisma.$transaction(async (tx) => {
      const created = await tx.region.create({
        data: {
          tenantId,
          stateId: dto.stateId,
          coordinatorId: dto.coordinatorId,
          name: dto.name,
          description: dto.description,
        },
      });

      if (dto.municipalityIds?.length) {
        await tx.regionMunicipality.createMany({
          data: dto.municipalityIds.map((municipalityId) => ({
            regionId: created.id,
            municipalityId,
          })),
          skipDuplicates: true,
        });
      }

      return tx.region.findUnique({ where: { id: created.id }, select: REGION_SELECT });
    });

    await this.auditLog(actor.id, tenantId, AuditAction.CREATE, 'Region', region!.id, null, region);
    return region;
  }

  // ── Find All ─────────────────────────────────────────────────────────

  async findAll(
    query: QueryRegionDto,
    actor: { role: Role; tenantId: string | null },
  ) {
    const { search, stateId, coordinatorId, isActive, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    // Isolamento de tenant
    const tenantId = actor.role === Role.ROOT ? undefined : (actor.tenantId ?? undefined);

    const where: Prisma.RegionWhereInput = {
      ...(tenantId !== undefined ? { tenantId } : {}),
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
      ...(stateId && { stateId }),
      ...(coordinatorId && { coordinatorId }),
      ...(isActive !== undefined && { isActive }),
    };

    const [items, total] = await Promise.all([
      this.prisma.region.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        select: REGION_SELECT,
      }),
      this.prisma.region.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Find One ─────────────────────────────────────────────────────────

  async findOne(id: string, actor: { role: Role; tenantId: string | null }) {
    const region = await this.prisma.region.findUnique({
      where: { id },
      select: REGION_SELECT,
    });

    if (!region) throw new NotFoundException('Região não encontrada');

    if (actor.role !== Role.ROOT && region.tenantId !== actor.tenantId) {
      throw new ForbiddenException('Acesso negado');
    }

    return region;
  }

  // ── Update ───────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateRegionDto,
    actor: { id: string; role: Role; tenantId: string | null },
  ) {
    const existing = await this.findOne(id, actor);

    // Verifica nome único (excluindo a própria região)
    if (dto.name && dto.name !== existing.name) {
      const nameConflict = await this.prisma.region.findFirst({
        where: {
          tenantId: existing.tenantId,
          name: { equals: dto.name, mode: 'insensitive' },
          id: { not: id },
        },
      });
      if (nameConflict) throw new ConflictException(`Região '${dto.name}' já existe neste tenant`);
    }

    if (dto.stateId && dto.stateId !== existing.stateId) {
      const state = await this.prisma.state.findUnique({ where: { id: dto.stateId } });
      if (!state) throw new NotFoundException('Estado não encontrado');
    }

    if (dto.coordinatorId) {
      await this.validateCoordinator(dto.coordinatorId, existing.tenantId);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // Atualiza dados básicos da região
      await tx.region.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
          stateId: dto.stateId,
          coordinatorId: dto.coordinatorId,
          isActive: dto.isActive,
        },
      });

      // Se municipalityIds foi enviado, reseta os vínculos
      if (dto.municipalityIds !== undefined) {
        if (dto.municipalityIds.length > 0) {
          const targetStateId = dto.stateId ?? existing.stateId;
          await this.validateMunicipalities(dto.municipalityIds, targetStateId);
        }

        await tx.regionMunicipality.deleteMany({ where: { regionId: id } });

        if (dto.municipalityIds.length > 0) {
          await tx.regionMunicipality.createMany({
            data: dto.municipalityIds.map((municipalityId) => ({
              regionId: id,
              municipalityId,
            })),
            skipDuplicates: true,
          });
        }
      }

      return tx.region.findUnique({ where: { id }, select: REGION_SELECT });
    });

    await this.auditLog(actor.id, actor.tenantId, AuditAction.UPDATE, 'Region', id, existing, updated);
    return updated;
  }

  // ── Add/Remove Municipalities ─────────────────────────────────────────

  async addMunicipalities(
    id: string,
    municipalityIds: string[],
    actor: { id: string; role: Role; tenantId: string | null },
  ) {
    const region = await this.findOne(id, actor);

    await this.validateMunicipalities(municipalityIds, region.stateId);

    await this.prisma.regionMunicipality.createMany({
      data: municipalityIds.map((municipalityId) => ({ regionId: id, municipalityId })),
      skipDuplicates: true,
    });

    return this.findOne(id, actor);
  }

  async removeMunicipalities(
    id: string,
    municipalityIds: string[],
    actor: { id: string; role: Role; tenantId: string | null },
  ) {
    await this.findOne(id, actor);

    await this.prisma.regionMunicipality.deleteMany({
      where: { regionId: id, municipalityId: { in: municipalityIds } },
    });

    return this.findOne(id, actor);
  }

  // ── Assign Coordinator ────────────────────────────────────────────────

  async assignCoordinator(
    id: string,
    coordinatorId: string | null,
    actor: { id: string; role: Role; tenantId: string | null },
  ) {
    const region = await this.findOne(id, actor);

    if (coordinatorId) {
      await this.validateCoordinator(coordinatorId, region.tenantId);
    }

    const updated = await this.prisma.region.update({
      where: { id },
      data: { coordinatorId },
      select: REGION_SELECT,
    });

    await this.auditLog(actor.id, actor.tenantId, AuditAction.UPDATE, 'Region', id, region, updated);
    return updated;
  }

  // ── Remove ───────────────────────────────────────────────────────────

  async remove(
    id: string,
    actor: { id: string; role: Role; tenantId: string | null },
  ) {
    const region = await this.findOne(id, actor);

    const votersCount = await this.prisma.voter.count({ where: { regionId: id } });
    if (votersCount > 0) {
      throw new ForbiddenException(
        `Não é possível excluir: região possui ${votersCount} eleitores. Desative a região em vez de excluir.`,
      );
    }

    await this.prisma.region.delete({ where: { id } });
    await this.auditLog(actor.id, actor.tenantId, AuditAction.DELETE, 'Region', id, region, null);
    return { message: 'Região excluída com sucesso' };
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  private async validateCoordinator(coordinatorId: string, tenantId: string) {
    const coordinator = await this.prisma.user.findUnique({
      where: { id: coordinatorId },
    });

    if (!coordinator) throw new NotFoundException('Coordenador não encontrado');
    if (coordinator.role !== Role.COORDENADOR) {
      throw new BadRequestException(
        `Usuário '${coordinator.name}' não possui perfil COORDENADOR`,
      );
    }
    if (coordinator.tenantId !== tenantId) {
      throw new ForbiddenException('Coordenador pertence a outro tenant');
    }
    if (!coordinator.isActive) {
      throw new BadRequestException('Coordenador está inativo');
    }
  }

  private async validateMunicipalities(municipalityIds: string[], stateId: string) {
    const municipalities = await this.prisma.municipality.findMany({
      where: { id: { in: municipalityIds } },
      select: { id: true, stateId: true, name: true },
    });

    if (municipalities.length !== municipalityIds.length) {
      const foundIds = municipalities.map((m) => m.id);
      const notFound = municipalityIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(`Municípios não encontrados: ${notFound.join(', ')}`);
    }

    const wrongState = municipalities.filter((m) => m.stateId !== stateId);
    if (wrongState.length > 0) {
      throw new BadRequestException(
        `Os seguintes municípios não pertencem ao estado selecionado: ${wrongState.map((m) => m.name).join(', ')}`,
      );
    }
  }

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
