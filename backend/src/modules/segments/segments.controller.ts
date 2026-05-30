import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, ParseUUIDPipe,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse,
  ApiBearerAuth, ApiParam,
} from '@nestjs/swagger';

import { SegmentsService } from './segments.service';
import { CreateSegmentDto } from './dto/create-segment.dto';
import { UpdateSegmentDto } from './dto/update-segment.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('segments')
@ApiBearerAuth('JWT')
@Controller('segments')
export class SegmentsController {
  constructor(private readonly segmentsService: SegmentsService) {}

  @Post()
  @Roles(Role.CHEFEGAB, Role.POLITICO, Role.ROOT)
  @ApiOperation({ summary: 'Criar novo segmento eleitoral' })
  create(
    @Body() dto: CreateSegmentDto,
    @CurrentUser() actor: { sub: string; role: Role; tenantId: string | null },
  ) {
    return this.segmentsService.create(dto, { id: actor.sub, role: actor.role, tenantId: actor.tenantId });
  }

  @Get()
  @ApiOperation({ summary: 'Listar segmentos do tenant' })
  findAll(
    @Query() query: any,
    @CurrentUser() actor: { role: Role; tenantId: string | null },
  ) {
    return this.segmentsService.findAll(query, actor);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOperation({ summary: 'Buscar segmento por ID' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: { role: Role; tenantId: string | null },
  ) {
    return this.segmentsService.findOne(id, actor);
  }

  @Put(':id')
  @Roles(Role.CHEFEGAB, Role.POLITICO, Role.ROOT)
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOperation({ summary: 'Atualizar segmento' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSegmentDto,
    @CurrentUser() actor: { sub: string; role: Role; tenantId: string | null },
  ) {
    return this.segmentsService.update(id, dto, { id: actor.sub, role: actor.role, tenantId: actor.tenantId });
  }

  @Delete(':id')
  @Roles(Role.CHEFEGAB, Role.POLITICO, Role.ROOT)
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOperation({ summary: 'Excluir segmento (somente sem eleitores)' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: { sub: string; role: Role; tenantId: string | null },
  ) {
    return this.segmentsService.remove(id, { id: actor.sub, role: actor.role, tenantId: actor.tenantId });
  }
}
