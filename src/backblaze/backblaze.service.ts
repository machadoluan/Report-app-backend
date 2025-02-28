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

        // Autenticar no Backblaze B2
        this.b2.authorize()
            .then(() => console.log('Autenticado no Backblaze B2'))
            .catch((err) => {
                console.error('Erro ao autenticar no Backblaze B2:', err);
                throw new Error('Falha na autenticação com o Backblaze B2');
            });
    }

    async uploadFile(file: Express.Multer.File): Promise<string> {
        if (!file) {
            throw new BadRequestException('Nenhum arquivo enviado.');
        }

        // Gera um nome único para o arquivo
        const fileName = `${Date.now()}-${path.basename(file.originalname)}`;

        try {
            // Faz o upload do arquivo
            const response = await this.b2.uploadFile({
                uploadUrl: await this.getUploadUrl(),
                uploadAuthToken: await this.getUploadAuthToken(),
                fileName: fileName,
                data: file.buffer,
            });

            // Retorna a URL pública do arquivo
            return `https://f002.backblazeb2.com/file/${this.bucketName}/${fileName}`;
        } catch (error) {
            console.error('Erro ao fazer upload do arquivo:', error);
            throw new BadRequestException('Falha ao fazer upload do arquivo.');
        }
    }

    private async getUploadUrl(): Promise<string> {
        const response = await this.b2.getUploadUrl({ bucketId: this.bucketId });
        return response.data.uploadUrl;
    }

    private async getUploadAuthToken(): Promise<string> {
        const response = await this.b2.getUploadUrl({ bucketId: this.bucketId });
        return response.data.authorizationToken;
    }
}