import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReportEntity } from './report.entity/report.entity';
import { In, Repository } from 'typeorm';
import { ReportDto } from './report.dto';
import { TripEntity } from 'src/trips/trip.entity/trip.entity';
import { BackblazeService } from 'src/backblaze/backblaze.service';
import { FotoEntity } from './foto.entity';

@Injectable()
export class ReportsService {

    constructor(
        @InjectRepository(ReportEntity)
        private readonly reportRepository: Repository<ReportEntity>,
        @InjectRepository(TripEntity)
        private readonly tripRepository: Repository<TripEntity>,
        @InjectRepository(FotoEntity)
        private readonly fotoRepository: Repository<FotoEntity>,
        private readonly backblazeService: BackblazeService,
    ) { }


    private formatDate(date: any): string {
        if (!date || date === "0000-00-00") {
            return ""; // Retorna vazio quando a data for inválida
        }

        const dataUtc = new Date(date + "T00:00:00Z"); // Força UTC para evitar alteração de fuso
        return dataUtc.toISOString().split("T")[0].split("-").reverse().join("/");
    }

    private formatarHora(hora: string): string {
        if (!hora) return ''; // Verifica se a string está vazia ou indefinida

        // Caso a hora já esteja no formato "HH:mm:ss"
        if (/^\d{2}:\d{2}:\d{2}$/.test(hora)) {
            const partes = hora.split(':');
            return partes[2] === '00' ? `${partes[0]}:${partes[1]}` : hora;
        }

        // Caso a hora seja enviada sem separadores e tenha 4 caracteres (ex: "1420")
        if (/^\d{4}$/.test(hora)) {
            return `${hora.slice(0, 2)}:${hora.slice(2, 4)}`;
        }

        return hora; // Se não atender nenhum caso, retorna como está
    }

    private formatarTipoName(tipo) {
        switch (tipo) {
            case 'Inicio de Jornada':
            case 'Fim de Jornada':
                return 'Jornada';
            case 'Inicio Refeição':
            case 'Fim Refeição':
                return 'Refeição';
            case 'Inicio Pausa':
            case 'Fim Pausa':
                return 'Pausa';
            case 'Inicio Espera':
                return 'Espera'
            case 'Reinicio de viagem':
                return 'Reinicio';
            default:
                return tipo;
        }
    }


    async createReport(viagemId: number, dadoReport: ReportDto, files: Express.Multer.File[]) {
        if (!dadoReport.data || !dadoReport.hora || !dadoReport.tipo || !files || files.length === 0) {
            throw new BadRequestException('Preencha todos os campos obrigatórios e envie pelo menos uma foto!');
        }

        if (dadoReport.data) {
            const [dia, mes, ano] = dadoReport.data.split('/');
            const dataFormatada = `${ano}-${mes}-${dia}`;
            const data = new Date(dataFormatada);

            if (isNaN(data.getTime())) {
                throw new BadRequestException('A data fornecida é inválida!');
            }

            dadoReport.data = dataFormatada;
        }

        const trip = await this.tripRepository.findOne({ where: { id: viagemId } });

        if (!trip) {
            throw new NotFoundException(`Viagem com ID ${viagemId} não encontrada.`);
        }

        const viagemName = `${trip.origem} → ${trip.destino}`;

        // 🔴 Tenta fazer o upload das fotos antes de salvar o relatório
        let urls: string[] = [];
        try {
            for (const file of files) {
                const url = await this.backblazeService.uploadFile(file);
                urls.push(url);
            }
        } catch (error) {
            throw new BadRequestException('Erro ao fazer upload da foto. Tente novamente.');
        }

        // 🔵 Agora salva o registro no banco, pois o upload foi bem-sucedido
        const reportFinal = this.reportRepository.create({
            ...dadoReport,
            viagem_id: viagemId,
            viagem_nome: viagemName
        });

        const saveReport = await this.reportRepository.save(reportFinal);

        // 🔵 Salva as fotos associadas ao registro
        for (const url of urls) {
            const foto = this.fotoRepository.create({
                registroId: saveReport.id,
                url
            });
            await this.fotoRepository.save(foto);
        }

        return { success: 'Registro cadastrado com sucesso!' };
    }



    async reportById(id: number) {
        if (!id) {
            throw new BadRequestException('Preencha todos os campos obrigatórios!');
        }

        const report = await this.reportRepository.findOne({ where: { id } })
        const foto = await this.fotoRepository.find()

        report.data = this.formatDate(report.data)
        report.hora = this.formatarHora(report.hora)

        const reportFormatado = {
            ...report,
            tipo_name: this.formatarTipoName(report.tipo),
            foto: foto.filter(foto => foto.registroId === report.id)
                .map(foto => foto.url)
        }

        return { reportFormatado }
    }

    async reportFindAll() {
        const reports = await this.reportRepository.find()
        const fotos = await this.fotoRepository.find()

        const reportsFormatados = reports.map(report => {
            const foto = fotos.find(f => f.registroId === report.id);

            return {
                ...report,
                tipo_name: this.formatarTipoName(report.tipo),
                data: this.formatDate(report.data),
                hora: this.formatarHora(report.hora),
                foto:  fotos.filter(foto => foto.registroId === report.id)
                .map(foto => foto.url)
            }
        });

        console.log(reports)
        return { reportsFormatados }
    }


    async deleteById(id: number) {
        if (!id) {
            throw new BadRequestException('Preencha todos os campos obrigatórios!');
        }

        const report = await this.reportRepository.findOne({ where: { id } })
        const img = await this.fotoRepository.findOne({ where: { registroId: report.id } })

        if (!report) {
            throw new NotFoundException(`Viagem com ID ${id} não encontrada.`);
        }

        await this.reportRepository.delete(report)
        await this.fotoRepository.delete(img)

        return { success: `Registro de ${report.tipo} deletado.` }
    }

    async deleteByIds(ids: number[]) {

        if (!ids) {
            throw new BadRequestException('Digite os ids para apagar!');
        }

        const reports = await this.reportRepository.findBy({ id: In(ids) });


        if (reports.length === 0) {
            throw new BadRequestException('Nenhuma viagem encontrada para os IDs fornecidos.');
        }

        await this.reportRepository.delete(ids);

        return { success: `Viagens ${ids.join(', ')} deletadas com sucesso!` };
    }

    async updateReport(dadosUpdate: ReportDto) {

        if (!dadosUpdate.id) {
            throw new BadRequestException('O campo id é obrigatorio')
        }

        const report = await this.reportRepository.findOne({ where: { id: dadosUpdate.id } })

        if (!report) {
            throw new BadRequestException(`Não consegui encontrar o registro de id: ${dadosUpdate.id}!`);
        }

        if (dadosUpdate.data) {
            const [dia, mes, ano] = dadosUpdate.data.split('/');
            const dataFormatada = `${ano}-${mes}-${dia}`;

            const data = new Date(dataFormatada);

            if (isNaN(data.getTime())) {
                throw new BadRequestException('A data fornecida é inválida!');
            }

            dadosUpdate.data = dataFormatada;
        }


        await this.reportRepository.update({ id: dadosUpdate.id }, dadosUpdate);

        return { success: 'Viagem alterado com sucesso!' }
    }

}
