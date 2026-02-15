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
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { uploadBuildRequestFile, UploadedFileMeta } from "@/lib/uploads";
import { api } from "@/lib/api";
import { useMutation, useQuery } from "@tanstack/react-query";

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
  
  // Fetch regions from the plans filters endpoint (public, no auth required)
  const { data: filtersData } = useQuery({
    queryKey: ['plan-filters'],
    queryFn: () => api.get('/api/plans/filters/'),
  });
  
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

  // Calculate region options from filters data
  const regionOptions = useMemo(() => {
    if (!filtersData || !filtersData.regions || filtersData.regions.length === 0) {
      return [{ slug: "default", label: "Any region" }];
    }
    return filtersData.regions.map((region: any) => ({ 
      slug: region.slug, 
      label: region.name 
    }));
  }, [filtersData]);

  const buildRequestMutation = useMutation({
    mutationFn: async () => {
      if (!plan) throw new Error("Plan not found");
      
      // Determine the region to use
      const selectedRegion = form.region || regionOptions[0]?.slug;
      
      const payload = {
        plan: plan.slug,
        region: selectedRegion,
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
    onSuccess: (data) => {
      toast({ 
        title: "Request submitted successfully!", 
        description: "Our team will contact you shortly. Check your email for confirmation." 
      });
      navigate("/plans", { state: { requestSubmitted: true } });
    },
    onError: (error: Error) => {
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
    },
  });

  const next = () => {
    // Validate current step before proceeding
    if (step === 0) {
      if (!form.contactName || !form.contactEmail || !form.contactPhone) {
        toast({ 
          title: "Required fields missing", 
          description: "Please fill in all contact information", 
          variant: "destructive" 
        });
        return;
      }
      // Basic email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
        toast({ 
          title: "Invalid email", 
          description: "Please enter a valid email address", 
          variant: "destructive" 
        });
        return;
      }
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };
  
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const onFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    
    setUploading(true);
    const uploaded = [] as UploadedFileMeta[];
    const failed = [] as string[];
    
    for (const file of files) {
      try {
        const result = await uploadBuildRequestFile(file);
        uploaded.push(result);
      } catch (err) {
        console.error(`Failed to upload ${file.name}:`, err);
        failed.push(file.name);
      }
    }
    
    setAttachments((existing) => [...existing, ...uploaded]);
    setUploading(false);
    
    if (uploaded.length > 0) {
      toast({ 
        title: "Files uploaded", 
        description: `${uploaded.length} file(s) uploaded successfully` 
      });
    }
    
    if (failed.length > 0) {
      toast({ 
        title: "Some uploads failed", 
        description: `Failed to upload: ${failed.join(", ")}. You can continue without these files.`,
        variant: "destructive" 
      });
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
                      value={form.region || regionOptions[0]?.slug || "default"}
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
                  <Label htmlFor="files">Upload reference files (optional)</Label>
                  <Input id="files" type="file" multiple onChange={onFilePick} disabled={uploading} />
                  <div className="text-sm text-muted-foreground">
                    {uploading && "Uploading..."}
                    {!uploading && attachments.length > 0 && `${attachments.length} file(s): ${attachments.map((file) => file.original_name).join(", ")}`}
                    {!uploading && attachments.length === 0 && "No files uploaded. You can skip this step if you don't have files to attach."}
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
                  <Button onClick={() => buildRequestMutation.mutate()} disabled={buildRequestMutation.isPending || uploading}>
                    {buildRequestMutation.isPending ? "Submitting..." : "Submit Request"}
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
