import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCallback, useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const VerifyEmail = () => {
  const [params] = useSearchParams();
  const emailParam = params.get("email");
  const [email, setEmail] = useState(emailParam || "");
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [resendStatus, setResendStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || otp.length !== 4) return;

    setStatus("loading");
    try {
      await api.post<{ message: string }>("/api/v1/accounts/verify-email/", {
        email,
        otp_code: otp
      });
      setStatus("success");
      toast({
        title: "Success",
        description: "Email verified successfully. You can now log in.",
      });
      setTimeout(() => navigate("/auth/login"), 2000);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Invalid or expired OTP.";
      setStatus("error");
      toast({
        title: "Verification Failed",
        description: detail,
        variant: "destructive",
      });
    }
  };

  const handleResendOtp = async () => {
    if (!email || countdown > 0) return;

    setResendStatus("loading");
    try {
      await api.post<{ message: string }>("/api/v1/accounts/resend-otp/", { email });
      setResendStatus("success");
      setCountdown(60); // 60 seconds cooldown
      toast({
        title: "OTP Sent",
        description: "A new verification code has been sent to your email.",
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Failed to resend OTP.";
      setResendStatus("error");
      toast({
        title: "Error",
        description: detail,
        variant: "destructive",
      });
    } finally {
      if (resendStatus !== "success") {
        setResendStatus("idle");
      }
    }
  };

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  return (
    <Layout>
      <section className="min-h-[70vh] flex items-center justify-center bg-gradient-to-br from-background via-accent/30 to-background py-16">
        <div className="w-full max-w-md px-4">
          <Card className="shadow-medium">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-2xl font-bold">Verify your email</CardTitle>
              <CardDescription>
                Enter the 4-digit code sent to {email || "your email"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    disabled={status === "loading" || status === "success" || !!emailParam}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <div className="flex justify-center">
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="text-center text-2xl tracking-[0.5em] font-mono h-14 w-full"
                      placeholder="0000"
                      required
                      disabled={status === "loading" || status === "success"}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={status === "loading" || status === "success" || otp.length !== 4}
                >
                  {status === "loading" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Email"
                  )}
                </Button>
              </form>

              <div className="text-center space-y-4">
                <div className="text-sm text-muted-foreground">
                  Didn't receive the code?{" "}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={countdown > 0 || resendStatus === "loading" || !email}
                    className="text-primary hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                  </button>
                </div>

                <Button variant="link" asChild className="p-0 h-auto">
                  <Link to="/auth/login">Back to Sign In</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default VerifyEmail;
