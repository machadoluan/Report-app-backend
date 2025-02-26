import { IsNotEmpty, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { TripStatus } from './trip-status.enum';


export class tripDto {
    id?: number;

    @IsNotEmpty()
    origem: string;

    @IsNotEmpty()
    destino: string;

    @IsNotEmpty()
    cliente: string;

    @IsDateString()
    dataInicio: string;  

    @IsDateString()
    dataFim: string;

    @IsEnum(TripStatus)
    status: TripStatus;

    @IsNumber()
    valor: number;

}

