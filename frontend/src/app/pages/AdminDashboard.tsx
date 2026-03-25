import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../components/ui/table";
import {
  LayoutDashboard, MapPin, Calendar, Users, Trash2, FileText,
  X, CheckCircle, Eye, Building2, Phone, Mail, Fingerprint, ChevronDown, ChevronUp
} from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";

const REJECTION_REASONS = [
  "Aadhaar card details are blurry or invalid",
  "Business Registration certificate is missing or expired",
  "Electrical Safety certificate is invalid",
  "Station photos are not clear or do not show the station correctly",
  "Address/Location mismatch with provided coordinates",
  "Incomplete profile details",
];

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [statsData, setStatsData] = useState({
    totalUsers: 0, onlineUsers: 0, totalStations: 0,
    pendingStations: 0, totalBookings: 0,
  });
  const [pendingStations, setPendingStations] = useState<any[]>([]);
  const [allStations, setAllStations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [stationSubTab, setStationSubTab] = useState<"pending" | "active">("pending");
  const [expandedStation, setExpandedStation] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);

  // Rejection Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingStationId, setRejectingStationId] = useState<string | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [customReason, setCustomReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const API_URL = "/api";
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { 
    if (activeTab === "dashboard") {
      fetchStats(); 
      fetchPendingStations(); 
    } else if (activeTab === "stations") {
      fetchPendingStations();
      fetchAllStations();
    } else if (activeTab === "users") {
      fetchUsers();
    } else if (activeTab === "bookings") {
      fetchAllBookings();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/stats`, { headers });
      const data = await res.json();
      setStatsData(data);
    } catch { /* silent */ }
  };

  const fetchPendingStations = async () => {
    try {
      setTabLoading(true);
      const res = await fetch(`${API_URL}/stations/admin/pending`, { headers });
      const data = await res.json();
      setPendingStations(Array.isArray(data) ? data : []);
    } catch { /* silent */ } finally { setLoading(false); setTabLoading(false); }
  };

  const fetchUsers = async () => {
    try {
      setTabLoading(true);
      const res = await fetch(`${API_URL}/admin/users`, { headers });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch { toast.error("Failed to fetch users"); } finally { setTabLoading(false); }
  };

  const fetchAllBookings = async () => {
    try {
      setTabLoading(true);
      const res = await fetch(`${API_URL}/admin/bookings`, { headers });
      const data = await res.json();
      setAllBookings(Array.isArray(data) ? data : []);
    } catch { toast.error("Failed to fetch bookings"); } finally { setTabLoading(false); }
  };

  const fetchAllStations = async () => {
    try {
      setTabLoading(true);
      const res = await fetch(`${API_URL}/admin/stations`, { headers });
      const data = await res.json();
      setAllStations(Array.isArray(data) ? data : []);
    } catch { toast.error("Failed to fetch stations"); } finally { setTabLoading(false); }
  };

  const deleteBooking = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this booking? This action is permanent.")) return;
    try {
      const res = await fetch(`${API_URL}/admin/bookings/${id}`, { method: "DELETE", headers });
      if (res.ok) {
        toast.success("Booking deleted successfully");
        fetchAllBookings();
        fetchStats();
      } else {
        toast.error("Failed to delete booking");
      }
    } catch { toast.error("Network error"); }
  };

  const deleteStation = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this station? All its data will be removed.")) return;
    try {
      const res = await fetch(`${API_URL}/admin/stations/${id}`, { method: "DELETE", headers });
      if (res.ok) {
        toast.success("Station deleted successfully");
        fetchAllStations();
        fetchPendingStations();
        fetchStats();
      } else {
        toast.error("Failed to delete station");
      }
    } catch { toast.error("Network error"); }
  };

  const deleteUser = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
      const res = await fetch(`${API_URL}/admin/users/${id}`, { method: "DELETE", headers });
      if (res.ok) {
        toast.success("User deleted successfully");
        fetchUsers();
        fetchStats();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to delete user");
      }
    } catch { toast.error("Network error"); }
  };

  const approveStation = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/stations/${id}/approve`, { method: "PUT", headers });
      if (res.ok) {
        toast.success("Station approved and is now live!");
        fetchStats();
        fetchPendingStations();
        setExpandedStation(null);
      } else {
        toast.error("Failed to approve station");
      }
    } catch { toast.error("Network error"); }
  };

  const rejectStation = async () => {
    if (!rejectingStationId) return;
    
    const finalReasons = [...selectedReasons];
    if (customReason.trim()) finalReasons.push(customReason.trim());
    
    if (finalReasons.length === 0) {
      toast.error("Please select at least one reason for rejection.");
      return;
    }

    setIsRejecting(true);
    try {
      const res = await fetch(`${API_URL}/stations/${rejectingStationId}`, {
        method: "DELETE",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ reasons: finalReasons }),
      });
      if (res.ok) {
        toast.success("Station rejected and owner notified.");
        fetchPendingStations();
        setExpandedStation(null);
        handleCloseRejectModal();
      } else {
        toast.error("Failed to reject station");
      }
    } catch { toast.error("Network error"); }
    finally { setIsRejecting(false); }
  };

  const handleOpenRejectModal = (id: string) => {
    setRejectingStationId(id);
    setSelectedReasons([]);
    setCustomReason("");
    setIsRejectModalOpen(true);
  };

  const handleCloseRejectModal = () => {
    setIsRejectModalOpen(false);
    setRejectingStationId(null);
    setSelectedReasons([]);
    setCustomReason("");
  };

  const toggleReason = (reason: string) => {
    setSelectedReasons(prev => 
      prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
    );
  };

  const stats = [
    { title: "Total Users", value: statsData.totalUsers, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Online Users", value: statsData.onlineUsers, icon: Users, color: "text-green-600", bg: "bg-green-100" },
    { title: "Total Bookings", value: statsData.totalBookings, icon: Calendar, color: "text-orange-600", bg: "bg-orange-100" },
    { title: "Active Stations", value: statsData.totalStations, icon: MapPin, color: "text-purple-600", bg: "bg-purple-100" },
  ];

  const DocViewer = ({ label, data }: { label: string; data?: string }) => {
    if (!data) return (
      <div className="border rounded-lg p-3 text-center text-gray-400 text-sm bg-gray-50">
        <FileText className="h-6 w-6 mx-auto mb-1 opacity-40" />
        {label} — Not Uploaded
      </div>
    );

    const isImage = data.startsWith("data:image");
    const isPdf = data.startsWith("data:application/pdf");

    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 border-b">{label}</div>
        {isImage ? (
          <img
            src={data}
            alt={label}
            className="w-full h-48 object-contain bg-white cursor-pointer transition-transform hover:scale-105"
            onClick={() => setPreviewImage(data)}
          />
        ) : isPdf ? (
          <div className="p-3 text-center bg-white">
            <FileText className="h-10 w-10 text-red-500 mx-auto mb-2" />
            <a
              href={data}
              download={`${label}.pdf`}
              className="text-sm text-blue-600 underline hover:text-blue-800"
            >
              Download PDF
            </a>
          </div>
        ) : (
          <div className="p-3 text-center text-green-600 bg-green-50 flex items-center justify-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm">Document uploaded (preview unavailable)</span>
          </div>
        )}
      </div>
    );
  };

  const StationDetailPanel = ({ station }: { station: any }) => (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mt-2 mb-4 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="flex items-start gap-2">
          <Building2 className="h-4 w-4 text-gray-500 mt-0.5" />
          <div>
            <p className="text-gray-500 text-xs">Station</p>
            <p className="font-medium">{station.stationName}</p>
            <p className="text-gray-600">{station.city}</p>
            <p className="text-gray-500 text-xs mt-1">{station.address}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Users className="h-4 w-4 text-gray-500 mt-0.5" />
          <div>
            <p className="text-gray-500 text-xs">Owner Details</p>
            <p className="font-medium">{station.ownerName || station.owner?.name || "N/A"}</p>
            <p className="text-gray-600 flex items-center gap-1"><Phone className="h-3 w-3" />{station.ownerPhone || "N/A"}</p>
            <p className="text-gray-600 flex items-center gap-1"><Mail className="h-3 w-3" />{station.ownerEmail || "N/A"}</p>
            <p className="text-gray-600 flex items-center gap-1"><Fingerprint className="h-3 w-3" />Aadhaar: {station.aadhaarNumber || "N/A"}</p>
          </div>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1">Pricing & Ports</p>
          <p className="font-medium">₹{station.pricePerHour}/hr</p>
          <p className="text-gray-600">{station.totalPorts} ports</p>
        </div>
      </div>

      {/* Documents */}
      <div>
        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4" /> Submitted Documents
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <DocViewer label="Aadhaar Card" data={station.documents?.aadhaarCard} />
          <DocViewer label="Business Registration" data={station.documents?.businessRegistration} />
          <DocViewer label="Electrical Safety Cert." data={station.documents?.electricalSafety} />
          <DocViewer label="Trade License" data={station.documents?.tradeLicense} />
        </div>
      </div>

      {/* Station Images */}
      {station.images && station.images.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <Eye className="h-4 w-4" /> Station Photos ({station.images.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {station.images.map((img: string, i: number) => (
              <img
                key={i}
                src={img}
                alt={`Station Photo ${i + 1}`}
                className="h-24 w-full object-cover rounded-lg border shadow cursor-pointer transition-transform hover:scale-105"
                onClick={() => setPreviewImage(img)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2 border-t">
        <Button className="bg-green-600 hover:bg-green-700 text-white flex-1" onClick={() => approveStation(station._id)}>
          <CheckCircle className="mr-2 h-4 w-4" /> Approve & Make Live
        </Button>
        <Button variant="destructive" className="flex-1" onClick={() => handleOpenRejectModal(station._id)}>
          <X className="mr-2 h-4 w-4" /> Reject & Remove
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md hidden md:block">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-green-600">Admin Panel</h2>
        </div>
        <nav className="px-4 space-y-2">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "stations", label: "Manage Stations", icon: MapPin },
            { id: "bookings", label: "Bookings", icon: Calendar },
            { id: "users", label: "Users", icon: Users },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === id ? "bg-green-100 text-green-600" : "hover:bg-gray-100"
              }`}
            >
              <Icon className="h-5 w-5" /> {label}
              {id === "stations" && pendingStations.length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {pendingStations.length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="px-4 mt-6">
          <Link to="/"><Button variant="outline" className="w-full">Back to Site</Button></Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {/* ── DASHBOARD TAB ── */}
        {activeTab === "dashboard" && (
          <div>
            <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <Card key={i}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                          <p className="text-3xl font-bold">{stat.value}</p>
                        </div>
                        <div className={`${stat.bg} p-3 rounded-full`}>
                          <Icon className={`h-6 w-6 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {pendingStations.length > 0 && (
              <Card className="border-l-4 border-l-amber-500">
                <CardHeader>
                  <CardTitle className="text-amber-600 flex items-center gap-2">
                    <MapPin className="h-5 w-5" /> {pendingStations.length} Station(s) Pending Approval
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-3">New stations are waiting for your review.</p>
                  <Button size="sm" onClick={() => setActiveTab("stations")} className="bg-amber-500 hover:bg-amber-600">
                    Review Pending Stations
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── STATIONS TAB ── */}
        {activeTab === "stations" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Station Management</h1>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setStationSubTab("pending")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    stationSubTab === "pending" ? "bg-white shadow-sm text-green-600" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Pending ({pendingStations.length})
                </button>
                <button
                  onClick={() => setStationSubTab("active")}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    stationSubTab === "active" ? "bg-white shadow-sm text-green-600" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Active Stations ({allStations.length})
                </button>
              </div>
            </div>

            {stationSubTab === "pending" ? (
              loading ? (
                <p className="text-gray-500 text-center py-12">Loading...</p>
              ) : pendingStations.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <p className="text-gray-500 text-lg">No pending submissions.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {pendingStations.map((station: any) => (
                    <div key={station._id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                      <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-green-100 p-2 rounded-lg">
                            <Building2 className="h-5 w-5 text-green-700" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{station.stationName}</p>
                            <p className="text-sm text-gray-500">{station.city} · {station.totalPorts} ports · ₹{station.pricePerHour}/hr</p>
                            <p className="text-xs text-gray-400">Owner: {station.ownerName || station.owner?.name || "N/A"} · {station.ownerEmail || ""}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteStation(station._id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setExpandedStation(expandedStation === station._id ? null : station._id)}
                          >
                            <Eye className="h-4 w-4 mr-1" /> Details
                          </Button>
                        </div>
                      </div>
                      {expandedStation === station._id && <StationDetailPanel station={station} />}
                    </div>
                  ))}
                </div>
              )
            ) : (
              /* All Active Stations List */
              <Card className="rounded-2xl border-0 shadow-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead>Station Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Booking Rate</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tabLoading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-10">Loading stations...</TableCell></TableRow>
                    ) : allStations.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-10">No stations found.</TableCell></TableRow>
                    ) : (
                      allStations.map((station) => (
                        <TableRow key={station._id}>
                          <TableCell className="font-medium">{station.stationName}</TableCell>
                          <TableCell>{station.city}</TableCell>
                          <TableCell>
                            <div>{station.ownerName || "N/A"}</div>
                            <div className="text-xs text-gray-400">{station.ownerEmail}</div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                              station.isApproved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {station.isApproved ? 'Live' : 'Pending'}
                            </span>
                          </TableCell>
                          <TableCell className="font-bold text-green-600">₹{station.pricePerHour}/hr</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => deleteStation(station._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            )}
          </div>
        )}

        {/* ── BOOKINGS TAB ── */}
        {activeTab === "bookings" && (
          <div>
            <h1 className="text-3xl font-bold mb-6">System Wide Bookings</h1>
            <Card className="rounded-2xl border-0 shadow-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Station</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tabLoading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-10">Loading bookings...</TableCell></TableRow>
                  ) : allBookings.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-10">No bookings found in the system.</TableCell></TableRow>
                  ) : (
                    allBookings.map((booking) => (
                      <TableRow key={booking._id}>
                        <TableCell>
                          <div className="font-medium">{booking.user?.name || 'Guest'}</div>
                          <div className="text-xs text-gray-500">{booking.user?.email}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{booking.station?.stationName || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{booking.station?.city}</div>
                        </TableCell>
                        <TableCell>{new Date(booking.bookingDate).toLocaleDateString()}</TableCell>
                        <TableCell>{booking.startTime} - {booking.endTime}</TableCell>
                        <TableCell className="font-bold text-green-600">₹{booking.totalAmount}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                            booking.bookingStatus === 'completed' ? 'bg-green-100 text-green-700' :
                            booking.bookingStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {booking.bookingStatus}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteBooking(booking._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}

        {/* ── USERS TAB ── */}
        {activeTab === "users" && (
          <div>
            <h1 className="text-3xl font-bold mb-6">User Management</h1>
            <Card className="rounded-2xl border-0 shadow-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>User Info</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tabLoading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-10">Loading users...</TableCell></TableRow>
                  ) : users.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-10">No users found.</TableCell></TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </TableCell>
                        <TableCell>
                           <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                            user.role === 'owner' ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell>{user.phone || 'N/A'}</TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteUser(user._id)}
                            disabled={user.role === 'admin'} // Protect admins from accidental deletion
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}
      </main>

      {/* ── REJECTION REASON MODAL ── */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Reject Charging Station
            </DialogTitle>
            <DialogDescription>
              Select the reasons for rejection. An email will be sent to the owner with these details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            <div className="grid gap-3">
              {REJECTION_REASONS.map((reason) => (
                <div key={reason} className="flex items-start space-x-3 space-y-0">
                  <Checkbox 
                    id={reason} 
                    checked={selectedReasons.includes(reason)}
                    onCheckedChange={() => toggleReason(reason)}
                  />
                  <Label 
                    htmlFor={reason}
                    className="text-sm font-medium leading-none cursor-pointer hover:text-red-700"
                  >
                    {reason}
                  </Label>
                </div>
              ))}
            </div>
            
            <div className="space-y-2 pt-2 border-t">
              <Label htmlFor="custom-reason" className="text-xs font-bold text-gray-500 uppercase">Other / Custom Reason</Label>
              <Textarea 
                id="custom-reason"
                placeholder="Type additional details here..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter className="flex sm:justify-between gap-3">
            <Button variant="outline" onClick={handleCloseRejectModal} disabled={isRejecting}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={rejectStation} 
              disabled={isRejecting || (selectedReasons.length === 0 && !customReason.trim())}
              className="px-8"
            >
              {isRejecting ? "Notifying Owner..." : "Confirm Reject & Send Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── IMAGE PREVIEW MODAL ── */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-5xl w-full flex justify-center" onClick={(e) => e.stopPropagation()}>
            <Button 
              variant="destructive" 
              size="icon" 
              className="absolute -top-12 right-0 md:-right-12 rounded-full shadow-lg"
              onClick={() => setPreviewImage(null)}
            >
              <X className="h-5 w-5" />
            </Button>
            <img 
              src={previewImage} 
              alt="Fullscreen Preview" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" 
            />
          </div>
        </div>
      )}
    </div>
  );
}
