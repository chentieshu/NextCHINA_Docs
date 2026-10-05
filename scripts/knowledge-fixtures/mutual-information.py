# Independent regression suffix for the extracted mutual-information example.
# Deliberately uses high-precision entropy identities, not the direct log-ratio loop.
from decimal import Decimal, localcontext
from functools import lru_cache
from itertools import product
from random import Random


def _run_mi_regressions():
    checked = 0
    rejected = 0
    maximum_error = Decimal(0)
    expected_keys = {
        "joint", "px", "py", "h_x_bits", "h_x_given_y_bits",
        "h_x_given_each_y_bits", "mi_bits", "independent",
    }
    tolerance = Decimal("1e-12")

    @lru_cache(maxsize=None)
    def ln_integer(n):
        return Decimal(n).ln()

    def entropy_oracle(masses):
        n = sum(masses)
        assert n > 0
        # H = (ln N - sum w ln(w)/N) / ln 2; no float conversion here.
        return (ln_integer(n) - sum(
            (Decimal(w) * ln_integer(w) for w in masses if w), Decimal(0)
        ) / Decimal(n)) / ln_integer(2)

    def close_float(actual, expected):
        nonlocal maximum_error
        assert type(actual) is float and math.isfinite(actual)
        error = abs(Decimal.from_float(actual) - expected)
        maximum_error = max(maximum_error, error)
        assert error <= tolerance, (actual, str(expected), str(error))

    def check(weights):
        nonlocal checked
        result = analyze_joint(weights)
        checked += 1
        assert type(result) is dict and set(result) == expected_keys
        n = sum(sum(row) for row in weights)
        nr, nc = len(weights), len(weights[0])
        expected_joint = tuple(tuple(Fraction(w, n) for w in row)
                               for row in weights)
        expected_px = tuple(sum(row) for row in expected_joint)
        expected_py = tuple(sum(expected_joint[i][j] for i in range(nr))
                            for j in range(nc))
        assert result["joint"] == expected_joint
        assert result["px"] == expected_px and result["py"] == expected_py
        assert type(result["joint"]) is tuple
        assert all(type(row) is tuple for row in result["joint"])
        assert all(type(p) is Fraction for row in result["joint"] for p in row)
        assert all(type(result[k]) is tuple for k in ("px", "py"))
        assert all(type(p) is Fraction for k in ("px", "py") for p in result[k])
        assert sum(result["px"]) == sum(result["py"]) == 1
        independence_oracle = all(
            expected_joint[i][j] == expected_px[i] * expected_py[j]
            for i in range(nr) for j in range(nc)
        )
        assert type(result["independent"]) is bool
        assert result["independent"] is independence_oracle
        row_masses = [sum(row) for row in weights]
        columns = [[weights[i][j] for i in range(nr)] for j in range(nc)]
        column_masses = [sum(column) for column in columns]
        hx = entropy_oracle(row_masses)
        hy = entropy_oracle(column_masses)
        hxy = entropy_oracle([w for row in weights for w in row])
        mi = hx + hy - hxy
        per_y = tuple(entropy_oracle(column) if sum(column) else None
                      for column in columns)
        conditional = sum((Decimal(c) * h / Decimal(n)
                           for c, h in zip(column_masses, per_y) if c), Decimal(0))
        # A second identity at 90 decimal digits, independent of production floats.
        assert abs(conditional - (hxy - hy)) < Decimal("1e-75")
        assert abs(mi - (hx - conditional)) < Decimal("1e-75")
        close_float(result["h_x_bits"], hx)
        close_float(result["h_x_given_y_bits"], conditional)
        close_float(result["mi_bits"], mi)
        assert type(result["h_x_given_each_y_bits"]) is tuple
        assert len(result["h_x_given_each_y_bits"]) == nc
        for observed, expected in zip(result["h_x_given_each_y_bits"], per_y):
            if expected is None:
                assert observed is None
            else:
                close_float(observed, expected)
        assert -tolerance <= Decimal.from_float(result["mi_bits"])
        assert Decimal.from_float(result["mi_bits"]) <= min(hx, hy) + tolerance
        if independence_oracle:
            assert result["mi_bits"] == 0.0
        return result, mi

    # Every nonnegative 2x2 integer table with 1 <= total <= 12: 1819 tables.
    small_count = 0
    for a in range(13):
        for b in range(13 - a):
            for c in range(13 - a - b):
                for d in range(13 - a - b - c):
                    if a + b + c + d:
                        check([[a, b], [c, d]])
                        small_count += 1
    assert small_count == 1819

    fixtures = [
        [[1]], [[65536]], [[0, 65536, 0]], [[0], [65536], [0]],
        [[3, 1], [1, 3]], [[8, 1], [0, 1]], [[1], [1]],
        [[1, 0], [0, 1], [0, 1], [1, 0]],
        [[65535, 0], [0, 1]], [[1, 32767], [32767, 1]],
        [[32767, 32766], [1, 1]], [[1, 0, 0], [0, 2, 0]],
        [[1024] * 8 for _ in range(8)],
        [[8192 if i == j else 0 for j in range(8)] for i in range(8)],
    ]
    for k in (1, 2, 17, 1024, 4096, 16384):
        weights = [[k + 1, k - 1], [k - 1, k + 1]]
        result, reference = check(weights)
        assert result["independent"] is False and reference > 0
        fixtures.append(weights)
    # Deterministic laws, including many-to-one maps.
    for nr in range(1, 9):
        for nc in range(1, 9):
            fixtures.append([[i + 1 if j == (i * 3) % nc else 0
                              for j in range(nc)] for i in range(nr)])
    # Outer-product masses certify independence, including unused categories.
    for u, v in product(((1,), (0, 1), (1, 3, 7), (0, 1, 0, 2)), repeat=2):
        weights = [[a * b for b in v] for a in u]
        result, _ = check(weights)
        assert result["independent"]
        fixtures.append(weights)
    # All supported shapes; no random data are used to infer a real-world law.
    rng = Random(20261005)
    for nr in range(1, 9):
        for nc in range(1, 9):
            weights = [[rng.randrange(33) for _ in range(nc)] for _ in range(nr)]
            weights[0][0] += 1
            fixtures.append(weights)

    for weights in fixtures:
        original, reference = check(weights)
        nr, nc = len(weights), len(weights[0])
        variants = [
            [list(column) for column in zip(*weights)],
            [row[:] for row in reversed(weights)],
            [list(reversed(row)) for row in weights],
            tuple(tuple(row) for row in weights),
            tuple(list(row) for row in weights),
            [tuple(row) for row in weights],
        ]
        if nr < 8:
            variants.append([row[:] for row in weights] + [[0] * nc])
        if nc < 8:
            variants.append([row[:] + [0] for row in weights])
        n = sum(sum(row) for row in weights)
        if n * 3 <= 65536:
            variants.append([[3 * w for w in row] for row in weights])
        for variant in variants:
            result, transformed_reference = check(variant)
            assert abs(transformed_reference - reference) < Decimal("1e-75")
            assert abs(result["mi_bits"] - original["mi_bits"]) <= float(tolerance)
            assert result["independent"] is original["independent"]

    # XOR pairwise independence is checked by enumerating the given full law.
    triples = [(a, b, a ^ b) for a in (0, 1) for b in (0, 1)]
    for i, j in ((0, 1), (0, 2), (1, 2)):
        weights = [[0, 0], [0, 0]]
        for triple in triples:
            weights[triple[i]][triple[j]] += 1
        result, _ = check(weights)
        assert result["independent"] and result["mi_bits"] == 0.0
    grouped = [[0, 0] for _ in range(4)]
    for a, b, t in triples:
        grouped[2 * a + b][t] += 1
    result, _ = check(grouped)
    close_float(result["mi_bits"], Decimal(1))

    # A zero column is undefined locally, not an undefined average.
    padded, _ = check([[1, 0, 0], [0, 1, 0]])
    assert padded["h_x_given_each_y_bits"] == (0.0, 0.0, None)
    assert padded["h_x_given_y_bits"] == 0.0
    rare, _ = check([[8, 1], [0, 1]])
    assert rare["h_x_given_each_y_bits"][1] > rare["h_x_bits"]
    assert rare["h_x_given_y_bits"] < rare["h_x_bits"]
    mutable = [[3, 1], [1, 3]]
    snapshot, _ = check(mutable)
    assert mutable == [[3, 1], [1, 3]]
    mutable[0][0] = 100
    assert snapshot["joint"][0][0] == Fraction(3, 8)
    try:
        snapshot["joint"][0][0] = Fraction(0)
    except TypeError:
        pass
    else:
        raise AssertionError("joint probabilities should be immutable tuples")

    class IntSubclass(int):
        pass

    class ListSubclass(list):
        pass

    class TupleSubclass(tuple):
        pass

    invalid = [
        None, 1, True, "1", b"1", {}, set(), iter([[1]]),
        [], (), [1], [None], ["1"], [iter([1])], [[]], [()],
        [[1], [1, 2]], [[1, 2], [1]], [[0]], [[0] * 8 for _ in range(8)],
        [[-1]], [[65537]], [[65536, 1]], [[32768, 32769]],
        [[1 << 10000]], [[-(1 << 10000)]],
        [[True]], [[False]], [[1.0]], [[0.0]], [[-0.0]],
        [[float("nan")]], [[float("inf")]], [[float("-inf")]],
        [[Fraction(1)]], [[Decimal(1)]], [[1 + 0j]], [["1"]], [[None]],
        [[IntSubclass(1)]], ListSubclass([[1]]), TupleSubclass(([1],)),
        [ListSubclass([1])], [TupleSubclass((1,))],
        [[1]] * 9, [[1] * 9], [[1] * 8 for _ in range(9)],
        [[1] * 9 for _ in range(8)],
    ]
    for bad in invalid:
        try:
            analyze_joint(bad)
        except ValueError:
            rejected += 1
        else:
            raise AssertionError("invalid integer-mass input was accepted")
    print("mutual-information regression:", checked, "law checks;",
          small_count, "exhaustive small tables;", rejected, "rejections;",
          "max absolute error", f"{maximum_error:.3E}", "bits")


with localcontext() as _mi_context:
    _mi_context.prec = 90
    _run_mi_regressions()
