import { Button } from "@/components/ui/button";
import { Eyebrow, MAXW, Reveal } from "./shared";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section className="grain relative overflow-hidden">
      <div
        aria-hidden="true"
        className="dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,black,transparent)]"
      />
      <div
        aria-hidden="true"
        className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-primary/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-24 hidden h-[560px] w-[560px] -translate-x-1/2 rounded-full border border-ink/10 lg:block"
      />
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-40 hidden h-[400px] w-[400px] -translate-x-1/2 rounded-full border border-ink/10 lg:block"
      />

      <div
        className={cn(
          MAXW,
          "relative px-4 pb-20 pt-32 text-center md:px-8 md:pb-28 md:pt-44 lg:px-12 lg:pb-36 lg:pt-56",
        )}
      >
        <Reveal className="anim-fade-up">
          <Eyebrow>Verifiable waste evacuation system</Eyebrow>
        </Reveal>
        <h1
          className="anim-fade-up mx-auto mt-4 max-w-3xl font-display text-5xl leading-[1.05] text-ink md:text-[68px]"
          style={{ animationDelay: "90ms" }}
        >
          Waste isn't the problem. Verifying it was cleared is the challenge.
        </h1>
        <p
          className="anim-fade-up mx-auto mt-5 max-w-2xl text-lg leading-relaxed"
          style={{ animationDelay: "180ms" }}
        >
          The Akwa Ibom State Government pays contractors to evacuate roadside
          dump points across Uyo. In July 2026, several contractors were
          suspended after a flood exposed sites left uncleared for weeks
          — despite regular payment. Nobody knew until the flood forced an
          inspection.
        </p>
        <div
          className="anim-fade-up mt-8 flex flex-wrap justify-center gap-3"
          style={{ animationDelay: "270ms" }}
        >
          <Button asChild variant="secondary">
            <a href="#how-it-works">See how it works</a>
          </Button>
          <Button asChild>
            <a href="#demo">Live demo</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function InfraBand() {
  return (
    <section className="border-y border-hairline bg-canvas py-10 md:py-14">
      <div className={cn(MAXW, "text-center")}>
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-soft">
            What runs Mundus
          </p>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed">
            Hosted on Pxxl. Every field action and failure traced with WatchUp —
            the same verification discipline we ask of contractors.
          </p>
        </Reveal>
        <Reveal delay={80}>
          <div className="mt-6 flex items-center justify-center gap-8">
            <a
              href="https://pxxl.app"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Pxxl"
              className="rounded-full bg-ink px-4 py-2 transition-opacity hover:opacity-90"
            >
              <img
                src="/logos/pxxl-app.avif"
                alt="Pxxl"
                className="h-6 w-auto"
                loading="lazy"
              />
            </a>
            <span aria-hidden="true" className="h-6 w-px bg-hairline" />
            <a
              href="https://watchup.site"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="WatchUp"
            >
              <img
                src="/logos/watchup_logo.webp"
                alt="WatchUp"
                className="h-5 w-auto opacity-80 transition-opacity hover:opacity-100"
                loading="lazy"
              />
            </a>
            <span aria-hidden="true" className="h-6 w-px bg-hairline" />
            <a
              href="https://bach.io"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Bachs"
            >
              <img
                src="/logos/bach-logo.png"
                alt="Bachs"
                className="h-7 w-auto opacity-80 transition-opacity hover:opacity-100"
                loading="lazy"
              />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
