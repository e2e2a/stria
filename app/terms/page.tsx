import Navbar from '@/components/public-pages/navbar';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service for Collaborative MarkdownMD Platform',
  description:
    'Read the terms of service for using our Markdown editor. Understand your rights, responsibilities, and guidelines for secure and effective team collaboration.',
};

export default function Page() {
  return (
    <div className="h-screen overflow-y-auto! [&::-webkit-scrollbar-track]:mt-20">
      <Navbar />
      <div className="mx-auto max-w-4xl px-6 pt-40 pb-20">
        <h1 className="text-3xl font-bold text-foreground mb-6">Terms of Service</h1>

        <p className="text-muted-foreground mb-6">
          By accessing or using MondreyMD (“we”, “our”, or “MondreyMD”), you agree to be bound by these Terms of Service (“Terms”). These Terms apply to
          all users of MondreyMD, including individuals, teams, and any organization accessing our free markdown editing, preview, and collaboration
          platform.
        </p>

        {/* 1. Acceptance */}
        <h2 className="text-2xl font-bold text-foreground mt-10 mb-3">1. Acceptance of Terms</h2>
        <p className="text-muted-foreground mb-4">
          By using MondreyMD, you represent that you have the legal authority to accept these Terms. If you are using MondreyMD on behalf of an
          organization, you confirm that you have the authority to bind that organization and all users under your account to these Terms.
        </p>

        {/* 2. Description of Service */}
        <h2 className="text-2xl font-bold text-foreground mt-10 mb-3">2. Description of Service</h2>
        <p className="text-muted-foreground mb-4">
          MondreyMD is a free markdown editor with real-time preview and team collaboration features. The Service is provided “as is” and “as available,”
          without any warranties regarding reliability, security, or availability. We may modify, suspend, or discontinue features of the Service at any
          time.
        </p>

        {/* 3. Third-Party Services */}
        <h2 className="text-2xl font-bold text-foreground mt-10 mb-3">3. Third-Party Services</h2>
        <p className="text-muted-foreground mb-4">
          MondreyMD may integrate with third-party services (e.g., GitHub, Google authentication, or analytics tools). These third-party services are not
          controlled by MondreyMD. You acknowledge and agree that MondreyMD is not responsible for the availability, content, or privacy practices of such
          third-party services.
        </p>

        {/* 4. User Conduct */}
        <h2 className="text-2xl font-bold text-foreground mt-10 mb-3">4. Use of Service</h2>
        <p className="text-muted-foreground mb-4">
          You agree to use MondreyMD in accordance with all applicable laws and these Terms. You must be at least 13 years old to use the Service.
        </p>
        <ul className="list-disc ml-6 text-muted-foreground space-y-2">
          <li>You are responsible for all activity under your account.</li>
          <li>You must not upload malicious content, viruses, or harmful scripts.</li>
          <li>You may not infringe upon the intellectual property of others.</li>
          <li>You must respect other users and their data when collaborating.</li>
        </ul>

        {/* 5. User Content */}
        <h2 className="text-2xl font-bold text-foreground mt-10 mb-3">5. Your Content</h2>
        <p className="text-muted-foreground mb-4">
          You retain ownership of all content you create in MondreyMD. By using the Service, you grant MondreyMD a limited, non-exclusive license to
          access, store, and display your content solely to operate and improve the Service, including enabling real-time collaboration.
        </p>

        <p className="text-muted-foreground mb-4">
          You are responsible for ensuring that your content does not violate any laws or the rights of others. MondreyMD is not responsible for the
          content you or other users create or share.
        </p>

        {/* 6. Security */}
        <h2 className="text-2xl font-bold text-foreground mt-10 mb-3">6. Security</h2>
        <p className="text-muted-foreground mb-4">
          We implement reasonable technical, administrative, and physical safeguards to protect user data. However, you are responsible for maintaining the
          confidentiality of your account credentials and for securing your own devices and networks.
        </p>

        {/* 7. Intellectual Property */}
        <h2 className="text-2xl font-bold text-foreground mt-10 mb-3">7. Intellectual Property</h2>
        <p className="text-muted-foreground mb-4">
          MondreyMD owns all rights to the Service, including software, website design, and branding. You may not copy, reproduce, or create derivative
          works based on MondreyMD, except as explicitly permitted by these Terms.
        </p>

        <p className="text-muted-foreground mb-4">
          You retain ownership of your content, and MondreyMD respects your intellectual property. If you believe your copyright or other rights have been
          infringed, please contact us at support@mondreymd.com.
        </p>

        {/* 8. Termination */}
        <h2 className="text-2xl font-bold text-foreground mt-10 mb-3">8. Termination</h2>
        <p className="text-muted-foreground mb-4">
          MondreyMD may suspend or terminate your account for violations of these Terms or other misuse of the Service. You may also delete your account at
          any time, which will remove your content except as required by law.
        </p>

        {/* 9. Limitation of Liability */}
        <h2 className="text-2xl font-bold text-foreground mt-10 mb-3">9. Limitation of Liability</h2>
        <p className="text-muted-foreground mb-4">
          To the fullest extent permitted by law, MondreyMD is not liable for any indirect, incidental, or consequential damages arising from the use of
          the Service. You use the Service at your own risk.
        </p>

        {/* 10. Indemnification */}
        <h2 className="text-2xl font-bold text-foreground mt-10 mb-3">10. Indemnification</h2>
        <p className="text-muted-foreground mb-4">
          You agree to indemnify and hold harmless MondreyMD, its affiliates, and employees from any claims, damages, or expenses arising from your use of
          the Service or violation of these Terms.
        </p>

        {/* 11. Confidentiality */}
        <h2 className="text-2xl font-bold text-foreground mt-10 mb-3">11. Confidentiality</h2>
        <p className="text-muted-foreground mb-4">
          You agree to keep confidential any non-public information you gain access to through MondreyMD and not disclose it to third parties without
          permission.
        </p>

        {/* 12. Force Majeure */}
        <h2 className="text-2xl font-bold text-foreground mt-10 mb-3">12. Force Majeure</h2>
        <p className="text-muted-foreground mb-4">
          MondreyMD is not liable for failures or delays caused by events beyond our reasonable control, including outages, natural disasters,
          cybersecurity attacks, or government actions.
        </p>

        {/* 13. Governing Law */}
        <h2 className="text-2xl font-bold text-foreground mt-10 mb-3">13. Governing Law</h2>
        <p className="text-muted-foreground mb-4">
          These Terms are governed by the laws of the State of Delaware, United States. Any disputes arising from these Terms or the Service shall be
          resolved in the courts located in New Castle, Delaware.
        </p>

        {/* 14. Entire Agreement */}
        <h2 className="text-2xl font-bold text-foreground mt-10 mb-3">14. Entire Agreement</h2>
        <p className="text-muted-foreground mb-4">
          These Terms, along with our Privacy Policy, constitute the complete agreement between you and MondreyMD and supersede any prior agreements
          regarding your use of the Service.
        </p>

        {/* 15. Contact */}
        <h2 className="text-2xl font-bold text-foreground mt-10 mb-3">15. Contact</h2>
        <p className="text-muted-foreground">
          For questions about these Terms, please contact us at:
          <br />
          <span className="font-semibold text-foreground">e2e2a@mondrey.dev</span>
        </p>
      </div>
    </div>
  );
}
