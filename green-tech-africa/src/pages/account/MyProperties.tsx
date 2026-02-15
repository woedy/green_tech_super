import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Home, MapPin, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";

const MyProperties = () => {
  // This will fetch the client's own properties (properties they've purchased/own)
  // For now, showing placeholder

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">My Properties</h1>
              <p className="text-muted-foreground">
                Properties you own or have purchased through our platform
              </p>
            </div>

            <div className="text-center py-12">
              <Home className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Properties Yet</h3>
              <p className="text-muted-foreground mb-6">
                You haven't purchased any properties yet. Browse our catalog to find your perfect property.
              </p>
              <Button asChild>
                <Link to="/account/properties">Browse Properties</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default MyProperties;
