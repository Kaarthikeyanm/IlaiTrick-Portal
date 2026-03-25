import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Calendar, Clock, MapPin, User, Phone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export function Booking() {
  const location = useLocation();
  const navigate = useNavigate();
  const { station, date, startTime, endTime } = location.state || {};

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });
  const [loadingUser, setLoadingUser] = useState(true);

  const API_URL = "/api";

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login to continue");
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setFormData({
            name: data.name || "",
            phone: data.phone || "",
          });
        } else {
          toast.error("Failed to fetch user profile");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error("User details missing. Please update your profile.");
      return;
    }
    navigate("/payment", {
      state: {
        station,
        date,
        startTime,
        endTime,
        userDetails: formData,
      },
    });
  };

  if (!station) {
    return (
      <div className="py-8">
        <div className="container mx-auto px-4 text-center">
          <p>No booking information found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Confirm Your Booking</h1>

          {/* Booking Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Station</p>
                  <p className="font-medium">{station.stationName || station.name}</p>
                  <p className="text-sm text-gray-600">{station.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{format(new Date(date), "MMMM dd, yyyy")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Time Range</p>
                  <p className="font-medium">{startTime} - {endTime}</p>
                </div>
              </div>
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Price:</span>
                  <span className="text-xl font-bold text-green-600">
                    ₹{(() => {
                      const start = startTime.split(':').map(Number);
                      const end = endTime.split(':').map(Number);
                      const hours = (end[0] * 60 + end[1] - (start[0] * 60 + start[1])) / 60;
                      return Math.max(0, hours * (station.pricePerHour || 50)).toFixed(2);
                    })()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Details (Fetched from Database) */}
          <Card>
            <CardHeader>
              <CardTitle>Confirm Your Contact Details</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingUser ? (
                <div className="flex flex-col items-center py-6 space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                  <p className="text-sm text-gray-500">Fetching your profile...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-xs font-bold text-gray-500 uppercase">Booked By</span>
                      </div>
                      <p className="font-semibold text-gray-800">{formData.name || "N/A"}</p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-xs font-bold text-gray-500 uppercase">Phone Number</span>
                      </div>
                      <p className="font-semibold text-gray-800">{formData.phone || "N/A"}</p>
                    </div>
                  </div>

                  {!formData.phone && (
                    <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded border border-amber-100">
                      Note: Your phone number is missing. You may want to update it in your profile.
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-lg py-6 shadow-lg transition-all active:scale-95"
                    size="lg"
                    disabled={!formData.name}
                  >
                    Confirm & Proceed to Payment
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
