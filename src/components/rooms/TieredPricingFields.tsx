import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TieredPricingFieldsProps {
  roomType: string;
  price: string;
  price1Student: string;
  price2Students: string;
  deposit: string;
  deposit1Student: string;
  deposit2Students: string;
  onChange: (field: string, value: string) => void;
}

export function TieredPricingFields({
  roomType,
  price,
  price1Student,
  price2Students,
  deposit,
  deposit1Student,
  deposit2Students,
  onChange,
}: TieredPricingFieldsProps) {
  const lowerType = roomType.toLowerCase();
  const isDouble = lowerType.includes('double');
  const isTriple = lowerType.includes('triple');
  const isTiered = isDouble || isTriple;

  // Determine labels based on room type
  const getMainPriceLabel = () => {
    if (isTriple) return "Monthly Price (3 students) *";
    if (isDouble) return "Monthly Price (2 students) *";
    return "Monthly Price ($) *";
  };

  const getMainDepositLabel = () => {
    if (isTriple) return "Deposit (3 students)";
    if (isDouble) return "Deposit (2 students)";
    return "Deposit ($)";
  };

  // Check if we should show optional deposit fields
  const showDeposit1Student = isTiered && price1Student && parseFloat(price1Student) > 0;
  const showDeposit2Students = isTriple && price2Students && parseFloat(price2Students) > 0;

  return (
    <div className="space-y-4">
      {/* Main price row - always visible */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">{getMainPriceLabel()}</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => onChange('price', e.target.value)}
            placeholder="500"
            required
            className="rounded-xl"
          />
        </div>

        {/* For standard rooms, show deposit next to price */}
        {!isTiered && (
          <div>
            <Label htmlFor="deposit">Deposit ($)</Label>
            <Input
              id="deposit"
              type="number"
              step="0.01"
              value={deposit}
              onChange={(e) => onChange('deposit', e.target.value)}
              placeholder="200"
              className="rounded-xl"
            />
            {deposit && parseFloat(deposit) > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Students pay: ${(parseFloat(deposit) * 1.1).toFixed(2)} total
              </p>
            )}
          </div>
        )}

        {/* For tiered rooms, show main deposit */}
        {isTiered && (
          <div>
            <Label htmlFor="deposit">{getMainDepositLabel()}</Label>
            <Input
              id="deposit"
              type="number"
              step="0.01"
              value={deposit}
              onChange={(e) => onChange('deposit', e.target.value)}
              placeholder="200"
              className="rounded-xl"
            />
            {deposit && parseFloat(deposit) > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Students pay: ${(parseFloat(deposit) * 1.1).toFixed(2)} total
              </p>
            )}
          </div>
        )}
      </div>

      {/* Triple room: Price for 2 students */}
      {isTriple && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price_2_students">Monthly Price (2 students)</Label>
            <Input
              id="price_2_students"
              type="number"
              step="0.01"
              value={price2Students}
              onChange={(e) => onChange('price_2_students', e.target.value)}
              placeholder="Optional"
              className="rounded-xl"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Price when 2 students share this room
            </p>
          </div>

          {/* Show Deposit (2 students) when price_2_students has value */}
          {showDeposit2Students && (
            <div>
              <Label htmlFor="deposit_2_students">Deposit (2 students)</Label>
              <Input
                id="deposit_2_students"
                type="number"
                step="0.01"
                value={deposit2Students}
                onChange={(e) => onChange('deposit_2_students', e.target.value)}
                placeholder="Optional"
                className="rounded-xl"
              />
              {deposit2Students && parseFloat(deposit2Students) > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Students pay: ${(parseFloat(deposit2Students) * 1.1).toFixed(2)} total
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Double and Triple rooms: Price for 1 student */}
      {isTiered && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price_1_student">Monthly Price (1 student)</Label>
            <Input
              id="price_1_student"
              type="number"
              step="0.01"
              value={price1Student}
              onChange={(e) => onChange('price_1_student', e.target.value)}
              placeholder="Optional"
              className="rounded-xl"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Price when 1 student has the room alone
            </p>
          </div>

          {/* Show Deposit (1 student) when price_1_student has value */}
          {showDeposit1Student && (
            <div>
              <Label htmlFor="deposit_1_student">Deposit (1 student)</Label>
              <Input
                id="deposit_1_student"
                type="number"
                step="0.01"
                value={deposit1Student}
                onChange={(e) => onChange('deposit_1_student', e.target.value)}
                placeholder="Optional"
                className="rounded-xl"
              />
              {deposit1Student && parseFloat(deposit1Student) > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Students pay: ${(parseFloat(deposit1Student) * 1.1).toFixed(2)} total
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
