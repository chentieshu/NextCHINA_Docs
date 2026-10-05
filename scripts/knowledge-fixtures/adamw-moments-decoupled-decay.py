
# Author regression suffix: append to the extracted article block, never import it.
# Independent mathematical forms are used here; this is not independent review.
from decimal import Decimal as _AWDecimal, localcontext as _aw_localcontext
from fractions import Fraction as _AWFraction
from itertools import product as _aw_product
import copy as _aw_copy
import sys as _aw_sys

_aw_counts = {"rational_steps": 0, "weighted_sum_tapes": 0,
              "decimal_tapes": 0, "property_tapes": 0, "rejections": 0}
_aw_max_decimal_abs_error = 0.0


def _aw_close(actual, expected, *, rel=5e-13, absolute=2e-13):
    assert type(actual) is float and math.isfinite(actual), actual
    target = float(expected)
    assert math.isclose(actual, target, rel_tol=rel, abs_tol=absolute), (
        actual, target, actual - target)


def _aw_vector_close(actual, expected, **tolerances):
    assert type(actual) is tuple and len(actual) == len(expected)
    for a, b in zip(actual, expected):
        _aw_close(a, b, **tolerances)


def _aw_shape(trace, width, length):
    assert type(trace) is tuple and len(trace) == length
    for index, row in enumerate(trace, 1):
        assert type(row) is AdamStep
        assert row._fields == ("t", "weights", "m", "v", "mhat", "vhat")
        assert type(row.t) is int and row.t == index
        for vector in row[1:]:
            assert type(vector) is tuple and len(vector) == width
            assert all(type(x) is float and math.isfinite(x) for x in vector)
        assert all(x >= 0 for x in row.v + row.vhat)


_aw_base = dict(lr=0.1, coefficient=0.2, beta1=0.5, beta2=0.5, eps=1.0)
_aw_fixtures = (
    ((2, -1), ((2, -4), (-2, 4)), "adamw", (
        (( _AWFraction(142, 75), _AWFraction(-9, 10)),
         (1, -2), (2, 8), (2, -4), (4, 16)),
        ((_AWFraction(10562, 5625), _AWFraction(-1363, 1500)),
         (_AWFraction(-1, 2), 1), (3, 12),
         (_AWFraction(-2, 3), _AWFraction(4, 3)), (4, 16)))),
    ((2, -1), ((0, 0),), "adamw", (
        ((_AWFraction(49, 25), _AWFraction(-49, 50)),
         (0, 0), (0, 0), (0, 0), (0, 0)),)),
    ((2, -1), ((0, 0),), "adam-l2", (
        ((_AWFraction(69, 35), _AWFraction(-59, 60)),
         (_AWFraction(1, 5), _AWFraction(-1, 10)),
         (_AWFraction(2, 25), _AWFraction(1, 50)),
         (_AWFraction(2, 5), _AWFraction(-1, 5)),
         (_AWFraction(4, 25), _AWFraction(1, 25))),)),
)
for _aw_initial, _aw_tape, _aw_mode, _aw_expected in _aw_fixtures:
    _aw_trace = adam_trace(_aw_initial, _aw_tape, mode=_aw_mode, **_aw_base)
    _aw_shape(_aw_trace, len(_aw_initial), len(_aw_tape))
    for _aw_actual, _aw_ref in zip(_aw_trace, _aw_expected):
        for _aw_field, _aw_ref_field in zip(_aw_actual[1:], _aw_ref):
            _aw_vector_close(_aw_field, _aw_ref_field, rel=2e-15, absolute=2e-15)
        _aw_counts["rational_steps"] += 1

