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
    <div className="min-h-screen flex flex-col items-center pt-24 pb-32 px-6">
      <div className="w-full max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-2xl lg:text-[32px] font-semibold text-foreground">
            How would you like to add your rooms?
          </h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
          {uploadMethods.map((method, index) => (
            <motion.button
              key={method.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onChange(method.id)}
              className={`relative flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[100px] text-left ${
                value === method.id
                  ? 'border-foreground bg-background shadow-sm'
                  : 'border-border hover:border-foreground/50'
              }`}
            >
              <method.icon className="w-6 h-6 text-foreground" />
              <div className="flex flex-col items-start mt-2">
                <span className="font-medium text-sm text-foreground">
                  {method.label}
                </span>
                <span className="text-xs text-muted-foreground mt-0.5">
                  {method.description}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
