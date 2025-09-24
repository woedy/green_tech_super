import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSavedSearches, toggleAlerts, deleteSavedSearch, SavedSearch } from "@/lib/savedSearches";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const SavedSearches = () => {
  const [items, setItems] = useState<SavedSearch[]>([]);
  const navigate = useNavigate();
  useEffect(() => setItems(getSavedSearches()), []);

  const onToggle = (id: string) => setItems(toggleAlerts(id));
  const onDelete = (id: string) => setItems(deleteSavedSearch(id));
  const apply = (s: SavedSearch) => {
    const params = new URLSearchParams();
    const f = s.filters as any;
    if (f.q) params.set("q", f.q);
    if (f.type) params.set("type", f.type);
    if (f.location) params.set("location", f.location);
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <Layout>
      <section className="py-10 bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl md:text-3xl font-bold">Saved Searches</h1>
        </div>
      </section>
      <section className="py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          {items.map((s) => (
            <Card key={s.id} className="shadow-soft">
              <CardContent className="p-4 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-muted-foreground">{new Date(s.createdAt).toLocaleString()} • q: {(s.filters as any).q ?? '-'} • type: {(s.filters as any).type ?? 'all'} • location: {(s.filters as any).location ?? 'all'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={s.alerts ? 'default' : 'outline'}>{s.alerts ? 'Alerts On' : 'Alerts Off'}</Badge>
                  <Button variant="outline" size="sm" onClick={() => onToggle(s.id)}>{s.alerts ? 'Disable Alerts' : 'Enable Alerts'}</Button>
                  <Button variant="outline" size="sm" onClick={() => apply(s)}>Apply</Button>
                  <Button variant="outline" size="sm" onClick={() => onDelete(s.id)}>Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {items.length === 0 && (
            <Card><CardContent className="p-6 text-sm text-muted-foreground">No saved searches yet. Save from the <Link to="/properties" className="text-primary underline">properties</Link> page.</CardContent></Card>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default SavedSearches;

