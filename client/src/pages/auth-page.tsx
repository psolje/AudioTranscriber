import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { MicIcon, InfoIcon } from "lucide-react";

// Schema for regular user login (email only)
const userLoginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});
type UserLoginFormValues = z.infer<typeof userLoginSchema>;

// Schema for admin login
const adminLoginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});
type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

// Schema for registration
const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
});
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, login, adminLogin, register: registerUser } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("user");

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      // Check if there's a saved return path
      const returnPath = sessionStorage.getItem("returnPath");
      setLocation(returnPath || "/");
      try {
        sessionStorage.removeItem("returnPath"); // Clear it after use
      } catch (e) {
        console.error("Failed to clear return path:", e);
      }
    }
  }, [user, setLocation]);

  // Form for regular user login
  const userForm = useForm<UserLoginFormValues>({
    resolver: zodResolver(userLoginSchema),
    defaultValues: {
      email: "",
    },
  });

  // Form for admin login
  const adminForm = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Form for user registration
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  // Handle user login submit
  const onUserLoginSubmit = async (data: UserLoginFormValues) => {
    try {
      await login(data);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  // Handle admin login submit
  const onAdminLoginSubmit = async (data: AdminLoginFormValues) => {
    try {
      await adminLogin(data);
    } catch (error) {
      console.error("Admin login error:", error);
    }
  };

  // Handle registration submit
  const onRegisterSubmit = async (data: RegisterFormValues) => {
    try {
      await registerUser(data);
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  // If already logged in, show nothing (will redirect)
  if (user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left side: Auth forms */}
      <div className="flex flex-col justify-center w-full max-w-md p-8 md:p-12">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">Audio Transcription Tool</h1>
            <p className="text-sm text-muted-foreground mt-2">Sign in to access your testing dashboard</p>
          </div>

          <Tabs defaultValue="user" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="user">User</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            {/* User Login */}
            <TabsContent value="user">
              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-xl">Quick Access</CardTitle>
                  <CardDescription>
                    Enter your email to continue as a regular user.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...userForm}>
                    <form onSubmit={userForm.handleSubmit(onUserLoginSubmit)} className="space-y-4">
                      <FormField
                        control={userForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="name@example.com" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={userForm.formState.isSubmitting}>
                        {userForm.formState.isSubmitting ? "Signing in..." : "Continue with Email"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button variant="link" onClick={() => setActiveTab("register")}>
                    Don't have an account? Register
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Admin Login */}
            <TabsContent value="admin">
              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-xl">Admin Access</CardTitle>
                  <CardDescription>
                    Enter your admin credentials to access management features.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...adminForm}>
                    <form onSubmit={adminForm.handleSubmit(onAdminLoginSubmit)} className="space-y-4">
                      <FormField
                        control={adminForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="admin@example.com" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={adminForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input placeholder="••••••••" type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={adminForm.formState.isSubmitting}>
                        {adminForm.formState.isSubmitting ? "Signing in..." : "Admin Login"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-center text-xs text-muted-foreground">
                  <InfoIcon className="h-3 w-3 mr-1" /> For admin credentials, contact your system administrator
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Registration */}
            <TabsContent value="register">
              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-xl">Create an account</CardTitle>
                  <CardDescription>
                    Register to track your transcription progress and results.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="name@example.com" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={registerForm.formState.isSubmitting}>
                        {registerForm.formState.isSubmitting ? "Creating account..." : "Register"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-center">
                  <Button variant="link" onClick={() => setActiveTab("user")}>
                    Already have an account? Login
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side: Hero section */}
      <div className="hidden md:flex flex-col justify-center items-center w-full bg-gradient-to-br from-primary/5 to-primary/20">
        <div className="max-w-md text-center px-8">
          <div className="flex justify-center mb-6">
            <MicIcon className="h-16 w-16 text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Audio Transcription Testing Platform</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Test and improve your transcription skills with our advanced audio samples and performance analytics.
          </p>
          
          <Separator className="my-8" />
          
          <div className="grid grid-cols-2 gap-6 text-left">
            <div>
              <h3 className="font-medium">Real-time Evaluation</h3>
              <p className="text-sm text-muted-foreground mt-1">Get instant feedback on your transcription accuracy</p>
            </div>
            <div>
              <h3 className="font-medium">Performance Tracking</h3>
              <p className="text-sm text-muted-foreground mt-1">Monitor your progress with detailed analytics</p>
            </div>
            <div>
              <h3 className="font-medium">Varied Audio Samples</h3>
              <p className="text-sm text-muted-foreground mt-1">Practice with diverse audio content</p>
            </div>
            <div>
              <h3 className="font-medium">WPM Measurement</h3>
              <p className="text-sm text-muted-foreground mt-1">Track your typing speed during transcription</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}