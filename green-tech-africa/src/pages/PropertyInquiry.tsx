import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const PropertyInquiry = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Inquiry sent (demo)", description: `Property #${id}` });
    navigate("/account/messages");
  };

  return (
    <Layout>
      <section className="py-10 bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">Property Inquiry</h1>
          <Button variant="outline" asChild><Link to={`/properties/${id}`}>Back to Property</Link></Button>
        </div>
      </section>
      <section className="py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-medium">
            <CardHeader><CardTitle>Tell us about your interest</CardTitle></CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={submit}>
                <div>
                  <Label htmlFor="name">Your Name</Label>
                  <Input id="name" placeholder="Jane Doe" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="jane@example.com" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" placeholder="+254 700 000 000" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" placeholder="I’m interested in this property..." rows={4} />
                </div>
                <Button type="submit" className="w-full">Send Inquiry</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default PropertyInquiry;

