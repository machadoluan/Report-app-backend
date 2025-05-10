import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { FotoEntity } from "../foto.entity";
import { UserEntity } from "src/auth/user.entity/user.entity";


@Entity('reports')
export class ReportEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: true })
    viagem_id: number;

    @Column({ nullable: false })
    tipo: string;

    @Column({ type: 'date', nullable: false })
    data: string | null;

    @Column({ type: 'time', nullable: false })
    hora: string;

    @Column({ default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updatedAt: Date;

    @Column()
    descricao: string;

    @Column()
    viagem_nome: string;

    @OneToMany(() => FotoEntity, (foto) => foto.report)
    fotos: FotoEntity[];


    @ManyToOne(() => UserEntity, user => user.reports)
    @JoinColumn({ name: 'user_id' })
    user: UserEntity;
}