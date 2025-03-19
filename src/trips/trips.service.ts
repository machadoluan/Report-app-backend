import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TripEntity } from './trip.entity/trip.entity';
import { privateDecrypt } from 'crypto';
import { In, Repository } from 'typeorm';
import { tripDto } from './trip.dto';
import { TripStatus } from './trip-status.enum';

@Injectable()
export class TripsService {

    constructor(
        @InjectRepository(TripEntity)
        private readonly tripRepository: Repository<TripEntity>,
    ) { }


    private formatDate(date: any): string {
        if (!date || date === "0000-00-00") {
            return ""; // Retorna vazio quando a data for inválida
        }

        const dataUtc = new Date(date + "T00:00:00Z"); // Força UTC para evitar alteração de fuso
        return dataUtc.toISOString().split("T")[0].split("-").reverse().join("/");

    }

    async createTrip(dadosTrip: tripDto, userId: string) {
        if (!dadosTrip.cliente || !dadosTrip.origem || !dadosTrip.destino || !dadosTrip.dataInicio || !dadosTrip.valor || !userId) {
            throw new BadRequestException('Preencha todos os campos obrigatórios!');
        }

        if (dadosTrip.dataFim) {
            const [dia, mes, ano] = dadosTrip.dataFim.split('/');
            const dataFormatada = `${ano}-${mes}-${dia}`;

            const dataFim = new Date(dataFormatada);

            if (isNaN(dataFim.getTime())) {
                throw new BadRequestException('A dataFim fornecida é inválida!');
            }

            dadosTrip.status = TripStatus.COMPLETED;

            dadosTrip.dataFim = dataFormatada;
        }

        if (dadosTrip.dataInicio) {
            const [dia, mes, ano] = dadosTrip.dataInicio.split('/');
            const dataFormatada = `${ano}-${mes}-${dia}`;

            const dataFim = new Date(dataFormatada);

            if (isNaN(dataFim.getTime())) {
                throw new BadRequestException('A dataFim fornecida é inválida!');
            }

            dadosTrip.dataInicio = dataFormatada;
        }

        const trip = this.tripRepository.create({
            ...dadosTrip,
            user: { id: userId }
        });
        await this.tripRepository.save(trip);

        return { sucess: 'Viagem cadastrada com sucesso!' }

    }

    async findAll(userId: string) {
        if (!userId) {
            throw new BadRequestException('Preencha todos os campos obrigatórios!');
        }
        const trip = await this.tripRepository.find({
            where: { user: { id: userId } }
        })

        trip.forEach(t => {
            t.dataInicio = this.formatDate(t.dataInicio);
            t.dataFim = this.formatDate(t.dataFim);
        });
        return trip
    }

    async findById(tripId: number, userId: string) {
        if (!userId) {
            throw new BadRequestException('Preencha todos os campos obrigatórios!');

        }

        const trip = await this.tripRepository.findOne({ where: { id: tripId, user: { id: userId } } })

        if (!trip) {
            throw new NotFoundException('Relatório não encontrado ou acesso negado');
        }

        trip.dataInicio = this.formatDate(trip.dataInicio)
        trip.dataFim = this.formatDate(trip.dataFim)

        return trip
    }

    async deleteById(id: number, userId: string) {
        const trip = await this.tripRepository.findOne({
            where: { id, user: { id: userId } }
        });

        if (!trip) {
            throw new BadRequestException('Viagem não encontrada ou acesso negado');
        }

        await this.tripRepository.delete(id);

        return { success: `Viagem ${id} deletada com sucesso!` };
    }


    async deleteByIds(ids: number[], userId: string) {
        const trips = await this.tripRepository.find({
            where: { id: In(ids), user: { id: userId } }
        });

        if (trips.length === 0) {
            throw new BadRequestException('Nenhuma viagem encontrada para os IDs fornecidos ou acesso negado.');
        }

        const userTripsIds = trips.map(trip => trip.id);

        await this.tripRepository.delete(userTripsIds);

        return { success: `Viagens ${userTripsIds.join(', ')} deletadas com sucesso!` };
    }


    async updateTrip(dadosUpdate: tripDto, userId: string) {
        if (!dadosUpdate.id) {
            throw new BadRequestException('O campo id é obrigatório');
        }
    
        if (!userId) {
            throw new BadRequestException('usuario é necessario');
        }
    
        // Verifica se a viagem pertence ao usuário
        const trip = await this.tripRepository.findOne({
            where: { id: dadosUpdate.id, user: { id: userId } },
        });
    
        if (!trip) {
            throw new NotFoundException(`Viagem não encontrada ou acesso negado!`);
        }
    
        // Verifica e formata dataFim
        if (dadosUpdate.dataFim) {
            const [dia, mes, ano] = dadosUpdate.dataFim.split('/');
            const dataFormatada = `${ano}-${mes}-${dia}`;
            const dataFim = new Date(dataFormatada);
    
            if (isNaN(dataFim.getTime())) {
                throw new BadRequestException('A dataFim fornecida é inválida!');
            }
    
            dadosUpdate.status = TripStatus.COMPLETED;
            dadosUpdate.dataFim = dataFormatada;
        } else {
            dadosUpdate.dataFim = null;
            dadosUpdate.status = TripStatus.IN_PROGRESS;
        }
    
        // Verifica e formata dataInicio
        if (dadosUpdate.dataInicio) {
            const [dia, mes, ano] = dadosUpdate.dataInicio.split('/');
            const dataFormatada = `${ano}-${mes}-${dia}`;
            const dataInicio = new Date(dataFormatada);
    
            if (isNaN(dataInicio.getTime())) {
                throw new BadRequestException('A dataInicio fornecida é inválida!');
            }
    
            dadosUpdate.dataInicio = dataFormatada;
        }
    
        // Atualiza a viagem
        await this.tripRepository.update({ id: dadosUpdate.id }, dadosUpdate);
    
        return { success: 'Viagem alterada com sucesso!' };
    }
    

}
