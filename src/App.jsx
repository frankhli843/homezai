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
          </div>
          <div className="footer-links-group">
            <h4>Legal</h4>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/accessibility">Accessibility</Link>
            <Link to="/dpa">DPA</Link>
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
            Showzy by Homezai combines powerful property search, AI-driven assistance,
            and intelligent route mapping in one seamless experience.
          </p>
          <div className="showcase-images">
            <div className="showcase-item">
              <img src={`${BASE}images/hero-showingspro.png`} alt="Showzy mobile app showing property search, AI assistant, and map routing" />
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
          <h2 className="section-title">Enterprise Solutions</h2>
          <p className="section-subtitle">Tailored AI-powered showing management for MLS organizations, associations, and brokerages.</p>
          <div className="pricing-enterprise">
            <div className="pricing-card featured enterprise-card">
              <h3>Enterprise</h3>
              <div className="price">Request a Quote</div>
              <p className="enterprise-desc">Custom pricing for your organization's needs</p>
              <ul>
                <li>Unlimited agents</li>
                <li>White-label platform</li>
                <li>Custom MLS integrations</li>
                <li>AI assistant &amp; automated routing</li>
                <li>Advanced analytics &amp; reporting</li>
                <li>Dedicated account management</li>
                <li>SLA guarantee</li>
                <li>Priority onboarding &amp; training</li>
              </ul>
              <a href="mailto:contact@homezai.com" className="btn btn-primary">Contact Sales</a>
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

/* ===== Terms of Service Page ===== */
function TermsPage() {
  useEffect(() => { document.title = 'Terms of Service – Homezai' }, [])
  return (
    <div className="legal-page">
      <section className="legal-hero">
        <div className="section-container">
          <h1 className="section-title">Website Terms of Service</h1>
          <p className="legal-updated">Last Updated: December 8, 2025</p>
        </div>
      </section>
      <section className="legal-content">
        <div className="section-container legal-container">
          <p>Welcome to Homezai.com ("Homezai," "we," or "our"). By accessing or using our website, mobile tools, or services (collectively, the "Services"), you agree to these Terms of Service.</p>
          <p><strong>If you do not agree, do not use the Services.</strong></p>

          <h2>1. Overview of Homezai</h2>
          <p>Homezai is an AI-powered platform that helps consumers:</p>
          <ul>
            <li>find the right real estate listing agent,</li>
            <li>communicate with agents, and</li>
            <li>schedule home showings.</li>
          </ul>
          <p>Homezai is not a real estate brokerage, does not represent buyers or sellers, and does not guarantee real estate outcomes.</p>

          <h2>2. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>misuse the platform (spam, fraudulent activity, scraping, reverse engineering),</li>
            <li>violate any applicable state or federal laws,</li>
            <li>attempt unauthorized access to accounts or systems.</li>
          </ul>
          <p>We may suspend or terminate access for violations.</p>

          <h2>3. No Professional Advice</h2>
          <p>All content, AI outputs, and recommendations provided by Homezai are for informational purposes only. They do not constitute real estate, legal, or financial advice.</p>

          <h2>4. Accounts and Registration</h2>
          <p>If you create an account:</p>
          <ul>
            <li>provide accurate information,</li>
            <li>maintain the security of your credentials.</li>
          </ul>
          <p>You are responsible for all activity under your account.</p>

          <h2>5. Intellectual Property</h2>
          <p>All content, trademarks, software, and AI models belong to Homezai. You may not copy, distribute, or modify the Services without our permission.</p>

          <h2>6. Third-Party Services</h2>
          <p>Homezai may integrate with licensed real estate agents, MLS information providers, scheduling software, or communication systems. We are not responsible for third-party services or actions.</p>

          <h2>7. Disclaimers</h2>
          <p>The Services are provided "as is" without warranties of any kind. We do not guarantee availability, agent quality, scheduling outcomes, or accuracy of AI-generated content.</p>

          <h2>8. Limitation of Liability</h2>
          <p>To the fullest extent allowed by law:</p>
          <ul>
            <li>Homezai is not liable for indirect, incidental, or consequential damages.</li>
            <li>Total liability is limited to $100 for website visitors who do not hold a paid subscription.</li>
          </ul>

          <h2>9. Privacy</h2>
          <p>Your use of the Services is also governed by our <Link to="/privacy">Privacy Policy</Link>, available on this site.</p>

          <h2>10. Governing Law</h2>
          <p>These Terms are governed by the laws of the State of Florida.</p>

          <h2>11. Changes</h2>
          <p>We may update these Terms at any time. Continued use constitutes acceptance.</p>

          <h2>12. Contact</h2>
          <p>For questions:<br/>
          <a href="mailto:contact@homezai.com">contact@homezai.com</a><br/>
          Homezai.com (HomeEZY, LLC.)<br/>
          255 Alhambra Circle, Suite 700<br/>
          Coral Gables, Florida 33135 USA</p>
        </div>
      </section>
    </div>
  )
}

