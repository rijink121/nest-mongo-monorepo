import { Public } from '@core/decorators/public.decorator';
import {
  ResponseInternalServerError,
  ResponseUnauthorized,
} from '@core/definitions/api-response.dto';
import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  InternalServerErrorException,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { OtpSessionType } from '@shared/modules/otp-session/entities/otp-session.entity';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RecoveryService } from './recovery.service';

@ApiTags('auth')
@ApiUnauthorizedResponse(ResponseUnauthorized)
@ApiInternalServerErrorResponse(ResponseInternalServerError)
@Controller('auth')
export class RecoveryController {
  constructor(private readonly recoveryService: RecoveryService) {}

  @Public()
  @ApiOperation({ summary: 'Forgot password' })
  @ApiOkResponse({
    description: 'Ok',
    schema: {
      properties: {
        data: {
          type: 'object',
          properties: { session_id: { type: 'string' } },
        },
        message: { type: 'string', example: 'OTP sent' },
      },
    },
  })
  @Post('password/forgot')
  async forgotPassword(
    @Body() body: ForgotPasswordDto,
  ): Promise<{ data: { session_id: string }; message: string }> {
    const verifyEmail = await this.recoveryService.verifyEmail(body.email);
    if (verifyEmail.error || !verifyEmail.data) {
      throw new BadRequestException(
        verifyEmail.error instanceof Error
          ? verifyEmail.error.message
          : verifyEmail.error,
      );
    }

    const forgotOtp = await this.recoveryService.forgotOtp(verifyEmail.data);
    if (forgotOtp.error || !forgotOtp.data) {
      throw new InternalServerErrorException(
        forgotOtp.error instanceof Error
          ? forgotOtp.error.message
          : forgotOtp.error,
      );
    }
    return {
      data: { session_id: forgotOtp.data._id.toString() },
      message: 'OTP sent',
    };
  }

  @Public()
  @ApiOperation({ summary: 'Resend OTP' })
  @ApiOkResponse({
    description: 'Ok',
    schema: {
      properties: {
        data: {
          type: 'object',
          properties: { session_id: { type: 'string' } },
        },
        message: { type: 'string', example: 'OTP sent' },
      },
    },
  })
  @Post('otp/send')
  async sendOtp(@Body() body: SendOtpDto) {
    const verifyOtp = await this.recoveryService.sendOtp(body);
    if (verifyOtp.error || !verifyOtp.data) {
      if (verifyOtp.errorCode === 403) {
        throw new ForbiddenException(
          verifyOtp.error instanceof Error
            ? verifyOtp.error.message
            : verifyOtp.error,
        );
      }
      throw new BadRequestException(
        verifyOtp.error instanceof Error
          ? verifyOtp.error.message
          : verifyOtp.error,
      );
    }

    return {
      data: {
        session_id: verifyOtp.data._id,
        resend_limit: verifyOtp.data.resend_limit,
      },
      message: 'OTP sent',
    };
  }

  @Public()
  @ApiOperation({ summary: 'Verify OTP' })
  @ApiOkResponse({
    description: 'Ok',
    schema: {
      properties: {
        data: {
          type: 'object',
          properties: { session_id: { type: 'string' } },
        },
        message: { type: 'string', example: 'OTP verified' },
      },
    },
  })
  @Post('otp/verify')
  async verifyOtp(@Body() body: VerifyOtpDto) {
    const verifyOtp = await this.recoveryService.verifyOtp(body);
    if (verifyOtp.error || !verifyOtp.data) {
      if (verifyOtp.errorCode === 403) {
        throw new ForbiddenException(
          verifyOtp.error instanceof Error
            ? verifyOtp.error.message
            : verifyOtp.error,
        );
      }
      throw new BadRequestException(
        verifyOtp.error instanceof Error
          ? verifyOtp.error.message
          : verifyOtp.error,
      );
    }

    if (verifyOtp.data.type === OtpSessionType.Login) {
      const { error, data } = await this.recoveryService.createUserSession(
        verifyOtp.data.user_id,
        false,
        verifyOtp.data.payload,
      );
      if (error) {
        throw new ForbiddenException(
          error instanceof Error ? error.message : error,
        );
      }

      return { data, message: 'Login success' };
    }
    return {
      data: { session_id: verifyOtp.data._id },
      message: 'OTP verified',
    };
  }

  @Public()
  @ApiOperation({ summary: 'Reset password' })
  @ApiOkResponse({
    description: 'Ok',
    schema: {
      properties: { message: { type: 'string', example: 'Password changed' } },
    },
  })
  @Post('password/reset')
  async resetPassword(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: ResetPasswordDto,
  ) {
    const resetPassword = await this.recoveryService.resetPassword(body);
    if (resetPassword.error) {
      throw new BadRequestException(
        resetPassword.error instanceof Error
          ? resetPassword.error.message
          : resetPassword.error,
      );
    }
    return { message: 'Password changed' };
  }
}
