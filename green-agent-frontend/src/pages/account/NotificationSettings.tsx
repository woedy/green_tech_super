import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

const NotificationSettings = () => {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState({ email: true, sms: false, whatsapp: false });
  const save = () => toast({ title: "Notification preferences saved (demo)" });

  return (
    <Layout>
      <section className="py-10 bg-gradient-to-br from-background via-accent/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl md:text-3xl font-bold">Notification Settings</h1>
        </div>
      </section>
      <section className="py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="shadow-medium">
            <CardHeader><CardTitle>Channels</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email">Email</Label>
                <Switch id="email" checked={prefs.email} onCheckedChange={(v) => setPrefs({ ...prefs, email: Boolean(v) })} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="sms">SMS</Label>
                <Switch id="sms" checked={prefs.sms} onCheckedChange={(v) => setPrefs({ ...prefs, sms: Boolean(v) })} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Switch id="whatsapp" checked={prefs.whatsapp} onCheckedChange={(v) => setPrefs({ ...prefs, whatsapp: Boolean(v) })} />
              </div>
              <Button onClick={save}>Save</Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default NotificationSettings;

