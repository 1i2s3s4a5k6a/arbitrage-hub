import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, AlertCircle, DollarSign, Target } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const dashboardQuery = trpc.dashboard.getDashboard.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const oddsQuery = trpc.odds.getBestOdds.useQuery(
  { sport: "soccer_epl" },
  { enabled: isAuthenticated }
);
const arbitrageQuery = trpc.arbitrage.getOpportunities.useQuery(
  { limit: 10 },
  { enabled: isAuthenticated }
);
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Card className="w-full max-w-md bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Welcome to ArbitrageHub</CardTitle>
            <CardDescription>Please log in to access the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-slate-400 mb-4">Sign in to view live odds, arbitrage opportunities, and analytics.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">ArbitrageHub Dashboard</h1>
          <p className="text-slate-400">Real-time sports arbitrage intelligence</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300">Total Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-green-400">
                  ${dashboardQuery.data?.data?.stats?.totalProfit?.toFixed(2) || "0.00"}
                </div>
                <DollarSign className="w-8 h-8 text-green-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-blue-400">
                  {dashboardQuery.data?.data?.stats?.winRatio?.toFixed(1) || "0"}%
                </div>
                <Target className="w-8 h-8 text-blue-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300">Total Bets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-purple-400">
                  {dashboardQuery.data?.data?.stats?.totalBets || "0"}
                </div>
                <TrendingUp className="w-8 h-8 text-purple-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300">Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-orange-400">
                  {dashboardQuery.data?.data?.alerts?.length || "0"}
                </div>
                <AlertCircle className="w-8 h-8 text-orange-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="arbitrage" className="space-y-4">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="arbitrage" className="text-slate-300">
              Arbitrage Opportunities
            </TabsTrigger>
            <TabsTrigger value="odds" className="text-slate-300">
              Live Odds
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-slate-300">
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Arbitrage Tab */}
          <TabsContent value="arbitrage">
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Active Arbitrage Opportunities</CardTitle>
                <CardDescription>Real-time detected surebet opportunities</CardDescription>
              </CardHeader>
              <CardContent>
                {arbitrageQuery.isLoading ? (
                  <div className="text-slate-400">Loading opportunities...</div>
                ) : arbitrageQuery.data?.data && arbitrageQuery.data.data.length > 0 ? (
                  <div className="space-y-4">
                    {arbitrageQuery.data.data.map((opp: any) => (
                      <div key={opp.id} className="border border-slate-700 rounded-lg p-4 hover:bg-slate-800 transition">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="text-white font-semibold">{opp.type} Arbitrage</h3>
                            <p className="text-slate-400 text-sm">Match: {opp.matchId}</p>
                          </div>
                          <Badge className={`${
                            opp.riskLevel === "low" ? "bg-green-900 text-green-200" :
                            opp.riskLevel === "medium" ? "bg-yellow-900 text-yellow-200" :
                            "bg-red-900 text-red-200"
                          }`}>
                            {opp.riskLevel.toUpperCase()} RISK
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-slate-400">Profit %</p>
                            <p className="text-green-400 font-bold">{parseFloat(opp.profitPercentage).toFixed(2)}%</p>
                          </div>
                          <div>
                            <p className="text-slate-400">ROI</p>
                            <p className="text-blue-400 font-bold">{parseFloat(opp.roi).toFixed(2)}%</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Bookmakers</p>
                            <p className="text-purple-400 font-bold">{opp.bookmakers?.length || 0}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-400 text-center py-8">No arbitrage opportunities found</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Odds Tab */}
          <TabsContent value="odds">
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Best Odds Across Bookmakers</CardTitle>
                <CardDescription>Highest odds for each outcome</CardDescription>
              </CardHeader>
              <CardContent>
                {oddsQuery.isLoading ? (
                  <div className="text-slate-400">Loading odds...</div>
                ) : oddsQuery.data?.data && oddsQuery.data.data.length > 0 ? (
                  <div className="space-y-3">
                    {oddsQuery.data.data.map((odd: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-800 rounded border border-slate-700">
                        <div>
                          <p className="text-white font-semibold">{odd.option}</p>
                          <p className="text-slate-400 text-sm">{odd.bookmaker}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 font-bold text-lg">{odd.odds.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-400 text-center py-8">No odds data available</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Profit Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={[
                      { name: "Week 1", profit: 150 },
                      { name: "Week 2", profit: 280 },
                      { name: "Week 3", profit: 200 },
                      { name: "Week 4", profit: 420 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                      <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Win/Loss Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { name: "Won", value: 35 },
                      { name: "Lost", value: 15 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }} />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Recent Bets */}
        <Card className="bg-slate-900 border-slate-700 mt-8">
          <CardHeader>
            <CardTitle className="text-white">Recent Bets</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardQuery.data?.data?.recentBets && dashboardQuery.data.data.recentBets.length > 0 ? (
              <div className="space-y-2">
                {dashboardQuery.data.data.recentBets.map((bet: any) => (
                  <div key={bet.id} className="flex items-center justify-between p-3 bg-slate-800 rounded border border-slate-700">
                    <div>
                      <p className="text-white font-semibold">{bet.market}</p>
                      <p className="text-slate-400 text-sm">{bet.bookmaker}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${bet.outcome === "won" ? "text-green-400" : bet.outcome === "lost" ? "text-red-400" : "text-yellow-400"}`}>
                        {bet.outcome?.toUpperCase()}
                      </p>
                      <p className="text-slate-400 text-sm">${parseFloat(bet.stake).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-400 text-center py-8">No recent bets</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
