import React from "react";
import { Facebook, Instagram } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="pointer-events-auto snap-start border-t border-white/10 bg-black py-8 pb-24 md:py-10 lg:py-12 lg:pb-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between sm:gap-6 lg:px-12">
        <div>
          <p className="text-base font-bold text-white">
            © {currentYear} Waste PH. All rights reserved.
          </p>
          <p className="mt-2 text-sm text-white/60">
            Always bringing the fight against unmanaged waste in the
            Philippines.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:items-end">
          <a
            href="mailto:sales@waste.ph"
            className="text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors hover:text-[#15803d] focus-visible:text-[#15803d] focus-visible:outline-none"
          >
            sales@waste.ph
          </a>
          <div className="flex items-center gap-4">
            <a
              href="https://www.facebook.com/wasteph0"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 transition-colors hover:text-[#15803d] focus-visible:text-[#15803d] focus-visible:outline-none"
              aria-label="Follow us on Facebook"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a
              href="https://www.instagram.com/waste_ph/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 transition-colors hover:text-[#15803d] focus-visible:text-[#15803d] focus-visible:outline-none"
              aria-label="Follow us on Instagram"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <div className="ml-2 border-l border-white/20 pl-4">
              <a
                href="/admin"
                className="text-xs font-semibold uppercase tracking-widest text-white/40 transition-colors hover:text-white/70 focus-visible:text-white/70 focus-visible:outline-none"
                aria-label="Admin Portal"
              >
                Sales
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
