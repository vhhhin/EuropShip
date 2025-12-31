import React from 'react'; 
import { Lead, LeadStatus, MeetingResult, MEETING_RESULTS } from '@/types/lead';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Save, X, Video } from 'lucide-react';

interface MeetingModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSetMeetingDetails: (leadId: string, details: {
    meetingDate?: string;
    meetingTime?: string;
    meetingResult?: string;
    postMeetingNotes?: string;
  }) => void;
  onUpdateStatus: (leadId: string, status: LeadStatus) => void;
}

export default function MeetingModal({
  lead,
  isOpen,
  onClose,
  onSetMeetingDetails,
  onUpdateStatus,
}: MeetingModalProps) {
  const { toast } = useToast();
  
  const [meetingDate, setMeetingDate] = React.useState('');
  const [meetingTime, setMeetingTime] = React.useState('');
  const [meetingResult, setMeetingResult] = React.useState<MeetingResult | ''>('');
  const [postMeetingNotes, setPostMeetingNotes] = React.useState('');

  React.useEffect(() => {
    if (lead) {
      // FIX BUG 1: Extract date in YYYY-MM-DD format without timezone conversion
      let dateValue = lead.meetingDate || '';
      if (dateValue.includes('T')) {
        dateValue = dateValue.split('T')[0];
      }
      setMeetingDate(dateValue);
      setMeetingTime(lead.meetingTime || '');
      setMeetingResult((lead.meetingResult as MeetingResult) || '');
      setPostMeetingNotes(lead.postMeetingNotes || '');
    }
  }, [lead]);

  if (!lead) return null;

  const handleSave = () => {
    // FIX BUG 1: Pass the date as-is from the input (YYYY-MM-DD format)
    // Do NOT convert to Date object or use toISOString()
    onSetMeetingDetails(lead.id, {
      meetingDate: meetingDate,
      meetingTime: meetingTime,
      meetingResult: meetingResult || undefined,
      postMeetingNotes: postMeetingNotes || undefined,
    });

    const leadName = String(lead['Name'] || lead['Full Name'] || lead['Email'] || `Lead ${lead.id}`);

    if (meetingResult) {
      let newStatus: LeadStatus;

      switch (meetingResult) {
        case 'missed':
          newStatus = 'missed';
          break;
        case 'not interested':
          newStatus = 'not interested';
          break;
        case 'follow up':
          newStatus = 'follow up';
          break;
        case 'closed':
          newStatus = 'closed';
          break;
        default:
          newStatus = lead.status;
      }

      onUpdateStatus(lead.id, newStatus);

      toast({
        title: 'Meeting Updated',
        description: `Lead moved to "${newStatus}" status.`,
      });
    } else {
      toast({
        title: 'Meeting Details Saved',
        description: 'Meeting information has been updated.',
      });
    }

    onClose();
  };

  const dynamicFields = Object.entries(lead).filter(([key]) => 
    ![
      'id',
      'source',
      'status',
      'notes',
      'assignedAgent',
      'meetingDate',
      'meetingTime',
      'meetingResult',
      'postMeetingNotes',
    ].includes(key)
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 rounded-full gradient-success flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            Meeting Management
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-secondary/50 border">
              <div className="flex items-center gap-3 mb-3">
                <Badge className="bg-success/20 text-success border">
                  Meeting Booked
                </Badge>
                <span className="text-sm text-muted-foreground">
                  from {lead.source}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {dynamicFields.slice(0, 4).map(([key, value]) =>
                  value ? (
                    <div key={key}>
                      <p className="text-xs text-muted-foreground uppercase">{key}</p>
                      <p className="text-sm font-medium">{String(value)}</p>
                    </div>
                  ) : null
                )}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Schedule Meeting
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {/* FIX BUG 1: Input type="date" returns YYYY-MM-DD format */}
                <Input 
                  type="date" 
                  value={meetingDate} 
                  onChange={(e) => setMeetingDate(e.target.value)} 
                />
                <Input 
                  type="time" 
                  value={meetingTime} 
                  onChange={(e) => setMeetingTime(e.target.value)} 
                />
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Post-Meeting Result
              </h3>
              <Select value={meetingResult} onValueChange={(v) => setMeetingResult(v as MeetingResult)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select meeting outcome" />
                </SelectTrigger>
                <SelectContent>
                  {MEETING_RESULTS.map((result) => (
                    <SelectItem key={result} value={result}>
                      {result.charAt(0).toUpperCase() + result.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Meeting Notes</Label>
              <Textarea value={postMeetingNotes} onChange={(e) => setPostMeetingNotes(e.target.value)} />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" /> Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" /> Save Meeting
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
