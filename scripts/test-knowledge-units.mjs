import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { loadGarden, repositoryRoot } from './validate-garden.mjs';
import { attachTopicHubs, branchId } from './build-topic-hubs.mjs';
import { readKnowledgeUnits } from './knowledge-units.mjs';

const units = readKnowledgeUnits(repositoryRoot);
assert.ok(units.length > 0, 'No independent units');
const { graph: base, publishedArticleIds, computed } = loadGarden();
const graph = attachTopicHubs(base, repositoryRoot, publishedArticleIds);
const byId = new Map(graph.nodes.map(node => [node.id, node]));
const results = [];
const negatives = {
  'train-validation-test-data-leakage': `
# Independent regression appended to the article's sole Python example.
# Standard-library checks for the explicitly supported teaching domain.
# Input scope follows the teaching example: finite tuples of well-formed Row
# objects, A--F IDs, visits 1--3, bounded integer x and binary fixed entity labels.
from collections import Counter
from fractions import Fraction
from itertools import product, permutations
import inspect

assert list(inspect.signature(require_new_entities).parameters) == ["parts"]
assert list(inspect.signature(require_forward_time).parameters) == ["parts"]
assert list(inspect.signature(fit_memory).parameters) == ["train"]
assert list(inspect.signature(correct_count).parameters) == ["memory", "test"]
assert list(inspect.signature(fit_mean).parameters) == ["data"]

# Fixed fixture truth is written independently of the example's split builders.
expected_ids = Counter((e, v) for e in "ABCDEF" for v in (1, 2, 3))
assert len(rows) == 18
assert Counter((r.entity, r.visit) for r in rows) == expected_ids
assert {r.entity: (r.x, r.y) for r in rows} == {
    "A": (0, 0), "B": (2, 1), "C": (10, 0),
    "D": (12, 1), "E": (20, 0), "F": (22, 1),
}
for split in (row_split, group_split):
    assert tuple(map(len, split)) == (6, 6, 6)
    assert Counter((r.entity, r.visit) for p in split for r in p) == expected_ids
    ids = [set((r.entity, r.visit) for r in p) for p in split]
    assert all(not (ids[i] & ids[j]) for i in range(3) for j in range(i+1, 3))
assert [{r.entity for r in p} for p in row_split] == [set("ABCDEF")]*3
assert [{r.entity for r in p} for p in group_split] == [set("AB"), set("CD"), set("EF")]
assert correct_count(fit_memory(row_split[0]), row_split[2]) == 6
assert correct_count(fit_memory(group_split[0]), group_split[2]) == 3
assert len({r.entity for r in group_split[2]}) == 2

# All fixed binary label assignments have an exact combinatorial oracle.
# This includes no gap at all (all labels zero), so a six-versus-three result
# cannot accidentally become a universal theorem about score inflation.
for labels in product((0, 1), repeat=6):
    sample = tuple(Row(e, v, 0, y) for e, y in zip("ABCDEF", labels)
                   for v in (1, 2, 3))
    train_rows = sample[::3]
    test_rows = sample[2::3]
    assert fit_memory(train_rows) == dict(zip("ABCDEF", labels))
    assert correct_count(fit_memory(train_rows), test_rows) == 6
    entity_train, entity_test = sample[:6], sample[12:]
    assert correct_count(fit_memory(entity_train), entity_test) == 3*(2-labels[4]-labels[5])
    assert correct_count(fit_memory(entity_train), tuple(reversed(entity_test))) == 3*(2-labels[4]-labels[5])

# Reordering the six training rows must not alter the learned mapping, mean,
# or count. Enumerate every order, including repeated-entity training records.
expected_memory = {"A": 0, "B": 1}
for permuted_train in permutations(group_split[0]):
    assert fit_memory(permuted_train) == expected_memory
    assert fit_mean(permuted_train) == 1.0
    assert correct_count(fit_memory(permuted_train), group_split[2]) == 3

# Entity renaming within the stated domain preserves the overlap structure.
for names in permutations("ABCDEF"):
    rename = dict(zip("ABCDEF", names))
    renamed = tuple(tuple(replace(r, entity=rename[r.entity]) for r in p) for p in group_split)
    require_new_entities(renamed)
    assert correct_count(fit_memory(renamed[0]), renamed[2]) == 3

# Exhaustive nonempty subsets: cardinality and all-pairs order are independent
# oracles rather than reproductions of the guards' pairwise-set/max-min code.
def accepted(check, value):
    try:
        check(value)
    except ValueError:
        return False
    return True

entity_sets = [tuple(e for i, e in enumerate("ABC") if mask & (1 << i))
               for mask in range(1, 8)]
for parts_entities in product(entity_sets, repeat=3):
    fixture = tuple(tuple(Row(e, i+1, 0, 0) for e in es)
                    for i, es in enumerate(parts_entities))
    all_entities = [e for es in parts_entities for e in es]
    expected = len(all_entities) == len(set(all_entities))
    assert accepted(require_new_entities, fixture) == expected

visit_sets = [tuple(v for i, v in enumerate((1, 2, 3)) if mask & (1 << i))
              for mask in range(1, 8)]
for parts_visits in product(visit_sets, repeat=3):
    fixture = tuple(tuple(Row(e, v, 0, 0) for v in reversed(vs))
                    for e, vs in zip("ABC", parts_visits))
    expected = all(a < b for i in range(3) for j in range(i+1, 3)
                   for a in parts_visits[i] for b in parts_visits[j])
    assert accepted(require_forward_time, fixture) == expected

# Means: exact rational truth, order/translation properties, legal endpoints,
# and zero variance. Centering has no division by a sample standard deviation.
mean_cases = 0
for xs in product((-1000, -1, 0, 1, 1000), repeat=3):
    fixture = tuple(Row(e, 1, x, 0) for e, x in zip("ABC", xs))
    expected = float(Fraction(sum(xs), len(xs)))
    assert fit_mean(fixture) == expected
    assert fit_mean(tuple(reversed(fixture))) == expected
    mean_cases += 1
for constant in (-1000, 0, 1000):
    fixture = tuple(Row(e, 1, constant, 0) for e in "ABCDEF")
    assert fit_mean(fixture) == float(constant)
    assert tuple(r.x-fit_mean(fixture) for r in fixture) == (0,)*6

# Holding train fixed: mutate one held-out record at a time or all holdouts.
# All-input mean must change by the independent rational delta/n identity.
fixed_train, fixed_val, fixed_test = group_split
expected_train = Fraction(1)
expected_all = Fraction(11)
base_fitted = fit_mean(fixed_train)
assert tuple(r.x-base_fitted for r in fixed_test) == (19, 19, 19, 21, 21, 21)
for holdout_index in range(12):
    holdouts = fixed_val + fixed_test
    for delta in (-500, -1, 1, 500):
        changed = tuple(replace(r, x=r.x+delta) if i == holdout_index else r
                        for i, r in enumerate(holdouts))
        assert fit_mean(fixed_train) == float(expected_train) == base_fitted
        assert fit_memory(fixed_train) == expected_memory
        expected_full = float(expected_all + Fraction(delta, 18))
        assert fit_mean(fixed_train + changed) == expected_full
for offset in (-500, -1, 0, 1, 500):
    changed = tuple(replace(r, x=r.x+offset) for r in fixed_val+fixed_test)
    assert fit_mean(fixed_train) == 1.0
    assert fit_mean(fixed_train + changed) == float(expected_all + Fraction(2*offset, 3))
    assert correct_count(fit_memory(fixed_train), changed[6:]) == 3
# A canceling mutation can leave even the all-input mean unchanged. A single
# unchanged perturbation is not sufficient proof that there is no dependence.
holdouts = fixed_val + fixed_test
cancelled = tuple(replace(r, x=r.x+(1 if i == 0 else -1 if i == 1 else 0))
                  for i, r in enumerate(holdouts))
assert fit_mean(fixed_train + cancelled) == 11.0

# Precisely the documented rejection surface: wrong part count, empty parts,
# target-specific overlap/time failures, empty fit/score, conflicting labels.
rejection_calls = []
for check in (require_new_entities, require_forward_time):
    for bad_parts in ((), (fixed_train,), (fixed_train, fixed_val),
                      (fixed_train, fixed_val, fixed_test, fixed_test)):
        rejection_calls.append(lambda check=check, bad_parts=bad_parts: check(bad_parts))
    for empty_index in range(3):
        parts = tuple(() if i == empty_index else p for i, p in enumerate(group_split))
        rejection_calls.append(lambda check=check, parts=parts: check(parts))
rejection_calls += [lambda: require_new_entities(row_split),
                    lambda: require_forward_time(group_split),
                    lambda: fit_memory(()), lambda: correct_count({}, ()),
                    lambda: fit_mean(()),
                    lambda: fit_memory((Row("A", 1, 0, 0), Row("A", 2, 0, 1))),
                    lambda: fit_memory((Row("A", 2, 0, 1), Row("A", 1, 0, 0)))]
for bad in rejection_calls:
    try:
        bad()
    except ValueError:
        pass
    else:
        raise AssertionError("documented boundary accepted")
print("data split regression: exact fixture, 64 label assignments, 720 row orders, "
      "720 renamings, 686 split truth cases, 125 exact means, 53 holdout mutations, "
      f"zero variance and {len(rejection_calls)} rejections")
`,
  'statistical-inference-confidence-interval': `
# Regression addition appended to the article's one marked Python block.
# Standard-library only.
import inspect
import math
from decimal import Decimal, localcontext
from fractions import Fraction

assert list(inspect.signature(wilson95).parameters) == ["successes", "trials"]
Z95_REFERENCE = Decimal("1.9599639845400542355245944305205515279555500778695")

# Independent high-precision oracle: solve the score inequality's quadratic
# in parameter p in count space, rather than reusing a float implementation.
def score_quadratic_roots(successes, trials):
    with localcontext() as ctx:
        ctx.prec = 60
        k, n, z = Decimal(successes), Decimal(trials), Z95_REFERENCE
        a = n + z*z
        b = -(2*k + z*z)
        c = k*k/n
        root_discriminant = (b*b - 4*a*c).sqrt()
        low = Decimal(0) if successes == 0 else (-b-root_discriminant)/(2*a)
        high = Decimal(1) if successes == trials else (-b+root_discriminant)/(2*a)
        return float(low), float(high)

reference_cases = [(k, n) for n in (1, 2, 3, 5, 20, 100, 1000, 9999, 10000)
                   for k in sorted({0, 1, n//4, n//2, n-1, n})]
for k, n in reference_cases:
    actual = wilson95(k, n)
    expected = score_quadratic_roots(k, n)
    assert all(math.isclose(a, b, rel_tol=0, abs_tol=3e-15)
               for a, b in zip(actual, expected)), (k, n, actual, expected)

interval_cases = 0
for n in [*range(1, 251), 499, 500, 999, 1000]:
    previous = (-1.0, -1.0)
    for k in range(n+1):
        low, high = wilson95(k, n)
        assert type(low) is type(high) is float
        assert 0 <= low <= k/n <= high <= 1
        assert previous[0] <= low and previous[1] <= high
        reverse_low, reverse_high = wilson95(n-k, n)
        assert math.isclose(low, 1-reverse_high, rel_tol=0, abs_tol=3e-15)
        assert math.isclose(high, 1-reverse_low, rel_tol=0, abs_tol=3e-15)
        if k == 0: assert low == 0.0
        if k == n: assert high == 1.0
        previous = (low, high)
        interval_cases += 1

# n=100,p=4/5 repeated-sampling coverage is an exactly weighted finite sum.
# Acceptance is obtained independently from the score inequality, using exact
# rationals and the separately supplied 95% normal quantile.
p = Fraction(4, 5)
n = 100
z2 = Fraction(Z95_REFERENCE)**2
score_acceptance = [k for k in range(n+1)
                    if n*(Fraction(k, n)-p)**2 <= z2*p*(1-p)]
interval_acceptance = [k for k in range(n+1)
                       if wilson95(k,n)[0] <= float(p) <= wilson95(k,n)[1]]
assert score_acceptance == interval_acceptance == list(range(73, 88))
exact_coverage = Fraction(sum(math.comb(n,k)*4**k for k in score_acceptance), 5**n)
assert math.isclose(float(exact_coverage), 0.9405196171395281, rel_tol=0, abs_tol=1e-16)
assert float(exact_coverage) < 0.95

# Same empirical success rate, truly larger independent n: narrower interval.
small = wilson95(80,100)
large = wilson95(320,400)
assert large[1]-large[0] < small[1]-small[0]
assert math.isclose(small[0], 0.71117083440684117, rel_tol=0, abs_tol=3e-15)
assert math.isclose(small[1], 0.86663306666896746, rel_tol=0, abs_tol=3e-15)
assert math.isclose(wilson95(20,20)[0], 0.83887484194718061, rel_tol=0, abs_tol=3e-15)
assert wilson95(20,20)[1] == 1.0

class IntSubclass(int):
    pass

bad_counts = [True, False, 1.0, "1", None, [], {}, complex(1),
              float("nan"), float("inf"), -float("inf"), IntSubclass(1)]
rejection_calls = [lambda bad=bad: wilson95(bad,100) for bad in bad_counts]
rejection_calls += [lambda bad=bad: wilson95(0,bad) for bad in bad_counts]
rejection_calls += [lambda: wilson95(-1,100), lambda: wilson95(101,100),
                    lambda: wilson95(0,0), lambda: wilson95(0,-1),
                    lambda: wilson95(0,10001), lambda: wilson95(0,10**1000),
                    lambda: wilson95(10**1000,100)]
for bad in rejection_calls:
    try: bad()
    except ValueError: pass
    else: raise AssertionError("invalid Wilson count or documented bound accepted")
for confidence in (0.0, 0.95, 1.0, float("nan")):
    try: wilson95(80,100,confidence=confidence)
    except TypeError: pass
    else: raise AssertionError("fixed Wilson95 API accepted confidence keyword")

print(f"statistical regression: {interval_cases} interval cases, {len(reference_cases)} Decimal references, exact coverage and {len(rejection_calls)} count rejections")`,
  derivatives: `
from fractions import Fraction
import random

# Independent exact polynomial truth across binary-representable inputs.
for numerator in range(-1024, 1025):
    q = Fraction(numerator, 32)
    expected = float(4*q**3 + 18*q**2 + 18*q)
    point = float(q)
    assert analytic_derivative(point) == expected
    assert forward_derivative(point) == expected
    assert reverse_derivative(point) == expected

rng = random.Random(20261005)
for _ in range(10000):
    point = rng.uniform(-100, 100)
    q = Fraction.from_float(point)
    expected = float(4*q**3 + 18*q**2 + 18*q)
    for derivative in (analytic_derivative, forward_derivative, reverse_derivative):
        assert math.isclose(derivative(point), expected, rel_tol=1e-12, abs_tol=1e-9)

# Exact rational finite-difference identity, then test the implemented stencil.
def rational_value(q):
    return q**4 + 6*q**3 + 9*q**2
for numerator in range(-32, 33):
    q = Fraction(numerator, 4)
    exact_derivative = 4*q**3 + 18*q**2 + 18*q
    for power in range(1, 17):
        step = Fraction(1, 2**power)
        stencil = (rational_value(q+step)-rational_value(q-step))/(2*step)
        assert stencil == exact_derivative + (4*q+6)*step**2
        assert math.isclose(central_difference(float(q), float(step)), float(stencil),
                            rel_tol=1e-10, abs_tol=1e-6)

# Stationary points, branch accumulation and the nondifferentiable counterexample.
for point in (-3.0, -1.5, 0.0):
    assert analytic_derivative(point) == forward_derivative(point) == reverse_derivative(point) == 0
assert value(-1) == 4
assert forward_derivative(-1) == reverse_derivative(-1) == -4
assert central_difference(1, 0.5) == 42.5
assert (abs(0.25) - abs(-0.25)) / 0.5 == 0
assert (abs(0.25) - abs(0)) / 0.25 == 1
assert (abs(-0.25) - abs(0)) / -0.25 == -1

invalid = [True, "1", None, [], complex(1, 0), float("nan"),
           float("inf"), -float("inf"), 10**1000, -10**1000, 1e200, -1e200]
rejection_calls = [lambda f=f, point=point: f(point)
                   for f in (value, analytic_derivative, forward_derivative, reverse_derivative)
                   for point in invalid]
rejection_calls += [lambda step=step: central_difference(1, step) for step in
                    [0, -1, True, "0.01", None, [], complex(1, 0), float("nan"),
                     float("inf"), -float("inf"), 10**1000, 1e-20, 1e200, 1e308]]
rejection_calls += [lambda point=point: central_difference(point, 0.1)
                    for point in [True, "1", None, float("nan"), float("inf"), 1e200]]
assert len(rejection_calls) == 68
for bad in rejection_calls:
    try: bad()
    except ValueError: pass
    else: raise AssertionError("invalid derivative input or step accepted")
print("derivative regression: 2049 exact + 10000 random + 1040 stencil pairs + 68 rejections")`,
  'tensor-shapes': `
assert matmul(X, W) == [[4, 1], [-1, 3]]
assert matmul(X, transpose(X)) == [[14, -1], [-1, 2]]
assert cosine([1, 0], [0, 2]) == 0
assert cosine([1, 0], [-2, 0]) == -1
assert math.isclose(cosine([5e-324, 5e-324], [5e-324, 0]), 1/math.sqrt(2))
assert math.isclose(cosine([1.5e308, 1.5e308], [1.5e308, 0]), 1/math.sqrt(2))
for bad in [lambda: matmul([], [[1]]), lambda: matrix_shape([[]]),
            lambda: matrix_shape([[1, 2], [3]]), lambda: matrix_shape([1, 2]),
            lambda: dot([[1]], [1]), lambda: dot([1, 2], [1]),
            lambda: matmul([[1, 2]], [[1, 2]]),
            lambda: euclidean_distance([1], [1, 2]),
            lambda: cosine([1], [1, 2]), lambda: cosine([0, 0], [1, 2]),
            lambda: vector([float("nan")]), lambda: vector([float("inf")]),
            lambda: vector([True]), lambda: vector(["3"]),
            lambda: vector([10**1000]), lambda: dot([1e308], [1e308]),
            lambda: l2_norm([1.5e308, 1.5e308])]:
    try: bad()
    except ValueError: pass
    else: raise AssertionError("invalid shape or number accepted")`,
  'conditional-probability': `
from fractions import Fraction
import random

# Independent rational oracles; do not reuse the example's normalization or
# local-offset algorithm to calculate the expected answers.
def exact_bayes(prior, likelihood):
    ps = [Fraction(p) for p in prior]
    total = sum(ps)
    joints = [p * Fraction(ell) / total for p, ell in zip(ps, likelihood)]
    evidence = sum(joints)
    return [q / evidence for q in joints], evidence

def exact_moments(values, weights):
    ps = [Fraction(p) for p in weights]
    total = sum(ps)
    xs = [Fraction(x) for x in values]
    mean = sum(p*x for p, x in zip(ps, xs)) / total
    variance = sum(p*x*x for p, x in zip(ps, xs)) / total - mean*mean
    return mean, variance

def close_vector(actual, expected):
    assert len(actual) == len(expected)
    assert all(math.isclose(a, float(e), rel_tol=2e-14, abs_tol=1e-15)
               for a, e in zip(actual, expected)), (actual, expected)

rng = random.Random(20261005)
for _ in range(1000):
    cuts = sorted([0, 64] + [rng.randrange(65) for _ in range(3)])
    prior = [(b-a)/64 for a, b in zip(cuts, cuts[1:])]
    likelihood = [rng.randrange(33)/32 for _ in prior]
    if not any(p*ell for p, ell in zip(prior, likelihood)):
        likelihood[prior.index(max(prior))] = 1.0
    values = [rng.randrange(-1024, 1025)/8 for _ in prior]
    expected_post, expected_evidence = exact_bayes(prior, likelihood)
    posterior, evidence = bayes_update(prior, likelihood)
    close_vector(posterior, expected_post)
    assert evidence == float(expected_evidence)
    assert all(0 <= p <= 1 for p in posterior)
    assert math.isclose(math.fsum(posterior), 1, rel_tol=0, abs_tol=3e-16)
    assert all(p != 0 or q == 0 for p, q in zip(prior, posterior))
    # Common likelihood scaling changes evidence, not the posterior.
    scaled_post, scaled_evidence = bayes_update(prior, [ell/4 for ell in likelihood])
    assert scaled_post == posterior and scaled_evidence == evidence/4
    assert bayes_update(prior, [0.5]*len(prior)) == (prior, 0.5)
    # Dyadic fixtures have exactly representable first and second moments.
    expected_mean, expected_variance = exact_moments(values, prior)
    actual = weighted_moments(values, prior)
    assert actual == (float(expected_mean), float(expected_variance)), (values, prior, actual)
    assert actual[1] >= 0
    order = list(range(len(prior)))
    rng.shuffle(order)
    assert weighted_moments([values[i] for i in order], [prior[i] for i in order]) == actual
    reordered_post, reordered_evidence = bayes_update([prior[i] for i in order], [likelihood[i] for i in order])
    assert reordered_post == [posterior[i] for i in order] and reordered_evidence == evidence
    # Splitting one outcome into equal-mass copies is the same distribution.
    assert weighted_moments(values + values, [p/2 for p in prior]*2) == actual
    for scale in (-2, 0, 0.5, 3):
        translated = [scale*x + 2**20 for x in values]
        assert weighted_moments(translated, prior) == (float(scale*expected_mean + 2**20), float(scale**2*expected_variance))

# Legacy conditional and chain-score behavior remains independently checked.
conditional_cases = 0
for denominator in range(1, 65):
    for numerator in range(denominator+1):
        assert conditional(numerator/64, denominator/64) == float(Fraction(numerator, denominator))
        conditional_cases += 1
assert conditional_cases == 2144
assert not math.isclose(conditional(0.1, 0.2), conditional(0.1, 0.3))
for factors in ([1], [0.5, 0.25, 0.125], [0.75]*20, [0.5, 0, 1], (0.125, 0.75)):
    expected = math.prod(Fraction(p) for p in factors)
    product, logp = sequence_score(factors)
    assert product == float(expected)
    assert logp == -math.inf if not expected else math.isclose(logp, math.log(float(expected)), rel_tol=1e-14, abs_tol=1e-14)
assert sequence_score([1.0]) == (1.0, 0.0)
assert sequence_score([0.0]) == (0.0, -math.inf)
underflow_product, retained_log = sequence_score([0.01] * 1000)
assert underflow_product == 0 and math.isclose(retained_log, 1000*math.log(0.01))

# Near-unit inputs are normalized, not treated as arbitrary weights. Correct
# rounding must not create a variance for any constant or evidence above one.
for weights in ([0.5, 0.5000000000005], [0.5, 0.4999999999995], [0.2, 0.3, 0.5000000000004]):
    snapshot = weights[:]
    post, evidence = bayes_update(weights, [1]*len(weights))
    expected_post, _ = exact_bayes(weights, [1]*len(weights))
    close_vector(post, expected_post)
    assert evidence == 1 and math.fsum(post) == 1
    for constant in (-1e308, 1e100, 1.5e308):
        assert weighted_moments([constant]*len(weights), weights) == (constant, 0.0)
    values = list(range(len(weights)))
    close_vector(weighted_moments(values, weights), exact_moments(values, weights))
    assert weights == snapshot

# Values near 1e16 lose their midpoint on global rounding, but not their local
# spread. An E[X^2]-E[X]^2 or rounded-mean implementation fails these oracles.
for weights in ([0.5, 0.5], [0.25, 0.75], [0.75, 0.25]):
    values = [1e16, 1e16+2]
    expected = tuple(float(v) for v in exact_moments(values, weights))
    assert weighted_moments(values, weights) == expected
    assert weighted_moments(values[::-1], weights[::-1]) == expected
for large in (1e100, -1e100):
    neighbor = math.nextafter(large, math.inf)
    expected = tuple(float(v) for v in exact_moments([large, neighbor], [0.5, 0.5]))
    assert weighted_moments([large, neighbor], [0.5, 0.5]) == expected
assert weighted_moments([-1e308, 2, 1e308], [0, 1, 0]) == (2.0, 0.0)
assert weighted_moments((1, 3), (0.25, 0.75)) == (2.5, 0.75)
assert weighted_moments([1, 3, 3, 3], [0.25]*4) == (2.5, 0.75)  # population, not unbiased sample variance
indicator_mean, indicator_variance = weighted_moments([1, 0], [0.25, 0.75])
assert indicator_variance == indicator_mean*(1-indicator_mean)
assert weighted_moments([2, 6], [0.25, 0.75])[1] == 4*weighted_moments([1, 3], [0.25, 0.75])[1]

# Normal minimum is supported; positive subnormal joints (even nonzero ones)
# are rejected before they can distort ratios. Genuine zero joints stay legal.
normal_min = sys.float_info.min
assert bayes_update([1], [normal_min]) == ([1.0], normal_min)
assert bayes_update([0.5, 0.5], [2*normal_min]*2) == ([0.5, 0.5], 2*normal_min)
assert bayes_update([0, 1], [5e-324, 0.5]) == ([0.0, 1.0], 0.5)
assert bayes_update([5e-324, 1], [0, 1]) == ([0.0, 1.0], 1.0)
assert 0 < 0.5*normal_min < normal_min
tiny_variance = exact_moments([0, 1e-200], [0.5, 0.5])[1]
assert tiny_variance > 0 and float(tiny_variance) == 0
assert weighted_moments([0, 1e-200], [0.5, 0.5]) == (5e-201, 0.0)
# Documented boundary: the unweighted square can overflow even when the
# mathematical weighted variance would fit in a finite float.
assert math.isfinite(float(exact_moments([0, 1e200], [1, 1e-200])[1]))

invalid_numbers = [True, False, "0.5", None, [], [0.5], complex(1, 0),
                   float("nan"), float("inf"), -float("inf"), 10**1000]
rejection_calls = []
for bad in invalid_numbers:
    rejection_calls += [lambda bad=bad: conditional(bad, 1),
                        lambda bad=bad: conditional(0, bad),
                        lambda bad=bad: sequence_score([bad]),
                        lambda bad=bad: bayes_update([bad], [1]),
                        lambda bad=bad: bayes_update([1], [bad]),
                        lambda bad=bad: weighted_moments([bad], [1]),
                        lambda bad=bad: weighted_moments([1], [bad])]
for bad in ([], (), None, "0.5", 0.5, {0: 1}, {1}):
    rejection_calls += [lambda bad=bad: sequence_score(bad),
                        lambda bad=bad: bayes_update(bad, [1]),
                        lambda bad=bad: bayes_update([1], bad),
                        lambda bad=bad: weighted_moments(bad, [1]),
                        lambda bad=bad: weighted_moments([1], bad)]
for bad in ([-0.1, 1.1], [1.1, -0.1], [0.5, -0.1]):
    rejection_calls += [lambda bad=bad: sequence_score(bad),
                        lambda bad=bad: bayes_update(bad, [1, 1]),
                        lambda bad=bad: bayes_update([0.5, 0.5], bad),
                        lambda bad=bad: weighted_moments([1, 3], bad)]
rejection_calls += [lambda: conditional(0, 0), lambda: conditional(0.3, 0.2),
                    lambda: conditional(-0.1, 0.2), lambda: conditional(0.1, 1.1),
                    lambda: bayes_update([0.5, 0.5], [0, 0]),
                    lambda: bayes_update([1, 0], [0, 1]),
                    lambda: bayes_update([0.5, 0.5], [1]),
                    lambda: weighted_moments([1, 3], [1]),
                    lambda: weighted_moments([1], [0.5, 0.5]),
                    lambda: bayes_update([1], [math.nextafter(normal_min, 0)]),
                    lambda: bayes_update([0.5, 0.5], [normal_min, 1]),
                    lambda: bayes_update([0.4, 0.6], [1e-323, 1e-323]),
                    lambda: bayes_update([5e-324, 1], [0.5, 0.5]),
                    lambda: weighted_moments([-1e308, 1e308], [0.5, 0.5]),
                    lambda: weighted_moments([0, 1e200], [1, 1e-200]),
                    lambda: weighted_moments([float("inf"), 2], [0, 1])]
for weights in ([0.2, 0.2], [0, 0], [0.5, 0.500000000002], [0.5, 0.499999999998]):
    rejection_calls += [lambda weights=weights: bayes_update(weights, [0.8, 0.2]),
                        lambda weights=weights: weighted_moments([1, 3], weights)]
assert len(rejection_calls) == 148
for bad in rejection_calls:
    try: bad()
    except ValueError: pass
    else: raise AssertionError("invalid probability input or documented numeric boundary accepted")
print("probability regression: 1000 Fraction + invariance cases + 2144 conditional cases + 148 rejections")`,
  'entropy-cross-entropy': `
assert math.isclose(perplexity([0.5, 0.125, 0.125, 0.125]), 2**2.5)
assert math.isclose(cross_entropy([0.5, 0.5], [0.5, 0.5]), math.log(2))
assert kl([0.5, 0.5], [0.5, 0.5]) == 0
assert math.isinf(kl([1, 0], [0, 1]))
assert math.isinf(categorical_nll([0, 1], 0))
for bad in [lambda: distribution([]), lambda: distribution([0.2, 0.2]),
            lambda: distribution([-1, 2]), lambda: distribution([float("nan"), 1]),
            lambda: cross_entropy([1], [0.5, 0.5]),
            lambda: categorical_nll([1], -1), lambda: categorical_nll([1], 1),
            lambda: categorical_nll([1], True), lambda: perplexity([]),
            lambda: perplexity([1.1]), lambda: perplexity([float("inf")])]:
    try: bad()
    except ValueError: pass
    else: raise AssertionError("invalid information-theory input accepted")`,
  tokenization: 'for bad in ["", "中文"]:\n    try: encode_toy(bad)\n    except ValueError: pass\n    else: raise AssertionError("invalid text accepted")',
  softmax: 'for values, t in [([], 1), ([float("nan")], 1), ([1], 0), ([1], -1)]:\n    try: softmax(values, t)\n    except ValueError: pass\n    else: raise AssertionError("invalid softmax input accepted")',
  attention: 'for q, k, v in [([], [], []), ([[1, 2]], [[1]], [[1, 2]]), ([[float("nan")]], [[1]], [[1]])]:\n    try: attention(q, k, v)\n    except ValueError: pass\n    else: raise AssertionError("invalid attention input accepted")',
  training: 'assert abs(probabilities(updated)[0] - 0.598687660112452) < 1e-12',
  'kv-cache': 'for lengths in [[], [-1], [1.5]]:\n    try: cache_bytes(32, 8, 128, 2, lengths)\n    except ValueError: pass\n    else: raise AssertionError("invalid cache dimensions accepted")'
};
const temp = mkdtempSync(path.join(tmpdir(), 'nextchina-knowledge-'));
try {
  for (const article of units) {
    const unit = article.knowledgeUnit;
    const markdown = readFileSync(path.join(repositoryRoot, article.file), 'utf8');
    assert.ok(publishedArticleIds.has(article.id));
    for (const id of unit.conceptIds) assert.ok(byId.get(id)?.articleBindings.some(ref => ref.articleId === article.id && ref.coverage === 'explanation'));
    for (const placement of unit.placements) {
      const node = byId.get(branchId(placement.hubId, placement.path));
      assert.equal(node?.embeddedArticleId, article.id);
      assert.ok(node.resourceRefs.some(ref => ref.articleId === article.id && ref.role === 'independent-explanation'));
    }
    for (const url of unit.sourceUrls) assert.ok(markdown.includes(url), `${article.id}: cited source missing from text: ${url}`);
    for (const id of unit.relatedResourceIds) assert.ok(graph.hubResources[id], `Unresolved related resource: ${id}`);
    const links = [...markdown.matchAll(/\]\((\?view=garden[^\s)]*)\)/g)];
    assert.ok(links.length >= 2, 'Independent pages need onward reading links');
    for (const [, link] of links) assert.ok(byId.has(new URLSearchParams(link.slice(1)).get('scope')), `Broken knowledge link: ${link}`);
    const blocks = [...markdown.matchAll(/^```python\r?\n(# nextchina-example: ([a-z0-9-]+)\r?\n[\s\S]*?)^```\s*$/gm)];
    assert.equal(blocks.length, 1, `${article.id}: expected one explicit runnable example`);
    assert.equal(blocks[0][2], unit.exampleId);
    assert.ok(Object.hasOwn(negatives, unit.exampleId), 'Add numeric and rejection checks when registering a new example');
    let code = blocks[0][1] + '\n' + negatives[unit.exampleId];
    if (unit.exampleId === 'attention') {
      // One numeric truth: compare the article's Python output with the garden fixture.
      code += '\nexpected = ' + JSON.stringify(computed[0].output) + '\nassert all(abs(a-b)<1e-10 for row,ref in zip(output,expected) for a,b in zip(row,ref))\n';
    }
    const run = spawnSync('python3', ['-I', '-c', code], { cwd: temp, encoding: 'utf8', timeout: 8000,
      maxBuffer: 128 * 1024, env: { PATH: process.env.PATH, LANG: 'C.UTF-8', PYTHONIOENCODING: 'utf-8' } });
    assert.equal(run.status, 0, `${article.id}: Python example failed. Install Python 3 locally.\n${run.error ?? ''}\n${run.stderr ?? ''}`);
    results.push({ articleId: article.id, exampleId: unit.exampleId, output: run.stdout.trim(), passed: true });
  }
  const registry = JSON.parse(readFileSync(path.join(repositoryRoot, 'content/articles.json'), 'utf8'));
  const unitIndex = registry.articles.findIndex(article => article.knowledgeUnit);
  mkdirSync(path.join(temp, 'content'));
  const mutations = [
    data => data.articles.push(structuredClone(data.articles[unitIndex])),
    data => data.articles[unitIndex].knowledgeUnit.sourceUrls = [],
    data => data.articles[unitIndex].knowledgeUnit.reviewStatus = 'expert-verified',
    data => data.articles[unitIndex].knowledgeUnit.placements[0].path = '../missing',
    data => data.articles[unitIndex].knowledgeUnit.conceptIds.push(data.articles[unitIndex].knowledgeUnit.conceptIds[0])
  ];
  for (const mutate of mutations) {
    const copy = structuredClone(registry); mutate(copy);
    writeFileSync(path.join(temp, 'content/articles.json'), JSON.stringify(copy));
    assert.throws(() => readKnowledgeUnits(temp));
  }
  const report = { status: 'pass', independentArticles: units.length, runnableExamples: results.length,
    metadataNegativeCases: mutations.length, attentionMatchesGardenFixture: true, results,
    externalModelCalls: 0, commercialMeasurements: false, expertReview: false };
  mkdirSync(path.join(repositoryRoot, 'test-results'), { recursive: true });
  writeFileSync(path.join(repositoryRoot, 'test-results/knowledge-units.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally { rmSync(temp, { recursive: true, force: true }); }
