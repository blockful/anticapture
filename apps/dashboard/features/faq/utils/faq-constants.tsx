import type { ReactNode } from "react";

export interface FaqItem {
  id: string;
  question: string;
  answer: ReactNode;
  /** Plain text for FAQPage JSON-LD (`Answer.text`); keep aligned with `answer`. */
  answerText: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "what-is-anticapture",
    question: "What is Anticapture?",
    answer: (
      <>
        Anticapture is a framework turned into a public dashboard that helps
        DAOs understand and improve their governance security. It works as a
        risk assessment tool.
        <br />
        <br />
        Think of it like L2Beat, but focused on governance instead of bridges or
        rollups. We surface security risks in economic conditions, governance
        implementation, token distribution and others (read more about{" "}
        <a
          href="https://en.wikipedia.org/wiki/Normalcy_bias"
          target="_blank"
          rel="noopener noreferrer"
          className="text-link text-alternative-sm inline font-mono uppercase tracking-wider hover:underline"
        >
          Normalcy Bias
        </a>
        ).
        <br />
        <br />
        This gives delegates, token holders, investors, foundations, and other
        contributors a way to understand potential attack risks beyond just
        smart contract hacks… like what could have happened{" "}
        <a
          href="https://mirror.xyz/research.blockful.eth/-PfMduhpxdypPrutofr6099T4ROpsAmX0fPNbvDgR_k"
          target="_blank"
          rel="noopener noreferrer"
          className="text-link text-alternative-sm inline font-mono uppercase tracking-wider hover:underline"
        >
          here
        </a>
        .
      </>
    ),
    answerText:
      "Anticapture is a framework turned into a public dashboard that helps DAOs understand and improve their governance security. It works as a risk assessment tool. Think of it like L2Beat, but focused on governance instead of bridges or rollups. We surface security risks in economic conditions, governance implementation, token distribution and others (read more about Normalcy Bias: https://en.wikipedia.org/wiki/Normalcy_bias). This gives delegates, token holders, investors, foundations, and other contributors a way to understand potential attack risks beyond just smart contract hacks, like what could have happened here: https://mirror.xyz/research.blockful.eth/-PfMduhpxdypPrutofr6099T4ROpsAmX0fPNbvDgR_k.",
  },
  {
    id: "why-do-we-need-this",
    question: "Why do we need something like this?",
    answer: (
      <>
        DAOs and protocols are more vulnerable through governance than most
        assume. Complexity and normalcy bias make risks invisible even to DAO
        contributors. Attackers don&apos;t have that problem. What they see is
        an investment opportunity —{" "}
        <em>
          &quot;How much money should I put into this governance token to have
          profit, within the rules of the game?&quot;
        </em>
        <br />
        <br />
        Surfacing those risks gives builders, stewards, and token holders the
        clarity they need to act before it&apos;s too late.
      </>
    ),
    answerText:
      "DAOs and protocols are more vulnerable through governance than most assume. Complexity and normalcy bias make risks invisible even to DAO contributors. Attackers don't have that problem. What they see is an investment opportunity — \"How much money should I put into this governance token to have profit, within the rules of the game?\" Surfacing those risks gives builders, stewards, and token holders the clarity they need to act before it's too late.",
  },
  {
    id: "why-are-some-daos-not-included",
    question: "Why are some DAOs not included?",
    answer: (
      <>
        Some DAOs are still under review, often because their governance model
        is less conventional or not EVM-based. But our goal is to index them
        all.
        <br />
        <br />
        We&apos;re Ethereum-first. So we prioritized DAOs, protocols, and L2s
        that are part of the Ethereum ecosystem. And we are focusing first on
        the DAOs with that could have the most impact if they were taken
        over/attacked.
        <br />
        <br />
        Are we expanding? Yes. We don&apos;t want to leave any DAO out of this.
        Our metrics are evolving, and we&apos;ll keep abstracting them to
        account for more structures without losing clarity.
      </>
    ),
    answerText:
      "Some DAOs are still under review, often because their governance model is less conventional or not EVM-based. But our goal is to index them all. We're Ethereum-first. So we prioritized DAOs, protocols, and L2s that are part of the Ethereum ecosystem. And we are focusing first on the DAOs with that could have the most impact if they were taken over/attacked. Are we expanding? Yes. We don't want to leave any DAO out of this. Our metrics are evolving, and we'll keep abstracting them to account for more structures without losing clarity.",
  },
  {
    id: "risky-to-make-vulnerabilities-public",
    question: "Isn't it risky to make DAO vulnerabilities public?",
    answer: (
      <>
        Some DAOs are not comfortable exposing risks, just like certain L2s were
        uncomfortable with the pressure L2Beat created. That&apos;s normal. Our
        role is to turn raw data into something legible, because transparency
        without accessibility does not help much.
        <br />
        <br />
        We want to increase the pressure on DAOs to improve their security
        before large, well-funded attackers start taking advantage of structural
        weaknesses.
        <br />
        <br />
        The game is asymmetric. And no, this public data isn&apos;t dangerous.
        Attackers already know it. What we&apos;re doing is leveling the game.
      </>
    ),
    answerText:
      "Some DAOs are not comfortable exposing risks, just like certain L2s were uncomfortable with the pressure L2Beat created. That's normal. Our role is to turn raw data into something legible, because transparency without accessibility does not help much. We want to increase the pressure on DAOs to improve their security before large, well-funded attackers start taking advantage of structural weaknesses. The game is asymmetric. And no, this public data isn't dangerous. Attackers already know it. What we're doing is leveling the game.",
  },
  {
    id: "impact-of-anticapture",
    question: "What kind of impact has Anticapture had?",
    answer: (
      <>
        We uncovered a major threat to ENS DAO and lead the creation of its
        Security Council, preventing a potential $150M treasury attack. You can
        check it{" "}
        <a
          href="https://discuss.ens.domains/t/ep-5-23-executable-governance-security-bounty/19803"
          target="_blank"
          rel="noopener noreferrer"
          className="text-link text-alternative-sm inline font-mono uppercase tracking-wider hover:underline"
        >
          here
        </a>
        .
        <br />
        <br />
        We also received a grant from the Uniswap Foundation to conduct a
        governance security audit for Uniswap DAO — we delivered a security
        report and integrated the DAO into the dashboard. You can check it{" "}
        <a
          href="https://uniswapfoundation.mirror.xyz/SAPBIdMcJpo_gUUyHdMNuH8r7qpCqRtxFbDrui7Na-I"
          target="_blank"
          rel="noopener noreferrer"
          className="text-link text-alternative-sm inline font-mono uppercase tracking-wider hover:underline"
        >
          here
        </a>
        .
        <br />
        <br />
        Optimism also awarded us a grant to be included in the dashboard. You
        can check it{" "}
        <a
          href="https://app.charmverse.io/op-grants/governance-audit-and-dashboard-by-blockful-22656444457292424"
          target="_blank"
          rel="noopener noreferrer"
          className="text-link text-alternative-sm inline font-mono uppercase tracking-wider hover:underline"
        >
          here
        </a>
        .
      </>
    ),
    answerText:
      "We uncovered a major threat to ENS DAO and lead the creation of its Security Council, preventing a potential $150M treasury attack. Details: https://discuss.ens.domains/t/ep-5-23-executable-governance-security-bounty/19803. We also received a grant from the Uniswap Foundation to conduct a governance security audit for Uniswap DAO — we delivered a security report and integrated the DAO into the dashboard. Details: https://uniswapfoundation.mirror.xyz/SAPBIdMcJpo_gUUyHdMNuH8r7qpCqRtxFbDrui7Na-I. Optimism also awarded us a grant to be included in the dashboard. Details: https://app.charmverse.io/op-grants/governance-audit-and-dashboard-by-blockful-22656444457292424.",
  },
  {
    id: "how-do-stages-work",
    question: "How do the stages work?",
    answer: (
      <>
        We assign DAOs to Stage 0, 1, or 2 based on the risk levels of their
        governance implementation. A DAO is only as secure as its least secure
        part, so our stages are assigned based on the most risky aspect a DAO
        currently has on its implementation.
        <br />
        <br />
        Those risk levels can be low, medium or high, and are based on elements
        like voting delays, proposal thresholds, veto powers, flash loan
        protections, and more. The system helps communities see where they are
        and what changes are the most urgent for their safety to evolve. Right
        now it covers mostly Governor Bravo models, but we&apos;re already
        working on broader coverage.
        <br />
      </>
    ),
    answerText:
      "We assign DAOs to Stage 0, 1, or 2 based on the risk levels of their governance implementation. A DAO is only as secure as its least secure part, so our stages are assigned based on the most risky aspect a DAO currently has on its implementation. Those risk levels can be low, medium or high, and are based on elements like voting delays, proposal thresholds, veto powers, flash loan protections, and more. The system helps communities see where they are and what changes are the most urgent for their safety to evolve. Right now it covers mostly Governor Bravo models, but we're already working on broader coverage.",
  },
];
