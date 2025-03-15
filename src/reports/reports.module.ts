import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportEntity } from './report.entity/report.entity';
import { TripEntity } from 'src/trips/trip.entity/trip.entity';
import { FotoEntity } from './foto.entity';
import { BackblazeService } from 'src/backblaze/backblaze.service';
import { UserEntity } from 'src/auth/user.entity/user.entity';

@Module({
  imports: [  TypeOrmModule.forFeature([ReportEntity, TripEntity, FotoEntity, UserEntity]),],
  providers: [ReportsService, BackblazeService],
  controllers: [ReportsController]
})
export class ReportsModule {}
