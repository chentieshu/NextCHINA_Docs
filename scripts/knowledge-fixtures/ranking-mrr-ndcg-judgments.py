# Append to the Markdown-extracted program; no production implementation import.
from copy import deepcopy as _copy
from decimal import Decimal as _D, localcontext as _context
from fractions import Fraction as _F
from itertools import permutations as _permutations, product as _product
from math import isclose as _close, isfinite as _finite

_CASES = 0
_REJECTIONS = 0
_PROPERTIES = 0
_MAX_ERROR = 0.0
_GAINS = (_D(0), _D(1), _D(3), _D(7))
with _context() as _ctx:
    _ctx.prec = 80
    # Reciprocal log2 computed through natural logs at 80 digits.
    _WEIGHTS = {i: +(_D(2).ln() / _D(i + 1).ln()) for i in range(1, 65)}
_IDEALS = {}


def _dcg_oracle(grades, cutoff, linear=False):
    with _context() as ctx:
        ctx.prec = 80
        return sum((( _D(g) if linear else _GAINS[g]) * _WEIGHTS[i]
                    for i, g in enumerate(grades, 1) if i <= cutoff), _D(0))


def _ideal_oracle(judgments, cutoff):
    # A max over all permutations, not the calculator's descending sort.
    key = (tuple(judgments.values()), cutoff)
    if key not in _IDEALS:
        assert len(judgments) <= 5
        _IDEALS[key] = max(_dcg_oracle(p, cutoff)
                           for p in _permutations(judgments.values()))
    return _IDEALS[key]


def _check(judgments, ranking, cutoff, threshold=1):
    global _CASES, _MAX_ERROR
    before = _copy((judgments, ranking))
    result = score_ranking(judgments, ranking, cutoff, threshold)
    assert (judgments, ranking) == before
    assert type(result) is dict
    assert set(result) == {"rr", "dcg", "idcg", "ndcg", "relevant_total",
                           "examined", "returned", "universe_size"}
    hits = [ranking.index(doc) + 1 for doc in ranking
            if judgments[doc] >= threshold and ranking.index(doc) < cutoff]
    rr = _F(1, min(hits)) if hits else _F(0)
    dcg = _dcg_oracle(tuple(judgments[d] for d in ranking), cutoff)
    ideal = _ideal_oracle(judgments, cutoff)
    with _context() as ctx:
        ctx.prec = 80
        ndcg = dcg / ideal if ideal else None
    assert type(result["rr"]) is _F and result["rr"] == rr
    for field, expected in (("dcg", dcg), ("idcg", ideal), ("ndcg", ndcg)):
        actual = result[field]
        if expected is None:
            assert actual is None
        else:
            assert type(actual) is float and _finite(actual)
            error = abs(actual - float(expected))
            _MAX_ERROR = max(_MAX_ERROR, error)
            assert _close(actual, float(expected), rel_tol=3e-13, abs_tol=2e-13)
    assert 0 <= result["rr"] <= 1
    if ideal:
        assert -2e-13 <= result["ndcg"] <= 1 + 2e-13
    for field, expected in (
        ("relevant_total", len([g for g in judgments.values() if g >= threshold])),
        ("examined", min(cutoff, len(ranking))),
        ("returned", len(ranking)), ("universe_size", len(judgments))):
        assert type(result[field]) is int and result[field] == expected
    _CASES += 1
    return result


# Exhaustive grades, strict partial rankings, cutoffs and relevance thresholds.
for _n in range(1, 4):
    _ids = tuple("abc"[:_n])
    for _grades in _product(range(4), repeat=_n):
        _judgments = dict(zip(_ids, _grades))
        for _length in range(_n + 1):
            for _ranking in _permutations(_ids, _length):
                for _k in range(1, _n + 2):
                    for _threshold in range(1, 4):
                        _check(_judgments, _ranking, _k, _threshold)
assert _CASES == 13056

# Larger distinct fixed universes, including the gain-convention counterexample.
for _judgments in (queries["Q1"], queries["Q2"],
                   {"a": 1, "b": 2, "c": 0, "d": 3, "e": 2}):
    for _ranking in _permutations(_judgments):
        for _k in range(1, 7):
            for _threshold in range(1, 4):
                _check(_judgments, _ranking, _k, _threshold)

