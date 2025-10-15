import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class LocalAuthDto {
  @ApiProperty({
    description: 'Username',
    example: 'user@user.com',
  })
  @IsString()
  @IsEmail()
  username: string;

  @ApiProperty({
    description: 'Password',
    example: '123456',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Additional session info',
    example: {
      device: 'iOS',
      device_token: 'token',
    },
  })
  @IsOptional()
  @IsObject()
  info: Record<string, unknown>;
}
