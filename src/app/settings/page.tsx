"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Settings,
  User,
  Shield,
  Bell,
  Database,
  Key,
  AlertTriangle,
} from "lucide-react";

interface UserSettings {
  profile: {
    name: string;
    email: string;
    bio?: string;
    timezone: string;
  };
  privacy: {
    profileVisibility: "public" | "private" | "therapists_only";
    dataSharing: boolean;
    analyticsOptIn: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    moodReminders: boolean;
    weeklyReports: boolean;
  };
  ai: {
    provider: "openai" | "anthropic" | "google";
    model: string;
    temperature: number;
    maxTokens: number;
  };
  security: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
    loginAlerts: boolean;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>({
    profile: {
      name: "",
      email: "",
      bio: "",
      timezone: "UTC",
    },
    privacy: {
      profileVisibility: "private",
      dataSharing: false,
      analyticsOptIn: true,
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      moodReminders: true,
      weeklyReports: true,
    },
    ai: {
      provider: "openai",
      model: "gpt-4",
      temperature: 0.7,
      maxTokens: 1000,
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: 30,
      loginAlerts: true,
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const userData = await response.json();
        // In a real app, this would fetch actual user settings
        // For now, we'll use the default settings
        setSettings((prev) => ({
          ...prev,
          profile: {
            ...prev.profile,
            name: userData.name || "",
            email: userData.email || "",
          },
        }));
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage("Settings saved successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Failed to save settings. Please try again.");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage("An error occurred while saving settings.");
    } finally {
      setSaving(false);
    }
  };

  const updateProfile = (
    field: keyof UserSettings["profile"],
    value: string
  ) => {
    setSettings((prev) => ({
      ...prev,
      profile: { ...prev.profile, [field]: value },
    }));
  };

  const updatePrivacy = (field: keyof UserSettings["privacy"], value: any) => {
    setSettings((prev) => ({
      ...prev,
      privacy: { ...prev.privacy, [field]: value },
    }));
  };

  const updateNotifications = (
    field: keyof UserSettings["notifications"],
    value: boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [field]: value },
    }));
  };

  const updateAI = (field: keyof UserSettings["ai"], value: any) => {
    setSettings((prev) => ({
      ...prev,
      ai: { ...prev.ai, [field]: value },
    }));
  };

  const updateSecurity = (
    field: keyof UserSettings["security"],
    value: any
  ) => {
    setSettings((prev) => ({
      ...prev,
      security: { ...prev.security, [field]: value },
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences and configurations
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {message && (
        <Alert className="mb-6">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            AI Settings
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={settings.profile.name}
                    onChange={(e) => updateProfile("name", e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.profile.email}
                    onChange={(e) => updateProfile("email", e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={settings.profile.bio}
                  onChange={(e) => updateProfile("bio", e.target.value)}
                  placeholder="Tell us a bit about yourself..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={settings.profile.timezone}
                  onValueChange={(value) => updateProfile("timezone", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">
                      Eastern Time
                    </SelectItem>
                    <SelectItem value="America/Chicago">
                      Central Time
                    </SelectItem>
                    <SelectItem value="America/Denver">
                      Mountain Time
                    </SelectItem>
                    <SelectItem value="America/Los_Angeles">
                      Pacific Time
                    </SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Europe/Paris">Paris</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="visibility">Profile Visibility</Label>
                <Select
                  value={settings.privacy.profileVisibility}
                  onValueChange={(value: any) =>
                    updatePrivacy("profileVisibility", value)
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">
                      Private - Only you can see your profile
                    </SelectItem>
                    <SelectItem value="therapists_only">
                      Therapists Only - Only mental health professionals can see
                      your profile
                    </SelectItem>
                    <SelectItem value="public">
                      Public - Anyone can see basic profile information
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="data-sharing">
                    Data Sharing for Research
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Allow anonymized data to be used for mental health research
                  </p>
                </div>
                <Switch
                  id="data-sharing"
                  checked={settings.privacy.dataSharing}
                  onCheckedChange={(checked) =>
                    updatePrivacy("dataSharing", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="analytics">Analytics & Usage Tracking</Label>
                  <p className="text-sm text-muted-foreground">
                    Help improve the platform by sharing usage analytics
                  </p>
                </div>
                <Switch
                  id="analytics"
                  checked={settings.privacy.analyticsOptIn}
                  onCheckedChange={(checked) =>
                    updatePrivacy("analyticsOptIn", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive important updates via email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.notifications.emailNotifications}
                  onCheckedChange={(checked) =>
                    updateNotifications("emailNotifications", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications on your device
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={settings.notifications.pushNotifications}
                  onCheckedChange={(checked) =>
                    updateNotifications("pushNotifications", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="mood-reminders">Mood Logging Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Daily reminders to log your mood
                  </p>
                </div>
                <Switch
                  id="mood-reminders"
                  checked={settings.notifications.moodReminders}
                  onCheckedChange={(checked) =>
                    updateNotifications("moodReminders", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weekly-reports">
                    Weekly Progress Reports
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive weekly summaries of your progress
                  </p>
                </div>
                <Switch
                  id="weekly-reports"
                  checked={settings.notifications.weeklyReports}
                  onCheckedChange={(checked) =>
                    updateNotifications("weeklyReports", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Provider Configuration</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure your AI provider settings and API keys
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="ai-provider">Default AI Provider</Label>
                  <Select
                    value={settings.ai.provider}
                    onValueChange={(value: any) => updateAI("provider", value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI (GPT-4)</SelectItem>
                      <SelectItem value="anthropic">
                        Anthropic (Claude)
                      </SelectItem>
                      <SelectItem value="google">Google (Gemini)</SelectItem>
                      <SelectItem value="groq">Groq</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">API Keys</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure your API keys for each provider. Keys are stored
                    securely and encrypted.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="openai-key">OpenAI API Key</Label>
                      <Input
                        id="openai-key"
                        type="password"
                        placeholder="sk-..."
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Get your API key from{" "}
                        <a
                          href="https://platform.openai.com/api-keys"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          OpenAI Platform
                        </a>
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="anthropic-key">Anthropic API Key</Label>
                      <Input
                        id="anthropic-key"
                        type="password"
                        placeholder="sk-ant-..."
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Get your API key from{" "}
                        <a
                          href="https://console.anthropic.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Anthropic Console
                        </a>
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="google-key">Google AI API Key</Label>
                      <Input
                        id="google-key"
                        type="password"
                        placeholder="AIza..."
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Get your API key from{" "}
                        <a
                          href="https://makersuite.google.com/app/apikey"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Google AI Studio
                        </a>
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="groq-key">Groq API Key</Label>
                      <Input
                        id="groq-key"
                        type="password"
                        placeholder="gsk_..."
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Get your API key from{" "}
                        <a
                          href="https://console.groq.com/keys"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Groq Console
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Model Settings</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Fine-tune your AI assistant's behavior
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ai-model">Preferred Model</Label>
                    <Select
                      value={settings.ai.model}
                      onValueChange={(value) => updateAI("model", value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">
                          GPT-3.5 Turbo
                        </SelectItem>
                        <SelectItem value="claude-3-opus">
                          Claude 3 Opus
                        </SelectItem>
                        <SelectItem value="claude-3-sonnet">
                          Claude 3 Sonnet
                        </SelectItem>
                        <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                        <SelectItem value="gemini-pro-vision">
                          Gemini Pro Vision
                        </SelectItem>
                        <SelectItem value="llama2-70b">
                          Llama 2 70B (Groq)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="max-tokens">Response Length</Label>
                    <Select
                      value={settings.ai.maxTokens.toString()}
                      onValueChange={(value) =>
                        updateAI("maxTokens", parseInt(value))
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="500">Short (500 tokens)</SelectItem>
                        <SelectItem value="1000">
                          Medium (1000 tokens)
                        </SelectItem>
                        <SelectItem value="1500">Long (1500 tokens)</SelectItem>
                        <SelectItem value="2000">
                          Very Long (2000 tokens)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="temperature">
                    Creativity Level: {settings.ai.temperature}
                  </Label>
                  <input
                    id="temperature"
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.ai.temperature}
                    onChange={(e) =>
                      updateAI("temperature", parseFloat(e.target.value))
                    }
                    className="w-full mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Lower = more focused and consistent, Higher = more creative
                    and varied
                  </p>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    AI settings affect response quality and API costs. Higher
                    creativity and longer responses cost more.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={
                      settings.security.twoFactorEnabled
                        ? "default"
                        : "secondary"
                    }
                  >
                    {settings.security.twoFactorEnabled
                      ? "Enabled"
                      : "Disabled"}
                  </Badge>
                  <Switch
                    id="two-factor"
                    checked={settings.security.twoFactorEnabled}
                    onCheckedChange={(checked) =>
                      updateSecurity("twoFactorEnabled", checked)
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="session-timeout">
                  Session Timeout (minutes)
                </Label>
                <Select
                  value={settings.security.sessionTimeout.toString()}
                  onValueChange={(value) =>
                    updateSecurity("sessionTimeout", parseInt(value))
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="240">4 hours</SelectItem>
                    <SelectItem value="480">8 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="login-alerts">Login Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified of new login attempts
                  </p>
                </div>
                <Switch
                  id="login-alerts"
                  checked={settings.security.loginAlerts}
                  onCheckedChange={(checked) =>
                    updateSecurity("loginAlerts", checked)
                  }
                />
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-lg font-medium mb-4">Danger Zone</h3>
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Change Password
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Download My Data
                  </Button>
                  <Button variant="destructive">Delete Account</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
