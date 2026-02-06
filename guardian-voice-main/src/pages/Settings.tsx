import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Shield, Globe, Mic, Battery, Save } from 'lucide-react';
import { profileSchema } from '@/lib/validation';

const SettingsPage = () => {
  const { profile, setProfile } = useLocalStorage();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    emergencyMode: 'personal',
    language: 'en-IN',
    voiceMonitoring: true,
  });
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name,
        email: profile.email,
        phone: profile.phone || '',
        emergencyMode: profile.emergencyMode,
        language: profile.language,
        voiceMonitoring: profile.voiceMonitoring,
      });
    }
  }, [profile]);

  const handleSave = () => {
    const result = profileSchema.safeParse(form);
    if (!result.success) {
      setFormError(result.error.issues[0].message);
      return;
    }
    setFormError('');
    setProfile({
      name: result.data.name,
      email: result.data.email,
      phone: result.data.phone || '',
      emergencyMode: result.data.emergencyMode,
      language: result.data.language,
      voiceMonitoring: result.data.voiceMonitoring,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const modes = [
    { value: 'personal', label: 'Personal Safety', desc: 'Silent alerts for personal emergencies', icon: Shield },
    { value: 'medical', label: 'Medical Emergency', desc: 'Share health info with responders', icon: Battery },
    { value: 'disaster', label: 'Natural Disaster', desc: 'Optimized for low-connectivity', icon: Globe },
  ];

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure your emergency preferences</p>
        </div>

        {/* Profile */}
        <div className="p-6 rounded-xl bg-gradient-card border border-border space-y-4">
          <h3 className="font-semibold text-foreground">Profile</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">Full Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border text-foreground" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-secondary border-border text-foreground" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 XXXXXXXXXX" className="bg-secondary border-border text-foreground" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Language</Label>
              <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-IN">English (India)</SelectItem>
                  <SelectItem value="hi-IN">Hindi</SelectItem>
                  <SelectItem value="mr-IN">Marathi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Emergency Mode */}
        <div className="p-6 rounded-xl bg-gradient-card border border-border space-y-4">
          <h3 className="font-semibold text-foreground">Emergency Mode</h3>
          <div className="space-y-3">
            {modes.map((mode) => (
              <button
                key={mode.value}
                onClick={() => setForm({ ...form, emergencyMode: mode.value })}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                  form.emergencyMode === mode.value
                    ? 'border-emergency/40 bg-emergency/10'
                    : 'border-border bg-secondary/30 hover:bg-secondary/50'
                }`}
              >
                <mode.icon className={`w-5 h-5 ${form.emergencyMode === mode.value ? 'text-emergency' : 'text-muted-foreground'}`} />
                <div>
                  <p className={`text-sm font-medium ${form.emergencyMode === mode.value ? 'text-foreground' : 'text-foreground'}`}>{mode.label}</p>
                  <p className="text-xs text-muted-foreground">{mode.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Voice Monitoring */}
        <div className="p-6 rounded-xl bg-gradient-card border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mic className="w-5 h-5 text-emergency" />
              <div>
                <p className="font-semibold text-foreground">Voice Monitoring</p>
                <p className="text-xs text-muted-foreground">Continuously listen for emergency keywords</p>
              </div>
            </div>
            <Switch checked={form.voiceMonitoring} onCheckedChange={(v) => setForm({ ...form, voiceMonitoring: v })} />
          </div>
        </div>

        {formError && <p className="text-sm text-emergency mb-2">{formError}</p>}
        <Button onClick={handleSave} className="bg-gradient-emergency text-emergency-foreground shadow-emergency hover:opacity-90 w-full h-12 font-semibold">
          <Save className="w-4 h-4 mr-2" />
          {saved ? '✓ Saved!' : 'Save Settings'}
        </Button>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
