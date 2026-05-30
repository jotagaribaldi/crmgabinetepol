import { IsOptional, IsString, IsInt, Min, Max, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QueryMunicipalityDto {
  @ApiPropertyOptional({ description: 'Busca por nome do município' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar por ID do estado' })
  @IsOptional()
  @IsUUID()
  stateId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por sigla do estado (ex: SP)' })
  @IsOptional()
  @IsString()
  stateAbbr?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50;
}
