"use client";

import { SECTIONS_CONSTANTS } from "@/shared/constants/sections-constants";
import { TheSectionLayout } from "@/shared/components";

const termsData = [
  {
    title: "Service Overview",
    content: (
      <span>
        Anticapture is an open-source, research-driven platform that indexes and
        organizes public governance data from DAOs. The Service offers
        visualizations, dashboards, alerts, and metadata to support transparency
        and monitoring in decentralized governance systems. <br />
        <br />
        Anticapture is not a governance tool, financial product, or security
        service.
      </span>
    ),
  },
  {
    title: "Open Source and Public Data Disclaimer",
    content: (
      <ul className="list-inside list-disc">
        <li className="mb-2">
          The Anticapture codebase is open source and available for public
          inspection and use.
        </li>
        <li className="mb-2">
          All data presented by Anticapture is indexed from public and onchain
          sources. We do not generate, validate, or guarantee the accuracy or
          completeness of any data.
        </li>
        <li>
          Blockful is not responsible for errors in third-party data sources,
          misinterpretations of the data, or outcomes (including attacks,
          losses, or governance decisions) that result from the use of the
          Service
        </li>
      </ul>
    ),
  },
  {
    title: "No Warranties or Guarantees",
    content: (
      <ul className="list-inside list-disc">
        <li className="mb-2">
          The Service is provided “as is”, without warranty of any kind, express
          or implied.
        </li>
        <li className="mb-2">
          Anticapture makes no guarantees that the data, assessments, or
          indicators are sufficient to prevent or detect governance
          vulnerabilities or attacks.
        </li>
        <li>
          Any use of the information on this platform is entirely at your own
          risk.
        </li>
      </ul>
    ),
  },
  {
    title: "No Liability for DAO Incidents",
    content: (
      <span>
        Blockful is not liable for any form of governance failure, security
        breach, loss of funds, or protocol incident—even if the platform failed
        to identify risks prior to such events. <br /> <br />
        The Service is informational only and does not substitute internal
        security, audits, or governance practices within DAOs.
      </span>
    ),
  },
  {
    title: "Limited Use and Scope",
    content: (
      <div className="flex flex-col gap-2">
        <span>
          You may use Anticapture for informational and research purposes. You
          may not:
        </span>
        <ul className="list-inside list-disc">
          <li className="mb-2">
            Represent Anticapture data as official or complete.
          </li>
          <li className="mb-2">
            Misattribute findings to the Anticapture team that were not
            explicitly published.
          </li>
          <li>
            Rely on the Service as the sole source of DAO risk assessment or
            governance decision-making.
          </li>
        </ul>
      </div>
    ),
  },
  {
    title: "third-party content",
    content: (
      <span>
        The Service may reference or link to third-party DAOs, protocols, and
        external tools. We are not responsible for the content, actions, or
        failures of these third parties.
      </span>
    ),
  },
  {
    title: "Modifications to Service",
    content: (
      <span>
        We may update or pause the Service at any time without prior notice.
        Being open source, others are free to fork, modify, or extend
        Anticapture under the terms of its license.
      </span>
    ),
  },
  {
    title: "Governing Law",
    content: (
      <span>
        These Terms are governed by the laws of the jurisdiction where Blockful
        is established, excluding any conflict of laws principles.
      </span>
    ),
  },
  {
    title: "Contact",
    content: (
      <span>
        For legal inquiries, you may contact us at: contact@blockful.io.
      </span>
    ),
  },
];

export const TermsSection = () => {
  return (
    <div className="flex w-full justify-center">
      <TheSectionLayout
        title={SECTIONS_CONSTANTS.terms.title}
        anchorId={SECTIONS_CONSTANTS.terms.anchorId}
        className="bg-surface-background! mt-[56px]! sm:mt-0! max-w-[770px]"
      >
        <div className="flex w-full flex-col items-center justify-center gap-2 px-2">
          <span className="text-secondary text-sm">
            Welcome to Anticapture, an open-source governance security platform.
            Please read these Terms of Service (&quot;Terms&quot;) carefully
            before using the Anticapture dashboard or any of its public data
            feeds (the &quot;Service&quot;), operated by Blockful
            (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;). <br /> <br /> By
            accessing or using the Service, you agree to these Terms. If you do
            not agree, you should not use the Service.
          </span>

          {termsData.map((item, index) => (
            <div
              key={index}
              className="border-light-dark mt-4 flex w-full flex-col gap-1 border"
            >
              <span className="bg-surface-default text-primary px-3 py-2 text-[13px] font-medium uppercase tracking-wider">
                {index + 1}. {item.title}
                <span className="text-link">_</span>
              </span>
              <div className="text-secondary p-3 text-sm">{item.content}</div>
            </div>
          ))}
        </div>
      </TheSectionLayout>
    </div>
  );
};
