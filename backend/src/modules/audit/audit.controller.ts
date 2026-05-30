import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse,
  ApiBearerAuth, ApiParam,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { QueryAuditDto } from './dto/query-audit.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('audit')
@ApiBearerAuth('JWT')
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(Role.ROOT, Role.POLITICO, Role.CHEFEGAB)
  @ApiOperation({ summary: 'Listar logs de auditoria com filtros (isolado por tenant para não-ROOT)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de logs de auditoria' })
  findAll(
    @Query() query: QueryAuditDto,
    @CurrentUser() actor: { role: Role; tenantId: string | null },
  ) {
    return this.auditService.findAll(query, actor);
  }

  @Get('summary')
  @Roles(Role.ROOT, Role.POLITICO, Role.CHEFEGAB)
  @ApiOperation({ summary: 'Resumo de atividades por ação, entidade e usuários mais ativos' })
  getSummary(@CurrentUser() actor: { role: Role; tenantId: string | null }) {
    return this.auditService.getSummary(actor);
  }

  @Get(':id')
  @Roles(Role.ROOT, Role.POLITICO, Role.CHEFEGAB)
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOperation({ summary: 'Detalhe de um log de auditoria específico' })
  @ApiResponse({ status: 404, description: 'Log não encontrado' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: { role: Role; tenantId: string | null },
  ) {
    return this.auditService.findOne(id, actor);
  }
}
