import { Link } from "@tanstack/react-router";
import { Flag, XCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Eyebrow, MAXW, Reveal } from "./shared";
import { cn } from "@/lib/utils";

export function Roles() {
  return (
    <section className="bg-paper py-14 md:py-20 lg:py-28">
      <div className={MAXW}>
        <Reveal className="mx-auto max-w-2xl text-center">
          <Eyebrow>Who it's for</Eyebrow>
          <h2 className="mt-2 font-display text-4xl text-ink md:text-[48px]">
            Made for three kinds of people
          </h2>
          <p className="mt-3 leading-relaxed">
            Each role sees only what it needs — nothing more to learn, nowhere
            to get lost.
          </p>
        </Reveal>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Reveal>
            <article className="flex h-full flex-col rounded-2xl border border-hairline bg-canvas p-6">
              <Eyebrow>Agency</Eyebrow>
              <h3 className="mt-1 font-display text-2xl text-ink">
                Reads the ranking
              </h3>
              <p className="mt-1 text-sm leading-relaxed">
                Overdue first, flags in the open, timelines per site.
              </p>
              <div className="mt-4 space-y-1.5 rounded-xl bg-paper p-3">
                {(
                  [
                    ["Nwaniba", "12d", true],
                    ["IBB Way", "11d", true],
                    ["Oran", "1d", false],
                  ] as [string, string, boolean][]
                ).map(([n, d, hot]) => (
                  <div
                    key={n}
                    className="flex items-center justify-between rounded-lg bg-canvas px-3 py-1.5 text-xs"
                  >
                    <span className="font-semibold text-ink">{n}</span>
                    <span
                      className={cn(
                        "font-mono font-bold",
                        hot ? "text-[#be3b3b]" : "text-ink",
                      )}
                    >
                      {d}
                    </span>
                  </div>
                ))}
              </div>
              <Button asChild variant="secondary" className="mt-4 w-full">
                <Link to="/agency/dashboard">Open dashboard</Link>
              </Button>
            </article>
          </Reveal>
          <Reveal delay={100}>
            <article className="flex h-full flex-col rounded-2xl border border-hairline bg-canvas p-6">
              <Eyebrow>Supervisor</Eyebrow>
              <h3 className="mt-1 font-display text-2xl text-ink">
                Proves it on site
              </h3>
              <p className="mt-1 text-sm leading-relaxed">
                In-app camera, GPS locked at capture, before → after.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <img
                  src="/evidence/before.jpg"
                  alt="Before clearance"
                  className="aspect-[4/3] w-full rounded-xl object-cover"
                  loading="lazy"
                />
                <img
                  src="/evidence/after.jpg"
                  alt="After clearance"
                  className="aspect-[4/3] w-full rounded-xl object-cover"
                  loading="lazy"
                />
              </div>
              <Button asChild variant="secondary" className="mt-4 w-full">
                <Link to="/contractor/sign-in">Field app</Link>
              </Button>
            </article>
          </Reveal>
          <Reveal delay={200}>
            <article className="flex h-full flex-col rounded-2xl border border-hairline bg-canvas p-6">
              <Eyebrow>Reporter</Eyebrow>
              <h3 className="mt-1 font-display text-2xl text-ink">
                Flags it early
              </h3>
              <p className="mt-1 text-sm leading-relaxed">
                One tap, one site, one personal link. Photo attached.
              </p>
              <div className="mt-4 rounded-xl bg-paper p-3 text-center">
                <p className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 font-action text-sm font-medium text-white">
                  <Flag size={16} weight="fill" /> This site is full
                </p>
                <p className="mt-2 font-mono text-[11px] text-ink-soft">
                  12h limit · photo attached
                </p>
              </div>
              <Button asChild variant="secondary" className="mt-4 w-full">
                <Link
                  to="/r/$token"
                  params={{ token: "demo-nwaniba-reporter-link" }}
                >
                  Example report link
                </Link>
              </Button>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

const FAILED_ALTERNATIVES: [string, string][] = [
  ["Paper trip sheets", "No verifiable record"],
  ["Gallery photo uploads", "Place + time unknown"],
  ["Chance inspection", "After the damage"],
];

export function Problem() {
  return (
    <section className="grain relative overflow-hidden bg-primary-deep py-14 md:py-20 lg:py-28">
      <div
        aria-hidden="true"
        className="dot-grid-light absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,black,transparent)]"
      />
      <div className={cn(MAXW, "relative")}>
        <Reveal className="max-w-2xl">
          <p className="font-display text-sm uppercase tracking-[0.2em] text-[#ffa034]">
            The problem
          </p>
          <h2 className="mt-2 font-display text-4xl leading-tight text-white md:text-[48px]">
            Paid for,
            <br />
            but never proven
          </h2>
          <p className="mt-4 leading-relaxed text-white/80">
            Collection is described as "occasional," and failures are only
            discovered after they've already caused damage. Failures surface by
            flood or surprise visit, never by a system.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <figure className="relative mt-10 overflow-hidden rounded-2xl">
            <img
              src="/evidence/AKSEPWMA-Chairman-Prince-Ikim-at-a-location-where-the-waste-was-not-evacuated.png"
              alt="AKSEPWMA Chairman Prince Ikim at a location where the waste was not evacuated"
              className="h-72 w-full object-cover md:h-96"
              loading="lazy"
            />
            <figcaption className="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] rounded-full bg-ink/70 px-3 py-1 font-mono text-[11px] font-bold text-white">
              AKSEPWMA CHAIRMAN PRINCE IKIM · SITE LEFT UNCLEARED
            </figcaption>
          </figure>
          <p className="mt-2 text-xs text-white/60">
            AKSEPWMA Chairman Prince Ikim at a location where the waste was not evacuated. Photo:{" "}
            <a
              href="https://www.premiumtimesng.com/regional/south-south-regional/895907-akwa-ibom-suspends-waste-evacuation-officers-after-devastating-floods.html"
              target="_blank"
              rel="noreferrer noopener"
              className="underline hover:text-white"
            >
              Premium Times
            </a>
            .
          </p>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-12 rounded-2xl bg-white/10 p-6 backdrop-blur md:p-8">
            <p className="font-display text-sm uppercase tracking-[0.2em] text-[#ffa034]">
              Why nothing catches it today
            </p>
            <ul className="mt-4 divide-y divide-white/10">
              {FAILED_ALTERNATIVES.map(([label, note]) => (
                <li
                  key={label}
                  className="flex items-center justify-between gap-4 py-3.5"
                >
                  <span className="font-semibold text-white">{label}</span>
                  <span className="flex shrink-0 items-center gap-2 font-mono text-xs uppercase tracking-wider text-white/50">
                    <XCircle size={16} weight="fill" /> {note}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <p className="mt-4 text-xs leading-relaxed text-white/60">
          2024 landfill study · AKSEPWMA public reports. The same failure
          pattern is documented in Lagos, Nasarawa and the FCT — structural, not
          local.
        </p>

        <Reveal delay={120}>
          <div className="mt-10 rounded-2xl border border-[#ffa034]/40 bg-[#ffa034]/10 p-6 text-center md:p-8">
            <p className="mx-auto max-w-2xl font-display text-2xl leading-snug text-white md:text-[28px]">
              Government pays for evacuation. Government has no way to confirm
              evacuation happens.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
