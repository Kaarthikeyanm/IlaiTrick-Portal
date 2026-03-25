import { useState, useEffect } from "react";
import { Search, MapPin, Zap, Shield, Navigation, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Link } from "react-router";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import axios from "axios";

export function Home() {
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState("");
  const [searching, setSearching] = useState(false);

  const API_URL = "/api";

  const fetchStations = async (city = "") => {
    try {
      setSearching(true);
      const url = city ? `${API_URL}/stations?city=${city}` : `${API_URL}/stations`;
      const response = await axios.get(url);
      setStations(response.data.slice(0, 6)); // Show top 6
    } catch (error) {
      console.error("Error fetching stations:", error);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStations(searchCity);
  };

  const features = [
    {
      icon: Zap,
      title: "Fast Charging",
      description: "High-speed charging stations for quick power-ups",
    },
    {
      icon: Search,
      title: "Easy Booking",
      description: "Find and book charging stations in just a few clicks",
    },
    {
      icon: Shield,
      title: "Secure Payment",
      description: "Safe and encrypted payment processing",
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-green-600 to-emerald-700 text-white">
        <div className="absolute inset-0 opacity-20">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1672542128826-5f0d578713d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpYyUyMHZlaGljbGUlMjBjaGFyZ2luZyUyMHN0YXRpb258ZW58MXx8fHwxNzczOTA2MjA3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Electric vehicle charging"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold mb-6 tracking-tight">
              Power Your Journey <span className="text-green-300">Anywhere</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-green-50/90 font-medium">
              Find, Book, and Charge your EV at the most reliable stations across the country.
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-2 flex flex-col sm:flex-row gap-3 border border-white/20">
              <div className="flex-1 relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-green-300 group-focus-within:text-green-500 transition-colors" />
                <Input
                  placeholder="Enter city (e.g. Chennai)"
                  className="pl-12 h-14 bg-white/90 text-gray-900 border-0 rounded-xl text-lg focus-visible:ring-offset-0 focus-visible:ring-green-400 placeholder:text-gray-400"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={searching} className="bg-green-500 hover:bg-green-400 text-green-900 h-14 px-10 rounded-xl text-lg font-bold shadow-lg shadow-green-900/20 transition-all hover:scale-[1.02] active:scale-95">
                {searching ? <Loader2 className="h-6 w-6 animate-spin" /> : <Search className="h-6 w-6 mr-2" />}
                Search Stations
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Recommended Stations Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4 text-center md:text-left">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Recommended Stations</h2>
              <p className="text-gray-500 mt-2">Top rated charging hubs updated in real-time</p>
            </div>
            <Link to="/stations">
              <Button variant="outline" className="rounded-full px-8 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-all">
                Browse Directory
              </Button>
            </Link>
          </div>

          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {[1, 2, 3].map((i) => (
                 <div key={i} className="h-[400px] bg-gray-200 animate-pulse rounded-3xl"></div>
               ))}
             </div>
          ) : stations.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
               <MapPin className="h-12 w-12 text-gray-200 mx-auto mb-4" />
               <p className="text-gray-500 text-lg">No stations found in "{searchCity}". Try a different city.</p>
               <Button variant="ghost" className="mt-4 text-green-600" onClick={() => { setSearchCity(""); fetchStations(""); }}>Clear Search</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {stations.map((station) => (
                <Card key={station._id} className="group border-0 shadow-md hover:shadow-2xl transition-all duration-300 rounded-[2rem] overflow-hidden bg-white ring-1 ring-gray-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl group-hover:text-green-600 transition-colors uppercase tracking-tight font-black">{station.stationName}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-2 text-gray-500 bg-gray-50 p-3 rounded-2xl border border-gray-100 italic">
                      <MapPin className="h-4 w-4 mt-1 flex-shrink-0 text-green-500" />
                      <span className="text-sm line-clamp-2">{station.address || station.city}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-green-50/50 p-4 rounded-3xl border border-green-100/50">
                        <span className="text-[10px] uppercase font-bold text-green-600 tracking-wider">Ports Free</span>
                        <p className="text-2xl font-black text-green-700">
                          {station.availablePorts}/{station.totalPorts}
                        </p>
                      </div>
                      <div className="bg-blue-50/50 p-4 rounded-3xl border border-blue-100/50">
                        <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Rate</span>
                        <p className="text-xl font-black text-blue-700">₹{station.pricePerHour}<span className="text-xs font-normal">/hr</span></p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-3 px-6 pb-6">
                    <Button 
                      variant="outline" 
                      className="flex-1 rounded-2xl h-12 gap-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition-all font-bold"
                      onClick={() => {
                        const [lng, lat] = station.coordinates.coordinates;
                        window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, "_blank");
                      }}
                    >
                      <Navigation className="h-4 w-4" />
                      Map
                    </Button>
                    <Link to={`/stations/${station._id}`} className="flex-1">
                      <Button className="w-full bg-green-600 hover:bg-green-700 text-white h-12 rounded-2xl shadow-lg shadow-green-900/10 font-bold">
                        Book
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow"
                >
                  <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
