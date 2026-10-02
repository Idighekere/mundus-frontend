import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/landing/chrome";
import { Hero, InfraBand } from "@/components/landing/hero";
import { Problem, Roles } from "@/components/landing/roles-problem";
import { HowItWorks, WhyItMatters } from "@/components/landing/how-it-works";
import { Demo } from "@/components/landing/evidence-demo";
import { Solution } from "@/components/landing/solution";
import { BuiltForUyo, Faq } from "@/components/landing/closing";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const [activeSection, setActiveSection] = useState("how-it-works");

  // Scroll-spy for the pill nav.
  useEffect(() => {
    const ids = ["how-it-works", "why-mundus", "solution", "demo", "faq"];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActiveSection(e.target.id);
        }
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-canvas font-body text-ink-soft">
      <SiteHeader activeSection={activeSection} />
      <main id="top">
        <Hero />
        <InfraBand />
        <Roles />
        <Problem />
        <Solution />
        <HowItWorks />
        <WhyItMatters />
        <Demo />
        <Faq />
        <BuiltForUyo />
        <SiteFooter />
      </main>
    </div>
  );
}
