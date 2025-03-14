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
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Isso garante que as variáveis estarão disponíveis em toda a aplicação
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        entities: [UserEntity, ReportEntity, FotoEntity, TripEntity],
        autoLoadEntities: true,
        synchronize: true,
        // dropSchema: true,
      }),
      inject: [ConfigService],
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
export class AppModule { }
