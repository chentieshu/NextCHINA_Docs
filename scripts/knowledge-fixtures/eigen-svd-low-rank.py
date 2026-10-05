# Append to the actual Markdown-extracted example. Standard library only.
# Independent author regression: no _svd_* helper is used as an oracle.
from decimal import Decimal, localcontext
from fractions import Fraction as _F


_audit_calls = 0
_rejections = 0
_certificates = 0


def _ref_transpose(matrix):
    return tuple(tuple(row[j] for row in matrix)
                 for j in range(len(matrix[0])))


def _ref_multiply(left, right):
    # A row/column dot-product implementation, separate from API entry().
    columns = _ref_transpose(right)
    return tuple(tuple(sum((x * y for x, y in zip(row, col)), _F(0))
                       for col in columns) for row in left)


def _ref_identity(size):
    return tuple(tuple(_F(i == j) for j in range(size))
                 for i in range(size))


def _ref_rank(matrix):
    # Exact Gauss-Jordan row elimination, not singular-value counting.
    work = [list(map(_F, row)) for row in matrix]
    pivot_row = 0
    for column in range(len(work[0])):
        pivot = next((i for i in range(pivot_row, len(work))
                      if work[i][column]), None)
        if pivot is None:
            continue
        work[pivot_row], work[pivot] = work[pivot], work[pivot_row]
        scale = work[pivot_row][column]
        work[pivot_row] = [x / scale for x in work[pivot_row]]
        for i in range(len(work)):
            if i != pivot_row:
                factor = work[i][column]
                work[i] = [x - factor * y
                           for x, y in zip(work[i], work[pivot_row])]
        pivot_row += 1
        if pivot_row == len(work):
            break
    return pivot_row


def _ref_basis(size, variant):
    basis = [list(row) for row in _ref_identity(size)]
    if variant == 3:
        return tuple(tuple(_F((-1 if i % 2 else 1)
                            if j == size - 1 - i else 0)
                           for j in range(size)) for i in range(size))
    if size > 1 and variant in (1, 2):
        c, s = ((_F(3, 5), _F(4, 5)) if variant == 1
                else (_F(5, 13), _F(12, 13)))
        a, b = (0, 1) if variant == 1 else (0, size - 1)
        basis[a][a], basis[a][b] = c, -s
        basis[b][a], basis[b][b] = s, c
    return tuple(tuple(row) for row in basis)


def _ref_certificate(m, n, singular, variant):
    q = min(m, n)
    left = _ref_basis(m, variant)
    right = _ref_basis(n, (variant + 1) % 4)
    u = tuple(row[:q] for row in left)
    v = tuple(row[:q] for row in right)
    vt = _ref_transpose(v)
    diagonal = tuple(tuple(_F(singular[i] if i == j else 0)
                           for j in range(q)) for i in range(q))
    matrix = _ref_multiply(_ref_multiply(u, diagonal), vt)
    return matrix, u, tuple(singular), vt


def _ref_verify(matrix, u, singular, vt, k):
    global _audit_calls
    _audit_calls += 1
    result = audit_svd(matrix, u, singular, vt, k)
    m, n, q = len(matrix), len(matrix[0]), len(singular)
    v = _ref_transpose(vt)
    ut = _ref_transpose(u)
    # Both singular-vector equations are checked directly.
    av = _ref_multiply(matrix, v)
    atu = _ref_multiply(_ref_transpose(matrix), u)
    assert av == tuple(tuple(u[i][j] * singular[j] for j in range(q))
                       for i in range(m))
    assert atu == tuple(tuple(v[i][j] * singular[j] for j in range(q))
                        for i in range(n))
    assert _ref_multiply(ut, u) == _ref_identity(q)
    assert _ref_multiply(vt, v) == _ref_identity(q)
    # Independent approximation oracle: project A onto retained output span.
    retained = tuple(tuple(row[i] if i < k else _F(0)
                           for i in range(q)) for row in u)
    projector = _ref_multiply(retained, _ref_transpose(retained))
    expected = _ref_multiply(projector, matrix)
    error = sum((_F(x - y) ** 2
                 for row, other in zip(matrix, expected)
                 for x, y in zip(row, other)), _F(0))
    tail = sum((_F(singular[i]) ** 2 for i in range(k, q)), _F(0))
    assert type(result) is dict
    assert set(result) == {"rank", "approximation",
                           "residual_squared", "tail_squared"}
    assert type(result["rank"]) is int
    assert result["rank"] == _ref_rank(matrix)
    assert result["approximation"] == expected
    assert type(result["approximation"]) is tuple
    assert all(type(row) is tuple and all(type(x) is _F for x in row)
               for row in result["approximation"])
    assert type(result["residual_squared"]) is _F
    assert type(result["tail_squared"]) is _F
    assert result["residual_squared"] == error
    assert result["tail_squared"] == tail == error
    assert _ref_rank(expected) <= k
    return result


