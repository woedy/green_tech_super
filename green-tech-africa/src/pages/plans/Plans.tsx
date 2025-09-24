import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PLANS } from "@/mocks/plans";
import { Search, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";

const Plans = () => {
  const [q, setQ] = useState("");
  const [style, setStyle] = useState("all");
  const [beds, setBeds] = useState("all");

  const filtered = useMemo(() => {
    return PLANS.filter((p) => {
      const matchesQ = q ? p.name.toLowerCase().includes(q.toLowerCase()) : true;
      const matchesStyle = style === "all" || p.style === style;
      const matchesBeds = beds === "all" || p.beds === Number(beds);
      return matchesQ && matchesStyle && matchesBeds;
    });
  }, [q, style, beds]);

  return (
    <Layout>
      <section className="relative py-16 bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Building Plans</h1>
            <p className="text-muted-foreground text-lg">Explore modern, efficient designs. Start a request with one click.</p>
          </div>
        </div>
      </section>

      <section className="py-8 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" placeholder="Search plans..." />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Style" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Styles</SelectItem>
                  <SelectItem value="Modern">Modern</SelectItem>
                  <SelectItem value="Contemporary">Contemporary</SelectItem>
                  <SelectItem value="Bungalow">Bungalow</SelectItem>
                </SelectContent>
              </Select>
              <Select value={beds} onValueChange={setBeds}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Bedrooms" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Beds</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon"><Filter className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((p) => (
            <Card key={p.id} className="overflow-hidden shadow-medium hover-lift smooth-transition group">
              <div className="relative overflow-hidden">
                <img src={p.heroImage} alt={p.name} className="w-full h-44 object-cover group-hover:scale-105 smooth-transition" />
                <div className="absolute top-4 left-4">
                  <Badge variant="secondary">{p.style}</Badge>
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-1 group-hover:text-primary smooth-transition">{p.name}</h3>
                <div className="text-sm text-muted-foreground mb-3">{p.beds} beds • {p.baths} baths • {p.areaSqm} sqm</div>
                <div className="font-medium mb-4">Starting at ${p.basePrice.toLocaleString()}</div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" className="flex-1">
                    <Link to={`/plans/${p.slug}`}>View Details</Link>
                  </Button>
                  <Button asChild className="flex-1">
                    <Link to={`/plans/${p.slug}/request`}>Request to Build</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="text-muted-foreground">No plans match your filters.</div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Plans;

