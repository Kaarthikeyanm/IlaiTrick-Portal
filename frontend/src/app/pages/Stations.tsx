import { useState, useEffect } from "react";
import { Link } from "react-router";
import { MapPin, Filter } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Slider } from "../components/ui/slider";

export function Stations() {
  const [availablePorts, setAvailablePorts] = useState("");

  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [geoError, setGeoError] = useState("");
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  const API_URL = "/api";

  useEffect(() => {
    // Request user's location on component mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          setGeoError("Please allow location access to find stations within a 10 km radius.");
          setLoading(false);
        }
      );
    } else {
      setGeoError("Geolocation is not supported by your browser.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchStationsNearMe();
    }
  }, [userLocation]);

  const fetchStationsNearMe = async () => {
    if (!userLocation) return;
    try {
      setLoading(true);
      setIsFallback(false);
      let url = `${API_URL}/stations/near?lat=${userLocation.lat}&lng=${userLocation.lng}&distance=10000`; // 10 km radius
      let response = await fetch(url);
      let data = await response.json();
      
      if (response.ok && data.length > 0) {
        setStations(data);
      } else if (response.ok && data.length === 0) {
        // Fallback to fetch next nearest (e.g. 500km radius)
        url = `${API_URL}/stations/near?lat=${userLocation.lat}&lng=${userLocation.lng}&distance=500000`;
        response = await fetch(url);
        data = await response.json();
        setIsFallback(true);
        setStations(data);
      } else {
        setStations([]);
      }
    } catch (error) {
      console.error("Error fetching nearby stations:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Find Charging Stations</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Coverage Radius</Label>
                  <div className="pt-2 text-sm text-gray-600 font-medium bg-green-50 p-3 rounded border border-green-200">
                    <MapPin className="h-4 w-4 inline mr-1 -mt-0.5 text-green-600" />
                    Nearest Stations
                  </div>
                </div>


                <div className="space-y-2">
                  <Label htmlFor="available-ports">Available Ports</Label>
                  <Select value={availablePorts} onValueChange={setAvailablePorts}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="1+">1+</SelectItem>
                      <SelectItem value="3+">3+</SelectItem>
                      <SelectItem value="5+">5+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Apply Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Stations Grid */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loading ? (
                <div className="col-span-2 text-center py-12 flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-4"></div>
                  <p className="text-gray-600">Detecting your location & finding nearby stations...</p>
                </div>
              ) : geoError ? (
                <div className="col-span-2 text-center py-12 border rounded-lg bg-red-50">
                  <p className="text-red-600 font-medium mb-2">{geoError}</p>
                  <p className="text-sm text-gray-500">Enable location services in your browser settings and refresh the page.</p>
                </div>
              ) : stations.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-gray-500 bg-white shadow-sm border rounded-lg">
                  <MapPin className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                  <p>No available charging stations found anywhere near your location.</p>
                </div>
              ) : (
                <>
                  {isFallback && (
                    <div className="col-span-full bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg mb-2 flex items-center justify-between">
                      <p className="text-sm font-medium">No stations were found within 10 km. Showing the next nearest stations.</p>
                      <MapPin className="h-5 w-5 text-amber-500 opacity-50" />
                    </div>
                  )}
                  {stations.map((station: any) => (
                    <Card key={station._id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle>{station.stationName}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-2 text-gray-600">
                        <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <span>{station.address || station.city}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-500">Available Ports:</span>
                          <p className="text-lg font-semibold text-green-600">
                            {station.availablePorts}/{station.totalPorts}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Price:</span>
                          <p className="text-lg font-semibold">${station.pricePerHour}/hour</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                       <Button 
                        variant="outline" 
                        className="flex-1 gap-2 border-green-600 text-green-600 hover:bg-green-50"
                        onClick={() => {
                          const [lng, lat] = station.coordinates.coordinates;
                          window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, "_blank");
                        }}
                      >
                        <MapPin className="h-4 w-4" />
                        View on Map
                      </Button>
                      <Link to={`/stations/${station._id}`} className="flex-1">
                        <Button className="w-full bg-green-600 hover:bg-green-700">
                          View Details
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