/* ===== Privacy Policy Page ===== */
function PrivacyPage() {
  useEffect(() => { document.title = 'Privacy Policy – Homezai' }, [])
  return (
    <div className="legal-page">
      <section className="legal-hero">
        <div className="section-container">
          <h1 className="section-title">Privacy Policy</h1>
          <p className="legal-updated">Last Updated: December 8, 2025</p>
        </div>
      </section>
      <section className="legal-content">
        <div className="section-container legal-container">
          <p>This Privacy Policy explains how Homezai, Inc. ("Homezai," "we," "our," or "us") collects, uses, stores, and protects information when you use Homezai.com or our related services (the "Services").</p>

          <h2>1. Information We Collect</h2>
          <h3>1.1 Information You Provide</h3>
          <ul>
            <li>Name, email, phone number, and contact details</li>
            <li>Property preferences or location interests</li>
            <li>Messages you send via the platform</li>
            <li>Account credentials (hashed and encrypted)</li>
          </ul>
          <h3>1.2 Automatically Collected Information</h3>
          <ul>
            <li>IP address and device identifiers</li>
            <li>Browser type and operating system</li>
            <li>Usage data and interaction logs</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
          <p>See "Cookies" section below.</p>
          <h3>1.3 Information From Third Parties</h3>
          <p>We may receive data from:</p>
          <ul>
            <li>real estate listing services,</li>
            <li>licensed real estate agents and brokerages,</li>
            <li>analytics services,</li>
            <li>communication platforms (SMS, email).</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We process data to:</p>
          <ul>
            <li>match consumers with appropriate listing agents,</li>
            <li>send and receive messages,</li>
            <li>schedule showings,</li>
            <li>personalize AI recommendations,</li>
            <li>provide, maintain, and improve the Services,</li>
            <li>comply with legal obligations.</li>
          </ul>

          <h2>3. Legal Bases for Processing (GDPR-style transparency)</h2>
          <p>Although we operate in the U.S., we align with global privacy best practices. We may process data under:</p>
          <ul>
            <li>consent,</li>
            <li>contract performance,</li>
            <li>legitimate interests (platform optimization, fraud prevention),</li>
            <li>legal compliance.</li>
          </ul>

          <h2>4. Sharing Your Information</h2>
          <p>We may share limited information with:</p>
          <ul>
            <li>Agents and brokerages you choose to communicate with</li>
            <li>Service providers (hosting, messaging, analytics, scheduling tools)</li>
            <li>Legal authorities if required by law</li>
            <li>Subcontractors bound by confidentiality and security obligations</li>
          </ul>
          <p><strong>We never sell personal information.</strong></p>

          <h2>5. Data Retention</h2>
          <p>We retain information only as long as needed for:</p>
          <ul>
            <li>providing the Services,</li>
            <li>complying with legal obligations,</li>
            <li>resolving disputes.</li>
          </ul>
          <p>You may request deletion at any time (see "Your Rights").</p>

          <h2>6. Your Rights</h2>
          <p>Depending on your state, you may have rights to:</p>
          <ul>
            <li>access your data,</li>
            <li>correct inaccurate information,</li>
            <li>delete your data,</li>
            <li>opt out of data sharing for advertising,</li>
            <li>request a copy (data portability).</li>
          </ul>
          <p>Requests: <a href="mailto:privacy@homezai.com">privacy@homezai.com</a></p>

          <h2>7. Cookies &amp; Tracking Technologies</h2>
          <p>Homezai uses cookies to:</p>
          <ul>
            <li>improve website functionality,</li>
            <li>remember preferences,</li>
            <li>analyze usage patterns,</li>
            <li>support personalized experiences.</li>
          </ul>
          <p>You may adjust your browser settings to block cookies.</p>

          <h2>8. Data Security</h2>
          <p>We use industry-standard protections:</p>
          <ul>
            <li>encryption in transit and at rest,</li>
            <li>multi-factor authentication for critical systems,</li>
            <li>monitoring and logging,</li>
            <li>periodic security tests.</li>
          </ul>
          <p>No system is 100% secure, but we take reasonable measures to protect your data.</p>

          <h2>9. Children's Privacy</h2>
          <p>The Services are not intended for children under 16. We do not knowingly collect data from minors.</p>

          <h2>10. International Visitors</h2>
          <p>Homezai is based in the United States (Florida). If you access our Services from outside the U.S., your information may be transferred to and processed in the U.S.</p>

          <h2>11. Changes to This Privacy Policy</h2>
          <p>We may update this Policy periodically. We will post changes on this page with a new "Last Updated" date.</p>

          <h2>12. Contact Us</h2>
          <p><a href="mailto:contact@homezai.com">contact@homezai.com</a><br/>
          Homezai.com (HomeEZY, LLC.)<br/>
          255 Alhambra Circle, Suite 700<br/>
          Coral Gables, Florida 33135 USA</p>
        </div>
      </section>
    </div>
  )
}

