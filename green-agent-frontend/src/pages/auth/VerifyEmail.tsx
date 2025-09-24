import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSearchParams, Link } from "react-router-dom";

const VerifyEmail = () => {
  const [params] = useSearchParams();
  const email = params.get("email");

  return (
    <Layout>
      <section className="min-h-[70vh] flex items-center justify-center bg-gradient-to-br from-background via-accent/30 to-background py-16">
        <div className="w-full max-w-md px-4">
          <Card className="shadow-medium text-center">
            <CardHeader>
              <CardTitle className="text-2xl">Verify your email</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                We sent a verification link to
                {" "}
                <span className="font-medium text-foreground">{email ?? "your email"}</span>.
                {" "}This is a placeholder screen.
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild>
                  <Link to="/auth/login">Continue to Sign In</Link>
                </Button>
                <Button variant="outline">Resend email</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default VerifyEmail;

