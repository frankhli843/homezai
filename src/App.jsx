import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import './App.css'

const BASE = import.meta.env.BASE_URL

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname, hash])
  return null
}

/* ===== Shared Components ===== */
function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <img src={`${BASE}images/homezai-logo.png`} alt="Homezai" className="logo-img" />
        </Link>
        <div className="nav-links">
          <Link to="/#features">Features</Link>
          <Link to="/#benefits">Benefits</Link>
          <Link to="/#integrations">Integrations</Link>
          <Link to="/#pricing">Pricing</Link>
          <Link to="/#demo">Demo</Link>
          <a href="https://app.homezai.com" target="_blank" rel="noopener noreferrer">Login</a>
        </div>
        <div className="nav-right">
          <Link to="/support" className="nav-support">Support</Link>
          <a href="mailto:contact@homezai.com" className="btn btn-primary btn-pill nav-cta">Talk to Sales</a>
        </div>
        <button className="mobile-menu-btn" onClick={() => {
          document.querySelector('.nav-links').classList.toggle('mobile-open')
        }}>☰</button>
      </div>
    </nav>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="nav-logo">
              <img src={`${BASE}images/homezai-logo.png`} alt="Homezai" className="logo-img logo-img-light" />
            </Link>
            <p className="footer-tagline">AI-powered showing management for modern real estate teams.</p>
            <div className="footer-contact-info">
              <p>📍 255 Alhambra Circle Suite 700<br/>Coral Gables, FL 33134 USA</p>
              <p>📧 <a href="mailto:contact@homezai.com">contact@homezai.com</a></p>
              <p>📞 <a href="tel:+15024340605">+1-502-434-0605</a></p>
            </div>
          </div>
          <div className="footer-links-group">
            <h4>Product</h4>
            <Link to="/#features">Features</Link>
            <Link to="/#pricing">Pricing</Link>
            <Link to="/#integrations">Integrations</Link>
            <Link to="/#demo">Request Demo</Link>
          </div>
          <div className="footer-links-group">
            <h4>Company</h4>
            <a href="#">About</a>
            <a href="#">Careers</a>
            <a href="#">Blog</a>
            <a href="mailto:contact@homezai.com">Contact</a>
          </div>
          <div className="footer-links-group">
            <h4>Support</h4>
            <Link to="/support">Help Center</Link>
            <a href="#">Documentation</a>
            <a href="#">Status</a>
            <a href="#">Privacy Policy</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Homezai. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

