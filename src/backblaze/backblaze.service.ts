import { Injectable, BadRequestException } from '@nestjs/common';
import * as B2 from 'backblaze-b2';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BackblazeService {
    private b2: B2;
    private bucketName: string;
    private bucketId: string;

    constructor(private configService: ConfigService) {
        this.b2 = new B2({
            accountId: this.configService.get<string>('B2_ACCOUNT_ID'),
            applicationKey: this.configService.get<string>('B2_APPLICATION_KEY'),
        });

        this.bucketName = this.configService.get<string>('B2_BUCKET_NAME');
        this.bucketId = this.configService.get<string>('B2_BUCKET_ID');
    }

    async authenticate() {
        try {
            await this.b2.authorize();
            console.log('Autenticado no Backblaze B2');
        } catch (err) {
            console.error('Erro ao autenticar no Backblaze B2:', err);
            throw new Error('Falha na autenticação com o Backblaze B2');
        }
    }

    async uploadFile(file: Express.Multer.File, userId: string, name: string, tripId: number, tripName: string): Promise<string> {
        if (!file) {
            throw new BadRequestException('Nenhum arquivo enviado.');
        }

        // Define o caminho do arquivo no formato userId/tripId/nomeDoArquivo
        const fileName = `${userId} - ${name}/${tripId} - ${tripName}/${Date.now()}-${path.basename(file.originalname)}`;

        try {
            // Garantimos que está autenticado antes do upload
            await this.authenticate();

            const { uploadUrl, authorizationToken } = await this.getUploadData();

            // Faz o upload do arquivo
            const response = await this.b2.uploadFile({
                uploadUrl,
                uploadAuthToken: authorizationToken,
                fileName,
                data: file.buffer,
            });
            // Retorna a URL pública do arquivo
            return `https://f003.backblazeb2.com/file/${this.bucketName}/${fileName}`;
        } catch (error) {
            console.error('Erro ao fazer upload do arquivo:', error);
            throw new BadRequestException('Falha ao fazer upload do arquivo.');
        }
    }

    async deleteFileByUrl(fileUrl: string): Promise<void> {
        try {
            // Autentica no Backblaze B2
            await this.authenticate();
            console.log('Autenticado com sucesso');

            // Extrai o nome do arquivo da URL
            const fileName = fileUrl.split(`/file/${this.bucketName}/`)[1];
            if (!fileName) throw new Error('Caminho do arquivo inválido');
            console.log('Nome do arquivo extraído:', fileName);

            // Obtém o fileId usando o fileName
            const fileList = await this.b2.listFileNames({
                bucketId: this.bucketId, // Certifique-se de que this.bucketId está definido
                startFileName: fileName,
                maxFileCount: 1,
            });

            const fileInfo = fileList.data.files.find(file => file.fileName === fileName);
            if (!fileInfo) throw new Error('Arquivo não encontrado no bucket');

            const fileId = fileInfo.fileId;
            console.log('File ID encontrado:', fileId);

            // Deleta o arquivo
            const response = await this.b2.deleteFileVersion({
                fileId,
                fileName,
            });
            console.log('Resposta da API ao deletar arquivo:', response);

            console.log('Arquivo deletado com sucesso:', fileName);
        } catch (error) {
            console.error('Erro ao deletar arquivo do Backblaze B2:', error.message || error);
            throw new BadRequestException('Falha ao deletar o arquivo no Backblaze.');
        }
    }

    private async getUploadData() {
        const response = await this.b2.getUploadUrl({ bucketId: this.bucketId });
        return {
            uploadUrl: response.data.uploadUrl,
            authorizationToken: response.data.authorizationToken,
        };
    }
}
