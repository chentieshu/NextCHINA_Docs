import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { loadGarden, repositoryRoot } from './validate-garden.mjs';
import { attachTopicHubs, branchId } from './build-topic-hubs.mjs';
import { readKnowledgeUnits } from './knowledge-units.mjs';
import { validateExampleChecks, checkObservableCase, testExampleContract, testPilotMarkdownVisibility } from './knowledge-example-contract.mjs';

import { checkLearningSignalsCase, testLearningSignalsContract } from './learning-signals-case-contract.mjs';

const units = readKnowledgeUnits(repositoryRoot);
assert.ok(units.length > 0, 'No independent units');
const { graph: base, publishedArticleIds, computed } = loadGarden();
const graph = attachTopicHubs(base, repositoryRoot, publishedArticleIds);
const byId = new Map(graph.nodes.map(node => [node.id, node]));
const results = [];
const negatives = {
  'floating-point-rounding': String.raw`# Independent assertions appended directly to the extracted article example.
# No imports of an implementation file, shared paths, runpy or stdout oracle.
from decimal import Decimal
from itertools import permutations, product
from types import SimpleNamespace


def _expect_value_error(call, contains=None):
    try:
        call()
    except ValueError as exc:
        if contains is not None:
            assert contains in str(exc)
    else:
        raise AssertionError("Invalid input or overflowing path accepted")


# Integer/fraction oracles derived independently from the binary64 grid.
x, y, z = 0.1, 0.2, 0.3
fx = Fraction(3602879701896397, 2**55)
fy = Fraction(3602879701896397, 2**54)
fz = Fraction(5404319552844595, 2**54)
fxy = Fraction(1351079888211149, 2**52)
assert Fraction.from_float(x) == fx
assert Fraction.from_float(y) == fy
assert Fraction.from_float(z) == fz
assert Fraction.from_float(x + y) == fxy
assert fx + fy == Fraction(10808639105689191, 2**55)
assert fx - Fraction(1, 10) == Fraction(1, 5 * 2**55)
assert fy - Fraction(1, 5) == Fraction(1, 5 * 2**54)
assert representation_error == Fraction(3, 5 * 2**55)
assert operation_error == Fraction(1, 2**55)
assert total_error == Fraction(1, 5 * 2**52)
assert total_error == representation_error + operation_error
assert fxy - fz == Fraction(1, 2**54)
assert fxy - fz != total_error
assert (x + y) != z
assert x.as_integer_ratio() == (3602879701896397, 2**55)
assert repr(x) == "0.1"
assert format(x, ".17g") == "0.10000000000000001"
assert float(repr(x)) == float(format(x, ".17g")) == x
before = Fraction.from_float(x + y)
assert format(x + y, ".1f") == "0.3"
assert Fraction.from_float(x + y) == before
assert round(x, 1) + round(y, 1) != round(z, 1)
assert round(x + y, 1) == z
assert Fraction.from_float(round(x + y, 1)) != Fraction(3, 10)

# Finite dyadic families have small exact intermediate numerators.
dyadics = [(n, d) for n in range(-4, 5) for d in (1, 2, 4, 8)]
for n, d in dyadics:
    v = n / d
    assert Fraction.from_float(v) == Fraction(n, d)
    assert finite_float(v) is v
    assert float(Fraction(*v.as_integer_ratio())) == v
pair_count = 0
for (n1, d1), (n2, d2) in product(dyadics, repeat=2):
    expected = Fraction(n1, d1) + Fraction(n2, d2)
    row = sum_audit([n1 / d1, n2 / d2])
    assert row["exact_stored_sum"] == expected
    assert Fraction.from_float(row["sequential"]) == expected
    assert Fraction.from_float(row["fsum"]) == expected
    assert row["sequential_error"] == row["fsum_error"] == 0
    pair_count += 1
assert pair_count == 1296
p, q, r = 0.125, 0.25, 0.375
assert p + q == r
assert sum_audit((p, q, -r))["exact_stored_sum"] == 0

# Enumerate ALL permutations; only the two leading +big/1 orders lose the 1.
Q = float(2**53)
loop_oracle = {
    (Q, 1.0, -Q): 0.0,
    (1.0, Q, -Q): 0.0,
    (Q, -Q, 1.0): 1.0,
    (1.0, -Q, Q): 1.0,
    (-Q, Q, 1.0): 1.0,
    (-Q, 1.0, Q): 1.0,
}
for values in permutations((Q, 1.0, -Q)):
    row = sum_audit(values)
    expected_loop = loop_oracle[values]
    assert row["exact_stored_sum"] == Fraction(1)
    assert row["sequential"] == expected_loop
    assert row["fsum"] == 1.0
    assert row["sequential_error"] == Fraction(int(expected_loop) - 1)
    assert row["fsum_error"] == Fraction(0)
one = 1.0
assert (Q + one) - Q == 0.0
assert Q + (one - Q) == 1.0
assert math.ulp(Q) == 2.0
assert math.nextafter(Q, math.inf) - Q == 2.0
assert Q - math.nextafter(Q, -math.inf) == 1.0
assert math.ulp(one) == sys.float_info.epsilon == 2.0**-52
half = math.ldexp(one, -53)
next_one = math.nextafter(one, math.inf)
assert one + half == one
assert next_one + half == math.nextafter(next_one, math.inf)
row = sum_audit([x, y, -z])
assert row["exact_stored_sum"] == Fraction(1, 2**55)
assert Fraction.from_float(row["sequential"]) == Fraction(1, 2**54)
assert Fraction.from_float(row["fsum"]) == Fraction(1, 2**55)
assert row["sequential_error"] == Fraction(1, 2**55)
assert row["fsum_error"] == 0

# Tolerance truth values, including exact dyadic boundaries.
assert within_tolerance(x + y, z, rel_tol=1e-15, abs_tol=0.0)
resid = (x + y) - z
assert not within_tolerance(resid, 0.0, rel_tol=1e-15, abs_tol=0.0)
assert within_tolerance(resid, 0.0, rel_tol=0.0, abs_tol=1e-16)
assert not within_tolerance(1e-12, 0.0, rel_tol=0.0, abs_tol=1e-16)
assert within_tolerance(1.0, 1.0, rel_tol=0.0, abs_tol=0.0)
assert not within_tolerance(one, next_one, rel_tol=0.0, abs_tol=0.0)
boundary = math.ldexp(one, -40)
assert within_tolerance(boundary, 0.0, rel_tol=0.0, abs_tol=boundary)
assert within_tolerance(-boundary, 0.0, rel_tol=0.0, abs_tol=boundary)
assert not within_tolerance(math.nextafter(boundary, math.inf), 0.0,
                            rel_tol=0.0, abs_tol=boundary)
assert within_tolerance(8.0, 7.0, rel_tol=0.125, abs_tol=0.0)
assert not within_tolerance(8.0, math.nextafter(7.0, -math.inf),
                            rel_tol=0.125, abs_tol=0.0)
# All arithmetic in these threshold products/differences is exact dyadic.
for av, bv in product((-2.0, -1.0, 0.0, 1.0, 2.0), repeat=2):
    for rt, at in product((0.0, 0.125, 0.5), (0.0, 0.25, 1.0)):
        af, bf = Fraction.from_float(av), Fraction.from_float(bv)
        limit = max(Fraction.from_float(rt) * max(abs(af), abs(bf)),
                    Fraction.from_float(at))
        expected = abs(af - bf) <= limit
        assert within_tolerance(av, bv, rel_tol=rt, abs_tol=at) == expected
        assert within_tolerance(bv, av, rel_tol=rt, abs_tol=at) == expected

# Accepted boundaries and explicit signed-zero policy.
zero = 0.0
negzero = -zero
tiny = math.ulp(zero)
assert finite_float(negzero) is negzero
assert math.copysign(1.0, finite_float(negzero)) == -1.0
assert within_tolerance(negzero, zero, rel_tol=0.0, abs_tol=-0.0)
assert Fraction.from_float(tiny) == Fraction(1, 2**1074)
assert tiny / 2.0 == zero
assert math.copysign(1.0, -tiny / 2.0) == -1.0
assert math.nextafter(sys.float_info.min, 0.0) < sys.float_info.min
assert Fraction.from_float(sys.float_info.min) == Fraction(1, 2**1022)
for values, expected in [([tiny], Fraction(1, 2**1074)),
                         ([-tiny], Fraction(-1, 2**1074)),
                         ([tiny, -tiny], Fraction(0)),
                         ([negzero], Fraction(0)),
                         ((0.5,), Fraction(1, 2)),
                         ([1.0] * 32, Fraction(32))]:
    row = sum_audit(values)
    assert row["exact_stored_sum"] == expected
    assert Fraction.from_float(row["sequential"]) == expected
    assert Fraction.from_float(row["fsum"]) == expected
    assert row["sequential_error"] == row["fsum_error"] == 0
# Sums start at +0.0 and Fraction has one rational zero; no sign preservation.
assert math.copysign(1.0, sequential_sum([negzero])) == 1.0
maximum = sys.float_info.max
assert sequential_sum([maximum]) == maximum
assert math.isinf(maximum + maximum)
_expect_value_error(lambda: sequential_sum([maximum, maximum, -maximum]),
                    "Sequential intermediate")
_expect_value_error(lambda: sum_audit([maximum, maximum, -maximum]),
                    "Sequential intermediate")
# Reordering makes the intermediate finite; the exact input sum is unchanged.
assert sum_audit([maximum, -maximum, maximum])["sequential"] == maximum
small_for_max = math.ldexp(1.0, 969)
assert sequential_sum([maximum, small_for_max, small_for_max]) == maximum
_expect_value_error(lambda: sum_audit([maximum, small_for_max, small_for_max]),
                    "fsum")

class FloatChild(float):
    pass

class ListChild(list):
    pass

class TupleChild(tuple):
    pass

class PretendFloat:
    def __float__(self):
        raise AssertionError("Implicit conversion must not be attempted")

bad_scalars = [None, True, False, 1, 0, 10**400, 1 + 0j, "1.0",
               Fraction(1, 2), Decimal("0.5"), FloatChild(1.0),
               PretendFloat(), float("nan"), math.inf, -math.inf]
for bad in bad_scalars:
    _expect_value_error(lambda bad=bad: finite_float(bad))
    _expect_value_error(lambda bad=bad: sequential_sum([bad]))
    _expect_value_error(lambda bad=bad: sum_audit([bad]))
    _expect_value_error(lambda bad=bad: within_tolerance(
        bad, 0.0, rel_tol=0.0, abs_tol=0.0))
    _expect_value_error(lambda bad=bad: within_tolerance(
        0.0, bad, rel_tol=0.0, abs_tol=0.0))
    _expect_value_error(lambda bad=bad: within_tolerance(
        0.0, 0.0, rel_tol=bad, abs_tol=0.0))
    _expect_value_error(lambda bad=bad: within_tolerance(
        0.0, 0.0, rel_tol=0.0, abs_tol=bad))
for bad in [None, [], (), "1.0", {1.0}, {"x": 1.0}, iter([1.0]),
            (v for v in [1.0]), [1.0] * 33, ListChild([1.0]),
            TupleChild((1.0,))]:
    _expect_value_error(lambda bad=bad: sequential_sum(bad))
    _expect_value_error(lambda bad=bad: sum_audit(bad))
for bad in (-0.125, 1.0, 2.0):
    _expect_value_error(lambda bad=bad: within_tolerance(
        1.0, 1.0, rel_tol=bad, abs_tol=0.0))
_expect_value_error(lambda: within_tolerance(0.0, 0.0,
                                           rel_tol=0.0, abs_tol=-0.125))

# Exercise the explicit platform-rejection paths, restoring process state.
saved_info = sys.float_info
try:
    for key, wrong in (("rounds", 0), ("mant_dig", 24),
                       ("epsilon", 2.0**-51)):
        info = {name: getattr(saved_info, name) for name in (
            "radix", "mant_dig", "max_exp", "min_exp", "rounds",
            "epsilon", "min", "max")}
        info[key] = wrong
        sys.float_info = SimpleNamespace(**info)
        try:
            _require_binary64()
        except RuntimeError:
            pass
        else:
            raise AssertionError("Unsupported platform silently accepted")
finally:
    sys.float_info = saved_info
_require_binary64()
print("PASS: exact errors, 1296 dyadic pairs, 6 orders, tolerances and rejections")
`,
  'supervised-learning-naive-bayes': `
# Independent count/product, symmetry and boundary checks for the fitted model.
from collections import Counter
from fractions import Fraction
from itertools import product
from time import perf_counter
start = perf_counter()
xs = tuple(product((0, 1), repeat=2))
allrows = tuple(product((0, 1), repeat=3))
cases = 0
for n in (2, 3, 4):
    for rows in product(allrows, repeat=n):
        if len({r[2] for r in rows}) != 2:
            continue
        fitted = fit(rows)
        assert fit(tuple(reversed(rows))) == fitted
        swapped_class = fit(tuple((a, b, 1-y) for a, b, y in rows))
        swapped_features = fit(tuple((b, a, y) for a, b, y in rows))
        complement_first = fit(tuple((1-a, b, y) for a, b, y in rows))
        oracle = []
        for x in xs:
            # Tabulate successes independently for each class and queried value;
            # this does not read theta or call masses for the reference result.
            w = []
            for y in (0, 1):
                sub = tuple(r for r in rows if r[2] == y)
                matches = [Counter(r[j] for r in sub)[x[j]] for j in (0, 1)]
                w.append(Fraction(len(sub)*(matches[0]+1)*(matches[1]+1),
                                  n*(len(sub)+2)**2))
            expected = tuple(v/sum(w) for v in w)
            assert masses(fitted, x) == tuple(w)
            assert posterior(fitted, x) == expected
            assert 0 < expected[0] < 1 and sum(expected) == 1
            assert posterior(swapped_class, x) == expected[::-1]
            assert posterior(swapped_features, x[::-1]) == expected
            assert posterior(complement_first, (1-x[0], x[1])) == expected
            assert predict(fitted, x) == int(w[1] > w[0])
            oracle.append(w)
        assert sum(sum(w) for w in oracle) == 1
        cases += 1
assert cases == 4000
# Fixed alpha smoothing means row replication is NOT an invariance.
assert fit(train*2).prior == model.prior
assert fit(train*2).theta != model.theta
assert fit(train*2).theta[0][0] == Fraction(3, 14)
assert fit(train[:-1] + ((0, 0, 0),)).counts == (7, 3)
# Every possible binary feature/label perturbation of one held-out row leaves
# fitting unchanged; held-out predictions are allowed to respond to feature changes.
for i in range(len(holdout)):
    for row in allrows:
        altered = holdout[:i] + (row,) + holdout[i+1:]
        assert fit(train) == model
        for r in altered:
            assert sum(posterior(model, r[:2])) == 1
invalid = [lambda: fit([]), lambda: fit(()), lambda: fit(train[:1]),
           lambda: fit(train*101), lambda: fit(iter(train)), lambda: fit('bad'),
           lambda: fit(((0, 0, 0), (1, 1, 0))),
           lambda: fit(((0, 0, 1), (1, 1, 1))),
           lambda: fit(((0, 0, 0), (1, 1))),
           lambda: fit(((0, 0, 0), (1, 1, 1, 1))),
           lambda: fit(((0, 0, 0), None))]
for bad in (True, False, -1, 2, 0.0, 1.0, '1', None, float('nan'), float('inf')):
    invalid += [lambda bad=bad: fit(((0, 0, 0), (bad, 1, 1))),
                lambda bad=bad: fit(((0, 0, 0), (1, bad, 1))),
                lambda bad=bad: fit(((0, 0, 0), (1, 1, bad))),
                lambda bad=bad: posterior(model, (bad, 0)),
                lambda bad=bad: predict(model, (0, bad))]
for bad in (None, [], [0], [0, 1, 0], iter((0, 1)), '01', {0, 1}):
    invalid.append(lambda bad=bad: masses(model, bad))
for call in invalid:
    try:
        call()
    except ValueError:
        pass
    else:
        raise AssertionError('invalid input accepted')
assert fit(train*100).counts == (600, 400)
print(f'PASS: {cases} exhaustive datasets; all four inputs; order, label, feature and bit symmetries; normalized joint distributions; {len(invalid)} rejections; 1000-row boundary. {perf_counter()-start:.3f}s')
`,
  'classification-accuracy-precision-recall-f1': `
# Independent regression appended to the article's sole Python example.
from collections import Counter
from itertools import product
assert len(scores) == len(y_true) == 100
for t, m in [(50, ((81, 9), (2, 8))), (75, ((89, 1), (6, 4))),
             (101, ((90, 0), (10, 0))), (40, ((81, 9), (0, 10)))]:
    assert reports[t]['matrix'] == m
assert reports[50]['per_class'][1]['f1'] == Fraction(16, 27)
assert reports[75]['per_class'][1]['f1'] == Fraction(8, 15)
assert reports[101]['accuracy'] == Fraction(9, 10)
assert threshold_labels((40, 41, 39), 40) == (1, 1, 0)
assert threshold_labels((0, 100), 0) == (1, 1)
assert threshold_labels((0, 100), 101) == (0, 0)
p50, p75 = reports[50]['per_class'][1], reports[75]['per_class'][1]
assert p50['fp'] + 5 * p50['fn'] == 19 < 31 == p75['fp'] + 5 * p75['fn']
assert 3 * p50['fp'] + p50['fn'] == 29 > 9 == 3 * p75['fp'] + p75['fn']
# Recall/count monotonicity is guaranteed for fixed scores; precision is not.
prev = summarize(confusion(y_true, threshold_labels(scores, 0)))['per_class'][1]
for t in range(1, 102):
    cur = summarize(confusion(y_true, threshold_labels(scores, t)))['per_class'][1]
    assert cur['tp'] <= prev['tp'] and cur['fp'] <= prev['fp']
    assert cur['fn'] >= prev['fn'] and cur['tn'] >= prev['tn']
    prev = cur
assert reports[40]['per_class'][1]['precision'] > p50['precision'] < p75['precision']
# Undefined values and genuine zeros are distinct.
for matrix, expected in [(((3, 0), (0, 0)), (None, None, None)),
                         (((2, 0), (1, 0)), (None, 0, 0)),
                         (((2, 1), (0, 0)), (0, None, 0)),
                         (((0, 1), (1, 0)), (0, 0, 0))]:
    r = summarize(matrix)['per_class'][1]
    assert (r['precision'], r['recall'], r['f1']) == expected
assert summarize(((3, 0), (0, 0)))['accuracy'] == 1
assert summarize(((3, 0), (0, 0)))['macro_f1_strict'] is None
assert summarize(((3, 0), (0, 0)))['weighted_f1'] == 1
# Independent per-observation oracle, rather than reusing the implementation.
binary_cases = 0
for n in range(1, 6):
    for pairs in product(((0, 0), (0, 1), (1, 0), (1, 1)), repeat=n):
        truth, pred = tuple(zip(*pairs))
        r = summarize(confusion(truth, pred))
        c = Counter(pairs)
        assert r['matrix'] == ((c[0, 0], c[0, 1]), (c[1, 0], c[1, 1]))
        assert r['accuracy'] == Fraction(sum(a == b for a, b in pairs), n)
        p = r['per_class'][1]
        predicted_positive, actual_positive = sum(pred), sum(truth)
        joint_positive = sum(a * b for a, b in pairs)
        assert p['precision'] == (Fraction(joint_positive, predicted_positive) if predicted_positive else None)
        assert p['recall'] == (Fraction(joint_positive, actual_positive) if actual_positive else None)
        d = actual_positive + predicted_positive
        assert p['f1'] == (Fraction(2 * joint_positive, d) if d else None)
        assert r['micro_precision'] == r['micro_recall'] == r['micro_f1'] == r['accuracy']
        assert confusion(tuple(reversed(truth)), tuple(reversed(pred))) == r['matrix']
        q = summarize(confusion(pred, truth))['per_class'][1]
        assert q['precision'] == p['recall'] and q['recall'] == p['precision']
        assert q['f1'] == p['f1']
        repeated = summarize(confusion(truth * 2, pred * 2))
        assert repeated['accuracy'] == r['accuracy']
        assert repeated['per_class'][1]['f1'] == p['f1']
        binary_cases += 1
assert binary_cases == 1364
for tn, fp, fn, tp in product(range(4), repeat=4):
    if tn + fp + fn + tp == 0:
        continue
    r = summarize(((tn, fp), (fn, tp)))
    extra_tn = summarize(((tn + 1, fp), (fn, tp)))
    for key in ('precision', 'recall', 'f1'):
        assert r['per_class'][1][key] == extra_tn['per_class'][1][key]
    assert extra_tn['accuracy'] >= r['accuracy']
    swapped = summarize(((tp, fn), (fp, tn)))
    assert swapped['accuracy'] == r['accuracy']
    assert swapped['per_class'][1] == r['per_class'][0]
for pairs in product(tuple(product(range(3), repeat=2)), repeat=3):
    truth, pred = tuple(zip(*pairs))
    r = summarize(confusion(truth, pred, 3))
    assert sum(row['support'] for row in r['per_class']) == 3
    assert sum(row['fp'] for row in r['per_class']) == sum(row['fn'] for row in r['per_class'])
    assert r['micro_precision'] == r['micro_recall'] == r['micro_f1'] == r['accuracy']
    for row in r['per_class']:
        assert row['tp'] + row['fp'] + row['fn'] + row['tn'] == 3
assert multiclass['accuracy'] == Fraction(10, 11)
assert tuple(row['f1'] for row in multiclass['per_class']) == (Fraction(20, 21), Fraction(1, 6), Fraction(18, 19))
macro_p = sum(row['precision'] for row in multiclass['per_class']) / 3
macro_r = sum(row['recall'] for row in multiclass['per_class']) / 3
assert multiclass['macro_f1_strict'] != 2 * macro_p * macro_r / (macro_p + macro_r)
assert multiclass['weighted_f1'] > multiclass['macro_f1_strict']
for name, pi in (('10%', Fraction(1, 10)), ('1%', Fraction(1, 100))):
    p = base_rate_reports[name]['per_class'][1]
    assert p['recall'] == Fraction(4, 5)
    assert Fraction(p['fp'], p['fp'] + p['tn']) == Fraction(1, 10)
    assert p['precision'] == Fraction(4, 5)*pi/(Fraction(4, 5)*pi+Fraction(1, 10)*(1-pi))
assert base_rate_reports['10%']['per_class'][1]['precision'] == Fraction(8, 17)
assert base_rate_reports['1%']['per_class'][1]['precision'] == Fraction(8, 107)
bad_inputs = [
    lambda: confusion([], []), lambda: confusion([0], [0, 1]),
    lambda: confusion([False], [0]), lambda: confusion([0.0], [0]),
    lambda: confusion(['0'], [0]), lambda: confusion([[0]], [0]),
    lambda: confusion([2], [0]), lambda: confusion([-1], [0]),
    lambda: confusion([0], [0], True), lambda: confusion([0], [0], 1),
    lambda: confusion([0], [0], 6), lambda: confusion([0]*10001, [0]*10001),
    lambda: confusion(iter([0]), [0]), lambda: summarize([]),
    lambda: summarize([[1]]), lambda: summarize([[0, 0], [0, 0]]),
    lambda: summarize([[1, 0], [0]]), lambda: summarize([[1, 0], [0, -1]]),
    lambda: summarize([[True, 0], [0, 1]]), lambda: summarize([[1.0, 0], [0, 1]]),
    lambda: summarize([[10000, 0], [0, 1]]),
    lambda: threshold_labels([], 50), lambda: threshold_labels([0]*10001, 50),
    lambda: threshold_labels([50.0], 50), lambda: threshold_labels([float('nan')], 50),
    lambda: threshold_labels([float('inf')], 50), lambda: threshold_labels([True], 50),
    lambda: threshold_labels([101], 50), lambda: threshold_labels([-1], 50),
    lambda: threshold_labels([50], 50.0), lambda: threshold_labels([50], -1),
    lambda: threshold_labels([50], 102), lambda: threshold_labels([50], True),
]
for action in bad_inputs:
    try:
        action()
    except ValueError:
        pass
    else:
        raise AssertionError('invalid input accepted')
assert summarize(confusion([0]*10000, [0]*10000, 5))['accuracy'] == 1
print('REGRESSION PASS:', binary_cases, 'binary cases; 255 count matrices;',
      '729 multiclass cases; 101 threshold steps;', len(bad_inputs), 'rejection cases')
`,
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
  training: `assert abs(probabilities(updated)[0] - 0.598687660112452) < 1e-12
# Append after the article's marked training example in the repository test.
# Fraction oracles derive the loss from the two records, not quad_loss's shortcut.
from fractions import Fraction
from itertools import product

assert (h, target, rate) == (2.0, 0, 0.1)
assert weights == [0.0, 0.0] and gradients == [-1.0, 1.0]
assert updated == [0.1, -0.1]
assert abs(probabilities(updated)[0] - 0.598687660112452) < 1e-12
assert abs(loss(weights) - math.log(2)) < 1e-12
assert abs(loss(updated) - 0.5130152523999526) < 1e-12

quad_test_labels = (Fraction(0), Fraction(2))
quad_test_thetas = tuple(map(Fraction, (-2, 0, 1, 3))) + (Fraction(-1, 2), Fraction(1, 2), Fraction(3, 2))
quad_test_rates = tuple(map(Fraction, (0, 1, 2))) + (Fraction(1, 4), Fraction(1, 2), Fraction(3, 2), Fraction(5, 2))
quad_test_batches = ((0,), (1,)) + tuple(product((0, 1), repeat=2))
quad_test_cases = 0
for quad_t in quad_test_thetas:
    quad_reference_loss = sum((quad_t - y)**2 / 2 for y in quad_test_labels) / 2
    assert quad_loss(float(quad_t)) == float(quad_reference_loss)
    assert quad_gradient(float(quad_t)) == float(quad_t - 1)
    for quad_ids in quad_test_batches:
        quad_reference_g = quad_t - sum(quad_test_labels[i] for i in quad_ids) / len(quad_ids)
        assert quad_gradient(float(quad_t), quad_ids) == float(quad_reference_g)
        assert quad_gradient(float(quad_t), tuple(reversed(quad_ids))) == float(quad_reference_g)
        quad_input_ids = list(quad_ids)
        assert quad_gradient(float(quad_t), quad_input_ids) == float(quad_reference_g)
        assert quad_input_ids == list(quad_ids)
        for quad_eta in quad_test_rates:
            quad_reference_next = quad_t - quad_eta * quad_reference_g
            quad_reference_next_loss = sum((quad_reference_next - y)**2 / 2 for y in quad_test_labels) / 2
            quad_observed_next = quad_step(float(quad_t), float(quad_eta), quad_ids)
            assert quad_observed_next == float(quad_reference_next)
            assert quad_loss(quad_observed_next) == float(quad_reference_next_loss)
            quad_test_cases += 1
assert quad_test_cases == 294

# Conditional moments at fixed theta: one draw, two independent draws, census.
for quad_t in quad_test_thetas:
    quad_singles = [quad_gradient(float(quad_t), (i,)) for i in (0, 1)]
    quad_pairs_checked = [quad_gradient(float(quad_t), ids) for ids in product((0, 1), repeat=2)]
    quad_full = float(quad_t - 1)
    assert sum(quad_singles) / 2 == sum(quad_pairs_checked) / 4 == quad_full
    assert sum((g - quad_full)**2 for g in quad_singles) / 2 == 1
    assert sum((g - quad_full)**2 for g in quad_pairs_checked) / 4 == 1/2
    assert quad_gradient(float(quad_t), (0, 1)) == quad_gradient(float(quad_t), (1, 0)) == quad_full
    for quad_eta in quad_test_rates:
        # E[F(theta')] = 1/2 + (1-eta)^2*(theta-1)^2/2 + eta^2/(2*b).
        # This reference follows by expanding the quadratic and averaging the noise.
        for quad_size, quad_batches in ((1, ((0,), (1,))), (2, tuple(product((0, 1), repeat=2)))):
            quad_expected = Fraction(1, 2) + (1-quad_eta)**2*(quad_t-1)**2/2 + quad_eta**2/(2*quad_size)
            quad_observed = sum(quad_loss(quad_step(float(quad_t), float(quad_eta), ids)) for ids in quad_batches) / len(quad_batches)
            assert quad_observed == float(quad_expected)
assert quad_loss(1) == 1/2
assert sum(quad_loss(quad_step(1, 0.5, (i,))) for i in (0, 1)) / 2 == 5/8
assert sum(quad_loss(quad_step(1, 0.5, ids)) for ids in product((0, 1), repeat=2)) / 4 == 9/16
# Taking both records at the same theta is not updating after each record.
assert quad_step(1, 0.5) == 1
assert quad_step(quad_step(1, 0.5, (0,)), 0.5, (1,)) == 1.25
assert quad_step(quad_step(1, 0.5, (1,)), 0.5, (0,)) == 0.75

# Full-gradient recurrence, including stable oscillation and boundary behavior.
for quad_eta in quad_test_rates:
    quad_t = 0.0
    for quad_k in range(1, 9):
        quad_t = quad_step(quad_t, float(quad_eta))
        assert quad_t == float(1 - (1 - quad_eta)**quad_k)
    assert quad_step(1, float(quad_eta)) == 1
for quad_eta in (0.25, 0.5, 1, 1.5):
    assert quad_loss(quad_step(0, quad_eta)) < quad_loss(0)
assert quad_step(0, 0) == 0
assert quad_loss(quad_step(0, 2)) == quad_loss(0)
assert quad_loss(quad_step(0, 2.5)) > quad_loss(0)

# Mean/sum differ by two here. Compare direct sum-gradient updates with the API.
for quad_eta in quad_test_rates:
    quad_sum_t = Fraction(0)
    quad_mean_t = 0.0
    for quad_k in range(4):
        quad_sum_g = sum(quad_sum_t - y for y in quad_test_labels)
        quad_sum_t -= (quad_eta / 2) * quad_sum_g
        quad_mean_t = quad_step(quad_mean_t, float(quad_eta))
        assert quad_mean_t == float(quad_sum_t)
assert abs(1 - 2 * Fraction(3, 4)) < 1
assert abs(1 - 2 * Fraction(1)) == 1
assert abs(1 - 2 * Fraction(5, 4)) > 1

# A non-dyadic finite-difference check uses a tolerance, not exact float equality.
for quad_t in (-1.3, 0.2, 0.7, 1.1, 2.4):
    quad_epsilon = 1e-5
    quad_difference = (quad_loss(quad_t + quad_epsilon) - quad_loss(quad_t - quad_epsilon)) / (2 * quad_epsilon)
    assert math.isclose(quad_difference, quad_gradient(quad_t), rel_tol=1e-9, abs_tol=1e-9)

# Independent arithmetic for the prose clipping example; no added public API.
quad_clip_inputs = (Fraction(1, 2), Fraction(-3, 2))
quad_clip_first = sum(max(Fraction(-1), min(g, Fraction(1))) for g in quad_clip_inputs) / 2
quad_mean_first = max(Fraction(-1), min(sum(quad_clip_inputs) / 2, Fraction(1)))
assert quad_clip_first == Fraction(-1, 4) != Fraction(-1, 2) == quad_mean_first

quad_clip_cycle = [Fraction(0)]
for quad_k in range(4):
    quad_t = quad_clip_cycle[-1]
    quad_clipped_full = max(Fraction(-1), min(quad_t - 1, Fraction(1)))
    quad_clip_cycle.append(quad_t - 3 * quad_clipped_full)
assert quad_clip_cycle == [0, 3, 0, 3, 0]

quad_invalid_calls = []
for quad_bad in (True, False, None, "1", 1+0j, Fraction(1, 2), float("nan"), float("inf"), -float("inf"), 10**400):
    quad_invalid_calls += [lambda v=quad_bad: quad_finite(v),
                           lambda v=quad_bad: quad_loss(v),
                           lambda v=quad_bad: quad_gradient(v),
                           lambda v=quad_bad: quad_step(v, 0.5),
                           lambda v=quad_bad: quad_step(1, v)]
for quad_bad_ids in (None, (), [], [0, 1, 0], "01", {0, 1}, iter((0, 1)), [True], [False], [0.0], [1.0], [-1], [2], [0, None], [float("nan")]):
    quad_invalid_calls += [lambda ids=quad_bad_ids: quad_gradient(1, ids),
                           lambda ids=quad_bad_ids: quad_step(1, 0.5, ids)]
quad_invalid_calls += [lambda: quad_step(1, -0.1), lambda: quad_step(1, -1),
                       lambda: quad_loss(1e308), lambda: quad_loss(-1e308),
                       lambda: quad_step(1e308, 1e308)]
for quad_call in quad_invalid_calls:
    try:
        quad_call()
    except ValueError:
        pass
    else:
        raise AssertionError("invalid quadratic-example input or overflow accepted")
# Valid numeric/shape boundaries, repeated IDs, and zero learning rate.
assert quad_step(3, 0, [0]) == 3
assert quad_step(3, -0.0, [1]) == 3
assert quad_gradient(0, [0]) == quad_gradient(0, [0, 0]) == 0
assert quad_gradient(2, [1]) == quad_gradient(2, [1, 1]) == 0
assert quad_finite(1e308) == 1e308 and quad_gradient(1e308) == 1e308
assert quad_loss(1e150) > 0 and math.isfinite(quad_loss(1e150))
assert abs(probabilities(updated)[0] - 0.598687660112452) < 1e-12
print(f"training regression: {quad_test_cases} Fraction update cases, conditional moments, learning-rate boundaries, {len(quad_invalid_calls)} rejections; legacy classifier preserved")
`,
  'kv-cache': 'for lengths in [[], [-1], [1.5]]:\n    try: cache_bytes(32, 8, 128, 2, lengths)\n    except ValueError: pass\n    else: raise AssertionError("invalid cache dimensions accepted")'
};
const exampleKinds = validateExampleChecks(units, Object.keys(negatives));
const observableCaseResults = [];
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
    if (exampleKinds.get(article.id) === 'observable-case') {
      observableCaseResults.push(article.id === 'ai-ml-dl-boundaries'
        ? checkObservableCase(article, markdown) : checkLearningSignalsCase(article, markdown));
      continue;
    }
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
  const pilot = units.find(article => article.id === 'ai-ml-dl-boundaries');
  const exampleContractNegativeCases = testExampleContract(units, Object.keys(negatives),
    readFileSync(path.join(repositoryRoot, pilot.file), 'utf8'));
  const pilotVisibilityNegativeCases = testPilotMarkdownVisibility(pilot,
    readFileSync(path.join(repositoryRoot, pilot.file), 'utf8'));
  const learningSignals = units.find(article => article.id === 'unsupervised-self-supervised-learning');
  const learningSignalsContract = testLearningSignalsContract(units, Object.keys(negatives),
    readFileSync(path.join(repositoryRoot, learningSignals.file), 'utf8'));
  const report = { status: 'pass', independentArticles: units.length, runnableExamples: results.length,
    metadataNegativeCases: mutations.length, attentionMatchesGardenFixture: true, results,
    observableCaseFamilies: observableCaseResults.length, observableCaseResults, exampleContractNegativeCases, pilotVisibilityNegativeCases, learningSignalsContract,
    externalModelCalls: 0, commercialMeasurements: false, expertReview: false };
  mkdirSync(path.join(repositoryRoot, 'test-results'), { recursive: true });
  writeFileSync(path.join(repositoryRoot, 'test-results/knowledge-units.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally { rmSync(temp, { recursive: true, force: true }); }
