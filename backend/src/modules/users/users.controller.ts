import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

class ResetPasswordDto {
  @ApiProperty({ example: 'Nova@Senha2026!' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/, {
    message: 'Senha deve conter letra maiúscula, número e símbolo',
  })
  password: string;
}

@ApiTags('users')
@ApiBearerAuth('JWT')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.ROOT, Role.POLITICO, Role.CHEFEGAB, Role.COORDENADOR, Role.LIDERREG)
  @ApiOperation({ summary: 'Criar novo usuário (respeitando hierarquia de perfis)' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  @ApiResponse({ status: 409, description: 'E-mail já cadastrado' })
  @ApiResponse({ status: 403, description: 'Sem permissão para criar este perfil' })
  create(
    @Body() dto: CreateUserDto,
    @CurrentUser() actor: { sub: string; role: Role; tenantId: string | null },
  ) {
    return this.usersService.create(dto, {
      id: actor.sub,
      role: actor.role,
      tenantId: actor.tenantId,
    });
  }

  @Get()
  @Roles(Role.ROOT, Role.POLITICO, Role.CHEFEGAB, Role.COORDENADOR, Role.LIDERREG)
  @ApiOperation({ summary: 'Listar usuários (isolado por tenant para não-ROOT)' })
  findAll(
    @Query() query: QueryUserDto,
    @CurrentUser() actor: { role: Role; tenantId: string | null },
  ) {
    return this.usersService.findAll(query, actor);
  }

  @Get(':id')
  @Roles(Role.ROOT, Role.POLITICO, Role.CHEFEGAB, Role.COORDENADOR, Role.LIDERREG)
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: { role: Role; tenantId: string | null },
  ) {
    return this.usersService.findOne(id, actor);
  }

  @Put(':id')
  @Roles(Role.ROOT, Role.POLITICO, Role.CHEFEGAB, Role.COORDENADOR, Role.LIDERREG)
  @ApiOperation({ summary: 'Atualizar usuário' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: { sub: string; role: Role; tenantId: string | null },
  ) {
    return this.usersService.update(id, dto, {
      id: actor.sub,
      role: actor.role,
      tenantId: actor.tenantId,
    });
  }

  @Delete(':id')
  @Roles(Role.ROOT, Role.POLITICO, Role.CHEFEGAB)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Excluir usuário' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: { sub: string; role: Role; tenantId: string | null },
  ) {
    return this.usersService.remove(id, {
      id: actor.sub,
      role: actor.role,
      tenantId: actor.tenantId,
    });
  }

  @Post(':id/reset-password')
  @Roles(Role.ROOT, Role.POLITICO, Role.CHEFEGAB)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redefinir senha de um usuário (admin)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: ResetPasswordDto })
  resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResetPasswordDto,
    @CurrentUser() actor: { sub: string; role: Role; tenantId: string | null },
  ) {
    return this.usersService.resetPassword(id, dto.password, {
      id: actor.sub,
      role: actor.role,
      tenantId: actor.tenantId,
    });
  }
}
