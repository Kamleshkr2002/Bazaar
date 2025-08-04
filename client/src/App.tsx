import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth, AuthProvider } from "@/hooks/use-auth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Browse from "@/pages/browse";
import Dashboard from "@/pages/dashboard";
import ItemDetail from "@/pages/item-detail";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth";

function Router() {
  const { user, isLoading } = useAuth();
  const isAuthenticated = !!user;

  return (
    <Switch>
      {isLoading ? (
        <Route path="*">
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </Route>
      ) : !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/auth" component={AuthPage} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/browse" component={Browse} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/item/:id" component={ItemDetail} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
