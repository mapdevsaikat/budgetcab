'use client';

import { Car, Clock, Shield, DollarSign, Users, CheckCircle, Phone, Mail, MapPin, Sparkles, ArrowRight, Star, TrendingUp, Award } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AboutPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: Car,
      title: 'Clean Car',
      description: 'Well maintained',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      icon: Clock,
      title: 'On Time',
      description: 'Punctual service',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      icon: Users,
      title: 'Courteous',
      description: 'Professional driver',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      icon: DollarSign,
      title: 'Affordable',
      description: 'For every pocket',
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
    {
      icon: Shield,
      title: 'Secure',
      description: 'Safe rides',
      color: 'from-indigo-500 to-blue-500',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
    },
  ];

  const stats = [
    { number: '24/7', label: 'Available', icon: Clock },
    { number: '1000+', label: 'Happy Customers', icon: Users },
    { number: '50+', label: 'Cities Covered', icon: MapPin },
    { number: '5★', label: 'Rating', icon: Star },
  ];

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 w-full overflow-x-hidden"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        width: '100%',
        maxWidth: '100vw',
      }}
    >
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-budget-brand/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-budget-accent/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-budget-warn/5 rounded-full blur-2xl"></div>
      </div>

      {/* Header Section */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-gradient-to-br from-budget-brand to-budget-accent rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Car className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Budget <span className="text-budget-brand">Cabs</span>
              </span>
            </Link>
            <Link
              href="/booking"
              className="px-4 py-2 bg-gradient-to-r from-budget-brand to-budget-accent text-white rounded-lg hover:shadow-lg transition-all font-medium flex items-center gap-2 group"
            >
              <span>Book Now</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with Animation */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-budget-brand via-[#B91C1C] to-budget-accent"></div>
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        ></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">Your Trusted Travel Partner</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 text-white leading-tight">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Budget Cabs
              </span>
            </h1>
            <p className="text-xl sm:text-2xl lg:text-3xl text-white/90 max-w-3xl mx-auto mb-8 leading-relaxed">
              Premium intercity and local car rental services that make every journey memorable
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/booking"
                className="px-8 py-4 bg-white text-budget-brand rounded-xl font-bold hover:scale-105 transition-transform shadow-2xl text-lg flex items-center justify-center gap-2 group"
              >
                <span>Book Your Ride</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="tel:+918600829292"
                className="px-8 py-4 bg-white/10 backdrop-blur-md text-white border-2 border-white/30 rounded-xl font-bold hover:bg-white/20 transition-all text-lg flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" />
                <span>Call Now</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 -mt-8 sm:-mt-12 mb-8 sm:mb-12 md:mb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className={`bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-5 md:p-6 hover:shadow-xl sm:hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 sm:hover:-translate-y-2 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-budget-brand to-budget-accent rounded-lg sm:rounded-xl flex items-center justify-center">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">{stat.number}</div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Grid - Modern Design */}
      <section className="relative z-10 mb-8 sm:mb-12 md:mb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-8 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4">
              Why Choose <span className="text-budget-brand">Budget Cabs</span>?
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Experience the difference with our premium service features
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className={`group relative bg-white rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg p-3 sm:p-4 md:p-6 hover:shadow-xl sm:hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 sm:hover:-translate-y-2 overflow-hidden ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  {/* Gradient Background on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                  
                  {/* Icon */}
                  <div className={`relative w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 ${feature.bgColor} rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center mb-2 sm:mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-500`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 rounded-lg sm:rounded-xl md:rounded-2xl transition-opacity duration-500`}></div>
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 ${feature.iconColor} relative z-10 group-hover:text-white transition-colors duration-500`} />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 mb-1 sm:mb-2 group-hover:text-budget-brand transition-colors leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base text-gray-600 font-medium leading-tight">{feature.description}</p>
                  
                  {/* Decorative Element */}
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r ${feature.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}></div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* About Content Section */}
      <section className="relative z-10 mb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 overflow-hidden relative">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-budget-brand/10 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-budget-accent/10 to-transparent rounded-full blur-3xl"></div>
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-budget-brand to-budget-accent rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                  About Budget Cabs Service
                </h2>
              </div>
              
              <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
                <p className="text-lg leading-relaxed">
                  Budget Cabs Service is an online cab booking aggregator that provides customer-trusted and premium 
                  intercity and local car hire services. We believe that cab service is one of the most convenient ways 
                  to travel from source to destination, and we're committed to making your journey smooth and enjoyable.
                </p>
                <p className="text-lg leading-relaxed">
                  To make your traveling experience easier, you can book a cab with us on our website, or call us on 
                  <a href="tel:+918600829292" className="text-budget-brand hover:underline font-semibold mx-1">8600829292</a> if 
                  you'd like to discuss your journey with our executives in detail. When you book an outstation cab with us, 
                  our expert drivers will guide you through some of the best experiences, ensuring you have a great road trip 
                  from the time you make a booking to the time you get back home.
                </p>
                <p className="text-lg leading-relaxed">
                  We've got a cab for you at Mumbai, Pune, Nashik, Shirdi, Surat, and many other destinations. Planning a 
                  weekend getaway? Our travel packages will help you explore the best places to eat and drink at, some of the 
                  city's majestic monuments, greenest parks, and oldest temples.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="relative z-10 mb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Our <span className="text-budget-brand">Services</span>
            </h2>
            <p className="text-xl text-gray-600">Comprehensive taxi solutions for all your travel needs</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-xl p-8 sm:p-10 hover:shadow-2xl transition-all duration-500 border border-gray-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-budget-brand to-budget-accent rounded-2xl flex items-center justify-center">
                  <Car className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">Mumbai Nashik Taxi</h3>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4 text-lg">
                We offer you a one-stop solution for every safety requirement with a wide range of vehicle choices 
                from sedan to hatchback, premium cars for all your travel needs. You can book either as a round trip, 
                a one-way trip in advance, or any emergency circumstances book last-minute trips from Mumbai to Nashik 
                or vice versa with Budget Cabs Service.
              </p>
              <p className="text-gray-700 leading-relaxed text-lg">
                Travelling over 150 km to any distance was never easier. Through our reliable and advanced booking 
                platform, we guarantee our customers the best competitive taxi rental experience.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-xl p-8 sm:p-10 hover:shadow-2xl transition-all duration-500 border border-gray-100">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-budget-accent to-budget-brand rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">Mumbai Nashik Cab</h3>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4 text-lg">
                At Budget Cabs Service, we hope our customers have a safe and comfortable ride at a very reasonable price. 
                Our Nashik to Thane cab packages are competitive, and we offer the best possible level of services in Nashik.
              </p>
              <p className="text-gray-700 leading-relaxed text-lg">
                Our USP is our well-maintained and latest range of vehicles, highly competitive taxi rates, and unparalleled 
                service. Our friendly representatives and experienced drivers will leave you fully satisfied.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Service Areas */}
      <section className="relative z-10 mb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12">
            <div className="text-center mb-10">
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                Our <span className="text-budget-brand">Service Areas</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Planning for a great weekend getaway or visiting your family? Get in touch with Budget Cabs Service. 
                We provide cab services for outstation travel at the best travel packages.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
              {[
                'Mumbai', 'Nashik', 'Pune', 'Surat', 'Indore', 'Bhopal', 'Nagpur', 'Kolhapur', 
                'Goa', 'Amravati', 'Akola', 'Aurangabad', 'Dhule', 'Nandurbar', 'Satara', 
                'Sangli', 'Thane', 'Kalyan', 'Dombivali', 'Bangalore', 'Hyderabad', 
                'Navi Mumbai', 'Trimbakeshwar', 'Shirdi', 'Solapur', 'Latur', 'Nanded', 
                'Beed', 'Hubli', 'Ratnagiri', 'Jalgaon', 'Yavatmal', 'Udaipur', 'Ajmer', 
                'Jaipur', 'Delhi', 'Punjab', 'Haryana', 'Kanpur', 'Lucknow', 'Jaunpur', 
                'Patna', 'Raipur'
              ].map((city, index) => (
                <div
                  key={city}
                  className="group flex items-center gap-1.5 sm:gap-2 p-2 sm:p-3 md:p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg sm:rounded-xl hover:from-budget-brand/10 hover:to-budget-accent/10 transition-all duration-300 hover:scale-105 hover:shadow-lg border border-gray-100 hover:border-budget-brand/30 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-budget-brand flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-xs sm:text-sm font-semibold text-gray-700 group-hover:text-budget-brand transition-colors">{city}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 mb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gradient-to-r from-budget-brand via-[#B91C1C] to-budget-accent rounded-3xl shadow-2xl p-12 sm:p-16 text-white text-center overflow-hidden">
            {/* Animated Background */}
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}
            ></div>
            
            <div className="relative z-10">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                Ready to Book Your Ride?
              </h2>
              <p className="text-xl sm:text-2xl mb-8 text-white/90 max-w-2xl mx-auto">
                Experience the difference with Budget Cabs Service. Book now for safe, comfortable, and affordable travel.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/booking"
                  className="px-8 py-4 bg-white text-budget-brand rounded-xl font-bold hover:scale-105 transition-transform shadow-2xl text-lg flex items-center justify-center gap-2 group"
                >
                  <span>Book a Cab Now</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="tel:+918600829292"
                  className="px-8 py-4 bg-white/10 backdrop-blur-md text-white border-2 border-white/30 rounded-xl font-bold hover:bg-white/20 transition-all text-lg flex items-center justify-center gap-2"
                >
                  <Phone className="w-5 h-5" />
                  Call 8600829292
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-bold mb-4">Contact Us</h3>
              <div className="space-y-2">
                <a href="tel:+918600829292" className="flex items-center gap-2 hover:text-budget-warn transition-colors">
                  <Phone className="w-4 h-4" />
                  <span>8600829292</span>
                </a>
                <a href="tel:+917977619481" className="flex items-center gap-2 hover:text-budget-warn transition-colors">
                  <Phone className="w-4 h-4" />
                  <span>7977619481</span>
                </a>
                <a href="mailto:budgetcabsservice@gmail.com" className="flex items-center gap-2 hover:text-budget-warn transition-colors">
                  <Mail className="w-4 h-4" />
                  <span>budgetcabsservice@gmail.com</span>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/" className="block hover:text-budget-warn transition-colors">Home</Link>
                <Link href="/about" className="block hover:text-budget-warn transition-colors">About Us</Link>
                <Link href="/contact" className="block hover:text-budget-warn transition-colors">Contact</Link>
                <Link href="/booking" className="block hover:text-budget-warn transition-colors">Book a Ride</Link>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Opening Hours</h3>
              <p className="text-gray-400 text-lg font-semibold">24x7 Available</p>
              <p className="text-sm text-gray-500 mt-2">We're always here to serve you</p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Budget Cabs Service. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
