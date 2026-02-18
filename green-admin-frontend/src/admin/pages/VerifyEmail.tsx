import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { verifyEmail } from "../api";

const AdminVerifyEmail = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const [otp, setOtp] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);

    const email = location.state?.email;

    useEffect(() => {
        if (!email) {
            toast({
                title: "Missing Information",
                description: "Please register first.",
                variant: "destructive"
            });
            navigate("/register");
        }
    }, [email, navigate, toast]);

    const handleVerify = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (otp.length !== 4) {
            toast({
                title: "Invalid Code",
                description: "Please enter the 4-digit code sent to your email.",
                variant: "destructive"
            });
            return;
        }

        setIsVerifying(true);
        try {
            await verifyEmail(email, otp);
            toast({
                title: "Email Verified",
                description: "Your account is now active. You can sign in.",
            });
            navigate("/admin/login");
        } catch (error) {
            toast({
                title: "Verification Failed",
                description: error instanceof Error ? error.message : "Invalid verification code.",
                variant: "destructive"
            });
        } finally {
            setIsVerifying(false);
        }
    };

    if (!email) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/30 to-background py-12 px-4">
            <div className="w-full max-w-md">
                <Button
                    variant="ghost"
                    className="mb-8 hover:bg-white/50"
                    onClick={() => navigate("/register")}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Registration
                </Button>

                <Card className="shadow-lg border-primary/10">
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 bg-primary/10 rounded-full">
                                <Mail className="h-8 w-8 text-primary" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
                        <CardDescription className="text-base mt-2">
                            We've sent a 4-digit verification code to <br />
                            <span className="font-semibold text-foreground">{email}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleVerify} className="space-y-6">
                            <div className="flex flex-col items-center space-y-4">
                                <InputOTP
                                    maxLength={4}
                                    value={otp}
                                    onChange={(value) => setOtp(value)}
                                >
                                    <InputOTPGroup className="gap-2">
                                        <InputOTPSlot index={0} className="w-12 h-14 text-xl" />
                                        <InputOTPSlot index={1} className="w-12 h-14 text-xl" />
                                        <InputOTPSlot index={2} className="w-12 h-14 text-xl" />
                                        <InputOTPSlot index={3} className="w-12 h-14 text-xl" />
                                    </InputOTPGroup>
                                </InputOTP>
                                <p className="text-sm text-muted-foreground">
                                    Enter the code from the email to activate your account
                                </p>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11"
                                disabled={isVerifying || otp.length !== 4}
                            >
                                {isVerifying ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    "Verify & Activate"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminVerifyEmail;
