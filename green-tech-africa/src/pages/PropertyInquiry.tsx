import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Loader2, Info } from "lucide-react";
import { api } from "@/lib/api";
import { useProperty } from "@/hooks/useProperties";
import { loadAuthState } from "@/lib/authStorage";
import { Alert, AlertDescription } from "@/components/ui/alert";

type InquiryFormData = {
  name: string;
  email: string;
  phone: string;
  message: string;
  scheduled_viewing?: string;
};

const PropertyInquiry = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const transactionType = searchParams.get("type") as 'rent' | 'lease' | 'buy' | null;
  const isAuthenticated = !!loadAuthState();

  const { data: property } = useProperty(id);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<InquiryFormData>();

  useEffect(() => {
    if (property && transactionType) {
      const typeMessages = {
        rent: `I am interested in renting this property: ${property.title}`,
        lease: `I am interested in leasing this property: ${property.title}`,
        buy: `I am interested in purchasing this property: ${property.title}`,
      };
      setValue("message", typeMessages[transactionType] || "");
    }
  }, [property, transactionType, setValue]);

  const createInquiryMutation = useMutation({
    mutationFn: async (data: InquiryFormData) => {
      const payload = {
        property: property?.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: data.message,
        scheduled_viewing: data.scheduled_viewing || null,
      };
      return api.post("/api/inquiries/", payload);
    },
    onSuccess: () => {
      toast({
        title: "Inquiry submitted successfully",
        description: "We'll get back to you shortly.",
      });
      navigate("/properties");
    },
    onError: (error: any) => {
      console.error("Inquiry error:", error);
      const errorMessage = error.response?.data?.detail
        || error.response?.data?.message
        || error.message
        || "Please try again later.";
      toast({
        title: "Failed to submit inquiry",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InquiryFormData) => {
    createInquiryMutation.mutate(data);
  };

  const getTitle = () => {
    if (transactionType) {
      const titles = {
        rent: 'Request to Rent',
        lease: 'Request to Lease',
        buy: 'Request to Buy',
      };
      return titles[transactionType];
    }
    return 'Property Inquiry';
  };

  const handleLoginRedirect = () => {
    // Redirect to login with return URL
    navigate(`/auth/login?redirect=/account/property-transactions/new?property=${id}&type=${transactionType}`);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <section className="py-8">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <Link to={`/properties/${id}`}>
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Property
                </Button>
              </Link>
            </div>

            {isAuthenticated && transactionType && (
              <Alert className="mb-6">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  You're logged in! For better tracking and status updates, we recommend using the{" "}
                  <Link
                    to={`/account/property-transactions/new?property=${id}&type=${transactionType}`}
                    className="font-medium underline"
                  >
                    full transaction request form
                  </Link>.
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{getTitle()}</CardTitle>
                <p className="text-muted-foreground">
                  {transactionType
                    ? "Submit your request and our team will contact you shortly."
                    : "Fill out the form below to inquire about this property or schedule a viewing."
                  }
                </p>
              </CardHeader>
              <CardContent>
                {property && (
                  <div className="mb-6 p-4 bg-accent/50 rounded-lg">
                    <h3 className="font-semibold mb-2">Property Details</h3>
                    <p className="text-sm text-muted-foreground">{property.title}</p>
                    {property.city && property.region?.name && (
                      <p className="text-sm text-muted-foreground">
                        Location: {property.city}, {property.region.name}
                      </p>
                    )}
                    {property.price && (
                      <p className="text-sm text-muted-foreground">
                        Price: {property.currency} {Number(property.price).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Your Name *</Label>
                      <Input
                        id="name"
                        {...register("name", { required: "Name is required" })}
                        placeholder="Full name"
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive">{errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        {...register("email", {
                          required: "Email is required",
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Invalid email address",
                          },
                        })}
                        placeholder="your@email.com"
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      {...register("phone", { required: "Phone number is required" })}
                      placeholder="+233 XX XXX XXXX"
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive">{errors.phone.message}</p>
                    )}
                  </div>

                  {!transactionType && (
                    <div className="space-y-2">
                      <Label htmlFor="scheduled_viewing">Preferred Viewing Date (Optional)</Label>
                      <Input
                        id="scheduled_viewing"
                        type="datetime-local"
                        {...register("scheduled_viewing")}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      {...register("message", { required: "Message is required" })}
                      placeholder="Tell us about your interest in this property"
                      rows={5}
                    />
                    {errors.message && (
                      <p className="text-sm text-destructive">{errors.message.message}</p>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="submit"
                      disabled={createInquiryMutation.isPending}
                      className="flex-1"
                    >
                      {createInquiryMutation.isPending && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Submit Inquiry
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(-1)}
                    >
                      Cancel
                    </Button>
                  </div>

                  {!isAuthenticated && transactionType && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-3">
                        Have an account? Login for better tracking and status updates.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={handleLoginRedirect}
                      >
                        Login to Submit Full Request
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default PropertyInquiry;
