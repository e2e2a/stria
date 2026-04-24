import Navbar from '@/components/public-pages/navbar';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy for MarkdownMD Collaboration Platform',
  description:
    'Learn how we collect, use, and protect your information while you create and collaborate on Markdown documents. Secure and transparent privacy practices.',
};

export default function Page() {
  return (
    <div className="h-screen overflow-y-auto! [&::-webkit-scrollbar-track]:mt-20">
      <Navbar />
      <div className="mx-auto max-w-4xl px-6 pt-40 pb-20">
        <h1 className="text-3xl font-bold text-foreground mb-6">Privacy Policy</h1>

        <p className="text-muted-foreground mb-6">
          This Privacy Policy explains how MondreyMD collects, uses, and protects information when you use our markdown editing, preview, and collaboration
          platform.
        </p>

        {/* PRINCIPLES */}
        <h2 className="text-2xl font-bold text-foreground mt-10 mb-3">MondreyMD Privacy Principles</h2>
        <ul className="list-disc ml-6 text-muted-foreground space-y-2">
          <li>We only request personal information when it is necessary to operate or improve our services.</li>
          <li>We never sell, rent, or trade your personal data.</li>
          <li>
            We collect minimal technical information (such as IP address, browser type, and session identifiers) for analytics, performance, and security.
          </li>
          <li>Account data from third-party sign-in providers (like Google or GitHub) is stored only as needed and removed if you delete your account.</li>
          <li>We use reputable third-party tools for analytics, which may receive basic device or usage information.</li>
        </ul>

        {/* WEBSITE VISITORS */}
        <h2 className="text-2xl font-bold text-foreground mt-10 mb-3">Website Visitors</h2>
        <p className="text-muted-foreground mb-4">
          MondreyMD collects non-personal technical information typically provided by web browsers and servers, including browser type, language settings,
          referring URLs, device type, and timestamps. This helps us analyze usage trends and improve performance.
        </p>
        <p className="text-muted-foreground mb-4">
          Logged-in users’ IP addresses may also be collected for security monitoring. We only disclose this information under the circumstances described
          later in this policy.
        </p>

        {/* PERSONALLY IDENTIFYING INFORMATION */}
        <h2 className="text-2xl font-bold text-foreground mt-10 mb-3">Collection of Personal Information</h2>
        <p className="text-muted-foreground mb-4">
          Some MondreyMD features require us to gather personal information, for example, when you create an account, we may ask for a username, email
          address, or authentication details via third-party login providers. We collect only the minimum information needed to operate the platform.
        </p>
        <p className="text-muted-foreground mb-4">
          Users may choose not to provide certain data, but doing so may limit access to key features such as collaboration or document saving.
        </p>

        {/* AGGREGATED DATA */}
        <h2 className="text-2xl font-bold text-foreground mt-10 mb-3">Aggregated Usage Data</h2>
        <p className="text-muted-foreground mb-4">
          MondreyMD may collect general usage statistics to understand how the platform is used. These insights are anonymized and aggregated, and do not
          contain personal identifiers.
        </p>

        {/* SECURITY */}
        <h2 className="text-2xl font-bold text-foreground mt-10 mb-3">Data Protection</h2>
        <p className="text-muted-foreground mb-4">
          We implement industry-standard security measures, including encryption in transit, secure storage, and controlled access. We continuously update
          our security practices to protect your data from unauthorized access or misuse.
        </p>

        {/* DISCLOSURE */}
        <h2 className="text-2xl font-bold text-foreground mt-10 mb-3">Disclosure of Personal Information</h2>
        <p className="text-muted-foreground mb-4">
          MondreyMD shares personal information only with trusted employees, contractors, or service providers who need the data to deliver our services
          and who agree to confidentiality obligations.
        </p>
        <p className="text-muted-foreground mb-4">
          We do not sell or rent user data. We only disclose personal information when legally required, or when necessary to protect MondreyMD’s rights,
          safety, or the public.
        </p>
        <p className="text-muted-foreground mb-4">
          If you provide an email address, we may occasionally send product updates or feedback requests, which you can opt out of at any time.
        </p>

        {/* COOKIES */}
        <h2 className="text-2xl font-bold text-foreground mt-10 mb-3">Cookies</h2>
        <p className="text-muted-foreground mb-4">
          MondreyMD uses cookies to maintain sessions, remember preferences, and analyze platform usage. You may disable cookies through your browser, but
          some features may not work properly without them.
        </p>

        {/* POLICY CHANGES */}
        <h2 className="text-2xl font-bold text-foreground mt-10 mb-3">Changes to This Policy</h2>
        <p className="text-muted-foreground mb-4">
          We may update this Privacy Policy periodically. Changes are usually minor, but we encourage you to review this page occasionally. Continuing to
          use MondreyMD after an update signifies acceptance of the revised policy.
        </p>

        {/* ACCURACY */}
        <h2 className="text-2xl font-bold text-foreground mt-10 mb-3">Accuracy and User Rights</h2>
        <p className="text-muted-foreground mb-4">
          You may request access to, corrections of, or deletion of your personal data. If any stored information is inaccurate, you may contact us to
          request an update.
        </p>

        {/* ACCOUNT DELETION */}
        <h2 className="text-2xl font-bold text-foreground mt-10 mb-3">Account & Data Deletion</h2>
        <p className="text-muted-foreground mb-4">
          You may delete your MondreyMD account at any time from your settings. After deletion, your personal information and documents will be removed
          unless required by law for security or compliance.
        </p>

        {/* CONTACT */}
        <h2 className="text-2xl font-bold text-foreground mt-10 mb-3">Contact</h2>
        <p className="text-muted-foreground">
          If you have questions regarding this Privacy Policy or our data practices, please contact us at:
          <br />
          <span className="font-semibold text-foreground">e2e2a@mondrey.dev</span>
        </p>
      </div>
    </div>
  );
}
