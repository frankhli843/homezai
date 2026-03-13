import './App.css'

function App() {
  return (
    <div className="app">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <a href="#" className="nav-logo">
            <svg className="logo-icon" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="18" cy="18" r="18" fill="#3B6CF6"/>
              <path d="M12 22V16L18 12L24 16V22L18 26L12 22Z" fill="white"/>
              <path d="M18 12V26" stroke="#3B6CF6" strokeWidth="1.5"/>
              <path d="M12 16L24 22" stroke="#3B6CF6" strokeWidth="1"/>
              <path d="M24 16L12 22" stroke="#3B6CF6" strokeWidth="1"/>
            </svg>
            <span className="logo-text">homezai</span>
          </a>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#benefits">Benefits</a>
            <a href="#integrations">Integrations</a>
            <a href="#pricing">Pricing</a>
            <a href="#demo">Demo</a>
            <a href="#login">Login</a>
          </div>
          <div className="nav-right">
            <a href="#support" className="nav-support">Support</a>
            <a href="#contact" className="btn btn-primary btn-pill nav-cta">Talk to Sales</a>
          </div>
        </div>
      </nav>

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
              <a href="#demo" className="btn btn-primary">
                Schedule a Demo <span className="arrow">→</span>
              </a>
              <a href="#features" className="btn btn-outline">
                Learn More
              </a>
            </div>
          </div>

          {/* Hero Collage - CSS mockups matching Figma */}
          <div className="hero-image">
            <div className="hero-collage">
              {/* Panel 1: Property Search */}
              <div className="mockup-card mockup-search">
                <div className="mockup-header">
                  <span className="mockup-header-text">ShowingsPro</span>
                  <div className="mockup-dots">
                    <span className="mockup-dot"></span>
                    <span className="mockup-dot"></span>
                    <span className="mockup-dot"></span>
                  </div>
                </div>
                <div className="mockup-body">
                  <div className="mockup-search-bar">
                    <span className="search-icon">🔍</span>
                    <span>Search by address, city, or...</span>
                  </div>
                  <div className="mockup-filters">
                    <span className="mockup-filter-pill">Property Type</span>
                    <span className="mockup-filter-pill">All Types</span>
                    <span className="mockup-filter-pill">All Status</span>
                  </div>
                  <div className="mockup-property-card">
                    <div className="property-img"></div>
                    <div className="property-info">
                      <div className="property-price">$425,000</div>
                      <div className="property-address">123 Maple Street, Springfield, IL 62701</div>
                      <div className="property-details">
                        <span>🛏 3 beds</span>
                        <span>🛁 2 baths</span>
                        <span>📐 1,850 sqft</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Panel 2: AI Assistant */}
              <div className="mockup-card mockup-chat">
                <div className="chat-header">
                  <span>AI Assistant</span>
                  <span className="chat-close">✕</span>
                </div>
                <div className="chat-body">
                  <div className="chat-bubble">
                    Hi! I'm your AI assistant. I can help you schedule showings, manage listings, and answer property questions.
                  </div>
                  <div className="chat-input">
                    <span>Type a message...</span>
                  </div>
                </div>
              </div>

              {/* Panel 3: Schedule View */}
              <div className="mockup-card mockup-schedule">
                <div className="mockup-header">
                  <span className="mockup-header-text">ShowingsPro</span>
                  <div className="mockup-dots">
                    <span className="mockup-dot"></span>
                    <span className="mockup-dot"></span>
                    <span className="mockup-dot"></span>
                  </div>
                </div>
                <div className="schedule-body">
                  <div className="schedule-item">
                    <span className="schedule-time">9:00 AM</span>
                    <span className="schedule-dot confirmed"></span>
                    <span className="schedule-label">123 Oak Ave - Confirmed</span>
                  </div>
                  <div className="schedule-item">
                    <span className="schedule-time">10:30 AM</span>
                    <span className="schedule-dot scheduled"></span>
                    <span className="schedule-label">456 Pine Rd - Scheduled</span>
                  </div>
                  <div className="schedule-item">
                    <span className="schedule-time">1:00 PM</span>
                    <span className="schedule-dot confirmed"></span>
                    <span className="schedule-label">789 Elm St - Confirmed</span>
                  </div>
                  <div className="schedule-item">
                    <span className="schedule-time">3:00 PM</span>
                    <span className="schedule-dot completed"></span>
                    <span className="schedule-label">321 Birch Ln - Completed</span>
                  </div>
                </div>
              </div>

              {/* Panel 4: Map View */}
              <div className="mockup-card mockup-map">
                <div className="mockup-header">
                  <span className="mockup-header-text">Route Map</span>
                  <div className="mockup-dots">
                    <span className="mockup-dot"></span>
                    <span className="mockup-dot"></span>
                    <span className="mockup-dot"></span>
                  </div>
                </div>
                <div className="map-area">
                  <div className="map-pin green" style={{top: '20px', left: '30px'}}>1</div>
                  <div className="map-pin purple" style={{top: '50px', left: '80px'}}>2</div>
                  <div className="map-pin green" style={{top: '30px', left: '140px'}}>3</div>
                  <div className="map-pin orange" style={{top: '70px', left: '180px'}}>4</div>
                  <div className="map-pin green" style={{top: '90px', left: '60px'}}>5</div>
                  <div className="map-legend">
                    <div className="legend-title">Map Legend</div>
                    <div className="legend-item"><span className="legend-dot" style={{background: 'var(--purple)'}}></span> Scheduled</div>
                    <div className="legend-item"><span className="legend-dot" style={{background: 'var(--green)'}}></span> Confirmed</div>
                    <div className="legend-item"><span className="legend-dot" style={{background: 'var(--orange)'}}></span> Completed</div>
                    <div className="legend-item"><span className="legend-dot" style={{background: 'var(--red)'}}></span> Cancelled</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subtle decoration between sections */}
      <div className="hero-decoration"></div>

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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <h3>Smart Scheduling</h3>
              <p>AI-powered scheduling that considers agent availability, property access times, and client preferences to find the perfect showing slot.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <h3>Automated Routing</h3>
              <p>Optimize showing routes automatically to minimize travel time and maximize the number of properties agents can show in a day.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h3>Agent Safety</h3>
              <p>Built-in safety protocols including real-time location sharing, check-in systems, and emergency alerts for agent protection.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <h3>AI Assistant</h3>
              <p>Conversational AI that handles showing requests, answers property questions, and manages follow-ups automatically.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <h3>White-Label Platform</h3>
              <p>Fully brandable platform that operates under your brokerage name, colors, and domain—your clients never see Homezai.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <h3>Analytics &amp; Insights</h3>
              <p>Comprehensive analytics on showing performance, client engagement, and market trends to help you make data-driven decisions.</p>
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
              <a href="#demo" className="btn btn-outline">Get Started</a>
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
              <a href="#demo" className="btn btn-primary">Get Started</a>
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
              <a href="#contact" className="btn btn-outline">Contact Sales</a>
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
            <a href="#contact" className="btn btn-white">Schedule a Demo →</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-brand">
              <a href="#" className="nav-logo">
                <svg className="logo-icon" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="18" cy="18" r="18" fill="#3B6CF6"/>
                  <path d="M12 22V16L18 12L24 16V22L18 26L12 22Z" fill="white"/>
                  <path d="M18 12V26" stroke="#3B6CF6" strokeWidth="1.5"/>
                  <path d="M12 16L24 22" stroke="#3B6CF6" strokeWidth="1"/>
                  <path d="M24 16L12 22" stroke="#3B6CF6" strokeWidth="1"/>
                </svg>
                <span className="logo-text">homezai</span>
              </a>
              <p className="footer-tagline">AI-powered showing management for modern real estate teams.</p>
            </div>
            <div className="footer-links-group">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#integrations">Integrations</a>
              <a href="#demo">Request Demo</a>
            </div>
            <div className="footer-links-group">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Careers</a>
              <a href="#">Blog</a>
              <a href="#">Contact</a>
            </div>
            <div className="footer-links-group">
              <h4>Support</h4>
              <a href="#">Help Center</a>
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
    </div>
  )
}

export default App
