import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserReviewDto {
    @ApiProperty({ description: 'ID destinasi yang direview', example: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    destination_id: number;

    @ApiProperty({
        description: 'Rating 1-5',
        minimum: 1,
        maximum: 5,
        example: 5,
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;

    @ApiPropertyOptional({
        description: 'Teks review (opsional)',
        example: 'Tempatnya bagus dan bersih',
        maxLength: 2000,
    })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    review_text?: string;
}
