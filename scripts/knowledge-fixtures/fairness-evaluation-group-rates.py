# Append to the Markdown-extracted program, as the current repository expects.
# This author fixture uses record expansion, not production rate helpers.
from copy import deepcopy as _deepcopy
from fractions import Fraction as _F
from itertools import product as _product

_STATS = {"decision_cases": 0, "score_cases": 0,
          "metamorphic_checks": 0, "rejections": 0}
_RATE_NAMES = ("base_rate", "selection_rate", "tpr", "fpr",
               "ppv", "npv", "accuracy")


def _fraction_by_filter(records, condition, outcome):
    selected = [r for r in records if condition(r)]
    return (_F(sum(outcome(r) for r in selected), len(selected))
            if selected else None)


def _expand_decisions(rows):
    records = []
    for row in rows:
        for name, y, d in (("tn", 0, 0), ("fp", 0, 1),
                           ("fn", 1, 0), ("tp", 1, 1)):
            records.extend([(row["group"], y, d)] * row[name])
    return records


def _reference(records):
    groups = {}
    for group in ("A", "B"):
        r = [x for x in records if x[0] == group]
        counts = {
            "tn": sum(y == d == 0 for g, y, d in r),
            "fp": sum(y == 0 and d == 1 for g, y, d in r),
            "fn": sum(y == 1 and d == 0 for g, y, d in r),
            "tp": sum(y == d == 1 for g, y, d in r),
            "total": len(r),
            "observed_positive": sum(y == 1 for g, y, d in r),
            "observed_negative": sum(y == 0 for g, y, d in r),
            "selected": sum(d == 1 for g, y, d in r),
            "not_selected": sum(d == 0 for g, y, d in r),
        }
        rates = {
            "base_rate": _fraction_by_filter(r, lambda x: True, lambda x: x[1] == 1),
            "selection_rate": _fraction_by_filter(r, lambda x: True, lambda x: x[2] == 1),
            "tpr": _fraction_by_filter(r, lambda x: x[1] == 1, lambda x: x[2] == 1),
            "fpr": _fraction_by_filter(r, lambda x: x[1] == 0, lambda x: x[2] == 1),
            "ppv": _fraction_by_filter(r, lambda x: x[2] == 1, lambda x: x[1] == 1),
            "npv": _fraction_by_filter(r, lambda x: x[2] == 0, lambda x: x[1] == 0),
            "accuracy": _fraction_by_filter(r, lambda x: True, lambda x: x[1] == x[2]),
        }
        groups[group] = {"counts": counts, "rates": rates}
    gaps = {}
    for name in _RATE_NAMES:
        a, b = [groups[g]["rates"][name] for g in ("A", "B")]
        gaps[name] = None if None in (a, b) else b - a
    return {"groups": groups, "gap_B_minus_A": gaps}


def _exact_keys(value, names):
    assert type(value) is dict
    assert all(type(k) is str for k in value)
    assert set(value) == set(names)


def _group_schema(result):
    _exact_keys(result, ("groups", "gap_B_minus_A"))
    _exact_keys(result["groups"], ("A", "B"))
    for group in ("A", "B"):
        entry = result["groups"][group]
        _exact_keys(entry, ("counts", "rates"))
        _exact_keys(entry["counts"],
                    ("tn", "fp", "fn", "tp", "total", "observed_positive",
                     "observed_negative", "selected", "not_selected"))
        assert all(type(v) is int and v >= 0 for v in entry["counts"].values())
        _exact_keys(entry["rates"], _RATE_NAMES)
        assert all(v is None or type(v) is _F for v in entry["rates"].values())
    _exact_keys(result["gap_B_minus_A"], _RATE_NAMES)
    assert all(v is None or type(v) is _F
               for v in result["gap_B_minus_A"].values())


def _score_schema(result):
    _exact_keys(result, ("threshold", "score_cells", "decision_audit"))
    assert type(result["threshold"]) is _F
    assert 0 <= result["threshold"] <= 1
    assert type(result["score_cells"]) is tuple
    for row in result["score_cells"]:
        _exact_keys(row, ("group", "score", "total", "positives",
                          "empirical_positive_rate", "calibration_gap"))
        assert type(row["group"]) is str and row["group"] in ("A", "B")
        assert type(row["score"]) is _F and 0 <= row["score"] <= 1
        assert type(row["total"]) is int and row["total"] > 0
        assert type(row["positives"]) is int and 0 <= row["positives"] <= row["total"]
        assert type(row["empirical_positive_rate"]) is _F
        assert type(row["calibration_gap"]) is _F
    _group_schema(result["decision_audit"])