for _m in range(1, 5):
    for _n in range(1, 5):
        _q = min(_m, _n)
        _patterns = (tuple(range(_q, 0, -1)), (2,) * _q,
                     (3,) + (0,) * (_q - 1), (0,) * _q)
        for _s in _patterns:
            for _variant in range(4):
                _a, _u, _s, _vt = _ref_certificate(_m, _n, _s, _variant)
                _certificates += 1
                for _k in range(_q + 1):
                    _ref_verify(_a, _u, _s, _vt, _k)
                # A^T swaps the left and right singular directions.
                _ref_verify(_ref_transpose(_a), _ref_transpose(_vt),
                            _s, _ref_transpose(_u), min(1, _q))

# Paired signs preserve all truncations. One-sided zero-mode signs also work.
_a, _u, _s, _vt = _ref_certificate(3, 2, (5, 0), 1)
for _index in range(2):
    _flipped_u = tuple(tuple(-x if j == _index else x
                             for j, x in enumerate(row)) for row in _u)
    _flipped_vt = tuple(tuple(-x if i == _index else x for x in row)
                       for i, row in enumerate(_vt))
    for _k in range(3):
        _ref_verify(_a, _flipped_u, _s, _flipped_vt, _k)
        if _s[_index] == 0:
            _ref_verify(_a, _flipped_u, _s, _vt, _k)
            _ref_verify(_a, _u, _s, _flipped_vt, _k)

# Repeated block rotations leave A unchanged, but a cut through a tie can vary.
_i2 = _ref_identity(2)
_r = _ref_basis(2, 1)
_base = _ref_verify(_i2, _i2, (1, 1), _i2, 1)
_rotated = _ref_verify(_i2, _r, (1, 1), _ref_transpose(_r), 1)
_swap = ((_F(0), _F(1)), (_F(1), _F(0)))
_other = _ref_verify(_i2, _swap, (1, 1), _swap, 1)
assert _base["approximation"] != _rotated["approximation"]
assert _base["approximation"] != _other["approximation"]
assert _base["residual_squared"] == _rotated["residual_squared"] == 1

# Exact inclusive scalar boundaries: int, Fraction numerator, denominator.
_limit = 2**20
for _value in (_limit, _F(_limit), _F(1, _limit), 0):
    _ref_verify(((_value,),), ((1,),), (_value,), ((1,),), 0)
    _ref_verify(((-_value,),), ((-1,),), (_value,), ((1,),), 1)


def _must_reject(arguments):
    global _rejections
    try:
        audit_svd(*arguments)
    except ValueError:
        _rejections += 1
    else:
        raise AssertionError("invalid input was accepted")


class _IntSubclass(int):
    pass


class _FractionSubclass(_F):
    pass


class _ListSubclass(list):
    pass


class _TupleSubclass(tuple):
    pass


_good = [[[1, 0], [0, 1]], [[1, 0], [0, 1]],
         [1, 1], [[1, 0], [0, 1]], 1]


def _copy_good():
    return [[row[:] for row in _good[0]],
            [row[:] for row in _good[1]], _good[2][:],
            [row[:] for row in _good[3]], _good[4]]


_bad_scalars = (True, False, _IntSubclass(1), _FractionSubclass(1),
                1.0, float("nan"), float("inf"), Decimal(1), "1", None,
                1 + 0j, _limit + 1, -_limit - 1,
                _F(_limit + 1, 2), _F(1, _limit + 1))
for _bad in _bad_scalars:
    for _slot in (0, 1, 2, 3):
        _args = _copy_good()
        if _slot == 2:
            _args[_slot][0] = _bad
        else:
            _args[_slot][0][0] = _bad
        _must_reject(_args)

# Exact container policy, including rows and singular-value containers.
for _slot in (0, 1, 2, 3):
    for _kind in (None, "matrix", {}, 1, iter([1]),
                  _ListSubclass([1]), _TupleSubclass([1])):
        _args = _copy_good()
        _args[_slot] = _kind
        _must_reject(_args)
