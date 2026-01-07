import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Building2, BedDouble, Upload, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WizardApartmentData, WizardBedroomData } from '@/types/apartment';

interface ApartmentMediaStepProps {
  apartments: WizardApartmentData[];
  selectedIds: string[];
  onChange: (apartments: WizardApartmentData[]) => void;
}

export function ApartmentMediaStep({
  apartments,
  selectedIds,
  onChange,
}: ApartmentMediaStepProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('apartments');

  const selectedApartments = apartments.filter(a => selectedIds.includes(a.id));

  const handleApartmentImageUpload = async (apartmentId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Convert files to base64 for preview (in production, upload to storage)
    const newImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      newImages.push(dataUrl);
    }

    onChange(
      apartments.map(apt =>
        apt.id === apartmentId
          ? { ...apt, images: [...apt.images, ...newImages] }
          : apt
      )
    );
  };

  const handleBedroomImageUpload = async (
    apartmentId: string,
    bedroomId: string,
    files: FileList | null
  ) => {
    if (!files || files.length === 0) return;

    const newImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      newImages.push(dataUrl);
    }

    onChange(
      apartments.map(apt => {
        if (apt.id !== apartmentId) return apt;
        return {
          ...apt,
          bedrooms: apt.bedrooms.map(br =>
            br.id === bedroomId
              ? { ...br, images: [...br.images, ...newImages] }
              : br
          ),
        };
      })
    );
  };

  const removeApartmentImage = (apartmentId: string, imageIndex: number) => {
    onChange(
      apartments.map(apt =>
        apt.id === apartmentId
          ? { ...apt, images: apt.images.filter((_, i) => i !== imageIndex) }
          : apt
      )
    );
  };

  const removeBedroomImage = (apartmentId: string, bedroomId: string, imageIndex: number) => {
    onChange(
      apartments.map(apt => {
        if (apt.id !== apartmentId) return apt;
        return {
          ...apt,
          bedrooms: apt.bedrooms.map(br =>
            br.id === bedroomId
              ? { ...br, images: br.images.filter((_, i) => i !== imageIndex) }
              : br
          ),
        };
      })
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Image className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Upload Media
            </h2>
            <p className="text-sm text-muted-foreground">
              Add photos for apartments and bedrooms
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 flex-1 flex flex-col min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="apartments" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Apartments
            </TabsTrigger>
            <TabsTrigger value="bedrooms" className="flex items-center gap-2">
              <BedDouble className="w-4 h-4" />
              Bedrooms
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <TabsContent value="apartments" className="mt-0 pb-24">
              <div className="space-y-6">
                {selectedApartments.map(apt => (
                  <div
                    key={apt.id}
                    className="p-4 rounded-xl border border-border bg-card"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="w-5 h-5 text-primary" />
                      <span className="font-medium">{apt.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({apt.images.length} photos)
                      </span>
                    </div>

                    {/* Image Grid */}
                    {apt.images.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {apt.images.map((img, i) => (
                          <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                            <img
                              src={img}
                              alt={`${apt.name} photo ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              onClick={() => removeApartmentImage(apt.id, i)}
                              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center"
                            >
                              <X className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload Button */}
                    <label className="flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors">
                      <Upload className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Add apartment photos
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={e => handleApartmentImageUpload(apt.id, e.target.files)}
                      />
                    </label>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="bedrooms" className="mt-0 pb-24">
              <div className="space-y-6">
                {selectedApartments.map(apt => (
                  <div key={apt.id}>
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">{apt.name}</span>
                    </div>

                    <div className="space-y-4 pl-2">
                      {apt.bedrooms.map(bedroom => (
                        <div
                          key={bedroom.id}
                          className="p-4 rounded-xl border border-border bg-card"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <BedDouble className="w-4 h-4 text-primary" />
                            <span className="font-medium">{bedroom.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({bedroom.images.length} photos)
                            </span>
                          </div>

                          {/* Image Grid */}
                          {bedroom.images.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              {bedroom.images.map((img, i) => (
                                <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                                  <img
                                    src={img}
                                    alt={`${bedroom.name} photo ${i + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <button
                                    onClick={() => removeBedroomImage(apt.id, bedroom.id, i)}
                                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center"
                                  >
                                    <X className="w-4 h-4 text-white" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Upload Button */}
                          <label className="flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors">
                            <Upload className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Add bedroom photos
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={e => handleBedroomImageUpload(apt.id, bedroom.id, e.target.files)}
                            />
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
}
