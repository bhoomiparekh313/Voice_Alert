import { useState, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import SOSButton from '@/components/SOSButton';
import VoiceMonitor from '@/components/VoiceMonitor';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useLocation as useGeoLocation } from '@/hooks/useLocation';
import { useVoiceDetection, VoiceDetectionResult } from '@/hooks/useVoiceDetection';
import { MapPin, Users, Bell, Mic, AlertTriangle, Clock, ExternalLink } from 'lucide-react';

const Dashboard = () => {
  const { contacts, alerts, addAlert } = useLocalStorage();
  const { location, getGoogleMapsLink } = useGeoLocation();
  const [emergencyActive, setEmergencyActive] = useState(false);

  const handleEmergencyDetected = useCallback((result: VoiceDetectionResult) => {
    setEmergencyActive(true);
    addAlert({
      type: 'voice',
      keyword: result.keyword,
      timestamp: new Date(),
      location: location ? { lat: location.lat, lng: location.lng } : undefined,
      status: 'sent',
    });
    setTimeout(() => setEmergencyActive(false), 5000);
  }, [addAlert, location]);

  const handleManualSOS = useCallback(() => {
    setEmergencyActive(true);
    addAlert({
      type: 'manual',
      timestamp: new Date(),
      location: location ? { lat: location.lat, lng: location.lng } : undefined,
      status: 'sent',
    });
    setTimeout(() => setEmergencyActive(false), 5000);
  }, [addAlert, location]);

  const { isListening, startListening, stopListening, lastTranscript, isSupported } = useVoiceDetection({
    onEmergencyDetected: handleEmergencyDetected,
  });

  const stats = [
    { label: 'Emergency Contacts', value: contacts.length, icon: Users, color: 'text-info' },
    { label: 'Alerts This Month', value: alerts.length, icon: Bell, color: 'text-warning' },
    { label: 'Voice Commands', value: isListening ? 'Active' : 'Inactive', icon: Mic, color: isListening ? 'text-safe' : 'text-muted-foreground' },
    { label: 'Location', value: location ? 'Enabled' : 'Pending', icon: MapPin, color: location ? 'text-safe' : 'text-warning' },
  ];

  return (
    <AppLayout>
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Emergency banner */}
        {emergencyActive && (
          <div className="p-4 rounded-xl bg-emergency/20 border border-emergency/40 flex items-center gap-3 animate-pulse-emergency">
            <AlertTriangle className="w-6 h-6 text-emergency flex-shrink-0" />
            <div>
              <p className="font-bold text-emergency">🚨 Emergency Alert Triggered!</p>
              <p className="text-sm text-emergency/80">Sending alerts to all emergency contacts...</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Emergency Control</h1>
          <p className="text-muted-foreground mt-1">Press the button below for immediate assistance</p>
        </div>

        {/* SOS Section */}
        <div className="flex flex-col items-center py-8">
          <SOSButton onTrigger={handleManualSOS} isActive={emergencyActive} />
          <p className="mt-4 text-sm text-muted-foreground">
            {isListening ? (
              <span className="text-safe flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-safe animate-pulse" />
                Voice monitoring active
              </span>
            ) : (
              'Voice monitoring inactive'
            )}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="p-5 rounded-xl bg-gradient-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Voice Monitor & Quick Actions */}
        <div className="grid lg:grid-cols-2 gap-6">
          <VoiceMonitor
            isListening={isListening}
            isSupported={isSupported}
            lastTranscript={lastTranscript}
            onStart={startListening}
            onStop={stopListening}
          />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <a
                href={getGoogleMapsLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-xl bg-gradient-card border border-border hover:border-info/30 transition-colors group"
              >
                <MapPin className="w-5 h-5 text-info mb-2" />
                <p className="text-sm font-medium text-foreground">Guardian Map</p>
                <ExternalLink className="w-3 h-3 text-muted-foreground mt-1" />
              </a>
              <button
                onClick={handleManualSOS}
                className="p-4 rounded-xl bg-gradient-card border border-border hover:border-emergency/30 transition-colors text-left"
              >
                <AlertTriangle className="w-5 h-5 text-emergency mb-2" />
                <p className="text-sm font-medium text-foreground">Test Alert</p>
                <p className="text-xs text-muted-foreground mt-1">Send test</p>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent Alerts</h3>
          {alerts.length === 0 ? (
            <div className="p-8 rounded-xl bg-gradient-card border border-border text-center">
              <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No alerts yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-center gap-4 p-4 rounded-xl bg-gradient-card border border-border">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    alert.type === 'voice' ? 'bg-emergency/15' : 'bg-warning/15'
                  }`}>
                    {alert.type === 'voice' ? (
                      <Mic className="w-5 h-5 text-emergency" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-warning" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {alert.type === 'voice' ? `Voice: "${alert.keyword}"` : 'Manual SOS'}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    alert.status === 'sent' ? 'bg-safe/15 text-safe' : 'bg-warning/15 text-warning'
                  }`}>
                    {alert.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
