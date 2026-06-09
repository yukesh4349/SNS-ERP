"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { List, X, Sparkle } from "@phosphor-icons/react";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${
          scrolled
            ? "py-3.5 bg-white/90 backdrop-blur-xl border-b border-slate-200/50 shadow-lg shadow-slate-900/5"
            : "py-6 bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-3 text-slate-900 font-extrabold font-poppins no-underline"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-white rounded-xl shadow-md shadow-slate-900/5 p-1.5 border border-slate-100 shrink-0">
                <img
                  src="/images/logo.png"
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black leading-none">
                  <span className="text-[#FF7F50]">SNS</span>{" "}
                  <span className="text-slate-900">Academy</span>
                </span>
                <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider leading-none">
                  A Fingerprint School
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <ul className="hidden md:flex items-center gap-8 list-none m-0 p-0">
              {["About", "Features", "Experience", "Contact"].map((item) => (
                <li key={item}>
                  <Link
                    href={`/#${item.toLowerCase()}`}
                    className="text-sm font-semibold text-slate-500 hover:text-[#FF7F50] transition-colors duration-200 no-underline"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Right: Login Button (Desktop) & Hamburger Menu (Mobile) */}
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#FF7F50] to-[#e66a3e] hover:shadow-lg hover:shadow-[#FF7F50]/20 active:scale-95 transition-all duration-300 no-underline border border-white/10"
              >
                Login
              </Link>

              {/* Hamburger Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={22} weight="bold" /> : <List size={22} weight="bold" />}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${
          mobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Drawer Content */}
        <div
          className={`absolute top-0 right-0 w-[280px] h-full bg-white shadow-2xl p-6 flex flex-col gap-8 transition-transform duration-300 ${
            mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Top Logo area */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#FF7F50]/10 text-[#FF7F50] flex items-center justify-center font-black text-sm">
                S
              </div>
              <span className="font-bold text-sm text-slate-900">SNS Academy</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 transition-colors"
            >
              <X size={18} weight="bold" />
            </button>
          </div>

          {/* Links */}
          <ul className="flex flex-col gap-5 list-none m-0 p-0">
            {["About", "Features", "Experience", "Contact"].map((item) => (
              <li key={item}>
                <Link
                  href={`/#${item.toLowerCase()}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-base font-bold text-slate-600 hover:text-[#FF7F50] transition-colors duration-200 no-underline"
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-auto flex flex-col gap-4 border-t border-slate-100 pt-6">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#FF7F50] to-[#e66a3e] shadow-lg shadow-[#FF7F50]/20 no-underline"
            >
              Login
            </Link>
            <div className="flex items-center gap-2 text-slate-400 text-[10px] justify-center">
              <Sparkle size={12} weight="fill" className="text-[#FF7F50]" />
              Empowering Education
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
