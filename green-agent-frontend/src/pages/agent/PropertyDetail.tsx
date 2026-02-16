import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    ChevronLeft,
    Edit,
    Trash2,
    MapPin,
    Home,
    Bed,
    Bath,
    Maximize,
    Calendar,
    User,
    Leaf,
    Droplets,
    Zap,
    ExternalLink,
    Loader2,
    MoreVertical,
    CheckCircle2,
    Clock,
    AlertCircle
} from "lucide-react";
import AgentShell from "@/components/layout/AgentShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { fetchPropertyDetails, deleteProperty, updateProperty } from "@/lib/api";
import { Property, PropertyStatus } from "@/types/property";

export default function PropertyDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (id) {
            loadProperty();
        }
    }, [id]);

    const loadProperty = async () => {
        try {
            setLoading(true);
            const data = await fetchPropertyDetails(id!);
            setProperty(data);
        } catch (err: any) {
            toast.error(err.message || "Failed to load property details");
            navigate("/properties");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);
            await deleteProperty(id!);
            toast.success("Property deleted successfully");
            navigate("/properties");
        } catch (err: any) {
            toast.error(err.message || "Failed to delete property");
        } finally {
            setDeleting(false);
        }
    };

    const handleStatusChange = async (newStatus: PropertyStatus) => {
        if (!property) return;
        try {
            await updateProperty(property.id.toString(), { status: newStatus });
            setProperty({ ...property, status: newStatus });
            toast.success(`Property status updated to ${newStatus}`);
        } catch (err: any) {
            toast.error(err.message || "Failed to update status");
        }
    };

    if (loading) {
        return (
            <AgentShell>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </AgentShell>
        );
    }

    if (!property) return null;

    const statusColors: Record<PropertyStatus, string> = {
        published: "bg-green-500/10 text-green-500 border-green-500/20",
        draft: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        under_offer: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        sold: "bg-purple-500/10 text-purple-500 border-purple-500/20",
        rented: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    };

    const statusIcons: Record<PropertyStatus, React.ReactNode> = {
        published: <CheckCircle2 className="w-3 h-3 mr-1" />,
        draft: <Clock className="w-3 h-3 mr-1" />,
        under_offer: <AlertCircle className="w-3 h-3 mr-1" />,
        sold: <CheckCircle2 className="w-3 h-3 mr-1" />,
        rented: <CheckCircle2 className="w-3 h-3 mr-1" />,
    };

    return (
        <AgentShell>
            <div className="p-8 max-w-7xl mx-auto pb-20">
                <div className="flex items-center justify-between mb-8">
                    <Button
                        variant="ghost"
                        className="flex items-center gap-2 hover:bg-accent"
                        onClick={() => navigate("/properties")}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back to Properties
                    </Button>

                    <div className="flex items-center gap-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="flex items-center gap-2">
                                    <MoreVertical className="w-4 h-4" />
                                    Status: <span className="capitalize">{property.status.replace('_', ' ')}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleStatusChange("published")}>Publish</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange("draft")}>Set to Draft</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleStatusChange("under_offer")}>Under Offer</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange("sold")}>Mark as Sold</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange("rented")}>Mark as Rented</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Link to={`/properties/${property.id}/edit`}>
                            <Button variant="outline" className="flex items-center gap-2">
                                <Edit className="w-4 h-4" />
                                Edit
                            </Button>
                        </Link>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="flex items-center gap-2">
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the
                                        property listing for "{property.title}".
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDelete}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        disabled={deleting}
                                    >
                                        {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Hero Section */}
                        <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl group border">
                            <img
                                src={property.hero_image_url || property.images[0]?.image_url || "/placeholder-property.jpg"}
                                alt={property.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute top-6 left-6">
                                <Badge className={`px-4 py-2 text-sm font-semibold backdrop-blur-md shadow-lg border ${statusColors[property.status]}`}>
                                    <span className="flex items-center">
                                        {statusIcons[property.status]}
                                        {property.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                </Badge>
                            </div>
                            <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                                <h1 className="text-4xl font-bold text-white mb-2">{property.title}</h1>
                                <div className="flex items-center text-white/90 gap-4">
                                    <span className="flex items-center gap-1.5 backdrop-blur-sm bg-white/10 px-3 py-1.5 rounded-full text-sm">
                                        <MapPin className="w-4 h-4" />
                                        {property.city}, {property.region.name || property.region}
                                    </span>
                                    <span className="flex items-center gap-1.5 backdrop-blur-sm bg-white/10 px-3 py-1.5 rounded-full text-sm">
                                        <Home className="w-4 h-4" />
                                        {property.property_type.charAt(0).toUpperCase() + property.property_type.slice(1)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard icon={<Bed className="w-5 h-5 text-primary" />} label="Bedrooms" value={property.bedrooms} />
                            <StatCard icon={<Bath className="w-5 h-5 text-primary" />} label="Bathrooms" value={property.bathrooms} />
                            <StatCard icon={<Maximize className="w-5 h-5 text-primary" />} label="Total Area" value={`${property.area_sq_m} sqm`} />
                            <StatCard icon={<Calendar className="w-5 h-5 text-primary" />} label="Year Built" value={property.year_built || "N/A"} />
                        </div>

                        <Tabs defaultValue="details" className="w-full">
                            <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent p-0 space-x-8">
                                <TabsTrigger
                                    value="details"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 text-base"
                                >
                                    Overview
                                </TabsTrigger>
                                <TabsTrigger
                                    value="media"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 text-base"
                                >
                                    Gallery
                                </TabsTrigger>
                                <TabsTrigger
                                    value="sustainability"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 text-base"
                                >
                                    Sustainability
                                </TabsTrigger>
                            </TabsList>
                            <div className="mt-8">
                                <TabsContent value="details" className="space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-bold">About this property</h3>
                                        <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                                            {property.description}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t font-sans">
                                        <div className="space-y-3">
                                            <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Property Details</h4>
                                            <dl className="space-y-2">
                                                <div className="flex justify-between">
                                                    <dt className="text-muted-foreground">Reference</dt>
                                                    <dd className="font-medium">#{property.id}</dd>
                                                </div>
                                                <div className="flex justify-between">
                                                    <dt className="text-muted-foreground">Listing Type</dt>
                                                    <dd className="font-medium capitalize">{property.listing_type}</dd>
                                                </div>
                                                <div className="flex justify-between">
                                                    <dt className="text-muted-foreground">Currency</dt>
                                                    <dd className="font-medium">{property.currency}</dd>
                                                </div>
                                            </dl>
                                        </div>
                                        <div className="space-y-3 font-sans">
                                            <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Full Address</h4>
                                            <div className="flex items-start gap-2">
                                                <MapPin className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                                                <span className="text-muted-foreground italic">
                                                    {property.address}<br />
                                                    {property.city}, {property.region.name || property.region}<br />
                                                    Ghana
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="media">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {property.images.map((img, idx) => (
                                            <div key={idx} className="group relative aspect-square rounded-2xl overflow-hidden border bg-muted">
                                                <img
                                                    src={img.image_url}
                                                    alt={img.caption || `Property image ${idx + 1}`}
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                />
                                                {img.is_primary && (
                                                    <Badge className="absolute top-2 left-2 pointer-events-none">HERO</Badge>
                                                )}
                                                {img.caption && (
                                                    <div className="absolute inset-x-0 bottom-0 p-3 bg-black/60 translate-y-full group-hover:translate-y-0 transition-transform">
                                                        <p className="text-xs text-white truncate">{img.caption}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>

                                <TabsContent value="sustainability" className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <EcoScoreCard
                                            icon={<Zap className="w-6 h-6 text-yellow-500" />}
                                            label="Energy Efficiency"
                                            score={property.energy_rating}
                                            max={5}
                                        />
                                        <EcoScoreCard
                                            icon={<Droplets className="w-6 h-6 text-blue-500" />}
                                            label="Water Conservation"
                                            score={property.water_rating}
                                            max={5}
                                        />
                                        <EcoScoreCard
                                            icon={<Leaf className="w-6 h-6 text-green-500" />}
                                            label="Overall Eco Score"
                                            score={property.sustainability_score}
                                            max={100}
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-xl font-bold">Eco Features</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {property.eco_features?.length > 0 ? (
                                                property.eco_features.map((feature, idx) => (
                                                    <Badge key={idx} variant="outline" className="px-4 py-2 border-green-500/20 text-green-600 bg-green-50 flex items-center gap-2">
                                                        <Leaf className="w-3 h-3" />
                                                        {typeof feature === 'string' ? feature : (feature as any).name}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <p className="text-muted-foreground italic text-sm">No eco features specified.</p>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>
                    </div>

                    <div className="space-y-6">
                        <Card className="border-2 border-primary/10 shadow-xl overflow-hidden rounded-3xl sticky top-8">
                            <CardHeader className="bg-primary/5 text-center py-8">
                                <CardDescription className="uppercase tracking-widest text-xs font-bold text-primary mb-2">Asking Price</CardDescription>
                                <CardTitle className="text-4xl font-black text-primary">
                                    {property.currency} {parseFloat(property.price).toLocaleString()}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="p-4 rounded-2xl bg-accent/20 border space-y-3">
                                    <h4 className="font-bold text-sm flex items-center gap-2">
                                        <User className="w-4 h-4 text-primary" />
                                        Listed By
                                    </h4>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {(typeof property.listed_by === 'object' && property.listed_by?.first_name?.[0]) || "A"}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm">
                                                {typeof property.listed_by === 'object'
                                                    ? `${property.listed_by.first_name} ${property.listed_by.last_name}`
                                                    : "Property Agent"}
                                            </div>
                                            <div className="text-xs text-muted-foreground underline decoration-primary/20">{property.email || "Contact for details"}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Button className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20 rounded-2xl">
                                        Generate Brochure
                                    </Button>
                                    <Button variant="outline" className="w-full h-12 font-bold rounded-2xl">
                                        View as Public Link
                                        <ExternalLink className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-muted/60">
                            <CardHeader>
                                <CardTitle className="text-lg">Lead Generation</CardTitle>
                                <CardDescription>Track interest in this property</CardDescription>
                            </CardHeader>
                            <CardContent className="text-center py-8 space-y-4">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                                    <Zap className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <div className="text-sm text-muted-foreground max-w-[200px] mx-auto">
                                    Lead tracking for this property is coming soon.
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AgentShell>
    );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
    return (
        <div className="p-4 rounded-2xl bg-card border shadow-sm flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-primary/5 flex-shrink-0">
                {icon}
            </div>
            <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{label}</p>
                <p className="text-base font-black">{value}</p>
            </div>
        </div>
    );
}

function EcoScoreCard({ icon, label, score, max }: { icon: React.ReactNode; label: string; score: number; max: number }) {
    const percentage = (score / max) * 100;
    return (
        <div className="p-6 rounded-3xl border bg-card/50 backdrop-blur-sm space-y-4 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
            <div className="flex items-center gap-3">
                {icon}
                <span className="font-bold text-sm tracking-tight">{label}</span>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between items-end">
                    <span className="text-3xl font-black">{score}<span className="text-sm text-muted-foreground font-medium">/{max}</span></span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full transition-all duration-1000"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
