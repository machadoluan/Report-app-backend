import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user.entity/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants/constants';
import { AuthService } from './auth.service';
import { ProfileImageService } from 'src/profile-image/profile-image.service';
import { PassportModule } from '@nestjs/passport';
import { FacebookStrategy } from './facebook.strategy';
import { GoogleStrategy } from './google.strategy';
import { ImageService } from './imageRezise.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'google' }),

    TypeOrmModule.forFeature([UserEntity]),
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: {expiresIn: '24h'}
    })
  ],
  providers: [AuthService, ProfileImageService, GoogleStrategy, FacebookStrategy, ImageService],
  controllers: [AuthController]
})
export class AuthModule {}
