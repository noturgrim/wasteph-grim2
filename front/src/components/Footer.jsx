import React from "react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="snap-start border-t border-white/10 bg-black py-8 md:py-10 lg:py-12">
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
        <div className="flex flex-wrap items-center gap-6">
          <a
            href="mailto:info@wasteph.com"
            className="text-xs font-bold uppercase tracking-[0.2em] text-white transition-colors hover:text-[#15803d] focus-visible:text-[#15803d] focus-visible:outline-none"
          >
            info@wasteph.com
          </a>
          <div className="flex items-center gap-4 text-xs text-white/60">
            <button
              type="button"
              className="font-semibold uppercase tracking-widest transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none"
            >
              Privacy
            </button>
            <button
              type="button"
              className="font-semibold uppercase tracking-widest transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none"
            >
              Terms
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
