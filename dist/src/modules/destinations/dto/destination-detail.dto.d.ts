import { DestinationListDto } from './destination-list.dto';
export declare class DestinationDetailDto extends DestinationListDto {
    description: string | null;
    latitude: number | null;
    longitude: number | null;
    googleMapsUrl: string | null;
    youtubeUrl: string | null;
    images: any[];
    topics: any[];
    sentimentTrends: any[];
}
