import React from "react";
import Link from "next/link";

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
      <div className="card-surface p-8 sm:p-12 rounded-md">
        <div className="border-b border-stone-200 pb-6 mb-8">
          <Link href="/" className="text-xs uppercase tracking-wider font-semibold text-stone-500 hover:text-stone-800">
            &larr; Back to Portal
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900 mt-3">Terms of Service</h1>
          <p className="text-sm text-stone-500 mt-1">BookLeaf Publishing Author Support & Communication Portal</p>
        </div>

        <div className="space-y-6 text-stone-700 leading-relaxed text-sm">
          <section>
            <h2 className="text-base font-bold text-stone-900 mb-2">1. Scope of Support Services</h2>
            <p>
              This portal serves as the official operational conduit between BookLeaf Publishing and contracted authors.
              Through this interface, authors may monitor publication pipeline milestones, review quarterly royalty statements,
              and submit operational tickets regarding ISBN assignment, distribution channels, and author copy fulfilment.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-stone-900 mb-2">2. Royalty Accounting & Payouts</h2>
            <p>
              Royalties are calculated on an 80/20 net profit split (80 percent to the author, 20 percent to BookLeaf Publishing)
              as specified in your publishing agreement. Calculations occur quarterly, with disbursements executed via direct bank
              transfer within 45 calendar days following the conclusion of each calendar quarter.
            </p>
            <p className="mt-2">
              A minimum accumulation threshold of ₹1,000 applies to each payout run. Unpaid balances beneath this threshold
              automatically roll forward into subsequent accounting quarters without expiration or administrative fees.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-stone-900 mb-2">3. Ticket Resolution Standards & SLAs</h2>
            <p>
              Support tickets are prioritized by business impact and operational category. Critical issues such as ISBN discrepancies
              or print defect reports carry a target response window of 24 to 48 hours. General inquiries and post-publication
              metadata revisions are processed within 3 to 5 business days.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-stone-900 mb-2">4. Account Security & Privacy Boundary</h2>
            <p>
              Authors are responsible for safeguarding their login credentials. Support ticket history, royalty data,
              and catalog metadata are strictly partitioned per author account. Internal operational notes and staff review logs
              remain confidential BookLeaf property and are not disclosed to external parties.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
