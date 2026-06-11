import { Module } from '@nestjs/common';
import { PdfBindingService } from './pdf-binding.service.js';
import { PdfRendererService } from './pdf-renderer.service.js';

@Module({
    providers: [PdfBindingService, PdfRendererService],
    exports: [PdfBindingService, PdfRendererService],
})
export class RenderingModule {}
