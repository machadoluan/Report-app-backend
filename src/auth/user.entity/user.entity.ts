import { ReportEntity } from "src/reports/report.entity/report.entity";
import { TripEntity } from "src/trips/trip.entity/trip.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";


@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({nullable: true})
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column({nullable: true})
  password: string;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column('text')
  profileImage: string;

  @OneToMany(() => ReportEntity, report => report.user)
  reports: ReportEntity[];

  @OneToMany(() => TripEntity, trip => trip.user)
  trips: TripEntity[]

  @Column({nullable: true})
  loginWith: string;
}