/* ===== Home Page ===== */
function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <span className="hero-badge">AI-Powered Showing Management</span>
            <h1 className="hero-title">
              Gen AI Showings Management Platform for Real Estate Professionals
            </h1>
            <p className="hero-description">
              Homezai revolutionizes property showings for real estate professionals
              with intelligent scheduling, automated routing, and seamless
              integrations—all under your brand.
            </p>
            <div className="hero-actions">
              <a href="mailto:contact@homezai.com" className="btn btn-primary">
                Schedule a Demo <span className="arrow">→</span>
              </a>
              <Link to="/#features" className="btn btn-outline">
                Learn More
              </Link>
            </div>
          </div>
          <div className="hero-image">
            <img src={`${BASE}images/hero-main.png`} alt="Homezai AI-powered showing management platform with AI assistant, property listings, and map routing" className="hero-img-main" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="section-container">
          <h2 className="section-title">Everything You Need to Manage Showings</h2>
          <p className="section-subtitle">
            From scheduling to follow-ups, Homezai handles every aspect of property showings
            with AI-powered intelligence.
          </p>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <h3>Smart Scheduling</h3>
              <p>AI-powered scheduling that considers agent availability, property access times, and client preferences to find the perfect showing slot.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <h3>Automated Routing</h3>
              <p>Optimize showing routes automatically to minimize travel time and maximize the number of properties agents can show in a day.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h3>Agent Safety</h3>
              <p>Built-in safety protocols including real-time location sharing, check-in systems, and emergency alerts for agent protection.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <h3>AI Assistant</h3>
              <p>Conversational AI that handles showing requests, answers property questions, and manages follow-ups automatically.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              </div>
              <h3>White-Label Platform</h3>
              <p>Fully brandable platform that operates under your brokerage name, colors, and domain—your clients never see Homezai.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
              <h3>Analytics &amp; Insights</h3>
              <p>Comprehensive analytics on showing performance, client engagement, and market trends to help you make data-driven decisions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Showcase */}
      <section className="showcase">
        <div className="section-container">
          <h2 className="section-title">See the Platform in Action</h2>
          <p className="section-subtitle">
            ShowingsPro by Homezai combines powerful property search, AI-driven assistance,
            and intelligent route mapping in one seamless experience.
          </p>
          <div className="showcase-images">
            <div className="showcase-item">
              <img src={`${BASE}images/hero-showingspro.png`} alt="ShowingsPro mobile app showing property search, AI assistant, and map routing" />
              <h3>Mobile-First Design</h3>
              <p>Property search, AI assistant, and map routing — all optimized for agents on the go.</p>
            </div>
            <div className="showcase-item">
              <img src={`${BASE}images/hero-ai-assistant.png`} alt="AI Assistant helping schedule showings and manage listings" />
              <h3>AI-Powered Assistance</h3>
              <p>Schedule showings, manage listings, and get instant answers — your AI assistant is always ready.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="benefits">
        <div className="section-container">
          <h2 className="section-title">Why Real Estate Teams Choose Homezai</h2>
          <p className="section-subtitle">
            See the measurable impact Homezai delivers to real estate teams across North America.
          </p>
          <div className="benefits-grid">
            <div className="benefit-item">
              <div className="benefit-stat">75%</div>
              <h3>Less Scheduling Time</h3>
              <p>Automate the back-and-forth of scheduling showings and free up your agents to focus on closing deals.</p>
            </div>
            <div className="benefit-item">
              <div className="benefit-stat">3x</div>
              <h3>More Showings Per Day</h3>
              <p>Optimized routing and scheduling means your agents can see more properties in less time.</p>
            </div>
            <div className="benefit-item">
              <div className="benefit-stat">99.9%</div>
              <h3>Uptime Reliability</h3>
              <p>Enterprise-grade infrastructure ensures your showing management never goes down.</p>
            </div>
            <div className="benefit-item">
              <div className="benefit-stat">24/7</div>
              <h3>AI-Powered Support</h3>
              <p>Your AI assistant never sleeps—handle showing requests and inquiries around the clock.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section id="integrations" className="integrations">
        <div className="section-container">
          <h2 className="section-title">Seamless Integrations</h2>
          <p className="section-subtitle">
            Connect with the tools your team already uses. Homezai integrates with leading MLS systems,
            CRMs, and real estate platforms.
          </p>
          <div className="integrations-logos">
            <div className="integration-logo">MLS Systems</div>
            <div className="integration-logo">Salesforce</div>
            <div className="integration-logo">Google Calendar</div>
            <div className="integration-logo">Outlook</div>
            <div className="integration-logo">Zillow</div>
            <div className="integration-logo">Realtor.com</div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing">
        <div className="section-container">
          <h2 className="section-title">Simple, Transparent Pricing</h2>
          <p className="section-subtitle">Choose the plan that fits your team size and needs.</p>
          <div className="pricing-grid">
            <div className="pricing-card">
              <h3>Starter</h3>
              <div className="price">$49<span>/agent/mo</span></div>
              <ul>
                <li>Up to 5 agents</li>
                <li>Smart scheduling</li>
                <li>Basic analytics</li>
                <li>Email support</li>
              </ul>
              <a href="mailto:contact@homezai.com" className="btn btn-outline">Get Started</a>
            </div>
            <div className="pricing-card featured">
              <div className="popular-badge">Most Popular</div>
              <h3>Professional</h3>
              <div className="price">$89<span>/agent/mo</span></div>
              <ul>
                <li>Up to 50 agents</li>
                <li>AI assistant</li>
                <li>Automated routing</li>
                <li>Advanced analytics</li>
                <li>Priority support</li>
              </ul>
              <a href="mailto:contact@homezai.com" className="btn btn-primary">Get Started</a>
            </div>
            <div className="pricing-card">
              <h3>Enterprise</h3>
              <div className="price">Custom</div>
              <ul>
                <li>Unlimited agents</li>
                <li>White-label platform</li>
                <li>Custom integrations</li>
                <li>Dedicated support</li>
                <li>SLA guarantee</li>
              </ul>
              <a href="mailto:contact@homezai.com" className="btn btn-outline">Contact Sales</a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="demo" className="cta-section">
        <div className="section-container">
          <h2 className="section-title light">Ready to Transform Your Showings?</h2>
          <p className="section-subtitle light">
            Join hundreds of real estate teams already using Homezai to streamline their showing operations.
          </p>
          <div className="cta-actions">
            <a href="mailto:contact@homezai.com" className="btn btn-white">Schedule a Demo →</a>
          </div>
        </div>
      </section>
    </>
  )
}

