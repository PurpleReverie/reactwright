import "reactwright/jsx";

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { Template } from "@reactwright/template-ieee-report";

// Sample IEEE technical-report mockup exercising the single-column
// long-form variant of the IEEE template. Includes a title block with
// affiliation, italic abstract, four numbered top-level sections with
// subsections, one figure, one table, several inline citations, and a
// numeric bibliography. All names, figures, and findings here are
// invented for layout purposes.

export { Template };

const FIGURE_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../packages/reactwright/tests/fixtures/reactwright-diagram.svg"
);

export default function IEEEReportSample() {
  return (
    <document
      title="Performance Characterization of a Distributed Cache Subsystem"
      author="P. T. Halloran, K. A. Devereaux, and M. S. Okafor"
    >
      <section role="abstract" title="">
        <p>
          <em>Abstract</em>—We present a measurement-driven characterization
          of a distributed in-memory cache subsystem deployed across three
          geographic regions over a six-month interval. The system serves
          a steady-state load of approximately 1.2 million requests per
          second with a hit rate of 94.6%, against a previously
          uninstrumented baseline. We describe the instrumentation
          approach, the workload model used to validate the characterization,
          and the steady-state performance envelope under three
          representative load mixes. We identify two distinct
          tail-latency regimes attributable to cross-region replication
          and report on a mitigation that reduces the upper tail by 41%
          without measurable impact on hit rate.
        </p>
      </section>

      <section title="Introduction">
        <p>
          Distributed in-memory caches occupy a load-bearing role in
          modern high-throughput services <cite cite="dean2013tail" />.
          Their performance envelope is well-studied in the steady state
          <cite cite="ousterhout2015ramcloud" />, but the interaction
          between replication topology and request-level tail latency
          remains the subject of active research
          <cite cite="li2014tachyon" />. The system described in this
          report has been in production for fourteen months and serves
          as a substrate for a customer-facing application with a
          published 99.9% availability commitment.
        </p>
        <p>
          Prior to the work described here, the cache subsystem was
          treated as a black box for capacity-planning purposes. Failures
          and regressions were diagnosed reactively, and capacity
          headroom was estimated by linear extrapolation from peak
          request rate. The characterization presented in this report
          replaces that approach with a measurement-driven model that
          accounts for both hit rate and tail latency under realistic
          load mixes.
        </p>
        <p>
          The remainder of this report is organized as follows.
          Section II describes the instrumentation approach and the
          workload model used to validate it. Section III presents the
          measured steady-state envelope. Section IV identifies and
          quantifies two distinct tail-latency regimes. Section V
          describes a mitigation and reports its measured effect.
        </p>
      </section>

      <section title="Instrumentation and Workload Model">
        <p>
          Instrumentation was deployed in two phases. The first phase
          added per-request timing at the cache-client library level
          across all calling services. The second phase added
          per-shard timing at the cache-server tier, with a
          synchronized clock source <cite cite="corbett2013spanner" />
          to enable cross-tier latency decomposition.
        </p>

        <section title="Per-request timing">
          <p>
            Per-request timing instruments four points: client-side
            request issuance, server-side request receipt, server-side
            response transmission, and client-side response receipt.
            The four points decompose end-to-end latency into network
            transit, server queuing, server processing, and client
            queuing components.
          </p>
        </section>

        <section title="Synthetic workload generation">
          <p>
            A synthetic workload generator replays a sampled trace of
            production requests against a dedicated test cluster. The
            generator preserves the temporal distribution of inter-arrival
            times, the key distribution (which is heavily skewed), and
            the read/write mix. The generated load is used to
            characterize the steady-state envelope without exposing
            production traffic to the experimental configurations.
          </p>

          <section title="Trace sampling">
            <p>
              The trace is sampled uniformly at one request per thousand,
              with the sample maintained as a sliding window of the
              most recent twenty-four hours. Sampling at this rate
              preserves the heavy-tailed key distribution to within 2%
              of the observed production distribution at the 99th
              percentile.
            </p>
          </section>
        </section>
      </section>

      <section title="Steady-State Performance">
        <p>
          Figure 1 shows the measured throughput-latency envelope under
          three representative load mixes: read-heavy (95% read, 5%
          write), balanced (60% read, 40% write), and write-heavy (40%
          read, 60% write). The envelope is consistent with the model
          predicted by <cite cite="ousterhout2015ramcloud" /> for
          comparable hardware and clearly identifies the knee at which
          tail latency begins to dominate end-to-end response time.
        </p>

        <figure
          id="fig-envelope"
          src={FIGURE_PATH}
          width="120mm"
        >
          <caption>
            Measured throughput-latency envelope for three load mixes
            against the predicted model. The vertical dashed line marks
            the configured operating point.
          </caption>
        </figure>

        <p>
          Table I summarizes the hit-rate and p99 latency measurements
          for each load mix at the configured operating point. The
          balanced mix exhibits the lowest hit rate, attributable to
          the larger working-set size induced by the write fraction;
          the write-heavy mix exhibits the highest p99 latency,
          attributable to the cross-region replication path described
          in Section IV.
        </p>

        <table>
          <caption>
            Steady-state measurements at the configured operating point.
          </caption>
          <row>
            <cell header><p>Load mix</p></cell>
            <cell header><p>Hit rate</p></cell>
            <cell header><p>p50 latency</p></cell>
            <cell header><p>p99 latency</p></cell>
          </row>
          <row>
            <cell><p>Read-heavy</p></cell>
            <cell><p>96.1%</p></cell>
            <cell><p>0.42 ms</p></cell>
            <cell><p>3.1 ms</p></cell>
          </row>
          <row>
            <cell><p>Balanced</p></cell>
            <cell><p>93.4%</p></cell>
            <cell><p>0.51 ms</p></cell>
            <cell><p>4.8 ms</p></cell>
          </row>
          <row>
            <cell><p>Write-heavy</p></cell>
            <cell><p>94.7%</p></cell>
            <cell><p>0.58 ms</p></cell>
            <cell><p>7.2 ms</p></cell>
          </row>
        </table>
      </section>

      <section title="Tail Latency Regimes">
        <p>
          Decomposing the measured p99 latency by tier reveals two
          distinct regimes. The first regime, observed under the
          read-heavy mix, is dominated by server-side queuing on
          individual shards. This regime is well-modelled by a
          single-server M/M/1 queue at moderate utilization
          <cite cite="kleinrock1975queueing" /> and is consistent with
          the characterization in <cite cite="dean2013tail" />.
        </p>

        <section title="Cross-region replication tail">
          <p>
            The second regime, observed under the write-heavy mix, is
            dominated by cross-region replication latency. Writes are
            synchronously replicated to a secondary region for
            durability, and the replication path traverses a public
            internet segment with measurably wider latency distribution
            than the intra-region path. The p99 of the replication
            latency alone accounts for 73% of the end-to-end p99 latency
            under the write-heavy mix.
          </p>
        </section>
      </section>

      <section title="Mitigation and Measured Effect">
        <p>
          We deployed a quorum-write protocol against the replication
          path that completes the write once a majority of replicas
          (two of three) have acknowledged. The protocol preserves the
          durability guarantee under the assumption of single-region
          failure and reduces the upper-tail dependence on the slowest
          replica. The measured effect, taken over the two-week period
          following deployment, is a 41% reduction in p99 latency under
          the write-heavy mix without measurable impact on hit rate or
          on the durability metric reported by the replication audit
          system.
        </p>
        <p>
          The mitigation has been in production since week 18 of the
          characterization interval. No durability incidents
          attributable to the quorum-write protocol have been observed
          to date.
        </p>
      </section>

      <refs>
        <ref-entry refKey="dean2013tail">
          J. Dean and L. A. Barroso, "The Tail at Scale,"
          <em>Communications of the ACM</em>, vol. 56, no. 2, pp. 74-80,
          2013.
        </ref-entry>
        <ref-entry refKey="ousterhout2015ramcloud">
          J. Ousterhout et al., "The RAMCloud Storage System,"
          <em>ACM Transactions on Computer Systems</em>, vol. 33, no. 3,
          pp. 1-55, 2015.
        </ref-entry>
        <ref-entry refKey="li2014tachyon">
          H. Li et al., "Tachyon: Reliable, Memory Speed Storage for
          Cluster Computing Frameworks," in <em>Proc. ACM Symposium on
          Cloud Computing</em>, pp. 1-15, 2014.
        </ref-entry>
        <ref-entry refKey="corbett2013spanner">
          J. C. Corbett et al., "Spanner: Google's Globally-Distributed
          Database," <em>ACM Transactions on Computer Systems</em>,
          vol. 31, no. 3, pp. 1-22, 2013.
        </ref-entry>
        <ref-entry refKey="kleinrock1975queueing">
          L. Kleinrock, <em>Queueing Systems, Volume 1: Theory</em>.
          New York, NY: Wiley-Interscience, 1975.
        </ref-entry>
      </refs>
    </document>
  );
}
