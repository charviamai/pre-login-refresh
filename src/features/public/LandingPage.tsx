import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PublicLayout } from '../../shared/components/layout/PublicLayout';
import { PublicButton } from '../../shared/components/ui/PublicButton';
import { StarryBackground } from '../../shared/components/layout/StarryBackground';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);
  const featuresAutoScrollRef = useRef<NodeJS.Timeout | null>(null);

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
      title: 'Workforce Automation',
      description: 'Optimize your team with integrated scheduling, time tracking, and performance monitoring tailored for arcade floors.'
    },
  ];

  // Testimonials data
  const testimonials = [
    {
      quote: "ArcadeX transformed how we manage our arcade. The digital ticket system alone has saved us thousands in operational costs.",
      author: "Mike Johnson",
      role: "Owner, GameZone Arcade",
    },
    {
      quote: "The analytics dashboard gives us insights we never had before. We've increased revenue by 40% in the first 6 months.",
      author: "Sarah Chen",
      role: "Manager, FunPlex Entertainment",
    },
    {
      quote: "Customer support is incredible. They helped us migrate all our data and train our staff. Couldn't be happier!",
      author: "David Rodriguez",
      role: "Director, Arcade Kingdom",
    },
  ];

  // Pricing plans
  const pricingPlans = [
    {
      name: 'Starter',
      price: '$99',
      period: '/month',
      description: 'Perfect for single-location arcades',
      features: ['Up to 50 machines', 'Basic analytics', 'Email support', 'Digital ticketing'],
      highlighted: false,
    },
    {
      name: 'Professional',
      price: '$299',
      period: '/month',
      description: 'For growing entertainment centers',
      features: ['Unlimited machines', 'Advanced analytics', 'Priority support', 'All integrations', 'Multi-site dashboard'],
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large-scale operations',
      features: ['Everything in Pro', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee', 'On-site training'],
      highlighted: false,
    },
  ];

  // Auto-rotate features
  useEffect(() => {
    featuresAutoScrollRef.current = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4000);

    return () => {
      if (featuresAutoScrollRef.current) {
        clearInterval(featuresAutoScrollRef.current);
      }
    };
  }, [features.length]);

  return (
    <PublicLayout>
      {/* Hero Section with Starry Background */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950" />
        <StarryBackground />

        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
              </span>
              Now serving 500+ arcade centers worldwide
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
              <span className="block">Intelligent Solutions</span>
              <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                for Modern Arcades
              </span>
            </h1>

            {/* Subtitle */}
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-300">
              One platform. Total control. ArcadeX unifies digital ticketing, biometric check-ins,
              workforce management, and real-time insights to drive loyalty and maximize revenue.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <PublicButton variant="primary" size="lg" href="/signup">
                Start Free Trial
                <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </PublicButton>
              <PublicButton variant="outline" size="lg" href="/login">
                Sign In
              </PublicButton>
            </div>

            {/* Trust Indicators */}
            <div className="pt-12 flex flex-wrap justify-center items-center gap-8 text-slate-400 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                14-day free trial
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Cancel anytime
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm uppercase tracking-wider">
                About ArcadeX
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
                Built by Arcade Operators, for Arcade Operators
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                We understand the unique challenges of running an entertainment center because we've been there.
                ArcadeX was born from years of hands-on experience managing arcade floors, dealing with ticket
                jams, and wishing for better data insights.
              </p>
              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">500+</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Arcades Powered</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">2M+</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Customers Served</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">99.9%</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Uptime SLA</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">24/7</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Support</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-1">
                <div className="w-full h-full rounded-xl bg-slate-900 flex items-center justify-center">
                  <div className="text-center text-white">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm opacity-70">Watch Demo Video</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="services" className="py-20 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm uppercase tracking-wider">
              Features
            </span>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
              Everything You Need to Run Your Arcade
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              From digital ticketing to workforce management, ArcadeX provides a complete solution
              for modern entertainment centers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group p-6 rounded-2xl border transition-all duration-300 cursor-pointer ${
                  activeFeature === index
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-transparent text-white shadow-xl shadow-indigo-500/25'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                }`}
                onClick={() => setActiveFeature(index)}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  activeFeature === index
                    ? 'bg-white/20'
                    : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                }`}>
                  {feature.icon}
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${
                  activeFeature === index ? 'text-white' : 'text-slate-900 dark:text-white'
                }`}>
                  {feature.title}
                </h3>
                <p className={`text-sm ${
                  activeFeature === index ? 'text-white/80' : 'text-slate-600 dark:text-slate-400'
                }`}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm uppercase tracking-wider">
              Testimonials
            </span>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
              Loved by Arcade Owners Everywhere
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-6 italic">
                  "{testimonial.quote}"
                </p>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{testimonial.author}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm uppercase tracking-wider">
              Pricing
            </span>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Choose the plan that fits your arcade. All plans include a 14-day free trial.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative p-8 rounded-2xl transition-all duration-300 ${
                  plan.highlighted
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-2xl shadow-indigo-500/30 scale-105'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-yellow-400 text-yellow-900 text-sm font-semibold rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className={`text-xl font-semibold mb-2 ${plan.highlighted ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-4 ${plan.highlighted ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
                  {plan.description}
                </p>
                <div className="mb-6">
                  <span className={`text-4xl font-bold ${plan.highlighted ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.highlighted ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
                    {plan.period}
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <svg className={`w-5 h-5 ${plan.highlighted ? 'text-white' : 'text-green-500'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className={`text-sm ${plan.highlighted ? 'text-white/90' : 'text-slate-600 dark:text-slate-300'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <PublicButton
                  variant={plan.highlighted ? 'secondary' : 'primary'}
                  className="w-full"
                  href="/signup"
                >
                  Get Started
                </PublicButton>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700" />
        <StarryBackground />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Arcade?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Join 500+ arcade operators who have already upgraded to ArcadeX.
            Start your free trial today and see the difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <PublicButton variant="secondary" size="lg" href="/signup">
              Start Free Trial
              <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </PublicButton>
            <PublicButton variant="outline" size="lg" href="/login">
              Contact Sales
            </PublicButton>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};
