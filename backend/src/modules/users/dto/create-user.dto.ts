import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsEnum,
  IsUUID,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'Maria Silva', description: 'Nome completo' })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MaxLength(150)
  name: string;

  @ApiProperty({ example: 'maria@email.com' })
  @IsEmail({}, { message: 'E-mail inválido' })
  @IsNotEmpty({ message: 'E-mail é obrigatório' })
  email: string;

  @ApiProperty({
    example: 'Senha@2026!',
    description: 'Senha: mín. 8 caracteres, letra maiúscula, número e símbolo',
  })
  @IsString()
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  @Matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/, {
    message: 'Senha deve conter letra maiúscula, número e símbolo (!@#$%^&*)',
  })
  password: string;

  @ApiProperty({
    enum: Role,
    example: Role.COORDENADOR,
    description: 'Perfil do usuário',
  })
  @IsEnum(Role, { message: 'Perfil inválido' })
  role: Role;

  @ApiPropertyOptional({ description: 'ID do tenant (candidato)' })
  @IsOptional()
  @IsUUID('4', { message: 'tenantId deve ser um UUID válido' })
  tenantId?: string;

  @ApiPropertyOptional({ example: '(11) 99999-9999' })
  @IsOptional()
  @IsString()
  phone?: string;
}
