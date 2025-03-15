import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReportEntity } from './report.entity/report.entity';
import { In, Repository } from 'typeorm';
import { ReportDto } from './report.dto';
import { TripEntity } from 'src/trips/trip.entity/trip.entity';
import { BackblazeService } from 'src/backblaze/backblaze.service';
import { FotoEntity } from './foto.entity';
import { UserEntity } from 'src/auth/user.entity/user.entity';

@Injectable()
export class ReportsService {

    constructor(
        @InjectRepository(ReportEntity)
        private readonly reportRepository: Repository<ReportEntity>,
        @InjectRepository(TripEntity)
        private readonly tripRepository: Repository<TripEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>,
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


    async createReport(viagemId: number, dadoReport: ReportDto, files: Express.Multer.File[], userId: string) {
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

        const user = await this.userRepository.findOne({ where: { id: userId } })

        if (!trip) {
            throw new NotFoundException(`Viagem com ID ${viagemId} não encontrada.`);
        }

        const viagemName = `${trip.origem} → ${trip.destino}`;

        // 🔴 Tenta fazer o upload das fotos antes de salvar o relatório
        let urls: string[] = [];
        try {
            for (const file of files) {
                const url = await this.backblazeService.uploadFile(file, userId, user.username, trip.id, viagemName);
                urls.push(url);
            }
        } catch (error) {
            throw new BadRequestException('Erro ao fazer upload da foto. Tente novamente.');
        }

        // 🔵 Agora salva o registro no banco, pois o upload foi bem-sucedido
        const reportFinal = this.reportRepository.create({
            ...dadoReport,
            viagem_id: viagemId,
            viagem_nome: viagemName,
            user: { id: userId }
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



    async reportById(reportId: number, userId: any) {
        if (!reportId || !userId) {
            throw new BadRequestException('Preencha todos os campos obrigatórios!');
        }

        const report = await this.reportRepository.findOne({ where: { id: reportId, user: { id: userId } } })
        const foto = await this.fotoRepository.find()

        if (!report) {
            throw new NotFoundException('Relatório não encontrado ou acesso negado');
        }

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

    async reportFindAll(userId: string) {
        if (!userId) {
            throw new BadRequestException('Preencha todos os campos obrigatórios!');
        }
        // Busca todos os relatórios do usuário
        const reports = await this.reportRepository.find({
            where: { user: { id: userId } }
        });

        const fotos = await this.fotoRepository.find();

        // Se não encontrar nada, lança o erro


        // Formata os relatórios e vincula as fotos certas
        const reportsFormatados = reports.map(report => ({
            ...report,
            tipo_name: this.formatarTipoName(report.tipo),
            data: this.formatDate(report.data),
            hora: this.formatarHora(report.hora),
            foto: fotos
                .filter(foto => foto.registroId === report.id)
                .map(foto => foto.url)
        }));

        console.log(reportsFormatados);
        return { reportsFormatados };
    }



    async deleteById(reportId: number, userId: string) {
        if (!reportId) {
            throw new BadRequestException('Preencha todos os campos obrigatórios!');
        }

        const report = await this.reportRepository.findOne({
            where: { id: reportId, user: { id: userId } },
        });

        if (!report) {
            throw new NotFoundException('Relatório não encontrado ou acesso negado!');
        }

        const img = await this.fotoRepository.findOne({
            where: { registroId: report.id },
        });

        if (img) {
            await this.deleteReportPhoto(img.url);
            await this.fotoRepository.delete(img);
        }

        await this.reportRepository.delete(report);

        return { success: `Registro de ${report.tipo} deletado.` };
    }

    async deleteByIds(reportids: number[], userId: string) {
        if (!reportids || reportids.length === 0) {
            throw new BadRequestException('Digite os IDs para apagar!');
        }

        const reports = await this.reportRepository.find({
            where: { id: In(reportids), user: { id: userId } },
        });

        if (reports.length === 0) {
            throw new BadRequestException('Nenhum relatório encontrado ou acesso negado!');
        }
        for (const report of reports) {
            const img = await this.fotoRepository.findOne({
                where: { registroId: report.id },
            });

            if (img) {
                await this.deleteReportPhoto(img.url);
                await this.fotoRepository.delete(img);
            }
        }

        const reportIds = reports.map((report) => report.id);

        await this.reportRepository.delete(reportIds);

        return { success: `Relatórios ${reportIds.join(', ')} deletados com sucesso!` };
    }

    async updateReport(dadosUpdate: ReportDto, userId: string) {
        if (!dadosUpdate.id) {
            throw new BadRequestException('O campo ID é obrigatório');
        }

        const report = await this.reportRepository.findOne({
            where: { id: dadosUpdate.id, user: { id: userId } },
        });

        if (!report) {
            throw new BadRequestException('Relatório não encontrado ou acesso negado!');
        }

        // Verificação de data
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

        return { success: 'Relatório atualizado com sucesso!' };
    }

    async deleteReportPhoto(fileName: string): Promise<void> {
        try {
            await this.backblazeService.deleteFileByUrl(fileName);
        } catch (error) {
            throw new BadRequestException('Erro ao deletar a foto associada.');
        }
    }

}
