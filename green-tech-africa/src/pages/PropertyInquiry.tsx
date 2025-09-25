import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useProperty } from "@/hooks/useProperties";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

const PropertyInquiry = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: property, isLoading } = useProperty(id);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    viewing: "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        property: property.id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        message: form.message,
        scheduled_viewing: form.viewing ? new Date(form.viewing).toISOString() : undefined,
      };
      return api.post("/api/properties/inquiries/", payload);
    },
    onSuccess: () => {
      toast({ title: "Inquiry sent", description: "We'll get back to you shortly." });
      navigate("/account/messages");
    },
    onError: (error: Error) => {
      toast({ title: "Inquiry failed", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading || !property) {
    return (
      <Layout>
        <section className="py-12 text-center text-muted-foreground">Loading property...</section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-10 bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Property Inquiry</h1>
            <p className="text-muted-foreground text-sm">{property.title}</p>
          </div>
          <Button variant="outline" asChild><Link to={`/properties/${property.slug}`}>Back to Property</Link></Button>
        </div>
      </section>
      <section className="py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-medium">
            <CardHeader><CardTitle>Tell us about your interest</CardTitle></CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}>
                <div>
                  <Label htmlFor="name">Your Name</Label>
                  <Input id="name" placeholder="Jane Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="jane@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" placeholder="+254 700 000 000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="viewing">Preferred viewing time</Label>
                  <Input id="viewing" type="datetime-local" value={form.viewing} onChange={(e) => setForm({ ...form, viewing: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" placeholder="I’m interested in this property..." rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                </div>
                <Button type="submit" className="w-full" disabled={mutation.isLoading}>
                  {mutation.isLoading ? "Sending..." : "Send Inquiry"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default PropertyInquiry;
