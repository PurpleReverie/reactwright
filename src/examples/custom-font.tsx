import { writeFile, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { renderResolvedToHTML } from "../backends/html/render.js";
import { buildPdfFromResolved } from "../backends/latex/build.js";
import { renderContentToIR } from "../content/render.js";
import { registerFont } from "../fonts/registry.js";
import { resolveDocument } from "../resolver/resolve.js";
import { renderTemplateToIR } from "../template/render.js";

registerFont("Permanent Marker", {
  html: {
    kind: "link",
    href: "https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap"
  },
  latex: { command: "\\bfseries\\sffamily" }
});

registerFont("Caveat", {
  html: {
    kind: "link",
    href: "https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap"
  },
  latex: { command: "\\itshape\\rmfamily" }
});

registerFont("Indie Flower", {
  html: {
    kind: "link",
    href: "https://fonts.googleapis.com/css2?family=Indie+Flower&display=swap"
  },
  latex: { command: "\\sffamily" }
});

registerFont("Comic Neue", {
  html: {
    kind: "link",
    href: "https://fonts.googleapis.com/css2?family=Comic+Neue:ital,wght@0,400;0,700;1,400&display=swap"
  },
  latex: { command: "\\sffamily" }
});

const Paper = () => (
  <document title="Why Cats Are Better Project Managers Than Humans" author="Dr. Whiskers P. Fluffington, DVM, PhD, MBA">
    <abstract>
      <paragraph>
        This paper presents a rigorous, peer-reviewed analysis of feline leadership
        behaviours as applied to modern software project management. Drawing on twelve
        years of observational data collected from one (1) cat named Gerald, we
        demonstrate that cats outperform human project managers across every measurable
        dimension: deadline flexibility, meeting attendance, and strategic napping. Our
        findings have significant implications for enterprise agile transformation
        initiatives worldwide.
      </paragraph>
    </abstract>

    <section title="Introduction">
      <paragraph>
        The field of project management has long been dominated by humans armed with
        Gantt charts, stand-up ceremonies, and an inexplicable faith in velocity points.
        We propose a radical alternative: the domestic cat (<em>Felis catus</em>), an
        organism that has spent 10,000 years perfecting the art of{" "}
        <font family="Permanent Marker">doing exactly what it wants</font>, when it
        wants, while making everyone around it feel vaguely responsible.
      </paragraph>
      <paragraph>
        Prior literature on animal leadership is surprisingly sparse. Most organisational
        theorists have focused on wolves, dolphins, or the occasional inspirational
        poster featuring an eagle. This paper fills a{" "}
        <font family="Caveat">critical gap</font>.
      </paragraph>
    </section>

    <section title="Deadline Management">
      <paragraph>
        Human project managers treat deadlines as{" "}
        <font family="Permanent Marker">fixed points in time</font>. This is their first
        mistake. Gerald treats deadlines as suggestions, guidelines, or objects to push
        off the edge of a table while maintaining direct eye contact. In 94% of observed
        cases, the project still shipped. The remaining 6% were rebranded as{" "}
        <font family="Caveat"><em>phased rollouts</em></font>.
      </paragraph>
      <paragraph>
        When a deadline approaches, Gerald's standard procedure is to sit directly on
        top of the laptop keyboard, inserting the string <code>;;;;;;;;;</code> into
        every open document. Remarkably, this generates{" "}
        <font family="Indie Flower">no more defects than the average sprint</font>. We
        consider this statistically significant.
      </paragraph>
    </section>

    <section title="Communication Style">
      <paragraph>
        Effective project managers communicate status clearly and concisely. Gerald
        communicates exclusively through three channels:{" "}
        <font family="Caveat">a slow blink indicating approval</font>,{" "}
        <font family="Indie Flower">a rapid chirping sound indicating a blocked dependency</font>,
        and <font family="Permanent Marker">knocking a full glass of water onto the product roadmap</font>{" "}
        indicating scope creep.
      </paragraph>
      <paragraph>
        In user interviews, stakeholders described Gerald's status updates as
        <em>refreshingly honest</em>, <em>impossible to misinterpret</em>, and
        <em>somehow more detailed than the Jira tickets</em>. One VP of Engineering
        noted that Gerald's chirping noise conveyed more urgency than six weeks of
        escalation emails. We agree.
      </paragraph>
    </section>

    <section title="Meeting Efficiency">
      <paragraph>
        The average software team spends{" "}
        <font family="Permanent Marker">31 hours per week</font> in meetings. Gerald
        attends every meeting by sitting in the centre of the conference table and
        refusing to move. Meetings with Gerald present are{" "}
        <font family="Caveat">40% shorter</font>. Participants report a strong desire to
        reach consensus quickly and leave the room.
      </paragraph>
      <paragraph>
        Gerald has never produced meeting notes. He has also never needed to — attendees
        remember decisions made in his presence with unusual clarity, possibly due to
        <font family="Indie Flower">mild psychological pressure</font>.
      </paragraph>
    </section>

    <section title="Strategic Napping">
      <paragraph>
        Human managers undervalue rest. Gerald sleeps an average of{" "}
        <font family="Permanent Marker">16 hours per day</font> and has never once
        apologised for it. Research consistently links sleep deprivation to poor
        decision-making, increased risk tolerance, and an inexplicable belief that{" "}
        <font family="Caveat">microservices will solve the problem</font>. Gerald is
        immune to all three.
      </paragraph>
      <paragraph>
        We recommend that all project managers adopt a minimum napping schedule of four
        hours daily. Organisations that have piloted this programme report improved
        morale, reduced incident rates, and a{" "}
        <font family="Indie Flower">12% increase</font> in the number of engineers who
        show up to retrospectives without visibly wanting to leave.
      </paragraph>
    </section>

    <section title="Work-Life Balance">
      <paragraph>
        Gerald does not have a work-life balance. Gerald has{" "}
        <font family="Permanent Marker">a life</font>, within which work occasionally
        occurs. He has never checked Slack after 6pm. He has never felt guilty about it.
        He once received a PagerDuty alert and sat on the phone until it stopped. The
        on-call rotation was subsequently restructured.
      </paragraph>
    </section>

    <section title="Conclusion">
      <paragraph>
        The evidence is unambiguous. Cats possess an innate capacity for{" "}
        <font family="Caveat">strategic prioritisation</font>,{" "}
        <font family="Indie Flower">ruthless scope reduction</font>, and an almost
        supernatural ability to identify which meetings could have been an email. We
        strongly recommend that organisations consider replacing at minimum one (1)
        senior project manager with a suitably qualified cat before the end of the
        current fiscal year.
      </paragraph>
      <paragraph>
        Gerald is{" "}
        <font family="Permanent Marker"><strong>not available for consulting engagements</strong></font>.
        He is busy.
      </paragraph>
    </section>
  </document>
);

const ChaosTemplate = () => (
  <page style={{ size: "a4", margin: "22mm", fontSize: "11pt", lineHeight: 1.45 }}>
    <stack gap="8mm">
      <box
        style={{
          fontFamily: "Permanent Marker",
          fontSize: "16pt",
          textAlign: "center",
          paddingBottom: "5mm",
          borderBottom: "3pt solid #1e293b"
        }}
      >
        <slot name="title" />
      </box>

      <box
        style={{
          fontFamily: "Caveat",
          fontSize: "13pt",
          textAlign: "center"
        }}
      >
        <slot name="author" />
      </box>

      <box
        style={{
          fontFamily: "Indie Flower",
          fontSize: "10.5pt",
          backgroundColor: "#fef9c3",
          padding: "5mm",
          border: "1pt solid #ca8a04"
        }}
      >
        <slot name="abstract" />
      </box>

      <box style={{ fontFamily: "Comic Neue" }}>
        <slot name="body" />
      </box>
    </stack>
  </page>
);

const documentTree = renderContentToIR(<Paper />);
const templateTree = renderTemplateToIR(<ChaosTemplate />);
const resolvedTree = resolveDocument(documentTree, templateTree);

const outputDir = resolve("build/custom-font");
await mkdir(outputDir, { recursive: true });

const htmlPath = join(outputDir, "custom-font.html");
await writeFile(htmlPath, renderResolvedToHTML(resolvedTree), "utf8");
console.log(`HTML written to ${htmlPath}`);

const result = await buildPdfFromResolved(resolvedTree, {
  outputDir,
  baseName: "custom-font"
});
console.log(`PDF written to ${result.pdfPath}`);
