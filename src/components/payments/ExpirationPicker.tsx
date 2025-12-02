import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ExpirationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (month: string, year: string) => void;
  initialMonth?: string;
  initialYear?: string;
}

const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 11 }, (_, i) => (currentYear + i).toString());

export function ExpirationPicker({ 
  isOpen, 
  onClose, 
  onSelect,
  initialMonth = '',
  initialYear = ''
}: ExpirationPickerProps) {
  const [selectedMonth, setSelectedMonth] = useState(initialMonth || MONTHS[0].value);
  const [selectedYear, setSelectedYear] = useState(initialYear || YEARS[0]);

  const handleConfirm = () => {
    onSelect(selectedMonth, selectedYear);
    onClose();
  };

  const currentMonth = new Date().getMonth() + 1;
  const currentYearNum = new Date().getFullYear();

  const isValidDate = (month: string, year: string) => {
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    if (yearNum > currentYearNum) return true;
    if (yearNum === currentYearNum && monthNum >= currentMonth) return true;
    return false;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="fixed bottom-0 left-0 right-0 bg-background rounded-t-3xl z-50 max-h-[70vh] overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4 border-b">
              <h3 className="text-lg font-semibold">Select Expiration Date</h3>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Pickers */}
            <div className="flex gap-4 p-6">
              {/* Month Picker */}
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-3">Month</p>
                <div className="h-48 overflow-y-auto space-y-1 scrollbar-thin">
                  {MONTHS.map((month) => {
                    const isDisabled = !isValidDate(month.value, selectedYear);
                    return (
                      <button
                        key={month.value}
                        onClick={() => !isDisabled && setSelectedMonth(month.value)}
                        disabled={isDisabled}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${
                          selectedMonth === month.value
                            ? 'bg-primary text-primary-foreground'
                            : isDisabled
                            ? 'text-muted-foreground/40 cursor-not-allowed'
                            : 'hover:bg-muted'
                        }`}
                      >
                        {month.value} - {month.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Year Picker */}
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-3">Year</p>
                <div className="h-48 overflow-y-auto space-y-1 scrollbar-thin">
                  {YEARS.map((year) => (
                    <button
                      key={year}
                      onClick={() => {
                        setSelectedYear(year);
                        // Reset month if current selection becomes invalid
                        if (!isValidDate(selectedMonth, year)) {
                          const firstValidMonth = MONTHS.find(m => isValidDate(m.value, year));
                          if (firstValidMonth) setSelectedMonth(firstValidMonth.value);
                        }
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${
                        selectedYear === year
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-6 pt-0">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 h-12"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!isValidDate(selectedMonth, selectedYear)}
                className="flex-1 h-12 bg-gradient-to-r from-primary to-purple-600"
              >
                Confirm
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
