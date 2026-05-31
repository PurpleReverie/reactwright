import "reactwright/jsx";

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { Template } from "@reactwright/template-report";

// Sample report mockup exercising the technical/business report
// template. Includes an executive summary, four numbered sections, a
// figure, a table, inline citations, and a numeric bibliography. All
// names, figures, and findings here are invented for layout purposes.

export { Template };

const FIGURE_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../packages/reactwright/tests/fixtures/reactwright-diagram.svg"
);

export default function ReportSample() {
  return (
    <document
      title="Quarterly Performance Review: Q3 Operations"
      author="Internal Audit Group — October 2031"
    >
      <section role="abstract" title="Executive Summary">
        <p>
          Operations in the third quarter of 2031 exceeded the baseline
          performance envelope across three of four tracked metrics.
          Throughput rose 14% year-over-year against a 6% target. Defect
          rate fell to 0.8%, the lowest recorded since metric collection
          began. Customer satisfaction scores held steady at 4.2 of 5.0.
          The single regression was order-to-ship latency, which slipped
          0.3 days against a flat target; the responsible bottleneck has
          been identified and a remediation plan is included in
          section 4. The review recommends approval of the proposed Q4
          headcount expansion of three positions in fulfillment.
        </p>
      </section>

      <section title="Methodology">
        <p>
          This review covers the period from 1 July 2031 through 30
          September 2031. Data was collected from the operations data
          warehouse, the customer feedback system, and quarterly survey
          instruments distributed to seventeen line managers
          <cite cite="opsdw2031" />. Statistical comparisons against
          prior periods use the rolling four-quarter baseline as
          defined in the standard operations review framework
          <cite cite="orframework2030" />.
        </p>
        <p>
          All figures cited in this report are reproducible from the
          underlying data set as of the close of the quarter. No
          adjustments have been applied to raw metric streams except
          for the seasonal normalization documented in the methodology
          appendix.
        </p>
      </section>

      <section title="Throughput and Defect Rate">
        <p>
          Throughput, measured in completed work units per business
          day, averaged 1,847 over the quarter against a baseline of
          1,620. The 14% gain is attributable primarily to the
          fulfillment-line upgrade completed in late June, whose
          impact is visible in the month-over-month trend shown in
          Figure 1.
        </p>

        <figure
          id="fig-throughput"
          src={FIGURE_PATH}
          width="100mm"
        >
          <caption>
            Monthly throughput trend, Q3 2031 against the rolling
            four-quarter baseline. The shaded band shows the
            previously-established performance envelope.
          </caption>
        </figure>

        <p>
          Defect rate fell to 0.8%, well below the 1.5% baseline and
          the 2.0% acceptance threshold. The improvement is
          consistent with the projected effect of the inspection
          protocol revision introduced at the start of the quarter
          <cite cite="qcrev2031" />.
        </p>

        <section title="Cross-shift comparison">
          <p>
            Subdividing the throughput data by shift reveals a modest
            but persistent gap between day and evening shifts, shown
            in Table 1. The gap has narrowed over the quarter but
            remains larger than the historical norm. We recommend
            continued monitoring rather than immediate intervention.
          </p>

          <table>
            <caption>
              Throughput by shift, Q3 2031 (work units per business day).
            </caption>
            <row>
              <cell header><p>Shift</p></cell>
              <cell header><p>July</p></cell>
              <cell header><p>August</p></cell>
              <cell header><p>September</p></cell>
              <cell header><p>Quarter</p></cell>
            </row>
            <row>
              <cell><p>Day</p></cell>
              <cell><p>1,902</p></cell>
              <cell><p>1,924</p></cell>
              <cell><p>1,961</p></cell>
              <cell><p>1,929</p></cell>
            </row>
            <row>
              <cell><p>Evening</p></cell>
              <cell><p>1,718</p></cell>
              <cell><p>1,742</p></cell>
              <cell><p>1,774</p></cell>
              <cell><p>1,745</p></cell>
            </row>
            <row>
              <cell><p>Overnight</p></cell>
              <cell><p>1,851</p></cell>
              <cell><p>1,866</p></cell>
              <cell><p>1,888</p></cell>
              <cell><p>1,868</p></cell>
            </row>
          </table>
        </section>
      </section>

      <section title="Customer Satisfaction">
        <p>
          Composite customer satisfaction held at 4.2 out of 5.0,
          essentially unchanged from the prior quarter. The component
          metrics moved in opposite directions: perceived quality rose
          0.1, while perceived speed fell 0.1. The speed regression
          aligns with the order-to-ship latency issue discussed in
          section 4.
        </p>
        <p>
          Survey response rate was 38%, consistent with the historical
          range of 35% to 42% <cite cite="csurv2031" />.
        </p>
      </section>

      <section title="Order-to-Ship Latency">
        <p>
          Order-to-ship latency averaged 2.7 business days against a
          flat target of 2.4. The regression originates in a single
          step of the fulfillment pipeline: pick-list reconciliation,
          which has accumulated a backlog of approximately 1,200
          orders per week since mid-August.
        </p>

        <section title="Identified bottleneck">
          <p>
            Root-cause analysis traces the backlog to insufficient
            staffing in the reconciliation team following the
            departure of two analysts in July. The team currently
            operates at 60% of historical capacity. The proposed Q4
            headcount expansion (three positions) is sized to restore
            full capacity with margin for vacation coverage
            <cite cite="hrforecast2031" />.
          </p>
        </section>

        <section title="Proposed remediation">
          <p>
            Subject to executive approval, three reconciliation
            analyst positions will be posted by 15 October with target
            start dates before year-end. The forecast model projects
            latency returning to baseline within two pay periods of
            the new staff reaching full productivity.
          </p>
        </section>
      </section>

      <refs>
        <ref-entry refKey="opsdw2031">
          Operations Data Warehouse v4.2, Q3 2031 snapshot. Internal data set, 2 October 2031.
        </ref-entry>
        <ref-entry refKey="orframework2030">
          Operations Review Framework, revision 3. Internal standard, March 2030.
        </ref-entry>
        <ref-entry refKey="qcrev2031">
          Quality Control Protocol Revision, July 2031 edition. Internal procedure document.
        </ref-entry>
        <ref-entry refKey="csurv2031">
          Customer Satisfaction Survey, Q3 2031. Survey instrument and raw results.
        </ref-entry>
        <ref-entry refKey="hrforecast2031">
          Human Resources Capacity Forecast, October 2031. Internal planning document.
        </ref-entry>
      </refs>
    </document>
  );
}
