import React from 'react';
import { Lead, LeadStatus, STATUS_COLORS, LEAD_STATUSES } from '@/types/lead';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Phone, Building, Calendar, MessageSquare, Save, X } from 'lucide-react';

interface LeadDetailModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (leadId: string, status: LeadStatus) => void;
  onAddNote: (leadId: string, note: string) => void;
}

export default function LeadDetailModal({ lead, isOpen, onClose, onUpdateStatus, onAddNote }: LeadDetailModalProps) {
  const { toast } = useToast();
  const [newNote, setNewNote] = React.useState('');
  const [selectedStatus, setSelectedStatus] = React.useState<LeadStatus | ''>('');
  const [localNotes, setLocalNotes] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (lead) {
      setSelectedStatus(lead.status);
      setNewNote('');
      setLocalNotes(lead.notes || []);
    }
  }, [lead]);

  if (!lead) return null;

  // FIX BUG 2: Status change must update both local state AND call parent handler immediately
  const handleStatusChange = (newStatus: string) => {
    const status = newStatus as LeadStatus;
    // Update local state for immediate UI feedback
    setSelectedStatus(status);
    // Call the shared update function - this updates persistedData and triggers re-render
    onUpdateStatus(lead.id, status);
  };

  const handleSave = () => {
    try {
      if (newNote.trim()) {
        onAddNote(lead.id, newNote.trim());
        setLocalNotes(prev => [...prev, newNote.trim()]);
        toast({
          title: 'Note Added',
          description: 'Your note has been saved.',
        });
        setNewNote('');
      }
    } catch (e) {
      console.warn('[LeadDetailModal] Error saving:', e);
    }
    
    onClose();
  };

  // Get all dynamic fields from the lead
  const dynamicFields = Object.entries(lead).filter(([key]) => 
    !['id', 'source', 'status', 'notes', 'assignedAgent', 'meetingDate', 'meetingTime', 'meetingResult', 'postMeetingNotes'].includes(key)
  );

  const statusColor = STATUS_COLORS[lead.status];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl text-foreground">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">
              {String(lead['Name'] || lead['Email'] || 'L').charAt(0).toUpperCase()}
            </div>
            <span>Lead Details</span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Current Status */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Current Status:</span>
              <Badge className={`${statusColor?.bg} ${statusColor?.text} ${statusColor?.border} border`}>
                {lead.status}
              </Badge>
              <span className="text-sm text-muted-foreground">|</span>
              <span className="text-sm text-muted-foreground">Source: {lead.source}</span>
            </div>

            <Separator className="bg-border" />

            {/* Lead Information */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dynamicFields.map(([key, value]) => {
                  if (value === null || value === undefined || value === '') return null;
                  
                  let icon = <User className="w-4 h-4" />;
                  if (key.toLowerCase().includes('email')) icon = <Mail className="w-4 h-4" />;
                  if (key.toLowerCase().includes('phone')) icon = <Phone className="w-4 h-4" />;
                  if (key.toLowerCase().includes('company')) icon = <Building className="w-4 h-4" />;
                  if (key.toLowerCase().includes('date')) icon = <Calendar className="w-4 h-4" />;

                  return (
                    <div key={key} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                      <div className="text-muted-foreground mt-0.5">{icon}</div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">{key}</p>
                        <p className="text-sm text-foreground font-medium">{String(value)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator className="bg-border" />

            {/* Update Status */}
            <div>
              <Label className="text-foreground mb-2 block">Update Status</Label>
              <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full bg-secondary border-border text-foreground">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {LEAD_STATUSES.map((status) => {
                    const color = STATUS_COLORS[status];
                    return (
                      <SelectItem key={status} value={status} className="text-foreground focus:bg-secondary">
                        <span className={`${color?.text}`}>{status}</span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Notes Section */}
            <div>
              <Label className="text-foreground mb-2 block flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Notes ({localNotes.length})
              </Label>
              
              {/* Existing Notes */}
              {localNotes.length > 0 && (
                <div className="space-y-2 mb-3">
                  {localNotes.map((note, index) => (
                    <div key={index} className="p-3 rounded-lg bg-secondary/50 border border-border">
                      <p className="text-sm text-foreground">{note}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Note */}
              <Textarea
                placeholder="Add a new note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="bg-secondary border-border min-h-[80px] text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="border-border text-foreground hover:bg-secondary">
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} className="gradient-primary text-primary-foreground">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
