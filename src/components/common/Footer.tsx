import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          {/* Bolt Logo Link */}
          <a
            href="https://bolt.new/"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-transform duration-200 hover:scale-105"
          >
            <img
              src="/image.png"
              alt="Powered by Bolt"
              className="h-16 w-16 rounded-full"
            />
          </a>
          
          {/* Copyright Text */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              © 2025 TutorAI. Built with ❤️ using{' '}
              <a
                href="https://bolt.new/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Bolt
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}