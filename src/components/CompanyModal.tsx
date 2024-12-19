import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CompanyModal = ({ isOpen, onClose }: CompanyModalProps) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-gray-900 border border-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-start">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                About Intellisync Solutions
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-300 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-8 text-gray-300">
              <section className="space-y-3">
                <h3 className="text-xl font-semibold text-white">Who We Are</h3>
                <p className="leading-relaxed">
                  Intellisync Solutions is a forward-thinking technology company dedicated to creating innovative solutions 
                  that enhance human potential and well-being. Founded with a vision to harmonize technology with human 
                  consciousness, we develop tools that promote personal growth and mental wellness.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-xl font-semibold text-white">What We Do</h3>
                <p className="leading-relaxed">
                  We specialize in developing AI-powered applications that support mental wellness, personal development, 
                  and spiritual growth. Our flagship product, Daily Affirmations, uses advanced natural language processing 
                  to generate personalized, meaningful affirmations that resonate with each individual's journey.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-xl font-semibold text-white">What We Care About</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Mental health and emotional well-being</li>
                  <li>Personal growth and self-development</li>
                  <li>Ethical AI development and implementation</li>
                  <li>Privacy and data security</li>
                  <li>Inclusive and accessible technology</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-xl font-semibold text-white">Our Values</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-blue-400">Innovation</h4>
                    <p className="text-sm">Pushing boundaries while maintaining ethical standards</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-blue-400">Empathy</h4>
                    <p className="text-sm">Understanding and addressing human needs</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-blue-400">Integrity</h4>
                    <p className="text-sm">Maintaining transparency and ethical practices</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-blue-400">Excellence</h4>
                    <p className="text-sm">Delivering high-quality solutions that make a difference</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CompanyModal;
