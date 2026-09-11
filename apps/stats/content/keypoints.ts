/**
 * Section refreshers — the "study companion" layer. Hand-written, one screen or less per section.
 * The learner is assumed to have the OpenStax textbook; these refresh the essentials before a quiz and
 * re-teach the essentials after a miss. Keep every entry short: ≤ 6 points, ≤ 4 formulas, ≤ 5 terms, ≤ 3 pitfalls.
 */
export interface KeyPoints {
  points: string[];
  formulas?: string[];
  terms?: [string, string][];
  pitfalls?: string[];
}

export const KEY_POINTS: Record<string, KeyPoints> = {
  '1.1': {
    points: [
      'Population = every unit you care about; sample = the part you actually measure.',
      'Parameter describes the population (usually unknown); statistic describes the sample (computed from data).',
      'Variable = the characteristic recorded for each unit (name it with a capital letter, e.g. X); data = the actual values.',
      'Descriptive statistics summarize data; inferential statistics use a sample to draw conclusions about a population.',
      'Probability measures how likely an event is, on a 0–1 scale.',
    ],
    terms: [
      ['parameter', 'number describing a population (μ, σ, p)'],
      ['statistic', 'number describing a sample (x̄, s, p̂)'],
      ['representative sample', 'a sample whose characteristics match the population'],
    ],
    pitfalls: ['Mixing up parameter (population) and statistic (sample) — the sample average is a statistic.', 'Calling the values "the variable": the variable is the characteristic; the data are the values.'],
  },
  '1.2': {
    points: [
      'Qualitative (categorical) data are labels; quantitative data are numbers you can average.',
      'Quantitative discrete = counting (whole numbers); quantitative continuous = measuring (any value in a range).',
      'Sampling methods: simple random (every sample of size n equally likely), stratified (groups, sample from each), cluster (groups, take whole groups), systematic (every kth), convenience (whoever is handy — biased).',
      'Sampling error is natural variation between samples; nonsampling error comes from a flawed process (bias).',
      'Bigger samples reduce variability; a biased method is not fixed by a bigger sample.',
    ],
    terms: [
      ['sampling with replacement', 'a member can be chosen more than once'],
      ['stratified vs cluster', 'stratified samples inside every group; cluster takes all of a few groups'],
    ],
    pitfalls: ['Confusing stratified (some from every group) with cluster (all from some groups).', 'Treating numeric codes such as zip codes as quantitative — they are labels.'],
  },
  '1.3': {
    points: [
      'Relative frequency = frequency ÷ total number of observations; relative frequencies sum to 1.',
      'Cumulative relative frequency adds up the relative frequencies of that value and all smaller values.',
      'Levels of measurement: nominal (names, no order), ordinal (order, differences not meaningful), interval (differences meaningful, no true zero), ratio (true zero, ratios meaningful).',
      'Frequency tables organize data; check that the frequencies sum to n.',
    ],
    formulas: ['relative frequency = f / n', 'cumulative relative frequency = sum of relative frequencies up to and including the value'],
    pitfalls: ['Reporting a frequency when the question asks for a relative frequency (a proportion).', 'Temperature in °C is interval, not ratio: 0 °C is not "no temperature".'],
  },
  '1.4': {
    points: [
      'Explanatory variable is what the researcher changes; response variable is what is measured.',
      'Treatments are the values of the explanatory variable; experimental units are what receive them.',
      'Random assignment to treatment groups spreads lurking variables evenly; a control group and a placebo isolate the treatment effect.',
      'Blinding hides who got which treatment (single blind: subjects; double blind: subjects and evaluators).',
      'Ethics: informed consent, minimal risk, honest reporting; data collected on people needs oversight.',
    ],
    terms: [
      ['lurking variable', 'an unmeasured variable that affects both explanatory and response variables'],
      ['placebo', 'an inactive treatment that looks like the real one'],
    ],
    pitfalls: ['Reading causation from an observational study — only randomized experiments support causal claims.'],
  },
  '2.1': {
    points: [
      'A stem-and-leaf plot keeps every data value: stem = leading digit(s), leaf = last digit, leaves in order.',
      'It shows shape, clusters, gaps and outliers while preserving the raw numbers.',
      'Line graphs show a value against an ordered variable (often time); bar graphs compare categories (bars do not touch).',
      'Side-by-side stemplots compare two data sets on shared stems.',
    ],
    pitfalls: ['Forgetting to include stems with no leaves — they show gaps.', 'Using a bar graph for continuous numeric data (that is a histogram).'],
  },
  '2.2': {
    points: [
      'A histogram groups quantitative data into equal-width intervals; bar height = frequency (or relative frequency); bars touch.',
      'Choose interval boundaries that no data value falls on (e.g. start 0.5 below the smallest value).',
      'A frequency polygon connects the midpoints of histogram bars; overlay polygons to compare data sets.',
      'A time series graph plots values in time order and shows trends and cycles.',
      'Describe shape: symmetric, skewed left/right, number of peaks, gaps, outliers.',
    ],
    formulas: ['interval width = (largest − smallest) / number of bars (then round conveniently)'],
    pitfalls: ['Making histogram bars of unequal width — heights are then not comparable.'],
  },
  '2.3': {
    points: [
      'The kth percentile separates the lowest k% of the data from the rest; the median is the 50th percentile.',
      'Quartiles: Q1 = 25th percentile, Q2 = median, Q3 = 75th percentile; IQR = Q3 − Q1.',
      'OpenStax method: order the data; Q1 is the median of the lower half, Q3 the median of the upper half (exclude the median itself when n is odd).',
      'Potential outliers: below Q1 − 1.5·IQR or above Q3 + 1.5·IQR.',
      'Interpret a percentile in context and direction: "k% of the data are at or below this value."',
    ],
    formulas: ['IQR = Q3 − Q1', 'fences: Q1 − 1.5·IQR and Q3 + 1.5·IQR', 'position of the kth percentile: i = (k/100)(n + 1)'],
    pitfalls: ['Reading a percentile as a percent score — the 90th percentile means 90% of values are at or below.', 'Including the median in both halves when finding Q1 and Q3.'],
  },
  '2.4': {
    points: [
      'A box plot uses the five-number summary: minimum, Q1, median, Q3, maximum.',
      'The box spans Q1 to Q3 (the middle 50%); the line inside is the median; whiskers reach the min and max.',
      'Each of the four sections holds about 25% of the data — a longer section means more spread, not more data.',
      'Compare groups by lining up box plots on the same scale.',
    ],
    pitfalls: ['Thinking a longer whisker or box contains more data — it contains the same 25%, more spread out.', 'Assuming the median sits in the middle of the box; it shifts with skew.'],
  },
  '2.5': {
    points: [
      'Mean = sum of values ÷ n (uses every value; pulled toward outliers).',
      'Median = middle value of the ordered data (resistant to outliers). Mode = most frequent value.',
      'Sample mean is x̄; population mean is μ.',
      'From a frequency table: mean = Σ(value × frequency) / n; for grouped data use interval midpoints.',
      'The law of large numbers: as the sample size grows, x̄ tends toward μ.',
    ],
    formulas: ['x̄ = Σx / n', 'grouped: x̄ ≈ Σ(midpoint × f) / n'],
    pitfalls: ['Forgetting to order the data before finding the median.', 'Averaging the frequency column instead of weighting values by frequency.'],
  },
  '2.6': {
    points: [
      'Symmetric distribution: mean ≈ median ≈ mode.',
      'Skewed right (long right tail): mean > median; typically mode < median < mean.',
      'Skewed left (long left tail): mean < median; typically mean < median < mode.',
      'The mean moves toward the tail; the median is the better centre for skewed data.',
    ],
    pitfalls: ['Naming the skew by where the peak is — skew is named for the direction of the long tail.'],
  },
  '2.7': {
    points: [
      'Standard deviation measures typical distance from the mean; variance is its square.',
      'Sample: s = √(Σ(x − x̄)² / (n − 1)). Population: σ = √(Σ(x − μ)² / N).',
      'The z-score of a value counts standard deviations from the mean: z = (x − mean) / sd.',
      'Rule of thumb: values more than 2 standard deviations from the mean are unusual.',
      'Use z-scores to compare values from different distributions.',
    ],
    formulas: ['s = √( Σ(x − x̄)² / (n − 1) )', 'σ = √( Σ(x − μ)² / N )', 'z = (x − x̄) / s  (or (x − μ) / σ)', 'value = mean + z·sd'],
    pitfalls: ['Dividing by n instead of n − 1 for a sample standard deviation.', 'Forgetting the square root — reporting the variance as the standard deviation.'],
  },
  '3.1': {
    points: [
      'Experiment → outcomes; sample space S = all possible outcomes; an event is a subset of S.',
      'For equally likely outcomes, P(A) = (number of outcomes in A) / (number in S). Always 0 ≤ P(A) ≤ 1 and P(S) = 1.',
      'Complement: P(A′) = 1 − P(A).',
      'Conditional probability P(A|B) = P(A AND B) / P(B): the probability of A given that B happened.',
      'A OR B means at least one occurs; A AND B means both occur.',
    ],
    formulas: ['P(A′) = 1 − P(A)', 'P(A|B) = P(A AND B) / P(B)'],
    pitfalls: ['Confusing P(A|B) with P(B|A).', 'Forgetting that OR includes the case where both happen.'],
  },
  '3.2': {
    points: [
      'A and B are independent if knowing one does not change the other: P(A|B) = P(A), equivalently P(A AND B) = P(A)·P(B).',
      'A and B are mutually exclusive if they cannot both happen: P(A AND B) = 0, so P(A OR B) = P(A) + P(B).',
      'Sampling with replacement gives independent draws; without replacement the draws are dependent.',
      'Two events with nonzero probabilities cannot be both independent and mutually exclusive.',
    ],
    formulas: ['independent ⇔ P(A AND B) = P(A)·P(B)', 'mutually exclusive ⇔ P(A AND B) = 0'],
    pitfalls: ['Assuming "mutually exclusive" means "independent" — they are opposites for events that can occur.'],
  },
  '3.3': {
    points: [
      'Multiplication rule: P(A AND B) = P(B)·P(A|B); if independent, P(A AND B) = P(A)·P(B).',
      'Addition rule: P(A OR B) = P(A) + P(B) − P(A AND B); if mutually exclusive, drop the last term.',
      'Draw or tabulate the situation first, then pick the rule.',
    ],
    formulas: ['P(A AND B) = P(B)·P(A|B)', 'P(A OR B) = P(A) + P(B) − P(A AND B)'],
    pitfalls: ['Adding probabilities for OR without subtracting the overlap.', 'Multiplying P(A)·P(B) when the events are not independent.'],
  },
  '3.4': {
    points: [
      'A contingency table shows counts for two categorical variables; row and column totals are the marginals.',
      'P(A) = row (or column) total / grand total; P(A AND B) = cell / grand total.',
      'P(A|B) = cell / total of the B row or column (the condition shrinks the denominator).',
      'Check independence: does P(A|B) equal P(A)?',
    ],
    formulas: ['P(A AND B) = cell / grand total', 'P(A|B) = cell / (total for B)'],
    pitfalls: ['Using the grand total as the denominator for a conditional probability.'],
  },
  '3.5': {
    points: [
      'A tree diagram lists stages of an experiment; multiply along a branch for AND, add across branches for OR.',
      'Without replacement, the second-stage probabilities change (denominator drops by one).',
      'A Venn diagram shows overlap: P(A OR B) covers both circles; P(A AND B) is the overlap only.',
    ],
    pitfalls: ['Forgetting to reduce the denominator on the second draw without replacement.', 'Counting the overlap twice in a Venn diagram.'],
  },
  '4.1': {
    points: [
      'A discrete random variable takes countable values; its probability distribution (PDF) lists each value with its probability.',
      'Each probability is between 0 and 1, and all probabilities sum to 1.',
      'Notation: X is the variable, x a particular value; P(X = x) or P(x).',
    ],
    formulas: ['0 ≤ P(x) ≤ 1', 'ΣP(x) = 1'],
    pitfalls: ['Accepting a table whose probabilities do not sum to 1.'],
  },
  '4.2': {
    points: [
      'Expected value (mean) of a discrete random variable: μ = Σ x·P(x) — the long-run average.',
      'Standard deviation: σ = √( Σ (x − μ)²·P(x) ).',
      'For games of chance, expected value of winnings tells you the average gain or loss per play.',
    ],
    formulas: ['μ = Σ x·P(x)', 'σ = √( Σ (x − μ)²·P(x) )'],
    pitfalls: ['Averaging the x values without weighting by their probabilities.', 'Forgetting to subtract the cost of playing when computing expected winnings.'],
  },
  '4.3': {
    points: [
      'Binomial setting: fixed number of trials n, each trial success/failure, same p every trial, trials independent. X = number of successes.',
      'Notation X ~ B(n, p); q = 1 − p.',
      'Mean μ = np; standard deviation σ = √(npq).',
      'Calculator: binompdf(n, p, x) = P(X = x); binomcdf(n, p, x) = P(X ≤ x). P(X ≥ x) = 1 − binomcdf(n, p, x − 1).',
    ],
    formulas: ['μ = np', 'σ = √(npq)', 'P(X > x) = 1 − P(X ≤ x)'],
    pitfalls: ['Using binomcdf(n, p, x) for "more than x" without subtracting from 1 and adjusting x.', 'Treating draws without replacement from a small population as binomial.'],
  },
  '4.4': {
    points: [
      'Geometric: repeat independent trials with success probability p; X = the trial on which the first success occurs.',
      'P(X = x) = q^(x−1)·p, x = 1, 2, 3, …',
      'Mean μ = 1/p; variance σ² = (1/p)(1/p − 1).',
    ],
    formulas: ['P(X = x) = (1 − p)^(x−1)·p', 'μ = 1/p', 'σ² = (1/p)(1/p − 1)'],
    pitfalls: ['Counting failures instead of trials: X counts the total trials including the success.'],
  },
  '4.5': {
    points: [
      'Hypergeometric: sample without replacement from a group with r "successes" and b "failures"; X = number of successes in a sample of size n.',
      'Trials are dependent, so it is not binomial; use it when the sample is a noticeable share of the population.',
      'Mean μ = n·r/(r + b).',
    ],
    formulas: ['μ = n·r / (r + b)'],
    pitfalls: ['Using the binomial when sampling without replacement from a small group.'],
  },
  '4.6': {
    points: [
      'Poisson counts events in a fixed interval of time or space when events occur at a known average rate μ and independently.',
      'X ~ P(μ); P(X = x) = μ^x e^(−μ) / x!; mean = variance = μ.',
      'Scale the rate to the interval asked about (e.g. 3 per hour → 1.5 per half hour).',
      'Calculator: poissonpdf(μ, x), poissoncdf(μ, x).',
    ],
    formulas: ['P(X = x) = μ^x e^(−μ) / x!', 'μ = σ² (so σ = √μ)'],
    pitfalls: ['Using the hourly rate for a question about 20 minutes without rescaling μ.'],
  },
  '5.1': {
    points: [
      'A continuous random variable has a probability density function f(x); probability = area under the curve.',
      'The total area under f(x) is 1, and P(X = c) = 0 for any single value, so P(X < c) = P(X ≤ c).',
      'The cumulative distribution function is P(X ≤ x).',
    ],
    formulas: ['P(a < X < b) = area under f(x) from a to b', 'total area = 1'],
    pitfalls: ['Reading f(x) as a probability — only areas are probabilities.'],
  },
  '5.2': {
    points: [
      'Uniform X ~ U(a, b): every value between a and b equally likely; f(x) = 1/(b − a).',
      'P(c < X < d) = (d − c)/(b − a) — a rectangle: base × height.',
      'Mean μ = (a + b)/2; standard deviation σ = √((b − a)²/12).',
      'Conditional: P(X > c | X > k) uses the reduced interval (k, b).',
    ],
    formulas: ['f(x) = 1/(b − a)', 'P(c < X < d) = (d − c)/(b − a)', 'μ = (a + b)/2', 'σ = √((b − a)²/12)'],
    pitfalls: ['Forgetting to shrink the interval for a conditional probability.'],
  },
  '5.3': {
    points: [
      'Exponential X ~ Exp(m) models waiting times; m = decay rate = 1/μ, where μ is the mean.',
      'P(X < x) = 1 − e^(−mx); P(X > x) = e^(−mx).',
      'Mean μ = 1/m, standard deviation σ = μ. Memoryless: P(X > r + t | X > r) = P(X > t).',
      'Percentile k: solve 1 − e^(−mk) = p → k = −ln(1 − p)/m.',
    ],
    formulas: ['P(X < x) = 1 − e^(−mx)', 'P(X > x) = e^(−mx)', 'm = 1/μ, σ = μ', 'kth percentile: k = −ln(1 − p)/m'],
    pitfalls: ['Using μ where m is needed (or vice versa): m is the rate, μ the mean.'],
  },
  '6.1': {
    points: [
      'X ~ N(μ, σ): bell-shaped, symmetric about μ; μ locates the centre, σ sets the spread.',
      'z = (x − μ)/σ tells how many standard deviations x is from the mean; x = μ + zσ goes back.',
      'The standard normal is Z ~ N(0, 1).',
      'Empirical rule: about 68% within 1σ, 95% within 2σ, 99.7% within 3σ of the mean.',
    ],
    formulas: ['z = (x − μ)/σ', 'x = μ + zσ'],
    pitfalls: ['Dropping the sign of z — negative means below the mean.', 'Reading N(μ, σ) as mean and variance: the second parameter is the standard deviation.'],
  },
  '6.2': {
    points: [
      'Probabilities are areas under the normal curve; sketch, shade, then compute.',
      'Calculator: normalcdf(lower, upper, μ, σ) gives P(lower < X < upper); use a very small/large bound (e.g. −10^99 / 10^99) for one tail.',
      'P(X > x) = 1 − P(X < x).',
      'Percentiles go the other way: invNorm(area to the left, μ, σ) returns the x value with that area below it.',
    ],
    formulas: ['P(a < X < b) = normalcdf(a, b, μ, σ)', 'kth percentile: invNorm(k/100, μ, σ)'],
    pitfalls: ['Entering the area to the right into invNorm — it wants the area to the left.', 'Forgetting to convert "more than" into 1 − (area to the left).'],
  },
  '7.1': {
    points: [
      'Central Limit Theorem: for a large enough sample (n ≥ 30, or any n if the population is normal), the sample mean X̄ is approximately normal whatever the population shape.',
      'X̄ ~ N(μ, σ/√n): same centre as the population, spread shrinks by √n.',
      'σ/√n is the standard error of the mean.',
      'z-score for a sample mean: z = (x̄ − μ)/(σ/√n).',
    ],
    formulas: ['X̄ ~ N(μ, σ/√n)', 'z = (x̄ − μ) / (σ/√n)'],
    pitfalls: ['Using σ instead of σ/√n for a probability about a sample mean.', 'Applying the CLT to a single observation.'],
  },
  '7.2': {
    points: [
      'The sum of n values from a population is also approximately normal for large n.',
      'ΣX ~ N(nμ, √n·σ): mean scales by n, standard deviation by √n.',
      'z-score for a sum: z = (Σx − nμ)/(√n·σ).',
    ],
    formulas: ['ΣX ~ N(nμ, √n·σ)', 'z = (Σx − nμ) / (√n·σ)'],
    pitfalls: ['Multiplying σ by n instead of √n.'],
  },
  '7.3': {
    points: [
      'Decide first whether the question is about one value (use σ), a mean (use σ/√n) or a sum (use √n·σ).',
      'Percentiles of X̄: invNorm(area, μ, σ/√n).',
      'As n grows, sample means cluster tighter around μ — probabilities near μ rise, tail probabilities fall.',
    ],
    formulas: ['mean: σ_x̄ = σ/√n', 'sum: σ_Σ = √n·σ'],
    pitfalls: ['Answering a question about an individual with the sampling distribution of the mean.'],
  },
  '8.1': {
    points: [
      'A confidence interval estimates a parameter: point estimate ± error bound. For μ with σ known: x̄ ± EBM.',
      'EBM = z_(α/2) · σ/√n, where α = 1 − CL and z_(α/2) cuts off α/2 in each tail (90%: 1.645, 95%: 1.96, 99%: 2.576).',
      'Interpretation: "We estimate with CL% confidence that the true mean lies between … and …"; CL% of such intervals capture μ.',
      'Higher confidence → wider interval; larger n → narrower interval.',
      'Sample size for a target error bound: n = (z·σ/EBM)², rounded up.',
    ],
    formulas: ['EBM = z_(α/2)·σ/√n', 'CI = (x̄ − EBM, x̄ + EBM)', 'n = (z_(α/2)·σ / EBM)²  (round up)'],
    pitfalls: ['Saying "95% probability μ is in this interval" — the confidence is about the method, not this one interval.', 'Rounding n down when solving for sample size.'],
  },
  '8.2': {
    points: [
      'When σ is unknown, use s and the Student t distribution with df = n − 1.',
      'EBM = t_(α/2) · s/√n; the interval is x̄ ± EBM. Calculator: TInterval.',
      't has heavier tails than z; as df grows, t → z.',
      'Requires a roughly normal population when n is small.',
    ],
    formulas: ['EBM = t_(α/2, n−1)·s/√n', 'df = n − 1'],
    pitfalls: ['Using z when σ is unknown.', 'Using df = n instead of n − 1.'],
  },
  '8.3': {
    points: [
      'Estimate a population proportion p with the sample proportion p̂ = x/n.',
      'EBP = z_(α/2)·√(p̂q̂/n), q̂ = 1 − p̂; interval p̂ ± EBP. Calculator: 1-PropZInt.',
      'Conditions: np̂ ≥ 5 and nq̂ ≥ 5 (or ≥ 10 in some texts).',
      'Sample size for a proportion: n = z²·p̂q̂/EBP²; use p̂ = 0.5 if no estimate is available (round up).',
    ],
    formulas: ['p̂ = x/n', 'EBP = z_(α/2)·√(p̂q̂/n)', 'n = z_(α/2)²·p̂q̂ / EBP²  (round up)'],
    pitfalls: ['Plugging a percentage (e.g. 35) into the formula instead of a proportion (0.35).'],
  },
  '9.1': {
    points: [
      'H0 (null) is the statement of no effect or "status quo" and always contains equality: =, ≤ or ≥.',
      'Ha (alternative) is what you seek evidence for and never contains equality: ≠, < or >.',
      'The test is about a population parameter (μ or p), never about x̄ or p̂.',
      'Ha decides the tail: < is left-tailed, > is right-tailed, ≠ is two-tailed.',
    ],
    formulas: ['H0: μ = μ0   Ha: μ ≠ μ0 (two-tailed)', 'H0: p ≥ p0   Ha: p < p0 (left-tailed)'],
    pitfalls: ['Putting the claim in H0 when it contains no equality — the strict inequality always goes in Ha.', 'Writing hypotheses about x̄ instead of μ.'],
  },
  '9.2': {
    points: [
      'Type I error: rejecting H0 when H0 is actually true. Its probability is α (the significance level).',
      'Type II error: failing to reject H0 when H0 is actually false. Its probability is β; power = 1 − β.',
      'Decreasing α raises β for a fixed sample; a larger sample lowers both.',
      'State each error in words: "concluding … when in fact …".',
    ],
    formulas: ['α = P(Type I) = P(reject H0 | H0 true)', 'β = P(Type II) = P(do not reject H0 | H0 false)', 'power = 1 − β'],
    pitfalls: ['Swapping the two: Type I is a false alarm (rejecting a true H0).'],
  },
  '9.3': {
    points: [
      'Test of a mean with σ known → normal (z); σ unknown → Student t with df = n − 1.',
      'Test of a proportion → normal, if np ≥ 5 and nq ≥ 5 (using the hypothesized p).',
      'The standard deviation of the test statistic: σ/√n, s/√n, or √(pq/n).',
    ],
    formulas: ['mean, σ known: z = (x̄ − μ0)/(σ/√n)', 'mean, σ unknown: t = (x̄ − μ0)/(s/√n), df = n − 1', 'proportion: z = (p̂ − p0)/√(p0q0/n)'],
    pitfalls: ['Using p̂ instead of the hypothesized p0 in the standard error of a proportion test.'],
  },
  '9.4': {
    points: [
      'The p-value is the probability, assuming H0 is true, of a sample result at least as extreme as the one observed (in the direction of Ha).',
      'Decision rule: p-value < α → reject H0; p-value ≥ α → do not reject H0.',
      'A small p-value means the observed result would be rare under H0 (a "rare event"), so H0 is doubtful.',
      'Conclusion sentence: "At the α level, there is (is not) sufficient evidence to conclude that [Ha in words]."',
    ],
    formulas: ['reject H0 ⇔ p-value < α'],
    pitfalls: ['Saying "accept H0" — you only fail to reject it.', 'Comparing the p-value with the test statistic instead of with α.'],
  },
  '9.5': {
    points: [
      'Full test: (1) H0 and Ha, (2) distribution and test statistic, (3) p-value, (4) compare with α and decide, (5) conclusion in context.',
      'Calculator: Z-Test, T-Test, 1-PropZTest give the statistic and the p-value directly.',
      'Two-tailed p-value = 2 × the one-tail area beyond the statistic.',
      'Assumptions to state: random sample, normality or large n, np and nq ≥ 5 for proportions.',
    ],
    formulas: ['two-tailed p-value = 2·P(Z > |z|)'],
    pitfalls: ['Halving instead of doubling the tail area for a two-tailed test.', 'Ending with "reject H0" and no sentence in the problem\'s context.'],
  },
  '10.1': {
    points: [
      'Compare two independent means with σ1, σ2 unknown: H0: μ1 − μ2 = 0 (or ≤, ≥).',
      'Test statistic t = (x̄1 − x̄2) / √(s1²/n1 + s2²/n2); df from the Welch formula (calculator: 2-SampTTest, Pooled: No).',
      'Both samples must be random and independent; populations roughly normal or both n large.',
      'Cohen’s d = (x̄1 − x̄2)/s_pooled sizes the effect: 0.2 small, 0.5 medium, 0.8 large.',
    ],
    formulas: ['t = (x̄1 − x̄2) / √(s1²/n1 + s2²/n2)', 'Cohen’s d = (x̄1 − x̄2) / s_pooled'],
    pitfalls: ['Treating paired data (same subjects measured twice) as two independent samples.'],
  },
  '10.2': {
    points: [
      'With σ1 and σ2 known, compare two means with a z-test: z = (x̄1 − x̄2) / √(σ1²/n1 + σ2²/n2).',
      'Same hypotheses and conclusion structure as the t version; calculator 2-SampZTest.',
      'Known σ is rare in practice; if only sample standard deviations are given, use the t-test of 10.1.',
    ],
    formulas: ['z = (x̄1 − x̄2) / √(σ1²/n1 + σ2²/n2)'],
    pitfalls: ['Adding standard deviations instead of variances under the square root.'],
  },
  '10.3': {
    points: [
      'Compare two proportions: H0: p1 = p2 (pA − pB = 0).',
      'Pooled proportion p_c = (x1 + x2)/(n1 + n2) is used in the standard error under H0.',
      'z = (p̂1 − p̂2) / √( p_c(1 − p_c)(1/n1 + 1/n2) ); calculator 2-PropZTest.',
      'Conditions: at least 5 successes and 5 failures in each sample.',
    ],
    formulas: ['p_c = (x1 + x2)/(n1 + n2)', 'z = (p̂1 − p̂2) / √( p_c(1 − p_c)(1/n1 + 1/n2) )'],
    pitfalls: ['Forgetting to pool: the standard error uses p_c, not p̂1 and p̂2 separately.'],
  },
  '10.4': {
    points: [
      'Matched pairs: two measurements on the same subjects (before/after). Work with the differences d = after − before.',
      'It becomes a one-sample t-test on the differences: H0: μ_d = 0, t = x̄_d / (s_d/√n), df = n − 1.',
      'Decide the direction of Ha from the claim and the way you defined d.',
    ],
    formulas: ['t = (x̄_d − 0) / (s_d/√n), df = n − 1'],
    pitfalls: ['Computing s from the raw before and after columns instead of from the differences.'],
  },
  '11.1': {
    points: [
      'The chi-square distribution is right-skewed, non-negative, with one parameter: degrees of freedom df.',
      'Mean = df; standard deviation = √(2·df); it becomes more symmetric as df grows.',
      'Chi-square tests are right-tailed: the p-value is the area to the right of the statistic.',
    ],
    formulas: ['μ = df', 'σ = √(2·df)'],
    pitfalls: ['Looking for a left tail — all three chi-square tests use the right tail.'],
  },
  '11.2': {
    points: [
      'Goodness-of-fit: does an observed distribution of one categorical variable match an expected one?',
      'χ² = Σ (O − E)²/E with df = number of categories − 1; expected counts E = n × expected proportion.',
      'Each expected count should be at least 5.',
      'Large χ² (small right-tail p-value) → reject H0: the data do not fit the claimed distribution.',
    ],
    formulas: ['χ² = Σ (O − E)² / E', 'df = k − 1', 'E = n·p_expected'],
    pitfalls: ['Using percentages as expected counts instead of multiplying by n.', 'Dividing by O instead of E.'],
  },
  '11.3': {
    points: [
      'Test of independence: are two categorical variables related? H0: they are independent.',
      'Expected cell count E = (row total × column total)/grand total.',
      'χ² = Σ (O − E)²/E with df = (rows − 1)(columns − 1). Calculator: χ²-Test with the observed matrix.',
      'Reject H0 → evidence the variables are dependent (associated).',
    ],
    formulas: ['E = (row total)(column total) / grand total', 'df = (r − 1)(c − 1)'],
    pitfalls: ['Using df = (r − 1) or the number of cells − 1.'],
  },
  '11.4': {
    points: [
      'Test for homogeneity: do two or more populations have the same distribution of one categorical variable?',
      'Same computation as independence (expected counts from row and column totals, df = (r − 1)(c − 1)); different question.',
      'Independence samples one population and classifies twice; homogeneity samples each population separately.',
    ],
    formulas: ['df = (r − 1)(c − 1)'],
    pitfalls: ['Describing a homogeneity conclusion as "the variables are independent" — say "the populations have different distributions" instead.'],
  },
  '11.5': {
    points: [
      'Goodness-of-fit: one variable, compare to a hypothesized distribution (df = k − 1).',
      'Independence: one sample, two variables, are they related? (df = (r − 1)(c − 1)).',
      'Homogeneity: several populations, one variable, same distribution? (df = (r − 1)(c − 1)).',
      'All three: right-tailed, statistic Σ (O − E)²/E, expected counts ≥ 5.',
    ],
    pitfalls: ['Picking the test by the table shape alone — ask what was sampled and what the question is.'],
  },
  '11.6': {
    points: [
      'Test of a single variance (or standard deviation): H0: σ² = σ0² (or ≤, ≥).',
      'χ² = (n − 1)s²/σ0² with df = n − 1; the test can be left-, right- or two-tailed depending on Ha.',
      'Requires a normally distributed population.',
    ],
    formulas: ['χ² = (n − 1)s² / σ0²', 'df = n − 1'],
    pitfalls: ['Plugging in standard deviations without squaring them.'],
  },
  '12.1': {
    points: [
      'A linear equation y = a + bx: a is the y-intercept (value when x = 0), b is the slope (change in y per unit change in x).',
      'Slope > 0 rises, < 0 falls, = 0 horizontal.',
      'Interpret a and b in the units of the problem.',
    ],
    formulas: ['y = a + bx'],
    pitfalls: ['Swapping intercept and slope when the equation is written as y = bx + a.'],
  },
  '12.2': {
    points: [
      'A scatter plot shows pairs (x, y): x = independent (explanatory), y = dependent (response).',
      'Describe direction (positive/negative), form (linear or not) and strength (tight or loose).',
      'Only fit a line when the pattern looks linear.',
    ],
    pitfalls: ['Reading a strong correlation as proof that x causes y.'],
  },
  '12.3': {
    points: [
      'The least-squares regression line ŷ = a + bx minimizes the sum of squared residuals (y − ŷ).',
      'It always passes through (x̄, ȳ); calculator LinRegTTest gives a, b, r and r².',
      'r (correlation coefficient) is between −1 and 1; its sign matches the slope.',
      'r² = the fraction of the variation in y explained by the line.',
    ],
    formulas: ['ŷ = a + bx', 'residual = y − ŷ', 'b = r·(s_y/s_x), a = ȳ − b·x̄'],
    pitfalls: ['Interpreting r² as a percentage of points on the line — it is the share of variation explained.'],
  },
  '12.4': {
    points: [
      'Test whether the population correlation ρ is zero: H0: ρ = 0, Ha: ρ ≠ 0.',
      'Method 1: compare |r| with the critical value for df = n − 2 in the table; |r| > critical → significant.',
      'Method 2: t = r·√((n − 2)/(1 − r²)), df = n − 2, and its p-value (LinRegTTest gives it).',
      'A significant r means the line can be used for prediction within the data range.',
    ],
    formulas: ['df = n − 2', 't = r·√( (n − 2)/(1 − r²) )'],
    pitfalls: ['Using df = n instead of n − 2 when reading the critical-value table.'],
  },
  '12.5': {
    points: [
      'Predict y by substituting x into ŷ = a + bx — only for x inside the observed range of the data.',
      'Extrapolating beyond the data is unreliable.',
      'Prediction is only justified when r is significant.',
    ],
    formulas: ['ŷ = a + b·x'],
    pitfalls: ['Predicting for an x far outside the data range.'],
  },
  '12.6': {
    points: [
      'An outlier has a large residual: it lies far from the regression line.',
      'Rule of thumb: a point is an outlier if its residual is more than 2s away (s = standard deviation of the residuals) — equivalently, outside the lines ŷ ± 2s.',
      'Influential points change the slope noticeably; investigate before removing any point.',
    ],
    formulas: ['s = √( SSE/(n − 2) ), outlier if |y − ŷ| > 2s'],
    pitfalls: ['Deleting an outlier without a reason — first check for a data error.'],
  },
  '13.1': {
    points: [
      'One-way ANOVA tests whether k population means are all equal: H0: μ1 = μ2 = … = μk; Ha: at least one differs.',
      'Assumptions: independent random samples, normal populations, equal variances.',
      'It compares variation between group means with variation within groups.',
    ],
    pitfalls: ['Writing Ha as "all means differ" — Ha is "at least two differ".'],
  },
  '13.2': {
    points: [
      'F = MS_between / MS_within, where MS = SS / df.',
      'df_between = k − 1; df_within = n_total − k.',
      'A large F (means far apart relative to within-group spread) gives a small right-tail p-value → reject H0.',
      'Calculator: ANOVA(L1, L2, …).',
    ],
    formulas: ['F = MS_between / MS_within', 'MS = SS / df', 'df_between = k − 1, df_within = n − k'],
    pitfalls: ['Putting MS_within in the numerator.'],
  },
  '13.3': {
    points: [
      'The F distribution is right-skewed, non-negative, with two df values (numerator, denominator).',
      'Its mean is about 1 when H0 is true; ANOVA and the variance-ratio test are right-tailed.',
      'As both df increase, F becomes more symmetric.',
    ],
    pitfalls: ['Reversing the order of the two degrees of freedom.'],
  },
  '13.4': {
    points: [
      'Test whether two population variances are equal: H0: σ1² = σ2².',
      'F = s1²/s2² with df = (n1 − 1, n2 − 1); put the larger variance in the numerator for a right-tailed test.',
      'Requires normal populations; calculator 2-SampFTest.',
    ],
    formulas: ['F = s1² / s2²', 'df = (n1 − 1, n2 − 1)'],
    pitfalls: ['Using standard deviations without squaring them.'],
  },
};

export function keyPointsFor(sectionId: string): KeyPoints | undefined {
  return KEY_POINTS[sectionId];
}
