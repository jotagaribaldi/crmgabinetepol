import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsArray,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRegionDto {
  @ApiProperty({ example: 'Região Metropolitana de SP', description: 'Nome da região' })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MaxLength(150)
  name: string;

  @ApiProperty({ description: 'ID do estado ao qual a região pertence' })
  @IsUUID('4', { message: 'stateId deve ser um UUID válido' })
  @IsNotEmpty({ message: 'stateId é obrigatório' })
  stateId: string;

  @ApiPropertyOptional({ description: 'Descrição da região' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'ID do coordenador (usuário com role COORDENADOR)' })
  @IsOptional()
  @IsUUID('4', { message: 'coordinatorId deve ser um UUID válido' })
  coordinatorId?: string;

  @ApiPropertyOptional({
    description: 'IDs dos municípios a vincular à região',
    type: [String],
    example: ['uuid-municipio-1', 'uuid-municipio-2'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'Cada municipalityId deve ser um UUID válido' })
  municipalityIds?: string[];
}
