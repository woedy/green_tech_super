import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterFormData } from "@/lib/validation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

/**
 * ValidationDemo Component
 * 
 * This component demonstrates the improved validation system with:
 * - Real-time field validation
 * - Descriptive error messages
 * - Clear success states
 * - Helpful format guidance
 */
export const ValidationDemo = () => {
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onBlur", // Validate on blur for better UX
  });

  const onSubmit = async (data: RegisterFormData) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Form submitted with valid data:", data);
    alert("Form submitted successfully! Check console for data.");
  };

  const getFieldState = (fieldName: keyof RegisterFormData) => {
    const fieldState = form.getFieldState(fieldName);
    const fieldValue = form.getValues(fieldName);
    
    return {
      hasError: !!fieldState.error,
      isValid: !fieldState.error && fieldValue && fieldState.isTouched,
      isEmpty: !fieldValue,
      isTouched: fieldState.isTouched,
    };
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Validation Demo
            <Badge variant="outline">Interactive</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Try filling out the form to see the improved validation in action. 
            Notice how errors appear with helpful, descriptive messages.
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => {
                    const state = getFieldState("firstName");
                    return (
                      <FormItem>
                        <FormLabel className={state.isValid ? "text-green-600" : ""}>
                          First Name {state.isValid && "✓"}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Jane" 
                            {...field}
                            className={
                              state.hasError ? "border-red-500" : 
                              state.isValid ? "border-green-500" : ""
                            }
                          />
                        </FormControl>
                        <FormMessage />
                        {!state.hasError && !state.isEmpty && (
                          <FormDescription className="text-green-600 text-xs">
                            ✓ Valid name format
                          </FormDescription>
                        )}
                      </FormItem>
                    );
                  }}
                />
                
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => {
                    const state = getFieldState("lastName");
                    return (
                      <FormItem>
                        <FormLabel className={state.isValid ? "text-green-600" : ""}>
                          Last Name {state.isValid && "✓"}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Doe" 
                            {...field}
                            className={
                              state.hasError ? "border-red-500" : 
                              state.isValid ? "border-green-500" : ""
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => {
                  const state = getFieldState("email");
                  return (
                    <FormItem>
                      <FormLabel className={state.isValid ? "text-green-600" : ""}>
                        Email Address {state.isValid && "✓"}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="jane@example.com" 
                          {...field}
                          className={
                            state.hasError ? "border-red-500" : 
                            state.isValid ? "border-green-500" : ""
                          }
                        />
                      </FormControl>
                      <FormMessage />
                      <FormDescription>
                        We'll use this to send you important updates about your account.
                      </FormDescription>
                    </FormItem>
                  );
                }}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => {
                  const state = getFieldState("phone");
                  return (
                    <FormItem>
                      <FormLabel className={state.isValid ? "text-green-600" : ""}>
                        Phone Number (Optional) {state.isValid && "✓"}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="+233 XX XXX XXXX" 
                          {...field}
                          className={
                            state.hasError ? "border-red-500" : 
                            state.isValid ? "border-green-500" : ""
                          }
                        />
                      </FormControl>
                      <FormMessage />
                      <FormDescription>
                        Include country code for international numbers.
                      </FormDescription>
                    </FormItem>
                  );
                }}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => {
                  const state = getFieldState("password");
                  return (
                    <FormItem>
                      <FormLabel className={state.isValid ? "text-green-600" : ""}>
                        Password {state.isValid && "✓"}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field}
                          className={
                            state.hasError ? "border-red-500" : 
                            state.isValid ? "border-green-500" : ""
                          }
                        />
                      </FormControl>
                      <FormMessage />
                      <FormDescription>
                        Must be at least 8 characters with uppercase, lowercase, number, and special character.
                      </FormDescription>
                    </FormItem>
                  );
                }}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => {
                  const state = getFieldState("confirmPassword");
                  return (
                    <FormItem>
                      <FormLabel className={state.isValid ? "text-green-600" : ""}>
                        Confirm Password {state.isValid && "✓"}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field}
                          className={
                            state.hasError ? "border-red-500" : 
                            state.isValid ? "border-green-500" : ""
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              
              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={form.formState.isSubmitting || !form.formState.isValid}
                >
                  {form.formState.isSubmitting ? "Creating account..." : "Create Account"}
                </Button>
                
                <div className="mt-2 text-center">
                  <Badge variant={form.formState.isValid ? "default" : "secondary"}>
                    Form is {form.formState.isValid ? "valid" : "invalid"}
                  </Badge>
                </div>
              </div>
            </form>
          </Form>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Validation Features Demonstrated:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Real-time validation on field blur</li>
              <li>• Descriptive error messages with clear instructions</li>
              <li>• Visual feedback with colored borders and checkmarks</li>
              <li>• Helpful format examples in placeholders</li>
              <li>• Form submission prevention when invalid</li>
              <li>• Password strength requirements clearly stated</li>
              <li>• Cross-field validation (password confirmation)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};