import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Plus, MapPin, Loader2, BarChart3, TrendingUp, Zap, Clock, Calendar, DollarSign, Activity, Search, ShieldCheck, XCircle, Edit2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend 
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";

export function OwnerDashboard() {
  const [statsLoading, setStatsLoading] = useState(true);
  const [stations, setStations] = useState<any[]>([]);
  const [stationsLoading, setStationsLoading] = useState(true);

  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalBookings: 0,
      activeBookings: 0,
      availablePorts: 0,
      totalPorts: 0,
      totalEarnings: 0
    },
    chartData: [],
    recentActivities: []
  });



  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  
  // Receipt Verification State
  const [receiptInput, setReceiptInput] = useState("");
  const [verifyingReceipt, setVerifyingReceipt] = useState(false);
  const [foundReceipt, setFoundReceipt] = useState<any>(null);
  const [expiringReceipt, setExpiringReceipt] = useState(false);

  const API_URL = "/api";

  useEffect(() => {
    fetchDashboardStats();
    fetchStations();
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setBookingsLoading(true);
      const response = await fetch(`${API_URL}/bookings/owner`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setBookingsLoading(false);
    }
  };



  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      const response = await fetch(`${API_URL}/stations/owner/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchStations = async () => {
    try {
      setStationsLoading(true);
      const response = await fetch(`${API_URL}/stations/owner/list`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStations(data);
      }
    } catch (error) {
      console.error("Error fetching stations:", error);
    } finally {
      setStationsLoading(false);
    }
  };

  const toggleStationStatus = async (id: string, currentlyActive: boolean) => {
    try {
      const response = await fetch(`${API_URL}/stations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isActive: !currentlyActive })
      });
      if (response.ok) {
        toast.success(`Station successfully ${!currentlyActive ? 'opened' : 'closed'}!`);
        fetchStations();
      } else {
        toast.error('Failed to update station status');
      }
    } catch (error) {
      toast.error('Network error while updating status');
    }
  };

  const handleReceiptSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptInput || receiptInput.length !== 4) {
      toast.error("Please enter a valid 4-digit receipt number");
      return;
    }

    try {
      setVerifyingReceipt(true);
      setFoundReceipt(null);
      const response = await fetch(`${API_URL}/bookings/receipt/${receiptInput}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFoundReceipt(data);
        toast.success("Receipt found!");
      } else {
        const error = await response.json();
        toast.error(error.message || "Receipt not found");
      }
    } catch (error) {
      toast.error("Error searching for receipt");
    } finally {
      setVerifyingReceipt(false);
    }
  };

  const handleExpireReceipt = async () => {
    if (!foundReceipt) return;

    try {
      setExpiringReceipt(true);
      const response = await fetch(`${API_URL}/bookings/receipt/${foundReceipt.receiptNumber}/expire`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFoundReceipt(data.booking);
        toast.success("Receipt marked as expired!");
        fetchBookings(); // Refresh the list
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to expire receipt");
      }
    } catch (error) {
      toast.error("Error updating receipt status");
    } finally {
      setExpiringReceipt(false);
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      const response = await fetch(`${API_URL}/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast.success(`Booking status updated to ${newStatus}`);
        fetchBookings();
        fetchDashboardStats();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update status");
      }
    } catch (error) {
      toast.error("Error updating booking status");
    }
  };



  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Owner Dashboard</h1>
          <p className="text-gray-600">Manage your charging stations</p>
        </div>
        <Link to="/owner/add-station">
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="mr-2 h-4 w-4" /> Add Station
          </Button>
        </Link>
      </div>

      {/* Receipt Verification Section */}
      <Card className="mb-8 border-2 border-green-100 shadow-md overflow-hidden">
        <CardHeader className="bg-green-50/50 pb-4">
          <CardTitle className="text-xl flex items-center gap-2 text-green-800">
            <ShieldCheck className="h-6 w-6" /> Verify Customer Receipt
          </CardTitle>
          <p className="text-sm text-green-600">Enter the 4-digit code from the customer's receipt to verify their booking.</p>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleReceiptSearch} className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input 
                placeholder="Enter 4-digit number (e.g. 1234)" 
                value={receiptInput}
                onChange={(e) => setReceiptInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="text-xl font-mono tracking-[0.5em] text-center h-12 border-2 focus:border-green-500"
                maxLength={4}
              />
            </div>
            <Button 
              type="submit" 
              className="bg-green-600 hover:bg-green-700 h-12 px-8 font-bold text-lg"
              disabled={verifyingReceipt}
            >
              {verifyingReceipt ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Search className="mr-2 h-5 w-5" /> Verify</>}
            </Button>
          </form>

          {foundReceipt && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white border rounded-2xl shadow-sm">
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Customer Details</Label>
                    <p className="text-lg font-bold text-gray-900">{foundReceipt.user?.name}</p>
                    <p className="text-sm text-gray-600">{foundReceipt.user?.email}</p>
                    <p className="text-sm text-gray-600">{foundReceipt.user?.phone}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Booking Info</Label>
                    <p className="font-medium">{foundReceipt.station?.stationName}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(foundReceipt.bookingDate).toLocaleDateString()} | {foundReceipt.startTime} - {foundReceipt.endTime}
                    </p>
                  </div>
                </div>
                <div className="space-y-4 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <Label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Status</Label>
                      <div className="mt-1">
                        {foundReceipt.isExpired ? (
                          <Badge className="bg-red-100 text-red-700 border-red-200">
                            <XCircle className="w-3 h-3 mr-1" /> EXPIRED / USED
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            <ShieldCheck className="w-3 h-3 mr-1" /> VALID RECEIPT
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Amount Paid</Label>
                      <p className="text-2xl font-black text-green-600 mt-1">₹{foundReceipt.totalAmount}</p>
                    </div>
                  </div>
                  
                  {!foundReceipt.isExpired && (
                    <Button 
                      onClick={handleExpireReceipt}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold h-12"
                      disabled={expiringReceipt}
                    >
                      {expiringReceipt ? <Loader2 className="h-5 w-5 animate-spin" /> : "Mark as Used / Expired"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" /> Total Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.totalBookings}</div>
            <p className="text-xs text-gray-400 mt-1">Lifetime bookings</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" /> Active Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{dashboardData.stats.activeBookings}</div>
            <p className="text-xs text-gray-400 mt-1">Upcoming slots</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-orange-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-500" /> Available Ports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.availablePorts} / {dashboardData.stats.totalPorts}</div>
            <p className="text-xs text-gray-400 mt-1">Ready for use</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-purple-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-500" /> Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">${dashboardData.stats.totalEarnings}</div>
            <p className="text-xs text-gray-400 mt-1">Confirmed payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-gray-600" /> Performance Over Time
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboardData.chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(str) => {
                      const date = new Date(str);
                      return date.toLocaleDateString('en-US', { weekday: 'short' });
                    }}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="bookings" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Bookings"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="earnings" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Earnings ($)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-gray-600" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {dashboardData.recentActivities.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No recent activity found.</p>
              ) : (
                dashboardData.recentActivities.map((activity: any) => (
                  <div key={activity.id} className="flex gap-4 border-l-2 border-gray-100 pl-4 relative">
                    <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white ${
                      activity.type === 'cancellation' ? 'bg-red-500' : 'bg-green-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{activity.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(activity.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Bookings Section */}
      <Card className="mb-10 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-600" /> Detailed Recent Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bookingsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-green-500" />
            </div>
          ) : bookings.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No bookings found for your stations.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Station</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking._id}>
                      <TableCell>
                        <div className="font-medium">{booking.user?.name || 'Guest'}</div>
                        <div className="text-xs text-gray-500">{booking.user?.phone}</div>
                      </TableCell>
                      <TableCell>{booking.station?.stationName}</TableCell>
                      <TableCell>{new Date(booking.bookingDate).toLocaleDateString()}</TableCell>
                      <TableCell>{booking.startTime} - {booking.endTime || '...'}</TableCell>
                      <TableCell>₹{booking.totalAmount}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <select 
                            value={booking.bookingStatus}
                            onChange={(e) => handleStatusUpdate(booking._id, e.target.value)}
                            className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer focus:ring-0 ${
                              booking.bookingStatus === 'upcoming' ? 'bg-green-100 text-green-800' :
                              booking.bookingStatus === 'active' ? 'bg-blue-100 text-blue-800' :
                              booking.bookingStatus === 'completed' ? 'bg-gray-100 text-gray-800' :
                              'bg-red-100 text-red-800'
                            }`}
                          >
                            <option value="upcoming">Upcoming</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Stations Section */}
      <h2 className="text-2xl font-bold mb-6">My Stations</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {stationsLoading ? (
          <div className="col-span-full flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-green-500" />
          </div>
        ) : stations.length === 0 ? (
          <div className="col-span-full text-center py-10 text-gray-500 bg-white rounded-lg border shadow-sm">
            No stations found. Add your first station!
          </div>
        ) : (
          stations.map((station: any) => (
            <Card key={station._id} className="bg-white shadow-sm flex flex-col border-t-4 border-t-green-500">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{station.stationName}</CardTitle>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="h-4 w-4" /> {station.city}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    station.isApproved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {station.isApproved ? 'Approved' : 'Pending'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-sm text-gray-600 space-y-2 mt-2">
                  <div className="flex justify-between">
                    <span>Opening Time:</span>
                    <span className="font-medium">{station.openingTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Closing Time:</span>
                    <span className="font-medium">{station.closingTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Ports:</span>
                    <span className="font-medium">{station.totalPorts}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2 border-t flex flex-col gap-2">
                {station.isApproved ? (
                  <>
                    <Link to={`/owner/manage/${station._id}`} className="w-full">
                      <Button variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50">
                        Manage Station
                      </Button>
                    </Link>
                    <Link to={`/owner/ports/${station._id}`} className="w-full">
                      <Button variant="outline" className="w-full text-green-600 border-green-200 hover:bg-green-50">
                        Manage Ports
                      </Button>
                    </Link>
                    <Button 
                      variant={station.isActive === false ? "default" : "destructive"} 
                      className="w-full"
                      onClick={() => toggleStationStatus(station._id, station.isActive !== false)}
                    >
                      {station.isActive === false ? "Open Station" : "Close Station"}
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" className="w-full cursor-not-allowed opacity-50" disabled>
                    Waiting for Approval
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
