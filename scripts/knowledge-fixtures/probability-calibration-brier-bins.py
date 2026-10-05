# Append to the actual Markdown-extracted example. No implementation import.
from copy import deepcopy as _copy
from fractions import Fraction as _Q
from itertools import product as _product

_CASES = 0
_REJECTIONS = 0


def _direct(rows):
    # Explicit positive/negative-event losses, separate from analyze's residuals.
    return sum(((1 - _Q(q)) ** 2 if y else _Q(q) ** 2
                for q, y in rows), _Q(0)) / len(rows)


def _group_reference(rows):
    # Count by set/filter; resolution via pairwise group differences.
    n = len(rows)
    groups = []
    for score in sorted(set(q for q, y in rows)):
        n_g = sum(q == score for q, y in rows)
        positives = sum(y for q, y in rows if q == score)
        groups.append((_Q(n_g, n), _Q(score), _Q(positives, n_g)))
    rate = _Q(sum(y for q, y in rows), n)
    rel = sum((w * (q - r) ** 2 for w, q, r in groups), _Q(0))
    res = sum((w * v * (r - s) ** 2 / 2
               for w, q, r in groups for v, t, s in groups), _Q(0))
    unc = rate * (1 - rate)
    # Independently aggregate losses by positive and negative counts.
    grouped_loss = sum((w * (r * (1 - q) ** 2 + (1 - r) * q ** 2)
                        for w, q, r in groups), _Q(0))
    return rel, res, unc, grouped_loss


def _reference_bins(rows, edges, reflected=False):
    # Reflected bins use [0,e1], (e1,e2], ... instead of [e0,e1), ... ,[elast,1].
    stats = []
    weighted_gap = _Q(0)
    for j in range(len(edges) - 1):
        lo, hi = edges[j:j + 2]
        if reflected:
            subset = [(q, y) for q, y in rows
                      if lo < q <= hi or (j == 0 and q == 0)]
        else:
            subset = [(q, y) for q, y in rows
                      if lo <= q < hi or (j == len(edges) - 2 and q == 1)]
        n = len(subset)
        if n:
            q_sum = sum((_Q(q) for q, y in subset), _Q(0))
            y_sum = sum(y for q, y in subset)
            stats.append((n, q_sum / n, _Q(y_sum, n)))
            # n/n_total * |mean_q - mean_y| = |sum(q-y)|/n_total.
            weighted_gap += abs(q_sum - y_sum) / len(rows)
        else:
            stats.append((0, None, None))
    return weighted_gap, tuple(stats)


_EDGES = ((0, 1), (0, _Q(1, 2), 1),
          (0, _Q(1, 4), _Q(1, 2), _Q(3, 4), 1),
          (0, _Q(1, 3), _Q(2, 3), 1))


def _check(rows):
    global _CASES
    before = _copy(rows)
    acc, bs, rel, res, unc = analyze(rows)
    assert all(type(x) is _Q for x in (acc, bs, rel, res, unc))
    direct = _direct(rows)
    gr, gs, gu, grouped_loss = _group_reference(rows)
    assert bs == direct == grouped_loss == gr - gs + gu
    assert (rel, res, unc) == (gr, gs, gu)
    assert acc == _Q(sum((1 if q >= _Q(1, 2) else 0) == y for q, y in rows), len(rows))
    assert 0 <= bs <= 1 and min(rel, res, unc) >= 0
    reversed_rows = tuple(reversed(rows))
    assert analyze(reversed_rows) == analyze(rows)
    assert analyze(tuple(rows) * 2) == analyze(rows)
    complement = tuple((1 - q, 1 - y) for q, y in rows)
    assert analyze(complement)[1:] == (bs, rel, res, unc)
    assert fit_map(reversed_rows) == fit_map(rows) == fit_map(tuple(rows) * 2)
    for edges in _EDGES:
        expected = _reference_bins(rows, edges)
        assert bin_stats(rows, edges) == expected
        assert bin_stats(reversed_rows, edges) == expected
        replicated = bin_stats(tuple(rows) * 2, edges)
        assert replicated[0] == expected[0]
        assert replicated[1] == tuple((2 * n, q, r) for n, q, r in expected[1])
        reflected_edges = tuple(1 - e for e in reversed(edges))
        reflected = _reference_bins(complement, reflected_edges, reflected=True)
        assert reflected[0] == expected[0]
        assert reflected[1] == tuple((n, None if q is None else 1 - q,
                                      None if r is None else 1 - r)
                                     for n, q, r in reversed(expected[1]))
        # With no scores exactly on an internal edge, the two closure rules agree.
        if not any(q in edges[1:-1] for q, y in rows):
            assert bin_stats(complement, reflected_edges)[0] == expected[0]
    assert rows == before
    _CASES += 1


