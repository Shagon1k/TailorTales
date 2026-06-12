import { Module } from '@nestjs/common';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';
import { PdfBindingService } from './pdf-binding.service.js';
import { PdfRendererService } from './pdf-renderer.service.js';

@Module({
    imports: [SubscriptionsModule],
    providers: [PdfBindingService, PdfRendererService],
    exports: [PdfBindingService, PdfRendererService],
})
export class RenderingModule {}
