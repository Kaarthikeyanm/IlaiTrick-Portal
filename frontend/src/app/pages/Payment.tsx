import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Calendar, Clock, MapPin, CreditCard, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import axios from "axios";

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe("pk_test_51TC0Z1QxMHfeWHhwUYJhLo4XaIpqqlwcbJ97zwcahXZU7FEF3taRbUdcWmVNcbWrbnRabOUNIjWKFJDFrPkrlEZ700fzXmMhYy");

const CheckoutForm = ({ station, bookingDetails, amount }: any) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Create PaymentIntent on the backend
      const { data } = await axios.post("http://localhost:5000/api/bookings/order", {
        stationId: bookingDetails.stationId,
        bookingDate: bookingDetails.bookingDate,
        startTime: bookingDetails.startTime,
        endTime: bookingDetails.endTime,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      const clientSecret = data.clientSecret;

      // 2. Confirm the payment on the client
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: "Customer Name", // Replace with real user data if available
          },
        },
      });

      if (result.error) {
        toast.error(result.error.message || "Payment failed");
        setIsProcessing(false);
      } else {
        if (result.paymentIntent.status === "succeeded") {
          // 3. Verify on backend and create booking
          const response = await axios.post("/api/bookings/verify", {
            paymentIntentId: result.paymentIntent.id,
            bookingDetails: bookingDetails,
            paymentMethod: "card"
          }, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          });

          toast.success("Payment successful! Your booking is confirmed.");
          setTimeout(() => {
            navigate("/booking-success", { state: { booking: response.data.booking } });
          }, 1500);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "An error occurred during payment");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="p-4 border rounded-lg bg-gray-50">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  color: "#424770",
                  "::placeholder": {
                    color: "#aab7c4",
                  },
                },
                invalid: {
                  color: "#9e2146",
                },
              },
            }}
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-green-600 hover:bg-green-700"
        size="lg"
      >
        {isProcessing ? "Processing..." : `Pay ₹${amount}`}
      </Button>
    </form>
  );
};

export function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { station, date, startTime, endTime } = location.state || {};

  if (!station) {
    return (
      <div className="py-8">
        <div className="container mx-auto px-4 text-center">
          <p>No booking information found</p>
        </div>
      </div>
    );
  }

  const calculateAmount = () => {
    const start = startTime.split(':').map(Number);
    const end = endTime.split(':').map(Number);
    const hours = (end[0] * 60 + end[1] - (start[0] * 60 + start[1])) / 60;
    return Math.max(0, hours * (station.pricePerHour || 50)).toFixed(2);
  };

  const amount = calculateAmount();

  const bookingDetails = {
    stationId: station._id,
    bookingDate: date,
    startTime: startTime,
    endTime: endTime
  };

  const [paymentMethod, setPaymentMethod] = useState("card");
  const [qrCodePath, setQrCodePath] = useState("/api/placeholder/qr"); // We'll use the generated image path or a placeholder

  const simulateQrPayment = async () => {
    try {
      toast.info("Simulating QR payment...");
      // For demo purposes, we'll just call the verify endpoint with a dummy payment intent
      // In a real app, this would be triggered by a callback from the payment provider
      const { data: orderData } = await axios.post("/api/bookings/order", {
        stationId: bookingDetails.stationId,
        bookingDate: bookingDetails.bookingDate,
        startTime: bookingDetails.startTime,
        endTime: bookingDetails.endTime,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      const response = await axios.post("/api/bookings/verify", {
        paymentIntentId: "qr_sim_" + Math.random().toString(36).substr(2, 9),
        bookingDetails: bookingDetails,
        paymentMethod: "qr"
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      toast.success("QR Payment successful! Your booking is confirmed.");
      setTimeout(() => {
        navigate("/booking-success", { state: { booking: response.data.booking } });
      }, 1500);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "QR Payment simulation failed");
    }
  };

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Payment</h1>

          {/* Booking Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Station</p>
                  <p className="font-medium">{station.stationName || station.name}</p>
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
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold">Total Amount:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ₹{amount}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-2 gap-4">
                <div>
                  <RadioGroupItem value="card" id="card" className="peer sr-only" />
                  <Label
                    htmlFor="card"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-600 [&:has([data-state=checked])]:border-green-600"
                  >
                    <CreditCard className="mb-3 h-6 w-6" />
                    <span className="text-sm font-medium">Credit/Debit Card</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="qr" id="qr" className="peer sr-only" />
                  <Label
                    htmlFor="qr"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-600 [&:has([data-state=checked])]:border-green-600"
                  >
                    <Smartphone className="mb-3 h-6 w-6" />
                    <span className="text-sm font-medium">UPI / QR Code</span>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Payment Method Content */}
          <Card>
            <CardHeader>
              <CardTitle>{paymentMethod === "card" ? "Enter Card Details" : "Scan to Pay"}</CardTitle>
            </CardHeader>
            <CardContent>
              {paymentMethod === "card" ? (
                <Elements stripe={stripePromise}>
                  <CheckoutForm
                    station={station}
                    bookingDetails={bookingDetails}
                    amount={amount}
                  />
                </Elements>
              ) : (
                <div className="flex flex-col items-center space-y-6 py-4">
                  <div className="p-4 bg-white border-2 border-dashed border-green-200 rounded-xl">
                    <img 
                      src={`/qr-payment.png`} 
                      alt="Payment QR Code" 
                      className="w-48 h-48 object-contain"
                    />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-500 italic">Scan the QR code with any UPI app (GPay, PhonePe, Paytm)</p>
                    <div className="flex items-center justify-center gap-2 text-green-700 font-bold text-xl">
                      <span>Total: ₹{amount}</span>
                    </div>
                  </div>
                  <Button 
                    onClick={simulateQrPayment}
                    className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg"
                  >
                    I Have Paid (Simulate)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
