import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, DollarSign, Users, Home, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { WhyThisMatch } from "./WhyThisMatch";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface RoomMatchCardProps {
  room: any;
  index: number;
}

export const RoomMatchCard = ({ room, index }: RoomMatchCardProps) => {
  const navigate = useNavigate();

  const capacity = room.capacity || 1;
  const occupied = room.capacity_occupied || 0;
  const available = capacity > occupied;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
        <CardContent className="p-0">
          {/* Room Images Carousel */}
          {room.images && room.images.length > 0 ? (
            <div className="relative h-48">
              <Carousel className="w-full h-full">
                <CarouselContent>
                  {room.images.map((image: string, idx: number) => (
                    <CarouselItem key={idx}>
                      <div className="relative h-48">
                        <img
                          src={image}
                          alt={`Room ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {room.images.length > 1 && (
                  <>
                    <CarouselPrevious className="left-2" />
                    <CarouselNext className="right-2" />
                  </>
                )}
              </Carousel>
            </div>
          ) : (
            <div className="h-48 bg-muted flex items-center justify-center">
              <Home className="w-12 h-12 text-muted-foreground" />
            </div>
          )}

          {/* Content */}
          <div className="p-4 space-y-3">
            <div>
              <h3 className="font-bold text-lg line-clamp-1">
                {room.room_type} Room
              </h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="w-3 h-3" />
                <span className="line-clamp-1">
                  {room.dorm?.dorm_name} • {room.dorm?.area}
                </span>
              </div>
            </div>

            {/* Price & Capacity */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="font-semibold text-primary">
                  ${room.price}/month
                </span>
                {room.deposit && (
                  <span className="text-xs text-muted-foreground">
                    + ${room.deposit} deposit
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {occupied}/{capacity} spots filled
                </span>
                <Badge variant={available ? "default" : "secondary"}>
                  {available ? "Available" : "Full"}
                </Badge>
              </div>
            </div>

            {/* Distance */}
            {room.distance && (
              <p className="text-xs text-muted-foreground">
                📍 {room.distance} from university
              </p>
            )}

            {/* Why This Match */}
            {room.explanations && room.explanations.length > 0 && (
              <WhyThisMatch reasons={room.explanations} />
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => navigate(`/dorm/${room.dorm_id}?room=${room.id}`)}
                className="flex-1"
                variant="default"
              >
                View Room
                <ExternalLink className="ml-2 w-4 h-4" />
              </Button>
              <Button
                onClick={() => navigate(`/messages?ownerId=${room.dorm?.owner_id}`)}
                variant="outline"
                className="flex-1"
              >
                Contact Owner
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
