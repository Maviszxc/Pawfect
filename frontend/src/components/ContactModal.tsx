import { motion } from "framer-motion";
import { Button } from "@/components/ui/dynamic-button";
import { useState } from "react";
import axios from "axios";
import { BASE_URL } from "@/utils/constants";
import { toast } from "react-toastify";

interface ContactModalProps {
  showContactModal: boolean;
  setShowContactModal: (show: boolean) => void;
}

const ContactModal = ({
  showContactModal,
  setShowContactModal,
}: ContactModalProps) => {
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    contactMethod: "email",
    receiveUpdates: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setContactForm((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setContactForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await axios.post(`${BASE_URL}/api/contact`, {
        name: contactForm.name,
        email: contactForm.email,
        phone: contactForm.phone,
        subject: contactForm.subject,
        message: contactForm.message,
        contactMethod: contactForm.contactMethod,
        receiveUpdates: contactForm.receiveUpdates,
      });

      if (response.data.success) {
        toast.success(response.data.message || "Thank you for your message! We'll get back to you soon.");
        
        // Reset form and close modal on success
        setContactForm({
          name: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
          contactMethod: "email",
          receiveUpdates: false,
        });

        setShowContactModal(false);
      } else {
        toast.error(response.data.message || "Failed to send message");
      }
    } catch (error: any) {
      console.error("Error submitting contact form:", error);
      toast.error(
        error.response?.data?.message || "There was an error sending your message. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showContactModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 pt-28">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-6xl mx-auto h-[80vh] flex flex-col landscape:flex-row overflow-hidden"
      >
        {/* Left Panel - Contact Information & Support */}
        <div className="landscape:w-2/5 bg-gradient-to-br from-orange-50 to-orange-100 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  We're Here to Help
                </h3>
                <p className="text-gray-600 mt-2">
                  Have questions about adoption, volunteering, or partnerships?
                  We'd love to hear from you.
                </p>
              </div>

              {/* Contact Methods */}
              <div className="space-y-6 mb-6">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                    <i className="bi bi-envelope text-white"></i>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Email Us</p>
                    <p className="text-gray-600 text-sm">contact@pawfect.com</p>
                    <p className="text-gray-500 text-xs mt-1">
                      We'll respond within 24 hours
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                    <i className="bi bi-telephone text-white"></i>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Call Us</p>
                    <p className="text-gray-600 text-sm">+1 (555) 123-4567</p>
                    <p className="text-gray-500 text-xs mt-1">
                      Mon-Fri, 9AM-6PM
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                    <i className="bi bi-whatsapp text-white"></i>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">WhatsApp</p>
                    <p className="text-gray-600 text-sm">+1 (555) 123-4567</p>
                    <p className="text-gray-500 text-xs mt-1">
                      24/7 support for urgent matters
                    </p>
                  </div>
                </div>
              </div>

              {/* Support Areas */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">How We Can Help</h4>
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <i className="bi bi-check text-white text-xs"></i>
                  </div>
                  <p className="text-sm text-gray-600">
                    Adoption process guidance
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <i className="bi bi-check text-white text-xs"></i>
                  </div>
                  <p className="text-sm text-gray-600">
                    Volunteer opportunities
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <i className="bi bi-check text-white text-xs"></i>
                  </div>
                  <p className="text-sm text-gray-600">Partnership inquiries</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <i className="bi bi-check text-white text-xs"></i>
                  </div>
                  <p className="text-sm text-gray-600">
                    General support and questions
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Response Info */}
            <div className="p-6 border-t border-orange-200 bg-orange-50/50">
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg border-2 border-orange-200 shadow-sm">
                  <div className="h-12 w-12 rounded-full bg-orange-500 flex items-center justify-center mx-auto mb-3">
                    <i className="bi bi-lightning text-white text-xl"></i>
                  </div>
                  <h5 className="font-semibold text-gray-900 mb-2">
                    Quick Response
                  </h5>
                  <p className="text-sm text-gray-600">
                    Urgent adoption or emergency cases get priority response
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Contact Form */}
        <div className="landscape:w-3/5 flex flex-col h-full">
          {/* Header with Close Button */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-white">
            <h4 className="text-xl font-bold text-gray-900">
              Send Us a Message
            </h4>
            <button
              onClick={() => setShowContactModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2"
            >
              <i className="bi bi-x-lg text-xl"></i>
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleContactSubmit} className="space-y-6">
              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={contactForm.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={contactForm.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={contactForm.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Contact Method
                  </label>
                  <select
                    name="contactMethod"
                    value={contactForm.contactMethod}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  >
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  name="subject"
                  value={contactForm.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                >
                  <option value="">Select a subject</option>
                  <option value="adoption">Adoption Inquiry</option>
                  <option value="foster">Foster Program</option>
                  <option value="volunteer">Volunteer Opportunity</option>
                  <option value="donation">Donation Question</option>
                  <option value="partnership">Partnership</option>
                  <option value="support">Technical Support</option>
                  <option value="emergency">Emergency Case</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  name="message"
                  value={contactForm.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-vertical"
                  placeholder="Tell us how we can help you..."
                />
              </div>

              {/* Newsletter Option */}
              <div className="space-y-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="receiveUpdates"
                    checked={contactForm.receiveUpdates}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    I'd like to receive updates about new pets, events, and
                    adoption stories.
                  </span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowContactModal(false)}
                  className="flex-1 border-gray-300 hover:bg-gray-100"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <i className="bi bi-arrow-repeat animate-spin mr-2"></i>
                      Sending...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send mr-2"></i>
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ContactModal;
