import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ClipboardList, Download, FileText } from "lucide-react";

const MOCK = {
  id: "REQ-1024",
  plan: {
    name: "Green Valley Villa",
    slug: "green-valley-villa",
    style: "Modern",
    beds: 4,
    baths: 3,
    floors: 2,
    areaSqm: 320,
  },
  region: "KE-Nairobi",
  budgetRange: "USD 120,000 - 150,000",
  timeline: "Q2 2025",
  options: [
    { name: "Solar package", priceDelta: 6000 },
    { name: "Rainwater harvesting", priceDelta: 2500 },
  ],
  customizations: "Increase kitchen island, add skylight in stairwell",
  files: [
    { name: "site-photos.zip", size: "4.2MB" },
  ],
  submittedAt: "2025-03-10",
  status: "in_review",
} as const;

const RequestDetail = () => {
  const { id } = useParams();
  const data = { ...MOCK, id: id ?? MOCK.id };

  return (
    <Layout>
      <section className="py-10 bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-6 h-6" />
              <h1 className="text-2xl md:text-3xl font-bold">Request {data.id}</h1>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/account/requests">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Requests
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Plan & Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{data.plan.name}</div>
                  <Badge variant="secondary">{data.status}</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><Label className="text-muted-foreground">Style</Label><div>{data.plan.style}</div></div>
                  <div><Label className="text-muted-foreground">Beds</Label><div>{data.plan.beds}</div></div>
                  <div><Label className="text-muted-foreground">Baths</Label><div>{data.plan.baths}</div></div>
                  <div><Label className="text-muted-foreground">Area</Label><div>{data.plan.areaSqm} sqm</div></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Region</Label>
                    <div>{data.region}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Timeline</Label>
                    <div>{data.timeline}</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Budget</Label>
                    <div>{data.budgetRange}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Submitted</Label>
                    <div>{data.submittedAt}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Selected Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {data.options.map((o, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-md bg-muted/30">
                    <div>{o.name}</div>
                    <div>+ ${o.priceDelta.toLocaleString()}</div>
                  </div>
                ))}
                {data.options.length === 0 && (
                  <div className="text-muted-foreground">No options selected.</div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Customizations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{data.customizations}</p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Files</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-md bg-muted/30 text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" /> {f.name}
                    </div>
                    <div className="text-muted-foreground">{f.size}</div>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-2">
                  <Download className="w-4 h-4 mr-2" /> Download All
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>- Our team reviews your request (1-2 business days)</div>
                <div>- You will receive a quote via email and here in your dashboard</div>
                <div>- Chat and schedule site visits after quote stage</div>
                <Button className="w-full mt-3" asChild>
                  <Link to="/account/quotes">View Quotes</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default RequestDetail;

