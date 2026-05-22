import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
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
          <Link to="/integrations">Integrations</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/#demo">Demo</Link>
        </div>
        <div className="nav-right">
          <a href="https://app.homezai.com" target="_blank" rel="noopener noreferrer" className="nav-login">Login</a>
          <Link to="/pricing#quote-form" className="btn btn-primary btn-pill nav-cta">Get a Quote</Link>
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
            <p className="footer-tagline">AI real estate showings software with intelligent appointment scheduling for the modern real estate professional.</p>
          </div>
          <div className="footer-links-group">
            <h4>Product</h4>
            <Link to="/#features">Features</Link>
            <Link to="/pricing">Pricing</Link>
            <Link to="/integrations">Integrations</Link>
            <Link to="/#demo">Schedule a Demo</Link>
            <Link to="/#demo">Talk to Sales</Link>
          </div>
          <div className="footer-links-group">
            <h4>Company</h4>
            <Link to="/">Home</Link>
            <a href="#">About</a>
            <a href="#">Careers</a>
            <a href="mailto:contact@homezai.com">Contact</a>
            <a href="https://app.homezai.com" target="_blank" rel="noopener noreferrer">Login</a>
          </div>
          <div className="footer-links-group">
            <h4>Legal</h4>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/dpa">Data Processing (DPA)</Link>
            <Link to="/accessibility">Accessibility</Link>
          </div>
        </div>
        <div className="footer-contact-row">
          <div className="footer-contact-item">
            <h5>Address</h5>
            <p>255 Alhambra Circle Ste 700</p>
            <p>Coral Gables, FL 34134</p>
          </div>
          <div className="footer-contact-item">
            <h5>Phone</h5>
            <p>1-502-434-0605</p>
          </div>
          <div className="footer-contact-item">
            <h5>Email</h5>
            <p><a href="mailto:Info@Homezai.com">Info@Homezai.com</a></p>
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
                Learn more about Homezai
              </Link>
            </div>
          </div>
          <div className="hero-image">
            <video
              className="hero-video"
              src={`${BASE}videos/homezai-homepage-demo.mp4?v=20260522`}
              poster={`${BASE}images/hero-main.png`}
              autoPlay
              muted
              loop
              playsInline
              controls
              aria-label="Homezai business site overview video"
            >
              <img src={`${BASE}images/hero-main.png`} alt="Homezai AI-powered showing management platform with AI assistant, property listings, and map routing" />
            </video>
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
              <Link to="/pricing" className="btn btn-primary">View Pricing Plans</Link>
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
function FaqItem({ question }) {
  const [open, setOpen] = useState(false)
  const answers = {
    "How does Homezai's AI scheduling work?": "Homezai uses advanced AI to automatically match showing requests with agent availability, optimize routes for multiple properties, and send automated confirmations and reminders to all parties involved.",
    "Can I use my own branding with Homezai?": "Yes! Homezai is fully white-labeled. You can customize the platform with your logo, colors, domain, and branding so your clients never see the Homezai name.",
    "Which MLS and CRM systems does Homezai integrate with?": "Homezai integrates with major MLS systems including CincyMLS and SWFL MLS, as well as CRM platforms like BoldTrail. We're continuously adding new integrations.",
    "How do I optimize routes for multiple property showings?": "Our AI-powered routing engine automatically calculates the most efficient route between multiple properties, considering travel time, showing duration, and agent availability.",
    "Who owns the data in Homezai?": "You own your data. Homezai provides full data export capabilities, and you maintain complete control over your information at all times.",
    "How much does Homezai cost?": "Homezai offers custom pricing based on your organization's size and needs. Contact our sales team for a tailored pricing proposal.",
    "Can I try Homezai before purchasing?": "Yes! We offer personalized demos and pilot programs. Contact our sales team to discuss the best option for your organization.",
    "What kind of support does Homezai provide?": "We offer email support, phone support (Mon-Fri, 9 AM - 6 PM EST), dedicated account management for enterprise customers, and comprehensive training resources.",
    "How long does it take to set up Homezai?": "Most organizations are up and running within 48 hours. Our onboarding team handles the setup, integration configuration, and white-label branding for you.",
    "Is my data secure with Homezai?": "Absolutely. Homezai is hosted on Amazon Web Services (AWS) with enterprise-grade security, encryption at rest and in transit, and regular security audits."
  }
  return (
    <div className="faq-accordion-item">
      <button className={`faq-accordion-btn${open ? ' open' : ''}`} onClick={() => setOpen(!open)}>
        <span>{question}</span>
        <span className="faq-chevron">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="faq-accordion-content"><p>{answers[question]}</p></div>}
    </div>
  )
}

