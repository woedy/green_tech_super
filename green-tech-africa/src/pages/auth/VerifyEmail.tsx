import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "@/lib/api";

const VerifyEmail = () => {
  const [params] = useSearchParams();
  const email = params.get("email");
  const uid = params.get("uid");
  const token = params.get("token");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("Check your inbox for a verification link.");

  const verify = useCallback(async () => {
    if (!uid || !token) {
      setStatus("error");
      setMessage("Missing verification token. Please use the link from your email.");
      return;
    }
    setStatus("loading");
    try {
      const response = await api.post<{ message: string }>("/api/v1/accounts/verify-email/", { uid, token });
      setStatus("success");
      setMessage(response.message ?? "Your email has been verified. You can now sign in.");
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unable to verify email.";
      setStatus("error");
      setMessage(detail);
    }
  }, [uid, token]);

  useEffect(() => {
    if (uid && token) {
      void verify();
    }
  }, [uid, token, verify]);

  return (
    <Layout>
      <section className="min-h-[70vh] flex items-center justify-center bg-gradient-to-br from-background via-accent/30 to-background py-16">
        <div className="w-full max-w-md px-4">
          <Card className="shadow-medium text-center">
            <CardHeader>
              <CardTitle className="text-2xl">Verify your email</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                {message}
                {email && status !== "success" && (
                  <>
                    {" "}
                    <span className="font-medium text-foreground">{email}</span>
                  </>
                )}
              </p>
              <div className="flex flex-col gap-2">
                {status !== "success" && (
                  <Button onClick={verify} disabled={status === "loading"}>
                    {status === "loading" ? "Verifying..." : "Verify email"}
                  </Button>
                )}
                <Button variant="outline" asChild>
                  <Link to="/auth/login">Return to sign in</Link>
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
