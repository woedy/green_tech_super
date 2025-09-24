import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { setUser } from "@/lib/demoAuth";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Persist a demo user for header state
      setUser({ id: crypto.randomUUID(), email, name: email.split("@")[0] });
      toast({ title: "Logged in (placeholder)", description: `Welcome back, ${email}` });
      navigate("/account");
    }, 700);
  };

  return (
    <Layout>
      <section className="min-h-[70vh] flex items-center justify-center bg-gradient-to-br from-background via-accent/30 to-background py-16">
        <div className="w-full max-w-md px-4">
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Sign in to your account</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="remember" checked={remember} onCheckedChange={(v) => setRemember(Boolean(v))} />
                    <Label htmlFor="remember" className="text-sm text-muted-foreground">Remember me</Label>
                  </div>
                  <Link to="/auth/forgot" className="text-sm text-primary hover:underline">Forgot password?</Link>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
              <div className="text-center text-sm text-muted-foreground mt-4">
                Don’t have an account?{" "}
                <Link to="/auth/register" className="text-primary hover:underline">Create one</Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default Login;
