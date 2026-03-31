import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Heart, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ShareButton } from '@/components/shared/ShareButton';

interface SectionData {
  key: string;
  label: string;
  images: string[];
}

export default function UnitPhotoTour() {
  const { id: dormId, roomId } = useParams();
  const navigate = useNavigate();
  const [sections, setSections] = useState<SectionData[]>([]);
  const [roomName, setRoomName] = useState('');
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const SPACE_LABELS: Record<string, string> = {
    bedroom: 'Bedroom',
    kitchenette: 'Kitchenette',
    bathroom: 'Full bathroom',
    workspace: 'Workspace / Study desk',
    balcony: 'Balcony',
    living_room: 'Living room',
  };

  useEffect(() => {
    loadData();
  }, [roomId]);

  const loadData = async () => {
    if (!roomId) return;

    const [roomRes, imagesRes] = await Promise.all([
      supabase.from('rooms').select('name, type, suite_bedrooms, suite_bathroom_count, has_balcony, suite_has_kitchenette').eq('id', roomId).maybeSingle(),
      supabase.from('room_images').select('*').eq('room_id', roomId).order('sort_order'),
    ]);

    const room = roomRes.data;
    setRoomName(room?.name || 'Unit');

    const images = imagesRes.data || [];
    const grouped: Record<string, string[]> = {};
    images.forEach(img => {
      const key = img.space_type;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(img.url);
    });

    // Build section order dynamically based on room type
    const roomType = (room?.type || '').toLowerCase();
    const isSuite = roomType.includes('suite');
    const isStudio = roomType.includes('studio');

    const orderedKeys: { key: string; label: string }[] = [];

    if (isSuite) {
      // Suite: Bedroom 1..N, Living room, Kitchenette (if applicable), Bathroom 1..N, Workspace, Balcony
      const bedroomCount = Array.isArray(room?.suite_bedrooms) ? room.suite_bedrooms.length : 1;
      for (let i = 1; i <= Math.max(bedroomCount, 1); i++) {
        const key = bedroomCount > 1 ? `bedroom_${i}` : 'bedroom';
        orderedKeys.push({ key, label: bedroomCount > 1 ? `Bedroom ${i}` : 'Bedroom' });
      }
      orderedKeys.push({ key: 'living_room', label: 'Living room' });
      if (room?.suite_has_kitchenette) {
        orderedKeys.push({ key: 'kitchenette', label: 'Kitchenette' });
      }
      const bathroomCount = room?.suite_bathroom_count || 1;
      for (let i = 1; i <= bathroomCount; i++) {
        const key = bathroomCount > 1 ? `bathroom_${i}` : 'bathroom';
        orderedKeys.push({ key, label: bathroomCount > 1 ? `Full bathroom ${i}` : 'Full bathroom' });
      }
      orderedKeys.push({ key: 'workspace', label: 'Workspace / Study desk' });
      if (room?.has_balcony) {
        orderedKeys.push({ key: 'balcony', label: 'Balcony' });
      }
    } else {
      orderedKeys.push({ key: 'bedroom', label: 'Bedroom' });
      if (isStudio) {
        orderedKeys.push({ key: 'kitchenette', label: 'Kitchenette' });
      }
      orderedKeys.push({ key: 'bathroom', label: 'Full bathroom' });
      orderedKeys.push({ key: 'workspace', label: 'Workspace / Study desk' });
      if (room?.has_balcony) {
        orderedKeys.push({ key: 'balcony', label: 'Balcony' });
      }
    }

    const result: SectionData[] = [];
    const usedKeys = new Set<string>();
    orderedKeys.forEach(({ key, label }) => {
      if (grouped[key]?.length) {
        result.push({ key, label, images: grouped[key] });
        usedKeys.add(key);
      }
    });

    // Catch any unlisted space types
    Object.keys(grouped).forEach(key => {
      if (!usedKeys.has(key) && grouped[key].length) {
        result.push({ key, label: SPACE_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), images: grouped[key] });
      }
    });

    setSections(result);
    setLoading(false);
  };

  const scrollToSection = (key: string) => {
    sectionRefs.current.get(key)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`/dorm/${dormId}?room=${roomId}`)} className="p-2 rounded-full hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-semibold text-foreground">Photo tour</h1>
          </div>
          <div className="flex items-center gap-3">
            <ShareButton dormId={dormId!} dormName={roomName} />
            <button className="flex items-center gap-1.5 text-sm font-medium text-foreground underline decoration-foreground/50">
              <Heart className="w-4 h-4" /> Save
            </button>
          </div>
        </div>
      </div>

      {/* Thumbnail navigation strip */}
      {sections.length > 1 && (
        <div className="border-b border-border bg-background">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {sections.map(section => (
                <button
                  key={section.key}
                  onClick={() => scrollToSection(section.key)}
                  className="flex-shrink-0 text-center group"
                >
                  <div className="w-20 h-[60px] rounded-lg overflow-hidden mb-1.5 border border-border group-hover:border-foreground transition-colors">
                    <img src={section.images[0]} alt={section.label} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs text-muted-foreground group-hover:text-foreground whitespace-nowrap">{section.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-16">
        {sections.map(section => (
          <div
            key={section.key}
            ref={el => el && sectionRefs.current.set(section.key, el)}
            className="scroll-mt-32"
          >
            <div className="grid grid-cols-1 md:grid-cols-[30%_1fr] gap-8">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">{section.label}</h2>
              </div>
              <div>
                <PhotoGrid
                  images={section.images}
                  onImageClick={(idx) => setLightbox({ images: section.images, index: idx })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}

function PhotoGrid({ images, onImageClick }: { images: string[]; onImageClick: (idx: number) => void }) {
  const count = images.length;

  if (count === 1) {
    return (
      <div className="rounded-xl overflow-hidden cursor-pointer" onClick={() => onImageClick(0)}>
        <img src={images[0]} alt="" className="w-full h-[400px] object-cover" />
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden">
        {images.map((img, i) => (
          <div key={i} className="cursor-pointer" onClick={() => onImageClick(i)}>
            <img src={img} alt="" className="w-full h-[300px] object-cover" />
          </div>
        ))}
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className="space-y-2">
        <div className="cursor-pointer rounded-xl overflow-hidden" onClick={() => onImageClick(0)}>
          <img src={images[0]} alt="" className="w-full h-[300px] object-cover" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {images.slice(1).map((img, i) => (
            <div key={i} className="cursor-pointer rounded-xl overflow-hidden" onClick={() => onImageClick(i + 1)}>
              <img src={img} alt="" className="w-full h-[200px] object-cover" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (count === 4) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {images.map((img, i) => (
          <div key={i} className="cursor-pointer rounded-xl overflow-hidden" onClick={() => onImageClick(i)}>
            <img src={img} alt="" className="w-full h-[220px] object-cover" />
          </div>
        ))}
      </div>
    );
  }

  // 5+
  return (
    <div className="space-y-2">
      <div className="cursor-pointer rounded-xl overflow-hidden" onClick={() => onImageClick(0)}>
        <img src={images[0]} alt="" className="w-full h-[300px] object-cover" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {images.slice(1, 5).map((img, i) => (
          <div key={i} className="cursor-pointer rounded-xl overflow-hidden" onClick={() => onImageClick(i + 1)}>
            <img src={img} alt="" className="w-full h-[200px] object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Lightbox({ images, index, onClose }: { images: string[]; index: number; onClose: () => void }) {
  const [current, setCurrent] = useState(index);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setCurrent(c => Math.max(0, c - 1));
      if (e.key === 'ArrowRight') setCurrent(c => Math.min(images.length - 1, c + 1));
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [images.length, onClose]);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      <button onClick={onClose} className="absolute top-4 left-4 p-2 text-white hover:bg-white/10 rounded-full z-10">
        <X className="w-6 h-6" />
      </button>
      <span className="absolute top-5 right-4 text-white/70 text-sm">{current + 1} / {images.length}</span>
      {current > 0 && (
        <button onClick={() => setCurrent(c => c - 1)} className="absolute left-4 p-2 text-white hover:bg-white/10 rounded-full">
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}
      <img src={images[current]} alt="" className="max-h-[90vh] max-w-[90vw] object-contain" />
      {current < images.length - 1 && (
        <button onClick={() => setCurrent(c => c + 1)} className="absolute right-4 p-2 text-white hover:bg-white/10 rounded-full">
          <ChevronRight className="w-8 h-8" />
        </button>
      )}
    </div>
  );
}
