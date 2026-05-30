import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, ParseUUIDPipe,
  HttpCode, HttpStatus, Res, UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse,
  ApiBearerAuth, ApiParam, ApiConsumes, ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';

import { VotersService } from './voters.service';
import { CreateVoterDto } from './dto/create-voter.dto';
import { UpdateVoterDto } from './dto/update-voter.dto';
import { QueryVoterDto } from './dto/query-voter.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('voters')
@ApiBearerAuth('JWT')
@Controller('voters')
export class VotersController {
  constructor(private readonly votersService: VotersService) {}

  // ── CRUD ─────────────────────────────────────────────────────────────

  @Post()
  @Roles(Role.LIDERLOCAL, Role.LIDERREG, Role.COORDENADOR, Role.CHEFEGAB, Role.POLITICO, Role.ROOT)
  @ApiOperation({ summary: 'Cadastrar eleitor' })
  @ApiResponse({ status: 201, description: 'Eleitor cadastrado' })
  @ApiResponse({ status: 409, description: 'CPF/Telefone/WhatsApp duplicado no tenant' })
  create(
    @Body() dto: CreateVoterDto,
    @CurrentUser() actor: { sub: string; role: Role; tenantId: string | null },
  ) {
    return this.votersService.create(dto, { id: actor.sub, role: actor.role, tenantId: actor.tenantId });
  }

  @Get()
  @ApiOperation({ summary: 'Busca avançada de eleitores com paginação server-side' })
  findAll(
    @Query() query: QueryVoterDto,
    @CurrentUser() actor: { role: Role; tenantId: string | null },
  ) {
    return this.votersService.findAll(query, actor);
  }

  @Get('stats')
  @Roles(Role.POLITICO, Role.CHEFEGAB, Role.COORDENADOR, Role.ROOT)
  @ApiOperation({ summary: 'Estatísticas de eleitores por segmento, município, região e suporte' })
  getStats(@CurrentUser() actor: { role: Role; tenantId: string | null }) {
    return this.votersService.getStats(actor);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOperation({ summary: 'Buscar eleitor por ID' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: { role: Role; tenantId: string | null },
  ) {
    return this.votersService.findOne(id, actor);
  }

  @Put(':id')
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOperation({ summary: 'Atualizar eleitor' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVoterDto,
    @CurrentUser() actor: { sub: string; role: Role; tenantId: string | null },
  ) {
    return this.votersService.update(id, dto, { id: actor.sub, role: actor.role, tenantId: actor.tenantId });
  }

  @Delete(':id')
  @Roles(Role.CHEFEGAB, Role.POLITICO, Role.ROOT)
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOperation({ summary: 'Excluir eleitor' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: { sub: string; role: Role; tenantId: string | null },
  ) {
    return this.votersService.remove(id, { id: actor.sub, role: actor.role, tenantId: actor.tenantId });
  }

  // ── Import CSV ────────────────────────────────────────────────────────

  @Post('import/csv')
  @Roles(Role.CHEFEGAB, Role.POLITICO, Role.ROOT)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({
    summary: 'Importar eleitores via CSV',
    description: `Colunas suportadas: nome, telefone, whatsapp, email, cpf, data_nascimento, endereco, bairro, cep, observacoes`,
  })
  @ApiResponse({ status: 200, description: 'Resultado da importação com erros por linha' })
  async importCsv(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() actor: { sub: string; role: Role; tenantId: string | null },
  ) {
    if (!file) throw new Error('Arquivo CSV é obrigatório');

    const csvText = file.buffer.toString('utf-8');
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
    });

    if (parsed.errors.length > 0) {
      return { success: false, parseErrors: parsed.errors };
    }

    return this.votersService.importCsv(
      parsed.data as Record<string, string>[],
      { id: actor.sub, role: actor.role, tenantId: actor.tenantId },
    );
  }

  // ── Export CSV ────────────────────────────────────────────────────────

  @Get('export/csv')
  @Roles(Role.CHEFEGAB, Role.POLITICO, Role.COORDENADOR, Role.ROOT)
  @ApiOperation({ summary: 'Exportar eleitores filtrados como CSV' })
  async exportCsv(
    @Query() query: QueryVoterDto,
    @CurrentUser() actor: { sub: string; role: Role; tenantId: string | null },
    @Res() res: Response,
  ) {
    const voters = await this.votersService.exportData(query, {
      id: actor.sub,
      role: actor.role,
      tenantId: actor.tenantId,
    });

    const rows = voters.map((v: any) => ({
      ID: v.id,
      Nome: v.name,
      CPF: v.cpf || '',
      Telefone: v.phone || '',
      WhatsApp: v.whatsapp || '',
      Email: v.email || '',
      Nascimento: v.birthDate ? new Date(v.birthDate).toLocaleDateString('pt-BR') : '',
      Sexo: v.sex || '',
      Endereço: v.address || '',
      Bairro: v.neighborhood || '',
      CEP: v.zipCode || '',
      Município: v.municipality?.name || '',
      Região: v.region?.name || '',
      Segmento: v.segment?.name || '',
      Coordenador: v.coordinator?.name || '',
      'Líder Regional': v.regionalLeader?.name || '',
      'Líder Local': v.localLeader?.name || '',
      'Status de Apoio': v.supportStatus,
      Observações: v.observations || '',
      'Cadastrado em': new Date(v.createdAt).toLocaleDateString('pt-BR'),
    }));

    const csv = Papa.unparse(rows);
    const filename = `eleitores_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv); // BOM para Excel reconhecer UTF-8
  }

  // ── Export XLSX ───────────────────────────────────────────────────────

  @Get('export/xlsx')
  @Roles(Role.CHEFEGAB, Role.POLITICO, Role.COORDENADOR, Role.ROOT)
  @ApiOperation({ summary: 'Exportar eleitores filtrados como XLSX (Excel)' })
  async exportXlsx(
    @Query() query: QueryVoterDto,
    @CurrentUser() actor: { sub: string; role: Role; tenantId: string | null },
    @Res() res: Response,
  ) {
    const voters = await this.votersService.exportData(query, {
      id: actor.sub,
      role: actor.role,
      tenantId: actor.tenantId,
    });

    const rows = voters.map((v: any) => ({
      ID: v.id,
      Nome: v.name,
      CPF: v.cpf || '',
      Telefone: v.phone || '',
      WhatsApp: v.whatsapp || '',
      Email: v.email || '',
      Nascimento: v.birthDate ? new Date(v.birthDate).toLocaleDateString('pt-BR') : '',
      Sexo: v.sex || '',
      Município: v.municipality?.name || '',
      Região: v.region?.name || '',
      Segmento: v.segment?.name || '',
      'Status Apoio': v.supportStatus,
      Coordenador: v.coordinator?.name || '',
      'Líder Regional': v.regionalLeader?.name || '',
      'Líder Local': v.localLeader?.name || '',
      Observações: v.observations || '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Eleitores');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `eleitores_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
