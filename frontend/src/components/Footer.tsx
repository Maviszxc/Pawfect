// components/Footer.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-1"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center">
                <i className="bi bi-paw-fill text-white text-sm"></i>
              </div>
              <span className="text-xl font-bold">Pawfect</span>
            </div>
            <p className="text-gray-400 mb-4 text-sm leading-relaxed">
              Connecting loving pets with their forever homes. Our mission is to
              reduce pet homelessness through adoption, education, and community
              support.
            </p>
            <div className="flex space-x-3">
              <a
                href="#"
                className="h-8 w-8 rounded-full bg-gray-800 hover:bg-orange-500 flex items-center justify-center transition-colors duration-300"
              >
                <i className="bi bi-facebook text-sm"></i>
              </a>
              <a
                href="#"
                className="h-8 w-8 rounded-full bg-gray-800 hover:bg-orange-500 flex items-center justify-center transition-colors duration-300"
              >
                <i className="bi bi-instagram text-sm"></i>
              </a>
              <a
                href="#"
                className="h-8 w-8 rounded-full bg-gray-800 hover:bg-orange-500 flex items-center justify-center transition-colors duration-300"
              >
                <i className="bi bi-twitter text-sm"></i>
              </a>
              <a
                href="#"
                className="h-8 w-8 rounded-full bg-gray-800 hover:bg-orange-500 flex items-center justify-center transition-colors duration-300"
              >
                <i className="bi bi-youtube text-sm"></i>
              </a>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/adoption"
                  className="text-gray-400 hover:text-orange-500 transition-colors duration-300 text-sm"
                >
                  Browse Pets
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-gray-400 hover:text-orange-500 transition-colors duration-300 text-sm"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/shelters"
                  className="text-gray-400 hover:text-orange-500 transition-colors duration-300 text-sm"
                >
                  Partner Shelters
                </Link>
              </li>
              <li>
                <Link
                  href="/success-stories"
                  className="text-gray-400 hover:text-orange-500 transition-colors duration-300 text-sm"
                >
                  Success Stories
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-gray-400 hover:text-orange-500 transition-colors duration-300 text-sm"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/donate"
                  className="text-gray-400 hover:text-orange-500 transition-colors duration-300 text-sm"
                >
                  Donate
                </Link>
              </li>
              <li>
                <Link
                  href="/volunteer"
                  className="text-gray-400 hover:text-orange-500 transition-colors duration-300 text-sm"
                >
                  Volunteer
                </Link>
              </li>
              <li>
                <Link
                  href="/foster"
                  className="text-gray-400 hover:text-orange-500 transition-colors duration-300 text-sm"
                >
                  Foster a Pet
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-400 hover:text-orange-500 transition-colors duration-300 text-sm"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/resources"
                  className="text-gray-400 hover:text-orange-500 transition-colors duration-300 text-sm"
                >
                  Pet Resources
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <i className="bi bi-geo-alt text-orange-500 mt-0.5"></i>
                <div>
                  <p className="text-gray-400 text-sm">
                    123 Pet Adoption Center
                    <br />
                    Metro Manila, Philippines
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <i className="bi bi-telephone text-orange-500"></i>
                <span className="text-gray-400 text-sm">+63 2 1234 5678</span>
              </div>
              <div className="flex items-center gap-3">
                <i className="bi bi-envelope text-orange-500"></i>
                <span className="text-gray-400 text-sm">hello@pawfect.ph</span>
              </div>
              <div className="flex items-center gap-3">
                <i className="bi bi-clock text-orange-500"></i>
                <span className="text-gray-400 text-sm">Mon-Sun: 9AM-6PM</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <span>&copy; {currentYear} Pawfect. All rights reserved.</span>
              <div className="flex space-x-4">
                <Link
                  href="/privacy"
                  className="hover:text-orange-500 transition-colors duration-300"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/terms"
                  className="hover:text-orange-500 transition-colors duration-300"
                >
                  Terms of Service
                </Link>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>Made with</span>
              <i className="bi bi-heart-fill text-orange-500"></i>
              <span>for animals</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
