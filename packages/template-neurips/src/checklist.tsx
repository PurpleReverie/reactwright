import "reactwright/jsx";
import React from "react";

// The NeurIPS Paper Checklist.
//
// Every NeurIPS submission must end with the Paper Checklist — a fixed
// list of Yes/No/NA questions, each with a short justification. Papers
// without it are desk-rejected, and the checklist does NOT count toward
// the page limit.
//
// `CHECKLIST_QUESTIONS` carries the exact 2025 wording (verbatim from
// `neurips_2025.tex`). `<NeurIPSChecklist />` emits a
// `role="checklist"` section the template styles as a page-broken,
// plain numbered list (NOT auto-section-numbered). Authors supply their
// per-question answers; anything omitted renders as "[TODO]".

export type ChecklistQuestion = {
  title: string;
  question: string;
};

// Verbatim from neurips_2025.tex (the 2025 checklist, 16 questions).
export const CHECKLIST_QUESTIONS: ChecklistQuestion[] = [
  {
    title: "Claims",
    question:
      "Do the main claims made in the abstract and introduction accurately reflect the paper's contributions and scope?"
  },
  {
    title: "Limitations",
    question: "Does the paper discuss the limitations of the work performed by the authors?"
  },
  {
    title: "Theory assumptions and proofs",
    question:
      "For each theoretical result, does the paper provide the full set of assumptions and a complete (and correct) proof?"
  },
  {
    title: "Experimental result reproducibility",
    question:
      "Does the paper fully disclose all the information needed to reproduce the main experimental results of the paper to the extent that it affects the main claims and/or conclusions of the paper (regardless of whether the code and data are provided or not)?"
  },
  {
    title: "Open access to data and code",
    question:
      "Does the paper provide open access to the data and code, with sufficient instructions to faithfully reproduce the main experimental results, as described in supplemental material?"
  },
  {
    title: "Experimental setting/details",
    question:
      "Does the paper specify all the training and test details (e.g., data splits, hyperparameters, how they were chosen, type of optimizer, etc.) necessary to understand the results?"
  },
  {
    title: "Experiment statistical significance",
    question:
      "Does the paper report error bars suitably and correctly defined or other appropriate information about the statistical significance of the experiments?"
  },
  {
    title: "Experiments compute resources",
    question:
      "For each experiment, does the paper provide sufficient information on the computer resources (type of compute workers, memory, time of execution) needed to reproduce the experiments?"
  },
  {
    title: "Code of ethics",
    question:
      "Does the research conducted in the paper conform, in every respect, with the NeurIPS Code of Ethics https://neurips.cc/public/EthicsGuidelines?"
  },
  {
    title: "Broader impacts",
    question:
      "Does the paper discuss both potential positive societal impacts and negative societal impacts of the work performed?"
  },
  {
    title: "Safeguards",
    question:
      "Does the paper describe safeguards that have been put in place for responsible release of data or models that have a high risk for misuse (e.g., pretrained language models, image generators, or scraped datasets)?"
  },
  {
    title: "Licenses for existing assets",
    question:
      "Are the creators or original owners of assets (e.g., code, data, models), used in the paper, properly credited and are the license and terms of use explicitly mentioned and properly respected?"
  },
  {
    title: "New assets",
    question:
      "Are new assets introduced in the paper well documented and is the documentation provided alongside the assets?"
  },
  {
    title: "Crowdsourcing and research with human subjects",
    question:
      "For crowdsourcing experiments and research with human subjects, does the paper include the full text of instructions given to participants and screenshots, if applicable, as well as details about compensation (if any)?"
  },
  {
    title: "Institutional review board (IRB) approvals or equivalent for research with human subjects",
    question:
      "Does the paper describe potential risks incurred by study participants, whether such risks were disclosed to the subjects, and whether Institutional Review Board (IRB) approvals (or an equivalent approval/review based on the requirements of your country or institution) were obtained?"
  },
  {
    title: "Declaration of LLM usage",
    question:
      "Does the paper describe the usage of LLMs if it is an important, original, or non-standard component of the core methods in this research? Note that if the LLM is used only for writing, editing, or formatting purposes and does not impact the core methodology, scientific rigorousness, or originality of the research, declaration is not required."
  }
];

export type ChecklistAnswer = {
  // One of "Yes", "No", or "NA" — defaults to "[TODO]" when omitted.
  answer?: string;
  // 1–2 sentence justification — defaults to "[TODO]" when omitted.
  justification?: string;
};

export type NeurIPSChecklistProps = {
  // Per-question answers, in the same order as CHECKLIST_QUESTIONS.
  // Provide fewer than 16 and the remainder render as "[TODO]".
  answers?: ChecklistAnswer[];
};

const TODO = "[TODO]";

// Emit the checklist as a `role="checklist"` section. The template gives
// it a page break, an unnumbered bold heading, and a plain ordered list.
export function NeurIPSChecklist({ answers = [] }: NeurIPSChecklistProps = {}): React.ReactElement {
  return (
    <section role="checklist" title="NeurIPS Paper Checklist">
      <list ordered>
        {CHECKLIST_QUESTIONS.map((q, i) => {
          const a = answers[i] ?? {};
          // `key` isn't part of the <item> prop type (see CLAUDE.md
          // "key prop on intrinsics"); stamp it via cloneElement.
          return React.cloneElement(
            <item>
              <p>
                <strong>{q.title}</strong>
              </p>
              <p>Question: {q.question}</p>
              <p>Answer: {a.answer ?? TODO}</p>
              <p>Justification: {a.justification ?? TODO}</p>
            </item>,
            { key: `nips-check-${i}` }
          );
        })}
      </list>
    </section>
  );
}
