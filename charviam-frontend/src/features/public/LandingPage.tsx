import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicButton } from '../../shared/components/ui/PublicButton';
import { PublicThemeToggle } from '../../shared/components/layout/PublicThemeToggle';
import { ComparisonSection } from './comparison/ComparisonSection';

export const LandingPage: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(1);
  const navigate = useNavigate();

  // Features Carousel State
  const [featuresPage, setFeaturesPage] = useState(1); // Start at 1 (first real page)
  const [featuresDragging, setFeaturesDragging] = useState(false);
  const [featuresDragStart, setFeaturesDragStart] = useState({ x: 0, time: 0 });
  const [featuresDragOffset, setFeaturesDragOffset] = useState(0);
  const [featuresHovered, setFeaturesHovered] = useState(false);
  const [featuresTransitioning, setFeaturesTransitioning] = useState(true);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const featuresAutoScrollRef = useRef<NodeJS.Timeout | null>(null);

  // Testimonials Carousel State
  const [testimonialsIndex, setTestimonialsIndex] = useState(0);
  const [testimonialsDragging, setTestimonialsDragging] = useState(false);
  const [testimonialsDragStart, setTestimonialsDragStart] = useState({ x: 0, time: 0 });
  const [testimonialsDragOffset, setTestimonialsDragOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const testimonialsAutoScrollRef = useRef<NodeJS.Timeout | null>(null);

  const isMobile = windowWidth < 768;
  const featuresCardsPerPage = isMobile ? 2 : 4;
  const testimonialsVisibleCount = isMobile ? 2 : 3;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset carousel positions on breakpoint change
  useEffect(() => {
    setFeaturesPage(0);
  }, [isMobile]);

  // Features data
  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
      title: 'Digital Identity & Ticketing',
      description: 'Replace physical tickets with secure digital identities. Unified tracking across check-ins, gameplay, and redemptions.'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      title: 'Customer Intelligence',
      description: 'Build detailed profiles with integrated palm scans, purchase history, and high-value customer behavior tracking.'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Operational Analytics',
      description: 'Make data-driven decisions with live dashboards tracking revenue, machine performance, and foot traffic across all sites.'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
      title: 'Enterprise Multi-Site Control',
      description: 'Manage multiple locations from a single command center with site-specific settings, staff, and localized reporting.'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
      title: 'Machine Performance Tracking',
      description: 'Monitor machine health, revenue generation, and maintenance logs to maximize floor profitability and uptime.'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Workforce & Schedule Automation',
      description: 'Optimize your team with integrated scheduling, time tracking, and performance monitoring tailored for arcade floors.'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
        </svg>
      ),
      title: 'Dynamic Rewards Engine',
      description: 'Automate prize inventory and redemption workflows. Configure points, tiers, and personalized rewards to drive loyalty.'
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Interactive Self-Service Kiosks',
      description: 'Empower customers with self-service registration, account top-ups, prize browsing, and promotional game play.'
    }
  ];

  const featuresTotalPages = Math.ceil(features.length / featuresCardsPerPage);

  // Create extended features pages for infinite loop: [last, ...pages, first]
  const getExtendedFeaturesPages = () => {
    const pages = Array.from({ length: featuresTotalPages }, (_, i) =>
      features.slice(i * featuresCardsPerPage, (i + 1) * featuresCardsPerPage)
    );
    // Add last page at beginning and first page at end for seamless loop
    return [pages[pages.length - 1], ...pages, pages[0]];
  };

  const extendedFeaturesPages = getExtendedFeaturesPages();

  // Handle features carousel transition end for seamless loop
  const handleFeaturesTransitionEnd = () => {
    if (featuresPage === 0) {
      // At clone of last page, jump to real last page
      setFeaturesTransitioning(false);
      setFeaturesPage(featuresTotalPages);
    } else if (featuresPage === featuresTotalPages + 1) {
      // At clone of first page, jump to real first page
      setFeaturesTransitioning(false);
      setFeaturesPage(1);
    }
  };

  // Re-enable transition after position jump
  useEffect(() => {
    if (!featuresTransitioning) {
      // Force a reflow before re-enabling transition
      const timer = setTimeout(() => setFeaturesTransitioning(true), 50);
      return () => clearTimeout(timer);
    }
  }, [featuresTransitioning]);

  // Safety check for featuresPage bounds on resize
  useEffect(() => {
    if (featuresPage > featuresTotalPages + 1) {
      setFeaturesPage(featuresTotalPages);
    }
  }, [featuresTotalPages, featuresPage]);

  // Testimonials data
  const testimonials = [
    {
      quote: "ArcadeX transformed how we manage our arcade. The digital ticket system alone has saved us thousands in operational costs.",
      author: "Mike Johnson",
      role: "Owner, GameZone Arcade",
      rating: 5
    },
    {
      quote: "The analytics dashboard gives us insights we never had before. We've increased revenue by 40% in the first 6 months.",
      author: "Sarah Chen",
      role: "Manager, FunPlex Entertainment",
      rating: 5
    },
    {
      quote: "Customer support is incredible. They helped us migrate all our data and train our staff. Couldn't be happier!",
      author: "David Rodriguez",
      role: "Director, Arcade Kingdom",
      rating: 5
    },
    {
      quote: "The platform's reliability and ease of use have transformed our daily operations. Our staff adapted quickly and customers love the new experience.",
      author: "Jennifer Martinez",
      role: "Operations Manager, PlayZone Entertainment",
      rating: 5
    },
    {
      quote: "Best investment we've made for our arcade. The real-time reporting and customer insights have been game-changers for our business strategy.",
      author: "Robert Kim",
      role: "CEO, Ultimate Arcade Center",
      rating: 5
    }
  ];

  // Create extended array for infinite loop
  const getExtendedTestimonials = () => {
    if (isMobile) {
      return [testimonials[testimonials.length - 1], ...testimonials, testimonials[0]];
    } else {
      return [
        ...testimonials.slice(-testimonialsVisibleCount),
        ...testimonials,
        ...testimonials.slice(0, testimonialsVisibleCount)
      ];
    }
  };

  const extendedTestimonials = getExtendedTestimonials();

  // Features Carousel Auto-scroll (pauses on hover) - always moves forward
  useEffect(() => {
    if (featuresAutoScrollRef.current) {
      clearInterval(featuresAutoScrollRef.current);
    }

    if (!featuresHovered) {
      featuresAutoScrollRef.current = setInterval(() => {
        setFeaturesPage((prev) => prev + 1); // Always increment, loop handled by transition-end
      }, 5000);
    }

    return () => {
      if (featuresAutoScrollRef.current) {
        clearInterval(featuresAutoScrollRef.current);
      }
    };
  }, [featuresHovered]);

  // Testimonials Carousel Auto-scroll
  useEffect(() => {
    const startIndex = isMobile ? 1 : testimonialsVisibleCount;
    setTestimonialsIndex(startIndex);

    if (testimonialsAutoScrollRef.current) {
      clearInterval(testimonialsAutoScrollRef.current);
    }

    testimonialsAutoScrollRef.current = setInterval(() => {
      setTestimonialsIndex((prev) => prev + 1);
    }, 4000);

    return () => {
      if (testimonialsAutoScrollRef.current) {
        clearInterval(testimonialsAutoScrollRef.current);
      }
    };
  }, [isMobile, testimonialsVisibleCount]);

  // Handle Features Carousel Drag
  const handleFeaturesDragStart = (clientX: number) => {
    setFeaturesDragging(true);
    setFeaturesDragStart({ x: clientX, time: Date.now() });
    if (featuresAutoScrollRef.current) {
      clearInterval(featuresAutoScrollRef.current);
    }
  };

  const handleFeaturesDragMove = (clientX: number) => {
    if (!featuresDragging) return;
    const offset = clientX - featuresDragStart.x;
    setFeaturesDragOffset(offset);
  };

  const handleFeaturesDragEnd = (clientX: number) => {
    if (!featuresDragging) return;

    const offset = clientX - featuresDragStart.x;
    const SWIPE_THRESHOLD = 50;

    if (Math.abs(offset) > SWIPE_THRESHOLD) {
      if (offset > 0) {
        setFeaturesPage((prev) => (prev - 1 + featuresTotalPages) % featuresTotalPages);
      } else {
        setFeaturesPage((prev) => (prev + 1) % featuresTotalPages);
      }
    }

    setFeaturesDragging(false);
    setFeaturesDragOffset(0);

    // Restart auto-scroll
    if (featuresAutoScrollRef.current) {
      clearInterval(featuresAutoScrollRef.current);
    }
    featuresAutoScrollRef.current = setInterval(() => {
      setFeaturesPage((prev) => prev + 1);
    }, 5000);
  };

  // Handle Testimonials Carousel Drag
  const handleTestimonialsDragStart = (clientX: number) => {
    setTestimonialsDragging(true);
    setTestimonialsDragStart({ x: clientX, time: Date.now() });
    if (testimonialsAutoScrollRef.current) {
      clearInterval(testimonialsAutoScrollRef.current);
    }
  };

  const handleTestimonialsDragMove = (clientX: number) => {
    if (!testimonialsDragging) return;
    const offset = clientX - testimonialsDragStart.x;
    setTestimonialsDragOffset(offset);
  };

  const handleTestimonialsDragEnd = (clientX: number) => {
    if (!testimonialsDragging) return;

    const offset = clientX - testimonialsDragStart.x;
    const SWIPE_THRESHOLD = 50;

    if (Math.abs(offset) > SWIPE_THRESHOLD) {
      if (offset > 0) {
        setTestimonialsIndex((prev) => prev - 1);
      } else {
        setTestimonialsIndex((prev) => prev + 1);
      }
    }

    setTestimonialsDragging(false);
    setTestimonialsDragOffset(0);

    // Restart auto-scroll
    if (testimonialsAutoScrollRef.current) {
      clearInterval(testimonialsAutoScrollRef.current);
    }
    testimonialsAutoScrollRef.current = setInterval(() => {
      setTestimonialsIndex((prev) => prev + 1);
    }, 4000);
  };

  // Handle testimonials infinite loop transition
  const handleTestimonialsTransitionEnd = () => {
    const maxIndex = extendedTestimonials.length - testimonialsVisibleCount;
    const minIndex = isMobile ? 1 : testimonialsVisibleCount;

    if (testimonialsIndex >= maxIndex) {
      setIsTransitioning(false);
      setTestimonialsIndex(minIndex);
      setTimeout(() => setIsTransitioning(true), 50);
    } else if (testimonialsIndex <= (isMobile ? 0 : testimonialsVisibleCount - 1)) {
      setIsTransitioning(false);
      setTestimonialsIndex(maxIndex - 1);
      setTimeout(() => setIsTransitioning(true), 50);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-violet-50 to-cyan-50">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${isScrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-lg border-b border-violet-100'
          : 'bg-transparent'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <img src="/logo.png" alt="ArcadeX" className="max-h-8 sm:max-h-10" />
              <div className="flex flex-col">
                <span className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-cyan-500 bg-clip-text text-transparent leading-none">
                  ArcadeX
                </span>
                <span className="text-[8px] sm:text-[10px] font-medium text-slate-500 tracking-wide mt-0 leading-none">@ Charaviam Product</span>
              </div>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                About Us
              </button>
              <button
                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Services
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Contact
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-10 px-4 sm:px-6 lg:px-8 overflow-hidden bg-white">
        <div className="particle-bg absolute inset-0 opacity-30" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-12 gap-8 items-center relative">
            {/* Left Column - Content */}
            <div className="md:col-span-7 space-y-6">
              <h1 className="text-xl md:text-3xl md:leading-tight font-bold animate-slide-up-fade">
                <span className="bg-gradient-to-r from-purple-600 to-cyan-500 bg-clip-text text-transparent">
                  Elevate Your Gaming Business
                </span>
                <br />
                <span className="text-slate-800">with ArcadeX Platform</span>
              </h1>
              <p className="text-base text-slate-600 animate-slide-up-fade" style={{ animationDelay: '0.1s' }}>
                One platform. Total control. ArcadeX unifies digital ticketing, biometric check-ins,
                workforce management, real-time insights, and engaging kiosk for promotional games,
                all from a powerful centralized dashboard designed to drive loyalty and maximize revenue.
              </p>
            </div>

            {/* Right Column - Dashboard Preview */}
            <div className="md:col-span-5 glass-card rounded-2xl p-6 animate-slide-up-fade" style={{ animationDelay: '0.3s' }}>
              <div className="aspect-video bg-gradient-to-br from-purple-100 to-cyan-100 rounded-xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-200/50 via-transparent to-transparent animate-pulse" />
                <div className="relative z-10 text-center p-8">
                  <div className="text-5xl mb-4">🎮</div>
                  <h3 className="text-base font-bold text-slate-800 mb-2">Platform Dashboard Preview</h3>
                  <p className="text-sm text-slate-600">Real-time analytics • Management • Ticket tracking</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why ArcadeX Section */}
      <section id="about" className="pt-4 pb-10 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-[26px] font-bold text-slate-800 mb-4">
            Why ArcadeX?
          </h2>
          <p className="text-base text-slate-600 mb-4 max-w-4xl mx-auto">
            Most arcades rely on legacy systems, paper tickets, and disconnected tools, but ArcadeX replaces all of that with a purpose-built platform that consolidates every operational function into one secure, scalable, and modern solution.
          </p>

          {/* Styled Quote Block */}
          <div className="bg-gradient-to-r from-purple-50 to-cyan-50 border-l-4 border-purple-500 py-3 px-6 mb-4 max-w-3xl mx-auto rounded-r-lg">
            <p className="text-base text-slate-800 font-medium italic">
              "ArcadeX is not just software. It's the infrastructure for sustainable arcade growth."
            </p>
          </div>

          <p className="text-base text-slate-600 mb-6 max-w-4xl mx-auto">
            Whether you operate a single location or a growing network of entertainment venues,
            ArcadeX gives you the control, visibility, and efficiency to dominate your market.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <span className="text-sm font-semibold text-slate-800">
              Ready to transform your Business?
            </span>
            <PublicButton onClick={() => navigate('/signup')} variant="primary" size="lg">
              Request a Demo
            </PublicButton>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-violet-50 to-cyan-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-[26px] font-bold text-slate-800 mb-2">
              Launch Your Arcade
            </h2>
            <p className="text-base text-slate-600 max-w-2xl mx-auto">
              From setup to launch, ArcadeX gets you operational fast.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: '1',
                title: 'Onboard',
                description: 'Create your account, configure locations, and set up staff access.'
              },
              {
                step: '2',
                title: 'Activate',
                description: 'Register customers via palm scan, NFC, or phone, creating secure digital identities.'
              },
              {
                step: '3',
                title: 'Launch',
                description: 'Kiosks handle check-ins, promotional games, and ticket redemptions.'
              },
              {
                step: '4',
                title: 'Scale',
                description: 'Add new locations or devices effortlessly as your business grows.'
              }
            ].map((item, index) => (
              <div key={index} className="text-center relative">
                {index < 3 && (
                  <div className="hidden md:block absolute top-6 left-1/2 w-full h-0.5 bg-gradient-to-r from-purple-400 to-cyan-400 pulse-line" />
                )}
                <div className="relative z-10 mb-3 mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg">
                  <span className="text-lg font-bold text-white">{item.step}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hardware & Software Section */}
      <section id="services" className="py-10 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-[26px] font-bold text-slate-800 mb-2">
              Our Services
            </h2>
            <p className="text-base text-slate-600 max-w-4xl mx-auto">
              ArcadeX unifies hardware and software into a single, powerful ecosystem for total operational control.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Hardware Support Card */}
            <div className="glass-card rounded-xl p-6 border-l-4 border-purple-500 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center flex-shrink-0 mr-4 shadow-lg shadow-purple-500/20">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800">Integrated Hardware</h3>
              </div>
              <p className="text-sm text-slate-600 mb-6">
                Complete hardware solutions engineered for high-traffic reliability and seamless platform integration.
              </p>
              <ul className="space-y-3">
                {[
                  'Smart POS Management Systems',
                  'Biometric Verification Device (Palm & NFC)',
                  'Automated Customer-Facing Kiosks',
                  'Integrated High-Speed Thermal Printers',
                  'IoT-Enabled Machine Connectivity Hubs',
                  'High-Precision QR & Barcode Redemption Scanners'
                ].map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <svg className="w-5 h-5 text-purple-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700 text-sm font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Software Card */}
            <div className="glass-card rounded-xl p-6 border-l-4 border-indigo-500 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center flex-shrink-0 mr-4 shadow-lg shadow-indigo-500/20">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800">Intelligent Software</h3>
              </div>
              <p className="text-sm text-slate-600 mb-6">
                A unified management platform that delivers real-time visibility and automated control across your entire organization.
              </p>
              <ul className="space-y-3">
                {[
                  'Centralized Multi-Tenant Enterprise & Shop Management',
                  'Unified Customer Identity & Biometric Verifications',
                  'High-Performance Merchant POS & Operational Suite',
                  'Advanced Workforce Management & Employee Portal',
                  'Real-Time Operational Dashboards & Analytics Reports',
                  'Integrated Kiosk Application & Promotional Gaming Suite',
                  'Automated Financial, Game Machines & Performance Reporting'
                ].map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <svg className="w-5 h-5 text-indigo-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700 text-sm font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Carousel Section */}
      <section id="features" className="py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-violet-50 to-cyan-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-[26px] font-bold text-slate-800 mb-2">
              The Arcade Management Suite
            </h2>
            <p className="text-base text-slate-600 max-w-4xl mx-auto">
              Powerful features designed specifically for modern gaming arcades and entertainment centers
            </p>
          </div>

          <div
            className="relative px-4 sm:px-8"
            style={{ touchAction: 'pan-y' }}
            onMouseDown={(e) => handleFeaturesDragStart(e.clientX)}
            onMouseMove={(e) => handleFeaturesDragMove(e.clientX)}
            onMouseUp={(e) => handleFeaturesDragEnd(e.clientX)}
            onMouseEnter={() => setFeaturesHovered(true)}
            onMouseLeave={() => {
              setFeaturesHovered(false);
              if (featuresDragging) handleFeaturesDragEnd(featuresDragStart.x);
            }}
            onTouchStart={(e) => handleFeaturesDragStart(e.touches[0].clientX)}
            onTouchMove={(e) => handleFeaturesDragMove(e.touches[0].clientX)}
            onTouchEnd={(e) => handleFeaturesDragEnd(e.changedTouches[0].clientX)}
            onDragStart={(e) => e.preventDefault()}
          >
            <div className="overflow-hidden py-4">
              <div
                className="flex"
                style={{
                  transform: `translateX(calc(-${Math.min(Math.max(featuresPage, 0), extendedFeaturesPages.length - 1) * 100}% + ${featuresDragging ? featuresDragOffset : 0}px))`,
                  transition: featuresDragging || !featuresTransitioning ? 'none' : 'transform 500ms cubic-bezier(0.4, 0, 0.2, 1)',
                  willChange: 'transform'
                }}
                onTransitionEnd={handleFeaturesTransitionEnd}
              >
                {extendedFeaturesPages.map((pageFeatures, pageIndex) => (
                  <div
                    key={pageIndex}
                    className="min-w-full grid grid-cols-1 md:grid-cols-2 gap-4 px-4 content-start"
                  >
                    {pageFeatures && pageFeatures.map((feature, cardIndex) => (
                      <div
                        key={cardIndex}
                        className="glass-card rounded-xl p-5 hover:scale-[1.02] transition-all duration-300 cursor-pointer group relative z-content"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-50 to-cyan-50 flex items-center justify-center text-purple-600 group-hover:bg-gradient-to-br group-hover:from-purple-500 group-hover:to-cyan-500 group-hover:text-white transition-all duration-300">
                            <span className="w-6 h-6">{feature.icon}</span>
                          </div>
                          <h3 className="text-base font-bold text-slate-800">{feature.title}</h3>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-3">{feature.description}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pagination Dots */}
          <div className="flex justify-center items-center gap-2 mt-6">
            {Array.from({ length: featuresTotalPages }).map((_, index) => {
              const realIndex = index + 1;
              const isActive = featuresPage === realIndex;

              return (
                <button
                  key={index}
                  onClick={() => {
                    setFeaturesTransitioning(true);
                    setFeaturesPage(realIndex);
                  }}
                  className={`transition-all duration-300 rounded-full ${isActive
                    ? 'w-8 h-3 bg-gradient-to-r from-purple-600 to-cyan-500'
                    : 'w-3 h-3 bg-slate-300 hover:bg-slate-400'
                    }`}
                  aria-label={`Go to page ${index + 1}`}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* ArcadeX Comparison Section */}
      <ComparisonSection />

      {/* Pricing Section */}
      <section id="pricing" className="py-10 px-4 sm:px-6 lg:px-8 bg-white overflow-visible">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-[26px] font-bold text-slate-800 mb-2">
              Our Packages
            </h2>
            <p className="text-[14px] text-slate-600 max-w-2xl mx-auto">
              Choose the plan that fits your business. All plans include 30-day free trial.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                name: 'Basic',
                price: '$149',
                period: '/month',
                savings: [
                  { duration: '6 months', price: '$699', saved: 'Save $195' },
                  { duration: 'Annual', price: '$1,199', saved: 'Save $589' }
                ],
                description: 'Essential tools for single-location arcades',
                features: [
                  '1 Business Location',
                  'Core Analytics Dashboard',
                  'Digital Identity & Ticketing',
                  'Basic Staff Management',
                  'Self-Service Kiosk Support',
                  'Email Support'
                ],
                cta: 'Start Free Trial',
                popular: false
              },
              {
                name: 'Premium',
                price: '$249',
                period: '/month',
                savings: [
                  { duration: '6 months', price: '$1,099', saved: 'Save $395' },
                  { duration: 'Annual', price: '$1,999', saved: 'Save $989' }
                ],
                description: 'Advanced features for growing venues',
                features: [
                  'Up to 2 Business Locations',
                  'Real-Time Analytics Suite',
                  'Biometric & NFC Verification',
                  'Workforce Management & Payroll',
                  'Multi-Site Visibility & Control',
                  'Priority 24/7 Support'
                ],
                cta: 'Start Free Trial',
                popular: true
              },
              {
                name: 'Enterprise',
                price: '$1,999',
                period: '/year',
                savings: [],
                description: 'Full-service solution for arcade networks',
                features: [
                  'Full Access to All Features',
                  'White-Label Platform',
                  'Full API Access',
                  'Custom Hardware Integrations',
                  'Dedicated Account Manager',
                  'Enterprise-Grade Security'
                ],
                cta: 'Contact Sales',
                popular: false
              }
            ].map((plan, index) => (
              <div
                key={index}
                onClick={() => setSelectedPlan(index)}
                className={`glass-card rounded-2xl p-6 relative cursor-pointer transition-all duration-300 overflow-visible ${selectedPlan === index
                  ? 'border-2 border-cyan-500 scale-105 shadow-2xl shadow-cyan-500/50'
                  : 'hover:scale-102'
                  }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-500 rounded-full text-white text-sm font-semibold whitespace-nowrap z-10">
                    Most Popular
                  </div>
                )}
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">{plan.name}</h3>
                  <p className="text-slate-500 text-sm mb-3">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-slate-800">{plan.price}</span>
                    <span className="text-slate-500 ml-1">{plan.period}</span>
                  </div>
                  {plan.savings.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {plan.savings.map((s, sIndex) => (
                        <div key={sIndex} className="text-xs text-slate-500">
                          <span className="font-medium">{s.duration}:</span> {s.price}{' '}
                          <span className="text-green-600 font-semibold">({s.saved})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start">
                      <svg className="w-5 h-5 text-cyan-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-slate-600 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Carousel Section */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-violet-50 to-cyan-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-[26px] font-bold text-slate-800 mb-2">
              Trusted by Arcade Owners
            </h2>
            <p className="text-base text-slate-600 max-w-2xl mx-auto">
              See what our customers have to say about ArcadeX
            </p>
          </div>

          <div
            className="relative overflow-hidden cursor-grab active:cursor-grabbing py-6"
            style={{ touchAction: 'pan-y' }}
            onMouseDown={(e) => handleTestimonialsDragStart(e.clientX)}
            onMouseMove={(e) => handleTestimonialsDragMove(e.clientX)}
            onMouseUp={(e) => handleTestimonialsDragEnd(e.clientX)}
            onMouseLeave={() => testimonialsDragging && handleTestimonialsDragEnd(testimonialsDragStart.x)}
            onTouchStart={(e) => handleTestimonialsDragStart(e.touches[0].clientX)}
            onTouchMove={(e) => handleTestimonialsDragMove(e.touches[0].clientX)}
            onTouchEnd={(e) => handleTestimonialsDragEnd(e.changedTouches[0].clientX)}
            onDragStart={(e) => e.preventDefault()}
          >
            <div
              className="flex gap-8"
              style={{
                transform: `translateX(calc(-${testimonialsIndex * (100 / testimonialsVisibleCount)}% + ${testimonialsDragging ? testimonialsDragOffset : 0}px))`,
                transition: testimonialsDragging || !isTransitioning ? 'none' : 'transform 600ms cubic-bezier(0.4, 0, 0.2, 1)',
                willChange: 'transform'
              }}
              onTransitionEnd={handleTestimonialsTransitionEnd}
            >
              {extendedTestimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 glass-card rounded-xl p-5 relative z-content"
                  style={{
                    width: isMobile ? '100%' : `calc(${100 / testimonialsVisibleCount}% - ${(testimonialsVisibleCount - 1) * 2}rem / ${testimonialsVisibleCount})`
                  }}
                >
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-slate-600 mb-4 italic">"{testimonial.quote}"</p>
                  <div className="border-t border-slate-200 pt-4">
                    <p className="text-slate-800 font-semibold">{testimonial.author}</p>
                    <p className="text-slate-500 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Top Row - Logo, Links, Social */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-6">
            {/* Logo & Description */}
            <div className="flex-shrink-0">
              <div className="flex items-center space-x-1 mb-2">
                <img src="/logo.png" alt="ArcadeX" className="max-h-8" />
                <div className="flex flex-col">
                  <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-cyan-500 bg-clip-text text-transparent">
                    ArcadeX
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 tracking-wide mt-0 leading-none">@ Charaviam Product</span>
                </div>
              </div>
              <p className="text-slate-500 text-xs max-w-[200px]">
                Premium gaming rewards platform for modern arcades.
              </p>
            </div>

            {/* Links Grid */}
            <div className="grid grid-cols-4 gap-8 text-sm">
              <div>
                <h4 className="text-slate-800 font-semibold mb-2 text-xs uppercase tracking-wide">Company</h4>
                <ul className="space-y-1">
                  <li><a href="/about" className="text-slate-500 hover:text-purple-600 text-xs">About</a></li>
                  <li><a href="/services" className="text-slate-500 hover:text-purple-600 text-xs">Services</a></li>
                  <li><a href="/products" className="text-slate-500 hover:text-purple-600 text-xs">Products</a></li>
                  <li><a href="/blog" className="text-slate-500 hover:text-purple-600 text-xs">Blog</a></li>
                  <li><a href="/contact" className="text-slate-500 hover:text-purple-600 text-xs">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-slate-800 font-semibold mb-2 text-xs uppercase tracking-wide">Contact</h4>
                <ul className="space-y-1">
                  <li className="text-slate-500 text-xs">support@arcadex.com</li>
                  <li className="text-slate-500 text-xs">1-800-ARCADEX</li>
                  <li className="text-slate-500 text-xs">Dallas, TX</li>
                </ul>
              </div>
              <div>
                <h4 className="text-slate-800 font-semibold mb-2 text-xs uppercase tracking-wide">Legal</h4>
                <ul className="space-y-1">
                  <li><a href="/privacy" className="text-slate-500 hover:text-purple-600 text-xs">Privacy</a></li>
                  <li><a href="/terms" className="text-slate-500 hover:text-purple-600 text-xs">Terms</a></li>
                  <li><a href="/compliance" className="text-slate-500 hover:text-purple-600 text-xs">Compliance</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-slate-800 font-semibold mb-2 text-xs uppercase tracking-wide">Account</h4>
                <ul className="space-y-1">
                  <li><a href="/login" className="text-slate-500 hover:text-purple-600 text-xs">Login</a></li>
                  <li><a href="/signup" className="text-slate-500 hover:text-purple-600 text-xs">Sign Up</a></li>
                </ul>
              </div>
            </div>

            {/* Social Icons */}
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-purple-600 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-purple-600 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
              <a href="#" className="text-slate-400 hover:text-purple-600 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Bottom Row - Copyright */}
          <div className="border-t border-slate-200 pt-4">
            <p className="text-slate-400 text-xs text-center">© 2025 ArcadeX. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
