import React, { useState, useEffect, ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AgentShell from "@/components/layout/AgentShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createProperty, updateProperty, fetchPropertyDetails, uploadPropertyImage } from "@/lib/api";
import { Property, PropertyType, ListingType, PropertyStatus } from "@/types/property";
import { ChevronLeft, Upload, X, Loader2 } from "lucide-react";

export default function PropertyForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [images, setImages] = useState<{ url: string; caption?: string; is_primary?: boolean }[]>([]);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        summary: "",
        description: "",
        property_type: "house" as PropertyType,
        listing_type: "sale" as ListingType,
        status: "published" as PropertyStatus,
        price: "",
        currency: "USD",
        bedrooms: "0",
        bathrooms: "0",
        area_sq_m: "",
        city: "",
        region: "accra", // Defaulting to an available region slug
        address: "",
    });

    useEffect(() => {
        if (isEdit) {
            loadProperty();
        }
    }, [id]);

    const loadProperty = async () => {
        try {
            const data = await fetchPropertyDetails(id!);
            setFormData({
                title: data.title,
                summary: data.summary,
                description: data.description,
                property_type: data.property_type,
                listing_type: data.listing_type,
                status: data.status,
                price: data.price.toString(),
                currency: data.currency,
                bedrooms: data.bedrooms.toString(),
                bathrooms: data.bathrooms.toString(),
                area_sq_m: data.area_sq_m.toString(),
                city: data.city,
                region: (data.region as any).slug || data.region,
                address: data.address,
            });
            if (data.images) {
                setImages(data.images.map(img => ({
                    url: img.image_url,
                    caption: img.caption,
                    is_primary: img.is_primary
                })));
            }
        } catch (err: any) {
            toast.error("Failed to load property details");
            navigate("/properties");
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const res = await uploadPropertyImage(file);
            setImages(prev => [...prev, { url: res.url, is_primary: prev.length === 0 }]);
            toast.success("Image uploaded");
        } catch (err: any) {
            toast.error(err.message || "Failed to upload image");
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                bedrooms: parseInt(formData.bedrooms),
                bathrooms: parseInt(formData.bathrooms),
                area_sq_m: parseFloat(formData.area_sq_m),
                images: images.map((img, i) => ({
                    image_url: img.url,
                    caption: img.caption,
                    is_primary: img.is_primary,
                    order: i
                })),
                hero_image_url: images.find(img => img.is_primary)?.url || images[0]?.url || ""
            };

            if (isEdit) {
                await updateProperty(id!, payload);
                toast.success("Property updated successfully");
            } else {
                await createProperty(payload);
                toast.success("Property created successfully");
            }
            navigate("/properties");
        } catch (err: any) {
            toast.error(err.message || "Failed to save property");
        } finally {
            setSaving(false);
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

    return (
        <AgentShell>
            <div className="p-8 max-w-4xl mx-auto">
                <Button
                    variant="ghost"
                    className="mb-6"
                    onClick={() => navigate("/properties")}
                >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back to Properties
                </Button>

                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">
                        {isEdit ? "Edit Property" : "Add New Property"}
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Property Title</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="e.g. Modern Eco-Villa in East Legon"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="summary">Brief Summary</Label>
                                <Input
                                    id="summary"
                                    value={formData.summary}
                                    onChange={e => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                                    placeholder="Short description for listings"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Full Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="min-h-[150px]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Property Type</Label>
                                    <Select
                                        value={formData.property_type}
                                        onValueChange={val => setFormData(prev => ({ ...prev, property_type: val as PropertyType }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="house">House</SelectItem>
                                            <SelectItem value="apartment">Apartment</SelectItem>
                                            <SelectItem value="villa">Villa</SelectItem>
                                            <SelectItem value="townhouse">Townhouse</SelectItem>
                                            <SelectItem value="commercial">Commercial</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Listing Type</Label>
                                    <Select
                                        value={formData.listing_type}
                                        onValueChange={val => setFormData(prev => ({ ...prev, listing_type: val as ListingType }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sale">For Sale</SelectItem>
                                            <SelectItem value="rent">For Rent</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={val => setFormData(prev => ({ ...prev, status: val as PropertyStatus }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="published">Published</SelectItem>
                                            {isEdit && (
                                                <>
                                                    <SelectItem value="under_offer">Under Offer</SelectItem>
                                                    <SelectItem value="sold">Sold</SelectItem>
                                                    <SelectItem value="rented">Rented</SelectItem>
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Pricing & Size</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="price">Price</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                    <Input
                                        id="price"
                                        type="number"
                                        className="pl-7"
                                        value={formData.price}
                                        onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="area">Area (sqm)</Label>
                                <Input
                                    id="area"
                                    type="number"
                                    value={formData.area_sq_m}
                                    onChange={e => setFormData(prev => ({ ...prev, area_sq_m: e.target.value }))}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="bedrooms">Bedrooms</Label>
                                <Input
                                    id="bedrooms"
                                    type="number"
                                    value={formData.bedrooms}
                                    onChange={e => setFormData(prev => ({ ...prev, bedrooms: e.target.value }))}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="bathrooms">Bathrooms</Label>
                                <Input
                                    id="bathrooms"
                                    type="number"
                                    value={formData.bathrooms}
                                    onChange={e => setFormData(prev => ({ ...prev, bathrooms: e.target.value }))}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Location</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        value={formData.city}
                                        onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Region</Label>
                                    <Select
                                        value={formData.region}
                                        onValueChange={val => setFormData(prev => ({ ...prev, region: val }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="accra">Greater Accra</SelectItem>
                                            <SelectItem value="ashanti">Ashanti Region</SelectItem>
                                            <SelectItem value="central">Central Region</SelectItem>
                                            <SelectItem value="western">Western Region</SelectItem>
                                            <SelectItem value="eastern">Eastern Region</SelectItem>
                                            <SelectItem value="volta">Volta Region</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Media</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {images.map((img, i) => (
                                    <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
                                        <img src={img.url} className="object-cover w-full h-full" alt="" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(i)}
                                            className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                        {img.is_primary && (
                                            <Badge className="absolute bottom-1 left-1 pointer-events-none">Hero</Badge>
                                        )}
                                    </div>
                                ))}
                                {(uploading || images.length < 8) && (
                                    <label className="flex flex-col items-center justify-center aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 cursor-pointer transition-colors bg-accent/10">
                                        {uploading ? (
                                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                        ) : (
                                            <>
                                                <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                                                <span className="text-xs text-muted-foreground">Upload</span>
                                            </>
                                        )}
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                                    </label>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">Max 8 images. The first image will be the primary hero image.</p>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate("/properties")}
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {isEdit ? "Update Property" : "Publish Property"}
                        </Button>
                    </div>
                </form>
            </div>
        </AgentShell>
    );
}
