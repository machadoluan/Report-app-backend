import { Column, Entity, PrimaryGeneratedColumn, ValueTransformer } from "typeorm";
import { TripStatus } from "../trip-status.enum";


const decimalTransformer: ValueTransformer = {
    to: (value: number) => value, // Armazena como número
    from: (value: string) => parseFloat(value), // Converte string para número ao buscar
};

@Entity('trips')
export class TripEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: false })
    origem: string;

    @Column({ nullable: false })
    destino: string;

    @Column({ nullable: false })
    cliente: string;

    @Column({ type: 'date', nullable: true })
    dataInicio: string | null;

    @Column({ type: 'date', nullable: true })
    dataFim: string | null;


    @Column({ type: 'decimal', precision: 10, scale: 2, transformer: decimalTransformer }) // Para valores monetários
    valor: number;

    @Column({ default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt: Date;

    @Column({ type: 'enum', enum: TripStatus })
    status: TripStatus;

    @Column()
    descricao: string;
}