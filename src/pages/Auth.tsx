import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { signIn, signUp } from "@/lib/auth";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";
import { Wallet } from "lucide-react";

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username too long").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isSignUp) {
        signUpSchema.parse(formData);
      } else {
        signInSchema.parse({ email: formData.email, password: formData.password });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);

    if (isSignUp) {
      const { error } = await signUp(formData.email, formData.password, {
        name: formData.name,
        username: formData.username,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Account created successfully! Please sign in.",
        });
        setIsSignUp(false);
        setFormData({ name: "", username: "", email: "", password: "" });
      }
    } else {
      const { error } = await signIn(formData.email, formData.password);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        navigate("/");
      }
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center pb-4">
          <div className="mx-auto mb-2 p-3 rounded-full bg-primary/10 w-fit">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </CardTitle>
          <CardDescription>
            {isSignUp 
              ? "Enter your details to get started" 
              : "Sign in to manage your finances"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="johndoe"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <Button
              variant="link"
              className="p-0 font-semibold"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setFormData({ name: "", username: "", email: "", password: "" });
              }}
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
