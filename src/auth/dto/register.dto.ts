import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { Role } from '../../../generated/prisma/client.js';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  name: string;

  @IsEnum(Role)
  role: Role;
}
