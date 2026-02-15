import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Checkbox } from "@/components/ui/checkbox";

type TransactionFormData = {
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  proposed_price?: string;
  proposed_rent?: string;
  lease_duration_months?: number;
  move_in_date?: string;
  message: string;
  budget?: string;
  financing_required: boolean;
};

const PropertyTransactionNew = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get("property");
  const transactionType = searchParams.get("type") as 'rent' | 'lease' | 'buy';

  const { data: property, isLoading: propertyLoading, error: propertyError } = useQuery({
    queryKey: ["property", propertyId],
    queryFn: () => api.get(`/api/properties/${propertyId}/`),
    enabled: !!propertyId,
  });

  useEffect(() => {
    if (propertyError) {
      console.error('Error loading property:', propertyError);
      toast({
        title: "Error loading property",
        description: "Could not load property details. Please try again.",
        variant: "destructive",
      });
    }
  }, [propertyError, toast]);

  useEffect(() => {
    console.log('Property ID from URL:', propertyId);
    console.log('Transaction Type from URL:', transactionType);
    console.log('Property data:', property);
  }, [propertyId, transactionType, property]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TransactionFormData>();

  const financingRequired = watch("financing_required");

  useEffect(() => {
    if (property) {
      // Pre-fill with property price if available
      if (transactionType === 'buy' && property.price) {
        setValue("proposed_price", property.price.toString());
      } else if ((transactionType === 'rent' || transactionType === 'lease') && property.price) {
        setValue("proposed_rent", property.price.toString());
      }
    }
  }, [property, transactionType, setValue]);

  const createTransactionMutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      if (!propertyId) {
        throw new Error('Property ID is missing from URL');
      }
      
      const propertyIdInt = parseInt(propertyId, 10);
      
      if (isNaN(propertyIdInt) || propertyIdInt <= 0) {
        console.error('Invalid property ID:', propertyId, 'parsed as:', propertyIdInt);
        throw new Error(`Invalid property ID: "${propertyId}". Expected a positive number.`);
      }
      
      const payload = {
        property: propertyIdInt,
        transaction_type: transactionType,
        contact_name: data.contact_name,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        proposed_price: data.proposed_price ? parseFloat(data.proposed_price) : null,
        proposed_rent: data.proposed_rent ? parseFloat(data.proposed_rent) : null,
        lease_duration_months: data.lease_duration_months || null,
        move_in_date: data.move_in_date || null,
        message: data.message || '',
        budget: data.budget || '',
        financing_required: data.financing_required || false,
      };
      
      console.log('Sending transaction payload:', payload);
      console.log('Property ID (original):', propertyId);
      console.log('Property ID (parsed):', propertyIdInt);
      
      return api.post("/api/transactions/", payload);
    },
    onSuccess: () => {
      toast({
        title: "Request submitted successfully",
        description: "We'll get back to you shortly.",
      });
      navigate("/account/property-transactions");
    },
    onError: (error: any) => {
      console.error("Transaction error:", error);
      const errorMessage = error.response?.data?.detail 
        || error.response?.data?.message 
        || error.message 
        || "Please try again later.";
      toast({
        title: "Failed to submit request",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TransactionFormData) => {
    createTransactionMutation.mutate(data);
  };

  const getTitle = () => {
    switch (transactionType) {
      case 'rent': return 'Request to Rent';
      case 'lease': return 'Request to Lease';
      case 'buy': return 'Request to Buy';
      default: return 'Property Request';
    }
  };

  if (!propertyId || !transactionType) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive mb-4">
                Invalid request. Property ID or transaction type is missing.
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Please select a property and transaction type from the property details page.
              </p>
              <Button asChild>
                <Link to="/account/properties">Browse Properties</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <section className="py-8">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <Link to={`/account/properties/${propertyId}`}>
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Property
                </Button>
              </Link>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{getTitle()}</CardTitle>
                <p className="text-muted-foreground">
                  Fill out the form below to submit your request. Our team will contact you shortly.
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
                      <Label htmlFor="contact_name">Your Name *</Label>
                      <Input
                        id="contact_name"
                        {...register("contact_name", { required: "Name is required" })}
                        placeholder="Full name"
                      />
                      {errors.contact_name && (
                        <p className="text-sm text-destructive">{errors.contact_name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact_email">Email *</Label>
                      <Input
                        id="contact_email"
                        type="email"
                        {...register("contact_email", {
                          required: "Email is required",
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Invalid email address",
                          },
                        })}
                        placeholder="your@email.com"
                      />
                      {errors.contact_email && (
                        <p className="text-sm text-destructive">{errors.contact_email.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Phone Number *</Label>
                    <Input
                      id="contact_phone"
                      {...register("contact_phone", { required: "Phone number is required" })}
                      placeholder="+233 XX XXX XXXX"
                    />
                    {errors.contact_phone && (
                      <p className="text-sm text-destructive">{errors.contact_phone.message}</p>
                    )}
                  </div>

                  {transactionType === 'buy' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="proposed_price">Proposed Price (Optional)</Label>
                        <Input
                          id="proposed_price"
                          type="number"
                          step="0.01"
                          {...register("proposed_price")}
                          placeholder="Your offer price"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="financing_required"
                          {...register("financing_required")}
                        />
                        <Label htmlFor="financing_required" className="cursor-pointer">
                          I need financing assistance
                        </Label>
                      </div>
                    </>
                  )}

                  {(transactionType === 'rent' || transactionType === 'lease') && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="proposed_rent">Proposed Monthly Rent (Optional)</Label>
                          <Input
                            id="proposed_rent"
                            type="number"
                            step="0.01"
                            {...register("proposed_rent")}
                            placeholder="Your offer"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="lease_duration_months">Lease Duration (Months) *</Label>
                          <Input
                            id="lease_duration_months"
                            type="number"
                            {...register("lease_duration_months", {
                              required: "Lease duration is required",
                              min: { value: 1, message: "Minimum 1 month" }
                            })}
                            placeholder="e.g., 12"
                          />
                          {errors.lease_duration_months && (
                            <p className="text-sm text-destructive">{errors.lease_duration_months.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="move_in_date">Desired Move-in Date (Optional)</Label>
                        <Input
                          id="move_in_date"
                          type="date"
                          {...register("move_in_date")}
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget Range (Optional)</Label>
                    <Input
                      id="budget"
                      {...register("budget")}
                      placeholder="e.g., GHS 500,000 - 700,000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Additional Message (Optional)</Label>
                    <Textarea
                      id="message"
                      {...register("message")}
                      placeholder="Any additional information or requirements"
                      rows={5}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="submit"
                      disabled={createTransactionMutation.isPending}
                      className="flex-1"
                    >
                      {createTransactionMutation.isPending && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Submit Request
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(-1)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default PropertyTransactionNew;
