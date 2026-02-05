import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Star, GripVertical } from 'lucide-react';
import ImageUploader from './ImageUploader';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ProductImageGalleryProps {
  images: string[];
  primaryIndex: number;
  onImagesChange: (images: string[]) => void;
  onPrimaryChange: (index: number) => void;
  contextName?: string;
}

interface SortableImageItemProps {
  id: string;
  url: string;
  index: number;
  isPrimary: boolean;
  onRemove: () => void;
  onSetPrimary: () => void;
  t: (key: string, fallback: string) => string;
}

function SortableImageItem({
  id,
  url,
  index,
  isPrimary,
  onRemove,
  onSetPrimary,
  t,
}: SortableImageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative aspect-square rounded-lg overflow-hidden bg-muted group border-2 transition-colors ${
        isPrimary ? 'border-primary' : 'border-transparent'
      } ${isDragging ? 'shadow-xl' : ''}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 start-2 z-10 bg-black/60 rounded p-1 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-4 w-4 text-white" />
      </div>

      <img
        src={url}
        alt={`Product ${index + 1}`}
        className="w-full h-full object-cover pointer-events-none"
      />

      {/* Primary Badge */}
      {isPrimary && (
        <Badge className="absolute top-2 end-2 gap-1 bg-primary text-primary-foreground shadow-lg">
          <Star className="h-3 w-3 fill-current" />
          {t('admin.primary', 'Primary')}
        </Badge>
      )}

      {/* Hover Actions Overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2 pointer-events-none group-hover:pointer-events-auto">
        {/* Set as Primary Button */}
        {!isPrimary && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={onSetPrimary}
            className="w-full gap-1"
          >
            <Star className="h-3 w-3" />
            {t('admin.setAsPrimary', 'Set as Primary')}
          </Button>
        )}

        {/* Remove Button */}
        <Button
          type="button"
          size="sm"
          variant="destructive"
          onClick={onRemove}
          className="w-full gap-1"
        >
          <X className="h-3 w-3" />
          {t('admin.remove', 'Remove')}
        </Button>
      </div>

      {/* Position Indicator */}
      <div className="absolute bottom-2 end-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full">
        {index + 1}
      </div>
    </div>
  );
}

export default function ProductImageGallery({
  images,
  primaryIndex,
  onImagesChange,
  onPrimaryChange,
  contextName = '',
}: ProductImageGalleryProps) {
  const { t } = useTranslation();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((_, i) => `image-${i}` === active.id);
      const newIndex = images.findIndex((_, i) => `image-${i}` === over.id);

      const newImages = arrayMove(images, oldIndex, newIndex);
      onImagesChange(newImages);

      // Update primary index if it was affected
      if (oldIndex === primaryIndex) {
        onPrimaryChange(newIndex);
      } else if (oldIndex < primaryIndex && newIndex >= primaryIndex) {
        onPrimaryChange(primaryIndex - 1);
      } else if (oldIndex > primaryIndex && newIndex <= primaryIndex) {
        onPrimaryChange(primaryIndex + 1);
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);

    // Adjust primary index if needed
    if (index === primaryIndex) {
      onPrimaryChange(0);
    } else if (index < primaryIndex) {
      onPrimaryChange(primaryIndex - 1);
    }
  };

  const handleSetPrimary = (index: number) => {
    onPrimaryChange(index);
  };

  const handleAddImages = (newImages: string[]) => {
    onImagesChange([...images, ...newImages.filter((img) => !images.includes(img))]);
  };

  return (
    <div className="space-y-4">
      {/* Images Grid with Drag and Drop */}
      {images.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={images.map((_, i) => `image-${i}`)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {images.map((url, index) => (
                <SortableImageItem
                  key={`image-${index}`}
                  id={`image-${index}`}
                  url={url}
                  index={index}
                  isPrimary={index === primaryIndex}
                  onRemove={() => handleRemoveImage(index)}
                  onSetPrimary={() => handleSetPrimary(index)}
                  t={t}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add Image Section */}
      <ImageUploader
        multiple
        existingImages={images}
        onMultipleChange={handleAddImages}
        onChange={(url) => handleAddImages([url])}
        bucket="product-images"
        folder="products"
        aspectRatio="square"
        contextName={contextName}
        contextType="product"
      />

      {/* Helper Text */}
      {images.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {t(
            'admin.imageGalleryHelp',
            'Drag images to reorder. Hover to set as primary or remove. The primary image appears first in the shop.'
          )}
        </p>
      )}
    </div>
  );
}
