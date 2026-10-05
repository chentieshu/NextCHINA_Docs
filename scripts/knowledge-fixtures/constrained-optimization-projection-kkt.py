# Author regression suffix: append to the actual extracted Markdown code block.
# The reference enumerates line segments; it does not reuse project or loss.
from fractions import Fraction as _F
from itertools import product as _product


def _objective(point, target):
    return sum(((_F(p) - _F(t)) ** 2 for p, t in zip(point, target)),
               _F(0)) / 2


def _on_segment(left, right, target):
    # Minimize the independently parameterized quadratic left+s*(right-left).
    direction = tuple(_F(q) - _F(p) for p, q in zip(left, right))
    curvature = sum((d * d for d in direction), _F(0))
    if curvature == 0:
        return tuple(map(_F, left))
    derivative = sum(((_F(p) - _F(t)) * d
                      for p, t, d in zip(left, target, direction)), _F(0))
    s = min(_F(1), max(_F(0), -derivative / curvature))
    return tuple(_F(p) + s * d for p, d in zip(left, direction))


def _face_oracle(target, budget):
    origin, x_vertex, y_vertex = (_F(0), _F(0)), (budget, _F(0)), (_F(0), budget)
    candidates = [_on_segment(left, right, target) for left, right in (
        (origin, x_vertex), (origin, y_vertex), (x_vertex, y_vertex))]
    if min(target) >= 0 and sum(target) <= budget:
        candidates.append(tuple(map(_F, target)))
    return min(candidates, key=lambda p: _objective(p, target))


_identity_checks = 0
_case_checks = 0


def _check(target, budget):
    global _identity_checks, _case_checks
    original = list(target)
    point, multipliers = project(target, budget)
    assert list(target) == original
    assert type(point) is tuple and len(point) == 2
    assert type(multipliers) is tuple and len(multipliers) == 3
    assert all(type(v) is _F for v in point + multipliers)
    x, y = point
    lam, alpha, beta = multipliers
    a, b = map(_F, target)
    assert x >= 0 and y >= 0 and x + y <= budget
    assert min(multipliers) >= 0
    assert (x - a + lam - alpha, y - b + lam - beta) == (0, 0)
    assert (lam * (x + y - budget), alpha * x, beta * y) == (0, 0, 0)
    oracle = _face_oracle((a, b), budget)
    assert point == oracle
    assert loss(point, target) == _objective(oracle, (a, b))
    assert type(loss(point, target)) is _F
    assert project(point, budget)[0] == point
    assert loss(point, point) == 0
    swapped_point, swapped_multipliers = project((b, a), budget)
    assert swapped_point == (y, x)
    assert swapped_multipliers == (lam, beta, alpha)
    for z in ((_F(0), _F(0)), (budget, _F(0)), (_F(0), budget),
              (budget / 2, budget / 2), (budget / 3, budget / 4),
              (budget / 7, 2 * budget / 7)):
        # Direct residual squares on the left, the certificate identity on right.
        gap = _objective(z, (a, b)) - _objective(point, (a, b))
        distance_term = _objective(z, point)
        rhs = distance_term + lam * (budget - sum(z)) + alpha * z[0] + beta * z[1]
        assert gap == rhs and gap >= 0
        assert gap == 0 if z == point else gap > 0
        _identity_checks += 1
    _case_checks += 1


for _a, _b, _budget in _product(
        tuple(_F(i, 2) for i in range(-6, 7)),
        tuple(_F(i, 2) for i in range(-6, 7)),
        tuple(_F(i, 2) for i in range(13))):
    _check((_a, _b), _budget)
assert _case_checks == 2197

# Non-half rationals, inactive/active ties, negative targets and list support.
for _target, _budget in (
    ((-_F(7, 3), _F(23, 7)), _F(2, 5)),
    ((_F(5, 7), -_F(11, 3)), _F(4, 9)),
    ((-_F(1, 3), -_F(1, 7)), _F(0)),
    ((_F(1, 3), _F(2, 3)), _F(1)),
    ((_F(10**8 + 1, 7), _F(2, 11)), _F(13, 17)),
    ([2, -3], _F(1)),
):
    _check(_target, _budget)

# Hand-worked main table: exact points, objectives and chosen certificates.
for _budget, _point_expected, _value, _cert in (
    (6, (3, 2), 0, (0, 0, 0)),
    (5, (3, 2), 0, (0, 0, 0)),
    (3, (2, 1), 1, (1, 0, 0)),
    (1, (1, 0), 4, (2, 0, 0)),
    (_F(1, 2), (_F(1, 2), 0), _F(41, 8), (_F(5, 2), 0, _F(1, 2))),
    (0, (0, 0), _F(13, 2), (3, 0, 1)),
):
    _point_actual, _cert_actual = project((3, 2), _budget)
    assert _point_actual == _point_expected and _cert_actual == _cert
    assert loss(_point_actual, (3, 2)) == _value
