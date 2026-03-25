import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { MapPin, Calendar, Clock, X, Loader2, Navigation } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import axios from "axios";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";

export function MyBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/bookings/user", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      setBookings(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (id: string) => {
    try {
      // Assuming there's a cancel endpoint or we just update status
      // For now, let's assume we can PUT to /api/bookings/:id/cancel
      const response = await axios.put(`/api/bookings/${id}/cancel`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      
      if (response.status === 200) {
        setBookings(
          bookings.map((booking) =>
            booking._id === id ? { ...booking, bookingStatus: "cancelled" } : booking
          )
        );
        toast.success("Booking cancelled successfully");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to cancel booking");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "upcoming":
      case "booked":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "active":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatBookingDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MMMM dd, yyyy");
    } catch (e) {
      return dateStr;
    }
  };

  const isCancellable = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diff = (now.getTime() - created.getTime()) / (1000 * 60);
    return diff <= 5;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6">My Bookings</h1>

        {bookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <p>You haven't made any bookings yet.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop View - Table */}
            <div className="hidden md:block">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Station Name</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((booking) => (
                        <TableRow key={booking._id}>
                          <TableCell className="font-medium">
                            {booking.station?.stationName || "N/A"}
                          </TableCell>
                          <TableCell>{formatBookingDate(booking.bookingDate)}</TableCell>
                          <TableCell>{booking.startTime} - {booking.endTime || "..."}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(booking.bookingStatus)}>
                              {booking.bookingStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="flex gap-2">
                            {booking.station?.coordinates?.coordinates && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 border-green-600 text-green-600 hover:bg-green-50"
                                onClick={() => {
                                  const [lng, lat] = booking.station.coordinates.coordinates;
                                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
                                }}
                              >
                                <Navigation className="h-4 w-4" />
                                Directions
                              </Button>
                            )}
                            {booking.bookingStatus === "upcoming" && (
                              isCancellable(booking.createdAt) ? (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="gap-2"
                                    >
                                      <X className="h-4 w-4" />
                                      Cancel
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to cancel this booking? This
                                        action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>No, keep it</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleCancelBooking(booking._id)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Yes, cancel
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              ) : (
                                <span className="text-xs text-gray-400 italic">Cancellation window closed</span>
                              )
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Mobile View - Cards */}
            <div className="md:hidden space-y-4">
              {bookings.map((booking) => (
                <Card key={booking._id}>
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between">
                      <span className="flex-1">{booking.station?.stationName || "N/A"}</span>
                      <Badge className={getStatusColor(booking.bookingStatus)}>
                        {booking.bookingStatus}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{formatBookingDate(booking.bookingDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{booking.startTime} - {booking.endTime || "..."}</span>
                    </div>
                    
                    <div className="pt-2 flex flex-col gap-2">
                      {booking.station?.coordinates?.coordinates && (
                        <Button
                          variant="outline"
                          className="w-full gap-2 border-green-600 text-green-600 hover:bg-green-50"
                          onClick={() => {
                            const [lng, lat] = booking.station.coordinates.coordinates;
                            window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
                          }}
                        >
                          <Navigation className="h-4 w-4" />
                          Get Directions
                        </Button>
                      )}
                      
                      {booking.bookingStatus === "upcoming" && (
                      isCancellable(booking.createdAt) ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              className="w-full gap-2"
                            >
                              <X className="h-4 w-4" />
                              Cancel Booking
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel this booking? This
                                action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>No, keep it</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleCancelBooking(booking._id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Yes, cancel
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <p className="text-xs text-center text-gray-400 italic bg-gray-50 py-2 rounded">
                          Cancellation window closed (max 5 mins)
                        </p>
                      )
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
