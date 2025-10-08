import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Leaf, Droplet, Hammer, Recycle, Zap } from "lucide-react";

interface EcoFeature {
  id: string;
  name: string;
  category: string;
  baseCost: number;
  sustainabilityPoints: number;
  description: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  features: EcoFeature[];
  icon: typeof Leaf;
  color: string;
}

const ECO_FEATURES: EcoFeature[] = [
  {
    id: "solar-panels",
    name: "Solar Panel System",
    category: "energy",
    baseCost: 8000,
    sustainabilityPoints: 25,
    description: "Complete rooftop solar installation",
  },
  {
    id: "battery-storage",
    name: "Battery Storage System",
    category: "energy",
    baseCost: 4500,
    sustainabilityPoints: 15,
    description: "Lithium-ion battery backup",
  },
  {
    id: "led-lighting",
    name: "LED Lighting Package",
    category: "energy",
    baseCost: 1200,
    sustainabilityPoints: 8,
    description: "Energy-efficient LED lighting",
  },
  {
    id: "rainwater-harvesting",
    name: "Rainwater Harvesting System",
    category: "water",
    baseCost: 3500,
    sustainabilityPoints: 20,
    description: "Complete rainwater collection system",
  },
  {
    id: "greywater-recycling",
    name: "Greywater Recycling System",
    category: "water",
    baseCost: 2800,
    sustainabilityPoints: 18,
    description: "Water reuse system",
  },
  {
    id: "water-efficient-fixtures",
    name: "Water-Efficient Fixtures",
    category: "water",
    baseCost: 1500,
    sustainabilityPoints: 10,
    description: "Low-flow fixtures",
  },
  {
    id: "eco-cement",
    name: "Eco-Friendly Cement",
    category: "materials",
    baseCost: 2200,
    sustainabilityPoints: 15,
    description: "Low-carbon cement",
  },
  {
    id: "recycled-steel",
    name: "Recycled Steel Framework",
    category: "materials",
    baseCost: 5500,
    sustainabilityPoints: 22,
    description: "Recycled structural steel",
  },
  {
    id: "local-timber",
    name: "Locally Sourced Timber",
    category: "materials",
    baseCost: 3200,
    sustainabilityPoints: 18,
    description: "Sustainable local wood",
  },
  {
    id: "smart-thermostats",
    name: "Smart Climate Control",
    category: "smart",
    baseCost: 2200,
    sustainabilityPoints: 15,
    description: "Intelligent HVAC control",
  },
  {
    id: "iot-energy-meters",
    name: "IoT Energy Meters",
    category: "smart",
    baseCost: 1500,
    sustainabilityPoints: 10,
    description: "Real-time energy monitoring",
  },
];

const TEMPLATES: Template[] = [
  {
    id: "basic-eco",
    name: "Basic Eco Package",
    description: "Essential sustainable features for budget-conscious projects",
    icon: Leaf,
    color: "text-green-600",
    features: [
      ECO_FEATURES.find((f) => f.id === "led-lighting")!,
      ECO_FEATURES.find((f) => f.id === "water-efficient-fixtures")!,
      ECO_FEATURES.find((f) => f.id === "eco-cement")!,
    ],
  },
  {
    id: "solar-power",
    name: "Solar Power Package",
    description: "Complete solar energy solution with battery backup",
    icon: Zap,
    color: "text-yellow-600",
    features: [
      ECO_FEATURES.find((f) => f.id === "solar-panels")!,
      ECO_FEATURES.find((f) => f.id === "battery-storage")!,
      ECO_FEATURES.find((f) => f.id === "iot-energy-meters")!,
    ],
  },
  {
    id: "water-conservation",
    name: "Water Conservation Package",
    description: "Comprehensive water management and recycling",
    icon: Droplet,
    color: "text-blue-600",
    features: [
      ECO_FEATURES.find((f) => f.id === "rainwater-harvesting")!,
      ECO_FEATURES.find((f) => f.id === "greywater-recycling")!,
      ECO_FEATURES.find((f) => f.id === "water-efficient-fixtures")!,
    ],
  },
  {
    id: "sustainable-materials",
    name: "Sustainable Materials Package",
    description: "Eco-friendly building materials for reduced carbon footprint",
    icon: Hammer,
    color: "text-orange-600",
    features: [
      ECO_FEATURES.find((f) => f.id === "eco-cement")!,
      ECO_FEATURES.find((f) => f.id === "recycled-steel")!,
      ECO_FEATURES.find((f) => f.id === "local-timber")!,
    ],
  },
  {
    id: "premium-eco",
    name: "Premium Eco Package",
    description: "Complete sustainable building solution with all features",
    icon: Recycle,
    color: "text-emerald-600",
    features: [
      ECO_FEATURES.find((f) => f.id === "solar-panels")!,
      ECO_FEATURES.find((f) => f.id === "battery-storage")!,
      ECO_FEATURES.find((f) => f.id === "rainwater-harvesting")!,
      ECO_FEATURES.find((f) => f.id === "greywater-recycling")!,
      ECO_FEATURES.find((f) => f.id === "recycled-steel")!,
      ECO_FEATURES.find((f) => f.id === "smart-thermostats")!,
    ],
  },
];

interface EcoFeatureTemplatesProps {
  currency: string;
  regionalMultiplier: number;
  onApplyTemplate: (features: EcoFeature[]) => void;
}

export function EcoFeatureTemplates({ currency, regionalMultiplier, onApplyTemplate }: EcoFeatureTemplatesProps) {
  const calculateTemplateTotal = (features: EcoFeature[]) => {
    return features.reduce((sum, feature) => sum + feature.baseCost * regionalMultiplier, 0);
  };

  const calculateSustainabilityPoints = (features: EcoFeature[]) => {
    return features.reduce((sum, feature) => sum + feature.sustainabilityPoints, 0);
  };

  const formatCurrency = (amount: number) => {
    return `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Eco-Feature Templates</CardTitle>
        <CardDescription>
          Quick-start templates with Ghana-specific eco-features and pricing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {TEMPLATES.map((template) => {
          const Icon = template.icon;
          const total = calculateTemplateTotal(template.features);
          const points = calculateSustainabilityPoints(template.features);

          return (
            <div key={template.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${template.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{template.name}</h4>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onApplyTemplate(template.features)}
                >
                  Apply
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {template.features.map((feature) => (
                  <Badge key={feature.id} variant="secondary" className="text-xs">
                    {feature.name}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm pt-2 border-t">
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">
                    {template.features.length} features
                  </span>
                  <Badge variant="outline" className="text-green-600">
                    <Leaf className="w-3 h-3 mr-1" />
                    {points} pts
                  </Badge>
                </div>
                <span className="font-semibold">{formatCurrency(total)}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