_points = tuple(_product((_Q(0), _Q(1, 4), _Q(1, 2), _Q(3, 4), _Q(1)), (0, 1)))
for _n in (1, 2, 3):
    for _rows in _product(_points, repeat=_n):
        _check(_rows)

# The article's fixed tables, checked against literal expected values.
_expected = {
    'constant': (_Q(1, 2), _Q(1, 4), _Q(0), _Q(0), _Q(1, 4)),
    'quarter': (_Q(3, 4), _Q(3, 16), _Q(0), _Q(1, 16), _Q(1, 4)),
    'tenth': (_Q(3, 4), _Q(21, 100), _Q(9, 400), _Q(1, 16), _Q(1, 4)),
}
for _name, _scores in forecasts.items():
    _rows = tuple(zip(_scores, labels))
    assert analyze(_rows) == _expected[_name]
    assert bin_stats(_rows, (0, 1))[0] == 0
    assert bin_stats(_rows)[0] == (_Q(3, 20) if _name == 'tenth' else 0)
    _check(_rows)

_raw = tuple(zip(raw_scores, heldout_labels))
_mapped = tuple(zip(heldout_mapped_scores, heldout_labels))
assert analyze(_raw)[:2] == (_Q(5, 8), _Q(31, 100))
assert analyze(_mapped)[:2] == (_Q(5, 8), _Q(1, 4))
assert bin_stats(_raw)[0] == _Q(11, 40)
assert bin_stats(_mapped)[0] == _Q(1, 8)
assert analyze(_mapped)[2] == _Q(1, 32) > 0
assert frozen_map == {_Q(1, 10): _Q(1, 4), _Q(9, 10): _Q(3, 4)}

# Fit/apply information boundary: no held-out labels are accepted by apply_map.
_map_before = _copy(frozen_map)
_applied = apply_map(frozen_map, heldout_scores)
for _alternative in _product((0, 1), repeat=8):
    analyze(tuple(zip(_applied, _alternative)))
    assert fit_map(calibration_rows) == _map_before
    assert apply_map(frozen_map, heldout_scores) == _applied
assert frozen_map == _map_before
# Relabeling the fitting data is allowed to alter the learned map.
assert fit_map(tuple((q, 1 - y) for q, y in calibration_rows)) != frozen_map

# Optional harm example: two groups of ten, empirical rates 1/10 and 9/10.
_harm_scores = (_Q(1, 10),) * 10 + (_Q(9, 10),) * 10
_harm_labels = (0,) * 9 + (1,) + (0,) + (1,) * 9
assert _direct(tuple(zip(_harm_scores, _harm_labels))) == _Q(9, 100)
assert _direct(tuple(zip(apply_map(frozen_map, _harm_scores), _harm_labels))) == _Q(9, 80)

# Coarse-bin counterexample: the identity applies to new bin-mean forecasts only.
_coarse = bin_stats(calibration_rows, (0, 1))[1][0]
assert _coarse == (8, _Q(1, 2), _Q(1, 2))
_false_raw_bs = (_coarse[1] - _coarse[2]) ** 2 + _Q(1, 4)
assert _false_raw_bs == _Q(1, 4) != analyze(calibration_rows)[1]
assert analyze(tuple((_coarse[1], y) for q, y in calibration_rows))[1] == _false_raw_bs

