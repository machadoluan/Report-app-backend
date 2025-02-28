import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './auth/user.entity/user.entity';
import { ProfileImageModule } from './profile-image/profile-image.module';
import { TripsModule } from './trips/trips.module';
import { TripEntity } from './trips/trip.entity/trip.entity';
import { ReportsModule } from './reports/reports.module';
import { ReportEntity } from './reports/report.entity/report.entity';
import { BackblazeService } from './backblaze/backblaze.service';
import { FotoEntity } from './reports/foto.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '',
      database: 'reportApp',
      entities: [UserEntity, TripEntity, ReportEntity, FotoEntity],
      // synchronize: true,
      // dropSchema: true 
    }),
    AuthModule, 
    ProfileImageModule,
    TripsModule,
    ReportsModule,
    ConfigModule.forRoot({
      isGlobal: true
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
