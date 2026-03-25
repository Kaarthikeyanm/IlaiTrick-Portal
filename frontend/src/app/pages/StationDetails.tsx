import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { MapPin, Phone, Clock, DollarSign, Zap, Calendar as CalendarIcon, BatteryCharging, CheckCircle2, AlertCircle, XCircle, Activity } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Calendar } from "../components/ui/calendar";
import { toast } from "sonner";
import { format } from "date-fns";

export function StationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState<string>("12:00");
  const [endTime, setEndTime] = useState<string>("13:00");

  const [station, setStation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [timeSlots, setTimeSlots] = useState<{ time: string, availablePorts: number }[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [liveStatus, setLiveStatus] = useState<any>(null);

  const userRole = localStorage.getItem("role");

  const API_URL = "/api";

  useEffect(() => {
    fetchStationDetails();
  }, [id]);

  useEffect(() => {
    if (station) {
      fetchLiveStatus();
      const interval = setInterval(fetchLiveStatus, 10000); // Refresh every 10s
      return () => clearInterval(interval);
    }
  }, [station]);

  const fetchLiveStatus = async () => {
    if (!station) return;
    try {
      const response = await fetch(`${API_URL}/bookings/owner/station/${id}/ports`, {
         headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLiveStatus(data);
      }
    } catch (error) {
      console.error("Error fetching live status:", error);
    }
  };

  useEffect(() => {
    if (station && selectedDate) {
      fetchTimeSlots();
    }
  }, [selectedDate, station]);

  const fetchTimeSlots = async () => {
    if (!station || !selectedDate) return;
    setSlotsLoading(true);
    try {
      const response = await fetch(`${API_URL}/bookings/availability?stationId=${station._id}&date=${selectedDate.toISOString()}`);
      if (response.ok) {
        const data = await response.json();
        setTimeSlots(data);
      } else {
        toast.error("Failed to load time slots");
      }
    } catch (error) {
      console.error("Error fetching time slots:", error);
      toast.error("Error connecting to server to load time slots");
    } finally {
      setTimeout(() => setSlotsLoading(false), 400); // UX delay
    }
  };

  const fetchStationDetails = async () => {
    try {
      const response = await fetch(`${API_URL}/stations/${id}`);
      const data = await response.json();
      setStation(data);
    } catch (error) {
      console.error("Error fetching station details:", error);
      toast.error("Failed to load station details");
    } finally {
      // Simulate network delay for skeleton effect
      setTimeout(() => setLoading(false), 800);
    }
  };

  const totalPorts = station?.totalPorts || 6;

  const handleProceedToBooking = () => {
    if (!selectedDate || !startTime || !endTime) {
      toast.error("Please select a date, start time, and end time");
      return;
    }

    // Basic time validation
    const start = startTime.split(':').map(Number);
    const end = endTime.split(':').map(Number);
    const startMin = start[0] * 60 + start[1];
    const endMin = end[0] * 60 + end[1];

    if (endMin <= startMin) {
      toast.error("End time must be after start time");
      return;
    }

    // Past time check for current day
    const now = new Date();
    if (selectedDate.toDateString() === now.toDateString()) {
      const [nowH, nowM] = [now.getHours(), now.getMinutes()];
      if (start[0] < nowH || (start[0] === nowH && start[1] <= nowM)) {
        toast.error("Cannot book a slot in the past. Please select a future time.");
        return;
      }
    }

    // Availability check
    const isSlotAvailable = () => {
      // Find all 1-hour slots that overlap with the selected range
      const overlappingSlots = timeSlots.filter(slot => {
        const [s, e] = slot.time.split(' - ');
        const parseToMinutes = (timeStr: string) => {
          let [time, ampm] = timeStr.split(' ');
          let [h, m] = time.split(':').map(Number);
          if (ampm === 'PM' && h < 12) h += 12;
          if (ampm === 'AM' && h === 12) h = 0;
          return h * 60 + m;
        };
        const slotStart = parseToMinutes(s);
        const slotEnd = parseToMinutes(e);
        return Math.max(startMin, slotStart) < Math.min(endMin, slotEnd);
      });

      // If any of the overlapping 1-hour slots are full, the whole range is considered unavailable
      const fullSlot = overlappingSlots.find(s => s.availablePorts <= 0);
      return { available: !fullSlot, fullSlot };
    };

    const { available } = isSlotAvailable();

    if (!available) {
      const nextFreeSlot = timeSlots.find(s => s.availablePorts > 0);
      const suggestionMsg = nextFreeSlot 
        ? `The selected slot is full. The next available slot is at ${nextFreeSlot.time.split(' - ')[0]}.` 
        : "The selected slot is full, and no other slots are available for this date.";
      
      toast.error(suggestionMsg, {
        duration: 5000,
        action: nextFreeSlot ? {
          label: "Use this time",
          onClick: () => {
            const [s, e] = nextFreeSlot.time.split(' - ');
            // Helper to convert "09:00 AM" to "09:00"
            const to24h = (time12: string) => {
               let [time, ampm] = time12.split(' ');
               let [h, m] = time.split(':').map(Number);
               if (ampm === 'PM' && h < 12) h += 12;
               if (ampm === 'AM' && h === 12) h = 0;
               return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            };
            setStartTime(to24h(s));
            setEndTime(to24h(e));
          }
        } : undefined
      });
      return;
    }

    navigate(`/booking/${id}`, {
      state: {
        station,
        date: selectedDate,
        startTime,
        endTime,
      },
    });
  };

  const renderSkeleton = () => (
    <div className="py-10 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 max-w-5xl space-y-8">
        <div className="h-40 bg-gray-200 animate-pulse rounded-2xl w-full"></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="col-span-1 lg:col-span-4 h-96 bg-gray-200 animate-pulse rounded-2xl w-full"></div>
          <div className="col-span-1 lg:col-span-8 h-[500px] bg-gray-200 animate-pulse rounded-2xl w-full"></div>
        </div>
      </div>
    </div>
  );

  if (loading) return renderSkeleton();

  if (!station) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-700">Station not found</h2>
        <p className="text-gray-500 mt-2">Please check the URL or try searching again.</p>
        <Button onClick={() => navigate("/stations")} className="mt-4">Back to Directory</Button>
      </div>
    );
  }

  return (
    <div className="py-10 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Section 1: Station Information */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10">
              <Zap className="w-64 h-64 -mt-10 -mr-10" />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                    {station.stationName || "Ilaitrick Station"}
                  </h1>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-green-50 mt-3">
                  <div className="flex items-center gap-2 text-lg">
                    <MapPin className="h-5 w-5" />
                    <span>{station.address || station.locationName || station.city || "Location details"}</span>
                  </div>
                  {station.coordinates?.coordinates && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20 border border-white/30 gap-2 w-fit"
                      onClick={() => {
                        const [lng, lat] = station.coordinates.coordinates;
                        window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, "_blank");
                      }}
                    >
                      <MapPin className="h-4 w-4" />
                      View on Map
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 min-w-[140px]">
                  <p className="text-green-100 text-sm font-medium mb-1 flex items-center gap-2">
                    <BatteryCharging className="h-4 w-4" /> Total Ports
                  </p>
                  <p className="text-3xl font-bold">{totalPorts}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 min-w-[140px]">
                  <p className="text-green-100 text-sm font-medium mb-1 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" /> Price
                  </p>
                  <p className="text-3xl font-bold">₹{station.pricePerHour || 50}<span className="text-lg font-normal text-green-100"> / hour</span></p>
                </div>
              </div>
            </div>
            
            {/* Live Status Overlay for Premium feel */}
            {liveStatus && (
              <div className="mt-8 flex flex-wrap gap-4">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex-1 min-w-[200px] animate-in fade-in zoom-in duration-500">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-green-100 text-sm font-medium flex items-center gap-2">
                      <Activity className="h-4 w-4" /> Live Occupancy
                    </span>
                    <span className="text-xs bg-green-400/20 text-green-300 px-2 py-0.5 rounded-full border border-green-400/30 animate-pulse">
                      LIVE
                    </span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold">{liveStatus.usedPorts}</span>
                    <span className="text-green-200 mb-1">/ {liveStatus.totalPorts} Ports Used</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="bg-green-400 h-full transition-all duration-1000" 
                      style={{ width: `${(liveStatus.usedPorts / liveStatus.totalPorts) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-green-200/60 mt-2 uppercase tracking-widest font-bold">
                    {liveStatus.availablePorts} ports strictly available for walk-in or immediate start
                  </p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex-1 min-w-[200px] animate-in fade-in zoom-in duration-700">
                   <div className="text-green-100 text-sm font-medium flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4" /> Port Availability
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {liveStatus.ports.map((p: any) => (
                        <div 
                          key={p.portNumber} 
                          title={`Port ${p.portNumber}: ${p.status}`}
                          className={`w-4 h-4 rounded-sm ${p.status === 'available' ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.4)]' : 'bg-red-400 opacity-50'}`}
                        ></div>
                      ))}
                    </div>
                    <p className="text-[10px] text-green-200/60 mt-3 uppercase tracking-widest font-bold">
                      Real-time physical status of all unit ports
                    </p>
                </div>
              </div>
            )}
          </div>

          {/* Booking Section */}
          {userRole === "user" ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Date Selection */}
              <div className="col-span-1 lg:col-span-4 space-y-6">
                <Card className="shadow-lg border-0 ring-1 ring-gray-100 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-white border-b border-gray-50 pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <CalendarIcon className="h-5 w-5 text-green-600" />
                      Select Date
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 bg-white flex justify-center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                      }}
                      className="rounded-xl border bg-white shadow-sm"
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                    />
                  </CardContent>
                </Card>

                {/* Booking Summary Card */}
                {selectedDate && startTime && endTime && (
                  <Card className="shadow-lg border-0 ring-1 ring-green-100 bg-green-50 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-green-900 mb-4 text-lg border-b border-green-200 pb-2">Booking Summary</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-green-700 flex items-center gap-2"><MapPin className="h-4 w-4"/> Station</span>
                          <span className="font-medium text-green-900 truncate max-w-[150px]">{station.stationName || "EV Station"}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-green-700 flex items-center gap-2"><CalendarIcon className="h-4 w-4"/> Date</span>
                          <span className="font-medium text-green-900">{format(selectedDate, "MMM dd, yyyy")}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-green-700 flex items-center gap-2"><Clock className="h-4 w-4"/> Time</span>
                          <span className="font-medium text-green-900">{startTime} - {endTime}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm pt-2 border-t border-green-200/50">
                          <span className="text-green-700 flex items-center gap-2"><DollarSign className="h-4 w-4"/> Total Price</span>
                          <span className="text-xl font-bold text-green-900">
                            ₹{(() => {
                              const start = startTime.split(':').map(Number);
                              const end = endTime.split(':').map(Number);
                              const hours = (end[0] * 60 + end[1] - (start[0] * 60 + start[1])) / 60;
                              return Math.max(0, hours * (station.pricePerHour || 50)).toFixed(2);
                            })()}
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={handleProceedToBooking}
                        className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all rounded-xl py-6 text-lg font-medium"
                      >
                        Proceed to Booking
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column: Custom Timing & Busy Periods */}
              <div className="col-span-1 lg:col-span-8 space-y-6">
                <Card className="shadow-lg border-0 ring-1 ring-gray-100 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-white border-b border-gray-50 pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Clock className="h-5 w-5 text-green-600" />
                      Select Timing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-green-600" /> Start Time
                        </label>
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full p-4 rounded-xl border-2 border-gray-100 focus:border-green-500 focus:ring-0 transition-all text-lg font-medium bg-gray-50"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-red-600" /> End Time
                        </label>
                        <input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="w-full p-4 rounded-xl border-2 border-gray-100 focus:border-green-500 focus:ring-0 transition-all text-lg font-medium bg-gray-50"
                        />
                      </div>
                    </div>

                    <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 items-start">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">Station Hours</p>
                        <p>{station.openingTime || '09:00'} to {station.closingTime || '18:00'}</p>
                        <p className="mt-2 text-xs opacity-80">Please ensure your selected timing falls within the station's working hours.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Busy Periods Indicator */}
                <Card className="shadow-lg border-0 ring-1 ring-gray-100 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-white border-b border-gray-50 pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg text-gray-700">
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                      Busy Periods
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 bg-gray-50/30">
                    <p className="text-sm text-gray-500 mb-4">Check commonly booked slots to avoid overlaps.</p>
                    {slotsLoading ? (
                      <div className="flex justify-center p-4">
                        <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {timeSlots.map((slot, i) => (
                          <div 
                            key={i} 
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                              slot.availablePorts === 0 
                                ? "bg-red-50 border-red-200 text-red-700" 
                                : slot.availablePorts <= 2 
                                  ? "bg-yellow-50 border-yellow-200 text-yellow-700"
                                  : "bg-green-50 border-green-200 text-green-700"
                            }`}
                          >
                            {slot.time} ({slot.availablePorts} free)
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card className="bg-blue-50 border-blue-200 shadow-sm rounded-2xl">
              <CardContent className="py-12 text-center flex flex-col items-center">
                <div className="bg-blue-100 p-4 rounded-full mb-4 text-blue-600">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-blue-900 mb-2">Login Required</h3>
                <p className="text-blue-700 max-w-md mx-auto">
                  {userRole === "owner" || userRole === "admin" 
                    ? "As an Owner/Admin, you can view station details but cannot book slots. Please switch to a user account." 
                    : "Please log in as a User to view availability and book a charging slot."}
                </p>
                {!userRole && (
                  <Button 
                    className="mt-6 bg-blue-600 hover:bg-blue-700 px-8 py-2 text-lg rounded-xl shadow-md transition-transform hover:-translate-y-0.5"
                    onClick={() => navigate("/login")}
                  >
                    Go to Login
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
