import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsEnum,
  IsUUID,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Sex, SupportStatus } from '@prisma/client';

export class CreateVoterDto {
  @ApiProperty({ example: 'Maria Aparecida dos Santos' })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: '(11) 99999-1234' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: '(11) 99999-1234' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  whatsapp?: string;

  @ApiPropertyOptional({ example: 'maria@email.com' })
  @IsOptional()
  @IsEmail({}, { message: 'E-mail inválido' })
  email?: string;

  @ApiPropertyOptional({ example: '123.456.789-09' })
  @IsOptional()
  @IsString()
  @MaxLength(14)
  cpf?: string;

  @ApiPropertyOptional({ example: '1990-05-15', description: 'Data de nascimento (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString({}, { message: 'Data de nascimento inválida (use YYYY-MM-DD)' })
  birthDate?: string;

  @ApiPropertyOptional({ enum: Sex })
  @IsOptional()
  @IsEnum(Sex)
  sex?: Sex;

  @ApiPropertyOptional({ example: 'Rua das Flores, 123' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ example: '456' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  number?: string;

  @ApiPropertyOptional({ example: 'Apto 12' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  complement?: string;

  @ApiPropertyOptional({ example: 'Centro' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  neighborhood?: string;

  @ApiPropertyOptional({ example: '13010-100' })
  @IsOptional()
  @IsString()
  @MaxLength(9)
  zipCode?: string;

  @ApiPropertyOptional({ description: 'ID do município' })
  @IsOptional()
  @IsUUID()
  municipalityId?: string;

  @ApiPropertyOptional({ description: 'ID da região' })
  @IsOptional()
  @IsUUID()
  regionId?: string;

  @ApiPropertyOptional({ description: 'ID do segmento' })
  @IsOptional()
  @IsUUID()
  segmentId?: string;

  @ApiPropertyOptional({ description: 'ID do coordenador' })
  @IsOptional()
  @IsUUID()
  coordinatorId?: string;

  @ApiPropertyOptional({ description: 'ID do líder regional' })
  @IsOptional()
  @IsUUID()
  regionalLeaderId?: string;

  @ApiPropertyOptional({ description: 'ID do líder local' })
  @IsOptional()
  @IsUUID()
  localLeaderId?: string;

  @ApiPropertyOptional({ enum: SupportStatus, default: SupportStatus.INDEFINIDO })
  @IsOptional()
  @IsEnum(SupportStatus)
  supportStatus?: SupportStatus;

  @ApiPropertyOptional({ example: 'Eleitor muito engajado nas comunidades' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observations?: string;
}