/* ===== Accessibility Page ===== */
function AccessibilityPage() {
  useEffect(() => { document.title = 'Accessibility Statement – Homezai' }, [])
  return (
    <div className="legal-page">
      <section className="legal-hero">
        <div className="section-container">
          <h1 className="section-title">Accessibility Statement</h1>
          <p className="legal-updated">Last Updated: March 12, 2025</p>
        </div>
      </section>
      <section className="legal-content">
        <div className="section-container legal-container">
          <p>Homezai is committed to ensuring digital accessibility for all individuals, including people with disabilities. We believe everyone should be able to easily access and use our technology to schedule home showings and manage property viewing appointments.</p>
          <p>This accessibility statement applies to the Homezai website and the Homezai software platform used by real estate professionals, brokerages, MLS participants, and consumers.</p>

          <h2>Accessibility Standards</h2>
          <p>Homezai strives to conform to the Web Content Accessibility Guidelines (WCAG) 2.2 Level AA, published by the World Wide Web Consortium (W3C). These guidelines define best practices for making digital content accessible to people with a wide range of disabilities, including visual, auditory, motor, and cognitive impairments.</p>
          <p>Homezai also works to support accessibility expectations under applicable laws and regulations, including:</p>
          <ul>
            <li>The Americans with Disabilities Act (ADA)</li>
            <li>Section 508 of the Rehabilitation Act (where applicable)</li>
            <li>Other international accessibility standards where our platform may be used</li>
          </ul>

          <h2>Our Approach to Accessibility</h2>
          <p>Accessibility is integrated into the design, development, and testing of the Homezai platform. We aim to provide an inclusive experience for both real estate professionals and consumers who use our system to schedule and manage home showings.</p>
          <p>Our efforts include:</p>
          <ul>
            <li>Designing interfaces that support keyboard navigation</li>
            <li>Supporting screen readers and assistive technologies</li>
            <li>Maintaining clear navigation and consistent page structure</li>
            <li>Providing text alternatives for images and icons</li>
            <li>Ensuring sufficient color contrast for readability</li>
            <li>Supporting responsive layouts across devices</li>
            <li>Designing accessible forms, calendars, and scheduling workflows</li>
            <li>Testing for accessibility during product development and updates</li>
          </ul>

          <h2>Real Estate Technology and MLS Integrations</h2>
          <p>Homezai integrates with various real estate technology systems that may include:</p>
          <ul>
            <li>Multiple Listing Services (MLS)</li>
            <li>Showing management platforms</li>
            <li>Brokerage and agent software tools</li>
            <li>Property listing data feeds</li>
            <li>Third-party authentication and calendar services</li>
          </ul>
          <p>While Homezai works to ensure accessibility within our own platform, some integrated third-party systems, embedded content, or external data sources may not be fully controlled by Homezai. We encourage our integration partners and vendors to follow recognized accessibility standards such as WCAG.</p>

          <h2>Continuous Accessibility Improvements</h2>
          <p>Accessibility is an ongoing process. Homezai regularly evaluates its website and application to identify areas where accessibility can be improved. These efforts may include:</p>
          <ul>
            <li>Periodic accessibility audits</li>
            <li>Internal accessibility testing</li>
            <li>Product design reviews</li>
            <li>Updates aligned with evolving WCAG standards</li>
          </ul>

          <h2>Known Limitations</h2>
          <p>Despite our efforts to ensure accessibility across the platform, some areas may not yet fully conform to WCAG 2.2 Level AA standards. We are actively working to address any identified accessibility issues.</p>

          <h2>Feedback and Accessibility Support</h2>
          <p>We welcome feedback from users regarding the accessibility of the Homezai platform. If you experience any difficulty accessing features, scheduling a showing, or using any part of our website or software, please contact us so we can assist you.</p>
          <p>When reporting an issue, please include:</p>
          <ul>
            <li>The webpage or feature you were trying to access</li>
            <li>The device and browser you were using</li>
            <li>Any assistive technology used (if applicable)</li>
            <li>A description of the issue you encountered</li>
          </ul>
          <p>We will make reasonable efforts to respond and provide assistance as quickly as possible.</p>

          <h2>Contact Information</h2>
          <p>Accessibility Support<br/>
          Email: <a href="mailto:contact@homezai.com">contact@homezai.com</a><br/>
          Website: <a href="https://www.homezai.com">https://www.homezai.com</a></p>

          <h2>Statement Updates</h2>
          <p>Homezai may update this Accessibility Statement periodically to reflect improvements to our accessibility practices or changes in applicable standards and regulations.</p>
        </div>
      </section>
    </div>
  )
}

