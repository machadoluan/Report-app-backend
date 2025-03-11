import { BadRequestException, Injectable } from '@nestjs/common';
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

    async createTrip(dadosTrip: tripDto) {
        if (!dadosTrip.cliente || !dadosTrip.origem || !dadosTrip.destino || !dadosTrip.dataInicio || !dadosTrip.valor) {
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

        const trip = this.tripRepository.create(dadosTrip);
        await this.tripRepository.save(trip);

        return { sucess: 'Viagem cadastrada com sucesso!' }

    }

    async finAll() {
        const trip = await this.tripRepository.find()
        trip.forEach(t => {
            t.dataInicio = this.formatDate(t.dataInicio);
            t.dataFim = this.formatDate(t.dataFim);
        });
        return trip
    }

    async findById(id: number) {
        const trip = await this.tripRepository.findOne({ where: { id } })

        if (!trip) {
            throw new BadRequestException(`Não consegui encontrar a viagem de id: ${id}!`);
        }

        trip.dataInicio = this.formatDate(trip.dataInicio)
        trip.dataFim = this.formatDate(trip.dataFim)

        return trip
    }

    async deleteById(id: number) {

        const trip = await this.tripRepository.findOne({ where: { id } })

        if (!trip) {
            throw new BadRequestException(`Não consegui encontrar a viagem de id: ${id}!`);
        }

        await this.tripRepository.delete(id)

        return { sucess: `Viagem ${id} deletada com sucesso!` }
    }

    async deleteByIds(ids: number[]) {
        const trips = await this.tripRepository.findBy({ id: In(ids) });

        if (trips.length === 0) {
            throw new BadRequestException('Nenhuma viagem encontrada para os IDs fornecidos.');
        }

        await this.tripRepository.delete(ids);

        return { success: `Viagens ${ids.join(', ')} deletadas com sucesso!` };
    }

    async updateTrip(dadosUpdate: tripDto) {

        if (!dadosUpdate.id) {
            throw new BadRequestException('O campo id é obrigatorio')
        }

        const trip = await this.tripRepository.findOne({ where: { id: dadosUpdate.id } })

        if (!trip) {
            throw new BadRequestException(`Não consegui encontrar a viagem de id: ${dadosUpdate.id}!`);
        }

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
            dadosUpdate.dataFim = null
            dadosUpdate.status = TripStatus.IN_PROGRESS;

        }

        if (dadosUpdate.dataInicio) {
            const [dia, mes, ano] = dadosUpdate.dataInicio.split('/');
            const dataFormatada = `${ano}-${mes}-${dia}`;

            const dataFim = new Date(dataFormatada);


            if (isNaN(dataFim.getTime())) {
                throw new BadRequestException('A dataFim fornecida é inválida!');
            }

            dadosUpdate.dataInicio = dataFormatada;
        }

        await this.tripRepository.update({ id: dadosUpdate.id }, dadosUpdate);

        return { success: 'Viagem alterado com sucesso!' }
    }

}
