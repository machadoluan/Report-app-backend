import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { AuthService } from './auth.service';


@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
    constructor(private readonly authService: AuthService) {
        super({
            clientID: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
            callbackURL: `${process.env.CALLBACK_URL}/auth/facebook/callback`,
            profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
            scope: ['email'],
        });
    }

    async validate(accessToken: string, refreshToken: string, profile: Profile, done: Function) {
        console.log('🔍 Dados do Facebook:', profile); // <-- Verifica se os dados estão chegando
        const user = await this.authService.validateUser({
            provider: 'facebook',
            name: profile.displayName || `${profile.name?.givenName} ${profile.name?.familyName}` || profile.emails?.[0]?.value.split('@')[0] || 'Usuário Facebook',
            first_name: profile.name?.givenName,
            last_name: profile.name?.familyName,
            email: profile.emails?.[0]?.value || '',
            picture: profile.photos?.[0]?.value
        });

        done(null, user);
    }
}
