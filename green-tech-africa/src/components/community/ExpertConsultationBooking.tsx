import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, 
  Clock, 
  DollarSign, 
  Star, 
  Calendar as CalendarIcon,
  MapPin,
  Languages,
  Award,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ExpertProfile {
  id: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  bio: string;
  expertise: string;
  years_experience: number;
  qualifications: string;
  languages: string;
  hourly_rate: number;
  available_for_consultation: boolean;
  is_featured: boolean;
  profile_picture?: string;
  linkedin_url?: string;
  website_url?: string;
}

interface ConsultationSlot {
  id: number;
  expert: number;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

interface ConsultationBooking {
  id: number;
  expert: number;
  slot: number;
  topic: string;
  notes: string;
  status: string;
}

interface ExpertConsultationBookingProps {
  expertId?: number;
}

export const ExpertConsultationBooking: React.FC<ExpertConsultationBookingProps> = ({ 
  expertId 
}) => {
  const [selectedExpert, setSelectedExpert] = useState<number | null>(expertId || null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);

  const queryClient = useQueryClient();

  // Fetch experts
  const { data: experts, isLoading: expertsLoading } = useQuery<ExpertProfile[]>({
    queryKey: ['experts'],
    queryFn: () => api.get('/api/v1/community/expert-profiles/'),
  });

  // Fetch available slots for selected expert and date
  const { data: availableSlots, isLoading: slotsLoading } = useQuery<ConsultationSlot[]>({
    queryKey: ['consultation-slots', selectedExpert, selectedDate],
    queryFn: () => {
      if (!selectedExpert || !selectedDate) return [];
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      return api.get(`/api/v1/community/expert-profiles/${selectedExpert}/available-slots/?date=${dateStr}`);
    },
    enabled: !!selectedExpert && !!selectedDate,
  });

  // Book consultation mutation
  const bookConsultationMutation = useMutation({
    mutationFn: (bookingData: Partial<ConsultationBooking>) =>
      api.post('/api/v1/community/consultation-bookings/', bookingData),
    onSuccess: () => {
      toast.success('Consultation booked successfully!');
      queryClient.invalidateQueries({ queryKey: ['consultation-slots'] });
      setShowBookingForm(false);
      setSelectedSlot(null);
      setTopic('');
      setNotes('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to book consultation');
    },
  });

  const handleBookConsultation = () => {
    if (!selectedSlot || !topic.trim()) {
      toast.error('Please select a time slot and provide a topic');
      return;
    }

    bookConsultationMutation.mutate({
      slot: selectedSlot,
      topic: topic.trim(),
      notes: notes.trim(),
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-GH', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getExpertiseColor = (expertise: string) => {
    const colors: Record<string, string> = {
      architecture: 'bg-blue-100 text-blue-800',
      engineering: 'bg-purple-100 text-purple-800',
      energy: 'bg-yellow-100 text-yellow-800',
      water: 'bg-cyan-100 text-cyan-800',
      materials: 'bg-green-100 text-green-800',
      finance: 'bg-emerald-100 text-emerald-800',
      policy: 'bg-orange-100 text-orange-800',
    };
    return colors[expertise] || 'bg-gray-100 text-gray-800';
  };

  const selectedExpertData = experts?.find(e => e.id === selectedExpert);

  if (expertsLoading) {
    return <div className="text-center py-8">Loading experts...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Expert Selection */}
      {!expertId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Choose an Expert
            </CardTitle>
            <CardDescription>
              Select a Ghana-based sustainability expert for consultation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {experts?.map((expert) => (
                <Card
                  key={expert.id}
                  className={`cursor-pointer transition-all ${
                    selectedExpert === expert.id
                      ? 'ring-2 ring-green-500 bg-green-50'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedExpert(expert.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={expert.profile_picture} />
                        <AvatarFallback>
                          {expert.user.first_name[0]}{expert.user.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">
                            {expert.user.first_name} {expert.user.last_name}
                          </h4>
                          {expert.is_featured && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        <Badge className={`text-xs mb-2 ${getExpertiseColor(expert.expertise)}`}>
                          {expert.expertise.replace('_', ' ')}
                        </Badge>
                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                          <Award className="h-3 w-3" />
                          <span>{expert.years_experience} years</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                          <Languages className="h-3 w-3" />
                          <span>{expert.languages}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
                          <DollarSign className="h-4 w-4" />
                          <span>{formatCurrency(expert.hourly_rate)}/hour</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Expert Details */}
      {selectedExpertData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Selected Expert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={selectedExpertData.profile_picture} />
                <AvatarFallback>
                  {selectedExpertData.user.first_name[0]}{selectedExpertData.user.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">
                    {selectedExpertData.user.first_name} {selectedExpertData.user.last_name}
                  </h3>
                  {selectedExpertData.is_featured && (
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  )}
                </div>
                <Badge className={getExpertiseColor(selectedExpertData.expertise)}>
                  {selectedExpertData.expertise.replace('_', ' ')}
                </Badge>
                <p className="text-gray-600 mt-2 mb-3">{selectedExpertData.bio}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-gray-500" />
                    <span>{selectedExpertData.years_experience} years experience</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span>{formatCurrency(selectedExpertData.hourly_rate)}/hour</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Languages className="h-4 w-4 text-gray-500" />
                    <span>{selectedExpertData.languages}</span>
                  </div>
                  {selectedExpertData.linkedin_url && (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-gray-500" />
                      <a 
                        href={selectedExpertData.linkedin_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        LinkedIn Profile
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Date and Time Selection */}
      {selectedExpert && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Select Date & Time
            </CardTitle>
            <CardDescription>
              Choose your preferred consultation date and available time slot
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date Picker */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Select Date</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || date < new Date(Date.now() - 86400000)}
                  className="rounded-md border"
                />
              </div>

              {/* Time Slots */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Available Time Slots</Label>
                {selectedDate ? (
                  <div className="space-y-2">
                    {slotsLoading ? (
                      <div className="text-center py-4 text-gray-500">Loading available slots...</div>
                    ) : availableSlots && availableSlots.length > 0 ? (
                      availableSlots.map((slot) => (
                        <Button
                          key={slot.id}
                          variant={selectedSlot === slot.id ? "default" : "outline"}
                          className="w-full justify-start"
                          onClick={() => setSelectedSlot(slot.id)}
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                        </Button>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        No available slots for this date
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    Please select a date to see available time slots
                  </div>
                )}
              </div>
            </div>

            {selectedSlot && (
              <div className="mt-6">
                <Button 
                  onClick={() => setShowBookingForm(true)}
                  className="w-full"
                >
                  Proceed to Book Consultation
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Booking Form */}
      {showBookingForm && selectedSlot && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Consultation Details
            </CardTitle>
            <CardDescription>
              Provide details about your consultation topic
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Consultation Topic *</Label>
              <Input
                id="topic"
                placeholder="e.g., Solar panel installation for residential property"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any specific questions or details you'd like to discuss..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleBookConsultation}
                disabled={bookConsultationMutation.isPending || !topic.trim()}
                className="flex-1"
              >
                {bookConsultationMutation.isPending ? 'Booking...' : 'Confirm Booking'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowBookingForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};