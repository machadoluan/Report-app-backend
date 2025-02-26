import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';
import { AuthModule } from './auth/auth.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './auth/user.entity/user.entity';
import { ProfileImageModule } from './profile-image/profile-image.module';
import { TripsModule } from './trips/trips.module';
import { TripEntity } from './trips/trip.entity/trip.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '',
      database: 'reportApp',
      entities: [UserEntity, TripEntity],
      autoLoadEntities: true,
    }),
    AuthModule, 
    CloudinaryModule,
    ProfileImageModule,
    TripsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
