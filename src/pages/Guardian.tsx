import AppLayout from '@/components/AppLayout';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useLocation as useGeoLocation } from '@/hooks/useLocation';
import { MapPin, Clock, AlertTriangle, Mic, Shield, ExternalLink, Activity } from 'lucide-react';

const Guardian = () => {
  const { alerts, contacts } = useLocalStorage();
  const { location, getGoogleMapsLink } = useGeoLocation();

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Guardian Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor alerts and location in real-time</p>
        </div>

        {/* Map placeholder */}
        <div className="rounded-xl bg-gradient-card border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-info" />
              Live Location
            </h3>
            {location && (
              <a
                href={getGoogleMapsLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-info flex items-center gap-1 hover:underline"
              >
                Open in Maps <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <div className="h-64 bg-secondary/30 flex items-center justify-center relative">
            {/* Map visualization */}
            <div className="absolute inset-0 opacity-10">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" className="text-border" />
              </svg>
            </div>
            <div className="text-center z-10">
              {location ? (
                <>
                  <div className="w-4 h-4 rounded-full bg-emergency mx-auto mb-3 animate-pulse shadow-emergency" />
                  <p className="text-sm font-mono text-foreground">
                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {location.address || 'Location acquired'}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">Acquiring location...</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Alert History */}
          <div className="rounded-xl bg-gradient-card border border-border">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                Recent Alerts
              </h3>
            </div>
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No alerts recorded</p>
              ) : (
                alerts.slice(0, 10).map((alert) => (
                  <div key={alert.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      alert.type === 'voice' ? 'bg-emergency/15' : 'bg-warning/15'
                    }`}>
                      {alert.type === 'voice' ? (
                        <Mic className="w-4 h-4 text-emergency" />
                      ) : (
                        <Shield className="w-4 h-4 text-warning" />
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
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-4">
            <div className="p-6 rounded-xl bg-gradient-card border border-border">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-safe" />
                System Status
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Voice Detection', status: 'Online', color: 'text-safe' },
                  { label: 'Location Services', status: location ? 'Active' : 'Pending', color: location ? 'text-safe' : 'text-warning' },
                  { label: 'Emergency Contacts', status: `${contacts.length} configured`, color: contacts.length > 0 ? 'text-safe' : 'text-warning' },
                  { label: 'Alert System', status: 'Ready', color: 'text-safe' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className={`text-sm font-medium ${item.color}`}>{item.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-xl bg-gradient-card border border-border">
              <h3 className="font-semibold text-foreground mb-2">Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold text-foreground">{alerts.length}</p>
                  <p className="text-xs text-muted-foreground">Total alerts</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{contacts.length}</p>
                  <p className="text-xs text-muted-foreground">Contacts</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Guardian;
