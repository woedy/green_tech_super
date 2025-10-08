import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ConstructionFormData } from '@/types/construction';

interface BasicInfoStepProps {
  data: ConstructionFormData;
  onUpdate: (updates: Partial<ConstructionFormData>) => void;
}

export const BasicInfoStep = ({ data, onUpdate }: BasicInfoStepProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="customerName">Full Name *</Label>
          <Input
            id="customerName"
            value={data.customerName}
            onChange={(e) => onUpdate({ customerName: e.target.value })}
            placeholder="Enter your full name"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="customerEmail">Email Address *</Label>
          <Input
            id="customerEmail"
            type="email"
            value={data.customerEmail}
            onChange={(e) => onUpdate({ customerEmail: e.target.value })}
            placeholder="your.email@example.com"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="customerPhone">Phone Number</Label>
          <Input
            id="customerPhone"
            type="tel"
            value={data.customerPhone}
            onChange={(e) => onUpdate({ customerPhone: e.target.value })}
            placeholder="+233 XX XXX XXXX"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="projectTitle">Project Title *</Label>
          <Input
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