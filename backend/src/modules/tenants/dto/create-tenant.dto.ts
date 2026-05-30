import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ example: 'João Silva', description: 'Nome do candidato' })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MaxLength(150)
  name: string;

  @ApiProperty({ example: 'joao-silva-2026', description: 'Slug único (URL amigável)' })
  @IsString()
  @IsNotEmpty({ message: 'Slug é obrigatório' })
  @MinLength(3)
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug deve conter apenas letras minúsculas, números e hífens' })
  slug: string;

  @ApiPropertyOptional({ example: '123.456.789-00', description: 'CPF ou CNPJ do candidato' })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiPropertyOptional({ example: 'candidato@email.com' })
  @IsOptional()
  @IsEmail({}, { message: 'E-mail inválido' })
  email?: string;

  @ApiPropertyOptional({ example: '(11) 99999-9999' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'PT', description: 'Partido político' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  party?: string;

  @ApiPropertyOptional({ example: 'Deputado Estadual', description: 'Cargo disputado' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @ApiPropertyOptional({ example: 'SP', description: 'Estado da eleição (UF)' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  state?: string;

  @ApiPropertyOptional({ example: 'São Paulo', description: 'Município da eleição (se municipal)' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  city?: string;
}
