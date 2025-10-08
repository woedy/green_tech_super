import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Sparkles } from "lucide-react";
import { QuoteLineItem } from "@/types/quote";

const KIND_OPTIONS = [
  { value: "base", label: "Base Scope" },
  { value: "option", label: "Optional Upgrade" },
  { value: "allowance", label: "Allowance" },
  { value: "adjustment", label: "Adjustment" },
] as const;

type BuilderRow = {
  id: string;
  label: string;
  kind: "base" | "option" | "allowance" | "adjustment";
  quantity: number;
  unitCost: number;
  applyRegion: boolean;
};

interface QuoteBuilderFormProps {
  initialItems?: QuoteLineItem[];
  currency: string;
  regionalMultiplier: number;
  onItemsChange: (items: BuilderRow[]) => void;
  onNotesChange: (notes: string) => void;
  onTermsChange: (terms: string) => void;
  notes: string;
  terms: string;
}

const generateId = () => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);

export function QuoteBuilderForm({
  initialItems = [],
  currency,
  regionalMultiplier,
  onItemsChange,
  onNotesChange,
  onTermsChange,
  notes,
  terms,
}: QuoteBuilderFormProps) {
  const [rows, setRows] = useState<BuilderRow[]>(() => {
    if (initialItems.length > 0) {
      return initialItems.map((item) => ({
        id: item.id,
        label: item.label,
        kind: item.kind,
        quantity: item.quantity,
        unitCost: item.unit_cost,
        applyRegion: item.apply_region_multiplier,
      }));
    }
    return [];
  });

  const addRow = useCallback(() => {
    const newRow: BuilderRow = {
      id: generateId(),
      label: "",
      kind: "option",
      quantity: 1,
      unitCost: 0,
      applyRegion: true,
    };
    const updated = [...rows, newRow];
    setRows(updated);
    onItemsChange(updated);
  }, [rows, onItemsChange]);

  const updateRow = useCallback(
    (rowId: string, patch: Partial<BuilderRow>) => {
      const updated = rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row));
      setRows(updated);
      onItemsChange(updated);
    },
    [rows, onItemsChange]
  );

  const removeRow = useCallback(
    (rowId: string) => {
      const updated = rows.filter((row) => row.id !== rowId);
      setRows(updated);
      onItemsChange(updated);
    },
    [rows, onItemsChange]
  );

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        const base = row.quantity * row.unitCost;
        const total = row.applyRegion ? base * regionalMultiplier : base;
        if (row.kind === "allowance") {
          acc.allowances += total;
        } else if (row.kind === "adjustment") {
          acc.adjustments += total;
        } else {
          acc.subtotal += total;
        }
        acc.total = acc.subtotal + acc.allowances + acc.adjustments;
        return acc;
      },
      { subtotal: 0, allowances: 0, adjustments: 0, total: 0 }
    );
  }, [rows, regionalMultiplier]);

  const formatCurrency = (amount: number) => {
    return `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Line Items</CardTitle>
          <Badge variant="outline">
            Regional Multiplier: ×{regionalMultiplier.toFixed(2)}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No line items yet. Add items or use a template to get started.</p>
            </div>
          )}
          {rows.map((row, index) => (
            <div key={row.id} className="border rounded-lg p-4 space-y-3">
              <div className="grid gap-3 md:grid-cols-12">
                <div className="md:col-span-5 space-y-2">
                  <Label htmlFor={`label-${row.id}`}>Description</Label>
                  <Input
                    id={`label-${row.id}`}
                    value={row.label}
                    onChange={(e) => updateRow(row.id, { label: e.target.value })}
                    placeholder="Describe the work or item"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor={`kind-${row.id}`}>Type</Label>
                  <Select
                    value={row.kind}
                    onValueChange={(value) => updateRow(row.id, { kind: value as BuilderRow["kind"] })}
                  >
                    <SelectTrigger id={`kind-${row.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KIND_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor={`quantity-${row.id}`}>Quantity</Label>
                  <Input
                    id={`quantity-${row.id}`}
                    type="number"
                    min={0}
                    step={0.01}
                    value={row.quantity}
                    onChange={(e) => updateRow(row.id, { quantity: Number(e.target.value) })}
                  />
                </div>
                <div className="md:col-span-3 space-y-2">
                  <Label htmlFor={`unitCost-${row.id}`}>Unit Cost ({currency})</Label>
                  <Input
                    id={`unitCost-${row.id}`}
                    type="number"
                    min={0}
                    step={0.01}
                    value={row.unitCost}
                    onChange={(e) => updateRow(row.id, { unitCost: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id={`applyRegion-${row.id}`}
                    checked={row.applyRegion}
                    onCheckedChange={(checked) => updateRow(row.id, { applyRegion: checked })}
                  />
                  <Label htmlFor={`applyRegion-${row.id}`} className="text-sm">
                    Apply regional multiplier
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    Total: {formatCurrency(row.quantity * row.unitCost * (row.applyRegion ? regionalMultiplier : 1))}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRow(row.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={addRow} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Line Item
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quote Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Allowances</span>
            <span>{formatCurrency(totals.allowances)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Adjustments</span>
            <span>{formatCurrency(totals.adjustments)}</span>
          </div>
          <div className="flex justify-between font-semibold text-lg pt-2 border-t">
            <span>Total</span>
            <span>{formatCurrency(totals.total)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes & Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={4}
              placeholder="Add internal notes about this quote..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="terms">Terms & Conditions</Label>
            <Textarea
              id="terms"
              value={terms}
              onChange={(e) => onTermsChange(e.target.value)}
              rows={4}
              placeholder="Enter terms and conditions for the customer..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
