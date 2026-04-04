import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Share, Heart, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ShareButton } from '@/components/shared/ShareButton';

interface SectionData {
  key: string;
  label: string;
  images: { url: string; sort_order: number }[];
}

export default function BuildingPhotoTour() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sections, setSections] = useState<SectionData[]>([]);
  const [dormName, setDormName] = useState('');
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const SECTION_ORDER = [
    'exterior', 'study_room', 'common_area', 'garden', 'gym', 'pool',
    'kitchen', 'laundry', 'reception', 'terrace', 'rooftop', 'additional',
  ];

  const SECTION_LABELS: Record<string, string> = {
    exterior: 'Building Exterior',
    study_room: 'Study Room',
    common_area: 'Common Area',
    garden: 'Garden',
    gym: 'Gym',
    pool: 'Pool',
    kitchen: 'Kitchen',
    laundry: 'Laundry',
    reception: 'Reception',
    terrace: 'Terrace',
    rooftop: 'Rooftop',
    additional: 'Additional Photos',
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    const [dormRes, imagesRes] = await Promise.all([
      supabase.from('dorms').select('name, dorm_name, reception_per_block, block_count').eq('id', id).maybeSingle(),
      supabase.from('building_images').select('*').eq('dorm_id', id).order('sort_order'),
    ]);

    setDormName(dormRes.data?.dorm_name || dormRes.data?.name || 'Building');

    const images = imagesRes.data || [];
    const grouped: Record<string, { url: string; sort_order: number }[]> = {};
    images.forEach(img => {
      const key = img.section_type || 'additional';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({ url: img.url, sort_order: img.sort_order || 0 });
    });

    // Handle reception per block
    const receptionPerBlock = dormRes.data?.reception_per_block;
    const blockCount = dormRes.data?.block_count || 1;

    const result: SectionData[] = [];
    SECTION_ORDER.forEach(key => {
      if (key === 'reception' && receptionPerBlock && blockCount > 1) {
        for (let b = 1; b <= blockCount; b++) {
          const blockKey = `reception_block_${b}`;
          if (grouped[blockKey]?.length) {
            result.push({ key: blockKey, label: `Reception — Block ${b}`, images: grouped[blockKey] });
          }
        }
      } else if (grouped[key]?.length) {
        result.push({ key, label: SECTION_LABELS[key] || key, images: grouped[key] });
      }
    });

    // Catch any section_types not in SECTION_ORDER
    Object.keys(grouped).forEach(key => {
      if (!SECTION_ORDER.includes(key) && !key.startsWith('reception_block_')) {
        result.push({ key, label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), images: grouped[key] });
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
            <button onClick={() => navigate(`/dorm/${id}`)} className="p-2 rounded-full hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-semibold text-foreground">Photo tour</h1>
          </div>
          <div className="flex items-center gap-3">
            <ShareButton dormId={id!} dormName={dormName} />
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
                    <img src={section.images[0].url} alt={section.label} className="w-full h-full object-cover" />
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
                  images={section.images.map(i => i.url)}
                  onImageClick={(idx) => setLightbox({ images: section.images.map(i => i.url), index: idx })}
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
      <div className="space-y-2 rounded-xl overflow-hidden">
        <div className="cursor-pointer" onClick={() => onImageClick(0)}>
          <img src={images[0]} alt="" className="w-full h-[300px] object-cover rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {images.slice(1).map((img, i) => (
            <div key={i} className="cursor-pointer" onClick={() => onImageClick(i + 1)}>
              <img src={img} alt="" className="w-full h-[200px] object-cover rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (count === 4) {
    return (
      <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden">
        {images.map((img, i) => (
          <div key={i} className="cursor-pointer" onClick={() => onImageClick(i)}>
            <img src={img} alt="" className="w-full h-[220px] object-cover rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  // 5+ images
  return (
    <div className="space-y-2 rounded-xl overflow-hidden">
      <div className="cursor-pointer" onClick={() => onImageClick(0)}>
        <img src={images[0]} alt="" className="w-full h-[300px] object-cover rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {images.slice(1, 5).map((img, i) => (
          <div key={i} className="cursor-pointer" onClick={() => onImageClick(i + 1)}>
            <img src={img} alt="" className="w-full h-[200px] object-cover rounded-xl" />
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
