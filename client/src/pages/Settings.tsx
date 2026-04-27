import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

export default function Settings() {
  const { user } = useAuth();
  const [alertPreferences, setAlertPreferences] = useState({
    arbitrageAlerts: true,
    oddsMovementAlerts: true,
    predictionAlerts: true,
    minProfitPercentage: 2,
  });

  const [emailNotifications, setEmailNotifications] = useState({
    dailySummary: true,
    weeklyReport: true,
    opportunityAlerts: true,
  });

  const handleAlertPreferenceChange = (key: string, value: any) => {
    setAlertPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleEmailNotificationChange = (key: string, value: boolean) => {
    setEmailNotifications((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSavePreferences = () => {
    toast.success("Preferences saved successfully!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Profile Information</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-slate-300">Name</Label>
            <Input
              value={user?.name || ""}
              disabled
              className="bg-slate-800 border-slate-700 text-white mt-1"
            />
          </div>
          <div>
            <Label className="text-slate-300">Email</Label>
            <Input
              value={user?.email || ""}
              disabled
              className="bg-slate-800 border-slate-700 text-white mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Alert Preferences */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Alert Preferences</CardTitle>
          <CardDescription>Control what notifications you receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
            <div>
              <p className="text-white font-medium">Arbitrage Alerts</p>
              <p className="text-sm text-slate-400">
                Get notified of new arbitrage opportunities
              </p>
            </div>
            <Switch
              checked={alertPreferences.arbitrageAlerts}
              onCheckedChange={(value) =>
                handleAlertPreferenceChange("arbitrageAlerts", value)
              }
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
            <div>
              <p className="text-white font-medium">Odds Movement Alerts</p>
              <p className="text-sm text-slate-400">
                Get notified of significant odds changes
              </p>
            </div>
            <Switch
              checked={alertPreferences.oddsMovementAlerts}
              onCheckedChange={(value) =>
                handleAlertPreferenceChange("oddsMovementAlerts", value)
              }
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
            <div>
              <p className="text-white font-medium">Prediction Alerts</p>
              <p className="text-sm text-slate-400">
                Get notified of AI predictions and insights
              </p>
            </div>
            <Switch
              checked={alertPreferences.predictionAlerts}
              onCheckedChange={(value) =>
                handleAlertPreferenceChange("predictionAlerts", value)
              }
            />
          </div>

          <div className="pt-3 border-t border-slate-700">
            <Label className="text-slate-300">Minimum Profit Percentage</Label>
            <Input
              type="number"
              value={alertPreferences.minProfitPercentage}
              onChange={(e) =>
                handleAlertPreferenceChange(
                  "minProfitPercentage",
                  parseFloat(e.target.value)
                )
              }
              className="bg-slate-800 border-slate-700 text-white mt-2"
              min="0.5"
              step="0.5"
            />
            <p className="text-xs text-slate-400 mt-1">
              Only receive alerts for opportunities with profit above this threshold
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Email Notifications</CardTitle>
          <CardDescription>Choose how often you receive email updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
            <div>
              <p className="text-white font-medium">Daily Summary</p>
              <p className="text-sm text-slate-400">
                Receive a summary of daily opportunities
              </p>
            </div>
            <Switch
              checked={emailNotifications.dailySummary}
              onCheckedChange={(value) =>
                handleEmailNotificationChange("dailySummary", value)
              }
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
            <div>
              <p className="text-white font-medium">Weekly Report</p>
              <p className="text-sm text-slate-400">
                Get a comprehensive weekly performance report
              </p>
            </div>
            <Switch
              checked={emailNotifications.weeklyReport}
              onCheckedChange={(value) =>
                handleEmailNotificationChange("weeklyReport", value)
              }
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
            <div>
              <p className="text-white font-medium">Opportunity Alerts</p>
              <p className="text-sm text-slate-400">
                Get immediate email alerts for high-value opportunities
              </p>
            </div>
            <Switch
              checked={emailNotifications.opportunityAlerts}
              onCheckedChange={(value) =>
                handleEmailNotificationChange("opportunityAlerts", value)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* API Settings */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">API Settings</CardTitle>
          <CardDescription>Manage your API access (Premium tier only)</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-sm">
            API access is available for Premium tier subscribers. Upgrade to unlock API endpoints.
          </p>
          <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
            Upgrade to Premium
          </Button>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          className="border-slate-700 text-slate-300 hover:text-white"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSavePreferences}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}
