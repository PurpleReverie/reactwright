import "reactwright/jsx";

import { Template } from "@reactwright/template-letter";

// Sample formal-letter mockup exercising every region of the letter
// template: letterhead, date, addressee, subject, salutation, two body
// paragraphs, closing, and signature block. Names, addresses, and
// subject line are invented for layout purposes.

export { Template };

export default function LetterSample() {
  return (
    <document
      title="Letter to Dr. R. Quinlan"
      author="Alex Marsh"
    >
      <section role="letterhead" title="Alex Marsh">
        <p>142 Pine Street</p>
        <p>Carrick, NY 10001</p>
        <p>alex.marsh@example.com  ·  (212) 555-0142</p>
      </section>

      <section role="date" title="">
        <p>1 October 2026</p>
      </section>

      <section role="addressee" title="">
        <p>Dr. R. Quinlan</p>
        <p>Department of Computer Science</p>
        <p>State University</p>
        <p>1400 Washington Avenue</p>
        <p>Albany, NY 12222</p>
      </section>

      <section role="subject" title="">
        <p>Re: Submission for Q3 review</p>
      </section>

      <section role="salutation" title="">
        <p>Dear Dr. Quinlan,</p>
      </section>

      <p>
        I am writing to submit the enclosed manuscript, <em>Performance
        Characterization of a Distributed Cache Subsystem</em>, for
        consideration in the Q3 review cycle of the departmental
        working-papers series. The manuscript reports on a
        measurement-driven characterization of a production cache
        deployed across three geographic regions over a six-month
        interval, and identifies a mitigation that reduces upper-tail
        latency by 41% without affecting hit rate. The work draws on
        and extends the framework described in your 2023 paper on
        cross-region replication, and I would value your reading
        before I attempt to place it externally.
      </p>

      <p>
        I have also included a short cover note summarizing the three
        principal claims and pointing to the measurement appendix. I
        am happy to revise on whatever timeline suits the review
        cycle, and I would be glad to discuss the work in person or
        by phone if that would be useful. Thank you in advance for
        your time and your consideration.
      </p>

      <section role="closing" title="">
        <p>Sincerely,</p>
      </section>

      <section role="signature" title="">
        <p>Alex Marsh</p>
        <p>Independent Researcher</p>
        <p>Carrick, NY</p>
      </section>
    </document>
  );
}
