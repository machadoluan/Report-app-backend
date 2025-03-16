import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    async register(@Body('name') name: string, @Body('email') email: string, @Body('username') username: string, @Body('password') password: string) {
        return this.authService.register(name, username, email, password)
    }

    @Post('login')
    async login(@Body() dadosLogin: any) {
        console.log(dadosLogin)
        return this.authService.login(dadosLogin);
    }


    @Post('forgot-password')
    async forgotPassword(@Body('email') email: string) {
        return this.authService.forgotPassword(email);
    }

    @Post('reset-password')
    async resetPassword(
        @Body('token') token: string,
        @Body('newPassword') newPassword: string,
    ) {
        return this.authService.resetPassword(token, newPassword);
    }

    @Post('verify-token')
    async verifyToken(@Body('token') token: string){
        return this.authService.verifyToken(token)
    }
}
