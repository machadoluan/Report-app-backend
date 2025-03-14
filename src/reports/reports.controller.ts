import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Query, Req, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportDto } from './report.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { tripDto } from 'src/trips/trip.dto';

@Controller('reports')
export class ReportsController {

    constructor(private reportService: ReportsService) { }

    @Post(':viagemId')
    @UseInterceptors(FilesInterceptor('files'))
    async create(
        @Param('viagemId') viagemId: number,
        @Body() createReport: any, // Captura os campos de texto
        @UploadedFiles() files: Array<Express.Multer.File>, // Captura os arquivos
    ) {
        const user = JSON.parse(createReport.user);
        try {
            // Verifica se arquivos foram enviados
            if (!files || files.length === 0) {
                throw new BadRequestException('Nenhum arquivo enviado.');
            }

            // Chama o serviço para criar o relatório e fazer o upload das imagens
            const result = await this.reportService.createReport(
                viagemId,
                createReport,
                files,
                user.id
            );

            return result;
        } catch (error) {
            // Trata erros específicos
            if (error instanceof NotFoundException) {
                throw new NotFoundException(error.message);
            }
            if (error instanceof BadRequestException) {
                throw new BadRequestException(error.message);
            }
            // Lança outros erros
            throw error;
        }
    }


    @Get(':id')
    async reportById(
        @Param('id') id: number,
        @Query('userId') userId: string
    ) {
        return this.reportService.reportById(id, userId);
    }

    @Get()
    async reportFindAll(
        @Query('userId') userId: string
    ) {
        return this.reportService.reportFindAll(userId);
    }


    @Delete('/:id')
    async deleteById(
        @Param('id') id: number,
        @Query('userId') userId: string
    ) {
        return this.reportService.deleteById(id, userId);
    }

    @Delete()
    async deleteByIds(
        @Body('ids') ids: number[],
        @Query('userId') userId: string
    ) {
        return this.reportService.deleteByIds(ids, userId);
    }

    @Put()
    async updateReport(
        @Body() dadosUpdate: ReportDto,
        @Body('userId') userId: string,
    ) {
        return this.reportService.updateReport(dadosUpdate, userId);
    }
}
