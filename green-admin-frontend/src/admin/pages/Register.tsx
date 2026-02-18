import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Leaf, UserPlus, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { register as apiRegister } from "../api";

const registerSchema = z.object({
    first_name: z.string().min(2, "First name must be at least 2 characters"),
    last_name: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone_number: z.string().optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const AdminRegister = () => {
    const navigate = useNavigate();
    const { toast } = useToast();

    const form = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            email: "",
            password: "",
            confirmPassword: "",
            first_name: "",
            last_name: "",
            phone_number: "",
        },
    });

    const onSubmit = async (data: RegisterFormData) => {
        try {
            await apiRegister({
                email: data.email,
                password: data.password,
                confirm_password: data.confirmPassword,
                first_name: data.first_name,
                last_name: data.last_name,
                phone_number: data.phone_number || undefined,
                user_type: 'ADMIN' // Always ADMIN for this portal
            });

            toast({
                title: "Account created successfully",
                description: "Please check your email to verify your account.",
            });

            navigate('/verify-email', { state: { email: data.email } });
        } catch (error) {
            toast({
                title: "Registration failed",
                description: error instanceof Error ? error.message : "Please check your information and try again",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/30 to-background py-16 px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Leaf className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold">Green Tech Africa</h1>
                    </div>
                    <p className="text-muted-foreground">Administrator Portal Registration</p>
                </div>

                <Card className="shadow-lg">
                    <CardHeader className="text-center pb-4">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <UserPlus className="h-5 w-5 text-primary" />
                            <CardTitle>Create Admin Account</CardTitle>
                        </div>
                        <CardDescription>
                            Register to manage the Green Tech Africa platform
                        </CardDescription>
                    </CardHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <FormField
                                        control={form.control}
                                        name="first_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>First Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="John" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="last_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Last Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Doe" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email Address</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="admin@example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="phone_number"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone Number (Optional)</FormLabel>
                                            <FormControl>
                                                <Input type="tel" placeholder="+233..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="••••••••" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirm Password</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="••••••••" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <Mail className="h-4 w-4 text-blue-600 mt-0.5" />
                                        <div className="text-sm text-blue-800 dark:text-blue-200">
                                            <p className="font-medium">Verification Required</p>
                                            <p className="text-xs mt-1">
                                                A verification code will be sent to your email.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={form.formState.isSubmitting}
                                >
                                    {form.formState.isSubmitting ? 'Processing...' : 'Create Admin Account'}
                                </Button>

                                <div className="text-center text-sm text-muted-foreground pt-2">
                                    Already have an account?{' '}
                                    <Link to="/admin/login" className="text-primary hover:underline font-medium">
                                        Sign in here
                                    </Link>
                                </div>
                            </CardContent>
                        </form>
                    </Form>
                </Card>
            </div>
        </div>
    );
};

export default AdminRegister;