# Enumerate exact rational direct weighted sums rather than rerun the recurrence.
for _aw_scalars in _aw_product((-3, -1, 0, 2), repeat=3):
    _aw_tape = tuple((x, 2 - x) for x in _aw_scalars)
    for _aw_b1, _aw_b2 in ((0, 0), (0.5, 0.75), (0.9, 0.99)):
        _aw_trace = adam_trace((1, -2), _aw_tape, mode="adamw",
                              lr=0.125, coefficient=0.25,
                              beta1=_aw_b1, beta2=_aw_b2, eps=0.5)
        _aw_shape(_aw_trace, 2, 3)
        _aw_B1, _aw_B2 = _AWFraction(_aw_b1), _AWFraction(_aw_b2)
        for _aw_row in _aw_trace:
            _aw_t = _aw_row.t
            for _aw_j in range(2):
                _aw_m = (1 - _aw_B1) * sum(
                    (_aw_B1**(_aw_t - 1 - i) * _aw_tape[i][_aw_j]
                     for i in range(_aw_t)), _AWFraction(0))
                _aw_v = (1 - _aw_B2) * sum(
                    (_aw_B2**(_aw_t - 1 - i) * _aw_tape[i][_aw_j]**2
                     for i in range(_aw_t)), _AWFraction(0))
                _aw_close(_aw_row.m[_aw_j], _aw_m)
                _aw_close(_aw_row.v[_aw_j], _aw_v)
                _aw_close(_aw_row.mhat[_aw_j], _aw_m / (1 - _aw_B1**_aw_t))
                _aw_close(_aw_row.vhat[_aw_j], _aw_v / (1 - _aw_B2**_aw_t))
        _aw_counts["weighted_sum_tapes"] += 1


def _aw_decimal_reference(initial, tape, *, lr, coefficient, beta1, beta2,
                          eps, mode):
    """80-digit direct-history reference, with its own parameter trajectory."""
    with _aw_localcontext() as context:
        context.prec = 80
        D = _AWDecimal
        convert = lambda x: D.from_float(float(x))
        w = tuple(convert(x) for x in initial)
        rate, c, b1, b2, epsilon = map(convert, (lr, coefficient, beta1, beta2, eps))
        history, answer = [], []
        for t, raw in enumerate(tape, 1):
            h = tuple(convert(g) + (c * x if mode == "adam-l2" else D(0))
                      for g, x in zip(raw, w))
            history.append(h)
            # D(0)**0 is undefined in Decimal; the finite weight for lag 0 is 1.
            first_weights = [D(1) if lag == 0 else b1**lag for lag in range(t)]
            second_weights = [D(1) if lag == 0 else b2**lag for lag in range(t)]
            ms, vs, mh, vh = [], [], [], []
            for j in range(len(w)):
                m = (1 - b1) * sum((first_weights[t - 1 - i] * history[i][j]
                                   for i in range(t)), D(0))
                v = (1 - b2) * sum((second_weights[t - 1 - i] * history[i][j]**2
                                   for i in range(t)), D(0))
                ms.append(m)
                vs.append(v)
                mh.append(m / (1 - b1**t))
                vh.append(v / (1 - b2**t))
            factor = 1 - rate * c if mode == "adamw" else D(1)
            w = tuple(factor * x - rate * a / (b.sqrt() + epsilon)
                      for x, a, b in zip(w, mh, vh))
            answer.append((w, tuple(ms), tuple(vs), tuple(mh), tuple(vh)))
        return tuple(answer)

