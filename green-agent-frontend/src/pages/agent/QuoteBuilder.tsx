import AgentShell from "@/components/layout/AgentShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/ui/use-toast";

const KIND_OPTIONS = [
  { value: "base", label: "Base" },
  { value: "option", label: "Upgrade" },
  { value: "allowance", label: "Allowance" },
  { value: "adjustment", label: "Adjustment" },
] as const;

const id = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));

type BuilderRow = {
  id: string;
  label: string;
  kind: "base" | "option" | "allowance" | "adjustment";
  quantity: number;
  unitCost: number;
  applyRegion: boolean;
};

type BuildRequestDetail = {
  id: string;
  plan: string;
  region: string;
  contact_name: string;
  contact_email: string;
  plan_details: {
    name: string;
    base_price: string;
    options: { id: number; name: string; price_delta: string }[];
  };
  region_details: {
    name: string;
    slug: string;
    country: string;
    currency_code: string;
    cost_multiplier: string;
  };
};

const QuoteBuilder = () => {
  const [params] = useSearchParams();
  const requestId = params.get("request") ?? undefined;
  const leadId = params.get("lead") ?? undefined;
  const navigate = useNavigate();
  const { toast } = useToast();

  const [buildRequest, setBuildRequest] = useState<BuildRequestDetail | null>(null);
  const [rows, setRows] = useState<BuilderRow[]>([]);
  const [notes, setNotes] = useState("Includes standard solar package.");
  const [terms, setTerms] = useState("Valid for 30 days. 50% mobilization.");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [preparedBy, setPreparedBy] = useState("Green Tech Africa");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  const multiplier = useMemo(() => {
    if (!buildRequest) return 1;
    const parsed = parseFloat(buildRequest.region_details?.cost_multiplier ?? "1");
    return Number.isFinite(parsed) ? parsed : 1;
  }, [buildRequest]);

  const currency = buildRequest?.region_details?.currency_code ?? "USD";

  const fetchBuildRequest = useCallback(async () => {
    if (!requestId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/build-requests/${requestId}/`);
      if (!response.ok) {
        throw new Error(`Unable to load build request (${response.status})`);
      }
      const data = (await response.json()) as BuildRequestDetail;
      setBuildRequest(data);
      setRecipientName(data.contact_name);
      setRecipientEmail(data.contact_email);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load build request";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    if (requestId) {
      fetchBuildRequest();
    }
  }, [fetchBuildRequest, requestId]);

  useEffect(() => {
    if (!buildRequest || initializedRef.current) return;
    initializedRef.current = true;
    const basePrice = parseFloat(buildRequest.plan_details?.base_price ?? "0");
    setRows([
      {
        id: id(),
        label: `${buildRequest.plan_details?.name ?? "Plan"} base scope`,
        kind: "base",
        quantity: 1,
        unitCost: Number.isFinite(basePrice) ? basePrice : 0,
        applyRegion: true,
      },
    ]);
  }, [buildRequest]);

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: id(),
        label: "",
        kind: "option",
        quantity: 1,
        unitCost: 0,
        applyRegion: true,
      },
    ]);
  };

  const updateRow = (rowId: string, patch: Partial<BuilderRow>) => {
    setRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, ...patch } : row)));
  };

  const removeRow = (rowId: string) => {
    setRows((prev) => prev.filter((row) => row.id !== rowId));
  };

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        const base = row.quantity * row.unitCost;
        const total = row.applyRegion ? base * multiplier : base;
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
      { subtotal: 0, allowances: 0, adjustments: 0, total: 0 },
    );
  }, [rows, multiplier]);

  const handleSubmit = async () => {
    if (!requestId) {
      toast({ title: "Missing request", description: "Select a build request before creating a quote.", variant: "destructive" });
      return;
    }
    if (!rows.length) {
      toast({ title: "Add at least one line item", variant: "destructive" });
      return;
    }
    try {
      setIsLoading(true);
      const payload = {
        build_request: requestId,
        notes,
        terms,
        prepared_by_name: preparedBy,
        recipient_name: recipientName,
        recipient_email: recipientEmail,
        items: rows.map((row, index) => ({
          kind: row.kind,
          label: row.label || `${row.kind} item ${index + 1}`,
          quantity: row.quantity,
          unit_cost: row.unitCost,
          apply_region_multiplier: row.applyRegion,
          position: index,
        })),
      };
      const response = await fetch("/api/quotes/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || `Unable to create quote (${response.status})`);
      }
      const data = await response.json();
      toast({ title: "Quote created", description: `${data.reference} ready to send.` });
      navigate(`/quotes/${data.id}`);
    } catch (err) {
      toast({
        title: "Failed to create quote",
        description: err instanceof Error ? err.message : "Unexpected error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const previewTotals = useMemo(() => ({
    subtotal: totals.subtotal,
    allowances: totals.allowances,
    adjustments: totals.adjustments,
    total: totals.total,
  }), [totals]);

  if (!requestId) {
    return (
      <AgentShell>
        <section className="py-10">
          <div className="max-w-3xl mx-auto px-4 text-center text-muted-foreground">
            Provide a build request from the lead detail page to start a quote.
          </div>
        </section>
      </AgentShell>
    );
  }

  return (
    <AgentShell>
      <section className="py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Create Quote</h1>
            <div className="text-sm text-muted-foreground">Lead: {leadId ?? "—"} • Request: {requestId}</div>
          </div>
          <Button variant="outline" onClick={fetchBuildRequest} disabled={isLoading}>Refresh data</Button>
        </div>
      </section>

      {error && (
        <section className="py-2">
          <div className="max-w-6xl mx-auto px-4 text-sm text-destructive">{error}</div>
        </section>
      )}

      <section className="py-2">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Plan</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <div className="font-semibold">{buildRequest?.plan_details?.name ?? "Loading…"}</div>
              <div>Base price: {currency} {Number(buildRequest?.plan_details?.base_price ?? 0).toLocaleString()}</div>
              <div>Region multiplier: ×{multiplier.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <div>{buildRequest?.contact_name}</div>
              <div className="text-muted-foreground">{buildRequest?.contact_email}</div>
              <div className="text-muted-foreground">Currency: {currency}</div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Line items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {rows.map((row) => (
                <div key={row.id} className="grid gap-3 md:grid-cols-12 md:items-end">
                  <div className="md:col-span-4 space-y-2">
                    <Label>Label</Label>
                    <Input value={row.label} onChange={(event) => updateRow(row.id, { label: event.target.value })} placeholder="Describe the work" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Kind</Label>
                    <Select value={row.kind} onValueChange={(value) => updateRow(row.id, { kind: value as BuilderRow["kind"] })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {KIND_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Quantity</Label>
                    <Input type="number" min={0} step={0.01} value={row.quantity} onChange={(event) => updateRow(row.id, { quantity: Number(event.target.value) })} />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Unit cost ({currency})</Label>
                    <Input type="number" min={0} step={0.01} value={row.unitCost} onChange={(event) => updateRow(row.id, { unitCost: Number(event.target.value) })} />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="flex items-center justify-between">Apply region multiplier<Switch checked={row.applyRegion} onCheckedChange={(checked) => updateRow(row.id, { applyRegion: checked })} /></Label>
                    <div className="text-xs text-muted-foreground">Totals adjust by ×{multiplier.toFixed(2)}</div>
                  </div>
                  <div className="md:col-span-12 flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => removeRow(row.id)}>Remove</Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addRow}>Add line item</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Summary & Notes</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Recipient name</Label>
                <Input value={recipientName} onChange={(event) => setRecipientName(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Recipient email</Label>
                <Input value={recipientEmail} onChange={(event) => setRecipientEmail(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Prepared by</Label>
                <Input value={preparedBy} onChange={(event) => setPreparedBy(event.target.value)} />
              </div>
              <div />
              <div className="md:col-span-2 space-y-2">
                <Label>Internal notes</Label>
                <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Terms</Label>
                <Textarea value={terms} onChange={(event) => setTerms(event.target.value)} rows={4} />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Preview</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Quote preview</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 text-sm">
                  <div>Subtotal: {currency} {previewTotals.subtotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  <div>Allowances: {currency} {previewTotals.allowances.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  <div>Adjustments: {currency} {previewTotals.adjustments.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  <div className="font-semibold">Total: {currency} {previewTotals.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  <div className="pt-2 text-muted-foreground">{notes}</div>
                  <div className="text-muted-foreground">{terms}</div>
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={handleSubmit} disabled={isLoading}>Create quote</Button>
          </div>
        </div>
      </section>
    </AgentShell>
  );
};

export default QuoteBuilder;
