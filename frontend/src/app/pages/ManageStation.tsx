import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ArrowLeft, Clock, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export function ManageStation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [stationName, setStationName] = useState("");
  
  const [formData, setFormData] = useState({
    workingDate: new Date().toISOString().split("T")[0],
    openingTime: "09:00",
    closingTime: "18:00",
  });

  const API_URL = "/api";

  useEffect(() => {
    fetchStation();
  }, [id]);

  const fetchStation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/stations/${id}`);
      if (response.ok) {
        const data = await response.json();
        setStationName(data.stationName);
        setFormData({
          workingDate: data.workingDate || new Date().toISOString().split("T")[0],
          openingTime: data.openingTime || "09:00",
          closingTime: data.closingTime || "18:00",
        });
      } else {
        toast.error("Failed to load station details");
        navigate("/owner");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/stations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workingDate: formData.workingDate,
          openingTime: formData.openingTime,
          closingTime: formData.closingTime,
        }),
      });

      if (response.ok) {
        toast.success("Time slots updated successfully!");
        navigate("/owner");
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to update station");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center mb-8 gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/owner")}
          className="text-gray-600 hover:text-green-700 bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 mr-2" /> Back
        </Button>
        <h1 className="text-3xl font-bold">Manage Station</h1>
      </div>

      <Card className="shadow-lg border-t-4 border-t-green-500">
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="text-xl flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-700" /> 
            Time Slots for {stationName}
          </CardTitle>
          <p className="text-sm text-gray-500 font-normal mt-1">
            Set the operational hours for this charging station. Users will only be able to book slots within these timings.
          </p>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="space-y-3">
                <Label htmlFor="workingDate" className="text-base font-medium">Operational Date</Label>
                <div className="relative">
                  <Input 
                    id="workingDate" 
                    type="date" 
                    value={formData.workingDate} 
                    onChange={handleInputChange} 
                    required 
                    min={new Date().toISOString().split("T")[0]}
                    className="p-3 text-lg border-gray-300 rounded shadow-sm focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="openingTime" className="text-base font-medium">Opening Time</Label>
                <div className="relative">
                  <Input 
                    id="openingTime" 
                    type="time" 
                    value={formData.openingTime} 
                    onChange={handleInputChange} 
                    required 
                    className="p-3 text-lg border-gray-300 rounded shadow-sm focus:ring-green-500"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="closingTime" className="text-base font-medium">Closing Time</Label>
                <div className="relative">
                  <Input 
                    id="closingTime" 
                    type="time" 
                    value={formData.closingTime} 
                    onChange={handleInputChange} 
                    required 
                    className="p-3 text-lg border-gray-300 rounded shadow-sm focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t mt-8">
              <Button type="button" variant="outline" onClick={() => navigate("/owner")} className="px-6">
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-green-600 hover:bg-green-700 text-white px-8 flex items-center gap-2 shadow"
                disabled={submitting}
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="h-4 w-4" /> Save Changes</>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
