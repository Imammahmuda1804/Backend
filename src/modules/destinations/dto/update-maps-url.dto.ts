import { IsNotEmpty, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMapsUrlDto {
  @ApiProperty({
    description: 'Google Maps URL',
    example: 'https://maps.google.com/...',
  })
  @IsNotEmpty()
  @IsUrl()
  googleMapsUrl: string;
}
