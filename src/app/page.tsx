import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default async function Page() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-dark flex flex-col">
      {/* Navbar */}
      <header className="flex items-center justify-between px-8 py-6 max-w-7xl w-full mx-auto">
        <div className="font-bold text-xl tracking-tighter text-brand">AGENCY SUITE</div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="text-sm font-medium hover:text-brand transition-colors">Sign In</Link>
          <Link href="/sign-up" className="bg-brand text-white text-sm font-medium px-4 py-2 rounded shadow-sm hover:opacity-90 transition-opacity">
            Start Free Trial
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center pt-16 pb-24 px-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand/5 border border-brand/10 rounded-full text-brand text-sm font-medium mb-8">
          <Sparkles className="w-4 h-4" />
          <span>The $5K/mo Agency Standard</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight mb-6 text-dark">
          Stop writing reports. <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-indigo-600">Start closing clients.</span>
        </h1>
        <p className="text-lg md:text-xl text-mid max-w-2xl mb-10 leading-relaxed">
          Turn your messy performance data and quick bullet points into stunning, executive-ready client reports in exactly 60 seconds.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link href="/sign-up" className="bg-brand text-white text-lg font-semibold px-8 py-4 rounded-lg shadow-xl shadow-brand/20 hover:scale-105 transition-transform flex items-center gap-2">
            Start Your Free Trial <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-sm text-mid mt-4 sm:mt-0 font-medium whitespace-nowrap">No credit card required</p>
        </div>
      </section>

      {/* Transformation Visual */}
      <section className="bg-surface border-y border-border py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">From raw data to premium deliverable</h2>
            <p className="text-mid">Don't spend 3 hours doing what AI can do in 60 seconds.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            {/* Left: Messy Data */}
            <div className="bg-white border border-border p-6 rounded-xl shadow-sm flex flex-col">
              <div className="text-xs font-semibold text-mid uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400"></span> Before: Raw Notes
              </div>
              <div className="bg-orange-50/50 p-6 rounded border border-orange-100 flex-1 font-mono text-sm text-dark/80 whitespace-pre-wrap leading-relaxed">
{`Client: Acme
CPA: $32 (down 18%)
ROAS: 4.2x on meta retargeting
leads: 142
- new landing page doubled conversions
- fb CPMs are up for xmas
- need to test headlines next wk
- launch perf max`}
              </div>
            </div>

            {/* Right: Clean Report */}
            <div className="bg-white border border-brand/30 p-6 rounded-xl shadow-xl shadow-brand/10 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-bl-full -z-10"></div>
              <div className="text-xs font-semibold text-brand uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand"></span> After: Agency Suite
              </div>
              <div className="bg-white p-6 rounded border border-border flex-1 shadow-sm prose prose-sm prose-p:leading-relaxed prose-headings:font-bold prose-headings:text-dark max-w-none">
                <h2 className="text-lg font-bold border-b pb-2 mb-4">Executive Summary</h2>
                <p>This week saw exceptional efficiency gains, driven by a highly successful landing page rollout. We successfully reduced our blended CPA by over 18% while simultaneously improving middle-of-funnel conversion velocity.</p>
                
                <h3 className="text-base font-bold mt-6 mb-2">Data Snapshot</h3>
                <ul className="grid grid-cols-2 gap-2 mb-4">
                  <li className="list-none border p-2 rounded text-xs"><span className="text-mid block">New Leads</span><span className="font-bold text-lg">142</span></li>
                  <li className="list-none border p-2 rounded text-xs"><span className="text-mid block">Blended CPA</span><span className="font-bold text-lg">$32.00</span></li>
                  <li className="list-none border p-2 rounded text-xs"><span className="text-mid block">Meta ROAS</span><span className="font-bold text-lg">4.2x</span></li>
                </ul>

                <h3 className="text-base font-bold mt-6 mb-2">Strategic Insights</h3>
                <p>While Meta CPMs have increased due to holiday seasonality, our new landing page effectively absorbed the cost increase by doubling conversion rates. Retargeting remains highly profitable.</p>
                
                <h3 className="text-base font-bold mt-6 mb-2">Action Plan</h3>
                <ul className="list-disc pl-4 text-dark/80">
                  <li><strong>A/B Testing:</strong> Launch robust headline variations on the winning landing page.</li>
                  <li><strong>Scale:</strong> Initiate Google Performance Max campaigns to capture broader intent.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-mid pb-12 mt-auto">
        &copy; {new Date().getFullYear()} Agency Suite. Built for high-ticket agencies.
      </footer>
    </div>
  );
}
