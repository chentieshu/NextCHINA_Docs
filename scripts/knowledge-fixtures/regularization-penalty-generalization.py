
# Author regression suffix: append to the actual extracted Markdown block.
# No implementation import; reference objectives are independent residual sums.
from copy import deepcopy as _deepcopy
from fractions import Fraction as _Q
from itertools import product as _product


def _reference_terms(rows, w, l2):
    residual_squares = []
    for x, y in rows:
        residual = _Q(w) * _Q(x) - _Q(y)
        residual_squares.append(residual * residual)
    loss = sum(residual_squares, _Q(0)) / _Q(2 * len(rows))
    weighted_penalty = _Q(l2) * _Q(w) ** 2 / 2
    return loss, weighted_penalty, loss + weighted_penalty


def _reference_quadratic(rows, l2):
    # Recover the full polynomial from values, not from the implementation's
    # sum_xx/sum_xy aggregates, and independently determine its stationary point.
    left = _reference_terms(rows, -1, l2)[2]
    center = _reference_terms(rows, 0, l2)[2]
    right = _reference_terms(rows, 1, l2)[2]
    curvature = left + right - 2 * center
    linear = (right - left) / 2
    return curvature, linear


_rejections = 0


def _reject(call):
    global _rejections
    try:
        call()
    except ValueError:
        _rejections += 1
    else:
        raise AssertionError("expected ValueError for unsupported supplied value")


_exact_cases = 0
_property_checks = 0


def _check_case(rows, l2):
    global _exact_cases, _property_checks
    original = _deepcopy(rows)
    curvature, linear = _reference_quadratic(rows, l2)
    for trial in (_Q(-5, 3), _Q(0), _Q(7, 4)):
        actual = ridge_terms(rows, trial, l2)
        assert type(actual) is tuple and len(actual) == 3
        assert all(type(value) is _Q for value in actual)
        assert actual == _reference_terms(rows, trial, l2)
        score = prediction_loss(rows, trial)
        assert type(score) is _Q and score == actual[0]
        assert actual[2] == actual[0] + actual[1]
    if curvature == 0:
        assert linear == 0
        _reject(lambda: ridge_fit(rows, l2))
        assert ridge_terms(rows, -7, l2)[2] == ridge_terms(rows, 9, l2)[2]
    else:
        fit = ridge_fit(rows, l2)
        assert type(fit) is _Q
        assert fit == -linear / curvature
        assert abs(fit.numerator) <= 2 ** 20 and fit.denominator <= 2 ** 20
        # Independent normal equation: sum per-record residual gradients.
        residual_gradient = sum((_Q(x) * (fit * x - y) for x, y in rows),
                                _Q(0)) / len(rows) + _Q(l2) * fit
        assert residual_gradient == 0
        optimum = _reference_terms(rows, fit, l2)[2]
        for trial in (_Q(-5, 3), _Q(0), _Q(7, 4)):
            gap = ridge_terms(rows, trial, l2)[2] - ridge_terms(rows, fit, l2)[2]
            assert gap == curvature * (trial - fit) ** 2 / 2
            assert gap >= 0 and ridge_terms(rows, fit, l2)[2] == optimum
        assert ridge_fit(tuple(reversed(rows)), l2) == fit
        assert ridge_fit(tuple((-x, -y) for x, y in rows), l2) == fit
        assert ridge_fit(tuple((x, -y) for x, y in rows), l2) == -fit
        if len(rows) <= 16:
            assert ridge_fit(tuple(rows) * 2, l2) == fit
        _property_checks += 8
    assert rows == original
    _exact_cases += 1


# Complete ordered row spaces of lengths 1 and 2 over a declared small alphabet.
_points = tuple(_product((-1, 0, 1), repeat=2))
_lambdas = (0, _Q(1, 64), _Q(1, 2), 1, 3, 64)
for _n in (1, 2):
    for _rows in _product(_points, repeat=_n):
        for _lam in _lambdas:
            _check_case(_rows, _lam)

# Larger, non-symmetric records, exact boundaries and both accepted containers.
for _rows in (
    ((-16, 16),), ((16, -16),), ((0, 0),),
    ((-2, 5), (3, -7), (0, 4)),
    tuple(((-1) ** i * 16, 16 - i) for i in range(32)),
    tuple((0, i % 3 - 1) for i in range(32)),
    tuple((1, 0) for _ in range(32)),
):
    for _lam in _lambdas:
        _check_case(_rows, _lam)
        _check_case([list(row) for row in _rows], _lam)

# Hand-derived table, clean-data harm and scale/normalization references.
_fixed_train = ((-1, -4), (1, 4))
_clean = ((-1, -2), (1, 2))
for _lam, _slope, _terms, _score in (
    (0, _Q(4), (_Q(0), _Q(0), _Q(0)), _Q(2)),
    (1, _Q(2), (_Q(2), _Q(2), _Q(4)), _Q(0)),
    (3, _Q(1), (_Q(9, 2), _Q(3, 2), _Q(6)), _Q(1, 2)),
):
    assert ridge_fit(_fixed_train, _lam) == _slope
    assert ridge_terms(_fixed_train, _slope, _lam) == _terms
    assert prediction_loss(_clean, _slope) == _score
assert prediction_loss(_clean, ridge_fit(_clean, 0)) == 0
assert prediction_loss(_clean, ridge_fit(_clean, 1)) == _Q(1, 2)
for _a in (-3, -2, 2, 3):
    _scaled = tuple((_a * x, y) for x, y in _fixed_train)
    assert ridge_fit(_scaled, _a ** 2) == _Q(2, _a)
    for _w in (_Q(-2), _Q(0), _Q(3)):
        assert ridge_terms(_scaled, _w / _a, _a ** 2) == ridge_terms(
            _fixed_train, _w, 1)
