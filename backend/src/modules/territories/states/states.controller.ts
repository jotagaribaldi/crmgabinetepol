import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { StatesService } from './states.service';
import { QueryStateDto } from './dto/query-state.dto';

@ApiTags('states')
@ApiBearerAuth('JWT')
@Controller('states')
export class StatesController {
  constructor(private readonly statesService: StatesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os estados brasileiros' })
  @ApiResponse({ status: 200, description: 'Lista de estados' })
  findAll(@Query() query: QueryStateDto) {
    return this.statesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar estado por ID' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 404, description: 'Estado não encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.statesService.findOne(id);
  }

  @Get('abbr/:abbreviation')
  @ApiOperation({ summary: 'Buscar estado por sigla (ex: SP, RJ)' })
  @ApiParam({ name: 'abbreviation', type: String, example: 'SP' })
  findByAbbr(@Param('abbreviation') abbreviation: string) {
    return this.statesService.findByAbbreviation(abbreviation);
  }
}