/* ===== Support Page ===== */
function SupportPage() {
  return (
    <div className="support-page">
      <section className="support-hero">
        <div className="section-container">
          <h1 className="section-title">Support &amp; Help Center</h1>
          <p className="section-subtitle">
            We're here to help. Reach out to our team for any questions about Homezai.
          </p>
        </div>
      </section>

      <section className="support-content">
        <div className="section-container">
          <div className="support-grid">
            <div className="support-card">
              <div className="support-icon">📧</div>
              <h3>Email Us</h3>
              <p>For general inquiries, sales questions, or technical support.</p>
              <a href="mailto:contact@homezai.com" className="support-link">contact@homezai.com</a>
            </div>
            <div className="support-card">
              <div className="support-icon">📞</div>
              <h3>Call Us</h3>
              <p>Speak directly with our team during business hours (Mon–Fri, 9 AM – 6 PM EST).</p>
              <a href="tel:+15024340605" className="support-link">+1-502-434-0605</a>
            </div>
            <div className="support-card">
              <div className="support-icon">📍</div>
              <h3>Visit Us</h3>
              <p>Our office is located in the heart of Coral Gables, Florida.</p>
              <span className="support-link">255 Alhambra Circle Suite 700<br/>Coral Gables, FL 33134 USA</span>
            </div>
          </div>

          <div className="support-faq">
            <h2>Frequently Asked Questions</h2>
            <div className="faq-grid">
              <div className="faq-item">
                <h3>How do I get started with Homezai?</h3>
                <p>Schedule a demo with our team and we'll walk you through the platform, set up your account, and configure your white-label branding. Most teams are up and running within 48 hours.</p>
              </div>
              <div className="faq-item">
                <h3>Does Homezai integrate with my MLS?</h3>
                <p>Yes! Homezai integrates with major MLS systems across North America. Contact us to confirm compatibility with your specific MLS.</p>
              </div>
              <div className="faq-item">
                <h3>Is the platform white-labeled?</h3>
                <p>Absolutely. Homezai operates entirely under your brokerage brand — your logo, colors, and domain. Your clients never see the Homezai name.</p>
              </div>
              <div className="faq-item">
                <h3>What kind of support do you offer?</h3>
                <p>We offer email support for all plans, priority support for Professional plans, and dedicated account management for Enterprise customers.</p>
              </div>
              <div className="faq-item">
                <h3>Can I try Homezai before committing?</h3>
                <p>Yes — we offer personalized demos and pilot programs. Contact our sales team to discuss the best option for your team.</p>
              </div>
              <div className="faq-item">
                <h3>How does the AI assistant work?</h3>
                <p>Our AI assistant uses natural language processing to handle showing requests, answer property questions, manage schedules, and automate follow-ups — 24/7, under your brand.</p>
              </div>
            </div>
          </div>

          <div className="support-cta">
            <h2>Still have questions?</h2>
            <p>Our team is ready to help you get the most out of Homezai.</p>
            <div className="support-cta-buttons">
              <a href="mailto:contact@homezai.com" className="btn btn-primary">Contact Sales</a>
              <a href="tel:+15024340605" className="btn btn-outline">Call +1-502-434-0605</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

/* ===== App Root ===== */
function App() {
  return (
    <div className="app">
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/support" element={<SupportPage />} />
      </Routes>
      <Footer />
    </div>
  )
}

export default App
