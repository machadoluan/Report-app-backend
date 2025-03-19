import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { tripDto } from './trip.dto';
import { TripsService } from './trips.service';

@Controller('trips')
export class TripsController {
    constructor(
        private readonly tripService: TripsService
    ) { }

    @Post()
    async createTrip(@Body() dadosTrip: any) {
        const user = JSON.parse(dadosTrip.user);
        console.log("user", user.id)

        return this.tripService.createTrip(dadosTrip, user.id)
    }

    @Get()
    async findAll(
        @Query('userId') userId: string
    ) {
        return this.tripService.findAll(userId);
    }
    
    @Get('/:id')
    async findById(
        @Param('id') id: number,
        @Query('userId') userId: string
    ) {
        return this.tripService.findById(id, userId);
    }
    
    @Delete('/:id')
    async deleteById(
        @Param('id') id: number,
        @Query('userId') userId: string // Mudei pra Query pra ficar igual aos outros
    ) {
        return this.tripService.deleteById(id, userId);
    }
    
    @Delete()
    async deleteByIds(
        @Body() { ids, userId }: { ids: number[], userId: string } // Pegando tudo junto em um objeto
    ) {
        return this.tripService.deleteByIds(ids, userId);
    }

    @Put()
    async updateTrip(
        @Body("updateData") dadosUpdate: tripDto,
        @Body('userId') userId: string,
    ) {
        console.log("userId", userId)
        console.log("dadosUpdate", dadosUpdate)
        return this.tripService.updateTrip(dadosUpdate, userId);
    }
}
