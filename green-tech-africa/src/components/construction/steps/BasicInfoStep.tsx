import { ConstructionFormData } from '@/types/construction';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { basicInfoSchema, type BasicInfoFormData } from "@/lib/validation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';

interface BasicInfoStepProps {
  data: ConstructionFormData;
  onUpdate: (updates: Partial<ConstructionFormData>) => void;
}

export const BasicInfoStep = ({ data, onUpdate }: BasicInfoStepProps) => {
  const form = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      customerName: data.customerName || "",
      customerEmail: data.customerEmail || "",
      customerPhone: data.customerPhone || "",
      projectTitle: data.projectTitle || "",
    },
  });

  // Update parent form data when local form changes
  const handleFieldChange = (field: keyof BasicInfoFormData, value: string) => {
    onUpdate({ [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="customerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your full name"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    handleFieldChange('customerName', e.target.value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="customerEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address *</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    handleFieldChange('customerEmail', e.target.value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="customerPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="+233 XX XXX XXXX"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    handleFieldChange('customerPhone', e.target.value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="projectTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Title *</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., My Dream Eco Home"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    handleFieldChange('projectTitle', e.target.value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
            id="projectTitle"
            value={data.projectTitle}
            onChange={(e) => onUpdate({ projectTitle: e.target.value })}
            placeholder="e.g., My Eco-Friendly Family Home"
            required
          />
        </div>
      </div>
      
      <div className="bg-muted/50 p-4 rounded-lg">
        <h3 className="font-medium mb-2">About This Wizard</h3>
        <p className="text-sm text-muted-foreground">
          This wizard will guide you through creating a custom construction request for your eco-friendly building project. 
          We'll help you select sustainable features, calculate costs with Ghana-specific pricing, and generate a detailed 
          specification document for builders to quote from.
        </p>
      </div>
    </div>
  );
};