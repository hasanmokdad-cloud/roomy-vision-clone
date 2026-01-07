import { useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { EnhancedRoomCard } from '@/components/listings/EnhancedRoomCard';
import type { RoomType } from '@/types/RoomType';

interface DormInventorySectionProps {
  rooms: any[];
  roomTypes: RoomType[];
  dormId: string;
  dormName: string;
  ownerId: string;
  highlightedRoomId?: string | null;
}

/**
 * DormInventorySection - Displays room options for dorm buildings.
 * 
 * This component wraps the existing room cards logic for dorm buildings.
 * It's used within BuildingDetailLayout as the inventory section for dorm types.
 */
export function DormInventorySection({
  rooms,
  roomTypes,
  dormId,
  dormName,
  ownerId,
  highlightedRoomId
}: DormInventorySectionProps) {
  const roomRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  if (rooms.length === 0 && roomTypes.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Available Room Options</h2>
          <p className="text-center text-muted-foreground py-8">
            No room options available yet. Contact the owner for more information.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-6">
        <h2 className="text-2xl font-semibold text-foreground mb-6">Available Room Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
          {/* Database Rooms */}
          {rooms.map((room, idx) => (
            <div
              key={`db-${room.id}`}
              ref={(el) => el && room.id && roomRefs.current.set(room.id, el)}
              className={`transition-all duration-500 rounded-xl ${
                highlightedRoomId === room.id ? 'ring-4 ring-primary ring-offset-2 ring-offset-background' : ''
              }`}
            >
              <EnhancedRoomCard
                room={room}
                dormId={dormId}
                dormName={dormName}
                ownerId={ownerId}
                isLegacy={false}
                index={idx}
              />
            </div>
          ))}
          
          {/* Legacy room_types_json Rooms */}
          {roomTypes.map((room, idx) => {
            const legacyRoomId = `legacy-${dormId}-${room.type.toLowerCase().replace(/\s+/g, '-')}`;
            
            return (
              <EnhancedRoomCard
                key={`legacy-${idx}`}
                room={{
                  id: legacyRoomId,
                  name: room.type,
                  type: room.type,
                  price: room.price,
                  capacity: room.capacity,
                  available: room.available !== false,
                  images: room.images || [],
                  amenities: room.amenities || []
                }}
                dormId={dormId}
                dormName={dormName}
                ownerId={ownerId}
                isLegacy={true}
                index={rooms.length + idx}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default DormInventorySection;