assert ridge_fit(((-2, -4), (2, 4)), 1) == _Q(8, 5)
# Sum-objective matching checked as an independent polynomial identity.
for _rows in (_fixed_train, _fixed_train * 2):
    for _w in (_Q(-2, 3), _Q(0), _Q(2), _Q(7)):
        _alpha = len(_rows) * _Q(3, 2)
        _sklearn_objective = sum(((_w * x - y) ** 2 for x, y in _rows),
                                _Q(0)) + _alpha * _w ** 2
        assert _sklearn_objective == 2 * len(_rows) * ridge_terms(
            _rows, _w, _Q(3, 2))[2]

# Independently enumerate training noise, test X, and fresh test noise.
_noise = tuple(_product((-2, 2), repeat=2))
for _lam, _risk in ((0, _Q(1)), (_Q(1, 2), _Q(2, 3)),
                    (1, _Q(3, 4)), (3, _Q(19, 16))):
    _slopes = []
    _signal_total, _label_total = _Q(0), _Q(0)
    for _e1, _e2 in _noise:
        _rows = ((-1, -2 + _e1), (1, 2 + _e2))
        _slope = ridge_fit(_rows, _lam)
        _slopes.append(_slope)
        for _x in (-1, 1):
            _signal_total += (_slope * _x - 2 * _x) ** 2 / 2
            for _test_noise in (-2, 2):
                _label_total += (_slope * _x - (2 * _x + _test_noise)) ** 2 / 2
    _mean = sum(_slopes, _Q(0)) / 4
    _variance = sum(((value - _mean) ** 2 for value in _slopes), _Q(0)) / 4
    assert _mean == _Q(2) / (1 + _lam)
    assert _variance == _Q(2) / (1 + _lam) ** 2
    assert _signal_total / 8 == _risk
    assert _label_total / 16 == _risk + 2
    assert _risk == (4 * _lam ** 2 + 2) / (2 * (1 + _Q(_lam)) ** 2)

# Plain-GD equivalence is checked only for the stated unmodified update rule.
for _w, _g, _eta, _lam in _product(
    (_Q(-3), _Q(0), _Q(5, 2)),
    (_Q(-2), _Q(0), _Q(3)),
    (_Q(0), _Q(1, 4), _Q(2)),
    (_Q(0), _Q(1, 2), _Q(3)),
):
    assert _w - _eta * (_g + _lam * _w) == (1 - _eta * _lam) * _w - _eta * _g

# Accepted scalar boundaries, including reduced Fractions and evaluations at
# arbitrary slopes when the unpenalized all-zero-feature fit is non-unique.
for _lam in (0, 64, _Q(128, 2), _Q(1, 64), _Q(64, 63), _Q(63, 64)):
    for _w in (0, 2 ** 20, -(2 ** 20), _Q(1, 2 ** 20),
               _Q(-1, 2 ** 20), _Q(2 ** 20, 2 ** 20 - 1)):
        assert ridge_terms(((0, 16),), _w, _lam) == _reference_terms(
            ((0, 16),), _w, _lam)
        assert prediction_loss(((0, 16),), _w) == _Q(128)
assert ridge_fit(((0, 16),), _Q(1, 64)) == _Q(0)


class _IntSubclass(int):
    pass


class _FractionSubclass(_Q):
    pass


class _ListSubclass(list):
    pass


class _TupleSubclass(tuple):
    pass


class _NoCoercion:
    def __int__(self):
        raise AssertionError("unsupported objects must not be coerced")

    def __float__(self):
        raise AssertionError("unsupported objects must not be coerced")


_bad_rows = [
    None, 1, True, "1,2", {}, set(), [], (), iter(((1, 2),)),
    _ListSubclass([(1, 2)]), _TupleSubclass(((1, 2),)),
    [(1, 2)] * 33, [None], [1], [[]], [(1,)], [(1, 2, 3)],
    [{0: 1, 1: 2}], [iter((1, 2))], ["12"],
    [_ListSubclass([1, 2])], [_TupleSubclass((1, 2))],
]
for _bad in (True, False, 1.0, float("nan"), float("inf"), -17, 17,
             _Q(1), _IntSubclass(1), "1", None, _NoCoercion()):
    _bad_rows.extend([((_bad, 1),), ((1, _bad),), ((1, 1), (1, _bad))])
for _rows in _bad_rows:
    _reject(lambda rows=_rows: ridge_fit(rows, 1))
    _reject(lambda rows=_rows: ridge_terms(rows, 1, 1))
    _reject(lambda rows=_rows: prediction_loss(rows, 1))
for _lam in (True, False, 1.0, float("nan"), float("inf"), -1, 65,
             _Q(-1, 64), _Q(65, 64), _Q(1, 65), _Q(64, 65),
             _IntSubclass(1), _FractionSubclass(1, 2), "1", None,
             _NoCoercion(), 10 ** 100):
    _reject(lambda value=_lam: ridge_fit(((1, 2),), value))
    _reject(lambda value=_lam: ridge_terms(((1, 2),), 1, value))
for _w in (True, False, 1.0, float("nan"), float("inf"),
           2 ** 20 + 1, -(2 ** 20 + 1), _Q(1, 2 ** 20 + 1),
           _Q(2 ** 20 + 1, 2), _IntSubclass(1), _FractionSubclass(1, 2),
           "1", None, _NoCoercion(), 10 ** 100):
    _reject(lambda value=_w: ridge_terms(((1, 2),), value, 1))
    _reject(lambda value=_w: prediction_loss(((1, 2),), value))

print(f"regularization regression: {_exact_cases} exact cases; "
      f"{_property_checks} property groups; {_rejections} rejections passed")
