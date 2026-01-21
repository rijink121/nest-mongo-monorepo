import { otp } from '@core/utils';
import { JobResponse } from '@core/utils/job';
import { Injectable } from '@nestjs/common';
import { Role } from '@shared/definitions/role.enum';
import { SessionData } from '@shared/definitions/session';
import {
  OtpSession,
  OtpSessionType,
} from '@shared/modules/otp-session/entities/otp-session.entity';
import { OtpSessionService } from '@shared/modules/otp-session/otp-session.service';
import { SessionService } from '@shared/modules/session/session.service';
import { User } from '@shared/modules/user/entities/user.entity';
import { UserService } from '@shared/modules/user/user.service';
import { randomBytes } from 'crypto';
import moment from 'moment';
import { JwtPayload } from '../jwt-auth/jwt-auth.strategy';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class RecoveryService {
  constructor(
    private readonly userService: UserService,
    private readonly otpSessionService: OtpSessionService,
    private readonly sessionService: SessionService,
  ) {}

  async verifyEmail(email: string): Promise<JobResponse<User>> {
    const { error, data } = await this.userService.$db.findOneRecord({
      options: { where: { email }, allowEmpty: true },
    });
    if (error) {
      return { error };
    }
    if (!data) {
      return { error: 'No account found with that email address.' };
    }
    if (!data.active) {
      return {
        error:
          'Your account is currently inactive. Please contact the administrator for assistance.',
      };
    }
    return { error: false, data };
  }

  async forgotOtp(user: User): Promise<JobResponse<OtpSession>> {
    const { error, data } = await this.otpSessionService.create({
      body: {
        user_id: user.id,
        otp: otp(),
        type: OtpSessionType.Forgot,
        expire_at: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
    if (error || !data) {
      return { error };
    }
    // TODO: send email
    return { error, data };
  }

  async verifyOtp(body: VerifyOtpDto): Promise<JobResponse<OtpSession>> {
    const { error, data } = await this.otpSessionService.$db.findRecordById({
      id: body.session_id,
      options: { allowEmpty: true },
    });
    if (error) {
      return { error };
    }
    if (!data) {
      return {
        error:
          'The code you entered is no longer valid. Please generate a new code to continue.',
        errorCode: 403,
      };
    }
    if (
      data.verified ||
      moment(data.expire_at).diff(moment(), 'seconds') <= 0
    ) {
      return {
        error:
          'The code you entered is no longer valid. Please generate a new code to continue.',
        errorCode: 403,
      };
    }
    if (data.retry_limit <= 0) {
      return {
        error: 'Maximum number of attempts exceeded. Please try again later.',
        errorCode: 403,
      };
    }
    if (data.otp !== body.otp) {
      try {
        data.retry_limit--;
        await data.save();
        return { error: 'Invalid verification code. Please try again.' };
      } catch (error) {
        return { error };
      }
    }
    try {
      data.verified = true;
      await data.save();
      return { error: false, data };
    } catch (error) {
      return { error };
    }
  }

  async sendOtp(body: SendOtpDto): Promise<JobResponse<OtpSession>> {
    const { error, data } = await this.otpSessionService.$db.findRecordById({
      id: body.session_id,
      options: { allowEmpty: true },
    });
    if (error) {
      return { error };
    }
    if (!data) {
      return { error: 'Invalid session', errorCode: 403 };
    }
    if (
      data.verified ||
      moment(data.expire_at).diff(moment(), 'seconds') <= 0
    ) {
      return {
        error:
          'The code you entered is no longer valid. Please generate a new code to continue.',
        errorCode: 403,
      };
    }
    if (data.resend_limit <= 0) {
      return {
        error: 'Maximum number of attempts exceeded. Please try again later.',
      };
    }
    try {
      data.resend_limit--;
      await data.save();
    } catch (error) {
      return { error };
    }

    // TODO: send email
    return { error: false, data };
  }

  async resetPassword(body: ResetPasswordDto): Promise<JobResponse> {
    const otpSession = await this.otpSessionService.$db.findRecordById({
      id: body.session_id,
      options: { allowEmpty: true },
    });

    if (otpSession.error) {
      return { error: otpSession.error };
    }
    if (!otpSession.data || !otpSession.data.verified) {
      return { error: 'Invalid session', errorCode: 403 };
    }
    if (moment(otpSession.data.expire_at).diff(moment(), 'seconds') <= 0) {
      return { error: 'Session expired', errorCode: 403 };
    }
    const userUpdate = await this.userService.$db.updateRecord({
      id: otpSession.data.user_id,
      body: { password: body.password },
    });
    if (userUpdate.error) {
      return { error: 'Unable to change password, Please try again' };
    }
    await this.otpSessionService.delete({ id: body.session_id });
    // TODO: send email
    return { error: false };
  }

  async createUserSession(
    userId: string,
    isAdmin: boolean,
    info: Record<string, unknown>,
  ): Promise<JobResponse<SessionData>> {
    try {
      const userWhere: Record<string, unknown> = { id: userId };
      if (isAdmin) {
        userWhere.role_id = { $ne: Role.SuperAdmin };
      }
      const { error, data: user } = await this.userService.$db.findOneRecord({
        options: { where: userWhere, allowEmpty: false },
      });
      if (error) {
        return { error };
      }
      if (!user) {
        return { error: 'Account does not exist' };
      }

      if (!user.active) {
        return { error: 'Account is inactive' };
      }
      const refreshToken = randomBytes(40).toString('hex');
      const { error: sessionError, data: sessionData } =
        await this.sessionService.create({
          action: 'create',
          body: {
            token: refreshToken,
            token_expiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
            user_id: `${user.id}`,
            info,
          },
        });
      if (sessionError || !sessionData) return { error: sessionError };
      const { data: tokenData, error: tokenError } =
        await this.sessionService.createToken<JwtPayload>({
          sessionId: sessionData._id.toString(),
          userId,
        });
      if (tokenError || !tokenData) {
        return { error: tokenError };
      }
      return {
        error: false,
        data: {
          token: tokenData.token,
          token_expiry: tokenData.tokenExpiry,
          refresh_token: refreshToken,
          user: user.toJSON(),
          session_id: sessionData._id.toString(),
        },
      };
    } catch (error) {
      return { error };
    }
  }
}
