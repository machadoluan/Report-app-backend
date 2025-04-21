import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class FacebookAuthCallbackGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const { error, error_reason } = request.query;

    // 🚫 Se o usuário cancelou
    if (error === 'access_denied' && error_reason === 'user_denied') {
      response.redirect(`${process.env.URL_FRONTEND}/login?error=cancelled`);
      return false;
    }

    return true;
  }
}
