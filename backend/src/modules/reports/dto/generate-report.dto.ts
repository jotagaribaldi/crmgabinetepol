import { IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportFormat {
  CSV = 'csv',
  XLSX = 'xlsx',
}

export enum ReportType {
  VOTERS = 'voters',
  VOTERS_BY_REGION = 'voters_by_region',
  VOTERS_BY_SEGMENT = 'voters_by_segment',
  VOTERS_BY_MUNICIPALITY = 'voters_by_municipality',
  LEADERS_PERFORMANCE = 'leaders_performance',
  AUDIT_SUMMARY = 'audit_summary',
}

export class GenerateReportDto {
  @ApiProperty({ enum: ReportType, description: 'Tipo de relatório' })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiProperty({ enum: ReportFormat, description: 'Formato de exportação' })
  @IsEnum(ReportFormat)
  format: ReportFormat;

  @ApiPropertyOptional({ description: 'Data inicial do período (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Data final do período (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Filtrar por região específica' })
  @IsOptional()
  @IsUUID()
  regionId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por segmento específico' })
  @IsOptional()
  @IsUUID()
  segmentId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por município' })
  @IsOptional()
  @IsUUID()
  municipalityId?: string;
}
