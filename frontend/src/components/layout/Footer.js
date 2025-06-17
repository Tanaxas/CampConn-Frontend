import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-hit-primary py-6 text-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-lg font-bold">Campus Connect</h3>
            <p className="text-sm">Exclusively for Harare Institute of Technology</p>
          </div>
          <div className="flex space-x-4 mb-4 md:mb-0">
            <Link to="/" className="hover:text-hit-secondary">Home</Link>
            <Link to="/about" className="hover:text-hit-secondary">About</Link>
            <Link to="/terms" className="hover:text-hit-secondary">Terms</Link>
            <Link to="/privacy" className="hover:text-hit-secondary">Privacy</Link>
          </div>
          <div className="text-sm text-center md:text-right">
            <p>&copy; {new Date().getFullYear()} Campus Connect | HIT Marketplace</p>
            <p>All rights reserved</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;