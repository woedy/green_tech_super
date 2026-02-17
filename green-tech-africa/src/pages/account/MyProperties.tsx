import Layout from "@/components/layout/Layout";
import PropertyCard from "@/components/properties/PropertyCard";
import { useMyProperties } from "@/hooks/useProperties";
import { Skeleton } from "@/components/ui/skeleton";

const MyProperties = () => {
  const { data, isLoading } = useMyProperties();

  return (
    <Layout>
      <section className="py-12 bg-accent/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-4">My Properties</h1>
          <p className="text-muted-foreground max-w-2xl">
            Properties you own or have purchased through our platform.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[400px] w-full rounded-lg" />
              ))}
            </div>
          ) : data?.results && data.results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {data.results.map((property) => (
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
            <div className="text-center py-20 bg-muted/30 rounded-lg border-2 border-dashed">
              <p className="text-muted-foreground mb-4">You don't have any properties yet.</p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default MyProperties;
