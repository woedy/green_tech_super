import AgentShell from "@/components/layout/AgentShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { QuoteBuilderForm } from "@/components/quotes/QuoteBuilderForm";
import { EcoFeatureTemplates } from "@/components/quotes/EcoFeatureTemplates";
import { createQuote } from "@/lib/api";
import { Loader2, FileText, Sparkles } from "lucide-react";

type BuilderRow = {
  id: string;
  label: string;
  kind: "base" | "option" | "allowance" | "adjustment";
  quantity: number;
  unitCost: number;
  applyRegion: boolean;
};

interface EcoFeature {
  id: string;
  name: string;
  category: string;
  baseCost: number;
  sustainabilityPoints: number;
  description: string;
}

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
  const [notes, setNotes] = useState("This quote includes Ghana-specific pricing and eco-friendly features tailored to your region.");
  const [terms, setTerms] = useState("Quote valid for 30 days. 50% mobilization fee required. Final pricing subject to site inspection.");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [preparedBy, setPreparedBy] = useState("Green Tech Africa Agent");
  const [preparedByEmail, setPreparedByEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
    const generateId = () => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
    setRows([
      {
        id: generateId(),
        label: `${buildRequest.plan_details?.name ?? "Plan"} - Base Construction`,
        kind: "base",
        quantity: 1,
        unitCost: Number.isFinite(basePrice) ? basePrice : 0,
        applyRegion: true,
      },
    ]);
  }, [buildRequest]);

  const handleApplyTemplate = useCallback((features: EcoFeature[]) => {
    const generateId = () => crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
    const newRows: BuilderRow[] = features.map((feature) => ({
      id: generateId(),
      label: feature.name,
      kind: "option" as const,
      quantity: 1,
      unitCost: feature.baseCost,
      applyRegion: true,
    }));
    setRows((prev) => [...prev, ...newRows]);
    toast({
      title: "Template applied",
      description: `Added ${features.length} eco-features to the quote`,
    });
  }, [toast]);

  const handleSubmit = async () => {
    if (!requestId) {
      toast({ title: "Missing request", description: "Select a build request before creating a quote.", variant: "destructive" });
      return;
    }
    if (!rows.length) {
      toast({ title: "Add at least one line item", variant: "destructive" });
      return;
    }
    if (!recipientEmail) {
      toast({ title: "Missing recipient email", variant: "destructive" });
      return;
    }
    try {
      setIsSaving(true);
      const payload = {
        build_request: requestId,
        notes,
        terms,
        prepared_by_name: preparedBy,
        prepared_by_email: preparedByEmail || undefined,
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
      const data = await createQuote(payload);
      toast({ title: "Quote created successfully", description: `${data.reference} is ready to send to customer.` });
      navigate(`/quotes/${data.id}`);
    } catch (err) {
      toast({
        title: "Failed to create quote",
        description: err instanceof Error ? err.message : "Unexpected error",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

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
      <section className="py-6 bg-gradient-to-br from-background via-accent/10 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold">Create Quote</h1>
              </div>
              <div className="text-sm text-muted-foreground">
                {leadId && `Lead: ${leadId} • `}Request: {requestId}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={fetchBuildRequest} disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Refresh Data
              </Button>
              <Button onClick={handleSubmit} disabled={isSaving || !rows.length}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Quote
              </Button>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <section className="py-2">
          <div className="max-w-7xl mx-auto px-4 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        </section>
      )}

      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Build Plan</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div>
                    <span className="text-muted-foreground">Plan:</span>{" "}
                    <span className="font-semibold">{buildRequest?.plan_details?.name ?? "Loading…"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Base Price:</span>{" "}
                    <span className="font-semibold">{currency} {Number(buildRequest?.plan_details?.base_price ?? 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Region:</span>{" "}
                    <span className="font-semibold">{buildRequest?.region_details?.name ?? "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Multiplier:</span>{" "}
                    <span className="font-semibold">×{multiplier.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Customer Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="recipientName">Name</Label>
                    <Input
                      id="recipientName"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Customer name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recipientEmail">Email</Label>
                    <Input
                      id="recipientEmail"
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="customer@example.com"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="builder" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="builder">Quote Builder</TabsTrigger>
                <TabsTrigger value="templates">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Eco Templates
                </TabsTrigger>
              </TabsList>
              <TabsContent value="builder" className="mt-6">
                <QuoteBuilderForm
                  currency={currency}
                  regionalMultiplier={multiplier}
                  onItemsChange={setRows}
                  onNotesChange={setNotes}
                  onTermsChange={setTerms}
                  notes={notes}
                  terms={terms}
                />
              </TabsContent>
              <TabsContent value="templates" className="mt-6">
                <EcoFeatureTemplates
                  currency={currency}
                  regionalMultiplier={multiplier}
                  onApplyTemplate={handleApplyTemplate}
                />
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Agent Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="preparedBy">Prepared By</Label>
                  <Input
                    id="preparedBy"
                    value={preparedBy}
                    onChange={(e) => setPreparedBy(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preparedByEmail">Email (optional)</Label>
                  <Input
                    id="preparedByEmail"
                    type="email"
                    value={preparedByEmail}
                    onChange={(e) => setPreparedByEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

    </AgentShell>
  );
};

export default QuoteBuilder;