/* ===== DPA Page ===== */
function DpaPage() {
  useEffect(() => { document.title = 'Data Processing Agreement – Homezai' }, [])
  return (
    <div className="legal-page">
      <section className="legal-hero">
        <div className="section-container">
          <h1 className="section-title">Data Processing Addendum (DPA)</h1>
          <p className="legal-updated">Last Updated: December 8, 2025</p>
        </div>
      </section>
      <section className="legal-content">
        <div className="section-container legal-container">
          <p>This Data Processing Addendum ("DPA") is part of the Master Service Agreement (MSA) or Terms of Service between Homezai, Inc. ("Processor") and the customer ("Controller"). This DPA describes data protection obligations relating to Homezai's processing of personal data.</p>

          <h2>1. Definitions</h2>
          <p><strong>"Personal Data"</strong> means any information relating to an identified or identifiable individual processed through the Services.</p>
          <p><strong>"Processing," "Controller," and "Processor"</strong> are defined consistent with standard privacy laws (GDPR-style alignment).</p>
          <p><strong>"Subprocessor"</strong> means any third party engaged by Homezai to assist with processing Personal Data.</p>

          <h2>2. Roles</h2>
          <p>The customer acts as Controller. Homezai acts as a Processor. Customer determines the nature and purpose of data processed through the Services.</p>

          <h2>3. Processor Obligations</h2>
          <p>Homezai shall:</p>
          <ul>
            <li>process Personal Data only on documented instructions from Customer,</li>
            <li>implement industry-standard technical and organizational security measures,</li>
            <li>ensure personnel are bound by confidentiality,</li>
            <li>assist Customer with data subject requests,</li>
            <li>notify Customer of any confirmed Personal Data breach within 72 hours,</li>
            <li>return or delete Personal Data at termination unless legally required to retain it.</li>
          </ul>

          <h2>4. Subprocessors</h2>
          <p>Homezai may engage Subprocessors for hosting, messaging, analytics, scheduling, and support.</p>
          <p>Homezai will:</p>
          <ul>
            <li>use only vetted Subprocessors under written agreements,</li>
            <li>ensure equal or stronger data protection obligations,</li>
            <li>maintain an updated list of Subprocessors upon written request.</li>
          </ul>

          <h2>5. Cross-Border Data Transfers</h2>
          <p>Personal Data may be transferred to the United States or other jurisdictions where Homezai or its Subprocessors operate. All transfers will comply with applicable privacy laws.</p>

          <h2>6. Security Measures</h2>
          <p>Homezai shall maintain safeguards including:</p>
          <ul>
            <li>encryption at rest and in transit,</li>
            <li>access controls and authentication,</li>
            <li>monitoring and logging,</li>
            <li>data minimization,</li>
            <li>disaster recovery and backup practices.</li>
          </ul>

          <h2>7. Data Subject Requests</h2>
          <p>Homezai will assist Customer in responding to requests regarding:</p>
          <ul>
            <li>access,</li>
            <li>correction,</li>
            <li>deletion,</li>
            <li>restriction of processing,</li>
            <li>data portability.</li>
          </ul>
          <p>Customer is responsible for verifying identity and legality of all requests.</p>

          <h2>8. Audit Rights</h2>
          <p>Upon reasonable notice, Customer may request security documentation, certifications, or summaries of audit reports.</p>
          <p>On-site audits may be permitted once per year and at Customer's expense, provided they do not disrupt operations or expose platform source code or proprietary information.</p>

          <h2>9. Retention &amp; Deletion</h2>
          <p>Upon termination of Services, Homezai will:</p>
          <ul>
            <li>delete Personal Data within 60 days, or</li>
            <li>return it if requested by Customer before deletion,</li>
          </ul>
          <p>unless retention is required by law.</p>

          <h2>10. Liability</h2>
          <p>Liability limits in the MSA apply to this DPA.</p>

          <h2>11. Term</h2>
          <p>This DPA remains in effect as long as Homezai processes Personal Data on behalf of the Customer.</p>

          <h2>Contact</h2>
          <p>For questions regarding this Data Processing Addendum:<br/>
          Email: <a href="mailto:contact@homezai.com">contact@homezai.com</a><br/>
          Company: Homezai.com (HomeEZY, LLC.)<br/>
          Address: 255 Alhambra Circle, Suite 700, Coral Gables, Florida 33135 USA</p>
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
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/accessibility" element={<AccessibilityPage />} />
        <Route path="/dpa" element={<DpaPage />} />
      </Routes>
      <Footer />
    </div>
  )
}

export default App
