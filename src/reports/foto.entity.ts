// foto.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ReportEntity } from './report.entity/report.entity';


@Entity('fotos')
export class FotoEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'registro_id' })
    registroId: number;

    @Column({ type: 'text' })
    url: string;

    @ManyToOne(() => ReportEntity, (report) => report.fotos, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'registro_id' })
    report: ReportEntity;
}