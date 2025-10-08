import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Calculator } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const changeOrderItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  type: z.enum(["addition", "removal", "modification"]),
  quantity: z.number().min(0, "Quantity must be positive"),
  unitCost: z.number().min(0, "Unit cost must be positive"),
  laborHours: z.number().min(0, "Labor hours must be positive").optional(),
  materialCost: z.number().min(0, "Material cost must be positive").optional(),
});

const changeOrderSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  reason: z.string().min(1, "Reason is required"),
  items: z.array(changeOrderItemSchema).min(1, "At least one item is required"),
  estimatedDays: z.number().min(0, "Estimated days must be positive").optional(),
});

type ChangeOrderFormData = z.infer<typeof changeOrderSchema>;

interface ChangeOrderFormProps {
  projectId: string;
  originalBudget: number;
  currency: string;
  onSubmit: (data: ChangeOrderFormData & { totalCostImpact: number }) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function ChangeOrderForm({
  projectId,
  originalBudget,
  currency,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ChangeOrderFormProps) {
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);

  const form = useForm<ChangeOrderFormData>({
    resolver: zodResolver(changeOrderSchema),
    defaultValues: {
      title: "",
      description: "",
      reason: "",
      items: [
        {
          description: "",
          type: "addition",
          quantity: 1,
          unitCost: 0,
          laborHours: 0,
          materialCost: 0,
        },
      ],
      estimatedDays: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");

  const calculateItemCost = (item: typeof watchedItems[0]) => {
    const baseCost = item.quantity * item.unitCost;
    const laborCost = (item.laborHours || 0) * 50; // Assuming $50/hour labor rate
    const materialCost = item.materialCost || 0;
    
    const totalCost = baseCost + laborCost + materialCost;
    
    return item.type === "removal" ? -totalCost : totalCost;
  };

  const totalCostImpact = watchedItems.reduce((sum, item) => {
    return sum + calculateItemCost(item);
  }, 0);

  const newBudget = originalBudget + totalCostImpact;
  const budgetChangePercentage = ((totalCostImpact / originalBudget) * 100);

  const handleSubmit = async (data: ChangeOrderFormData) => {
    await onSubmit({
      ...data,
      totalCostImpact,
    });
  };

  const addItem = () => {
    append({
      description: "",
      type: "addition",
      quantity: 1,
      unitCost: 0,
      laborHours: 0,
      materialCost: 0,
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "addition":
        return "bg-green-100 text-green-800";
      case "removal":
        return "bg-red-100 text-red-800";
      case "modification":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Change Order</CardTitle>
        <div className="text-sm text-muted-foreground">
          Project: {projectId} • Original Budget: {currency} {originalBudget.toLocaleString()}
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Change Order Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Additional bathroom installation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed description of the changes..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Change</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Why is this change necessary?"
                      className="min-h-[60px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estimatedDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Additional Days</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Change Items</h3>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>

              {fields.map((field, index) => (
                <Card key={field.id} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`items.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Item description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="addition">Addition</SelectItem>
                              <SelectItem value="removal">Removal</SelectItem>
                              <SelectItem value="modification">Modification</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.unitCost`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Cost ({currency})</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.laborHours`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Labor Hours (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.5"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.materialCost`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Material Cost ({currency})</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <Badge className={getTypeColor(watchedItems[index]?.type)}>
                      {watchedItems[index]?.type}
                    </Badge>
                    <div className="text-sm font-medium">
                      Item Cost: {currency} {calculateItemCost(watchedItems[index]).toLocaleString()}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Separator />

            {/* Cost Impact Summary */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Cost Impact Summary</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCostBreakdown(!showCostBreakdown)}
                >
                  <Calculator className="h-4 w-4 mr-1" />
                  {showCostBreakdown ? "Hide" : "Show"} Breakdown
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted">
                  <div className="text-sm text-muted-foreground">Original Budget</div>
                  <div className="text-lg font-semibold">
                    {currency} {originalBudget.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <div className="text-sm text-muted-foreground">Cost Impact</div>
                  <div className={`text-lg font-semibold ${totalCostImpact >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {totalCostImpact >= 0 ? '+' : ''}{currency} {totalCostImpact.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <div className="text-sm text-muted-foreground">New Budget</div>
                  <div className="text-lg font-semibold">
                    {currency} {newBudget.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-sm text-muted-foreground mb-1">Budget Change</div>
                <div className={`text-sm font-medium ${budgetChangePercentage >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {budgetChangePercentage >= 0 ? '+' : ''}{budgetChangePercentage.toFixed(1)}% from original budget
                </div>
              </div>

              {showCostBreakdown && (
                <div className="space-y-2">
                  <h4 className="font-medium">Item Breakdown</h4>
                  {watchedItems.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm p-2 rounded bg-muted/30">
                      <span>{item.description || `Item ${index + 1}`}</span>
                      <span className={item.type === "removal" ? "text-green-600" : "text-red-600"}>
                        {item.type === "removal" ? "-" : "+"}{currency} {Math.abs(calculateItemCost(item)).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Change Order"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}