for _slot in (0, 1, 3):
    for _row in (None, 1, "10", iter([1, 0]),
                 _ListSubclass([1, 0]), _TupleSubclass([1, 0])):
        _args = _copy_good()
        _args[_slot][0] = _row
        _must_reject(_args)

for _bad_k in (True, False, _IntSubclass(1), _F(1), 1.0, "1",
                -1, 3, None, _limit):
    _args = _copy_good()
    _args[4] = _bad_k
    _must_reject(_args)

for _slot in (0, 1, 3):
    for _shape in ([], [[]], [[1, 0], [1]], [[1]],
                   [[1, 0]] * 5, [[1] * 5]):
        _args = _copy_good()
        _args[_slot] = _shape
        _must_reject(_args)
for _bad_s in ([], [1], [1, 1, 0], [-1, 0], [0, 1]):
    _args = _copy_good()
    _args[2] = _bad_s
    _must_reject(_args)

# Exact certificate rejection, not tolerant normalization/reconstruction.
for _slot, _i, _j, _value in ((0, 0, 1, _F(1, _limit)),
                             (1, 0, 1, _F(1, _limit)),
                             (3, 0, 1, _F(1, _limit)),
                             (1, 0, 0, -1), (3, 0, 0, -1),
                             (1, 0, 0, 0), (3, 0, 0, 2)):
    _args = _copy_good()
    _args[_slot][_i][_j] = _value
    _must_reject(_args)
_args = _copy_good()
_args[2] = [2, 1]
_must_reject(_args)

# True rectangular full U and full V violate this thin-only API.
_tall, _tu, _ts, _tvt = _ref_certificate(3, 2, (2, 1), 0)
_must_reject([_tall, _ref_identity(3), _ts, _tvt, 1])
_wide, _wu, _ws, _wvt = _ref_certificate(2, 3, (2, 1), 0)
_must_reject([_wide, _wu, _ws, _ref_identity(3), 1])
# Square full and thin coincide; valid dimensions are accepted.
_ref_verify(_i2, _i2, (1, 1), _i2, 2)
# Rank-compact is not thin for a rank-deficient 2x2.
_must_reject([[[1, 0], [0, 0]], [[1], [0]], [1], [[1, 0]], 1])

# Valid mutable inputs remain untouched; outputs do not alias those inputs.
_args = _copy_good()
_saved = _copy_good()
_result = audit_svd(*_args)
assert _args == _saved
_args[0][0][0] = 7
assert _result["approximation"] == ((_F(1), _F(0)), (_F(0), _F(0)))

# Separate radical arithmetic check, explicitly outside rational API coverage.
with localcontext() as _context:
    _context.prec = 70
    _phi = (Decimal(1) + Decimal(5).sqrt()) / 2
    _d = (1 + _phi * _phi).sqrt()
    _vs = ((1 / _d, _phi / _d), (-_phi / _d, 1 / _d))
    _us = ((_phi / _d, 1 / _d), (-1 / _d, _phi / _d))
    _ss = (_phi, 1 / _phi)
    _tol = Decimal("1e-65")
    for _idx in range(2):
        _v, _u, _sigma = _vs[_idx], _us[_idx], _ss[_idx]
        assert abs(sum(x * x for x in _v) - 1) < _tol
        assert abs(sum(x * x for x in _u) - 1) < _tol
        assert abs(_v[0] + _v[1] - _sigma * _u[0]) < _tol
        assert abs(_v[1] - _sigma * _u[1]) < _tol
        assert abs(_u[0] - _sigma * _v[0]) < _tol
        assert abs(_u[0] + _u[1] - _sigma * _v[1]) < _tol
    assert abs(sum(x * y for x, y in zip(*_vs))) < _tol
    assert abs(sum(x * y for x, y in zip(*_us))) < _tol
    _j_expected = ((Decimal(1), Decimal(1)), (Decimal(0), Decimal(1)))
    for _i in range(2):
        for _j in range(2):
            _entry = sum(_ss[t] * _us[t][_i] * _vs[t][_j]
                         for t in range(2))
            assert abs(_entry - _j_expected[_i][_j]) < _tol

print("author suffix:", _certificates, "base certificates,", _audit_calls,
      "oracle-checked calls,", _rejections, "ValueError rejections")
print("radical J: Decimal precision 70, tolerance 1e-65; not rational API")
