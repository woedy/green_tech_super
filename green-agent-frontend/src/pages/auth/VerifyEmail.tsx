import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyEmail } from "@/lib/api";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const VerifyEmail = () => {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      toast({
        title: "Error",
        description: "Email not found. Please register again.",
        variant: "destructive",
      });
      navigate("/register");
    }
  }, [email, navigate, toast]);

  const handleVerify = async () => {
    if (otp.length !== 4) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 4-digit code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await verifyEmail({ email, otp_code: otp });
      toast({
        title: "Email verified!",
        description: "You can now sign in to your account.",
      });
      navigate("/login");
    } catch (error) {
      toast({
        title: "Verification failed",
        description: error instanceof Error ? error.message : "Invalid verification code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/30 to-background py-16 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold">Verify Your Email</h1>
          </div>
          <p className="text-muted-foreground">
            We've sent a verification code to <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle>Enter Verification Code</CardTitle>
            <CardDescription>
              Enter the 4-digit code sent to your email address.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex justify-center py-4">
              <InputOTP
                maxLength={4}
                value={otp}
                onChange={(value) => setOtp(value)}
                render={({ slots }) => (
                  <InputOTPGroup>
                    {slots.map((slot, index) => (
                      <InputOTPSlot key={index} {...slot} />
                    ))}
                  </InputOTPGroup>
                )}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleVerify}
              disabled={isLoading || otp.length !== 4}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Verify Email
                </>
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Didn't receive the code?{' '}
              <button
                className="text-green-600 hover:underline font-medium bg-transparent border-none p-0 cursor-pointer"
                onClick={() => toast({ description: "Resend functionality coming soon" })}
              >
                Resend Code
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;