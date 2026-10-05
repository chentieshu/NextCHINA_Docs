# Author's independent assertions appended to the article's extracted block.
# Position oracle: mathematical rank / partition; secondary bisect cross-check.
# Count oracle: recursively enumerate answer-leaf depths, not the search loop.
from bisect import bisect_left as _cx_bisect_left
from functools import lru_cache as _cx_cache
from itertools import combinations_with_replacement as _cx_multisets
from fractions import Fraction as _CXFraction
from decimal import Decimal as _CXDecimal
import operator as _cx_operator


@_cx_cache(maxsize=None)
def _cx_depths(n):
    if n == 0:
        return (0,)
    left_keys = n // 2
    right_keys = n - left_keys - 1
    return tuple(1 + d for d in
                 _cx_depths(left_keys) + _cx_depths(right_keys))


_cx_cases = 0
_cx_binary_rank_cases = 0
_cx_rejections = 0


def _cx_check(values, target, prepared=None):
    global _cx_cases
    original = tuple(values)
    if prepared is None:
        prepared = OrderedInts(list(original))
    assert type(prepared) is OrderedInts
    assert tuple(prepared) == original
    rank = sum(1 for value in original if value < target)
    assert rank == _cx_bisect_left(original, target)
    assert all(value < target for value in original[:rank])
    assert all(value >= target for value in original[rank:])
    expected_counts = (min(rank + 1, len(original)),
                       _cx_depths(len(original))[rank])
    for search, expected in zip(
            (linear_lower_bound, binary_lower_bound), expected_counts):
        answer = search(prepared, target)
        assert type(answer) is tuple and len(answer) == 2
        assert all(type(value) is int for value in answer)
        assert answer == (rank, expected), (
            search.__name__, original, target, answer, rank, expected)
        assert tuple(prepared) == original
    _cx_cases += 1


def _cx_reject(call):
    global _cx_rejections
    try:
        call()
    except ValueError:
        _cx_rejections += 1
    else:
        raise AssertionError("documented invalid data was accepted")


# Derive this fixture independently from the article's demo variables.
_cx_eights = tuple(range(2, 17, 2))
_cx_targets = tuple(range(1, 18, 2))
assert _cx_depths(8) == (4, 4, 3, 3, 3, 3, 3, 3, 3)
assert tuple(min(r + 1, 8) for r in range(9)) == (1, 2, 3, 4, 5, 6, 7, 8, 8)
assert _CXFraction(sum(min(r + 1, 8) for r in range(9)), 9) == _CXFraction(44, 9)
assert _CXFraction(sum(_cx_depths(8)), 9) == _CXFraction(29, 9)
for _cx_target in _cx_targets:
    _cx_check(_cx_eights, _cx_target)
assert linear_lower_bound(OrderedInts(_cx_eights), 1) == (0, 1)
assert binary_lower_bound(OrderedInts(_cx_eights), 1) == (0, 4)

# Exhaust all 1,287 sorted multisets of length 0..8 from five keys.
# All exact-key and intervening-gap targets are covered, plus both tails.
_cx_small_arrays = 0
for _cx_n in range(9):
    for _cx_values in _cx_multisets((-4, -2, 0, 2, 4), _cx_n):
        _cx_prepared = OrderedInts(_cx_values)
        _cx_small_arrays += 1
        for _cx_target in range(-5, 6):
            _cx_check(_cx_values, _cx_target, _cx_prepared)
assert _cx_small_arrays == 1287

# Sizes immediately below/at/above powers of two, through the accepted cap.
_cx_sizes = sorted({n for k in range(13)
                    for n in (2**k - 1, 2**k, 2**k + 1)
                    if 0 <= n <= 4096})
