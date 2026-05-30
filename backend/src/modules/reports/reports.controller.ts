import { Controller, Post, Body, Res, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { GenerateReportDto } from './dto/generate-report.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('reports')
@ApiBearerAuth('JWT')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('generate')
  @Roles(Role.POLITICO, Role.CHEFEGAB, Role.COORDENADOR, Role.ROOT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Gerar relatório em CSV ou XLSX',
    description: `Tipos disponíveis:
- **voters**: Listagem completa de eleitores
- **voters_by_region**: Eleitores agrupados por região
- **voters_by_segment**: Eleitores agrupados por segmento
- **voters_by_municipality**: Eleitores agrupados por município
- **leaders_performance**: Desempenho dos líderes locais
- **audit_summary**: Resumo de atividades (auditoria)`,
  })
  @ApiResponse({ status: 200, description: 'Arquivo gerado — Content-Disposition com nome do arquivo' })
  async generate(
    @Body() dto: GenerateReportDto,
    @CurrentUser() actor: { sub: string; role: Role; tenantId: string | null },
    @Res() res: Response,
  ) {
    const result = await this.reportsService.generate(dto, {
      id: actor.sub,
      role: actor.role,
      tenantId: actor.tenantId,
    });

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  }
}
