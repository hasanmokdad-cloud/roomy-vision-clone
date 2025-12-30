import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SettingsFooterProps {
  onCancel: () => void;
  onSave: () => void;
  saving?: boolean;
}

export function SettingsFooter({ onCancel, onSave, saving = false }: SettingsFooterProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-t border-border/40">
      <div className="container mx-auto max-w-4xl px-6 py-4">
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={saving}
            className="bg-gradient-to-r from-primary via-secondary to-accent hover:shadow-lg"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}
