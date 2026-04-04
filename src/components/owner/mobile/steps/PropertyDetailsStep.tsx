import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { usePropertyTerminology } from '@/hooks/use-property-terminology';

interface BlockNameEntry {
  block_number: number;
  name: string;
}

interface PropertyDetailsStepProps {
  title: string;
  onTitleChange: (title: string) => void;
  hasMultipleBlocks: boolean;
  onHasMultipleBlocksChange: (value: boolean) => void;
  blockCount: number;
  onBlockCountChange: (value: number) => void;
  blockNames: BlockNameEntry[];
  onBlockNamesChange: (names: BlockNameEntry[]) => void;
  propertyType?: string;
}

const PLACEHOLDER_EXAMPLES = [
  'e.g. Block A',
  'e.g. Block B',
  'e.g. Block C',
  'e.g. Block D',
  'e.g. Block E',
];

export function PropertyDetailsStep({
  title,
  onTitleChange,
  hasMultipleBlocks,
  onHasMultipleBlocksChange,
  blockCount,
  onBlockCountChange,
  blockNames,
  onBlockNamesChange,
  propertyType = 'dorm',
}: PropertyDetailsStepProps) {
  const { dormLabel } = usePropertyTerminology(propertyType);

  const placeholder = propertyType === 'apartment' || propertyType === 'hybrid'
    ? 'Enter your building name'
    : 'Enter your dorm name';

  const blockOptions = [
    {
      id: 'single',
      selected: !hasMultipleBlocks,
      emoji: '🏢',
      label: "No, it's one building",
      subLabel: 'My property is a single building',
    },
    {
      id: 'multiple',
      selected: hasMultipleBlocks,
      emoji: '🏘',
      label: 'Yes, multiple blocks',
      subLabel: 'My property has 2 or more separate building blocks',
    },
  ];

  // Keep blockNames array in sync with blockCount
  const getBlockName = (blockNum: number): string => {
    const entry = blockNames.find(b => b.block_number === blockNum);
    return entry?.name || '';
  };

  const updateBlockName = (blockNum: number, name: string) => {
    const exists = blockNames.find(b => b.block_number === blockNum);
    if (exists) {
      onBlockNamesChange(blockNames.map(b => b.block_number === blockNum ? { ...b, name } : b));
    } else {
      onBlockNamesChange([...blockNames, { block_number: blockNum, name }]);
    }
  };

  // Check for duplicate block names
  const getDuplicateError = (blockNum: number): string | null => {
    const currentName = getBlockName(blockNum).trim().toLowerCase();
    if (!currentName) return null;
    const isDuplicate = blockNames.some(
      b => b.block_number !== blockNum && b.name.trim().toLowerCase() === currentName
    );
    return isDuplicate ? 'This block name is already used.' : null;
  };

  return (
    <div className="min-h-screen flex flex-col items-center pt-24 pb-32 px-6">
      <div className="w-full max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl lg:text-[32px] font-semibold text-foreground">
            Tell us about your property
          </h1>
        </motion.div>

        {/* Section 1 — Property name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Give your {dormLabel} a title
          </h2>
          <Input
            value={title}
            onChange={(e) => onTitleChange(e.target.value.slice(0, 50))}
            placeholder={placeholder}
            className="h-14 text-lg"
          />
          <p className="text-right text-sm text-muted-foreground mt-2">
            {title.length}/50
          </p>
        </motion.div>

        {/* Section 2 — Building blocks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-1">
            Does your property have more than one building block?
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            A building block is a separate physical structure within the same property — for example Block A and Block B
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
            {blockOptions.map((option, index) => (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                onClick={() => {
                  const isMultiple = option.id === 'multiple';
                  onHasMultipleBlocksChange(isMultiple);
                  if (!isMultiple) {
                    onBlockCountChange(1);
                  } else if (blockCount < 2) {
                    onBlockCountChange(2);
                  }
                }}
                className={`relative flex flex-col justify-between p-4 rounded-xl border transition-all min-h-[100px] text-left ${
                  option.selected
                    ? 'border-foreground bg-background shadow-sm'
                    : 'border-border hover:border-foreground/50'
                }`}
              >
                <span className="text-2xl">{option.emoji}</span>
                <div className="flex flex-col items-start mt-2">
                  <span className="font-medium text-sm text-foreground">
                    {option.label}
                  </span>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    {option.subLabel}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Block count input */}
          {hasMultipleBlocks && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4"
            >
              <h3 className="text-sm font-medium text-foreground mb-2">
                How many building blocks do you have?
              </h3>
              <Input
                type="number"
                min={2}
                value={blockCount || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  onBlockCountChange(isNaN(val) ? 0 : Math.max(2, val));
                }}
                placeholder="Enter number of blocks"
                className="h-12"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Each block will be set up separately in the next steps. Shared spaces will be assumed shared across all blocks unless specified otherwise.
              </p>

              {/* Block naming sub-section */}
              {blockCount >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6"
                >
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    Name your blocks
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Give each block the name used in real life — tenants will see these names on your listing
                  </p>
                  <div className="space-y-3">
                    {Array.from({ length: blockCount }, (_, i) => i + 1).map((blockNum) => {
                      const duplicateError = getDuplicateError(blockNum);
                      return (
                        <div key={blockNum}>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            Block {blockNum}
                          </label>
                          <Input
                            value={getBlockName(blockNum)}
                            onChange={(e) => updateBlockName(blockNum, e.target.value)}
                            placeholder={PLACEHOLDER_EXAMPLES[blockNum - 1] || `e.g. Block ${String.fromCharCode(64 + blockNum)}`}
                            className="h-11"
                          />
                          {duplicateError && (
                            <p className="text-xs text-destructive mt-1">{duplicateError}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
