import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AgentShell from "@/components/layout/AgentShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchProperties } from "@/lib/api";
import { Property } from "@/types/property";
import { Plus, Home, MapPin, Edit } from "lucide-react";
import { toast } from "sonner";

export default function Properties() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const loadProperties = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetchProperties();
            setProperties(res.results);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load properties");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProperties();
    }, [loadProperties]);

    return (
        <AgentShell>
            <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
                        <p className="text-muted-foreground mt-1">Manage your rental and sale listings</p>
                    </div>
                    <Button
                        className="flex items-center gap-2"
                        onClick={() => navigate("/properties/new")}
                    >
                        <Plus className="w-4 h-4" />
                        Add Property
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>My Listings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Property</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">Loading properties...</TableCell>
                                    </TableRow>
                                ) : properties.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            <div className="flex flex-col items-center gap-2">
                                                <Home className="w-8 h-8 text-muted-foreground" />
                                                <span>No properties found.</span>
                                                <Button variant="outline" size="sm" onClick={() => navigate("/properties/new")}>
                                                    Add your first property
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    properties.map((property) => (
                                        <TableRow key={property.id}>
                                            <TableCell>
                                                <div
                                                    className="font-bold text-primary hover:underline cursor-pointer"
                                                    onClick={() => navigate(`/properties/${property.id}`)}
                                                >
                                                    {property.title}
                                                </div>
                                                <div className="text-xs text-muted-foreground capitalize">{property.property_type}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center text-xs text-muted-foreground">
                                                    <MapPin className="w-3 h-3 mr-1" />
                                                    {property.city}, {property.region.name || property.region}
                                                </div>
                                            </TableCell>
                                            <TableCell className="capitalize">{property.listing_type}</TableCell>
                                            <TableCell>
                                                <Badge className={property.status === 'published' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}>
                                                    {property.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center font-bold">
                                                    {property.currency} {parseFloat(property.price).toLocaleString()}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => navigate(`/properties/${property.id}`)}
                                                    >
                                                        <Plus className="w-4 h-4 rotate-45" />
                                                        <span className="sr-only">View</span>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => navigate(`/properties/${property.id}/edit`)}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                        <span className="sr-only">Edit</span>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AgentShell>
    );
}
