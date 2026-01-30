import type { Metadata } from 'next';
import { Car, Phone, Mail, Clock, MapPin, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact Us | Budget Cabs Service Nashik - 24/7 Customer Support',
  description: 'Contact Budget Cabs Service for taxi bookings in Nashik, Mumbai, Pune. Call 98606 89292‬, email info@budgetcabsservices.com. Available 24/7 for your travel needs.',
  keywords: [
    'Budget Cabs Service contact',
    'Nashik taxi contact number',
    'Mumbai Nashik cab booking',
    'taxi service contact Nashik',
    'Budget Cabs phone number',
    '24/7 taxi service contact',
    'Nashik cab booking contact'
  ],
  openGraph: {
    title: 'Contact Budget Cabs Service - 24/7 Customer Support',
    description: 'Get in touch with Budget Cabs Service for taxi bookings. Call 98606 89292‬ or email info@budgetcabsservices.com. Available 24/7.',
    type: 'website',
  },
};

export default function ContactPage() {
  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 w-full"
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
      }}
    >
      {/* Header Section */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-budget-brand to-budget-accent rounded-lg flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Budget <span className="text-budget-brand">Cabs</span>
              </span>
            </Link>
            <Link
              href="/booking"
              className="px-4 py-2 bg-budget-brand text-white rounded-lg hover:bg-budget-brand/90 transition-colors font-medium"
            >
              Book Now
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-budget-brand via-[#B91C1C] to-budget-accent text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Contact Us
            </h1>
            <p className="text-xl sm:text-2xl text-white/90 max-w-2xl mx-auto">
              We're here to help you 24/7. Get in touch with us for bookings, inquiries, or support.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Phone Number 1 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-budget-brand/10 rounded-xl flex items-center justify-center mb-6">
              <Phone className="w-8 h-8 text-budget-brand" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Call Us</h3>
            <a
              href="tel:+9198606 89292‬"
              className="text-2xl font-bold text-budget-brand hover:text-budget-brand/80 transition-colors block mb-2"
            >
              98606 89292‬
            </a>
            <p className="text-gray-600 text-sm">Tap to call directly</p>
          </div>

          {/* Email */}
          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-budget-warn/10 rounded-xl flex items-center justify-center mb-6">
              <Mail className="w-8 h-8 text-budget-warn" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Email Us</h3>
            <a
              href="mailto:info@budgetcabsservices.com"
              className="text-lg font-semibold text-budget-warn hover:text-budget-warn/80 transition-colors block mb-2 break-all"
            >
              info@budgetcabsservices.com
            </a>
            <p className="text-gray-600 text-sm">Send us an email</p>
          </div>
        </div>

        {/* Opening Hours */}
        <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-10 mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-budget-brand to-budget-accent rounded-xl flex items-center justify-center">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Opening Hours</h2>
              <p className="text-gray-600 mt-1">We're always available for you</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-budget-brand/5 to-budget-accent/5 rounded-xl p-6 border-2 border-budget-brand/20">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">24x7 Available</span>
              <span className="text-2xl font-bold text-budget-brand">24/7</span>
            </div>
            <p className="text-gray-600 mt-2">Round the clock service for all your travel needs</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          <a
            href="https://wa.me/9198606 89292‬?text=Hi%20Budget%20Cabs%20Service,%20I%20want%20to%20book%20a%20ride"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 hover:bg-green-600 text-white rounded-xl p-6 flex items-center gap-4 transition-colors shadow-lg hover:shadow-xl"
          >
            <MessageCircle className="w-8 h-8 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-lg">WhatsApp Us</h3>
              <p className="text-sm text-white/90">Quick booking via WhatsApp</p>
            </div>
          </a>
          <Link
            href="/booking"
            className="bg-budget-brand hover:bg-budget-brand/90 text-white rounded-xl p-6 flex items-center gap-4 transition-colors shadow-lg hover:shadow-xl"
          >
            <Car className="w-8 h-8 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-lg">Book Online</h3>
              <p className="text-sm text-white/90">Book a ride instantly</p>
            </div>
          </Link>
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Why Contact Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-budget-brand/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-budget-brand" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Instant Booking</h3>
                <p className="text-gray-600">
                  Call us anytime for immediate booking assistance. Our team is ready to help you book your ride.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-budget-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-budget-accent" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">24/7 Support</h3>
                <p className="text-gray-600">
                  We're available round the clock. Whether it's early morning or late night, we're here for you.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-budget-warn/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-6 h-6 text-budget-warn" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Quick Response</h3>
                <p className="text-gray-600">
                  Get quick responses to your queries via phone, WhatsApp, or email. We value your time.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-budget-brand/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Car className="w-6 h-6 text-budget-brand" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Custom Bookings</h3>
                <p className="text-gray-600">
                  Need special arrangements? Contact us for custom travel packages and special requirements.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">Contact Us</h3>
              <div className="space-y-2">
                <a href="tel:+9198606 89292‬" className="flex items-center gap-2 hover:text-budget-warn transition-colors">
                  <Phone className="w-4 h-4" />
                  <span>98606 89292‬</span>
                </a>
                <a href="mailto:info@budgetcabsservices.com" className="flex items-center gap-2 hover:text-budget-warn transition-colors">
                  <Mail className="w-4 h-4" />
                  <span>info@budgetcabsservices.com</span>
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
              <p className="text-gray-400">24x7 Available</p>
              <p className="text-sm text-gray-500 mt-2">We're always here to serve you</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Budget Cabs Service. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
