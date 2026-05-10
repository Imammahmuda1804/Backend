import { IsString, MinLength, MaxLength, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchQueryDto {
    @ApiProperty({
        description: 'Query pencarian destinasi wisata',
        example: 'wisata keluarga murah di bukittinggi',
        minLength: 3,
        maxLength: 500,
    })
    @IsString()
    @MinLength(3, { message: 'Query minimal 3 karakter' })
    @MaxLength(500, { message: 'Query maksimal 500 karakter' })
    query: string;

    @ApiPropertyOptional({
        description: 'Jumlah hasil maksimal (default: 10, max: 50)',
        default: 10,
        minimum: 1,
        maximum: 50,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limit?: number = 10;
}