def _decision_check(rows):
    before = _deepcopy(rows)
    result = group_rates(rows)
    _group_schema(result)
    assert result == _reference(_expand_decisions(rows))
    assert rows == before
    assert set(result) == {"groups", "gap_B_minus_A"}
    for group in ("A", "B"):
        assert all(type(v) is int for v in result["groups"][group]["counts"].values())
        rates = result["groups"][group]["rates"]
        assert all(v is None or type(v) is _F for v in rates.values())
        p, t, f, q = [rates[k] for k in ("base_rate", "tpr", "fpr", "ppv")]
        if t is not None and f is not None and rates["selection_rate"]:
            assert q == t * p / (t * p + f * (1 - p))
    _STATS["decision_cases"] += 1
    return result


def _row(group, values):
    return dict(zip(("group", "tn", "fp", "fn", "tp"), (group, *values)))


# Every ordered pair of nonempty 0..2 confusion-count tuples.
_patterns = [p for p in _product(range(3), repeat=4) if any(p)]
for _a in _patterns:
    for _b in _patterns:
        _decision_check([_row("A", _a), _row("B", _b)])

# Permutation, scaled counts, group-swap gaps and the two independent reversals.
for _a in _patterns:
    _rows0 = [_row("A", _a), _row("B", (2, 1, 2, 1))]
    _base = _decision_check(_rows0)
    assert group_rates(list(reversed(_rows0))) == _base
    _scaled = [{k: (v * 3 if k != "group" else v) for k, v in r.items()}
               for r in _rows0]
    _rep = _decision_check(_scaled)
    for _g in ("A", "B"):
        assert _rep["groups"][_g]["rates"] == _base["groups"][_g]["rates"]
    _swapped = [{**r, "group": "B" if r["group"] == "A" else "A"}
                for r in _rows0]
    _swap = _decision_check(_swapped)
    assert _swap["gap_B_minus_A"] == {
        k: None if v is None else -v for k, v in _base["gap_B_minus_A"].items()}
    for _kind, _order in (("outcome", ("fn", "tp", "tn", "fp")),
                          ("decision", ("fp", "tn", "tp", "fn"))):
        _reversed = [_row(r["group"], [r[k] for k in _order]) for r in _rows0]
        _rev = _decision_check(_reversed)
        for _g in ("A", "B"):
            _old, _new = [_x["groups"][_g]["rates"] for _x in (_base, _rev)]
            assert _new["accuracy"] == 1 - _old["accuracy"]
            if _kind == "outcome":
                assert _new["tpr"] == _old["fpr"]
                assert _new["fpr"] == _old["tpr"]
            else:
                for _k in ("tpr", "fpr"):
                    assert _new[_k] == (None if _old[_k] is None else 1 - _old[_k])
    _STATS["metamorphic_checks"] += 5


def _score_check(rows, threshold):
    before = _deepcopy(rows)
    records = [(r["group"], r["score"], y)
               for r in rows
               for y in [1] * r["positives"] + [0] * (r["total"] - r["positives"])]
    # Threshold independently on expanded records.
    expected = _reference([(g, y, int(s >= threshold)) for g, s, y in records])
    result = score_group_audit(rows, threshold)
    _score_schema(result)
    assert set(result) == {"threshold", "score_cells", "decision_audit"}
    assert result["decision_audit"] == expected
    assert result["threshold"] == threshold
    expected_scores = []
    for g, s in sorted({(g, s) for g, s, y in records}):
        subset = [y for h, t, y in records if (h, t) == (g, s)]
        empirical = _F(sum(subset), len(subset))
        expected_scores.append({"group": g, "score": s, "total": len(subset),
                                "positives": sum(subset),
                                "empirical_positive_rate": empirical,
                                "calibration_gap": empirical - s})
    assert result["score_cells"] == tuple(expected_scores)
    assert rows == before
    _STATS["score_cases"] += 1
    return result


for _positive_counts in _product(range(3), repeat=6):
    _sr = [{"group": g, "score": s, "total": 2, "positives": p}
           for (g, s), p in zip(_product(("A", "B"), (_F(0), _F(1, 2), _F(1))),
                                _positive_counts)]
    for _threshold in (_F(0), _F(1, 4), _F(1, 2), _F(3, 4), _F(1)):
        _score_check(_sr, _threshold)

_FA = [_row("A", (70, 10, 5, 15)), _row("B", (35, 5, 15, 45))]
_FB = [{"group": g, "score": _F(s, 4), "total": n, "positives": p}
       for g, s, n, p in (("A", 1, 16, 4), ("A", 2, 8, 4), ("A", 3, 4, 3),
                          ("B", 1, 4, 1), ("B", 2, 8, 4), ("B", 3, 16, 12))]
_AUDIT = _decision_check(_FA)
_SCORE = _score_check(_FB, _F(1, 2))
assert [_AUDIT["groups"][g]["rates"]["ppv"] for g in ("A", "B")] == [_F(3, 5), _F(9, 10)]
assert all(r["calibration_gap"] == 0 for r in _SCORE["score_cells"])
assert [_SCORE["decision_audit"]["groups"][g]["rates"]["ppv"]
        for g in ("A", "B")] == [_F(7, 12), _F(2, 3)]
