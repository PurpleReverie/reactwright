---
title: "EmpathBot: A Multimodal Conversational Agent for Post-Visit Reflection"
authors:
  - name: "Taura J. Greig"
    affiliation: "University of Auckland"
    address: "Auckland, New Zealand"
    email: "tgre088@aucklanduni.ac.nz"
  - name: "Preeti Verma"
    affiliation: "University of Auckland"
    address: "Auckland, New Zealand"
    email: "pver728@aucklanduni.ac.nz"
  - name: "Kanishka Singh"
    affiliation: "University of Auckland"
    address: "Auckland, New Zealand"
    email: "ksin406@aucklanduni.ac.nz"
abstract: >
  EmpathBot is a multimodal conversational system designed to help older adults
  reflect on a recent doctor's visit. The system fuses real-time facial emotion
  recognition with speech-to-text transcription and a large language model
  reasoning agent. We describe the deployed three-tier architecture, the
  EmpathBot classifier, and an experimental comparison against published facial
  expression recognition benchmarks. Across these settings the agent recovers
  the salient affect of the conversation while remaining responsive on
  commodity hardware.
---

# Introduction

Conversational agents are increasingly deployed in healthcare settings, yet
older adults remain underserved by interfaces that assume fast typing and
sustained attention (Mubarak & Suomi, 2022). EmpathBot targets *post-visit
reflection*: a short, spoken debrief in which the system mirrors back what the
patient appears to feel and helps them consolidate the clinician's advice.

The contributions of this paper are threefold:

1. A three-tier architecture that runs facial emotion recognition,
   transcription, and language reasoning concurrently.
2. The EmpathBot classifier and its training regime.
3. An evaluation against established benchmarks (Mollahosseini et al., 2019).

# Related Work

Conversational agents in healthcare have been surveyed extensively (Laranjo et
al., 2018). Facial expression recognition has advanced rapidly with deep
residual networks (He et al., 2016) and transformer-based recognizers (Mao et
al., 2023). Our work differs in coupling affect recognition with a language
model for *reflection* rather than diagnosis.

# Architecture

EmpathBot is organized into a perception tier, a reasoning tier, and a
presentation tier. The perception tier ingests audio and video; the reasoning
tier fuses the resulting signals; the presentation tier renders an empathetic
spoken response.

## Perception tier

The perception tier performs facial emotion recognition on the video stream and
streaming speech-to-text on the audio. We adopt a residual backbone (He et al.,
2016) because it remains a strong baseline under the latency budget imposed by
on-device inference. The tier exposes three signals:

- a per-frame emotion distribution over seven classes;
- a streaming transcript with word-level timestamps;
- a voice-activity flag used to segment turns.

![A schematic of the EmpathBot three-tier pipeline, showing the perception, classifier, and LLM stages](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzODAiIGhlaWdodD0iMTYwIj48cmVjdCB4PSIxIiB5PSIxIiB3aWR0aD0iMzc4IiBoZWlnaHQ9IjE1OCIgZmlsbD0iI2YyZjJmMiIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjEiLz48bGluZSB4MT0iNDAiIHkxPSI4MCIgeDI9IjEyMCIgeTI9IjgwIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMS41Ii8+PHJlY3QgeD0iMTIwIiB5PSI1NSIgd2lkdGg9IjgwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjZmZmIiBzdHJva2U9IiMzMzMiLz48bGluZSB4MT0iMjAwIiB5MT0iODAiIHgyPSIyODAiIHkyPSI4MCIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjEuNSIvPjxyZWN0IHg9IjI4MCIgeT0iNTUiIHdpZHRoPSI2MCIgaGVpZ2h0PSI1MCIgZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjMzMzIi8+PHRleHQgeD0iMTYwIiB5PSI4NCIgZm9udC1mYW1pbHk9InNlcmlmIiBmb250LXNpemU9IjExIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjMzMzIj5jbGFzc2lmaWVyPC90ZXh0Pjx0ZXh0IHg9IjMxMCIgeT0iODQiIGZvbnQtZmFtaWx5PSJzZXJpZiIgZm9udC1zaXplPSIxMSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzMzMyI+TExNPC90ZXh0Pjx0ZXh0IHg9IjE5MCIgeT0iMTM1IiBmb250LWZhbWlseT0ic2VyaWYiIGZvbnQtc2l6ZT0iMTEiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM1NTUiPkVtcGF0aEJvdCB0aHJlZS10aWVyIHBpcGVsaW5lPC90ZXh0Pjwvc3ZnPg==)

