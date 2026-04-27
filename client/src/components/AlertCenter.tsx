import { Bell, X, AlertCircle, TrendingUp, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

interface Alert {
  id: number;
  type: "arbitrage" | "odds_movement" | "prediction";
  title: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
}

export function AlertCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const { data: alertsData } = trpc.alerts.getAlerts.useQuery({ limit: 10 });
  const { data: unreadCount } = trpc.alerts.getUnreadCount.useQuery();

  useEffect(() => {
    if (alertsData?.data) {
      setAlerts(alertsData.data);
    }
  }, [alertsData]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "arbitrage":
        return <Zap className="w-4 h-4 text-blue-400" />;
      case "odds_movement":
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case "prediction":
        return <AlertCircle className="w-4 h-4 text-purple-400" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case "arbitrage":
        return "border-l-blue-400 bg-blue-900/20";
      case "odds_movement":
        return "border-l-green-400 bg-green-900/20";
      case "prediction":
        return "border-l-purple-400 bg-purple-900/20";
      default:
        return "border-l-slate-400 bg-slate-900/20";
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-white transition"
      >
        <Bell className="w-5 h-5" />
        {unreadCount && unreadCount.data > 0 && (
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </button>

      {/* Alert Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-slate-900 border border-slate-700 rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <h3 className="text-white font-semibold">Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Alerts List */}
          <div className="max-h-96 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="p-4 text-center text-slate-400">
                No alerts yet. Check back soon!
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 border-l-4 ${getAlertColor(alert.type)} hover:bg-slate-800/50 transition cursor-pointer`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getAlertIcon(alert.type)}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium text-sm">
                        {alert.title}
                      </h4>
                      <p className="text-slate-400 text-xs mt-1 line-clamp-2">
                        {alert.content}
                      </p>
                      <p className="text-slate-500 text-xs mt-2">
                        {new Date(alert.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    {!alert.isRead && (
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-700">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-slate-300 hover:text-white"
            >
              View All Alerts
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
