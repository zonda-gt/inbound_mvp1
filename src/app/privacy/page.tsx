import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — ChinaPal",
  description:
    "How ChinaPal collects, uses, and protects your information.",
};

const CONTACT_EMAIL = "support@hellochina.chat";
const LAST_UPDATED = "April 30, 2026";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-6 py-12 text-gray-800 leading-relaxed">
        <Link
          href="/"
          className="text-sm font-medium text-[#2563EB] hover:underline"
        >
          ← Back to home
        </Link>

        <h1 className="mt-6 text-3xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-gray-500">
          Last updated: {LAST_UPDATED}
        </p>

        <p className="mt-6">
          ChinaPal (&quot;we&quot;, &quot;our&quot;, &quot;the app&quot;) is an
          AI-powered travel guide for visitors to China. This policy explains
          what information we collect when you use the app or website at
          hellochina.chat and app.hellochina.chat, how we use it, who we share
          it with, and what choices you have.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-gray-900">
          1. Information we collect
        </h2>

        <h3 className="mt-4 font-semibold">Information you provide</h3>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>
            <strong>Booking details</strong> — when you submit a reservation
            through our booking form, we collect your name, email address,
            phone number, party size, preferred time, and any special requests.
          </li>
          <li>
            <strong>Chat messages</strong> — text you send to the AI travel
            chat is processed to generate a response.
          </li>
          <li>
            <strong>Photos</strong> — if you use the Lens (camera) feature,
            photos you capture are sent to our AI provider for analysis and
            translation. Photos are not stored long-term unless you explicitly
            save them.
          </li>
          <li>
            <strong>Feedback</strong> — any messages you send through the
            in-app feedback form.
          </li>
        </ul>

        <h3 className="mt-4 font-semibold">
          Information collected automatically
        </h3>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>
            <strong>Device and usage data</strong> — pages visited, screens
            viewed, buttons tapped, time spent, approximate device type, OS,
            browser, IP address, and a randomly generated session identifier.
          </li>
          <li>
            <strong>Session recordings</strong> — for product improvement, we
            record screen interactions (clicks, scrolls, page changes) using
            third-party analytics tools. Form fields containing passwords and
            email addresses are masked. We do not record audio, microphone
            input, or camera feed.
          </li>
          <li>
            <strong>Location</strong> — when you use the Navigate feature, with
            your permission, we use your device&apos;s GPS to calculate
            distances and provide directions. Location data is processed in
            real time and is not stored on our servers.
          </li>
          <li>
            <strong>Performance data</strong> — page load times and Core Web
            Vitals (LCP, FCP, CLS, INP) to monitor and improve performance.
          </li>
        </ul>

        <h2 className="mt-8 text-xl font-semibold text-gray-900">
          2. How we use your information
        </h2>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>To provide the core features of the app (chat, navigation, recommendations, bookings).</li>
          <li>To process and confirm restaurant or activity reservations you submit.</li>
          <li>To respond to your questions and feedback.</li>
          <li>To monitor app performance, debug issues, and improve the user experience.</li>
          <li>To detect and prevent abuse, fraud, and security incidents.</li>
        </ul>
        <p className="mt-3">
          We do not sell your personal information. We do not use your data for
          third-party advertising.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-gray-900">
          3. Third-party services we use
        </h2>
        <p className="mt-2">
          We rely on the following third-party processors. Each operates under
          their own privacy policy.
        </p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>
            <strong>Anthropic</strong> — processes your chat messages and Lens
            photos to generate AI responses.
          </li>
          <li>
            <strong>Supabase</strong> — secure database hosting for bookings,
            saved places, and operational data.
          </li>
          <li>
            <strong>PostHog</strong> — product analytics and session recording
            for usage understanding and bug fixing.
          </li>
          <li>
            <strong>Microsoft Clarity</strong> — heatmaps and session recording
            for UX research.
          </li>
          <li>
            <strong>Vercel Analytics</strong> — anonymous page-view counts and
            performance monitoring.
          </li>
          <li>
            <strong>Amap (Gaode)</strong> — maps, geocoding, and navigation
            routing for destinations within China.
          </li>
          <li>
            <strong>DingTalk</strong> — internal staff notifications when a
            booking is submitted (so our team can confirm with the venue).
          </li>
          <li>
            <strong>Resend</strong> — transactional email delivery (e.g.
            booking confirmations).
          </li>
        </ul>

        <h2 className="mt-8 text-xl font-semibold text-gray-900">
          4. Data sharing
        </h2>
        <p className="mt-2">
          We share booking information (name, contact details, party size,
          time, requests) with the venue you have requested a reservation at,
          so that they can fulfill your booking. We do not share personal data
          with any other third parties for their own marketing or commercial
          purposes.
        </p>
        <p className="mt-3">
          We may disclose information if required by law or in response to a
          valid legal request.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-gray-900">
          5. Data retention
        </h2>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Booking data: retained for up to 24 months for operational and customer-service purposes.</li>
          <li>Chat history: retained for up to 12 months to improve the AI model and address abuse.</li>
          <li>Analytics and session recordings: retained for up to 12 months.</li>
          <li>Lens photos: not stored on our servers after the AI response is generated.</li>
        </ul>

        <h2 className="mt-8 text-xl font-semibold text-gray-900">
          6. Your rights
        </h2>
        <p className="mt-2">
          Depending on where you live, you may have the right to:
        </p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Access the personal information we hold about you.</li>
          <li>Request that we correct or update inaccurate information.</li>
          <li>Request that we delete your personal information.</li>
          <li>Object to or restrict certain processing.</li>
          <li>Withdraw consent for analytics by clearing site cookies and local storage in your browser settings.</li>
        </ul>
        <p className="mt-3">
          To exercise any of these rights, email us at{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-[#2563EB] underline"
          >
            {CONTACT_EMAIL}
          </a>{" "}
          and we will respond within 30 days.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-gray-900">
          7. Children&apos;s privacy
        </h2>
        <p className="mt-2">
          ChinaPal is not directed at children under 13, and we do not
          knowingly collect personal information from children under 13. If you
          believe we have collected information from a child, please contact us
          and we will delete it.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-gray-900">
          8. International data transfers
        </h2>
        <p className="mt-2">
          The services we use may process data in the United States, the
          European Union, or other regions. By using ChinaPal, you understand
          that your information may be transferred to and processed in
          countries outside your country of residence.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-gray-900">
          9. Security
        </h2>
        <p className="mt-2">
          We use industry-standard technical and organizational measures
          (encryption in transit via HTTPS, restricted database access, secure
          third-party processors) to protect your information. No system is
          perfectly secure; if we become aware of a breach affecting your data
          we will notify you and the appropriate authorities as required by
          law.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-gray-900">
          10. Changes to this policy
        </h2>
        <p className="mt-2">
          We may update this policy from time to time. The &quot;Last
          updated&quot; date at the top of this page reflects the latest
          revision. Material changes will be highlighted in the app.
        </p>

        <h2 className="mt-8 text-xl font-semibold text-gray-900">
          11. Contact
        </h2>
        <p className="mt-2">
          Questions, concerns, or data requests:{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-[#2563EB] underline"
          >
            {CONTACT_EMAIL}
          </a>
        </p>

        <div className="mt-12 border-t border-gray-200 pt-6 text-sm text-gray-500">
          ChinaPal — Your AI guide for navigating China.
        </div>
      </div>
    </div>
  );
}
