import { Route, Switch } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/auth-context";
import { TestProvider } from "./context/test-context";
import { Toaster } from "@/components/ui/toaster";

import Home from "@/pages/home";
import TranscriptionTest from "@/pages/transcription-test";
import AdminDashboard from "@/pages/admin";
import AudioTest from "@/pages/audio-test";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/test" component={TranscriptionTest} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/audio-test" component={AudioTest} />
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
