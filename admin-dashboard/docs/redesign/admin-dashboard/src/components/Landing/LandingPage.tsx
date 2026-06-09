import React from 'react';
import { Header } from './Header';
import { HeroSection } from './HeroSection';
import { FeaturesSection } from './FeaturesSection';
import { CommunitySection } from './CommunitySection';
import { ProcessSection } from './ProcessSection';
import { FaqSection } from './FaqSection';
import { Footer } from './Footer';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="overflow-hidden">
        <HeroSection />
        <FeaturesSection />
        <CommunitySection />
        <ProcessSection />
        <FaqSection />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
