import type { Metadata } from "next";
import {
  LegalPage,
  LegalSection,
} from "@/components/public-site/legal-page";
import { buildPublicPageMetadata } from "@/components/public-site/public-seo";

const title = "Privacy Policy | Gro by Fusion Ventures";
const description =
  "Learn how Gro by Fusion Ventures collects, uses and protects information when providing its AI-powered Growth Agent service.";

export const metadata: Metadata = buildPublicPageMetadata({
  title,
  description,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Your information"
      title="Privacy Policy"
      introduction="This policy explains how Fusion Ventures FZ-LLC handles information when providing Gro, its managed AI-powered Growth Agent service."
    >
      <LegalSection title="1. Who this policy covers">
        <p>
          This policy applies to visitors to gro.expert, people who contact us,
          prospective and existing clients, authorized client users, and other
          people whose information is processed through Gro. In this policy,
          “Gro,” “we,” “us,” and “our” refer to the Gro service operated by
          Fusion Ventures FZ-LLC.
        </p>
      </LegalSection>

      <LegalSection title="2. Information we collect">
        <p>Information you provide may include:</p>
        <ul>
          <li>
            your name, business name, email address, phone or WhatsApp number,
            website, enquiry details, and account information;
          </li>
          <li>
            messages sent to Gro or Fusion Ventures and business context shared
            during onboarding or service delivery; and
          </li>
          <li>
            instructions, requests, approvals, files, brand materials, and
            other information supplied for client work.
          </li>
        </ul>
        <p>
          Use of the service may also create conversations, recommendations,
          approvals, operational history, workspace activity, and technical or
          security records needed to operate and protect Gro.
        </p>
      </LegalSection>

      <LegalSection title="3. Connected business data">
        <p>
          The information available to Gro depends on the services a client
          selects and the accounts they choose to connect. It may include
          website information, analytics and search visibility information,
          customer enquiries, chatbot conversations, business messaging,
          social or content information, and related operational data.
        </p>
        <p>
          Clients control which supported integrations they authorize. Gro does
          not receive access merely because a client discusses a platform with
          us.
        </p>
      </LegalSection>

      <LegalSection title="4. Google user data">
        <p>
          When an authorized client user connects a supported Google service,
          Gro requests account identity information and read-only access to the
          Google Analytics and/or Google Search Console properties the user
          selects. We use that access to understand website performance,
          interpret search visibility, produce relevant insights, and make
          recommendations available to the client.
        </p>
        <p>
          Access begins only after Google authorization and is limited to the
          functionality requested by the client. A user can revoke Gro’s access
          through the relevant Google Account controls or ask us to disconnect
          the integration. Revocation may prevent connected features from
          working.
        </p>
      </LegalSection>

      <LegalSection title="5. How we use information">
        <p>We use information as reasonably necessary to:</p>
        <ul>
          <li>respond to enquiries and support onboarding;</li>
          <li>authenticate users and operate client workspaces;</li>
          <li>provide, configure, supervise, and improve the Gro service;</li>
          <li>
            analyse business information and prepare recommendations, content,
            reports, and requested work;
          </li>
          <li>
            respond to client requests and coordinate human-assisted
            implementation;
          </li>
          <li>
            maintain service reliability, security, and fraud or abuse
            prevention; and
          </li>
          <li>meet legal obligations and resolve disputes.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. AI processing and human review">
        <p>
          Gro uses AI systems to help analyse business information, interpret
          data, generate recommendations, assist with content and operational
          work, and support client requests. Authorized Fusion Ventures
          personnel may review, supervise, refine, or implement AI-assisted
          work as part of the managed service.
        </p>
        <p>
          AI output can be incomplete or incorrect. It should be reviewed in
          context and should not automatically be treated as legal, financial,
          or other professional advice. Approved service providers may process
          information where reasonably necessary to operate these capabilities.
        </p>
      </LegalSection>

      <LegalSection title="7. Service providers and connected platforms">
        <p>
          We may use service providers for cloud hosting, databases,
          authentication, analytics, communications, AI processing, email, and
          operational automation. We may also exchange information with a
          platform that a client has explicitly connected, such as Google or a
          business messaging service, to provide the requested functionality.
        </p>
      </LegalSection>

      <LegalSection title="8. How information may be shared">
        <p>Information may be shared only where reasonably necessary with:</p>
        <ul>
          <li>authorized Fusion Ventures personnel supporting the client;</li>
          <li>service providers that help operate Gro;</li>
          <li>integrations and platforms explicitly connected by the client;</li>
          <li>
            professional advisers, transaction counterparties, or authorities
            where reasonably necessary or legally required.
          </li>
        </ul>
        <p>Gro does not sell personal information.</p>
      </LegalSection>

      <LegalSection title="9. Retention">
        <p>
          We retain information for as long as reasonably necessary to provide
          the service, maintain appropriate business and security records,
          resolve disputes, and meet legal obligations. The appropriate period
          depends on the type of information, the client relationship, and why
          the information is held.
        </p>
      </LegalSection>

      <LegalSection title="10. Security">
        <p>
          We use reasonable technical and organizational safeguards designed to
          protect information. No internet or storage system can be guaranteed
          to be completely secure, so clients should also protect their account
          credentials and promptly report suspected unauthorized access.
        </p>
      </LegalSection>

      <LegalSection title="11. Client responsibilities">
        <p>
          Business clients are responsible for ensuring they have appropriate
          rights, notices, permissions, and other lawful grounds for information
          they provide or connect to Gro. This is especially relevant to
          customer data, enquiry details, chatbot conversations, and WhatsApp or
          other business messages.
        </p>
      </LegalSection>

      <LegalSection title="12. International processing">
        <p>
          Gro is a cloud-based service. Information may be processed in
          countries different from the country where a client or user is
          located, including through service providers used to operate Gro.
        </p>
      </LegalSection>

      <LegalSection title="13. Your requests">
        <p>
          Depending on where you live, you may have rights relating to your
          personal information. You can ask to access, correct, or delete
          information, or ask questions about how it is processed, by emailing{" "}
          <a href="mailto:info@fusionventuresglobal.com">
            info@fusionventuresglobal.com
          </a>
          . We may need to verify your identity and consider obligations or
          exceptions that apply to the request.
        </p>
      </LegalSection>

      <LegalSection title="14. Children">
        <p>
          Gro is a business-oriented service and is not intended for children.
          If you believe a child has provided personal information through Gro,
          please contact us.
        </p>
      </LegalSection>

      <LegalSection title="15. Updates and contact">
        <p>
          We may update this policy as Gro or applicable requirements change.
          Material changes will be reflected on this page by updating the date
          above. Questions about this policy or Gro’s handling of information
          can be sent to{" "}
          <a href="mailto:info@fusionventuresglobal.com">
            info@fusionventuresglobal.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
