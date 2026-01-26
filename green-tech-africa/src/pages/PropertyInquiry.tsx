import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useProperty } from "@/hooks/useProperties";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { propertyInquirySchema, type PropertyInquiryFormData } from "@/lib/validation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const PropertyInquiry = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: property, isLoading } = useProperty(id);

  const form = useForm<PropertyInquiryFormData>({
    resolver: zodResolver(propertyInquirySchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
      viewing: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: PropertyInquiryFormData) => {
      const payload = {
        property: property.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: data.message,
        scheduled_viewing: data.viewing ? new Date(data.viewing).toISOString() : undefined,
      };
      return api.post("/api/properties/inquiries/", payload);
    },
    onSuccess: () => {
      toast({ 
        title: "Inquiry sent successfully", 
        description: "We'll get back to you within 24 hours with more information about this property." 
      });
      navigate("/account/messages");
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to send inquiry", 
        description: error.message || "Please check your information and try again.", 
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: PropertyInquiryFormData) => {
    mutation.mutate(data);
  };

  if (isLoading || !property) {
    return (
      <Layout>
        <section className="py-12 text-center text-muted-foreground">Loading property...</section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-10 bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Property Inquiry</h1>
            <p className="text-muted-foreground text-sm">{property.title}</p>
          </div>
          <Button variant="outline" asChild>
            <Link to={`/properties/${property.slug}`}>Back to Property</Link>
          </Button>
        </div>
      </section>
      <section className="py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Tell us about your interest</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Jane Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="jane@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="+233 XX XXX XXXX" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="viewing"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Viewing Time (Optional)</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Message</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="I'm interested in this property. Please provide more information about..." 
                            rows={4} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={form.formState.isSubmitting || mutation.isPending}
                  >
                    {form.formState.isSubmitting || mutation.isPending ? "Sending inquiry..." : "Send Inquiry"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default PropertyInquiry;