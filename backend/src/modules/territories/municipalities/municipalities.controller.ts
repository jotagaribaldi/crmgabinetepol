import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { MunicipalitiesService } from './municipalities.service';
import { QueryMunicipalityDto } from './dto/query-municipality.dto';

@ApiTags('municipalities')
@ApiBearerAuth('JWT')
@Controller('municipalities')
export class MunicipalitiesController {
  constructor(private readonly municipalitiesService: MunicipalitiesService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar municípios com paginação — filtrar por estado (stateId ou stateAbbr)',
  })
  @ApiResponse({ status: 200, description: 'Lista de municípios' })
  findAll(@Query() query: QueryMunicipalityDto) {
    return this.municipalitiesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar município por ID' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 404, description: 'Município não encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.municipalitiesService.findOne(id);
  }

  @Get('state/:stateId/all')
  @ApiOperation({ summary: 'Listar todos os municípios de um estado (sem paginação, para selects)' })
  @ApiParam({ name: 'stateId', type: String, format: 'uuid' })
  findByState(@Param('stateId', ParseUUIDPipe) stateId: string) {
    return this.municipalitiesService.findByState(stateId);
  }
}
