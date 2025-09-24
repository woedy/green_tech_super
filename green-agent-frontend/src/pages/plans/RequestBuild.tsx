import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useParams, useNavigate, Link } from "react-router-dom";
import { PLANS } from "@/mocks/plans";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

type FormState = {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  region: string;
  budget: string;
  timeline: string;
  options: string[];
  customizations: string;
  files: string[];
};

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
  const { slug } = useParams();
  const plan = PLANS.find((p) => p.slug === slug) ?? PLANS[0];
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    region: plan.regionsAvailable[0] ?? "",
    budget: "",
    timeline: "",
    options: [],
    customizations: "",
    files: [],
  });

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const onFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []).map((f) => f.name);
    setForm((f) => ({ ...f, files: list }));
  };

  const onToggleOption = (name: string, checked: boolean) => {
    setForm((f) => ({
      ...f,
      options: checked ? Array.from(new Set([...(f.options ?? []), name])) : (f.options ?? []).filter((x) => x !== name),
    }));
  };

  const submit = () => {
    toast({ title: "Request submitted (placeholder)", description: `${plan.name} • ${form.region}` });
    navigate("/account/requests");
  };

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
          {/* Stepper */}
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
                    <Select value={form.region} onValueChange={(v) => setForm({ ...form, region: v })}>
                      <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                      <SelectContent>
                        {plan.regionsAvailable.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="budget">Budget range</Label>
                    <Input id="budget" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="USD 100,000 - 150,000" />
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
                  {plan.options.map((o) => (
                    <div key={o.name} className="flex items-center space-x-2">
                      <Checkbox id={o.name} checked={form.options.includes(o.name)} onCheckedChange={(v) => onToggleOption(o.name, Boolean(v))} />
                      <Label htmlFor={o.name}>{o.name} <span className="text-muted-foreground">(+ ${o.priceDelta.toLocaleString()})</span></Label>
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
                  <Label htmlFor="files">Upload reference files (not uploaded in demo)</Label>
                  <Input id="files" type="file" multiple onChange={onFilePick} />
                  <div className="text-sm text-muted-foreground">Selected: {form.files.length > 0 ? form.files.join(", ") : "None"}</div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-3 text-sm">
                  <div className="font-medium">Review</div>
                  <div>Plan: {plan.name}</div>
                  <div>Contact: {form.contactName} • {form.contactEmail} • {form.contactPhone}</div>
                  <div>Region: {form.region}</div>
                  <div>Budget: {form.budget}</div>
                  <div>Timeline: {form.timeline}</div>
                  <div>Options: {form.options.join(", ") || "None"}</div>
                  <div>Customizations: {form.customizations || "None"}</div>
                  <div>Files: {form.files.join(", ") || "None"}</div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" onClick={prev} disabled={step === 0}>Back</Button>
                {step < steps.length - 1 ? (
                  <Button onClick={next}>Next</Button>
                ) : (
                  <Button onClick={submit}>Submit Request</Button>
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

