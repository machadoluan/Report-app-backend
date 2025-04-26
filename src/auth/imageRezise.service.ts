import { Injectable } from '@nestjs/common';
import * as sharp from 'sharp';

@Injectable()
export class ImageService {
  async resizeBase64Image(base64Image: string, width = 500, height = 500): Promise<string> {
    const matches = base64Image.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid base64 image');
    }

    const ext = matches[1];
    const data = matches[2];
    const buffer = Buffer.from(data, 'base64');

    const resizedBuffer = await sharp(buffer)
      .resize(width, height)
      .jpeg({ quality: 70 }) // Pode ser .png() também se quiser
      .toBuffer();

    const resizedBase64 = `data:image/jpeg;base64,${resizedBuffer.toString('base64')}`;

    return resizedBase64;
  }
}
