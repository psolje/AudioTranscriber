import React, { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { useTest } from "@/context/test-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

const Home: React.FC = () => {
  const [, setLocation] = useLocation();
  const { login, adminLogin, isLoading } = useAuth();
  const { setTestMode } = useTest();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [testModeValue, setTestModeValue] = useState("standard");
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    try {
      if (isAdminLogin) {
        // Admin login
        if (!email || !password) {
          toast({
            title: "Error",
            description: "Please enter both email and password",
            variant: "destructive",
          });
          return;
        }
        
        const user = await adminLogin(email, password);
        
        if (user) {
          setLocation("/admin");
        } else {
          toast({
            title: "Login Failed",
            description: "Invalid admin credentials",
            variant: "destructive",
          });
        }
      } else {
        // Regular user login
        if (!name || !email) {
          toast({
            title: "Error",
            description: "Please enter both name and email",
            variant: "destructive",
          });
          return;
        }
        
        await login(name, email);
        
        // Set the test mode
        setTestMode(testModeValue as "standard" | "extended");
        
        // Navigate to the test page
        setLocation("/test");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Error",
        description: "An error occurred during login. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleAdminLogin = () => {
    setIsAdminLogin(!isAdminLogin);
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      {/* Header */}
      <header className="bg-primary shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center h-16">
            <div className="flex items-center">
              <h1 className="text-white font-medium text-lg">Audio Transcription Tool</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-6 text-center">
              {isAdminLogin ? "Admin Login" : "Welcome to the Audio Transcription Tool"}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isAdminLogin && (
                <div>
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required={!isAdminLogin}
                  />
                </div>
              )}
              
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>
              
              {isAdminLogin && (
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={isAdminLogin}
                  />
                </div>
              )}
              
              {!isAdminLogin && (
                <div>
                  <Label className="block mb-1">Test Mode</Label>
                  <RadioGroup
                    value={testModeValue}
                    onValueChange={setTestModeValue}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="standard" id="standard" />
                      <Label htmlFor="standard">Standard (5 audio samples)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="extended" id="extended" />
                      <Label htmlFor="extended">Extended (10 audio samples)</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
              
              <div>
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-dark"
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : isAdminLogin ? "Login" : "Start Transcription Test"}
                </Button>
              </div>
              
              <div className="mt-2 text-center">
                <Button
                  variant="link"
                  type="button"
                  onClick={toggleAdminLogin}
                  className="text-sm text-primary hover:underline"
                >
                  {isAdminLogin ? "Take a Test" : "Admin Login"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Home;
