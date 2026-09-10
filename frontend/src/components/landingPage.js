// Landing Page Component for EventSphere AI

export const renderLandingPage = (container, { onGetStarted, onExplore }) => {
  container.innerHTML = `
    <div class="landing-hero">
      <div class="landing-badge">
        <span class="pulse-dot"></span> NEXT-GEN EVENT INTELLIGENCE
      </div>
      <h1 class="landing-title">
        Intelligent Event Management <br /><span class="gradient-text">& AI-Powered Insights</span>
      </h1>
      <p class="landing-subtitle">
        Empower your organization with predictive demand forecasting, real-time attendance tracking, operational risk detection, and personalized participant recommendations.
      </p>
      
      <div class="landing-cta-group">
        <button id="btn-landing-start" class="btn btn-primary btn-lg">
          Get Started
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </button>
        <button id="btn-landing-explore" class="btn btn-outline btn-lg">
          Explore Platform
        </button>
      </div>

      <div class="hero-stats-bar glass-card">
        <div class="hero-stat-item">
          <span class="hero-stat-value">99.4%</span>
          <span class="hero-stat-label">Analytics Accuracy</span>
        </div>
        <div class="hero-stat-divider"></div>
        <div class="hero-stat-item">
          <span class="hero-stat-value">Real-Time</span>
          <span class="hero-stat-label">Check-in Telemetry</span>
        </div>
        <div class="hero-stat-divider"></div>
        <div class="hero-stat-item">
          <span class="hero-stat-value">Gemini AI</span>
          <span class="hero-stat-label">Executive Summaries</span>
        </div>
      </div>
    </div>

    <!-- Core Features Grid -->
    <section id="section-features" class="landing-features">
      <div class="section-header">
        <h2 class="section-title">Everything You Need to Host Exceptional Events</h2>
        <p class="section-desc">Designed for modern event organizers, enterprise admins, and attendees.</p>
      </div>

      <div class="features-grid">
        <div class="glass-card feature-card">
          <div class="feature-icon feature-icon-teal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
          <h3>Event Management</h3>
          <p>Seamlessly publish events, manage venue details, capacity limits, and monitor registration lifecycles from draft to completion.</p>
        </div>

        <div class="glass-card feature-card">
          <div class="feature-icon feature-icon-teal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
          </div>
          <h3>Smart Analytics</h3>
          <p>Track capacity utilization, daily registration velocity, check-in attendance rates, and cancellation trends with SVG charts.</p>
        </div>

        <div class="glass-card feature-card">
          <div class="feature-icon feature-icon-amber">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
          </div>
          <h3>AI-Powered Insights</h3>
          <p>Detect operational risks like low attendance or cancellation spikes before they happen with rule engines and Gemini AI summaries.</p>
        </div>

        <div class="glass-card feature-card">
          <div class="feature-icon feature-icon-teal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          </div>
          <h3>Personalized Recommendations</h3>
          <p>Expose attendees to relevant upcoming conferences, summits, and workshops matching their profile interests with match scores.</p>
        </div>
      </div>
    </section>
  `;

  container.querySelector('#btn-landing-start')?.addEventListener('click', onGetStarted);
  container.querySelector('#btn-landing-explore')?.addEventListener('click', () => {
    container.querySelector('#section-features')?.scrollIntoView({ behavior: 'smooth' });
  });
};
