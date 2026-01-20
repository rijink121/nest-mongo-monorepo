import { SqlSchema } from '@lib/sql/utils/schema';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@shared/definitions/role.enum';
import { hashSync } from 'bcrypt';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { BeforeSave, Column, DataType, Table } from 'sequelize-typescript';

@Table
export class User extends SqlSchema {
  @Column({
    type: DataType.ENUM(...Object.values(Role)),
    defaultValue: Role.User,
  })
  @ApiProperty({
    enum: Role,
    description: 'Role',
    example: Role.User,
  })
  @IsEnum(Role)
  declare role: Role;

  @Column({
    type: DataType.STRING,
    unique: true,
  })
  @ApiProperty({
    description: 'Unique ID',
    example: 'a926d382-6741-4d95-86cf-1f5c421cf654',
    readOnly: true,
  })
  declare uid: string;

  @Column({
    type: DataType.STRING,
  })
  @ApiProperty({
    description: 'First Name',
    example: 'Ross',
  })
  @IsString()
  declare first_name: string;

  @Column({
    type: DataType.STRING,
  })
  @ApiProperty({
    description: 'Last Name',
    example: 'Geller',
  })
  @IsString()
  declare last_name: string;

  @Column({
    type: DataType.STRING,
  })
  @ApiProperty({
    description: 'Full Name',
    example: 'Ross Geller',
    readOnly: true,
  })
  declare name: string;

  @Column({
    type: DataType.STRING,
  })
  @ApiProperty({
    description: 'Email',
    example: 'ross.geller@gmail.com',
  })
  @IsString()
  @IsEmail()
  declare email: string;

  @Column({
    type: DataType.STRING,
    defaultValue: '+1',
  })
  @ApiProperty({
    description: 'Phone Code',
    example: '+91',
  })
  @IsString()
  declare phone_code: string;

  @Column({
    type: DataType.STRING,
  })
  @ApiProperty({
    description: 'Phone',
    example: '9999999999',
  })
  @IsNumberString()
  declare phone: string;

  @Column({
    type: DataType.STRING,
  })
  @ApiProperty({
    description: 'Password',
    example: '123456',
    writeOnly: true,
  })
  @IsString()
  @MinLength(6)
  declare password: string;

  @Column({
    type: DataType.STRING,
  })
  @ApiProperty({
    description: 'Avatar',
    example: 'user/avatar.png',
  })
  @IsOptional()
  @IsString()
  declare avatar: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  @ApiProperty({
    description: 'Enable 2FA?',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  declare enable_2fa: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  @ApiProperty({
    description: 'Send Email?',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  declare send_email: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  @ApiProperty({
    description: 'Send SMS?',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  declare send_sms: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  @ApiProperty({
    description: 'Send Push?',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  declare send_push: boolean;

  @Column({
    type: DataType.DATE,
  })
  @ApiProperty({
    format: 'date-time',
    description: 'Last Login At',
    example: '2021-01-01T00:00:00Z',
    readOnly: true,
  })
  declare last_login_at: Date;

  @BeforeSave
  static hashPassword(instance: User) {
    if (instance.changed('password')) {
      instance.password = hashSync(instance.password, 10);
    }
  }

  public toJSON() {
    const result = { ...this.get({ plain: true }) };
    delete result.password;
    return result;
  }
}
