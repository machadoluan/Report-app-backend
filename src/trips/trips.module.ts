import { Module } from '@nestjs/common';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripEntity } from './trip.entity/trip.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TripEntity]),
  ],

  providers: [TripsService],
  controllers: [TripsController]
})
export class TripsModule { }
