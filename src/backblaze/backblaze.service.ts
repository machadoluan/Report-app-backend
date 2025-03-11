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

        // Removemos a autenticação do construtor
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

    async uploadFile(file: Express.Multer.File): Promise<string> {
        if (!file) {
            throw new BadRequestException('Nenhum arquivo enviado.');
        }

        // Gera um nome único para o arquivo
        const fileName = `${Date.now()}-${path.basename(file.originalname)}`;

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

    private async getUploadData() {
        const response = await this.b2.getUploadUrl({ bucketId: this.bucketId });
        return {
            uploadUrl: response.data.uploadUrl,
            authorizationToken: response.data.authorizationToken,
        };
    }
}
