import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { tripDto } from './trip.dto';
import { TripsService } from './trips.service';

@Controller('trips')
export class TripsController {
    constructor(
        private readonly tripService: TripsService
    ) { }

    @Post()
    async createTrip(@Body() dadosTrip: tripDto) {
        console.log('Dados recebidos no backend:', dadosTrip);
        return this.tripService.createTrip(dadosTrip)
    }

    @Get()
    async findAll() {
        return this.tripService.finAll()
    }

    @Get('/:id')
    async findById(@Param('id') id: number) {
        return this.tripService.findById(id)
    }

    @Delete('/:id')
    async deleteById(@Param('id') id: number) {
        return this.tripService.deleteById(id)
    }

    @Put()
    async updateTrip(@Body() dadosUpdate: tripDto) {
        return this.tripService.updateTrip(dadosUpdate)
    }
}
