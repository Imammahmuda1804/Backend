import { ApiProperty } from '@nestjs/swagger';

// Metadata response pagination.
export class PaginationMeta {
  @ApiProperty({ description: 'Halaman saat ini' })
  page: number;

  @ApiProperty({ description: 'Jumlah item per halaman' })
  limit: number;

  @ApiProperty({ description: 'Total item keseluruhan' })
  totalItems: number;

  @ApiProperty({ description: 'Total halaman' })
  totalPages: number;

  @ApiProperty({ description: 'Apakah ada halaman sebelumnya' })
  hasPreviousPage: boolean;

  @ApiProperty({ description: 'Apakah ada halaman selanjutnya' })
  hasNextPage: boolean;
}

// Format response untuk data berpaginasi.
export class PaginatedResponseDto<T> {
  data: T[];
  meta: PaginationMeta;

  constructor(data: T[], totalItems: number, page: number, limit: number) {
    const totalPages = Math.ceil(totalItems / limit);

    this.data = data;
    this.meta = {
      page,
      limit,
      totalItems,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
    };
  }
}
