import { Route, Switch } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/use-auth";
import { TestProvider } from "./context/test-context";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "@/components/protected-route";

import Home from "@/pages/home";
import TranscriptionTest from "@/pages/transcription-test";
import AdminDashboard from "@/pages/admin";
import AudioTest from "@/pages/audio-test";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => (
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      )} />
      <Route path="/test" component={() => (
        <ProtectedRoute>
          <TranscriptionTest />
        </ProtectedRoute>
      )} />
      <Route path="/admin" component={() => (
        <ProtectedRoute adminOnly>
          <AdminDashboard />
        </ProtectedRoute>
      )} />
      <Route path="/audio-test" component={() => (
        <ProtectedRoute>
          <AudioTest />
        </ProtectedRoute>
      )} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TestProvider>
          <Router />
          <Toaster />
        </TestProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
