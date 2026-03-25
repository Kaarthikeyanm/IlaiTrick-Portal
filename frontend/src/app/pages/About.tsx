import { Zap, Smartphone, Users, Target, Heart } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";

export function About() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-green-50 to-white py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center justify-center p-3 bg-green-100 rounded-2xl mb-6">
            <Zap className="h-10 w-10 text-green-600 fill-green-600" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
            Our Mission to <span className="text-green-600">Power</span> the Future
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            Simplifying the electric vehicle experience through innovative technology and seamless charging solutions.
          </p>
        </div>
      </section>

      {/* Why We Started */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-bold uppercase tracking-wider">
                Our Origin
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Why was this created?</h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                As the world shifts toward sustainable energy, the lack of reliable charging infrastructure remains a significant barrier for EV owners. 
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                We created this platform to bridge the gap between station owners and EV users, providing a real-time, trustworthy network that makes "range anxiety" a thing of the past. Our goal is to make charging as easy as booking a movie ticket.
              </p>
            </div>
            <div className="bg-green-600 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
                <Target className="absolute -bottom-10 -right-10 w-40 h-40 opacity-10" />
                <h3 className="text-2xl font-bold mb-4">The Vision</h3>
                <p className="text-green-50 mb-6 italic text-lg">
                  "To build a world where every electric vehicle journey is powered by seamless connectivity and community-driven infrastructure."
                </p>
                <div className="h-1 w-20 bg-green-400 rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Future Roadmap */}
      <section className="py-20 bg-gray-50 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">The Road Ahead</h2>
            <div className="h-1.5 w-24 bg-green-500 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg rounded-3xl overflow-hidden hover:translate-y-[-8px] transition-transform duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Smartphone className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Mobile Apps</h3>
                <p className="text-gray-600">We are currently developing dedicated iOS and Android applications for faster, on-the-go charging access.</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg rounded-3xl overflow-hidden hover:translate-y-[-8px] transition-transform duration-300">
              <CardContent className="p-8 text-center text-white bg-green-600">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">Smart AI</h3>
                <p className="text-green-50 font-medium">Coming soon: AI-powered route planning that suggests charging stops based on your car's battery life.</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg rounded-3xl overflow-hidden hover:translate-y-[-8px] transition-transform duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold mb-3">Community Hub</h3>
                <p className="text-gray-600">Building a global community where users can share reviews and station owners can grow their business.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Meet the Founders</h2>
            <p className="text-gray-500">The team dedicated to revolutionizing the EV industry.</p>
          </div>

          <div className="flex justify-center">
            {/* Founder 1 */}
            <div className="text-center group">
              <div className="w-48 h-48 bg-gray-100 rounded-[2.5rem] mx-auto mb-6 flex items-center justify-center group-hover:bg-green-100 transition-colors duration-500 border-4 border-white shadow-xl overflow-hidden">
                <div className="text-green-600 font-black text-6xl uppercase opacity-20 group-hover:opacity-100 transition-opacity">V R</div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Vishal Rajinikanth</h3>
              <p className="text-green-600 font-bold uppercase tracking-widest text-sm mt-1">Founder & Developer</p>
              <p className="mt-4 text-gray-500 italic max-w-xs mx-auto">
                "Driven by a passion for technology and sustainability."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-20 px-4 bg-green-900 text-white text-center">
        <div className="container mx-auto max-w-3xl">
          <Heart className="h-12 w-12 text-red-400 fill-red-400 mx-auto mb-6 animate-pulse" />
          <h2 className="text-3xl font-bold mb-6 italic">Join us on this journey.</h2>
          <p className="text-green-100/70 mb-10 text-lg">We're just getting started. Let's make EV charging accessible for everyone, everywhere.</p>
          <div className="flex flex-wrap justify-center gap-4">
             <Link to="/register">
                <Button className="bg-white text-green-900 hover:bg-green-50 px-8 py-6 rounded-2xl text-lg font-bold">Get Started</Button>
             </Link>
             <Link to="/stations">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 py-6 rounded-2xl text-lg font-bold">Find Stations</Button>
             </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// Ensure Link is imported
import { Link } from "react-router";
