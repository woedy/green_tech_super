import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Bell, 
  BellOff, 
  CheckCheck, 
  Settings,
  Mail,
  MessageSquare,
  Smartphone
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  inApp: boolean;
  projectUpdates: boolean;
  quoteNotifications: boolean;
  paymentReminders: boolean;
  marketingEmails: boolean;
}

interface NotificationCenterProps {
  notifications: Notification[];
  preferences: NotificationPreferences;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onUpdatePreferences: (prefs: NotificationPreferences) => void;
}

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'success': return 'text-green-500 bg-green-500/10';
    case 'warning': return 'text-amber-500 bg-amber-500/10';
    case 'error': return 'text-red-500 bg-red-500/10';
    default: return 'text-blue-500 bg-blue-500/10';
  }
};

export const NotificationCenter = ({
  notifications,
  preferences,
  onMarkAsRead,
  onMarkAllAsRead,
  onUpdatePreferences,
}: NotificationCenterProps) => {
  const [localPrefs, setLocalPrefs] = useState(preferences);
  const unreadCount = notifications.filter(n => !n.read).length;

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    const updated = { ...localPrefs, [key]: value };
    setLocalPrefs(updated);
    onUpdatePreferences(updated);
  };

  return (
    <Card className="shadow-medium">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onMarkAllAsRead}
              className="text-xs"
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notifications">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-destructive text-destructive-foreground rounded-full">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="preferences">
              <Settings className="w-4 h-4 mr-1" />
              Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BellOff className="w-12 h-12 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border ${
                        notification.read ? 'bg-muted/20' : 'bg-accent/30 border-accent'
                      } smooth-transition hover:shadow-sm`}
                    >
                      <div className="flex gap-3">
                        <div className={`p-2 rounded-lg h-fit ${getNotificationColor(notification.type)}`}>
                          <Bell className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2">
                            {notification.actionUrl && notification.actionLabel && (
                              <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                                {notification.actionLabel}
                              </Button>
                            )}
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 text-xs"
                                onClick={() => onMarkAsRead(notification.id)}
                              >
                                Mark as read
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="preferences" className="mt-4">
            <div className="space-y-6">
              {/* Notification Channels */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Notification Channels</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <Label htmlFor="email-pref" className="cursor-pointer">
                        Email Notifications
                      </Label>
                    </div>
                    <Switch
                      id="email-pref"
                      checked={localPrefs.email}
                      onCheckedChange={(checked) => handlePreferenceChange('email', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-4 h-4 text-muted-foreground" />
                      <Label htmlFor="sms-pref" className="cursor-pointer">
                        SMS Notifications
                      </Label>
                    </div>
                    <Switch
                      id="sms-pref"
                      checked={localPrefs.sms}
                      onCheckedChange={(checked) => handlePreferenceChange('sms', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      <Label htmlFor="inapp-pref" className="cursor-pointer">
                        In-App Notifications
                      </Label>
                    </div>
                    <Switch
                      id="inapp-pref"
                      checked={localPrefs.inApp}
                      onCheckedChange={(checked) => handlePreferenceChange('inApp', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Notification Types */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Notification Types</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                    <Label htmlFor="project-updates" className="cursor-pointer">
                      Project Updates
                    </Label>
                    <Switch
                      id="project-updates"
                      checked={localPrefs.projectUpdates}
                      onCheckedChange={(checked) => handlePreferenceChange('projectUpdates', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                    <Label htmlFor="quote-notifications" className="cursor-pointer">
                      Quote Notifications
                    </Label>
                    <Switch
                      id="quote-notifications"
                      checked={localPrefs.quoteNotifications}
                      onCheckedChange={(checked) => handlePreferenceChange('quoteNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                    <Label htmlFor="payment-reminders" className="cursor-pointer">
                      Payment Reminders
                    </Label>
                    <Switch
                      id="payment-reminders"
                      checked={localPrefs.paymentReminders}
                      onCheckedChange={(checked) => handlePreferenceChange('paymentReminders', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                    <Label htmlFor="marketing-emails" className="cursor-pointer">
                      Marketing Emails
                    </Label>
                    <Switch
                      id="marketing-emails"
                      checked={localPrefs.marketingEmails}
                      onCheckedChange={(checked) => handlePreferenceChange('marketingEmails', checked)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
