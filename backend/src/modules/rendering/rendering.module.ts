import { Module } from '@nestjs/common';
import { PdfRendererService } from './pdf-renderer.service.js';

@Module({
    providers: [PdfRendererService],
    exports: [PdfRendererService],
})
export class RenderingModule {}
