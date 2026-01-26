import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Mail, CheckCircle, Leaf } from "lucide-react";

const VerifyEmail = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/30 to-background py-16 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Leaf className="h-6 w-6 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold">Green Tech Africa</h1>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <CardTitle>Check Your Email</CardTitle>
            </div>
          </CardHeader>
          
          <CardContent className="text-center space-y-4">
            <div className="p-6 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <CheckCircle className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                Registration Successful!
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                We've sent a verification email to your inbox. Please click the verification link to activate your account.
              </p>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong>Next steps:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1 text-left">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the verification link in the email</li>
                <li>Return here to sign in to your account</li>
              </ol>
            </div>

            <div className="pt-4">
              <Link to="/login">
                <Button className="w-full">
                  Back to Sign In
                </Button>
              </Link>
            </div>

            <div className="text-xs text-muted-foreground">
              Didn't receive the email? Check your spam folder or contact support.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;