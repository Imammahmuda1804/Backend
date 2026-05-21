import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
export declare class DestinationQueryDto extends PaginationQueryDto {
    topic_id?: number;
    topic_ids?: string;
    city?: string;
    category?: string;
}
