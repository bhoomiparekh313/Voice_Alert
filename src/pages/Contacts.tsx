import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useLocalStorage, EmergencyContact } from '@/hooks/useLocalStorage';
import { Plus, Trash2, Phone, Mail, MessageSquare, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Contacts = () => {
  const { contacts, addContact, removeContact } = useLocalStorage();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', method: 'sms' as EmergencyContact['method'], email: '', relationship: '' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    addContact(form);
    setForm({ name: '', phone: '', method: 'sms', email: '', relationship: '' });
    setShowForm(false);
  };

  const methodIcons: Record<string, typeof Phone> = {
    sms: MessageSquare, call: Phone, whatsapp: MessageSquare, email: Mail,
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Emergency Contacts</h1>
            <p className="text-muted-foreground mt-1">These will be notified when an alert is triggered.</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-emergency text-emergency-foreground shadow-emergency hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="p-6 rounded-xl bg-gradient-card border border-border space-y-4 animate-slide-up">
            <h3 className="font-semibold text-foreground">New Contact</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Contact name" className="bg-secondary border-border text-foreground" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 XXXXXXXXXX" className="bg-secondary border-border text-foreground" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Relationship</Label>
                <Input value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} placeholder="e.g. Parent, Friend" className="bg-secondary border-border text-foreground" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Alert Method</Label>
                <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v as EmergencyContact['method'] })}>
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="call">Phone Call</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" className="bg-gradient-emergency text-emergency-foreground hover:opacity-90">Save Contact</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="border-border text-foreground">Cancel</Button>
            </div>
          </form>
        )}

        {contacts.length === 0 ? (
          <div className="p-12 rounded-xl bg-gradient-card border border-border text-center">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-lg font-medium text-foreground">No contacts yet</p>
            <p className="text-sm text-muted-foreground mt-1">Add emergency contacts who will be notified during alerts.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {contacts.map((contact) => {
              const MethodIcon = methodIcons[contact.method] || Phone;
              return (
                <div key={contact.id} className="p-5 rounded-xl bg-gradient-card border border-border space-y-3 animate-fade-in">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{contact.name}</p>
                      <p className="text-xs text-muted-foreground">{contact.relationship}</p>
                    </div>
                    <button onClick={() => removeContact(contact.id)} className="text-muted-foreground hover:text-emergency transition-colors p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    {contact.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    <MethodIcon className="w-4 h-4 text-info" />
                    <span className="text-xs text-info capitalize">{contact.method}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Contacts;
