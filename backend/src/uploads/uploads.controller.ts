import { Controller, Post, UseInterceptors, UploadedFile, Param, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { Roles } from '../common/decorators/roles.decorator';

/** Allowed MIME types for file uploads */
const ALLOWED_MIME_TYPES = new Set([
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Text
  'text/plain',
  'text/csv',
]);

/** Allowed file extensions */
const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.csv',
]);

/** Maximum file size: 10MB */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Allowed folder names to prevent path traversal */
const ALLOWED_FOLDERS = new Set([
  'profiles', 'avatars', 'chat', 'announcements', 'homework', 'resources',
  'documents', 'events', 'misc', 'photos',
]);

@Controller('uploads')
export class UploadsController {
  @Post(':folder')
  @Roles('admin', 'superadmin', 'leader', 'teacher', 'parent')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const folder = (req.params.folder as string) || 'misc';

        // Sanitize folder name — prevent path traversal
        const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '');
        if (!ALLOWED_FOLDERS.has(sanitizedFolder)) {
          return cb(new BadRequestException(`Invalid upload folder: '${sanitizedFolder}'. Allowed: ${Array.from(ALLOWED_FOLDERS).join(', ')}`), '');
        }

        const uploadPath = `./uploads/${sanitizedFolder}`;
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
    limits: {
      fileSize: MAX_FILE_SIZE,
    },
    fileFilter: (req, file, cb) => {
      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        return cb(
          new BadRequestException(
            `File type '${file.mimetype}' is not allowed. Allowed types: images, PDFs, and common document formats.`,
          ),
          false,
        );
      }

      // Validate file extension
      const ext = extname(file.originalname).toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return cb(
          new BadRequestException(
            `File extension '${ext}' is not allowed.`,
          ),
          false,
        );
      }

      cb(null, true);
    },
  }))
  uploadFile(@UploadedFile() file: Express.Multer.File, @Param('folder') folder: string) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '');

    return {
      url: `/uploads/${sanitizedFolder}/${file.filename}`,
      originalName: file.originalname,
      size: file.size,
      message: 'File uploaded successfully',
    };
  }
}
