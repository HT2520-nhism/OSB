import { Injectable, Logger } from '@nestjs/common';
import { config } from '../../config';

interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailClientService {
  private readonly logger = new Logger(EmailClientService.name);
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = `${config.NOTIFICATION_API_URL}`;
  }

  async sendRegistrationEmail(
    email: string,
    fullName: string,
    password: string,
    loginUrl?: string,
  ): Promise<void> {
    const payload: SendEmailPayload = {
      to: email,
      subject: 'Tài khoản của bạn đã được tạo - SATURN',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Chào mừng bạn đến với SATURN!</h2>
          <p>Xin chào <strong>${fullName}</strong>,</p>
          <p>Tài khoản của bạn đã được tạo thành công trên hệ thống SATURN.</p>
          <p><strong>Thông tin đăng nhập:</strong></p>
          <ul>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Mật khẩu:</strong> ${password}</li>
          </ul>
          <div style="background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>⚠️ Lưu ý quan trọng:</strong></p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px;">
              <li>Vui lòng đổi mật khẩu ngay sau khi đăng nhập.</li>
              <li>Không chia sẻ mật khẩu này với bất kỳ ai.</li>
            </ul>
          </div>
          ${
            loginUrl
              ? `<p><a href="${loginUrl}" style="background: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Đăng nhập ngay</a></p>`
              : ''
          }
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">SATURN - Hệ thống quản lý</p>
        </div>
      `,
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to send email: ${response.status}`);
      }

      this.logger.log(`Registration email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send registration email to ${email}`, error);
      throw error;
    }
  }

  async sendPasswordResetEmail(
    email: string,
    newPassword: string,
  ): Promise<void> {
    const payload: SendEmailPayload = {
      to: email,
      subject: 'Mật khẩu mới - SATURN',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Mật khẩu mới của bạn</h2>
          <p>Xin chào,</p>
          <p>Yêu cầu đặt lại mật khẩu của bạn đã được xử lý. Dưới đây là mật khẩu mới:</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; font-size: 18px; font-weight: bold; text-align: center; margin: 20px 0;">
            ${newPassword}
          </div>
          <p><strong>Lưu ý:</strong></p>
          <ul>
            <li>Vui lòng đổi mật khẩu ngay sau khi đăng nhập.</li>
            <li>Không chia sẻ mật khẩu này với bất kỳ ai.</li>
          </ul>
          <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">SATURN - Hệ thống quản lý</p>
        </div>
      `,
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to send email: ${response.status}`);
      }

      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}`,
        error,
      );
      throw error;
    }
  }

  async sendPasswordResetOTP(email: string, otp: string): Promise<void> {
    const payload = {
      email,
      otp,
    };

    try {
      const response = await fetch(`${this.baseUrl}/password-reset-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to send OTP email: ${response.status}`);
      }

      this.logger.log(`Password reset OTP sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset OTP to ${email}: ${
          error instanceof Error ? error.message : error
        }`,
        error,
      );
      throw error;
    }
  }

  async sendPasswordChangedNotification(email: string): Promise<void> {
    const payload = {
      email,
    };

    try {
      const response = await fetch(`${this.baseUrl}/password-changed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to send password changed notification: ${response.status}`,
        );
      }

      this.logger.log(`Password changed notification sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password changed notification to ${email}`,
        error,
      );
      throw error;
    }
  }
}