assert score_group_audit(list(reversed(_FB)), _F(1, 2)) == _SCORE
_replicated = [{**r, "total": 3 * r["total"], "positives": 3 * r["positives"]} for r in _FB]
_rep_score = _score_check(_replicated, _F(1, 2))
for _g in ("A", "B"):
    assert _rep_score["decision_audit"]["groups"][_g]["rates"] == _SCORE["decision_audit"]["groups"][_g]["rates"]
# Unequal supports are accepted; unobserved score/group cells are not filled.
_score_check([{"group": "A", "score": _F(0), "total": 1, "positives": 0},
              {"group": "B", "score": _F(1), "total": 1, "positives": 1}], _F(1, 2))
# Output mutation cannot change the input or a later recomputation.
_copy_input = _deepcopy(_FB)
_alias = score_group_audit(_copy_input, _F(1, 2))
_alias["score_cells"][0]["total"] = 999
_alias["decision_audit"]["groups"]["A"]["counts"]["tn"] = 999
assert _copy_input == _FB
assert score_group_audit(_copy_input, _F(1, 2)) == _SCORE
_group_input = _deepcopy(_FA)
_group_output = group_rates(_group_input)
_group_output["groups"]["A"]["counts"]["tn"] = 999
assert _group_input == _FA
assert group_rates(_group_input) == _AUDIT


def _reject(function, *args):
    before = _deepcopy(args)
    try:
        function(*args)
    except ValueError:
        assert args == before
        _STATS["rejections"] += 1
    else:
        raise AssertionError("invalid input accepted")


class _IntChild(int):
    pass


class _FractionChild(_F):
    pass


class _ListChild(list):
    pass


class _DictChild(dict):
    pass


class _StrChild(str):
    pass


for _bad in (None, {}, (), tuple(_FA), [], _ListChild(_FA)):
    _reject(group_rates, _bad)
for _bad in (None, {}, (), tuple(_FB), [], _ListChild(_FB)):
    _reject(score_group_audit, _bad, _F(1, 2))
for _bad in (None, [], 1, _DictChild(_FA[0])):
    _reject(group_rates, [_bad, _FA[1]])
for _bad in (None, [], 1, _DictChild(_FB[0])):
    _reject(score_group_audit, [_bad, *_FB[1:]], _F(1, 2))
for _bad in (True, False, -1, 0.0, 1.0, "1", _F(1), None, _IntChild(1)):
    for _key in ("tn", "fp", "fn", "tp"):
        _reject(group_rates, [_FA[0], {**_FA[1], _key: _bad}])
    for _key in ("total", "positives"):
        _reject(score_group_audit, [*_FB[:-1], {**_FB[-1], _key: _bad}], _F(1, 2))
for _bad in (True, False, 0, 1, 0.5, "1/2", None, _F(-1, 2), _F(3, 2), _FractionChild(1, 2)):
    _reject(score_group_audit, _FB, _bad)
    _reject(score_group_audit, [*_FB[:-1], {**_FB[-1], "score": _bad}], _F(1, 2))
for _bad in (None, 1, "", "C", "a", _StrChild("A")):
    _reject(group_rates, [_FA[0], {**_FA[1], "group": _bad}])
    _reject(score_group_audit, [*_FB[:-1], {**_FB[-1], "group": _bad}], _F(1, 2))
for _key in ("group", "tn", "fp", "fn", "tp"):
    _reject(group_rates, [_FA[0], {k: v for k, v in _FA[1].items() if k != _key}])
for _key in ("group", "score", "total", "positives"):
    _reject(score_group_audit, [*_FB[:-1], {k: v for k, v in _FB[-1].items() if k != _key}], _F(1, 2))
_reject(group_rates, [_FA[0], {**_FA[1], "total": 100}])
_reject(group_rates, [_FA[0]])
_reject(group_rates, [_FA[0], _FA[0]])
_reject(group_rates, [*_FA, _FA[0]])
_reject(group_rates, [_FA[0], _row("B", (0, 0, 0, 0))])
_reject(score_group_audit, [r for r in _FB if r["group"] == "A"], _F(1, 2))
_reject(score_group_audit, [*_FB, dict(_FB[0])], _F(1, 2))
_reject(score_group_audit, [*_FB, {**_FB[0], "score": _F(2, 8)}], _F(1, 2))
_reject(score_group_audit, [*_FB[:-1], {**_FB[-1], "total": 0, "positives": 0}], _F(1, 2))
_reject(score_group_audit, [*_FB[:-1], {**_FB[-1], "positives": 17}], _F(1, 2))
_reject(score_group_audit, [*_FB[:-1], {**_FB[-1], "weight": 1}], _F(1, 2))
print("AUTHOR_FIXTURE", _STATS)
