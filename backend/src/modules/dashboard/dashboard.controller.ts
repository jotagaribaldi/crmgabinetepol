import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('dashboard')
@ApiBearerAuth('JWT')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('root')
  @Roles(Role.ROOT)
  @ApiOperation({
    summary: 'Dashboard ROOT — visão global do sistema (todos os tenants)',
    description: 'Retorna totais globais, crescimento, distribuição por estado/partido, top tenants e atividade recente.',
  })
  @ApiResponse({ status: 200, description: 'Dados do dashboard ROOT' })
  getRootDashboard(@Query() filter: DashboardFilterDto) {
    return this.dashboardService.getRootDashboard(filter);
  }

  @Get('tenant')
  @Roles(Role.POLITICO, Role.CHEFEGAB, Role.COORDENADOR)
  @ApiOperation({
    summary: 'Dashboard do candidato (tenant) — visão do eleitorado',
    description: 'Retorna totais, crescimento diário (30 dias), eleitores por segmento, região, município, sexo e status de apoio, top líderes e últimos cadastros.',
  })
  @ApiResponse({ status: 200, description: 'Dados do dashboard do candidato' })
  getTenantDashboard(
    @Query() filter: DashboardFilterDto,
    @CurrentUser() actor: { role: Role; tenantId: string | null },
  ) {
    return this.dashboardService.getTenantDashboard(filter, actor);
  }
}
