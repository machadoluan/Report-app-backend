import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TripEntity } from './trip.entity/trip.entity';
import { privateDecrypt } from 'crypto';
import { In, Repository } from 'typeorm';
import { tripDto } from './trip.dto';
import { TripStatus } from './trip-status.enum';
import { InvoicingEntity } from './invoicing.entity';

@Injectable()
export class TripsService {

    constructor(
        @InjectRepository(TripEntity)
        private readonly tripRepository: Repository<TripEntity>,
        @InjectRepository(InvoicingEntity)
        private readonly invoicingEntityRepository: Repository<InvoicingEntity>,
    ) { }


    private formatDate(date: any): string {
        if (!date || date === "0000-00-00") {
            return ""; // Retorna vazio quando a data for inválida
        }

        const dataUtc = new Date(date + "T00:00:00Z"); // Força UTC para evitar alteração de fuso
        return dataUtc.toISOString().split("T")[0].split("-").reverse().join("/");

    }

    private converterDataBrasileiraParaDate(data: string): Date {
        if (data.includes('/')) {
            const [dia, mes, ano] = data.split('/');
            return new Date(Date.UTC(Number(ano), Number(mes) - 1, Number(dia)));
        }
        return new Date(data);
    }

    async createTrip(dadosTrip: tripDto, userId: string) {
        if (!dadosTrip.cliente || !dadosTrip.origem || !dadosTrip.destino || !dadosTrip.dataInicio || !dadosTrip.valor || !userId) {
            throw new BadRequestException('Preencha todos os campos obrigatórios!');
        }

        // Formatar e validar data de fim, se existir
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

        // Formatar e validar data de início
        if (dadosTrip.dataInicio) {
            const [dia, mes, ano] = dadosTrip.dataInicio.split('/');
            const dataFormatada = `${ano}-${mes}-${dia}`;
            const dataInicio = new Date(dataFormatada);

            if (isNaN(dataInicio.getTime())) {
                throw new BadRequestException('A dataInicio fornecida é inválida!');
            }

            dadosTrip.dataInicio = dataFormatada;
        }

        // Criar e salvar a viagem no banco de dados
        const trip = this.tripRepository.create({
            ...dadosTrip,
            user: { id: userId }
        });
        await this.tripRepository.save(trip);

        // Pegar ano e mês da data de início
        const [ano, mes] = dadosTrip.dataInicio.split('-');

        // Lógica do período de faturamento (26 do mês passado até 25 do mês atual)
        const inicioPeriodo = new Date(Date.UTC(parseInt(ano), parseInt(mes) - 2, 26));
        const fimPeriodo = new Date(Date.UTC(parseInt(ano), parseInt(mes) - 1, 25, 23, 59, 59));

        const dataInicio = this.converterDataBrasileiraParaDate(dadosTrip.dataInicio);
        const dataFim = dadosTrip.dataFim ? this.converterDataBrasileiraParaDate(dadosTrip.dataFim) : null;

        console.log('Período de referência:', inicioPeriodo.toISOString(), 'até', fimPeriodo.toISOString());
        console.log('Data início viagem:', dataInicio.toISOString());
        console.log('Data fim viagem:', dataFim?.toISOString() || 'Sem data de fim');

        let mesReferente = parseInt(mes);

        // Se a viagem termina depois do período atual, joga para o mês seguinte
        if (dataFim && dataFim > fimPeriodo) {
            mesReferente++;
            if (mesReferente > 12) {
                mesReferente = 1; // Se passou de dezembro, volta pra janeiro
            }
        }

        console.log('Mês referente definido para:', mesReferente);

        // Sempre salva o faturamento, mas ajusta o mês correto
        const invoicing = this.invoicingEntityRepository.create({
            user: { id: userId },
            viagem: { id: trip.id },
            mesReferente: mesReferente,
            anoReferente: parseInt(ano),
            valor: dadosTrip.valor
        });
        await this.invoicingEntityRepository.save(invoicing);

        console.log('Faturamento salvo com sucesso:', invoicing);

        return { success: 'Viagem cadastrada com sucesso!' };
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

        await this.invoicingEntityRepository.delete({ viagem: { id: trip.id } });

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

        await this.invoicingEntityRepository.delete({ viagem: In(userTripsIds) });

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


    async getInvoicingHistory(userId: string, mesReferente?: number, anoReferente?: number) {
        if (!userId) throw new BadRequestException('Usuário é necessário');

        if (mesReferente && anoReferente) {
            if (isNaN(mesReferente) || isNaN(anoReferente)) {
                throw new BadRequestException('Mês e ano referentes devem ser números válidos');
            }

            try {
                const total = await this.invoicingEntityRepository
                    .createQueryBuilder('invoicing')
                    .where('invoicing.userId = :userId', { userId })
                    .andWhere('invoicing.mesReferente = :mesReferente', { mesReferente })
                    .andWhere('invoicing.anoReferente = :anoReferente', { anoReferente })
                    .getMany();

                const totalFaturamento = total.reduce((acc, viagem) => acc + Number(viagem.valor), 0);

                return {
                    mesReferente,
                    anoReferente,
                    total: totalFaturamento
                };
            } catch (error) {
                throw new InternalServerErrorException('Erro ao buscar histórico de faturamento');
            }
        } else {
            try {
                const historico = await this.invoicingEntityRepository
                    .createQueryBuilder('invoicing')
                    .where('invoicing.userId = :userId', { userId })
                    .select(['invoicing.mesReferente', 'invoicing.anoReferente', 'SUM(invoicing.valor) AS total'])
                    .groupBy('invoicing.mesReferente, invoicing.anoReferente')
                    .orderBy('invoicing.anoReferente', 'ASC')
                    .addOrderBy('invoicing.mesReferente', 'ASC')
                    .getRawMany();

                return historico.map(h => ({
                    mesReferente: h.invoicing_mesReferente,
                    anoReferente: h.invoicing_anoReferente,
                    total: h.total
                }));
            } catch (error) {
                throw new InternalServerErrorException('Erro ao buscar histórico de faturamento');
            }
        }
    }



}
