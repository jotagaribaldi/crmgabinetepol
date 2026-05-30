import { PartialType, OmitType } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsString, MinLength, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['password'] as const)) {
  @ApiPropertyOptional({ description: 'Nova senha (opcional)' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/, {
    message: 'Senha deve conter letra maiúscula, número e símbolo',
  })
  password?: string;

  @ApiPropertyOptional({ description: 'Ativar ou desativar usuário' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
