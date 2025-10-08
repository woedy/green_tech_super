import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, ArrowLeft, ArrowRight } from 'lucide-react';
import { ConstructionFormData, ConstructionWizardStep } from '@/types/construction';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { LocationBudgetStep } from './steps/LocationBudgetStep';
import { EcoFeaturesStep } from './steps/EcoFeaturesStep';
import { CustomizationStep } from './steps/CustomizationStep';
import { ReviewStep } from './steps/ReviewStep';
import { useConstructionCalculator } from '@/hooks/useConstructionCalculator';

const WIZARD_STEPS: ConstructionWizardStep[] = [
  {
    id: 'basic-info',
    title: 'Basic Information',
    description: 'Tell us about yourself and your project',
    isComplete: false,
    isActive: true
  },
  {
    id: 'location-budget',
    title: 'Location & Budget',
    description: 'Where will you build and what\'s your budget?',
    isComplete: false,
    isActive: false
  },
  {
    id: 'eco-features',
    title: 'Eco Features',
    description: 'Choose sustainable features for your building',
    isComplete: false,
    isActive: false
  },
  {
    id: 'customization',
    title: 'Customization',
    description: 'Add special requirements and customizations',
    isComplete: false,
    isActive: false
  },
  {
    id: 'review',
    title: 'Review & Submit',
    description: 'Review your selections and submit your request',
    isComplete: false,
    isActive: false
  }
];

interface ConstructionWizardProps {
  onSubmit: (data: ConstructionFormData) => void;
  onCancel: () => void;
}

export const ConstructionWizard = ({ onSubmit, onCancel }: ConstructionWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState(WIZARD_STEPS);
  const [formData, setFormData] = useState<ConstructionFormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    projectTitle: '',
    location: '',
    region: '',
    budgetRange: '',
    timeline: '',
    selectedFeatures: [],
    customizations: '',
    specialRequirements: '',
    totalCost: 0,
    sustainabilityScore: 0,
    estimatedSavings: {
      monthly: 0,
      annual: 0
    }
  });

  const { calculateCost, calculateSustainabilityScore, calculateSavings } = useConstructionCalculator();

  const updateFormData = useCallback((updates: Partial<ConstructionFormData>) => {
    setFormData(prev => {
      const newData = { ...prev, ...updates };
      
      // Recalculate derived values when features or region change
      if (updates.selectedFeatures || updates.region) {
        newData.totalCost = calculateCost(newData.selectedFeatures, newData.region);
        newData.sustainabilityScore = calculateSustainabilityScore(newData.selectedFeatures);
        newData.estimatedSavings = calculateSavings(newData.selectedFeatures);
      }
      
      return newData;
    });
  }, [calculateCost, calculateSustainabilityScore, calculateSavings]);

  const validateStep = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0: // Basic Info
        return !!(formData.customerName && formData.customerEmail && formData.projectTitle);
      case 1: // Location & Budget
        return !!(formData.location && formData.region && formData.budgetRange && formData.timeline);
      case 2: // Eco Features
        return formData.selectedFeatures.length > 0;
      case 3: // Customization
        return true; // Optional step
      case 4: // Review
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1 && validateStep(currentStep)) {
      const newSteps = [...steps];
      newSteps[currentStep].isComplete = true;
      newSteps[currentStep].isActive = false;
      newSteps[currentStep + 1].isActive = true;
      setSteps(newSteps);
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const newSteps = [...steps];
      newSteps[currentStep].isActive = false;
      newSteps[currentStep - 1].isActive = true;
      newSteps[currentStep - 1].isComplete = false;
      setSteps(newSteps);
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    if (stepIndex <= currentStep || steps[stepIndex - 1]?.isComplete) {
      const newSteps = steps.map((step, index) => ({
        ...step,
        isActive: index === stepIndex,
        isComplete: index < stepIndex
      }));
      setSteps(newSteps);
      setCurrentStep(stepIndex);
    }
  };

  const handleSubmit = () => {
    if (validateStep(currentStep)) {
      onSubmit(formData);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const isStepValid = validateStep(currentStep);

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <BasicInfoStep
            data={formData}
            onUpdate={updateFormData}
          />
        );
      case 1:
        return (
          <LocationBudgetStep
            data={formData}
            onUpdate={updateFormData}
          />
        );
      case 2:
        return (
          <EcoFeaturesStep
            data={formData}
            onUpdate={updateFormData}
          />
        );
      case 3:
        return (
          <CustomizationStep
            data={formData}
            onUpdate={updateFormData}
          />
        );
      case 4:
        return (
          <ReviewStep
            data={formData}
            onUpdate={updateFormData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Construction Request Wizard</h1>
        <p className="text-muted-foreground">
          Let's create your custom eco-friendly building plan
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Navigation */}
      <div className="flex flex-wrap gap-2 justify-center">
        {steps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => goToStep(index)}
            disabled={index > currentStep && !steps[index - 1]?.isComplete}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              step.isActive
                ? 'bg-primary text-primary-foreground'
                : step.isComplete
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : index <= currentStep
                ? 'bg-muted hover:bg-muted/80'
                : 'bg-muted/50 text-muted-foreground cursor-not-allowed'
            }`}
          >
            {step.isComplete ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{step.title}</span>
            <span className="sm:hidden">{index + 1}</span>
          </button>
        ))}
      </div>

      {/* Current Step Content */}
      <Card className="min-h-[500px]">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div>
              <h2 className="text-xl">{steps[currentStep].title}</h2>
              <p className="text-sm text-muted-foreground font-normal">
                {steps[currentStep].description}
              </p>
            </div>
            {formData.totalCost > 0 && (
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  GHS {formData.totalCost.toLocaleString()}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    Green Score: {formData.sustainabilityScore}
                  </Badge>
                  {formData.estimatedSavings.annual > 0 && (
                    <Badge variant="outline">
                      Saves GHS {formData.estimatedSavings.annual}/year
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={prevStep}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {currentStep < steps.length - 1 ? (
            <Button
              onClick={nextStep}
              disabled={!isStepValid}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!isStepValid}
              className="bg-green-600 hover:bg-green-700"
            >
              Submit Request
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};