# Main cohort arithmetic, with a declared denominator for each metric.
for _run, _expected_mrr in (("A", _F(1, 2)), ("B", _F(1, 3))):
    _rows = [_check(j, runs[_run][q], 3) for q, j in queries.items()]
    assert sum((r["rr"] for r in _rows), _F(0)) / 3 == _expected_mrr
    _eligible = [r for r in _rows if r["ndcg"] is not None]
    assert len(_eligible) == 2 and len(_rows) - len(_eligible) == 1
    _mean = sum(r["ndcg"] for r in _eligible) / 2
    _expected = sum(float(_dcg_oracle(tuple(queries[q][d] for d in runs[_run][q]), 3)
                          / _ideal_oracle(queries[q], 3)) for q in ("Q1", "Q2")) / 2
    assert _close(_mean, _expected, abs_tol=2e-13)
    # Sum-ratio is an IDCG-weighted average; it is not the macro mean here.
    _pooled = sum(r["dcg"] for r in _eligible) / sum(r["idcg"] for r in _eligible)
    assert abs(_mean - _pooled) > 1e-4
    _PROPERTIES += 1

# Exact human-derivable RR and selected DCG checks, not an output-only oracle.
assert score_ranking(queries["Q1"], runs["A"]["Q1"], 3)["dcg"] == 4.5
assert score_ranking(queries["Q1"], runs["A"]["Q1"], 3, 2)["rr"] == _F(1, 3)
assert score_ranking(queries["Q1"], runs["B"]["Q1"], 3, 3)["rr"] == _F(1, 2)
assert score_ranking(queries["Q2"], runs["B"]["Q2"], 5)["rr"] == _F(1, 4)
_short = _check(queries["Q1"], ["c"], 3)
assert _short["rr"] == 1 and _short["dcg"] == 1.0
assert 0 < _short["ndcg"] < 1
assert _short["idcg"] == score_ranking(queries["Q1"], [], 3)["idcg"]
assert score_ranking({"c": 1}, ["c"], 3)["ndcg"] == 1
# This last result is valid for its smaller declared universe: omission is not detectable.
assert score_ranking({"a": 1}, ["a"], 1, 3)["ndcg"] == 1
assert score_ranking({"a": 1}, ["a"], 1, 3)["relevant_total"] == 0

_X, _Y = (1, 2, 0, 3, 2), (0, 1, 3, 2, 2)
assert sorted(_X) == sorted(_Y)
assert _dcg_oracle(_X, 3, linear=True) > _dcg_oracle(_Y, 3, linear=True)
assert _dcg_oracle(_X, 3) < _dcg_oracle(_Y, 3)
_tied = {"a": 3, "c": 1}
_ta = _check(_tied, ["a", "c"], 1, 3)
_tc = _check(_tied, ["c", "a"], 1, 3)
assert (_ta["rr"], _tc["rr"]) == (_F(1), _F(0))
assert _ta["ndcg"] == 1 and _close(_tc["ndcg"], 1/7)
_cut_j = {"a": 3, "b": 2, "c": 0}
assert score_ranking(_cut_j, ["a", "c", "b"], 1)["ndcg"] > score_ranking(_cut_j, ["a", "c", "b"], 2)["ndcg"]

# ID renaming, dict insertion order, zero-grade additions, same-grade exchanges.
_base = {"a": 3, "b": 1, "c": 1, "d": 0}
for _k in range(1, 6):
    _order = ["b", "d", "a", "c"]
    _a = _check(_base, _order, _k)
    _b = _check({"u": 3, "v": 1, "w": 1, "x": 0}, ["v", "x", "u", "w"], _k)
    assert _a == _b
    assert _a == _check(dict(reversed(tuple(_base.items()))), _order, _k)
    assert _a == _check(_base, ["c", "d", "a", "b"], _k)
    _with_zero = _check(dict(_base, e=0), _order, _k)
    assert all(_a[f] == _with_zero[f] for f in _a if f != "universe_size")
    _PROPERTIES += 4

# Promotion and exact exchange formula, including crossing the cutoff.
_j = {"a": 3, "b": 2, "c": 1, "d": 0}
for _order_tuple in _permutations(_j):
    for _i in range(4):
        for _z in range(_i + 1, 4):
            if _j[_order_tuple[_i]] >= _j[_order_tuple[_z]]:
                continue
            _promoted = list(_order_tuple)
            _promoted[_i], _promoted[_z] = _promoted[_z], _promoted[_i]
            for _k in range(1, 6):
                for _threshold in range(1, 4):
                    _old = score_ranking(_j, _order_tuple, _k, _threshold)
                    _new = score_ranking(_j, _promoted, _k, _threshold)
                    _earlier = _WEIGHTS[_i + 1] if _i < _k else _D(0)
                    _later = _WEIGHTS[_z + 1] if _z < _k else _D(0)
                    _gain_delta = _GAINS[_j[_order_tuple[_z]]] - _GAINS[_j[_order_tuple[_i]]]
                    _expected_delta = _gain_delta * (_earlier - _later)
                    assert _close(_new["dcg"] - _old["dcg"], float(_expected_delta), abs_tol=2e-13)
                    assert _new["rr"] >= _old["rr"]
                    assert _new["dcg"] + 2e-13 >= _old["dcg"]
                    _PROPERTIES += 1

