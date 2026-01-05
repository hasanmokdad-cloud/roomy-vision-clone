import { motion } from 'framer-motion';
import { FileSpreadsheet, Edit3 } from 'lucide-react';

interface UploadMethodStepProps {
  value: 'manual' | 'excel' | '';
  onChange: (value: 'manual' | 'excel') => void;
}

const uploadMethods = [
  {
    id: 'manual' as const,
    label: 'Manual Entry',
    icon: Edit3,
    description: 'Enter room details step by step with bulk operations'
  },
  {
    id: 'excel' as const,
    label: 'Excel Upload',
    icon: FileSpreadsheet,
    description: 'Download template, fill offline, upload'
  },
];

export function UploadMethodStep({ value, onChange }: UploadMethodStepProps) {
  return (
    <div className="px-6 pt-24 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-foreground mb-2">
          How would you like to add your rooms?
        </h1>
        <p className="text-muted-foreground">
          Choose the method that works best for you
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4">
        {uploadMethods.map((method, index) => (
          <motion.button
            key={method.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onChange(method.id)}
            className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
              value === method.id
                ? 'border-primary bg-primary/5 shadow-lg'
                : 'border-border bg-card hover:border-primary/50'
            }`}
          >
            <method.icon
              className={`w-10 h-10 flex-shrink-0 ${
                value === method.id ? 'text-primary' : 'text-muted-foreground'
              }`}
            />
            <div>
              <span className={`font-semibold text-base block ${
                value === method.id ? 'text-primary' : 'text-foreground'
              }`}>
                {method.label}
              </span>
              <span className="text-sm text-muted-foreground">
                {method.description}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
