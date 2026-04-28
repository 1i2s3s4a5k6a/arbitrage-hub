import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signInWithGitHub } from "@/lib/supabase";
import { useLocation } from "wouter";
import { TrendingUp, Zap, Shield, BarChart3 } from "lucide-react";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  if (isAuthenticated) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-white">ArbitrageHub</div>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            disabled={loading}
            onClick={signInWithGitHub}
          >
            Sign In with GitHub
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Real-Time Sports{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
              Arbitrage Intelligence
            </span>
          </h1>
          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            Detect profitable betting opportunities across 50+ bookmakers in real-time. Powered by
            AI-driven analysis and advanced algorithms.
          </p>
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
            disabled={loading}
            onClick={signInWithGitHub}
          >
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Powerful Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-slate-900 border-slate-700 hover:border-slate-600 transition">
            <CardHeader>
              <TrendingUp className="w-8 h-8 text-green-400 mb-2" />
              <CardTitle className="text-white">Live Odds Aggregation</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Real-time odds from 50+ bookmakers updated every few seconds</CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700 hover:border-slate-600 transition">
            <CardHeader>
              <Zap className="w-8 h-8 text-blue-400 mb-2" />
              <CardTitle className="text-white">Arbitrage Detection</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Automatic detection of 2-way and 3-way arbitrage opportunities</CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700 hover:border-slate-600 transition">
            <CardHeader>
              <Shield className="w-8 h-8 text-purple-400 mb-2" />
              <CardTitle className="text-white">AI Predictions</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Machine learning models for match outcomes and value bets</CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700 hover:border-slate-600 transition">
            <CardHeader>
              <BarChart3 className="w-8 h-8 text-orange-400 mb-2" />
              <CardTitle className="text-white">Advanced Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Comprehensive dashboards tracking profit, ROI, and performance</CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Simple Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: "Free",
              price: "$0",
              features: ["Limited odds (5 bookmakers)", "Delayed detection", "Basic alerts"],
            },
            {
              name: "Pro",
              price: "$9.99",
              features: ["Full odds (50+ bookmakers)", "Real-time detection", "Unlimited alerts", "Advanced analytics"],
              highlighted: true,
            },
            {
              name: "Premium",
              price: "$29.99",
              features: ["Everything in Pro", "AI predictions", "Sharp money detection", "API access", "Priority support"],
            },
          ].map((plan) => (
            <Card
              key={plan.name}
              className={`${
                plan.highlighted
                  ? "bg-blue-900 border-blue-600 ring-2 ring-blue-500"
                  : "bg-slate-900 border-slate-700"
              } transition`}
            >
              <CardHeader>
                <CardTitle className="text-white">{plan.name}</CardTitle>
                <div className="text-3xl font-bold text-white mt-2">
                  {plan.price}
                  <span className="text-lg text-slate-400">/mo</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="text-slate-300 flex items-center">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-bold text-white mb-6">Ready to Start Arbitrage Trading?</h2>
        <p className="text-slate-400 mb-8 text-lg">
          Join thousands of bettors using ArbitrageHub to find profitable opportunities
        </p>
        <Button
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
          disabled={loading}
          onClick={signInWithGitHub}
        >
          Sign Up Now
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/50 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-slate-400">
          <p>&copy; 2026 ArbitrageHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}