import { useState } from "react";
import { Eyebrow, MAXW, Reveal } from "./shared";
import { cn } from "@/lib/utils";

const FAQS: [string, string][] = [
  [
    "How is this different from a reporting app?",
    "Mundus is a service-verification platform, not a complaint box. Proof of delivery — the way a delivery app tracks a driver. It treats waste evacuation as work to be proven, not complaints to be collected.",
  ],
  [
    "Does it require citizens to participate?",
    "No. The system runs on the contractor schedule — check-ins, geofence validation, overdue ranking. A designated local reporter can flag a full site early, but that is an accelerant, optional and never required.",
  ],
  [
    "What happens to a photo taken outside the geofence?",
    'It is kept and flagged "location mismatch" with the recorded distance. The agency sees the flag; nothing is silently dropped or auto-rejected.',
  ],
  [
    'Has "no pay without proof" been tried before?',
    'Yes — Edo State already runs a "no verified service, no pay" policy, enforced manually through resident complaints. Mundus makes that verification automatic, photo-evidenced, and immediate — not dependent on someone filing a complaint after the fact.',
  ],
  [
    "Who pays for this?",
    "AKSEPWMA and similar municipal agencies — B2G, inside the existing sanitation operations budget, not a new spending category. Mundus doesn\u2019t ask government to spend more. It shows them what they\u2019re already paying for.",
  ],
  [
    "Does Mundus hold money or pay crews?",
    "No. It verifies work so the agency can tie payroll to proof — the payment itself is policy, outside the software.",
  ],
];

export function Faq() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-24 bg-paper py-14 md:py-20 lg:py-28">
      <div className={cn(MAXW, "max-w-[900px]")}>
        <Eyebrow>FAQ</Eyebrow>
        <h2 className="mt-2 font-display text-4xl text-ink md:text-[48px]">
          Six questions, straight answers
        </h2>
        <div className="mt-8 divide-y divide-hairline rounded-2xl border border-hairline bg-canvas px-6">
          {FAQS.map(([q, a], i) => (
            <div key={q} className="py-2">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
                className="flex min-h-[44px] w-full cursor-pointer items-center gap-4 py-3 text-left"
              >
                <span className="font-mono text-sm text-ink-soft">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 font-semibold text-ink">{q}</span>
                <span
                  className={cn(
                    "text-xl text-ink-soft transition-transform",
                    openFaq === i && "rotate-45",
                  )}
                >
                  +
                </span>
              </button>
              {openFaq === i ? (
                <p className="pb-4 pl-10 pr-4 leading-relaxed">{a}</p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BuiltForUyo() {
  return (
    <section className="py-14 md:py-20 lg:py-28">
      <div className={MAXW}>
        <Reveal className="mx-auto max-w-2xl text-center">
          <Eyebrow>Built for Uyo</Eyebrow>
          <h2 className="mt-2 font-display text-4xl text-ink md:text-[48px]">
            Our city, our record
          </h2>
          <p className="mt-3 leading-relaxed">
            Every dump point, every contractor, every check-in in this demo
            reflects real locations across the city — Nwaniba, IBB Way — built
            by students who live here, for the agency that serves it.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
