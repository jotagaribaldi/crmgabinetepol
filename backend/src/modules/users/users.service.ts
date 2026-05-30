import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { AuditAction, Prisma, Role } from '@prisma/client';

// Campos que NUNCA retornam na resposta
const USER_SELECT = {
  id: true,
  tenantId: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  tenant: { select: { id: true, name: true, slug: true } },
} as const;

// Hierarquia de quem pode criar quem
const CREATION_HIERARCHY: Partial<Record<Role, Role[]>> = {
  [Role.ROOT]:       [Role.ROOT, Role.POLITICO, Role.CHEFEGAB, Role.COORDENADOR, Role.LIDERREG, Role.LIDERLOCAL],
  [Role.POLITICO]:   [Role.CHEFEGAB],
  [Role.CHEFEGAB]:   [Role.COORDENADOR],
  [Role.COORDENADOR]: [Role.LIDERREG],
  [Role.LIDERREG]:   [Role.LIDERLOCAL],
};

@Injectable()
export class UsersService {
  private readonly BCRYPT_ROUNDS = 12;

  constructor(private readonly prisma: PrismaService) {}

  // ── Create ───────────────────────────────────────────────────────────

  async create(dto: CreateUserDto, actor: { id: string; role: Role; tenantId: string | null }) {
    // Valida hierarquia de criação
    const allowedRoles = CREATION_HIERARCHY[actor.role];
    if (!allowedRoles || !allowedRoles.includes(dto.role)) {
      throw new ForbiddenException(
        `Perfil '${actor.role}' não pode criar usuários com perfil '${dto.role}'`,
      );
    }

    // ROOT pode criar em qualquer tenant; demais só no próprio
    const tenantId = actor.role === Role.ROOT ? dto.tenantId ?? null : actor.tenantId;

    // Perfis não-ROOT exigem tenant
    if (dto.role !== Role.ROOT && !tenantId) {
      throw new BadRequestException('tenantId é obrigatório para este perfil de usuário');
    }

    // Verifica se tenant existe e está ativo
    if (tenantId) {
      const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
      if (!tenant) throw new NotFoundException('Tenant não encontrado');
      if (!tenant.isActive) throw new ForbiddenException('Tenant inativo');
    }

    // Verifica duplicidade de e-mail
    const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existingEmail) throw new ConflictException('E-mail já cadastrado');

    const passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        passwordHash,
        role: dto.role,
        phone: dto.phone,
        tenantId,
      },
      select: USER_SELECT,
    });

    await this.auditLog(actor.id, actor.tenantId, AuditAction.CREATE, 'User', user.id, null, { ...user });
    return user;
  }

  // ── Find All ─────────────────────────────────────────────────────────

  async findAll(
    query: QueryUserDto,
    actor: { role: Role; tenantId: string | null },
  ) {
    const { search, role, isActive, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    // Isolamento de tenant: não-ROOT só veem usuários do próprio tenant
    const tenantId =
      actor.role === Role.ROOT
        ? query.tenantId ?? undefined
        : actor.tenantId ?? undefined;

    const where: Prisma.UserWhereInput = {
      ...(tenantId !== undefined ? { tenantId } : {}),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(role && { role }),
      ...(isActive !== undefined && { isActive }),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: USER_SELECT,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Find One ─────────────────────────────────────────────────────────

  async findOne(id: string, actor: { role: Role; tenantId: string | null }) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });

    if (!user) throw new NotFoundException('Usuário não encontrado');

    // Isolamento de tenant
    if (actor.role !== Role.ROOT && user.tenantId !== actor.tenantId) {
      throw new ForbiddenException('Acesso negado');
    }

    return user;
  }

  // ── Update ───────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateUserDto,
    actor: { id: string; role: Role; tenantId: string | null },
  ) {
    const existing = await this.findOne(id, actor);

    // Não permitir alterar próprio role ou status (exceto ROOT)
    if (actor.id === id && actor.role !== Role.ROOT) {
      if (dto.role !== undefined && dto.role !== actor.role) {
        throw new ForbiddenException('Você não pode alterar seu próprio perfil');
      }
      if (dto.isActive === false) {
        throw new ForbiddenException('Você não pode desativar sua própria conta');
      }
    }

    // Verifica conflito de e-mail
    if (dto.email && dto.email.toLowerCase() !== existing.email) {
      const emailConflict = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      });
      if (emailConflict) throw new ConflictException('E-mail já cadastrado');
    }

    const updateData: any = { ...dto };
    if (dto.email) updateData.email = dto.email.toLowerCase();
    if (dto.password) {
      updateData.passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_ROUNDS);
      delete updateData.password;
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: USER_SELECT,
    });

    await this.auditLog(actor.id, actor.tenantId, AuditAction.UPDATE, 'User', id, existing, updated);
    return updated;
  }

  // ── Remove ───────────────────────────────────────────────────────────

  async remove(id: string, actor: { id: string; role: Role; tenantId: string | null }) {
    if (actor.id === id) {
      throw new ForbiddenException('Você não pode excluir sua própria conta');
    }

    const user = await this.findOne(id, actor);

    // ROOT não pode ser excluído por ninguém
    if (user.role === Role.ROOT && actor.role === Role.ROOT) {
      const rootCount = await this.prisma.user.count({ where: { role: Role.ROOT } });
      if (rootCount <= 1) {
        throw new ForbiddenException('Não é possível excluir o único usuário ROOT do sistema');
      }
    }

    await this.prisma.user.delete({ where: { id } });
    await this.auditLog(actor.id, actor.tenantId, AuditAction.DELETE, 'User', id, user, null);
    return { message: 'Usuário excluído com sucesso' };
  }

  // ── Reset Password (por admin) ────────────────────────────────────────

  async resetPassword(
    id: string,
    newPassword: string,
    actor: { id: string; role: Role; tenantId: string | null },
  ) {
    await this.findOne(id, actor);
    const passwordHash = await bcrypt.hash(newPassword, this.BCRYPT_ROUNDS);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    // Revoga todos os refresh tokens do usuário
    await this.prisma.refreshToken.updateMany({
      where: { userId: id, isRevoked: false },
      data: { isRevoked: true },
    });
    return { message: 'Senha redefinida com sucesso. Sessões anteriores foram encerradas.' };
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
