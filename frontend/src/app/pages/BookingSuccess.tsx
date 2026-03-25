import { useLocation, Link } from "react-router";
import { CheckCircle2, Calendar, Clock, MapPin, Receipt, ArrowRight, Home, CreditCard, Navigation } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { format } from "date-fns";

export function BookingSuccess() {
  const location = useLocation();
  const { booking } = location.state || {};

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="max-w-md w-full text-center p-8 rounded-3xl shadow-xl border-0">
          <CardContent className="space-y-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10 text-red-500 opacity-20" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">No Booking Found</h1>
            <p className="text-gray-500">We couldn't find any recent booking data. Please check your dashboard.</p>
            <Link to="/my-bookings" className="block">
              <Button className="w-full bg-green-600 hover:bg-green-700 h-12 rounded-2xl">Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50/30 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-10 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-600 rounded-full shadow-2xl shadow-green-200 mb-2">
            <CheckCircle2 className="h-12 w-12 text-white animate-bounce" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Booking Confirmed!</h1>
          <p className="text-lg text-green-700 font-medium">A receipt has been sent to <span className="underline decoration-2 underline-offset-4">{booking.user.email}</span></p>
        </div>

        {/* Receipt Card */}
        <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white animate-in zoom-in-95 duration-500 delay-200">
          <CardHeader className="bg-gray-900 text-white p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-green-600/20 to-transparent"></div>
            <Receipt className="h-8 w-8 mx-auto mb-4 text-green-400" />
            <CardTitle className="text-2xl font-bold uppercase tracking-widest italic">Official Receipt</CardTitle>
            <div className="mt-4 inline-block px-6 py-2 bg-green-600/30 backdrop-blur-md rounded-xl border border-green-400/30">
              <p className="text-xs text-green-300 font-bold uppercase tracking-wider mb-1">Receipt Number</p>
              <p className="text-3xl font-black text-white tracking-[0.3em]">{booking.receiptNumber}</p>
            </div>
            <p className="text-gray-400 text-xs mt-4">Transaction ID: {booking.transactionId}</p>
          </CardHeader>
          
          <CardContent className="p-8 space-y-8">
            {/* Main Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 border-b border-gray-100">
              <div className="space-y-4">
                 <div className="flex items-start gap-3">
                   <div className="p-2 bg-green-50 rounded-lg"><MapPin className="h-5 w-5 text-green-600" /></div>
                   <div>
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Station</p>
                     <p className="font-bold text-gray-900">{booking.station.stationName}</p>
                     <p className="text-sm text-gray-500">{booking.station.address}</p>
                   </div>
                 </div>
                 <div className="flex items-start gap-3">
                   <div className="p-2 bg-blue-50 rounded-lg"><Calendar className="h-5 w-5 text-blue-600" /></div>
                   <div>
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Date</p>
                     <p className="font-bold text-gray-900">{format(new Date(booking.bookingDate), "MMMM dd, yyyy")}</p>
                   </div>
                 </div>
              </div>
              
              <div className="space-y-4">
                 <div className="flex items-start gap-3">
                   <div className="p-2 bg-amber-50 rounded-lg"><Clock className="h-5 w-5 text-amber-600" /></div>
                   <div>
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Time Slot</p>
                     <p className="font-bold text-gray-900">{booking.startTime} - {booking.endTime}</p>
                   </div>
                 </div>
                 <div className="flex items-start gap-3">
                   <div className="p-2 bg-purple-50 rounded-lg"><CheckCircle2 className="h-5 w-5 text-purple-600" /></div>
                   <div>
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</p>
                     <p className="font-bold text-gray-900">{booking.user.name}</p>
                   </div>
                 </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-gray-50 rounded-3xl p-6 space-y-3 border border-gray-100/50">
               <div className="flex justify-between items-center">
                 <span className="text-gray-500 font-medium flex items-center gap-2"><CreditCard className="h-4 w-4" /> Payment Method</span>
                 <span className="font-bold text-gray-900">Card (•••• 4242)</span>
               </div>
               <div className="h-px bg-gray-200/50 my-2"></div>
               <div className="flex justify-between items-end">
                 <div>
                   <span className="text-gray-500 font-medium block">Total Amount</span>
                   <span className="text-4xl font-black text-green-600 tracking-tighter">₹{booking.totalAmount.toFixed(2)}</span>
                 </div>
                 <div className="text-right">
                   <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">PAID</span>
                 </div>
               </div>
            </div>

            {/* Navigation Button */}
            <Button 
                className="w-full h-16 rounded-3xl bg-green-600 hover:bg-green-700 text-white font-black text-xl gap-3 shadow-xl shadow-green-200 transition-all hover:scale-[1.02] active:scale-95 mb-4"
                onClick={() => {
                  const [lng, lat] = booking.station.coordinates.coordinates;
                  window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, "_blank");
                }}
            >
              <Navigation className="h-6 w-6" /> Navigate to Station
            </Button>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <Link to="/my-bookings" className="w-full">
                 <Button className="w-full h-14 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white font-bold gap-2 text-base">
                   View My Bookings <ArrowRight className="h-4 w-4" />
                 </Button>
               </Link>
               <Link to="/" className="w-full">
                 <Button variant="outline" className="w-full h-14 rounded-2xl border-2 font-bold gap-2 text-base">
                   <Home className="h-4 w-4" /> Back to Home
                 </Button>
               </Link>
            </div>
            
            <p className="text-center text-xs text-gray-400">Please present this digital receipt or the one sent to your email at the charging station.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