# Exercise independently tested from raw IDs.
_ej = {"x": 2, "y": 0, "z": 1, "w": 3}
_er = ["y", "z", "x"]
_e1 = _check(_ej, _er, 3, 1)
_e2 = _check(_ej, _er, 3, 2)
_e4 = _check(_ej, _er + ["w"], 4, 1)
assert (_e1["rr"], _e2["rr"], _e4["rr"]) == (_F(1, 2), _F(1, 3), _F(1, 2))
assert _close(_e1["dcg"], float(_WEIGHTS[2] + 3 * _WEIGHTS[3]), abs_tol=2e-13)
assert _e4["idcg"] == _e1["idcg"] and _e4["ndcg"] > _e1["ndcg"]
_check(queries["Q3"], [], 64)

# Accepted numerical/identifier/input boundaries without factorial enumeration64.
_big = {"d" + str(i): 3 for i in range(64)}
_big_before = _copy(_big)
for _ranking in (list(_big), tuple(_big)):
    _out = score_ranking(_big, _ranking, 64, 3)
    assert _out["rr"] == 1 and _out["ndcg"] == 1
    assert _close(_out["dcg"], float(_dcg_oracle([3] * 64, 64)), rel_tol=3e-13)
    assert _out["relevant_total"] == _out["examined"] == _out["returned"] == _out["universe_size"] == 64
assert _big == _big_before
assert score_ranking({"a" + "1" * 15: 0}, [], 64, 3)["ndcg"] is None
assert score_ranking({"a": 3}, ("a",), 64)["ndcg"] == 1

class _Dict(dict):
    pass
class _List(list):
    pass
class _Tuple(tuple):
    pass
class _Int(int):
    pass
class _Str(str):
    pass


def _reject(j, r, k=1, t=1):
    global _REJECTIONS
    # Mutations are forbidden even when rejecting malformed containers.
    before = _copy((j, r)) if type(r) is not type(iter(())) else None
    try:
        score_ranking(j, r, k, t)
    except ValueError:
        pass
    else:
        raise AssertionError("declared invalid input was accepted")
    if before is not None:
        assert (j, r) == before
    _REJECTIONS += 1


for _bad in (None, [], (), "a", 1, True, _Dict(a=1), {}, {"d"+str(i): 1 for i in range(65)}):
    _reject(_bad, [])
for _bad in ("", "A", "a_b", "a-b", "1a", "a b", "é", "a\n", "a"*17, b"a", 1, None, ("a",), _Str("a")):
    _reject({_bad: 1}, [])
for _bad in (-1, 4, True, False, 1.0, _F(1), _D(1), float("nan"), float("inf"), None, "1", _Int(1), 10**100):
    _reject({"a": _bad}, ["a"])
for _bad in (None, "a", {"a"}, {"a": 1}, iter(()), 1, True, _List(["a"]), _Tuple(("a",)), ["a"]*65):
    _reject({"a": 1}, _bad)
for _bad in ("", "A", "a_b", "a-b", "1a", "a b", "é", "a\n", "a"*17, b"a", 1, None, ["a"], {"a":1}, _Str("a")):
    _reject({"a": 1}, [_bad])
    _reject({"a": 1}, ["a", _bad])  # Invalid element after k=1 still rejected.
for _bad_r in (["b"], ["a", "b"], ["a", "a"], ("a", "a")):
    _reject({"a": 1}, _bad_r)
for _bad in (0, 65, -1, True, False, 1.0, _F(1), _D(1), None, "1", _Int(1), 10**100):
    _reject({"a": 1}, ["a"], _bad)
for _bad in (0, 4, -1, True, False, 1.0, _F(1), _D(1), None, "1", _Int(1), 10**100):
    _reject({"a": 1}, ["a"], 1, _bad)

print("ranking fixture:", _CASES, "Decimal oracle cases;", _PROPERTIES,
      "property checks;", _REJECTIONS, "rejections; maximum float error", _MAX_ERROR)
