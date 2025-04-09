import React from 'react';
import { Route, Switch, Link, useLocation } from 'wouter';
import { Toaster } from '@/components/ui/toaster';

// Pages and components
import { AudioSamplesManager } from '@/components/admin/audio-samples-manager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import TestPage from '@/pages/test-page';

const HomePage = () => {
  const [, navigate] = useLocation();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Audio Transcription Tool</CardTitle>
          <CardDescription>Test and improve your transcription skills</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Welcome to the Audio Transcription Tool. This application helps you practice and improve your audio transcription skills.</p>
          <p className="mb-4">Features:</p>
          <ul className="list-disc pl-5 space-y-2 mb-4">
            <li>Take transcription tests with random audio samples</li>
            <li>Get accuracy scores and improvement metrics</li>
            <li>Track your progress over time</li>
            <li>Admin dashboard for managing audio samples</li>
          </ul>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate('/test')}>Test Your Skills</Button>
          <Button onClick={() => navigate('/admin')}>View Admin Dashboard</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

const AdminPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Admin Dashboard</CardTitle>
          <CardDescription>Manage your audio transcription database</CardDescription>
        </CardHeader>
      </Card>
      <AudioSamplesManager />
    </div>
  );
};

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="mb-6">The page you are looking for does not exist.</p>
      <Button href="/">Return Home</Button>
    </div>
  );
};

function App() {
  const [location] = useLocation();
  
  return (
    <div className="min-h-screen">
      <header className="bg-primary py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-white text-2xl font-bold">Audio Transcription Tool</h1>
          <nav>
            <ul className="flex space-x-4">
              <li>
                <Link 
                  href="/" 
                  className={`text-white hover:text-primary-foreground ${location === '/' ? 'font-bold border-b-2 border-white' : ''}`}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  href="/test" 
                  className={`text-white hover:text-primary-foreground ${location === '/test' ? 'font-bold border-b-2 border-white' : ''}`}
                >
                  Test Skills
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin" 
                  className={`text-white hover:text-primary-foreground ${location === '/admin' ? 'font-bold border-b-2 border-white' : ''}`}
                >
                  Admin
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/admin" component={AdminPage} />
          <Route path="/test" component={TestPage} />
          <Route component={NotFound} />
        </Switch>
      </main>

      <footer className="bg-muted py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          &copy; {new Date().getFullYear()} Audio Transcription Tool
        </div>
      </footer>
      
      <Toaster />
    </div>
  );
}

export default App;