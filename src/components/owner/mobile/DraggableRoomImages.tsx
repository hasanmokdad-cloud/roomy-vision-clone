import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Button } from '@/components/ui/button';
import { X, GripVertical, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableRoomImagesProps {
  images: string[];
  onReorder: (images: string[]) => void;
  onRemove: (index: number) => void;
  className?: string;
}

export function DraggableRoomImages({ 
  images, 
  onReorder, 
  onRemove,
  className 
}: DraggableRoomImagesProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(images);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onReorder(items);
  };

  if (images.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Drag to reorder • First image is the thumbnail
        </span>
      </div>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="room-images" direction="horizontal">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn(
                "flex flex-wrap gap-2 p-2 rounded-lg transition-colors",
                snapshot.isDraggingOver && "bg-primary/5"
              )}
            >
              {images.map((image, index) => (
                <Draggable key={`img-${index}`} draggableId={`img-${index}`} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={cn(
                        "relative group",
                        snapshot.isDragging && "opacity-70 shadow-lg"
                      )}
                    >
                      <div className={cn(
                        "w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors",
                        index === 0 ? "border-primary" : "border-border"
                      )}>
                        <img 
                          src={image} 
                          alt={`Image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Thumbnail indicator for first image */}
                      {index === 0 && (
                        <div className="absolute -top-1 -left-1 bg-primary text-primary-foreground rounded-full p-0.5">
                          <Star className="w-3 h-3 fill-current" />
                        </div>
                      )}
                      
                      {/* Drag handle */}
                      <div
                        {...provided.dragHandleProps}
                        className="absolute bottom-1 left-1 bg-black/70 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                      >
                        <GripVertical className="w-3 h-3 text-white" />
                      </div>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => onRemove(index)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>

                      {/* Image number */}
                      <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1 rounded">
                        {index + 1}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
