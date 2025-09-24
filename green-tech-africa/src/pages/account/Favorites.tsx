import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PROPERTIES } from "@/mocks/properties";
import { getFavorites, toggleFavorite } from "@/lib/favorites";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Favorites = () => {
  const [favIds, setFavIds] = useState<number[]>([]);
  useEffect(() => setFavIds(getFavorites()), []);

  const items = PROPERTIES.filter((p) => favIds.includes(p.id));

  const remove = (id: number) => setFavIds(toggleFavorite(id));

  return (
    <Layout>
      <section className="py-10 bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl md:text-3xl font-bold">Saved Properties</h1>
        </div>
      </section>
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((p) => (
            <Card key={p.id} className="overflow-hidden shadow-medium">
              <div className="relative">
                <img src={p.image} alt={p.title} className="w-full h-44 object-cover" />
                <div className="absolute top-4 left-4"><Badge variant="secondary">{p.type}</Badge></div>
                <div className="absolute top-4 right-4">
                  <Button size="icon" variant="ghost" className="bg-background/80" onClick={() => remove(p.id)}>
                    <Heart className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-1">{p.title}</h3>
                <div className="text-sm text-muted-foreground mb-2">{p.location.city}, {p.location.country}</div>
                <div className="font-medium mb-4">{p.price}</div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" className="flex-1"><Link to={`/properties/${p.id}`}>View</Link></Button>
                  <Button asChild className="flex-1"><Link to="/account/messages">Contact Agent</Link></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {items.length === 0 && (
            <div className="text-muted-foreground">No saved properties yet. Browse <Link to="/properties" className="text-primary underline">properties</Link> and tap the heart to save.</div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Favorites;

