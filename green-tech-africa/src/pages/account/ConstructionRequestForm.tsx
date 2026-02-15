import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Building2, 
  MapPin, 
  Leaf, 
  DollarSign,
  FileText,
  Loader2
} from "lucide-react";
import { constructionRequestsApi, api } from "@/lib/api";

// Types
interface FormData {
  // Step 1: Project Details
  title: string;
  description: string;
  construction_type: string;
  
  // Step 2: Location
  property_id?: string;
  address?: string;
  city?: string;
  region?: string;
  
  // Step 3: Eco Features
  selected_eco_features?: Array<{
    id: string;
    quantity: number;
    customizations?: any;
  }>;
  target_energy_rating?: number;
  target_water_rating?: number;
  target_sustainability_score?: number;
  
  // Step 4: Budget
  budget: string;
  currency: string;
  timeline?: string;
  
  // Step 5: Review (no new fields)
}

const STEPS = [
  { id: 1, name: "Project Details", icon: Building2 },
  { id: 2, name: "Location", icon: MapPin },
  { id: 3, name: "Eco Features", icon: Leaf },
  { id: 4, name: "Budget & Timeline", icon: DollarSign },
  { id: 5, name: "Review & Submit", icon: FileText },
];

const CONSTRUCTION_TYPES = [
  { value: "NEW", label: "New Construction" },
  { value: "RENO", label: "Renovation" },
  { value: "EXT", label: "Extension" },
  { value: "LAND", label: "Landscaping" },
  { value: "INT", label: "Interior Design" },
];

const ConstructionRequestForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<FormData>>({
    currency: "GHS",
    construction_type: "NEW",
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm();

  // Fetch user's properties for location step
  const { data: properties } = useQuery({
    queryKey: ['my-properties'],
    queryFn: () => api.get('/api/properties/').then(res => res.results || []),
  });

  // Fetch eco features for step 3
  const { data: ecoFeatures } = useQuery({
    queryKey: ['eco-features'],
    queryFn: () => api.get('/api/construction/eco-features/').then(res => res.results || res || []),
    enabled: currentStep === 3,
  });

  // Submit mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => constructionRequestsApi.createConstructionRequest(data),
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: "Your construction request has been submitted.",
      });
      navigate(`/account/construction-requests/${data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const progress = (currentStep / STEPS.length) * 100;

  const handleNext = (data: any) => {
    setFormData({ ...formData, ...data });
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinalSubmit = (data: any) => {
    const finalData = { ...formData, ...data };
    createMutation.mutate(finalData);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1ProjectDetails register={register} errors={errors} formData={formData} setValue={setValue} />;
      case 2:
        return <Step2Location register={register} errors={errors} formData={formData} properties={properties} setValue={setValue} />;
      case 3:
        return <Step3EcoFeatures formData={formData} setFormData={setFormData} ecoFeatures={ecoFeatures} />;
      case 4:
        return <Step4Budget register={register} errors={errors} formData={formData} setValue={setValue} />;
      case 5:
        return <Step5Review formData={formData} />;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <section className="py-10 bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" size="sm" onClick={() => navigate('/account/requests')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Requests
          </Button>
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">New Construction Request</h1>
            <p className="text-muted-foreground">
              Complete this form to submit your construction project request
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Step {currentStep} of {STEPS.length}</span>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between mb-8">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors ${
                      isCompleted
                        ? "bg-primary text-primary-foreground"
                        : isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                  </div>
                  <span className={`text-xs text-center ${isActive ? "font-semibold" : "text-muted-foreground"}`}>
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSubmit(currentStep === STEPS.length ? handleFinalSubmit : handleNext)}>
            {renderStep()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              {currentStep < STEPS.length ? (
                <Button type="submit">
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Request
                      <Check className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </div>
      </section>
    </Layout>
  );
};

// Step 1: Project Details
const Step1ProjectDetails = ({ register, errors, formData, setValue }: any) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Details</CardTitle>
        <CardDescription>Tell us about your construction project</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="title">Project Title *</Label>
          <Input
            id="title"
            {...register("title", { required: "Title is required" })}
            defaultValue={formData.title}
            placeholder="e.g., New Family Home in Accra"
          />
          {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <Label htmlFor="construction_type">Construction Type *</Label>
          <Select
            defaultValue={formData.construction_type}
            onValueChange={(value) => setValue("construction_type", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {CONSTRUCTION_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="description">Project Description</Label>
          <Textarea
            id="description"
            {...register("description")}
            defaultValue={formData.description}
            placeholder="Describe your project requirements, goals, and any specific features you want..."
            rows={5}
          />
          <p className="text-sm text-muted-foreground mt-1">
            Provide as much detail as possible to help us understand your vision
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// Step 2: Location
const Step2Location = ({ register, errors, formData, properties, setValue }: any) => {
  const [useExistingProperty, setUseExistingProperty] = useState(!!formData.property_id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Location</CardTitle>
        <CardDescription>Where will this construction take place?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 mb-4">
          <Button
            type="button"
            variant={useExistingProperty ? "default" : "outline"}
            onClick={() => setUseExistingProperty(true)}
            className="flex-1"
          >
            Use Existing Property
          </Button>
          <Button
            type="button"
            variant={!useExistingProperty ? "default" : "outline"}
            onClick={() => setUseExistingProperty(false)}
            className="flex-1"
          >
            Enter New Address
          </Button>
        </div>

        {useExistingProperty ? (
          <div>
            <Label htmlFor="property_id">Select Property</Label>
            <Select
              defaultValue={formData.property_id}
              onValueChange={(value) => setValue("property_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent>
                {properties?.map((property: any) => (
                  <SelectItem key={property.id} value={property.id.toString()}>
                    {property.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <>
            <div>
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                {...register("address", { required: !useExistingProperty && "Address is required" })}
                defaultValue={formData.address}
                placeholder="Street address"
              />
              {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  {...register("city", { required: !useExistingProperty && "City is required" })}
                  defaultValue={formData.city}
                  placeholder="e.g., Accra"
                />
                {errors.city && <p className="text-sm text-red-600 mt-1">{errors.city.message}</p>}
              </div>

              <div>
                <Label htmlFor="region">Region *</Label>
                <Input
                  id="region"
                  {...register("region", { required: !useExistingProperty && "Region is required" })}
                  defaultValue={formData.region}
                  placeholder="e.g., Greater Accra"
                />
                {errors.region && <p className="text-sm text-red-600 mt-1">{errors.region.message}</p>}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

// Step 3: Eco Features
const Step3EcoFeatures = ({ formData, setFormData, ecoFeatures }: any) => {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    formData.selected_eco_features?.map((f: any) => f.id) || []
  );

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(featureId) ? prev.filter((id) => id !== featureId) : [...prev, featureId]
    );
  };

  const handleNext = () => {
    setFormData({
      ...formData,
      selected_eco_features: selectedFeatures.map((id) => ({ id, quantity: 1 })),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Eco-Friendly Features</CardTitle>
        <CardDescription>Select sustainable features for your project (optional)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sustainability Targets */}
        <div className="space-y-4">
          <h3 className="font-semibold">Sustainability Targets</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="energy_rating">Energy Rating (1-5)</Label>
              <Input
                id="energy_rating"
                type="number"
                min="1"
                max="5"
                defaultValue={formData.target_energy_rating || 3}
                onChange={(e) => setFormData({ ...formData, target_energy_rating: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="water_rating">Water Rating (1-5)</Label>
              <Input
                id="water_rating"
                type="number"
                min="1"
                max="5"
                defaultValue={formData.target_water_rating || 3}
                onChange={(e) => setFormData({ ...formData, target_water_rating: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="sustainability_score">Sustainability Score (0-100)</Label>
              <Input
                id="sustainability_score"
                type="number"
                min="0"
                max="100"
                defaultValue={formData.target_sustainability_score || 60}
                onChange={(e) => setFormData({ ...formData, target_sustainability_score: parseInt(e.target.value) })}
              />
            </div>
          </div>
        </div>

        {/* Eco Features Selection */}
        {ecoFeatures && ecoFeatures.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Available Eco Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ecoFeatures.map((feature: any) => (
                <Card
                  key={feature.id}
                  className={`cursor-pointer transition-colors ${
                    selectedFeatures.includes(feature.id.toString())
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => toggleFeature(feature.id.toString())}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{feature.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                        {feature.base_cost && (
                          <p className="text-sm font-semibold mt-2">
                            GHS {Number(feature.base_cost).toLocaleString()}
                          </p>
                        )}
                      </div>
                      {selectedFeatures.includes(feature.id.toString()) && (
                        <Check className="w-5 h-5 text-primary flex-shrink-0 ml-2" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {(!ecoFeatures || ecoFeatures.length === 0) && (
          <p className="text-center text-muted-foreground py-8">
            No eco features available at this time. You can skip this step.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

// Step 4: Budget & Timeline
const Step4Budget = ({ register, errors, formData, setValue }: any) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget & Timeline</CardTitle>
        <CardDescription>Help us understand your budget and timeline expectations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="budget">Budget *</Label>
            <Input
              id="budget"
              type="number"
              {...register("budget", { required: "Budget is required" })}
              defaultValue={formData.budget}
              placeholder="e.g., 500000"
            />
            {errors.budget && <p className="text-sm text-red-600 mt-1">{errors.budget.message}</p>}
          </div>

          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select defaultValue={formData.currency || "GHS"} onValueChange={(value) => setValue("currency", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GHS">GHS (Ghanaian Cedi)</SelectItem>
                <SelectItem value="USD">USD (US Dollar)</SelectItem>
                <SelectItem value="EUR">EUR (Euro)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="timeline">Preferred Timeline</Label>
          <Input
            id="timeline"
            {...register("timeline")}
            defaultValue={formData.timeline}
            placeholder="e.g., 6 months, Start in January 2024"
          />
          <p className="text-sm text-muted-foreground mt-1">
            When would you like to start and complete this project?
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// Step 5: Review
const Step5Review = ({ formData }: any) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Your Request</CardTitle>
        <CardDescription>Please review all information before submitting</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold mb-2">Project Details</h3>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">Title:</dt>
            <dd className="font-medium">{formData.title}</dd>
            <dt className="text-muted-foreground">Type:</dt>
            <dd className="font-medium">
              {CONSTRUCTION_TYPES.find((t) => t.value === formData.construction_type)?.label}
            </dd>
          </dl>
          {formData.description && (
            <p className="text-sm text-muted-foreground mt-2">{formData.description}</p>
          )}
        </div>

        <div>
          <h3 className="font-semibold mb-2">Location</h3>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {formData.property_id ? (
              <>
                <dt className="text-muted-foreground">Property ID:</dt>
                <dd className="font-medium">{formData.property_id}</dd>
              </>
            ) : (
              <>
                <dt className="text-muted-foreground">Address:</dt>
                <dd className="font-medium">{formData.address}</dd>
                <dt className="text-muted-foreground">City:</dt>
                <dd className="font-medium">{formData.city}</dd>
                <dt className="text-muted-foreground">Region:</dt>
                <dd className="font-medium">{formData.region}</dd>
              </>
            )}
          </dl>
        </div>

        {formData.selected_eco_features && formData.selected_eco_features.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Eco Features</h3>
            <p className="text-sm">{formData.selected_eco_features.length} features selected</p>
          </div>
        )}

        <div>
          <h3 className="font-semibold mb-2">Budget & Timeline</h3>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">Budget:</dt>
            <dd className="font-medium">
              {formData.currency} {Number(formData.budget).toLocaleString()}
            </dd>
            {formData.timeline && (
              <>
                <dt className="text-muted-foreground">Timeline:</dt>
                <dd className="font-medium">{formData.timeline}</dd>
              </>
            )}
          </dl>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConstructionRequestForm;
