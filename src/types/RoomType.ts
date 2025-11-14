export interface RoomType {
  type: string;
  price: number;
  capacity: number;
  amenities?: string[];
  images?: string[];
  available?: boolean;
  panorama_url?: string;
}
