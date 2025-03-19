import { IsNotEmpty, IsNumber, IsEnum, IsDateString } from 'class-validator';


export class ReportDto {
    id?: number;

    @IsNumber()
    @IsNotEmpty()
    viagem_id: number;

    @IsNotEmpty()
    tipo: string;

    @IsDateString()
    data: string | null;

    @IsNotEmpty()
    hora: string;

    @IsNotEmpty()
    descricao: string;

    @IsNotEmpty()
    viagem_nome: string;
    
    @IsNotEmpty()
    userId: string;

}