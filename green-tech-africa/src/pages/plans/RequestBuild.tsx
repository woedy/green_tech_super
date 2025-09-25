import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useParams, useNavigate, Link } from "react-router-dom";
import { usePlan } from "@/hooks/usePlans";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { uploadBuildRequestFile, UploadedFileMeta } from "@/lib/uploads";
import { api } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";

const steps = [
  "Contact",
  "Region",
  "Budget",
  "Timeline",
  "Options",
  "Uploads",
  "Review",
] as const;

const RequestBuild = () => {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: plan, isLoading } = usePlan(slug, { enabled: Boolean(slug) });
  const [step, setStep] = useState(0);
  const [attachments, setAttachments] = useState<UploadedFileMeta[]>([]);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    region: "",
    budgetMin: "",
    budgetMax: "",
    timeline: "",
    options: [] as string[],
    customizations: "",
  });

  const buildRequestMutation = useMutation({
    mutationFn: async () => {
      if (!plan) throw new Error("Plan not found");
      const payload = {
        plan: plan.slug,
        region: form.region || plan.regional_estimates[0]?.region_slug,
        contact_name: form.contactName,
        contact_email: form.contactEmail,
        contact_phone: form.contactPhone,
        budget_currency: plan.base_currency,
        budget_min: form.budgetMin || undefined,
        budget_max: form.budgetMax || undefined,
        timeline: form.timeline,
        customizations: form.customizations,
        options: form.options,
        attachments,
      };
      return api.post("/api/build-requests/", payload);
    },
    onSuccess: () => {
      toast({ title: "Request submitted", description: "Our team will contact you shortly." });
      navigate("/account/requests");
    },
    onError: (error: Error) => {
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
    },
  });

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const onFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    try {
      setUploading(true);
      const uploaded = [] as UploadedFileMeta[];
      for (const file of files) {
        const result = await uploadBuildRequestFile(file);
        uploaded.push(result);
      }
      setAttachments((existing) => [...existing, ...uploaded]);
      toast({ title: "Files uploaded", description: `${uploaded.length} file(s) ready` });
    } catch (err) {
      toast({ title: "Upload failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const onToggleOption = (name: string, checked: boolean) => {
    setForm((f) => ({
      ...f,
      options: checked ? Array.from(new Set([...(f.options ?? []), name])) : (f.options ?? []).filter((x) => x !== name),
    }));
  };

  if (isLoading || !plan) {
    return (
      <Layout>
        <section className="py-12 text-center text-muted-foreground">Loading plan...</section>
      </Layout>
    );
  }

  const regionOptions = plan.regional_estimates.length
    ? plan.regional_estimates.map((estimate) => ({ slug: estimate.region_slug, label: estimate.region_name }))
    : [{ slug: "", label: "Any region" }];

  return (
    <Layout>
      <section className="py-10 bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Request to Build</h1>
              <div className="text-muted-foreground">{plan.name}</div>
            </div>
            <Button variant="outline" asChild>
              <Link to={`/plans/${plan.slug}`}>Back to plan</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            {steps.map((s, i) => (
              <div key={s} className={`flex-1 h-1 mx-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>

          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Step {step + 1} of {steps.length}: {steps[step]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {step === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactName">Full Name</Label>
                    <Input id="contactName" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} placeholder="Jane Doe" />
                  </div>
                  <div>
                    <Label htmlFor="contactEmail">Email</Label>
                    <Input id="contactEmail" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} placeholder="jane@example.com" />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="contactPhone">Phone</Label>
                    <Input id="contactPhone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="+254 700 000 000" />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Region</Label>
                    <Select
                      value={form.region || plan.regional_estimates[0]?.region_slug}
                      onValueChange={(value) => setForm({ ...form, region: value })}
                    >
                      <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                      <SelectContent>
                        {regionOptions.map((option) => (
                          <SelectItem key={option.slug} value={option.slug}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="budgetMin">Budget min</Label>
                    <Input id="budgetMin" type="number" value={form.budgetMin} onChange={(e) => setForm({ ...form, budgetMin: e.target.value })} placeholder="150000" />
                  </div>
                  <div>
                    <Label htmlFor="budgetMax">Budget max</Label>
                    <Input id="budgetMax" type="number" value={form.budgetMax} onChange={(e) => setForm({ ...form, budgetMax: e.target.value })} placeholder="220000" />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="timeline">Timeline</Label>
                    <Input id="timeline" value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value })} placeholder="Q2 2025" />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground">Select options</div>
                  {plan.options.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox id={option.name} checked={form.options.includes(option.name)} onCheckedChange={(v) => onToggleOption(option.name, Boolean(v))} />
                      <Label htmlFor={option.name}>{option.name} <span className="text-muted-foreground">(+ {plan.base_currency} {Number(option.price_delta).toLocaleString()})</span></Label>
                    </div>
                  ))}
                  <div className="pt-2">
                    <Label htmlFor="customizations">Customizations</Label>
                    <Textarea id="customizations" value={form.customizations} onChange={(e) => setForm({ ...form, customizations: e.target.value })} placeholder="Describe any changes you want..." rows={4} />
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-3">
                  <Label htmlFor="files">Upload reference files</Label>
                  <Input id="files" type="file" multiple onChange={onFilePick} disabled={uploading} />
                  <div className="text-sm text-muted-foreground">
                    {attachments.length > 0 ? attachments.map((file) => file.original_name).join(", ") : "No files uploaded"}
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-3 text-sm">
                  <div className="font-medium">Review</div>
                  <div>Plan: {plan.name}</div>
                  <div>Contact: {form.contactName || "-"} • {form.contactEmail || "-"} • {form.contactPhone || "-"}</div>
                  <div>Region: {regionOptions.find((r) => r.slug === form.region)?.label ?? regionOptions[0]?.label}</div>
                  <div>Budget: {plan.base_currency} {form.budgetMin || "-"} - {form.budgetMax || "-"}</div>
                  <div>Timeline: {form.timeline || "-"}</div>
                  <div>Options: {form.options.join(", ") || "None"}</div>
                  <div>Customizations: {form.customizations || "None"}</div>
                  <div>Files: {attachments.map((file) => file.original_name).join(", ") || "None"}</div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" onClick={prev} disabled={step === 0}>Back</Button>
                {step < steps.length - 1 ? (
                  <Button onClick={next}>Next</Button>
                ) : (
                  <Button onClick={() => buildRequestMutation.mutate()} disabled={buildRequestMutation.isLoading || uploading}>
                    {buildRequestMutation.isLoading ? "Submitting..." : "Submit Request"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default RequestBuild;