# Exactly 96 tapes, at most 6 steps and 2 coordinates. No random or unbounded family.
for _aw_case in range(48):
    _aw_d, _aw_T = 1 + _aw_case % 2, 1 + (_aw_case // 2) % 6
    _aw_initial = tuple(((-1)**j) * (1 + (_aw_case + j) % 3) / 2
                        for j in range(_aw_d))
    _aw_tape = tuple(tuple((((_aw_case + 3*t + 2*j) % 11) - 5) / 4
                           for j in range(_aw_d)) for t in range(_aw_T))
    _aw_options = dict(
        lr=(0, 0.03125, 0.1, 0.2)[_aw_case % 4],
        coefficient=(0, 0.125, 0.3)[_aw_case % 3],
        beta1=(0, 0.5, 0.9)[_aw_case % 3],
        beta2=(0.75, 0.99, 0.25)[_aw_case % 3],
        eps=(0.01, 0.125, 1)[(_aw_case // 3) % 3])
    for _aw_mode in ("adamw", "adam-l2"):
        _aw_trace = adam_trace(_aw_initial, _aw_tape, mode=_aw_mode, **_aw_options)
        _aw_reference = _aw_decimal_reference(
            _aw_initial, _aw_tape, mode=_aw_mode, **_aw_options)
        _aw_shape(_aw_trace, _aw_d, _aw_T)
        for _aw_row, _aw_ref in zip(_aw_trace, _aw_reference):
            for _aw_field, _aw_ref_field in zip(_aw_row[1:], _aw_ref):
                _aw_vector_close(_aw_field, _aw_ref_field)
                for _aw_a, _aw_b in zip(_aw_field, _aw_ref_field):
                    _aw_max_decimal_abs_error = max(
                        _aw_max_decimal_abs_error, abs(_aw_a - float(_aw_b)))
        _aw_counts["decimal_tapes"] += 1

# Constant-tape bias correction and second raw moment, not centered variance.
for _aw_b1, _aw_b2 in ((0, 0), (0.5, 0.75), (0.9, 0.99)):
    _aw_trace = adam_trace((1, 2, 3), ((2, -3, 0),) * 32, mode="adamw",
                          lr=0, coefficient=0.2, beta1=_aw_b1, beta2=_aw_b2, eps=1)
    for _aw_row in _aw_trace:
        assert _aw_row.weights == (1, 2, 3)
        _aw_vector_close(_aw_row.mhat, (2, -3, 0))
        _aw_vector_close(_aw_row.vhat, (4, 9, 0))
    assert _aw_trace[-1].m != (0, 0, 0)
    _aw_counts["property_tapes"] += 1

_aw_history = adam_trace((2, -1), ((2, -4), (0, 0)), mode="adamw", **_aw_base)
_aw_vector_close(_aw_history[1].m, (_AWFraction(1, 2), -1))
_aw_vector_close(_aw_history[1].v, (1, 4))
_aw_vector_close(_aw_history[1].mhat, (_AWFraction(2, 3), _AWFraction(-4, 3)))
_aw_vector_close(_aw_history[1].vhat, (_AWFraction(4, 3), _AWFraction(16, 3)))
assert _aw_history[1].weights != tuple(0.98 * x for x in _aw_history[0].weights)
_aw_counts["property_tapes"] += 1

# Cold all-zero tape: exact dyadic shrink factors include sign changes/expansion.
for _aw_product_value in (0, 0.5, 1, 1.5, 2, 2.5):
    _aw_trace = adam_trace((2, -1), ((0, 0),) * 6, mode="adamw",
                          lr=0.5, coefficient=2*_aw_product_value,
                          beta1=0.5, beta2=0.75, eps=1)
    for _aw_row in _aw_trace:
        _aw_factor = _AWFraction(1) - _AWFraction(_aw_product_value)
        assert _aw_row.weights == tuple(float(_AWFraction(x) * _aw_factor**_aw_row.t)
                                        for x in (2, -1))
        assert _aw_row.m == _aw_row.v == _aw_row.mhat == _aw_row.vhat == (0, 0)
    _aw_counts["property_tapes"] += 1

# Coordinate permutations and simultaneous sign reversal, independently per mode.
_aw_initial = (2, -1, 0.25)
_aw_tape = ((1, -3, 2), (0, 2, -1), (-4, 1, 0))
_aw_order = (2, 0, 1)
for _aw_mode in ("adamw", "adam-l2"):
    _aw_trace = adam_trace(_aw_initial, _aw_tape, mode=_aw_mode, **_aw_base)
    _aw_perm = adam_trace(tuple(_aw_initial[i] for i in _aw_order),
        tuple(tuple(row[i] for i in _aw_order) for row in _aw_tape),
        mode=_aw_mode, **_aw_base)
    _aw_neg = adam_trace(tuple(-x for x in _aw_initial),
        tuple(tuple(-x for x in row) for row in _aw_tape),
        mode=_aw_mode, **_aw_base)
    for _aw_row, _aw_p, _aw_n in zip(_aw_trace, _aw_perm, _aw_neg):
        for _aw_field in ("weights", "m", "v", "mhat", "vhat"):
            assert getattr(_aw_p, _aw_field) == tuple(
                getattr(_aw_row, _aw_field)[i] for i in _aw_order)
            _aw_sign = 1 if _aw_field in ("v", "vhat") else -1
            assert getattr(_aw_n, _aw_field) == tuple(
                _aw_sign*x for x in getattr(_aw_row, _aw_field))
    _aw_counts["property_tapes"] += 3

for _aw_b1, _aw_b2 in ((0, 0), (0.5, 0.75), (0.9, 0.99)):
    _aw_opts = dict(_aw_base, coefficient=0, beta1=_aw_b1, beta2=_aw_b2)
    assert adam_trace(_aw_initial, _aw_tape, mode="adamw", **_aw_opts) == (
        adam_trace(_aw_initial, _aw_tape, mode="adam-l2", **_aw_opts))
    _aw_counts["property_tapes"] += 2

# Epsilon location and absence of exact nonzero-epsilon gradient-scale invariance.
_aw_unit_options = dict(lr=1, coefficient=0, beta1=0, beta2=0, eps=1, mode="adamw")
_aw_one = adam_trace((0,), ((1,),), **_aw_unit_options)[0]
_aw_two = adam_trace((0,), ((2,),), **_aw_unit_options)[0]
assert _aw_one.weights == (-0.5,)
_aw_vector_close(_aw_two.weights, (_AWFraction(-2, 3),))
assert not math.isclose(_aw_two.weights[0], -2 / math.sqrt(5), rel_tol=1e-3)
assert _aw_one.weights != _aw_two.weights
_aw_counts["property_tapes"] += 2
_aw_growth = adam_trace((1,), ((-1,),), lr=0.1, coefficient=0.2,
                       beta1=0, beta2=0, eps=1, mode="adamw")[0]
_aw_vector_close(_aw_growth.weights, (_AWFraction(103, 100),))
_aw_counts["property_tapes"] += 1

# Full width/time boundary, both input container types, no aliases or mutation.
_aw_mutable_initial = [1, -2, 3, -4, 0, 0.5, -0.25, 2]
_aw_mutable_tape = [[(i + j) % 5 - 2 for j in range(8)] for i in range(32)]
_aw_before = _aw_copy.deepcopy((_aw_mutable_initial, _aw_mutable_tape))
_aw_trace = adam_trace(_aw_mutable_initial, _aw_mutable_tape,
                      mode="adamw", **_aw_base)
_aw_shape(_aw_trace, 8, 32)
assert (_aw_mutable_initial, _aw_mutable_tape) == _aw_before
_aw_saved = _aw_copy.deepcopy(_aw_trace)
_aw_mutable_initial[0] = 999
_aw_mutable_tape[0][0] = 999
assert _aw_trace == _aw_saved
for _aw_action in (
    lambda: setattr(_aw_trace[0], "t", 7),
    lambda: _aw_trace[0].weights.__setitem__(0, 7),
    lambda: _aw_trace.__setitem__(0, None),
):
    try:
        _aw_action()
    except (AttributeError, TypeError):
        pass
    else:
        raise AssertionError("Mutable output escaped")
_aw_counts["property_tapes"] += 1

# Finite underflow is accepted, not silently repaired or advertised as accurate.
_aw_tiny = math.ulp(0.0)
_aw_underflow = adam_trace((0,), ((_aw_tiny,),), lr=0, coefficient=0,
                          beta1=0, beta2=0, eps=1, mode="adamw")[0]
assert _aw_underflow.mhat == (_aw_tiny,) and _aw_underflow.vhat == (0.0,)
assert _aw_underflow.weights == (0.0,)
_aw_counts["property_tapes"] += 1


class _AWInt(int):
    pass


class _AWFloat(float):
    pass


class _AWList(list):
    pass


class _AWTuple(tuple):
    pass


class _AWStr(str):
    pass


class _AWConvertible:
    def __float__(self):
        raise AssertionError("Implicit conversion must not be called")


def _aw_reject(initial=(1,), tape=((1,),), **overrides):
    options = dict(_aw_base, mode="adamw")
    options.update(overrides)
    before = repr((initial, tape)) if type(initial) in (list, tuple) and type(tape) in (list, tuple) else None
    try:
        adam_trace(initial, tape, **options)
    except ValueError:
        _aw_counts["rejections"] += 1
    else:
        raise AssertionError("Invalid case accepted")
    # NaN is unequal to itself; use repr only for the mutation audit, not numeric truth.
    if before is not None:
        assert repr((initial, tape)) == before


_aw_bad_numbers = (True, False, "1", None, 1+0j, _AWFraction(1),
                   _AWDecimal(1), _AWInt(1), _AWFloat(1), _AWConvertible(),
                   math.nan, math.inf, -math.inf, 10**1000)
for _aw_bad in _aw_bad_numbers:
    _aw_reject(initial=(_aw_bad,))
    _aw_reject(tape=((_aw_bad,),))
    for _aw_name in ("lr", "coefficient", "beta1", "beta2", "eps"):
        _aw_reject(**{_aw_name: _aw_bad})
for _aw_name, _aw_values in (
    ("lr", (-1, -0.01)), ("coefficient", (-1, -0.01)),
    ("beta1", (-0.1, 1, 2)), ("beta2", (-0.1, 1, 2)),
    ("eps", (0, -1)),
):
    for _aw_bad in _aw_values:
        _aw_reject(**{_aw_name: _aw_bad})
for _aw_bad in ("AdamW", "adam", "", None, True, 1, _AWStr("adamw")):
    _aw_reject(mode=_aw_bad)
for _aw_bad in ((), [], (1,)*9, "1", None, 1, {1}, {0:1},
                iter([1]), _AWList([1]), _AWTuple((1,))):
    _aw_reject(initial=_aw_bad)
for _aw_bad in ((), [], ((1,),)*33, "1", None, 1, {1}, {0:(1,)},
                iter([(1,)]), _AWList([(1,)]), _AWTuple(((1,),))):
    _aw_reject(tape=_aw_bad)
for _aw_bad_row in ((), [], (1,2), (1,)*9, "1", None, 1, {1},
                    iter([1]), _AWList([1]), _AWTuple((1,))):
    _aw_reject(tape=((1,), _aw_bad_row))
_aw_reject(initial=(1, 2), tape=((1, 2), (1,)))
_aw_reject(tape=((1,), (True,)))

# Finite inputs, nonfinite evaluated arithmetic: reject even with lr=0.
_aw_reject(tape=((1e200,),))                         # gradient square
_aw_reject(tape=((1e200,),), lr=0)                   # state still calculated
_aw_reject(lr=1e308, coefficient=1e308)              # decay product
_aw_reject(initial=(1e308,), tape=((0,),), lr=1, coefficient=3) # factor*w
_aw_reject(initial=(1e308,), coefficient=2, mode="adam-l2")  # penalty product
_aw_reject(initial=(1e308,), tape=((1e308,),), coefficient=1,
           mode="adam-l2")                         # effective-gradient sum
_aw_reject(initial=(0,), tape=((1e-170,),), beta1=0, beta2=0,
           eps=_aw_tiny, lr=1e308, coefficient=0)    # rate*adaptive
_aw_reject(initial=(-1e308,), tape=((1,),), beta1=0, beta2=0,
           eps=_aw_tiny, lr=1e308, coefficient=0)    # final subtraction

# History survives while beta2=0 discards the second moment: ratio overflows.
_aw_reject(initial=(0,), tape=((1e154,), (0,)), lr=0, coefficient=0,
           beta1=0.5, beta2=0, eps=5e-324)

assert _aw_counts["rational_steps"] == 4
assert _aw_counts["weighted_sum_tapes"] == 192
assert _aw_counts["decimal_tapes"] == 96
assert _aw_counts["property_tapes"] == 27
assert _aw_counts["rejections"] == 161
print("AdamW author regression:", _aw_counts)
print("Decimal maximum absolute error:", _aw_max_decimal_abs_error)
