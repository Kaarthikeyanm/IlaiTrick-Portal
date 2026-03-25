import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  MapPin, Loader2, ArrowLeft, User, FileText, Camera, CheckCircle2,
  Upload, X, Info, ShieldCheck, Mail, Phone, Fingerprint, Building2, Zap, DollarSign
} from "lucide-react";
import { toast } from "sonner";

const TN_CITIES = [
  "Ambur", "Ariyalur", "Aruppukkottai", "Chennai", "Chidambaram",
  "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode",
  "Gudiyatham", "Hosur", "Kanchipuram", "Karaikudi", "Karur",
  "Kumbakonam", "Kumarapalayam", "Krishnagiri", "Madurai", "Mayiladuthurai",
  "Nagapattinam", "Nagercoil", "Namakkal", "Neyveli", "Ooty (Udhagamandalam)",
  "Palani", "Perambalur", "Pollachi", "Pudukkottai", "Rajapalayam",
  "Ranipet", "Salem", "Sivagangai", "Sivakasi", "Thanjavur",
  "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tiruppur",
  "Tiruvannamalai", "Tiruvottiyur", "Vaniyambadi", "Vellore", "Viluppuram",
  "Virudhunagar"
];

// Convert a File to a base64 data URL string
const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export function AddStation() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const [formData, setFormData] = useState({
    stationName: "",
    city: "",
    address: "",
    pricePerHour: "",
    totalPorts: "",
    lat: "0",
    lng: "0",
    ownerName: "",
    ownerPhone: "",
    ownerEmail: "",
    aadhaarNumber: "",
  });

  // Stores { preview: string (blob URL), base64: string, name: string }
  type DocState = { preview: string; base64: string; name: string } | null;

  const [documents, setDocuments] = useState<{
    aadhaarCard: DocState;
    businessRegistration: DocState;
    electricalSafety: DocState;
    tradeLicense: DocState;
  }>({
    aadhaarCard: null,
    businessRegistration: null,
    electricalSafety: null,
    tradeLicense: null,
  });

  const [stationImages, setStationImages] = useState<string[]>([]); // base64

  const fileInputRefs = {
    aadhaar: useRef<HTMLInputElement>(null),
    business: useRef<HTMLInputElement>(null),
    safety: useRef<HTMLInputElement>(null),
    trade: useRef<HTMLInputElement>(null),
    images: useRef<HTMLInputElement>(null),
  };

  const API_URL = "/api";

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    key: keyof typeof documents
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }
    try {
      const base64 = await fileToBase64(file);
      const preview = URL.createObjectURL(file);
      setDocuments(prev => ({ ...prev, [key]: { preview, base64, name: file.name } }));
      toast.success(`${file.name} uploaded successfully`);
    } catch {
      toast.error("Failed to read file");
    }
  };

  const handleStationImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (stationImages.length + files.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }
    try {
      const base64List = await Promise.all(files.map(fileToBase64));
      setStationImages(prev => [...prev, ...base64List]);
    } catch {
      toast.error("Failed to read image(s)");
    }
  };

  const removeImage = (index: number) => {
    setStationImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateAadhaar = (val: string) => /^\d{12}$/.test(val);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.city) { toast.error("Please select a city"); return; }
    if (!validateAadhaar(formData.aadhaarNumber)) {
      toast.error("Aadhaar Number must be exactly 12 digits");
      return;
    }
    if (!agreed) { toast.error("Please check the confirmation agreement"); return; }

    const token = localStorage.getItem("token");
    if (!token) { toast.error("You are not logged in. Please log in as an owner."); return; }

    setSubmitting(true);
    try {
      const payload = {
        stationName: formData.stationName,
        city: formData.city,
        address: formData.address,
        locationName: formData.stationName,
        pricePerHour: Number(formData.pricePerHour),
        totalPorts: Number(formData.totalPorts),
        lat: Number(formData.lat),
        lng: Number(formData.lng),
        ownerName: formData.ownerName,
        ownerPhone: formData.ownerPhone,
        ownerEmail: formData.ownerEmail,
        aadhaarNumber: formData.aadhaarNumber,
        documents: {
          aadhaarCard: documents.aadhaarCard?.base64 || "",
          businessRegistration: documents.businessRegistration?.base64 || "",
          electricalSafety: documents.electricalSafety?.base64 || "",
          tradeLicense: documents.tradeLicense?.base64 || "",
        },
        images: stationImages, // base64 strings
      };

      const response = await fetch(`${API_URL}/stations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Station submitted for admin approval! You will be notified once it goes live.");
        navigate("/owner");
      } else {
        toast.error(data.message || "Failed to submit station. Please try again.");
      }
    } catch {
      toast.error("Network error. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    
    toast.info("Detecting your location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6)
        }));
        toast.success("Location detected successfully!");
      },
      (error) => {
        toast.error("Failed to detect location. Please enable location permissions.");
      }
    );
  };

  const SectionTitle = ({
    icon: Icon,
    title,
    desc,
  }: {
    icon: React.ElementType;
    title: string;
    desc: string;
  }) => (
    <div className="mb-6 border-b pb-4">
      <div className="flex items-center gap-3 mb-1">
        <div className="bg-green-100 p-2 rounded-lg">
          <Icon className="h-5 w-5 text-green-700" />
        </div>
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
      </div>
      <p className="text-gray-500 text-sm ml-11">{desc}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate("/owner")}
            className="text-gray-600 hover:text-green-700 hover:bg-green-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-full border border-amber-100">
            <Info className="h-4 w-4 flex-shrink-0" />
            <span>Your station will be reviewed by admin before going live.</span>
          </div>
        </div>

        <Card className="shadow-2xl border-0 overflow-hidden">
          <div className="bg-green-700 py-8 px-8 text-white">
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              <Building2 className="h-8 w-8" /> Add Your Charging Station
            </h1>
            <p className="mt-2 text-green-100 opacity-90">
              Partner with us to expand the EV network and grow your earnings.
            </p>
          </div>

          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-12">

              {/* ── SECTION 1: BASIC DETAILS ── */}
              <section>
                <SectionTitle icon={Zap} title="Basic Station Details" desc="Tell us about the location and capacity of your charging point." />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="stationName">Station Name *</Label>
                    <Input id="stationName" value={formData.stationName} onChange={handleInputChange} placeholder="e.g. Skyline EV Hub" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City (Tamil Nadu) *</Label>
                    <select
                      id="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">— Select a City —</option>
                      {TN_CITIES.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="address">Full Address *</Label>
                    <Textarea id="address" value={formData.address} onChange={handleInputChange} placeholder="Door no., Street, Area, Landmark..." className="min-h-[100px]" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pricePerHour" className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" /> Price per Hour (₹) *
                    </Label>
                    <Input id="pricePerHour" type="number" min="0" step="0.01" value={formData.pricePerHour} onChange={handleInputChange} placeholder="e.g. 50" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="totalPorts">Total Charging Ports *</Label>
                    <Input id="totalPorts" type="number" min="1" value={formData.totalPorts} onChange={handleInputChange} placeholder="e.g. 4" required />
                  </div>
                </div>
              </section>

              {/* ── SECTION 2: OWNER DETAILS ── */}
              <section>
                <SectionTitle icon={User} title="Owner Verification" desc="We need these details to verify ownership and process payments." />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="ownerName">Owner Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input id="ownerName" className="pl-10" value={formData.ownerName} onChange={handleInputChange} placeholder="As per Aadhaar card" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerPhone">Phone Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input id="ownerPhone" className="pl-10" value={formData.ownerPhone} onChange={handleInputChange} placeholder="+91 XXXXX XXXXX" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerEmail">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input id="ownerEmail" type="email" className="pl-10" value={formData.ownerEmail} onChange={handleInputChange} placeholder="owner@example.com" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aadhaarNumber">Aadhaar Number (12 Digits) *</Label>
                    <div className="relative">
                      <Fingerprint className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input id="aadhaarNumber" maxLength={12} className="pl-10 font-mono tracking-widest" value={formData.aadhaarNumber} onChange={handleInputChange} placeholder="XXXXXXXXXXXX" required />
                    </div>
                    {formData.aadhaarNumber && formData.aadhaarNumber.length !== 12 && (
                      <p className="text-xs text-red-500">Must be exactly 12 digits</p>
                    )}
                  </div>
                </div>
              </section>

              {/* ── SECTION 3: DOCUMENT UPLOAD ── */}
              <section>
                <SectionTitle icon={FileText} title="Document Upload" desc="Upload clear images or PDFs. Files are securely stored and only visible to admins." />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Aadhaar Card */}
                  <div className="border-2 border-dashed rounded-xl p-5 text-center hover:border-green-500 transition-colors">
                    <p className="text-sm font-semibold mb-3">Aadhaar Card</p>
                    {documents.aadhaarCard ? (
                      <div className="space-y-2">
                        {documents.aadhaarCard.base64.startsWith("data:image") ? (
                          <img src={documents.aadhaarCard.preview} className="h-28 w-full object-cover rounded shadow" alt="Aadhaar Preview" />
                        ) : (
                          <div className="flex items-center justify-center gap-2 text-blue-600 bg-blue-50 py-4 rounded">
                            <FileText className="h-5 w-5" />
                            <span className="text-xs truncate max-w-[140px]">{documents.aadhaarCard.name}</span>
                          </div>
                        )}
                        <button type="button" onClick={() => setDocuments(p => ({ ...p, aadhaarCard: null }))} className="text-red-500 text-xs flex items-center gap-1 mx-auto">
                          <X className="h-3 w-3" /> Remove
                        </button>
                      </div>
                    ) : (
                      <div onClick={() => fileInputRefs.aadhaar.current?.click()} className="cursor-pointer py-4">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <span className="text-xs text-gray-500">Click to upload image / PDF</span>
                        <input type="file" ref={fileInputRefs.aadhaar} onChange={e => handleFileUpload(e, "aadhaarCard")} className="hidden" accept="image/*,.pdf" />
                      </div>
                    )}
                  </div>

                  {/* Business Registration */}
                  <div className="border-2 border-dashed rounded-xl p-5 text-center hover:border-green-500 transition-colors">
                    <p className="text-sm font-semibold mb-3">Business Registration Certificate</p>
                    {documents.businessRegistration ? (
                      <div className="space-y-2">
                        {documents.businessRegistration.base64.startsWith("data:image") ? (
                          <img src={documents.businessRegistration.preview} className="h-28 w-full object-cover rounded shadow" alt="Business Reg Preview" />
                        ) : (
                          <div className="flex items-center justify-center gap-2 text-blue-600 bg-blue-50 py-4 rounded">
                            <FileText className="h-5 w-5" />
                            <span className="text-xs truncate max-w-[140px]">{documents.businessRegistration.name}</span>
                          </div>
                        )}
                        <button type="button" onClick={() => setDocuments(p => ({ ...p, businessRegistration: null }))} className="text-red-500 text-xs flex items-center gap-1 mx-auto">
                          <X className="h-3 w-3" /> Remove
                        </button>
                      </div>
                    ) : (
                      <div onClick={() => fileInputRefs.business.current?.click()} className="cursor-pointer py-4">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <span className="text-xs text-gray-500">Upload PDF / Image</span>
                        <input type="file" ref={fileInputRefs.business} onChange={e => handleFileUpload(e, "businessRegistration")} className="hidden" accept="image/*,.pdf" />
                      </div>
                    )}
                  </div>

                  {/* Electrical Safety */}
                  <div className="border-2 border-dashed rounded-xl p-5 text-center hover:border-green-500 transition-colors">
                    <p className="text-sm font-semibold mb-3">Electrical Safety Certificate</p>
                    {documents.electricalSafety ? (
                      <div className="space-y-2">
                        {documents.electricalSafety.base64.startsWith("data:image") ? (
                          <img src={documents.electricalSafety.preview} className="h-28 w-full object-cover rounded shadow" alt="Safety Cert Preview" />
                        ) : (
                          <div className="flex items-center justify-center gap-2 text-blue-600 bg-blue-50 py-4 rounded">
                            <FileText className="h-5 w-5" />
                            <span className="text-xs truncate max-w-[140px]">{documents.electricalSafety.name}</span>
                          </div>
                        )}
                        <button type="button" onClick={() => setDocuments(p => ({ ...p, electricalSafety: null }))} className="text-red-500 text-xs flex items-center gap-1 mx-auto">
                          <X className="h-3 w-3" /> Remove
                        </button>
                      </div>
                    ) : (
                      <div onClick={() => fileInputRefs.safety.current?.click()} className="cursor-pointer py-4">
                        <ShieldCheck className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <span className="text-xs text-gray-500">Upload Certificate</span>
                        <input type="file" ref={fileInputRefs.safety} onChange={e => handleFileUpload(e, "electricalSafety")} className="hidden" accept="image/*,.pdf" />
                      </div>
                    )}
                  </div>

                  {/* Trade License (Optional) */}
                  <div className="border-2 border-dashed rounded-xl p-5 text-center hover:border-green-500 transition-colors opacity-80">
                    <p className="text-sm font-semibold mb-1">Trade License</p>
                    <p className="text-xs text-gray-400 mb-3">(Optional)</p>
                    {documents.tradeLicense ? (
                      <div className="space-y-2">
                        {documents.tradeLicense.base64.startsWith("data:image") ? (
                          <img src={documents.tradeLicense.preview} className="h-28 w-full object-cover rounded shadow" alt="Trade License Preview" />
                        ) : (
                          <div className="flex items-center justify-center gap-2 text-blue-600 bg-blue-50 py-4 rounded">
                            <FileText className="h-5 w-5" />
                            <span className="text-xs truncate max-w-[140px]">{documents.tradeLicense.name}</span>
                          </div>
                        )}
                        <button type="button" onClick={() => setDocuments(p => ({ ...p, tradeLicense: null }))} className="text-red-500 text-xs flex items-center gap-1 mx-auto">
                          <X className="h-3 w-3" /> Remove
                        </button>
                      </div>
                    ) : (
                      <div onClick={() => fileInputRefs.trade.current?.click()} className="cursor-pointer py-4">
                        <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <span className="text-xs text-gray-500">Upload PDF / Image</span>
                        <input type="file" ref={fileInputRefs.trade} onChange={e => handleFileUpload(e, "tradeLicense")} className="hidden" accept="image/*,.pdf" />
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* ── SECTION 4: STATION IMAGES ── */}
              <section>
                <SectionTitle icon={Camera} title="Station Images" desc="Upload up to 5 clear photos of your charging station. Photos help users find your station." />
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                  {stationImages.map((src, index) => (
                    <div key={index} className="relative group">
                      <img src={src} className="h-24 w-full object-cover rounded-lg border shadow-sm" alt={`Station Photo ${index + 1}`} />
                      <button type="button" onClick={() => removeImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {stationImages.length < 5 && (
                    <div
                      onClick={() => fileInputRefs.images.current?.click()}
                      className="h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-green-500 transition-colors"
                    >
                      <Camera className="h-6 w-6 text-gray-400" />
                      <span className="text-[10px] text-gray-500 mt-1">Add Photo</span>
                      <input type="file" ref={fileInputRefs.images} multiple onChange={handleStationImagesUpload} className="hidden" accept="image/*" />
                    </div>
                  )}
                </div>
              </section>

              {/* ── SECTION 5: LOCATION ── */}
              <section>
                <SectionTitle icon={MapPin} title="Precise Location" desc="Provide GPS coordinates for accurate map placement." />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-100 p-6 rounded-xl">
                  <div className="md:col-span-2 flex justify-end">
                    <Button 
                      type="button" 
                      onClick={handleDetectLocation} 
                      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                    >
                      <MapPin className="h-4 w-4" /> Detect My Current Location
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lat">Latitude *</Label>
                    <Input id="lat" value={formData.lat} onChange={handleInputChange} placeholder="e.g. 13.0827" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lng">Longitude *</Label>
                    <Input id="lng" value={formData.lng} onChange={handleInputChange} placeholder="e.g. 80.2707" required />
                  </div>
                  <p className="md:col-span-2 text-xs text-gray-400 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Alternatively, right-click your location on Google Maps to copy coordinates manually.
                  </p>
                </div>
              </section>

              {/* ── SECTION 6: AGREEMENT & SUBMIT ── */}
              <section className="pt-6 border-t">
                <div
                  className={`flex items-start gap-4 p-4 rounded-xl border mb-8 cursor-pointer transition-colors ${agreed ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}
                  onClick={() => setAgreed(!agreed)}
                >
                  <CheckCircle2 className={`h-6 w-6 mt-0.5 flex-shrink-0 transition-colors ${agreed ? "text-green-600" : "text-gray-300"}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Confirmation & Agreement</p>
                    <p className="text-sm text-gray-600 mt-1">
                      I confirm that all details and documents provided are genuine and accurate. I authorize the team to verify my documents for station approval. False information may result in permanent account suspension.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <Button
                    type="submit"
                    className="w-full md:w-2/3 bg-green-700 hover:bg-green-800 text-white font-bold py-4 text-lg shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={submitting || !agreed}
                  >
                    {submitting ? (
                      <span className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Submitting for Admin Approval...
                      </span>
                    ) : (
                      "Register & Submit for Admin Approval"
                    )}
                  </Button>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4" /> Secure Submission · Admin review within 24–48 hours
                  </p>
                </div>
              </section>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
