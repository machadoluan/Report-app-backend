import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { FacebookAuthCallbackGuard } from './facebook-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    async register(@Body() dadosRegister: any) {
        console.log(dadosRegister)
        return this.authService.register(dadosRegister)
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
    async verifyToken(@Body('token') token: string) {
        return this.authService.verifyToken(token)
    }

    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth(@Req() req,) {
        // Essa rota inicia o fluxo de autenticação com o Google
    }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    googleAuthRedirect(@Req() req, @Res() res) {
        if (!req.user) {
            return res.redirect(`${process.env.URL_FRONTEND}/login?error=cancelled`);
        }
        res.cookie('token', req.user.accessToken, {
            httpOnly: false,              // ou true se você for usar cookies httpOnly
            secure: true,                 // obrigatório em produção (HTTPS)
            sameSite: 'None',             // 👈 importante para cross-domain
            domain: 'devmchd.space',      // ou 'app.devmchd.space' se quiser restringir mais
        });

        return res.redirect(`${process.env.URL_FRONTEND}/dashboard`);
    }


    // Rota para login com Facebook
    @Get('facebook')

    @UseGuards(AuthGuard('facebook'))
    async facebookAuth(@Req() req) { }

    // Callback do Facebook
    @Get('facebook/callback')
    @UseGuards(AuthGuard('facebook'))
    @UseGuards(FacebookAuthCallbackGuard)
    facebookAuthRedirect(@Req() req, @Res() res) {

        res.cookie('token', req.user.accessToken, {
            httpOnly: false,              // ou true se você for usar cookies httpOnly
            secure: true,                 // obrigatório em produção (HTTPS)
            sameSite: 'None',             // 👈 importante para cross-domain
            domain: 'devmchd.space',      // ou 'app.devmchd.space' se quiser restringir mais
        });

        return res.redirect(`${process.env.URL_FRONTEND}/dashboard`);

    }

}
