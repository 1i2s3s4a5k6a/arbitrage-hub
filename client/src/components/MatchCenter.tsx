import { Clock, Users, Target, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: "live" | "finished" | "scheduled";
  possession: { home: number; away: number };
  shots: { home: number; away: number };
  xG: { home: number; away: number };
  events: Array<{
    minute: number;
    type: "goal" | "card" | "substitution";
    team: "home" | "away";
    player: string;
    description: string;
  }>;
}

interface MatchCenterProps {
  matches: Match[];
  isLoading?: boolean;
}

export function MatchCenter({ matches, isLoading }: MatchCenterProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 bg-slate-800 rounded-lg animate-pulse"
          ></div>
        ))}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-700">
        <CardContent className="p-8 text-center">
          <p className="text-slate-400">No live matches at the moment</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => (
        <Card
          key={match.id}
          className="bg-slate-900 border-slate-700 hover:border-slate-600 transition"
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg">
                {match.homeTeam} vs {match.awayTeam}
              </CardTitle>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  match.status === "live"
                    ? "bg-red-900 text-red-200"
                    : match.status === "finished"
                      ? "bg-slate-800 text-slate-300"
                      : "bg-blue-900 text-blue-200"
                }`}
              >
                {match.status === "live"
                  ? "LIVE"
                  : match.status === "finished"
                    ? "FINISHED"
                    : "SCHEDULED"}
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Score */}
            <div className="flex items-center justify-between bg-slate-800 rounded-lg p-4">
              <div className="text-center flex-1">
                <p className="text-slate-400 text-sm">{match.homeTeam}</p>
                <p className="text-4xl font-bold text-white">
                  {match.homeScore}
                </p>
              </div>
              <div className="px-4 text-slate-400">-</div>
              <div className="text-center flex-1">
                <p className="text-slate-400 text-sm">{match.awayTeam}</p>
                <p className="text-4xl font-bold text-white">
                  {match.awayScore}
                </p>
              </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-3 gap-3">
              {/* Possession */}
              <div className="bg-slate-800 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <p className="text-xs text-slate-400">Possession</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white font-semibold">
                      {match.possession.home}%
                    </span>
                    <span className="text-white font-semibold">
                      {match.possession.away}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full"
                      style={{ width: `${match.possession.home}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Shots */}
              <div className="bg-slate-800 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-green-400" />
                  <p className="text-xs text-slate-400">Shots</p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white font-semibold">
                    {match.shots.home}
                  </span>
                  <span className="text-white font-semibold">
                    {match.shots.away}
                  </span>
                </div>
              </div>

              {/* xG */}
              <div className="bg-slate-800 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <p className="text-xs text-slate-400">xG</p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white font-semibold">
                    {match.xG.home.toFixed(1)}
                  </span>
                  <span className="text-white font-semibold">
                    {match.xG.away.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Events Timeline */}
            {match.events.length > 0 && (
              <div className="border-t border-slate-700 pt-3">
                <p className="text-xs text-slate-400 mb-2 font-semibold">
                  EVENTS
                </p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {match.events.map((event, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs text-slate-300"
                    >
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span className="text-slate-500 font-semibold w-8">
                        {event.minute}'
                      </span>
                      <span
                        className={
                          event.team === "home"
                            ? "text-blue-400"
                            : "text-green-400"
                        }
                      >
                        {event.type === "goal"
                          ? "⚽"
                          : event.type === "card"
                            ? "🟨"
                            : "↔️"}
                      </span>
                      <span>{event.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
