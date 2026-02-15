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
import { useProperty } from "@/hooks/useProperties";

type RequestFormData = {
  title: string;
  description: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  budget?: string;
  timeline?: string;
};

const RequestNew = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get("property");
  const projectId = searchParams.get("project");

  const { data: property } = useQuery({
    queryKey: ["property", propertyId],
    queryFn: () => api.get(`/api/properties/${propertyId}/`),
    enabled: !!propertyId,
  });

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => api.get(`/api/construction/projects/${projectId}/`),
    enabled: !!projectId,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<RequestFormData>();

  useEffect(() => {
    if (property) {
      setValue("title", `Request for ${property.title}`);
      setValue("description", `I am interested in this property: ${property.title}`);
    } else if (project) {
      setValue("title", `Request for similar project: ${project.title}`);
      setValue("description", `I would like to start a similar project to: ${project.title}`);
    }
  }, [property, project, setValue]);

  const createRequestMutation = useMutation({
    mutationFn: async (data: RequestFormData) => {
      const payload = {
        title: data.title,
        description: data.description,
        contact_name: data.contact_name,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        budget: data.budget || '',
        timeline: data.timeline || '',
        construction_type: 'NEW', // NEW_CONSTRUCTION
        property_reference: propertyId || null,
        project_reference: projectId || null,
        current_step: 'project_details',
        status: 'DRAFT', // Default status
      };
      return api.post("/api/construction/construction-requests/", payload);
    },
    onSuccess: () => {
      toast({
        title: "Request submitted successfully",
        description: "We'll get back to you shortly.",
      });
      navigate("/account/requests");
    },
    onError: (error: any) => {
      console.error("Request error:", error);
      const errorMessage = error.response?.data?.construction_type?.[0] 
        || error.response?.data?.status?.[0]
        || error.response?.data?.detail 
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

  const onSubmit = (data: RequestFormData) => {
    createRequestMutation.mutate(data);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <section className="py-8">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <Link to={propertyId ? "/account/properties" : "/account/projects"}>
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to {propertyId ? "Properties" : "Projects"}
                </Button>
              </Link>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  {propertyId ? "Request Property" : "Request Similar Project"}
                </CardTitle>
                <p className="text-muted-foreground">
                  Fill out the form below to submit your request. Our team will contact you shortly.
                </p>
              </CardHeader>
              <CardContent>
                {(property || project) && (
                  <div className="mb-6 p-4 bg-accent/50 rounded-lg">
                    <h3 className="font-semibold mb-2">
                      {propertyId ? "Property Details" : "Project Reference"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {property?.title || project?.title}
                    </p>
                    {property?.location && (
                      <p className="text-sm text-muted-foreground">
                        Location: {typeof property.location === 'string' 
                          ? property.location 
                          : `${property.location?.city}, ${property.location?.country}`}
                      </p>
                    )}
                    {property?.price && (
                      <p className="text-sm text-muted-foreground">
                        Price: {property.currency_code} {Number(property.price).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Request Title *</Label>
                    <Input
                      id="title"
                      {...register("title", { required: "Title is required" })}
                      placeholder="Brief title for your request"
                    />
                    {errors.title && (
                      <p className="text-sm text-destructive">{errors.title.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      {...register("description", { required: "Description is required" })}
                      placeholder="Provide details about your request, requirements, or questions"
                      rows={5}
                    />
                    {errors.description && (
                      <p className="text-sm text-destructive">{errors.description.message}</p>
                    )}
                  </div>

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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="budget">Budget (Optional)</Label>
                      <Input
                        id="budget"
                        {...register("budget")}
                        placeholder="e.g., GHS 500,000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timeline">Timeline (Optional)</Label>
                      <Input
                        id="timeline"
                        {...register("timeline")}
                        placeholder="e.g., 3-6 months"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="submit"
                      disabled={createRequestMutation.isPending}
                      className="flex-1"
                    >
                      {createRequestMutation.isPending && (
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

export default RequestNew;
