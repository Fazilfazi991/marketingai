import type { Metadata } from "next";
import {
  LegalPage,
  LegalSection,
} from "@/components/public-site/legal-page";
import { buildPublicPageMetadata } from "@/components/public-site/public-seo";

const title = "Terms of Service | Gro by Fusion Ventures";
const description =
  "Read the terms that apply when using Gro, the AI-powered Growth Agent service by Fusion Ventures.";

export const metadata: Metadata = buildPublicPageMetadata({
  title,
  description,
  path: "/terms",
});

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Using Gro"
      title="Terms of Service"
      introduction="These Terms govern access to Gro, the managed AI-powered Growth Agent service operated by Fusion Ventures FZ-LLC."
    >
      <LegalSection title="1. Acceptance and service agreements">
        <p>
          By accessing Gro or using its services, you agree to these Terms. If
          you use Gro for a business or organization, you confirm that you are
          authorized to accept these Terms for it. A proposal, order form,
          statement of work, or other written agreement with Fusion Ventures may
          include additional service-specific terms. That agreement will control
          if it expressly conflicts with these Terms.
        </p>
      </LegalSection>

      <LegalSection title="2. About Gro">
        <p>
          Gro is a managed, AI-powered Growth Agent service. Depending on the
          selected service and client configuration, it may assist with website
          monitoring and improvement, SEO and Google visibility, analytics
          interpretation, customer enquiries, chatbots and business messaging,
          social content and management, business recommendations, client
          requests, and related digital growth work.
        </p>
        <p>
          Fusion Ventures may configure services, supervise AI-assisted work,
          review recommendations, manage integrations, communicate with clients,
          perform requested work, and coordinate implementation. Capabilities
          vary by package, connected accounts, third-party availability, and
          client approvals.
        </p>
      </LegalSection>

      <LegalSection title="3. Eligibility and business use">
        <p>
          Gro is intended for lawful business use by people who can enter into a
          binding agreement and by authorized representatives of businesses.
          You must provide accurate information and use the service only for the
          business or organization you are authorized to represent.
        </p>
      </LegalSection>

      <LegalSection title="4. Accounts and access">
        <p>
          You are responsible for protecting account credentials, restricting
          access to authorized users, and promptly telling us about suspected
          misuse. You remain responsible for activity performed through your
          account unless applicable law or a written agreement provides
          otherwise.
        </p>
      </LegalSection>

      <LegalSection title="5. Client responsibilities and approvals">
        <p>You are responsible for:</p>
        <ul>
          <li>
            giving accurate instructions, business context, and timely feedback;
          </li>
          <li>
            reviewing recommendations, content, messages, and material business
            actions before approval or publication where review is available or
            required;
          </li>
          <li>
            ensuring your use of Gro and supplied information complies with
            applicable laws, platform rules, and your obligations to customers;
          </li>
          <li>
            maintaining appropriate notices, permissions, and lawful grounds
            for customer or other third-party information; and
          </li>
          <li>
            cooperating with reasonable setup, security, and integration
            requirements.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Connected services">
        <p>
          You may authorize Gro to connect to supported business accounts and
          platforms. You confirm that you have the authority to grant that
          access. You can ask us to disconnect an integration, but doing so may
          limit related features. We will not intentionally expand access beyond
          the permissions granted through the relevant platform and service
          configuration.
        </p>
      </LegalSection>

      <LegalSection title="7. AI-assisted work and human supervision">
        <p>
          Gro uses AI systems to analyse information, assist with content and
          operational work, interpret data, and generate recommendations. AI
          output may not always be accurate, complete, current, or appropriate
          for every situation. Fusion Ventures personnel may supervise, review,
          refine, or implement AI-assisted work as part of the managed service.
        </p>
        <p>
          You remain responsible for important business decisions and final
          approvals. Gro is not a substitute for legal, financial, tax, medical,
          or other regulated professional advice.
        </p>
      </LegalSection>

      <LegalSection title="8. Requests and workflows">
        <p>
          Gro may help prepare work, surface recommendations, or coordinate
          requests. A request is not necessarily accepted, completed, or
          published until the relevant workflow, human review, client approval,
          and service scope are satisfied. Urgent or high-impact instructions
          should also be communicated directly to the Fusion Ventures team.
        </p>
      </LegalSection>

      <LegalSection title="9. Acceptable use">
        <p>You must not use Gro to:</p>
        <ul>
          <li>break the law, infringe rights, or deceive or harm others;</li>
          <li>
            send unlawful, unauthorized, abusive, or misleading communications;
          </li>
          <li>
            introduce malicious code, probe security, evade access controls, or
            disrupt the service;
          </li>
          <li>
            provide information you do not have the right to use or instruct us
            to access an account without authorization; or
          </li>
          <li>
            use output without reasonable review where mistakes could materially
            affect people, rights, finances, or business operations.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="10. Client materials and intellectual property">
        <p>
          You retain ownership of your pre-existing website content, logos,
          brand assets, marketing materials, business data, and other materials.
          You grant Fusion Ventures the permissions reasonably needed to use
          those materials to provide Gro. You confirm that you have the rights
          needed for materials, data, customer information, and accounts you
          supply or authorize us to access.
        </p>
        <p>
          Ownership and permitted use of specifically commissioned or delivered
          work are governed by the applicable proposal, order, or service
          agreement. Fusion Ventures retains its pre-existing tools, methods,
          systems, templates, know-how, and platform technology.
        </p>
      </LegalSection>

      <LegalSection title="11. Third-party platforms">
        <p>
          Gro may depend on Google, Meta and other social networks, WhatsApp or
          business messaging providers, hosting and cloud services, analytics
          providers, and other third-party platforms. Their terms and privacy
          practices apply to their services. Their availability, permissions,
          features, or policies may change, which may affect Gro. Fusion
          Ventures does not make commitments on their behalf.
        </p>
      </LegalSection>

      <LegalSection title="12. Fees and payment">
        <p>
          Fees, billing timing, taxes, included work, cancellation terms, and
          any refund arrangements are set out in the applicable proposal,
          order, invoice, or service agreement. You are responsible for paying
          agreed charges when due. We may pause affected paid services after
          reasonable notice if undisputed payment remains overdue.
        </p>
      </LegalSection>

      <LegalSection title="13. Availability and service changes">
        <p>
          We aim to provide Gro with reasonable care, but uninterrupted or
          error-free availability is not guaranteed. Maintenance, security
          events, client dependencies, and third-party platform changes may
          affect the service. We may modify features or delivery methods as the
          service develops, while considering active written commitments.
        </p>
      </LegalSection>

      <LegalSection title="14. Cancellation and termination">
        <p>
          Cancellation rights, notice periods, and service end dates are set by
          the applicable service agreement. We may suspend or terminate access
          where reasonably necessary for serious misuse, security risk, unlawful
          activity, material breach, or prolonged non-payment. Where practical,
          we will give notice and an opportunity to address the issue.
        </p>
      </LegalSection>

      <LegalSection title="15. Outcomes and disclaimers">
        <p>
          Gro and Fusion Ventures do not guarantee search rankings, traffic,
          leads, revenue, sales, or any other commercial outcome. Results depend
          on many factors outside our control, including client decisions,
          implementation, market conditions, competition, and third-party
          platforms.
        </p>
        <p>
          To the extent permitted by applicable law, Gro is provided subject to
          the express commitments in the applicable written service agreement,
          without additional implied guarantees about outcomes or uninterrupted
          availability.
        </p>
      </LegalSection>

      <LegalSection title="16. Liability">
        <p>
          Each party remains responsible for loss it causes in accordance with
          applicable law and any written service agreement. To the extent
          permitted by law, Fusion Ventures is not responsible for indirect or
          consequential loss, decisions made without reasonable review of AI
          output, unauthorized client instructions, or failures caused by client
          systems or third-party platforms. Nothing in these Terms excludes
          liability that cannot legally be excluded.
        </p>
      </LegalSection>

      <LegalSection title="17. Changes and contact">
        <p>
          We may update these Terms as Gro develops. Material changes will be
          reflected on this page by updating the date above. Questions about
          these Terms can be sent to{" "}
          <a href="mailto:info@fusionventuresglobal.com">
            info@fusionventuresglobal.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
