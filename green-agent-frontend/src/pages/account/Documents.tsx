import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

const DOCS = [
  { id: "DOC-1001", name: "Quote QUO-551.pdf", type: "Quote", uploadedAt: "2025-03-09" },
  { id: "DOC-1002", name: "Permit-application.pdf", type: "Permit", uploadedAt: "2025-03-07" },
];

const Documents = () => {
  return (
    <Layout>
      <section className="py-10 bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl md:text-3xl font-bold">Documents</h1>
        </div>
      </section>
      <section className="py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          {DOCS.map((d) => (
            <Card key={d.id} className="shadow-soft">
              <CardContent className="p-4 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4" />
                  <div>
                    <div className="font-medium">{d.name}</div>
                    <div className="text-muted-foreground">{d.type} • uploaded {d.uploadedAt}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Download</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {DOCS.length === 0 && (
            <Card><CardContent className="p-6 text-sm text-muted-foreground">No documents yet.</CardContent></Card>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Documents;

