import { Controller, Post, UseInterceptors, UploadedFile, Param, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

@Controller('uploads')
export class UploadsController {
  @Post(':folder')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const folder = req.params.folder || 'misc';
        const uploadPath = `./uploads/${folder}`;
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  uploadFile(@UploadedFile() file: Express.Multer.File, @Param('folder') folder: string) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    
    return {
      url: `/uploads/${folder}/${file.filename}`,
      message: 'File uploaded successfully'
    };
  }
}
