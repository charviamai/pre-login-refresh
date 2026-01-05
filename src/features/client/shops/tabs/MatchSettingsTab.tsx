import React, { useState, useEffect } from 'react';
import { Button, Card, Input, Switch, CardSection, CardRow, CardLabel } from '../../../../shared/components/ui';

interface MatchItem {
  id: number;
  amount: number;
}

interface MatchSettingsTabProps {
  matchItems: number[];
  matchMinItems: number;
  matchAllowCustomAmount: boolean;
  matchCustomMultiplier: number;
  matchCustomAmountMin: number;
  matchCustomAmountMax: number;
  matchCooldownHours: number;
  matchVerificationRequired: boolean;
  resetCooldownOnOpen?: boolean;
  onSave: (settings: {
    match_items: number[];
    match_min_items: number;
    match_allow_custom_amount: boolean;
    match_custom_multiplier: number;
    match_custom_amount_min: number;
    match_custom_amount_max: number;
    match_cooldown_hours: number;
    match_verification_required: boolean;
    reset_cooldown_on_open: boolean;
  }) => void;
  saving?: boolean;
}

const DEFAULT_ITEMS = [5, 10, 20, 30];

export const MatchSettingsTab: React.FC<MatchSettingsTabProps> = ({
  matchItems = DEFAULT_ITEMS,
  matchMinItems = 4,
  matchAllowCustomAmount = false,
  matchCustomMultiplier = 5,
  matchCustomAmountMin = 5,
  matchCustomAmountMax = 500,
  matchCooldownHours = 8,
  matchVerificationRequired = true,
  resetCooldownOnOpen: initialResetCooldownOnOpen = true,
  onSave,
  saving = false,
}) => {
  // Local state for editing
  const [items, setItems] = useState<MatchItem[]>(() =>
    (matchItems.length > 0 ? matchItems : DEFAULT_ITEMS).map((amount, idx) => ({
      id: idx,
      amount,
    }))
  );
  const [minItems] = useState(matchMinItems);
  const [allowCustom, setAllowCustom] = useState(matchAllowCustomAmount);
  const [multiplier, setMultiplier] = useState(matchCustomMultiplier);
  const [customMin, setCustomMin] = useState(matchCustomAmountMin);
  const [customMax, setCustomMax] = useState(matchCustomAmountMax);
  const [cooldownHours, setCooldownHours] = useState(matchCooldownHours);
  const [verificationRequired, setVerificationRequired] = useState(matchVerificationRequired);
  const [resetCooldownOnOpen, setResetCooldownOnOpen] = useState(initialResetCooldownOnOpen);
  const [nextId, setNextId] = useState(matchItems.length || DEFAULT_ITEMS.length);

  // Sync with props when they change
  useEffect(() => {
    const newItems = (matchItems.length > 0 ? matchItems : DEFAULT_ITEMS).map((amount, idx) => ({
      id: idx,
      amount,
    }));
    setItems(newItems);
    setNextId(newItems.length);
  }, [matchItems]);

  const handleAddItem = () => {
    const lastAmount = items.length > 0 ? items[items.length - 1].amount : 0;
    setItems([...items, { id: nextId, amount: lastAmount + 10 }]);
    setNextId(nextId + 1);
  };

  const handleRemoveItem = (id: number) => {
    if (items.length <= minItems) return;
    setItems(items.filter((item) => item.id !== id));
  };

  const handleAmountChange = (id: number, value: string) => {
    const numValue = parseInt(value, 10) || 0;
    setItems(items.map((item) => (item.id === id ? { ...item, amount: numValue } : item)));
  };

  const handleReset = () => {
    const defaultItems = DEFAULT_ITEMS.map((amount, idx) => ({ id: idx, amount }));
    setItems(defaultItems);
    setNextId(DEFAULT_ITEMS.length);
    setAllowCustom(false);
    setMultiplier(5);
    setCustomMin(5);
    setCustomMax(500);
    setCooldownHours(8);
    setCooldownHours(8);
    setVerificationRequired(true);
    setResetCooldownOnOpen(true);
  };

  const handleSave = () => {
    onSave({
      match_items: items.map((item) => item.amount).filter((a) => a > 0),
      match_min_items: minItems,
      match_allow_custom_amount: allowCustom,
      match_custom_multiplier: multiplier,
      match_custom_amount_min: customMin,
      match_custom_amount_max: customMax,
      match_cooldown_hours: cooldownHours,
      match_verification_required: verificationRequired,
      reset_cooldown_on_open: resetCooldownOnOpen,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Configuration Panel */}
      <Card>
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex justify-between items-center">
            <CardLabel as="h3" className="text-sm font-semibold uppercase tracking-wide">Match Amount Options</CardLabel>
            <Button onClick={handleSave} loading={saving} size="sm">
              Save
            </Button>
          </div>


          {/* Match Items */}
          {items.map((item, idx) => (
            <CardRow
              key={item.id}
              className="flex items-center gap-4"
            >
              <CardLabel className="text-sm font-medium whitespace-nowrap">
                Match {idx + 1}
              </CardLabel>
              <div className="flex-1">
                <Input
                  type="number"
                  value={item.amount.toString()}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAmountChange(item.id, e.target.value)}
                  min={1}
                  fullWidth
                />
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleRemoveItem(item.id)}
                disabled={items.length <= minItems}
                className="text-xs"
              >
                Remove
              </Button>
            </CardRow>
          ))}

          {/* Add & Reset Buttons */}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleAddItem} className="flex-1">
              + Add Match Item
            </Button>
            <Button variant="secondary" onClick={handleReset}>
              Reset
            </Button>
          </div>

          {/* Custom Amount Section */}
          <CardSection className="mt-4">
            <Switch
              checked={allowCustom}
              onChange={setAllowCustom}
              label="Enable Custom Amount"
            />
            {allowCustom && (
              <div className="mt-4 space-y-3">
                <Input
                  type="number"
                  label="Multiplier"
                  value={multiplier.toString()}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMultiplier(parseInt(e.target.value, 10) || 5)}
                  helperText={`Customers can enter multiples of ${multiplier}`}
                  min={1}
                  fullWidth
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    label="Min"
                    value={customMin.toString()}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomMin(parseInt(e.target.value, 10) || 5)}
                    min={1}
                    fullWidth
                  />
                  <Input
                    type="number"
                    label="Max"
                    value={customMax.toString()}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomMax(parseInt(e.target.value, 10) || 500)}
                    min={1}
                    fullWidth
                  />
                </div>
              </div>
            )}
          </CardSection>

          {/* Cooldown & Verification */}
          <CardSection className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="flex-1">
                <Input
                  type="number"
                  label="Play Cooldown (hours)"
                  value={cooldownHours.toString()}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCooldownHours(parseInt(e.target.value, 10) || 0)}
                  min={0}
                  max={168}
                  helperText="How often each customer can play (0 = no cooldown)"
                  fullWidth
                />
              </div>
              <div className="pt-8">
                <Switch
                  checked={resetCooldownOnOpen}
                  onChange={setResetCooldownOnOpen}
                  label="Reset on Shop Open"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-slate-600">
              <Switch
                checked={verificationRequired}
                onChange={setVerificationRequired}
                label="Require Employee Approval"
              />
              <CardLabel as="p" className="text-xs mt-2">
                {verificationRequired
                  ? 'Customer tickets must be scanned by an employee before payout'
                  : 'Tickets are automatically approved without employee verification'}
              </CardLabel>
            </div>
          </CardSection>

          {/* Bottom Save Button */}
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} loading={saving}>
              Save Match Settings
            </Button>
          </div>
        </div>
      </Card>

      {/* Right: Live Kiosk Preview */}
      <Card>
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <CardLabel as="h3" className="text-sm font-semibold uppercase tracking-wide">Customer Preview</CardLabel>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs text-green-600">Live</span>
            </div>
          </div>

          <div className="bg-gray-950 rounded-xl border border-gray-700 p-6">
            <div className="text-center mb-4">
              <span className="text-xs text-gray-500">Kiosk Preview</span>
            </div>

            <h2 className="text-xl font-bold text-white mb-2">Select Your Match Amount</h2>
            <p className="text-sm text-gray-400 mb-6">
              This is how customers will see the options on the kiosk screen.
            </p>

            {/* Amount Buttons Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {items
                .filter((item) => item.amount > 0)
                .map((item) => (
                  <div
                    key={item.id}
                    className="bg-gradient-to-br from-blue-900/60 to-blue-800/40 border border-blue-600/50 rounded-xl p-4 text-center hover:border-blue-400 transition-colors"
                  >
                    <div className="text-2xl font-bold text-blue-300">${item.amount}</div>
                    <div className="text-xs text-gray-400 mt-1">Match Option</div>
                  </div>
                ))}
            </div>

            {/* Custom Amount Preview */}
            {allowCustom && (
              <div className="bg-gray-800/50 rounded-xl border border-gray-600 p-4 mt-4">
                <div className="text-sm font-medium text-gray-300 mb-3">
                  Custom Amount (multiples of {multiplier})
                </div>
                <div className="flex items-center justify-center gap-3">
                  <button className="w-10 h-10 rounded-lg bg-gray-700 text-white font-bold hover:bg-gray-600">
                    -{multiplier}
                  </button>
                  <div className="flex-1 max-w-[120px]">
                    <div className="bg-gray-700 rounded-lg px-4 py-2 text-center text-xl font-bold text-white">
                      ${customMin}
                    </div>
                  </div>
                  <button className="w-10 h-10 rounded-lg bg-gray-700 text-white font-bold hover:bg-gray-600">
                    +{multiplier}
                  </button>
                </div>
                <div className="text-xs text-gray-500 text-center mt-2">
                  Min: ${customMin} • Max: ${customMax}
                </div>
              </div>
            )}
          </div>

          {/* Read-only indicator */}
          <div className="text-center mt-4 text-xs text-gray-500">
            Read-only preview
          </div>
        </div>
      </Card>
    </div>
  );
};
