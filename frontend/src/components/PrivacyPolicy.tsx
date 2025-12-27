import { motion } from "framer-motion";

type Props = {
  onClose: () => void;
};

const PrivacyPolicy = ({ onClose }: Props) => {
  return (
    <div className="fixed inset-0 bg-black z-50 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-5xl mx-auto px-6 md:px-20 py-16 text-white"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold">
            Privacy Policy
          </h1>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-lg"
          >
            ✕ Close
          </button>
        </div>

        <div className="space-y-8 text-gray-300 leading-relaxed text-[17px]">
          <p>
            Shreyas Academy (“we”, “our”, “us”) is committed to protecting
            the privacy and personal data of all students and users.
          </p>

          <section>
            <h2 className="text-xl text-white font-semibold mb-2">
              Information We Collect
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Name, email, phone number</li>
              <li>Encrypted password</li>
              <li>Academic preferences</li>
              <li>Device, IP address, browser data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl text-white font-semibold mb-2">
              How We Use Your Data
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account creation</li>
              <li>Mentorship and class delivery</li>
              <li>Communication & updates</li>
              <li>Security and fraud prevention</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl text-white font-semibold mb-2">
              Payments
            </h2>
            <p>
              Payments are processed securely via Razorpay or Stripe.
              We never store card or UPI data.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white font-semibold mb-2">
              Data Protection
            </h2>
            <p>
              We use encryption, secure servers and JWT authentication
              to protect user data.
            </p>
          </section>

          <section>
            <h2 className="text-xl text-white font-semibold mb-2">
              Contact
            </h2>
            <p>
              Email: <span className="text-blue-400">support@shreyasacademy.in</span>
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

export default PrivacyPolicy;
