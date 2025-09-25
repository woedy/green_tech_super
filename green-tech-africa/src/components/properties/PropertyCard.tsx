import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Bed, Bath, Square, Heart, Leaf } from "lucide-react";
import { Link } from "react-router-dom";

export type PropertyCardProps = {
  id: number | string;
  slug?: string;
  title: string;
  type: string;
  location: { city: string; country: string } | string;
  price: string;
  currency?: string;
  beds: number;
  baths: number;
  area: string;
  image: string;
  featured?: boolean;
  status?: string;
  description?: string;
  greenScore?: number; // optional sustainability score (0-100)
  onToggleFavorite?: (id: number | string) => void;
  isFavorite?: boolean;
};

function formatLocation(loc: PropertyCardProps["location"]) {
  if (typeof loc === "string") return loc;
  return `${loc.city}, ${loc.country}`;
}

export default function PropertyCard({
  id,
  slug,
  title,
  type,
  location,
  price,
  currency,
  beds,
  baths,
  area,
  image,
  featured,
  status,
  description,
  greenScore,
  onToggleFavorite,
  isFavorite,
}: PropertyCardProps) {
  return (
    <Card className="group hover:shadow-elegant smooth-transition overflow-hidden">
      <div className="relative overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-48 object-cover group-hover:scale-105 smooth-transition"
        />
        <div className="absolute top-4 left-4 flex gap-2">
          {status && (
            <Badge variant={status === "For Sale" ? "default" : "secondary"}>
              {status}
            </Badge>
          )}
          {featured && <Badge variant="secondary">Featured</Badge>}
        </div>
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {typeof greenScore === "number" && (
            <div className="flex items-center gap-1 bg-background/80 px-2 py-1 rounded-md border text-xs">
              <Leaf className="w-3.5 h-3.5 text-success" />
              <span>{greenScore}</span>
            </div>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onToggleFavorite?.(id)}
            className="bg-background/80 hover:bg-background"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? "text-red-500" : ""}`} />
          </Button>
        </div>
        <div className="absolute bottom-4 left-4">
          <div className="text-2xl font-bold text-white drop-shadow-lg">
            {currency ? `${currency} ` : ""}{Number(price).toLocaleString()}
          </div>
        </div>
      </div>

      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl mb-2 group-hover:text-primary smooth-transition">
              {title}
            </CardTitle>
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{formatLocation(location)}</span>
            </div>
          </div>
          <Badge variant="outline">{type}</Badge>
        </div>
      </CardHeader>

      <CardContent>
        {description && (
          <p className="text-muted-foreground mb-4 text-sm line-clamp-2">{description}</p>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          {beds > 0 && (
            <div className="flex items-center space-x-1">
              <Bed className="w-4 h-4" />
              <span>
                {beds} bed{beds > 1 ? "s" : ""}
              </span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <Bath className="w-4 h-4" />
            <span>
              {baths} bath{baths > 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Square className="w-4 h-4" />
            <span>{area}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link to={`/properties/${slug ?? id}`}>View Details</Link>
          </Button>
          <Button variant="hero" size="sm" className="flex-1" asChild>
            <Link to="/account/messages">Contact Agent</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
