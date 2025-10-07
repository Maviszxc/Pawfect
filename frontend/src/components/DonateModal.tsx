import { motion } from "framer-motion";
import { Button } from "@/components/ui/dynamic-button";

interface DonateModalProps {
  showDonateModal: boolean;
  setShowDonateModal: (show: boolean) => void;
  activeTab: "local" | "international";
  setActiveTab: (tab: "local" | "international") => void;
  donationForm: any;
  setDonationForm: (form: any) => void;
  handleDonationSubmit: (e: React.FormEvent) => void;
}

const DonateModal = ({
  showDonateModal,
  setShowDonateModal,
  activeTab,
  setActiveTab,
  donationForm,
  setDonationForm,
  handleDonationSubmit,
}: DonateModalProps) => {
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setDonationForm((prev: any) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setDonationForm((prev: any) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  if (!showDonateModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 pt-28">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-6xl mx-auto h-[80vh] flex flex-col landscape:flex-row overflow-hidden"
      >
        {/* Left Panel - QR Code & Instructions - Now Scrollable */}
        <div className="landscape:w-2/5 bg-gradient-to-br from-orange-50 to-orange-100 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Support Our Mission
                </h3>
                <p className="text-gray-600 mt-2">
                  Your donation helps us care for pets in need and find them
                  loving homes.
                </p>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-gray-200 mb-6">
                <button
                  onClick={() => setActiveTab("local")}
                  className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                    activeTab === "local"
                      ? "text-orange-500 border-b-2 border-orange-500"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Local Donation
                </button>
                <button
                  onClick={() => setActiveTab("international")}
                  className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                    activeTab === "international"
                      ? "text-orange-500 border-b-2 border-orange-500"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  International
                </button>
              </div>

              {/* Instructions */}
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {activeTab === "local"
                        ? "Scan our QR Code using any mobile banking app"
                        : "Scan our PayPal QR Code"}
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      {activeTab === "local"
                        ? "Our QR works with GCash, BPI, UnionBank, Maya, and other local banks."
                        : "Use PayPal to make an international donation securely."}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      Confirm your donation using the form
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      Once you've sent your donation, please confirm it using
                      the form.
                    </p>
                  </div>
                </div>

                {/* Additional Instructions for Better Scrollability */}
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      Receive confirmation and updates
                    </p>
                    <p className="text-gray-600 text-xs mt-1">
                      We'll send you a confirmation email and keep you updated
                      on how your donation helps.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code Section - Fixed at bottom but scrolls with content */}
            <div className="p-6 border-t border-orange-200 bg-orange-50/50">
              <div className="text-center">
                <h5 className="font-semibold text-gray-900 mb-4">
                  {activeTab === "local" ? "Scan to Donate" : "PayPal QR Code"}
                </h5>
                <div className="bg-white p-4 rounded-lg inline-block border-2 border-orange-200 shadow-sm">
                  <div className="w-48 h-48 flex items-center justify-center rounded bg-white">
                    {activeTab === "local" ? (
                      // Local Bank QR Code
                      <img
                        src="/QRPH.png"
                        alt="Local Bank QR Code"
                        className="w-full h-full object-contain rounded"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src =
                            "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://pawfect.com/donate/local&format=png&margin=10";
                        }}
                      />
                    ) : (
                      // PayPal QR Code
                      <img
                        src="/PAYPAL.png"
                        alt="PayPal QR Code"
                        className="w-full h-full object-contain rounded"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src =
                            "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://paypal.me/pawfectdonations&format=png&margin=10&color=2C5AA0";
                        }}
                      />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    {activeTab === "local"
                      ? "Scan with your banking app"
                      : "Scan with PayPal app"}
                  </p>
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  {activeTab === "local"
                    ? "Supported: GCash, BPI, UnionBank, Maya, and more"
                    : "Secure international payments via PayPal"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Donation Form */}
        <div className="landscape:w-3/5 flex flex-col h-full">
          {/* Header with Close Button */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-white">
            <h4 className="text-xl font-bold text-gray-900">
              Confirm Your Donation
            </h4>
            <button
              onClick={() => setShowDonateModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2"
            >
              <i className="bi bi-x-lg text-xl"></i>
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleDonationSubmit} className="space-y-6">
              {activeTab === "local" ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={donationForm.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        name="mobileNumber"
                        value={donationForm.mobileNumber}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        placeholder="Enter your mobile number"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={donationForm.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        placeholder="Enter your email address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount Donated *
                      </label>
                      <input
                        type="number"
                        name="amount"
                        value={donationForm.amount}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        placeholder="Enter amount"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Donation For
                    </label>
                    <select
                      name="donationFor"
                      value={donationForm.donationFor}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    >
                      <option value="general">General Support</option>
                      <option value="medical">Medical Care</option>
                      <option value="food">Food and Supplies</option>
                      <option value="shelter">Shelter Maintenance</option>
                      <option value="adoption">Adoption Programs</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={donationForm.name}
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
                        value={donationForm.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        placeholder="Enter your email address"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount Donated (USD) *
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={donationForm.amount}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      placeholder="Enter amount in USD"
                    />
                  </div>
                </>
              )}

              <div className="space-y-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="receiveUpdates"
                    checked={donationForm.receiveUpdates}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    I'd like to receive updates about how my donation is
                    helping.
                  </span>
                </label>
              </div>

              <div className="flex gap-3 pt-12">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDonateModal(false)}
                  className="flex-1 border-gray-300 hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <i className="bi bi-check-circle mr-2"></i>
                  Confirm Donation
                </Button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DonateModal;
