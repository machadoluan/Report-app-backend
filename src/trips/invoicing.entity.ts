import { UserEntity } from "src/auth/user.entity/user.entity";
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { TripEntity } from "./trip.entity/trip.entity";


@Entity('invoicing')
export class InvoicingEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'userId' })
    user: UserEntity;

    @ManyToOne(() => TripEntity)
    @JoinColumn({ name: 'viagemId' })
    viagem: TripEntity;

    @Column()
    mesReferente: number;

    @Column()
    anoReferente: number;

    @Column('decimal', { precision: 10, scale: 2 })
    valor: number;

    @CreateDateColumn()
    criadoEm: Date;
}
