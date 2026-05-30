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
import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { RegionsService } from './regions.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { QueryRegionDto } from './dto/query-region.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

class MunicipalityIdsDto {
  @ApiProperty({ type: [String], description: 'Array de IDs de municípios' })
  @IsArray()
  @IsUUID('4', { each: true })
  municipalityIds: string[];
}

class AssignCoordinatorDto {
  @ApiProperty({ description: 'UUID do coordenador (null para remover)' })
  @IsUUID('4')
  coordinatorId: string;
}

@ApiTags('regions')
@ApiBearerAuth('JWT')
@Controller('regions')
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  @Post()
  @Roles(Role.CHEFEGAB, Role.ROOT)
  @ApiOperation({ summary: 'Criar nova região (CHEFEGAB ou ROOT)' })
  @ApiResponse({ status: 201, description: 'Região criada com sucesso' })
  @ApiResponse({ status: 409, description: 'Nome da região já existe no tenant' })
  create(
    @Body() dto: CreateRegionDto,
    @CurrentUser() actor: { sub: string; role: Role; tenantId: string | null },
  ) {
    return this.regionsService.create(dto, {
      id: actor.sub,
      role: actor.role,
      tenantId: actor.tenantId,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Listar regiões (isolado por tenant para não-ROOT)' })
  findAll(
    @Query() query: QueryRegionDto,
    @CurrentUser() actor: { role: Role; tenantId: string | null },
  ) {
    return this.regionsService.findAll(query, actor);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar região por ID' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: { role: Role; tenantId: string | null },
  ) {
    return this.regionsService.findOne(id, actor);
  }

  @Put(':id')
  @Roles(Role.CHEFEGAB, Role.ROOT)
  @ApiOperation({ summary: 'Atualizar região (inclui vincular/desvincular municípios)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRegionDto,
    @CurrentUser() actor: { sub: string; role: Role; tenantId: string | null },
  ) {
    return this.regionsService.update(id, dto, {
      id: actor.sub,
      role: actor.role,
      tenantId: actor.tenantId,
    });
  }

  @Post(':id/municipalities/add')
  @Roles(Role.CHEFEGAB, Role.ROOT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Adicionar municípios à região' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: MunicipalityIdsDto })
  addMunicipalities(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MunicipalityIdsDto,
    @CurrentUser() actor: { sub: string; role: Role; tenantId: string | null },
  ) {
    return this.regionsService.addMunicipalities(id, dto.municipalityIds, {
      id: actor.sub,
      role: actor.role,
      tenantId: actor.tenantId,
    });
  }

  @Post(':id/municipalities/remove')
  @Roles(Role.CHEFEGAB, Role.ROOT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover municípios da região' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: MunicipalityIdsDto })
  removeMunicipalities(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MunicipalityIdsDto,
    @CurrentUser() actor: { sub: string; role: Role; tenantId: string | null },
  ) {
    return this.regionsService.removeMunicipalities(id, dto.municipalityIds, {
      id: actor.sub,
      role: actor.role,
      tenantId: actor.tenantId,
    });
  }

  @Post(':id/coordinator')
  @Roles(Role.CHEFEGAB, Role.ROOT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atribuir coordenador à região' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: AssignCoordinatorDto })
  assignCoordinator(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignCoordinatorDto,
    @CurrentUser() actor: { sub: string; role: Role; tenantId: string | null },
  ) {
    return this.regionsService.assignCoordinator(id, dto.coordinatorId, {
      id: actor.sub,
      role: actor.role,
      tenantId: actor.tenantId,
    });
  }

  @Delete(':id/coordinator')
  @Roles(Role.CHEFEGAB, Role.ROOT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remover coordenador da região' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  removeCoordinator(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: { sub: string; role: Role; tenantId: string | null },
  ) {
    return this.regionsService.assignCoordinator(id, null, {
      id: actor.sub,
      role: actor.role,
      tenantId: actor.tenantId,
    });
  }

  @Delete(':id')
  @Roles(Role.CHEFEGAB, Role.ROOT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Excluir região (somente sem eleitores)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: { sub: string; role: Role; tenantId: string | null },
  ) {
    return this.regionsService.remove(id, {
      id: actor.sub,
      role: actor.role,
      tenantId: actor.tenantId,
    });
  }
}
