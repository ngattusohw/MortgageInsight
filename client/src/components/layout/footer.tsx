import React from "react";
import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-neutral-700">&copy; {new Date().getFullYear()} MortgageSaver. All rights reserved.</p>
          </div>
          <div className="flex space-x-4">
            <Link href="#">
              <a className="text-sm text-neutral-700 hover:text-primary">Privacy Policy</a>
            </Link>
            <Link href="#">
              <a className="text-sm text-neutral-700 hover:text-primary">Terms of Service</a>
            </Link>
            <Link href="#">
              <a className="text-sm text-neutral-700 hover:text-primary">Contact Support</a>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