for _cx_n in _cx_sizes:
    _cx_depth = _cx_depths(_cx_n)
    assert len(_cx_depth) == _cx_n + 1
    assert min(_cx_depth) == (_cx_n + 1).bit_length() - 1
    assert max(_cx_depth) == _cx_n.bit_length()
    _cx_ranks = {0, 1, 2, _cx_n // 4, _cx_n // 2,
                 (3 * _cx_n) // 4, _cx_n - 2, _cx_n - 1, _cx_n}
    _cx_unique = tuple(2 * i for i in range(_cx_n))
    _cx_prepared = OrderedInts(_cx_unique)
    for _cx_rank in sorted(r for r in _cx_ranks if 0 <= r <= _cx_n):
        for _cx_target in (2 * _cx_rank - 1, 2 * _cx_rank):
            _cx_check(_cx_unique, _cx_target, _cx_prepared)
    for _cx_values in ((0,) * _cx_n,
                       tuple(i // 7 - 20 for i in range(_cx_n))):
        _cx_prepared = OrderedInts(_cx_values)
        _cx_probes = {-21, -20, -1, 0, 1, _cx_n // 7 - 20,
                      _cx_n // 7 - 19}
        for _cx_target in _cx_probes:
            _cx_check(_cx_values, _cx_target, _cx_prepared)

# Every answer leaf at the cap: rank r is known from the constructed even keys.
# No linear-search clone is used to predict either the rank or binary count.
_cx_full = OrderedInts(list(range(0, 8192, 2)))
for _cx_rank in range(4097):
    _cx_target = 2 * _cx_rank - 1
    _cx_answer = binary_lower_bound(_cx_full, _cx_target)
    assert _cx_answer == (_cx_rank, _cx_depths(4096)[_cx_rank])
    assert _cx_bisect_left(_cx_full, _cx_target) == _cx_rank
    assert _cx_rank == 0 or _cx_full[_cx_rank - 1] < _cx_target
    assert _cx_rank == 4096 or _cx_full[_cx_rank] >= _cx_target
    _cx_binary_rank_cases += 1
assert _cx_binary_rank_cases == 4097

# Explicit duplicates, endpoints, empty/singleton, and copied-list mutation.
for _cx_values in ((), (7,), (2, 4, 4, 4, 8),
                   (-(2**31), -(2**31), -1, 0, 2**31 - 1, 2**31 - 1)):
    for _cx_target in (-(2**31), -(2**31) + 1, -1, 0, 1, 4, 5, 7, 8,
                       2**31 - 2, 2**31 - 1):
        _cx_check(_cx_values, _cx_target)
_cx_source = [2, 4, 4, 4, 8]
_cx_copy = OrderedInts(_cx_source)
_cx_source[:] = [999]
assert tuple(_cx_copy) == (2, 4, 4, 4, 8) and len(_cx_copy) == 5
_cx_check((2, 4, 4, 4, 8), 4, _cx_copy)
_cx_check((2, 4, 4, 4, 8), 5, _cx_copy)
for _cx_mutate in (
        lambda: _cx_operator.setitem(_cx_copy, 0, 0),
        lambda: _cx_operator.delitem(_cx_copy, 0),
        lambda: setattr(_cx_copy, "values", (0,)),
        lambda: setattr(_cx_copy, "length", 0)):
    try:
        _cx_mutate()
    except (TypeError, AttributeError):
        pass
    else:
        raise AssertionError("prepared value was mutable")
assert not hasattr(_cx_copy, "__dict__")
assert tuple(_cx_copy) == (2, 4, 4, 4, 8)


class _CXInt(int):
    pass


class _CXList(list):
    pass


class _CXTuple(tuple):
    pass


class _CXPrepared(OrderedInts):
    pass


class _CXDoNotInspect:
    def __iter__(self):
        raise AssertionError("unsupported objects must not be iterated")

    def __len__(self):
        raise AssertionError("unsupported objects must not be measured")


_cx_bad_scalars = (
    True, False, 1.0, -0.0, float("nan"), float("inf"), float("-inf"),
    "1", b"1", None, 1 + 0j, _CXFraction(1), _CXDecimal(1),
    [], (), {}, object(), _CXInt(1), -(2**31) - 1, 2**31, 10**1000)
for _cx_bad in _cx_bad_scalars:
    _cx_reject(lambda v=_cx_bad: OrderedInts([v]))
    for _cx_search in (linear_lower_bound, binary_lower_bound):
        for _cx_input in (OrderedInts([]), OrderedInts([0])):
            _cx_reject(lambda v=_cx_bad, s=_cx_search, d=_cx_input: s(d, v))

_cx_bad_containers = (
    None, True, 1, 1.0, "123", b"123", bytearray(b"123"),
    {1, 2}, {1: 2}, range(3), iter([1, 2]), (x for x in [1, 2]),
    _CXList([1, 2]), _CXTuple((1, 2)), _CXDoNotInspect(),
    OrderedInts([1, 2]))
for _cx_bad in _cx_bad_containers:
    _cx_reject(lambda v=_cx_bad: OrderedInts(v))
for _cx_values in ([2, 1], [0, 0, -1], [0, 2, 1, 3],
                   [0] * 4097, tuple([0] * 4097)):
    _cx_reject(lambda v=_cx_values: OrderedInts(v))
_cx_reject(lambda: _CXPrepared([1, 2]))
_cx_good_boundary = OrderedInts([0] * 4096)
assert len(_cx_good_boundary) == 4096
for _cx_search in (linear_lower_bound, binary_lower_bound):
    for _cx_bad in (None, [], (), [1, 2], (1, 2), True, 1, "12",
                    _CXList([1, 2]), _CXTuple((1, 2)), _CXDoNotInspect()):
        _cx_reject(lambda s=_cx_search, v=_cx_bad: s(v, 1))

# Instrument supported indexing after preparation, only inside this test.
# Extra scans/copies via iteration or slicing are rejected, and the exact key
# accesses must match each algorithm's independent expected comparison count.
# This is test instrumentation, not a claim that modified classes are supported.
_cx_accesses = []
_cx_target_checks = []
_cx_saved_check = _bounded_int


def _cx_index(self, index):
    assert type(index) is int, "query copied/sliced the input"
    _cx_accesses.append(index)
    return tuple.__getitem__(self, index)


def _cx_no_iter(self):
    raise AssertionError("query rescanned or copied the input by iteration")


def _cx_checked_target(value):
    _cx_target_checks.append(value)
    return _cx_saved_check(value)


OrderedInts.__getitem__ = _cx_index
OrderedInts.__iter__ = _cx_no_iter
_bounded_int = _cx_checked_target
try:
    for _cx_rank in (0, 1, 2048, 4095, 4096):
        _cx_target = 2 * _cx_rank - 1
        for _cx_search, _cx_count in (
                (linear_lower_bound, min(_cx_rank + 1, 4096)),
                (binary_lower_bound, _cx_depths(4096)[_cx_rank])):
            _cx_accesses.clear()
            _cx_target_checks.clear()
            assert _cx_search(_cx_full, _cx_target) == (_cx_rank, _cx_count)
            assert len(_cx_accesses) == _cx_count
            assert _cx_target_checks == [_cx_target]
finally:
    del OrderedInts.__getitem__
    del OrderedInts.__iter__
    _bounded_int = _cx_saved_check
assert tuple(_cx_full) == tuple(range(0, 8192, 2))

print("complexity regression:", _cx_cases, "paired position/count cases;",
      _cx_binary_rank_cases, "cap-size binary leaves;",
      _cx_small_arrays, "exhaustive small multisets;",
      len(_cx_sizes), "boundary sizes;", _cx_rejections,
      "ValueError cases; immutable-copy and no-rescan probes passed")