# Exact endpoints, tie, empty-bin policy; fractions remain exact, None remains absent.
_endpoint = ((0, 1), (_Q(1, 2), 0), (1, 0))
assert bin_stats(_endpoint)[1] == ((1, _Q(0), _Q(1)), (2, _Q(3, 4), _Q(0)))
assert analyze(((_Q(1, 2), 1),))[0] == 1
assert analyze(((_Q(1, 2), 0),))[0] == 0
assert bin_stats(((_Q(1, 2), 1),))[1] == ((0, None, None), (1, _Q(1, 2), _Q(1)))
# Reusing left-closed bins after complementing can move the 1/2 case.
_original_ece = bin_stats(_endpoint)[0]
_complement_endpoint = tuple((1 - q, 1 - y) for q, y in _endpoint)
assert _original_ece == _Q(5, 6)
assert bin_stats(_complement_endpoint)[0] == _Q(1, 2) != _original_ece
assert _reference_bins(_complement_endpoint, _EDGES[1], True)[0] == _original_ece
for _label in (0, 1):
    assert analyze(((_Q(1, 4), _label), (_Q(3, 4), _label)))[3:] == (_Q(0), _Q(0))
assert analyze(tuple((_Q(i, 63), i % 2) for i in range(64)))[1] == _direct(tuple((_Q(i, 63), i % 2) for i in range(64)))
assert bin_stats(((0, 0), (1, 1)), tuple(_Q(i, 16) for i in range(17)))[0] == 0
assert analyze(((_Q(1, 10000), 0),))[1] == _Q(1, 100000000)


def _reject(call):
    global _REJECTIONS
    try:
        call()
    except ValueError:
        _REJECTIONS += 1
    else:
        raise AssertionError('expected documented ValueError')


# Only the compact public contract is tested; no unrelated security/type framework.
for _bad in ([], (), None, 'rows', iter(((0, 0),)), [(0, 0)] * 65,
             [(0,)], [(0, 0, 1)], [None], [[0, 1.0]], [[0, True]],
             [[0, _Q(1)]], [[0, -1]], [[0, 2]], [[True, 0]],
             [[0.1, 0]], [['0.1', 0]], [[None, 0]], [[-1, 0]], [[2, 1]],
             [[_Q(1, 10001), 0]]):
    for _fn in (analyze, bin_stats, fit_map):
        _reject(lambda fn=_fn, bad=_bad: fn(bad))
for _bad in (None, [], (0,), (0, 0, 1), (0, 1, _Q(1, 2)), (_Q(1, 4), 1),
             (0, _Q(3, 4)), (0, -1, 1), (0, 2, 1), (False, 1), (0, 0.5, 1),
             tuple(_Q(i, 17) for i in range(18)), (0, _Q(1, 10001), 1)):
    _reject(lambda bad=_bad: bin_stats(((0, 0),), bad))
for _bad in (None, {}, [], {0.1: 0}, {True: 0}, {0: True}, {0: 1.0},
             {-1: 0}, {0: 2}, {_Q(i, 64): 0 for i in range(65)}):
    _reject(lambda bad=_bad: apply_map(bad, (0,)))
for _bad in ([], None, (0.1,), (True,), ('0',), (-1,), (2,), (0,) * 65, (_Q(1, 10001),)):
    _reject(lambda bad=_bad: apply_map({0: 0}, bad))
_reject(lambda: apply_map(frozen_map, (_Q(1, 2),)))
# Accepted list inputs and mapping application are nonmutating.
_list_rows = [[0, 0], [_Q(1, 2), 1], [1, 0]]
_snapshot = _copy(_list_rows)
assert analyze(_list_rows) == analyze(tuple(tuple(row) for row in _list_rows))
assert apply_map({0: 1, 1: 0}, [0, 1]) == (_Q(1), _Q(0))
assert _list_rows == _snapshot
# Checked exercise arithmetic and difference between the two ECE objects.
assert 4 * _Q(1, 4) * _Q(3, 4) ** 3 == _Q(27, 64)
assert _Q(1, 4) - _Q(21, 100) == _Q(1, 25)
_top_label_rows = tuple((max(q, 1 - q), int(int(q >= _Q(1, 2)) == y))
                        for q, y in calibration_rows)
assert bin_stats(_top_label_rows, (0, 1))[0] == _Q(3, 20)
_subgroups = ((_Q(1, 2), 0), (_Q(1, 2), 0), (_Q(1, 2), 1), (_Q(1, 2), 1))
assert bin_stats(_subgroups, (0, 1))[0] == 0
assert bin_stats(_subgroups[:2], (0, 1))[0] == _Q(1, 2)
assert bin_stats(_subgroups[2:], (0, 1))[0] == _Q(1, 2)
print('author regression passed:', _CASES, 'exact cases;',
      _REJECTIONS, 'documented rejection checks; 256 held-out relabelings; exercises passed')
