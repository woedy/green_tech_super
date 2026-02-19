import Layout from "@/components/layout/Layout";
import PropertyCard from "@/components/properties/PropertyCard";
import { useMyProperties } from "@/hooks/useProperties";
import { Skeleton } from "@/components/ui/skeleton";
import AccountPageHeader from "@/components/account/AccountPageHeader";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const MyProperties = () => {
  const { data, isLoading } = useMyProperties();
  const properties = data?.results ?? [];

  return (
    <Layout>
      <AccountPageHeader
        title="My Properties"
        description="Properties you own or purchased through Green Tech Africa."
        icon={<Home className="h-3.5 w-3.5" />}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/account/properties">Browse Catalog</Link>
          </Button>
        }
      />

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[380px] w-full rounded-xl" />
              ))}
            </div>
          ) : properties.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  id={property.id}
                  slug={property.slug}
                  title={property.title}
                  type={property.type}
                  location={property.location}
                  price={property.price}
                  currency={property.currency}
                  beds={property.beds}
                  baths={property.baths}
                  area={property.area}
                  image={property.image}
                  featured={property.featured}
                  status={property.status}
                  description={property.description}
                  greenScore={property.greenScore}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 py-16 text-center">
              <p className="text-muted-foreground mb-4">You don't have any properties yet.</p>
              <Button asChild>
                <Link to="/account/properties">Browse Properties</Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default MyProperties;
