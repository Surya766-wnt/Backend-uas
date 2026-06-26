import { IsString, IsEmail, MinLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  READER = 'reader',
}

export class RegisterDto {
  @ApiProperty({ example: 'john' })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.READER })
  @IsEnum(UserRole)
  role: UserRole = UserRole.READER;
}
