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
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { InvoicingEntity } from './trips/invoicing.entity';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          secure: true,
          auth: {
            user: configService.get<string>('EMAIL'),
            pass: configService.get<string>('EMAIL_PASSWORD'),
          },
        },
        defaults: { from: '"Equipe Suporte" <suporte@example.com>' },
        template: {
          dir: join(__dirname, '..', 'mails'), 
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService], 
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        username: 'reportuser',
        password: 'Machado@Luan121107#@$%',
        database: 'reportapp',
        entities: [UserEntity, ReportEntity, FotoEntity, TripEntity, InvoicingEntity],
        autoLoadEntities: true,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),

    AuthModule,
    ProfileImageModule,
    TripsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
