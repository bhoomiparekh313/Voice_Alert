import { useState, useCallback } from 'react';

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  method: 'sms' | 'call' | 'whatsapp' | 'email';
  email?: string;
  relationship: string;
}

export interface Alert {
  id: string;
  type: 'voice' | 'manual' | 'gesture';
  keyword?: string;
  timestamp: Date;
  location?: { lat: number; lng: number; address?: string };
  status: 'sent' | 'pending' | 'failed';
}

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  emergencyMode: 'personal' | 'medical' | 'disaster';
  language: string;
  voiceMonitoring: boolean;
}

const STORAGE_KEYS = {
  contacts: 'vani_contacts',
  alerts: 'vani_alerts',
  profile: 'vani_profile',
  auth: 'vani_auth',
};

export function useLocalStorage() {
  const [contacts, setContactsState] = useState<EmergencyContact[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.contacts);
    return stored ? JSON.parse(stored) : [];
  });

  const [alerts, setAlertsState] = useState<Alert[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.alerts);
    return stored ? JSON.parse(stored).map((a: Alert) => ({ ...a, timestamp: new Date(a.timestamp) })) : [];
  });

  const [profile, setProfileState] = useState<UserProfile | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.profile);
    return stored ? JSON.parse(stored) : null;
  });

  const setContacts = useCallback((newContacts: EmergencyContact[]) => {
    setContactsState(newContacts);
    localStorage.setItem(STORAGE_KEYS.contacts, JSON.stringify(newContacts));
  }, []);

  const addContact = useCallback((contact: Omit<EmergencyContact, 'id'>) => {
    const newContact = { ...contact, id: crypto.randomUUID() };
    setContacts([...contacts, newContact]);
    return newContact;
  }, [contacts, setContacts]);

  const removeContact = useCallback((id: string) => {
    setContacts(contacts.filter(c => c.id !== id));
  }, [contacts, setContacts]);

  const addAlert = useCallback((alert: Omit<Alert, 'id'>) => {
    const newAlert = { ...alert, id: crypto.randomUUID() };
    const updated = [newAlert, ...alerts].slice(0, 50);
    setAlertsState(updated);
    localStorage.setItem(STORAGE_KEYS.alerts, JSON.stringify(updated));
    return newAlert;
  }, [alerts]);

  const setProfile = useCallback((p: UserProfile) => {
    setProfileState(p);
    localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(p));
  }, []);

  return { contacts, addContact, removeContact, setContacts, alerts, addAlert, profile, setProfile };
}

export function useAuth() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.auth);
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback((email: string, _password: string, name?: string) => {
    const userData = { name: name || email.split('@')[0], email };
    setUser(userData);
    localStorage.setItem(STORAGE_KEYS.auth, JSON.stringify(userData));
    localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify({
      name: userData.name,
      email: userData.email,
      emergencyMode: 'personal',
      language: 'en-IN',
      voiceMonitoring: true,
    }));
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.auth);
  }, []);

  return { user, login, logout, isAuthenticated: !!user };
}