## Reasoning tier

The reasoning tier aligns the emotion track with the transcript and prompts a
language model to produce a grounded reflection. Let $p_i$ be the predicted
probability of class $i$; the fused affect score weights each turn by its
voice-activity duration.

### Loss function

Class imbalance in the affect labels is mitigated with a focal objective (Lin
et al., 2017), defined for a target class with probability $p_t$ as

$$ \mathrm{FL}(p_t) = -(1 - p_t)^{\gamma} \log(p_t) $$

where $\gamma$ controls the down-weighting of well-classified examples. We use
the `gamma=2.0` setting throughout.

# Experiments

We compare the EmpathBot classifier against two published facial expression
recognition systems on a held-out validation split. Accuracy and macro-F1 are
reported below.

Table: Validation accuracy and macro-F1 on the held-out split.

| Model       | Accuracy | Macro-F1 |
| ----------- | -------- | -------- |
| Baseline    | 0.71     | 0.66     |
| POSTER++    | 0.78     | 0.74     |
| EmpathBot   | 0.80     | 0.77     |

The EmpathBot classifier outperforms both baselines on macro-F1, indicating
more balanced performance across the minority affect classes. We note two
qualitative findings:

> Participants consistently preferred the reflective summaries over a literal
> transcript, describing them as "less clinical."

# Conclusion

EmpathBot shows that a modest multimodal pipeline can deliver empathetic
post-visit reflection on commodity hardware. Future work will extend the agent
to multi-session memory and evaluate it with a larger cohort of older adults.

# Acknowledgments

We thank the participants of the pilot study and the University of Auckland
for compute support. This work was conducted under institutional ethics
approval.

# References

Goodfellow, I. J., Erhan, D., Carrier, P. L., Courville, A., Mirza, M., Hamner, B., et al. (2013). Challenges in representation learning: A report on three machine learning contests. In *Neural Information Processing* (pp. 117–124). Springer.

He, K., Zhang, X., Ren, S., & Sun, J. (2016). Deep residual learning for image recognition. In *Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition* (pp. 770–778).

Laranjo, L., Dunn, A. G., Tong, H. L., Kocaballi, A. B., Chen, J., Bashir, R., et al. (2018). Conversational agents in healthcare: A systematic review. *Journal of the American Medical Informatics Association*, 25(9), 1248–1258.

Lin, T.-Y., Goyal, P., Girshick, R., He, K., & Dollár, P. (2017). Focal loss for dense object detection. In *Proceedings of the IEEE International Conference on Computer Vision* (pp. 2980–2988).

Mao, J., Xu, R., Yin, X., Chang, Y., Nie, B., & Huang, A. (2023). POSTER++: A simpler and stronger facial expression recognition network. *arXiv preprint* arXiv:2301.12149.

Mollahosseini, A., Hasani, B., & Mahoor, M. H. (2019). AffectNet: A database for facial expression, valence, and arousal computing in the wild. *IEEE Transactions on Affective Computing*, 10(1), 18–31.

Mubarak, R., & Suomi, R. (2022). Elderly forgotten? Digital exclusion in the information age and the rising grey digital divide. *INQUIRY: The Journal of Health Care Organization, Provision, and Financing*, 59, 1–7.

# Implementation Details

This appendix documents the training configuration omitted from the main text
for space.

## Hyperparameters

All models were trained with the AdamW optimizer for 40 epochs on a single
GPU. The focal-loss `gamma` was fixed at 2.0 and the base learning rate was
swept over $\{10^{-3}, 10^{-4}, 10^{-5}\}$.

# Additional Results

We report per-class F1 to complement the aggregate numbers in the main text.

Table: Per-class F1 on the validation split.

| Class     | Baseline | EmpathBot |
| --------- | -------- | --------- |
| Happiness | 0.84     | 0.88      |
| Sadness   | 0.61     | 0.72      |
| Anger     | 0.58     | 0.69      |
