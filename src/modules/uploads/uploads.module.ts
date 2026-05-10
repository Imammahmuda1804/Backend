import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';
import { FileParserService } from './file-parser.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'nlp-queue',
    }),
  ],
  controllers: [UploadsController],
  providers: [UploadsService, FileParserService],
})
export class UploadsModule {}