function SupportPage() {
  useEffect(() => { document.title = 'Support - Homezai' }, [])
  const [supportForm, setSupportForm] = useState({ fullName: '', email: '', category: '', priority: 'Medium', subject: '', message: '' })
  const handleSupportChange = (field) => (e) => setSupportForm(prev => ({ ...prev, [field]: e.target.value }))
  const handleSupportSubmit = (e) => {
    e.preventDefault()
    const { fullName, email, category, priority, subject, message } = supportForm
    const body = [
      `Full Name: ${fullName}`,
      `Email: ${email}`,
      `Category: ${category}`,
      `Priority: ${priority}`,
      `Subject: ${subject}`,
      '',
      `Message:`,
      message,
      '',
      `Page URL: ${window.location.href}`,
    ].join('\n')
    window.location.href = `mailto:contact@homezai.com?subject=${encodeURIComponent(`Homezai Support Request: ${subject}`)}&body=${encodeURIComponent(body)}`
  }
  const trainingVideos = [
    { title: "Getting Started with Homezai", desc: "Learn the basics of setting up your Homezai account and managing your first showing.", duration: "5:32", category: "Getting Started", img: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&q=80" },
    { title: "Intelligent Appointment Scheduling", desc: "Master our AI-powered scheduling system to automate your showing appointments.", duration: "8:15", category: "Features", img: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80" },
    { title: "Multi-Property Routing Optimization", desc: "Optimize routes for multiple property showings to save time and maximize efficiency.", duration: "6:45", category: "Features", img: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80" },
    { title: "White Label Customization", desc: "Customize Homezai with your branding for associations, brokerages, and teams.", duration: "7:20", category: "Customization", img: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80" },
    { title: "MLS & CRM Integrations", desc: "Connect Homezai to your existing MLS and CRM systems for seamless data flow.", duration: "9:10", category: "Integrations", img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80" },
    { title: "Data Management & Ownership", desc: "Understand how to manage, export, and maintain control over your data.", duration: "5:55", category: "Data & Security", img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80" },
  ]
  const articles = {
    "Getting Started": [
      { title: "Creating Your First Account", time: "3 min" },
      { title: "Setting Up Your Profile", time: "2 min" },
      { title: "Inviting Team Members", time: "4 min" },
      { title: "Understanding the Dashboard", time: "5 min" },
    ],
    "Scheduling & Appointments": [
      { title: "How to Schedule a Showing", time: "3 min" },
      { title: "Automated Appointment Reminders", time: "4 min" },
      { title: "Managing Availability", time: "3 min" },
      { title: "Rescheduling and Cancellations", time: "2 min" },
    ],
    "Integrations": [
      { title: "Connecting Your MLS", time: "6 min" },
      { title: "CRM Integration Setup", time: "7 min" },
      { title: "Calendar Sync (Google, Outlook, Apple)", time: "4 min" },
      { title: "Troubleshooting Integration Issues", time: "5 min" },
    ],
    "Team Management": [
      { title: "Adding and Removing Agents", time: "3 min" },
      { title: "Setting Permissions and Roles", time: "5 min" },
      { title: "Team Performance Analytics", time: "6 min" },
      { title: "White Label Branding for Teams", time: "4 min" },
    ],
  }
  const faqQuestions = [
    "How does Homezai's AI scheduling work?",
    "Can I use my own branding with Homezai?",
    "Which MLS and CRM systems does Homezai integrate with?",
    "How do I optimize routes for multiple property showings?",
    "Who owns the data in Homezai?",
    "How much does Homezai cost?",
    "Can I try Homezai before purchasing?",
    "What kind of support does Homezai provide?",
    "How long does it take to set up Homezai?",
    "Is my data secure with Homezai?",
  ]
  return (
    <div className="support-page">
      {/* Hero */}
      <section className="support-hero">
        <div className="section-container">
          <span className="hero-badge">We're Here to Help</span>
          <h1 className="section-title">Homezai Support Center</h1>
          <p className="section-subtitle">Find answers, learn best practices, and get help from our support team</p>
          <div className="support-nav-cards">
            <a href="#videos" className="support-nav-card">
              <div className="support-nav-icon">🎬</div>
              <h3>Training Videos</h3>
            </a>
            <a href="#articles" className="support-nav-card">
              <div className="support-nav-icon">📄</div>
              <h3>Support Articles</h3>
            </a>
            <a href="#faqs" className="support-nav-card">
              <div className="support-nav-icon">❓</div>
              <h3>FAQs</h3>
            </a>
            <a href="#contact" className="support-nav-card">
              <div className="support-nav-icon">💬</div>
              <h3>Contact Support</h3>
            </a>
          </div>
        </div>
      </section>

      {/* Training Videos */}
      <section id="videos" className="support-section">
        <div className="section-container">
          <h2 className="section-title">Training Videos</h2>
          <p className="section-subtitle">Step-by-step video guides to help you master Homezai</p>
          <div className="video-grid">
            {trainingVideos.map((v, i) => (
              <div className="video-card" key={i}>
                <div className="video-thumb">
                  <img src={v.img} alt={v.title} />
                  <span className="video-duration">{v.duration}</span>
                  <span className="video-category">{v.category}</span>
                </div>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support Articles */}
      <section id="articles" className="support-section support-section-alt">
        <div className="section-container">
          <h2 className="section-title">Support Articles</h2>
          <p className="section-subtitle">Comprehensive guides and documentation</p>
          <div className="articles-grid">
            {Object.entries(articles).map(([category, items]) => (
              <div className="articles-column" key={category}>
                <h3>{category}</h3>
                <ul>
                  {items.map((a, i) => (
                    <li key={i}>
                      <a href="#">
                        <span>{a.title}</span>
                        <span className="article-time">{a.time}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faqs" className="support-section">
        <div className="section-container">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-subtitle">Quick answers to common questions</p>
          <div className="faq-accordion">
            {faqQuestions.map((q, i) => <FaqItem key={i} question={q} />)}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact" className="support-section support-section-alt">
        <div className="section-container">
          <h2 className="section-title">Send a Support Request</h2>
          <p className="section-subtitle">Can't find what you're looking for? We're here to help!</p>
          <form className="support-form" onSubmit={handleSupportSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input type="text" placeholder="Full Name" required value={supportForm.fullName} onChange={handleSupportChange('fullName')} />
              </div>
              <div className="form-group">
                <label>Email Address *</label>
                <input type="email" placeholder="Email Address" required value={supportForm.email} onChange={handleSupportChange('email')} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Category *</label>
                <select required value={supportForm.category} onChange={handleSupportChange('category')}>
                  <option value="" disabled>Select a category</option>
                  <option>Technical Issue</option>
                  <option>Billing &amp; Payment</option>
                  <option>Integration Support</option>
                  <option>Training &amp; Onboarding</option>
                  <option>Feature Request</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select value={supportForm.priority} onChange={handleSupportChange('priority')}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Urgent</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Subject *</label>
              <input type="text" placeholder="Subject" required value={supportForm.subject} onChange={handleSupportChange('subject')} />
            </div>
            <div className="form-group">
              <label>Message *</label>
              <textarea placeholder="Describe your issue or question..." rows="5" required value={supportForm.message} onChange={handleSupportChange('message')}></textarea>
            </div>
            <p className="form-note">Our support team typically responds within 24 hours during business days. For urgent issues, please call us at 1-502-434-0605.</p>
            <button type="submit" className="btn btn-primary btn-full">Submit Support Request</button>
          </form>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="support-contact-cards">
        <div className="section-container">
          <div className="contact-cards-grid">
            <div className="contact-card-item">
              <h4>Email Support</h4>
              <a href="mailto:Info@Homezai.com">Info@Homezai.com</a>
            </div>
            <div className="contact-card-item">
              <h4>Phone Support</h4>
              <p>1-502-434-0605</p>
              <p className="contact-detail">Mon-Fri, 9 AM - 6 PM EST</p>
            </div>
            <div className="contact-card-item">
              <h4>Schedule a Call</h4>
              <Link to="/#demo">Book a time slot</Link>
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

/* ===== Pricing Page ===== */
function PricingPage() {
  useEffect(() => { document.title = 'Plans and Pricing - Homezai' }, [])
  const [showMoreBrokerage, setShowMoreBrokerage] = useState(false)
  const [showMoreEnterprise, setShowMoreEnterprise] = useState(false)
  const [quoteForm, setQuoteForm] = useState({ firstName: '', lastName: '', workEmail: '', phone: '', orgName: '', numAgents: '', orgType: '', currentSystem: '', additionalInfo: '' })
  const handleQuoteChange = (field) => (e) => setQuoteForm(prev => ({ ...prev, [field]: e.target.value }))
  const handleQuoteSubmit = (e) => {
    e.preventDefault()
    const { firstName, lastName, workEmail, phone, orgName, numAgents, orgType, currentSystem, additionalInfo } = quoteForm
    const body = [
      `Name: ${firstName} ${lastName}`,
      `Work Email: ${workEmail}`,
      `Phone: ${phone}`,
      `Organization: ${orgName}`,
      `Number of Agents: ${numAgents}`,
      `Organization Type: ${orgType}`,
      currentSystem ? `Current Showing System: ${currentSystem}` : '',
      additionalInfo ? `\nAdditional Information:\n${additionalInfo}` : '',
      '',
      `Page URL: ${window.location.href}`,
    ].filter(Boolean).join('\n')
    window.location.href = `mailto:contact@homezai.com?subject=${encodeURIComponent(`Homezai Pricing Quote Request: ${orgName}`)}&body=${encodeURIComponent(body)}`
  }
  const brokerageFeatures = [
    { title: "Unlimited Showings", desc: "Schedule and manage unlimited property showings with no restrictions." },
    { title: "AI-Powered Scheduling", desc: "Intelligent appointment scheduling that optimizes routes automatically." },
    { title: "White Label Branding", desc: "Fully branded to your brokerage with your logo and colors." },
    { title: "MLS & CRM Integrations", desc: "Seamless integration with your existing MLS and CRM systems." },
  ]
  const brokerageExtra = [
    { title: "Automated Routing", desc: "Optimized multi-property tour routes for your agents." },
    { title: "Agent Safety Features", desc: "Real-time check-in and emergency alert capabilities." },
    { title: "Performance Analytics", desc: "Track showing metrics and agent productivity." },
    { title: "AI Assistant", desc: "24/7 automated showing requests and follow-ups." },
    { title: "Calendar Integrations", desc: "Sync with Google Calendar, Outlook, and Apple Calendar." },
    { title: "Priority Support", desc: "Dedicated support with faster response times." },
  ]
  const enterpriseFeatures = [
    { title: "Unlimited Showings", desc: "Schedule and manage unlimited property showings with no restrictions." },
    { title: "AI-Powered Scheduling", desc: "Intelligent appointment scheduling that optimizes routes automatically." },
    { title: "White Label Branding", desc: "Fully branded to your association, MLS, brokerage, team, or agency." },
    { title: "MLS & CRM Integrations", desc: "Seamless integration with your existing MLS and CRM systems." },
  ]
  const enterpriseExtra = [
    { title: "Custom API Access", desc: "Full API access for custom integrations and workflows." },
    { title: "SSO & Advanced Security", desc: "Single sign-on and enterprise-grade security controls." },
    { title: "Dedicated Account Manager", desc: "Your own account manager for onboarding and support." },
    { title: "SLA Guarantee", desc: "99.9% uptime guarantee with priority incident response." },
    { title: "Data Export & Ownership", desc: "Full data portability and ownership guarantees." },
    { title: "Custom Onboarding", desc: "Tailored training and rollout plan for your organization." },
  ]
  return (
    <div className="pricing-page">
      <section className="pricing-hero">
        <div className="section-container">
          <span className="hero-badge">Enterprise Pricing</span>
          <h1 className="section-title">Plans and Pricing</h1>
          <p className="section-subtitle">Subscription plans and pricing designed for real estate organizations to support teams and agents success via their MLSs, Associations and Brokerages.</p>
        </div>
      </section>

      <section className="pricing-plans">
        <div className="section-container">
          <div className="plans-grid">
            <div className="plan-card">
              <h2>Brokerage Plan</h2>
              <p className="plan-subtitle">Pricing for your Brokerage</p>
              <p className="plan-desc">The Brokerage plan is designed for real estate brokerages looking to empower their teams and agents with AI-powered showings management technology with your branding. Pricing is based on active producing agents and scales as you grow.</p>
              <div className="plan-features">
                {brokerageFeatures.map((f, i) => (
                  <div className="plan-feature" key={i}>
                    <span className="feature-check">✓</span>
                    <div><h3>{f.title}</h3><p>{f.desc}</p></div>
                  </div>
                ))}
                {showMoreBrokerage && brokerageExtra.map((f, i) => (
                  <div className="plan-feature" key={`extra-${i}`}>
                    <span className="feature-check">✓</span>
                    <div><h3>{f.title}</h3><p>{f.desc}</p></div>
                  </div>
                ))}
              </div>
              <button className="show-more-btn" onClick={() => setShowMoreBrokerage(!showMoreBrokerage)}>
                {showMoreBrokerage ? 'Show Less Features' : `Show More Features (${brokerageExtra.length} more)`} →
              </button>
              <a href="#quote-form" className="btn btn-primary btn-full">Get Custom Pricing ✓</a>
            </div>
            <div className="plan-card plan-card-enterprise">
              <h2>Enterprise Plan</h2>
              <p className="plan-subtitle">Pricing for MLS &amp; Associations</p>
              <p className="plan-desc">The enterprise plan is tailored to your organization's MLS integrations. Pricing is based on active producing agents that scales up and down with your members.</p>
              <div className="plan-features">
                {enterpriseFeatures.map((f, i) => (
                  <div className="plan-feature" key={i}>
                    <span className="feature-check">✓</span>
                    <div><h3>{f.title}</h3><p>{f.desc}</p></div>
                  </div>
                ))}
                {showMoreEnterprise && enterpriseExtra.map((f, i) => (
                  <div className="plan-feature" key={`extra-${i}`}>
                    <span className="feature-check">✓</span>
                    <div><h3>{f.title}</h3><p>{f.desc}</p></div>
                  </div>
                ))}
              </div>
              <button className="show-more-btn" onClick={() => setShowMoreEnterprise(!showMoreEnterprise)}>
                {showMoreEnterprise ? 'Show Less Features' : `Show More Features (${enterpriseExtra.length} more)`} →
              </button>
              <a href="#quote-form" className="btn btn-primary btn-full">Get Custom Pricing ✓</a>
            </div>
          </div>
        </div>
      </section>

      <section className="pricing-orgs">
        <div className="section-container">
          <h2 className="section-title">Designed for Real Estate Organizations</h2>
          <p className="section-subtitle">Whether you're managing hundreds or thousands of agents, Homezai scales to meet your needs.</p>
          <div className="orgs-grid">
            <div className="org-card"><h3>Realtor Associations</h3><p>Provide value to your members with a modern showing management platform.</p></div>
            <div className="org-card"><h3>Multiple Listing Services</h3><p>Enhance your MLS offering with integrated showing management.</p></div>
            <div className="org-card"><h3>Brokerages</h3><p>Empower your agents with tools that save time and close more deals.</p></div>
            <div className="org-card"><h3>Teams &amp; Individual Agents</h3><p>Professional showing management for teams of any size.</p></div>
          </div>
        </div>
      </section>

      <section className="pricing-why">
        <div className="section-container">
          <h2 className="section-title">Why Choose Homezai Enterprise?</h2>
          <p className="section-subtitle">Built specifically for real estate professionals who demand the best.</p>
          <div className="why-grid">
            <div className="why-card">
              <div className="why-icon">🔒</div>
              <h3>Enterprise Security</h3>
              <p>Cloud-based application hosted on Amazon Web Services (AWS) and regular security audits to protect your data.</p>
            </div>
            <div className="why-card">
              <div className="why-icon">🎧</div>
              <h3>Dedicated Support</h3>
              <p>Your dedicated account manager and priority support team are here to help 24/7.</p>
            </div>
            <div className="why-card">
              <div className="why-icon">📊</div>
              <h3>Data Ownership</h3>
              <p>Your data is always yours. Export, backup, and control your information at any time.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="quote-form" className="pricing-quote">
        <div className="section-container">
          <h2 className="section-title">Get Your Custom Pricing Quote</h2>
          <p className="section-subtitle">Tell us about your organization and we'll provide a tailored pricing proposal.</p>
          <form className="quote-form" onSubmit={handleQuoteSubmit}>
            <div className="form-row">
              <div className="form-group"><label>First Name *</label><input type="text" placeholder="First Name" required value={quoteForm.firstName} onChange={handleQuoteChange('firstName')} /></div>
              <div className="form-group"><label>Last Name *</label><input type="text" placeholder="Last Name" required value={quoteForm.lastName} onChange={handleQuoteChange('lastName')} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Work Email *</label><input type="email" placeholder="Work Email" required value={quoteForm.workEmail} onChange={handleQuoteChange('workEmail')} /></div>
              <div className="form-group"><label>Phone Number *</label><input type="tel" placeholder="Phone Number" required value={quoteForm.phone} onChange={handleQuoteChange('phone')} /></div>
            </div>
            <div className="form-group"><label>Organization Name *</label><input type="text" placeholder="Organization Name" required value={quoteForm.orgName} onChange={handleQuoteChange('orgName')} /></div>
            <div className="form-row">
              <div className="form-group"><label>Number of Agents *</label><input type="number" placeholder="1200" min="1" required value={quoteForm.numAgents} onChange={handleQuoteChange('numAgents')} /></div>
              <div className="form-group">
                <label>Organization Type *</label>
                <select required value={quoteForm.orgType} onChange={handleQuoteChange('orgType')}>
                  <option value="" disabled>Select organization type</option>
                  <option>Realtor Association</option>
                  <option>Multiple Listing Service</option>
                  <option>Brokerage</option>
                  <option>Team</option>
                  <option>Individual Agent</option>
                </select>
              </div>
            </div>
            <div className="form-group"><label>Current Showing Management System (if any)</label><input type="text" placeholder="e.g., ShowingTime, Centralized Showings, etc." value={quoteForm.currentSystem} onChange={handleQuoteChange('currentSystem')} /></div>
            <div className="form-group"><label>Additional Information</label><textarea placeholder="Tell us more about your needs, timeline, or any specific requirements..." rows="4" value={quoteForm.additionalInfo} onChange={handleQuoteChange('additionalInfo')}></textarea></div>
            <button type="submit" className="btn btn-primary btn-full btn-lg">Request Pricing Quote</button>
            <p className="form-legal">By submitting this form, you agree to our <Link to="/privacy">Privacy Policy</Link> and <Link to="/terms">Terms of Service</Link>.</p>
          </form>
        </div>
      </section>

      <section className="pricing-bottom-cta">
        <div className="section-container">
          <h2 className="section-title light">Ready to Transform Your Showing Management?</h2>
          <p className="section-subtitle light">Join thousands of real estate professionals already using Showzy showings management by Homezai to streamline their showings process.</p>
          <div className="cta-actions">
            <a href="#quote-form" className="btn btn-white">Get Pricing Quote ✓</a>
            <Link to="/#demo" className="btn btn-outline-light">Schedule a Demo</Link>
          </div>
        </div>
      </section>
    </div>
  )
}

/* ===== Integrations Page ===== */
function IntegrationsPage() {
  useEffect(() => { document.title = 'Integrations - Homezai' }, [])
  const categories = [
    {
      name: "Multiple Listing Service (MLS)", items: [
        { name: "CincyMLS", desc: "MLS of Greater Cincinnati" },
        { name: "SWFL MLS", desc: "Bonita-Estero Realtors\u00AE" },
      ]
    },
    {
      name: "Customer Relationship Management (CRM)", items: [
        { name: "BoldTrail by Inside Real Estate", desc: "Complete real estate CRM platform" },
      ]
    },
    {
      name: "Calendars", items: [
        { name: "Apple Calendar", desc: "Seamless scheduling with Apple Calendar" },
        { name: "Calendly", desc: "Automated scheduling and booking" },
        { name: "Google Calendar", desc: "Sync appointments with Google Calendar" },
        { name: "Microsoft Outlook Calendar", desc: "Integrate with Outlook scheduling" },
      ]
    },
    {
      name: "Leads", items: [
        { name: "Homes.com", desc: "Lead generation platform" },
        { name: "Homezai", desc: "Internal lead management" },
        { name: "LinkedIn", desc: "Professional networking leads" },
        { name: "Meta (Facebook, Instagram)", desc: "Social media advertising" },
        { name: "Realtor.com", desc: "Premier real estate marketplace" },
        { name: "TikTok", desc: "Short-form video marketing" },
        { name: "Zillow", desc: "Leading real estate marketplace" },
      ]
    },
    {
      name: "Design Apps", items: [
        { name: "Canva", desc: "Professional design and marketing materials" },
        { name: "Maxa Designs", desc: "Real estate marketing and design solutions" },
      ]
    },
    {
      name: "User Roster Feeds", items: [
        { name: "Berkshire Hathaway HomeServices (BoldTrail)", desc: "Agent roster synchronization" },
        { name: "Weichert Realtors (BoldTrail)", desc: "Agent roster synchronization" },
      ]
    },
  ]
  return (
    <div className="integrations-page">
      <section className="integrations-hero">
        <div className="section-container">
          <span className="hero-badge">Seamless Integrations</span>
          <h1 className="section-title">Connect Homezai with Your Favorite Tools</h1>
          <p className="section-subtitle">Homezai integrates seamlessly with the tools you already use. Streamline your workflow and maximize productivity with our comprehensive integration ecosystem.</p>
          <div className="integrations-pills">
            <span className="pill">Easy Setup</span>
            <span className="pill">Real-time Sync</span>
            <span className="pill">Secure &amp; Reliable</span>
          </div>
        </div>
      </section>

      <section className="integrations-list">
        <div className="section-container">
          {categories.map((cat, ci) => (
            <div className="integration-category" key={ci}>
              <div className="category-header">
                <h2>{cat.name}</h2>
                <span className="category-count">{cat.items.length} integration{cat.items.length !== 1 ? 's' : ''} available</span>
              </div>
              <div className="integration-cards">
                {cat.items.map((item, ii) => (
                  <div className="integration-card" key={ii}>
                    <div className="integration-card-content">
                      <h3>{item.name}</h3>
                      <p>{item.desc}</p>
                    </div>
                    <span className="integration-link-icon">↗</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="integrations-cta">
        <div className="section-container">
          <h2 className="section-title light">Need a Custom Integration?</h2>
          <p className="section-subtitle light">Our team can work with you to build custom integrations tailored to your specific needs.</p>
          <div className="cta-actions">
            <Link to="/#demo" className="btn btn-white">Schedule a Demo</Link>
            <a href="mailto:Info@Homezai.com" className="btn btn-outline-light">Contact Sales</a>
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
        <Route path="/support" element={<Navigate to="/" replace />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/integrations" element={<IntegrationsPage />} />
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
