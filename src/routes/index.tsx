import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Camera, MapPin, ShieldCheck } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/misc'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <main>
      <section className="bg-primary text-on-primary">
        <div className="mx-auto max-w-[1200px] px-4 py-16 md:py-24">
          <p className="font-display text-sm uppercase tracking-[0.2em] text-[#ffa034]">Waste evacuation verification</p>
          <h1 className="mt-4 max-w-3xl font-display text-6xl leading-[1.05] text-white md:text-[83px]">
            Every dump point cleared. Every clearance proven.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/85">
            Mundus verifies waste evacuation with before/after photos, GPS-at-capture and
            geofence checks — so the agency sees what is overdue, not what is claimed.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button asChild className="bg-white text-primary hover:bg-cloud">
              <Link to="/agency/dashboard">View agency dashboard <ArrowRight size={18} /></Link>
            </Button>
            <Link to="/agency/sign-in" className="inline-flex min-h-[44px] items-center rounded-xl bg-white/10 px-6 py-3 font-action text-sm font-bold text-white hover:bg-white/20">
              Agency sign in
            </Link>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { icon: <Camera size={22} />, title: 'Before / after proof', body: 'In-app camera only. No gallery uploads.' },
              { icon: <MapPin size={22} />, title: 'Geofence checked', body: 'Photo GPS vs registered point, 100 m radius.' },
              { icon: <ShieldCheck size={22} />, title: 'Overdue ranked', body: 'Most overdue first. Critical past 10 days.' },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl bg-white/10 p-6">
                <div className="text-[#ffa034]">{f.icon}</div>
                <h3 className="mt-3 font-display text-2xl text-white">{f.title}</h3>
                <p className="mt-1 text-white/80">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-canvas">
        <div className="mx-auto max-w-[1200px] px-4 py-16 md:py-24">
          <p className="font-display text-sm uppercase tracking-[0.2em] text-primary">How it works</p>
          <h2 className="mt-2 font-display text-4xl text-ink md:text-[40px]">Supervisor proves. Agency verifies.</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              { step: '01', title: 'Supervisor visits site', body: 'Assigned dump points only. Before photo locks GPS + timestamp at capture.' },
              { step: '02', title: 'Clears, then proves it', body: 'After photo completes the pair. Location mismatch or reused photo is flagged, not hidden.' },
              { step: '03', title: 'Agency acts on overdue', body: 'Dashboard sorts most-overdue first. Side-by-side pairs confirm the clearance visually.' },
            ].map((s) => (
              <Card key={s.step}>
                <p className="font-display text-sm uppercase tracking-widest text-primary">{s.step}</p>
                <h3 className="mt-2 font-display text-[28px] text-ink">{s.title}</h3>
                <p className="mt-2 leading-relaxed">{s.body}</p>
              </Card>
            ))}
          </div>
          <div className="mt-10">
            <Button asChild>
              <Link to="/agency/dashboard">Open the live dashboard <ArrowRight size={18} /></Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-cloud">
        <div className="mx-auto max-w-[1200px] px-4 py-16 md:py-24">
          <p className="font-display text-sm uppercase tracking-[0.2em] text-primary">Explore the demo</p>
          <h2 className="mt-2 font-display text-4xl text-ink md:text-[40px]">Every role, one link away</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <Card>
              <h3 className="font-display text-[28px] text-ink">Agency portal</h3>
              <p className="mt-2 leading-relaxed">Overdue ranking, site timelines, contractors, reporters, registry.</p>
              <Button asChild className="mt-4 w-full"><Link to="/agency/dashboard">Open dashboard</Link></Button>
            </Card>
            <Card>
              <h3 className="font-display text-[28px] text-ink">Field app</h3>
              <p className="mt-2 leading-relaxed">Supervisor check-in with before/after camera capture.</p>
              <Button asChild variant="secondary" className="mt-4 w-full"><Link to="/contractor/sign-in">Supervisor sign in</Link></Button>
            </Card>
            <Card>
              <h3 className="font-display text-[28px] text-ink">Reporter link</h3>
              <p className="mt-2 leading-relaxed">Single-tap “site full” report from an approved reporter's personal link.</p>
              <Button asChild variant="secondary" className="mt-4 w-full"><Link to="/r/$token" params={{ token: 'demo-nwaniba-reporter-link' }}>Open example report link</Link></Button>
            </Card>
          </div>
        </div>
      </section>
    </main>
  )
}
