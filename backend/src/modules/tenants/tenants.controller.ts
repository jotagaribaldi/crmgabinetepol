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
} from '@nestjs/swagger';

import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { QueryTenantDto } from './dto/query-tenant.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('tenants')
@ApiBearerAuth('JWT')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @Roles(Role.ROOT)
  @ApiOperation({ summary: 'Criar novo candidato (tenant) — ROOT only' })
  @ApiResponse({ status: 201, description: 'Candidato criado com sucesso' })
  @ApiResponse({ status: 409, description: 'Slug ou documento já em uso' })
  create(
    @Body() dto: CreateTenantDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.tenantsService.create(dto, userId);
  }

  @Get()
  @Roles(Role.ROOT)
  @ApiOperation({ summary: 'Listar todos os candidatos com paginação — ROOT only' })
  findAll(@Query() query: QueryTenantDto) {
    return this.tenantsService.findAll(query);
  }

  @Get('stats')
  @Roles(Role.ROOT)
  @ApiOperation({ summary: 'Estatísticas globais de candidatos — ROOT only' })
  getStats() {
    return this.tenantsService.getStats();
  }

  @Get(':id')
  @Roles(Role.ROOT)
  @ApiOperation({ summary: 'Buscar candidato por ID — ROOT only' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 404, description: 'Candidato não encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ROOT)
  @ApiOperation({ summary: 'Atualizar candidato — ROOT only' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.tenantsService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles(Role.ROOT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Excluir candidato — ROOT only (somente sem eleitores)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.tenantsService.remove(id, userId);
  }
}
