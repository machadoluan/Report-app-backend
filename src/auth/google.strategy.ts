import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(private readonly authService: AuthService) {
        super({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: `${process.env.CALLBACK_URL}/auth/google/callback`,
            scope: ['profile', 'email'],
        });
    }

    async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback) {
        console.log('🔍 Dados do Google:', profile); // <-- Verifica se os dados estão chegando

        try {
            const user = await this.authService.validateUser({
                provider: 'google',
                name: profile.displayName,
                given_name: profile.name.givenName,
                family_name: profile.name.familyName,
                email: profile.emails[0].value,
                picture: profile.photos[0].value
            }); // <-- Aqui chamamos `validateUser`

            if (!user) {
                return done(null, false);
            }


            return done(null, user);
        } catch (error) {
            console.error('Erro na autenticação:', error);
            return done(error, false);
        }
    }
}
