import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { useState } from 'react';
import CompanyModal from './CompanyModal';

const Footer = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <footer className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-md border-t border-gray-800/50">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-6">
              <span className="text-gray-400 cursor-not-allowed">
                <Facebook size={20} />
              </span>
              <span className="text-gray-400 cursor-not-allowed">
                <Twitter size={20} />
              </span>
              <span className="text-gray-400 cursor-not-allowed">
                <Instagram size={20} />
              </span>
              <span className="text-gray-400 cursor-not-allowed">
                <Linkedin size={20} />
              </span>
            </div>
            
            <div className="flex flex-col items-center sm:items-end gap-1">
              <div className="text-sm text-gray-400">
                &copy; {new Date().getFullYear()} Daily Affirmations. All rights reserved.
              </div>
              <div className="text-sm text-gray-500">
                Powered by{' '}
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="text-gray-400 hover:text-blue-400 transition-colors duration-200 bg-transparent"
                >
                  Intellisync Solutions
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <CompanyModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default Footer;