assert loss((_F(9, 5), _F(6, 5)), (3, 2)) == _F(26, 25)
assert loss((_F(9, 5), _F(6, 5)), (3, 2)) > loss((2, 1), (3, 2))
assert project((-1, 4), 2) == ((_F(0), _F(2)), (_F(2), _F(3), _F(0)))
assert loss((0, 2), (-1, 4)) == _F(5, 2)
assert loss((0, 3), (3, 2)) - loss((2, 1), (3, 2)) == 4
assert loss((1, 1), (3, 2)) - loss((2, 1), (3, 2)) == _F(3, 2)

# At B=0 the primal is unique, while every lambda>=3 gives a certificate.
for _lam in (_F(3), _F(7, 2), _F(4), _F(100)):
    _alpha, _beta = _lam - 3, _lam - 2
    assert min((_lam, _alpha, _beta)) >= 0
    assert (-3 + _lam - _alpha, -2 + _lam - _beta) == (0, 0)

# eta=1 is algebraic cancellation for this objective, with arbitrary starts.
for _start in ((0, 0), (2, 1), (-7, 11), (_F(1, 4), _F(1, 2))):
    _gradient = tuple(_F(w) - t for w, t in zip(_start, (3, 2)))
    _before = tuple(_F(w) - g for w, g in zip(_start, _gradient))
    assert _before == (3, 2) and project(_before, 3)[0] == (2, 1)
# Doubling the objective changes the cancellation step size to 1/2.
assert tuple(2 * _F(t) - w for w, t in zip((0, 0), (3, 2))) != (3, 2)

# A second linear-system derivation of the fixed squared-penalty solution.
_penalty_checks = 0
for _rho in (_F(0), _F(1, 2), _F(1), _F(2), _F(100), _F(199, 2), _F(3, 7)):
    _x, _y = penalty_fixed(_rho)
    assert type(_x) is _F and type(_y) is _F
    _diagonal, _off = 1 + _rho, _rho
    _rhs_x, _rhs_y = 3 + 3 * _rho, 2 + 3 * _rho
    _det = _diagonal**2 - _off**2
    _oracle_x = (_diagonal * _rhs_x - _off * _rhs_y) / _det
    _oracle_y = (_diagonal * _rhs_y - _off * _rhs_x) / _det
    assert (_x, _y) == (_oracle_x, _oracle_y)
    _violation = _x + _y - 3
    assert min((_x, _y, _violation)) > 0
    assert _violation == _F(2) / (1 + 2 * _rho)
    assert (_x - 3 + _rho * _violation, _y - 2 + _rho * _violation) == (0, 0)
    _penalty_checks += 1
assert sum(penalty_fixed(_F(199, 2))) - 3 == _F(1, 100)
assert sum(penalty_fixed(99)) - 3 > _F(1, 100)

# Reject exactly the documented unsupported shapes/types and negative scalars.
_rejections = 0


def _reject(exception, function, *args):
    global _rejections
    try:
        function(*args)
    except exception:
        _rejections += 1
    else:
        raise AssertionError(f"expected {exception.__name__}: {function.__name__}")


for _function, _args in (
    (project, ((True, 2), 3)), (project, ((3, 2), 3.0)),
    (project, ((3, 2), False)), (project, ((3, '2'), 3)),
    (loss, ((1.0, 2), (3, 2))), (loss, ((1, 2), (3, None))),
    (penalty_fixed, ('1',)), (penalty_fixed, (True,)),
    (penalty_fixed, (_F(1, 2) + 0j,)),
    (project, ({0: 3, 1: 2}, 3)), (project, (iter((3, 2)), 3)),
    (loss, ({1, 2}, (3, 2))), (loss, ((1, 2), '32')),
):
    _reject(TypeError, _function, *_args)
for _bad_shape in ((), (1,), [1, 2, 3]):
    _reject(ValueError, project, _bad_shape, 3)
    _reject(ValueError, loss, (1, 2), _bad_shape)
for _budget in (-1, -_F(1, 10)):
    _reject(ValueError, project, (3, 2), _budget)
    _reject(ValueError, penalty_fixed, _budget)


class _IntSubclass(int):
    pass


class _FractionSubclass(_F):
    pass


class _ListSubclass(list):
    pass


_reject(TypeError, project, (_IntSubclass(3), 2), 3)
_reject(TypeError, loss, (_FractionSubclass(1, 2), 2), (3, 2))
_reject(TypeError, project, _ListSubclass((3, 2)), 3)
assert loss([1, 2], [3, 2]) == 2
assert project([3, 2], _F(3)) == project((3, 2), 3)
print(f"author regression passed: {_case_checks} projection cases; "
      f"{_identity_checks} certificate identities; {_penalty_checks} penalty cases; "
      f"{_rejections} documented rejections")
