// src/OceanPilotLanding.jsx
import React, { useState, useEffect } from 'react';
import { Database, BarChart3, Globe, Users, ChevronRight, Menu, X } from 'lucide-react';

const OceanPilotLanding = ({ onGetStarted }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: Database,
      title: "Unified Data Integration",
      description: "Seamlessly integrate oceanography, taxonomy, and molecular biology data into one intelligent system.",
      color: "bg-blue-50",
      accent: "#2563eb"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Cross-disciplinary correlation analysis to understand ocean parameters and biodiversity patterns.",
      color: "bg-green-50",
      accent: "#16a34a"
    },
    {
      icon: Globe,
      title: "Ecosystem Assessment",
      description: "Comprehensive tools for marine biodiversity research and ecosystem health monitoring.",
      color: "bg-purple-50",
      accent: "#9333ea"
    },
    {
      icon: Users,
      title: "Scientific Collaboration",
      description: "Empower India's marine research community with next-generation data management tools.",
      color: "bg-orange-50",
      accent: "#ea580c"
    }
  ];

  return (
    <div className="w-screen min-h-screen bg-gray-50 overflow-x-hidden">
      {/* NAV */}
      <nav
        className={`fixed top-0 w-full bg-white/90 backdrop-blur-sm border-b border-gray-100 z-50 transition-transform duration-700 ease-out ${
          isVisible ? "translate-y-0 opacity-100" : "-translate-y-8 opacity-0"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="hidden sm:inline font-semibold text-gray-800">OCEAN PILOT</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {["Features", "About", "Contact"].map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase()}`}
                className="relative text-black font-medium transition-colors duration-300 hover:text-blue-600 after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px] after:bg-blue-600 after:transition-all after:duration-300 hover:after:w-full"
              >
                {link}
              </a>
            ))}
          </div>

          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* HERO */}
      <header
        className={`pt-28 pb-12 px-6 text-center transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="max-w-4xl mx-auto">
          <h1 className="text-ultra brand-title font-bold text-black mb-6">
            OCEAN PILOT
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8">
            AI-enabled platform for integrating oceanography, biodiversity, and molecular data to
            advance India's marine ecosystem research.
          </p>
          <button
            onClick={onGetStarted}
            className="bg-blue-600 text-white px-8 py-3 rounded-md font-body font-medium shadow-md hover:bg-blue-700 transition transform hover:scale-105 duration-200"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* FEATURES */}
      <section id="features" className="py-16 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div
            className={`text-center mb-12 transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <h2 className="text-4xl md:text-5xl font-heading section-title text-black">Featured Capabilities</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className={`${f.color} p-6 rounded-lg border border-gray-100 shadow-sm transform transition duration-500 hover:scale-105 hover:shadow-lg hover:-translate-y-1`}
                  style={{
                    transitionDelay: `${i * 150}ms`,
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <Icon className="w-7 h-7" style={{ color: f.accent }} />
                    <ChevronRight className="w-5 h-5 text-gray-300" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg mb-2 text-black">{f.title}</h3>
                  <p className="text-sm text-gray-600">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div
            className={`transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
            }`}
          >
            <h3 className="text-3xl md:text-4xl section-title mb-4">Powering India's Blue Economy</h3>
            <p className="text-gray-600 mb-4">
              Ocean Pilot serves as a national marine data backbone, empowering India's scientific
              community with next-generation tools for holistic marine ecosystem assessment.
            </p>
            <p className="text-gray-600 mb-6">
              Built for CMLRE under the Ministry of Earth Sciences, our platform integrates diverse
              oceanographic, taxonomic, and molecular datasets to support sustainable fisheries and
              conservation planning.
            </p>
            <div className="flex gap-4">
              <button className="border border-[#C19D77] text-[#C19D77] px-5 py-2 rounded-md transition hover:bg-[#C19D77] hover:text-white duration-200 font-body">
                Learn More
              </button>
            </div>
          </div>

          <div
            className={`transition-all duration-1000 delay-200 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
            }`}
          >
            <div className="rounded-2xl p-6 bg-gradient-to-br from-blue-50 to-green-50 shadow-inner hover:shadow-xl transition duration-300">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="space-y-4">
                  <div className="h-3 bg-blue-400 rounded-full"></div>
                  <div className="h-3 bg-green-400 rounded-full w-3/4"></div>
                  <div className="h-3 bg-purple-400 rounded-full w-1/2"></div>
                  <div className="flex space-x-2 pt-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                      <Database className="w-5 h-5" />
                    </div>
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white">
                      <Globe className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact" className="bg-gray-900 text-white py-10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                  <Globe className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg">OCEAN PILOT</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                AI-enabled marine data intelligence platform for sustainable ocean resource
                management and blue economy initiatives.
              </p>
              <div className="flex items-center gap-2 text-gray-400">
                <span>Ministry of Earth Sciences</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            <div>
              <h4 className="font-heading font-semibold mb-3">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#features" className="hover:text-white transition-colors duration-200">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors duration-200">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors duration-200">
                    API
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors duration-200">
                    Support
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-heading font-semibold mb-3">Research</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors duration-200">
                    CMLRE
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors duration-200">
                    Publications
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors duration-200">
                    Datasets
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors duration-200">
                    Collaboration
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">© 2025 Ocean Pilot. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition duration-200">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition duration-200">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default OceanPilotLanding;