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
        // return this.authService.login(dadosLogin);
    }

    
}
