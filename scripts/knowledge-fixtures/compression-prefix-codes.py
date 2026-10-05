
# Author regression suffix, written only after the API/code freeze.
# Independent reference: enumerate integer prefix lengths using Kraft.
# No second heap implementation and no private author helper as an oracle.
from decimal import Decimal, localcontext
from functools import lru_cache
from itertools import product


@lru_cache(None)
def _kraft_lengths(size):
    # An optimal positive-weight tree is full, so max depth <= size - 1.
    # At size <= 5 this is at most 4**5 = 1024 length candidates.
    assert 2 <= size <= 5
    return tuple(lengths
                 for lengths in product(range(1, size), repeat=size)
                 if sum(Fraction(1, 2 ** d) for d in lengths) <= 1)


@lru_cache(None)
def _optimal_external_cost(positive_weights):
    if len(positive_weights) == 1:
        return 0
    return min(sum(w * d for w, d in zip(positive_weights, lengths))
               for lengths in _kraft_lengths(len(positive_weights)))


def _scan_decode(codes, bits, count):
    # Independent decoder: match codewords at each current bit position.
    # Does not use the author's trie construction or traversal.
    live = [(i, c) for i, c in enumerate(codes) if c is not None]
    if len(live) == 1:
        assert not bits
        return (live[0][0],) * count
    cursor = 0
    result = []
    while cursor < len(bits):
        matches = [(i, c) for i, c in live if bits.startswith(c, cursor)]
        assert len(matches) == 1
        symbol, code = matches[0]
        result.append(symbol)
        cursor += len(code)
    assert cursor == len(bits) and len(result) == count
    return tuple(result)


def _check_code_properties(weights):
    codes = huffman_codes(weights)
    assert type(codes) is tuple and len(codes) == len(weights)
    live = []
    for w, c in zip(weights, codes):
        assert (c is None) == (w == 0)
        if w:
            assert type(c) is str and all(b in '01' for b in c)
            live.append(c)
    if len(live) == 1:
        assert live == ['']
    else:
        assert all(1 <= len(c) <= len(live) - 1 for c in live)
        for i, a in enumerate(live):
            for j, b in enumerate(live):
                if i != j:
                    assert not b.startswith(a)
        assert sum(Fraction(1, 2 ** len(c)) for c in live) == 1
    assert codes == huffman_codes(list(weights))
    return codes


_law_cases = 0
for size in range(1, 6):
    # All positive laws with bounded unnormalized weights 1..3.
    for weights_ref in product(range(1, 4), repeat=size):
        codes_ref = _check_code_properties(weights_ref)
        actual = sum(w * len(c) for w, c in zip(weights_ref, codes_ref))
        assert actual == _optimal_external_cost(weights_ref)
        assert huffman_codes(tuple(2 * w for w in weights_ref)) == codes_ref
        _law_cases += 1
    # Additional exhaustive zero-support layouts, weights 0..2.
    for weights_ref in product(range(3), repeat=size):
        if not any(weights_ref):
            continue
        codes_ref = _check_code_properties(weights_ref)
        actual = sum(w * len(c) for w, c in zip(weights_ref, codes_ref) if w)
        support_weights = tuple(w for w in weights_ref if w)
        assert actual == _optimal_external_cost(support_weights)
        _law_cases += 1
assert _law_cases == 721

# Literal expected codes audit the public tie rule, including leaf-parent ties.
assert huffman_codes((1, 1, 1)) == ('10', '11', '0')
assert huffman_codes((1, 1, 1, 1)) == ('00', '01', '10', '11')
assert huffman_codes((1, 1, 2)) == ('10', '11', '0')
assert huffman_codes((0, 1, 0, 1)) == (None, '0', None, '1')
assert huffman_codes((4, 2, 1, 1)) == ('0', '10', '110', '111')

_roundtrips = 0
for law in ((4, 2, 1, 1), (1, 1, 1), (0, 2, 1, 0, 1),
            (1, 1), (0, 1, 0), (1, 1, 1, 1, 1)):
    book = _check_code_properties(law)
    support = tuple(i for i, w in enumerate(law) if w)
    for size in range(5):
        for message_ref in product(support, repeat=size):
            payload = encode_symbols(law, message_ref)
            assert payload == ''.join(book[i] for i in message_ref)
            assert len(payload) == sum(len(book[i]) for i in message_ref)
            assert decode_symbols(law, payload, size) == message_ref
            assert _scan_decode(book, payload, size) == message_ref
            _roundtrips += 1
assert _roundtrips == 1400

# Every allowable singleton length, including zero and the maximum.
for position in range(8):
    law = tuple(65536 if i == position else 0 for i in range(8))
    for count in range(257):
        source = (position,) * count
        assert encode_symbols(law, source) == ''
        assert decode_symbols(law, '', count) == source

# Support, mass, count and payload-length upper endpoints.
for law in ((1,) * 8, (1, 1, 2, 3, 5, 8, 13, 21),
            (65529, 1, 1, 1, 1, 1, 1, 1), (65536,), (0, 65536)):
    book = _check_code_properties(law)
    live = tuple(i for i, w in enumerate(law) if w)
    source = tuple(live[i % len(live)] for i in range(256))
    payload = encode_symbols(law, source)
    assert decode_symbols(law, payload, 256) == source
    assert _scan_decode(book, payload, 256) == source
skew = (1, 1, 2, 3, 5, 8, 13, 21)
skew_book = huffman_codes(skew)
longest = max(range(8), key=lambda i: len(skew_book[i]))
assert len(skew_book[longest]) == 7
max_payload = encode_symbols(skew, (longest,) * 256)
assert len(max_payload) == 1792
assert decode_symbols(skew, max_payload, 256) == (longest,) * 256
assert all(len(c) == 3 for c in huffman_codes((1,) * 8))

# Independent high-precision entropy evaluations, separate from integer oracle.
with localcontext() as ctx:
    ctx.prec = 60
    for law, literal_h in (((4, 2, 1, 1), Decimal('1.75')),
                           ((3, 1), Decimal('0.81127812445913286391')),
                           ((2, 1), Decimal('0.91829583405448951479'))):
        total = Decimal(sum(law))
        entropy_ref = -sum((Decimal(w) / total) *
                          (Decimal(w) / total).ln() / Decimal(2).ln()
                          for w in law)
        assert abs(entropy_ref - literal_h) < Decimal('1e-20')
        book = huffman_codes(law)
        cost = sum(Decimal(w) / total * len(c) for w, c in zip(law, book))
        assert entropy_ref - Decimal('1e-55') <= cost < entropy_ref + 1
assert sum(Fraction(w, 8) * d
           for w, d in zip((1, 1, 2, 4), (1, 2, 3, 3))) == Fraction(21, 8)

# Independently form the exact toy frame fields. No byte codec is used.
frame_book = ('0', '10', '110', '111')
length_fields = ''.join(format(len(c), '03b') for c in frame_book)
book_fields = ''.join(frame_book)
count_field = format(8, '09b')
payload_field = '00001010110111'
raw_frame = length_fields + book_fields + count_field + payload_field
assert (len(length_fields), len(book_fields), len(count_field)) == (12, 9, 9)
assert len(raw_frame) == 44
assert len(raw_frame + '0' * (-len(raw_frame) % 8)) == 48
fixed_raw = count_field + '00' * 4 + '01' * 2 + '10' + '11'
assert len(fixed_raw) == 25
assert len(fixed_raw + '0' * (-len(fixed_raw) % 8)) == 32
assert len(count_field + payload_field) == 23  # pre-shared codebook exercise
assert -23 % 8 == 1

# Full literal quantizer oracle and exact task/collision checks.
qs = (0, 0, 1, 1, 2, 2, 3, 3)
rs = (0, 0, 2, 2, 4, 4, 6, 6)
es = (0, 1, 0, 1, 0, 1, 0, 1)
assert quantize_3bit(()) == ((), (), 0)
assert quantize_3bit(tuple(range(8))) == (qs, rs, 4)
for x in range(8):
    assert quantize_3bit([x]) == ((qs[x],), (rs[x],), es[x])
    assert (x >= 4) == (qs[x] >= 2)
    assert abs(x - rs[x]) <= 1
for q in range(4):
    preimages = tuple(x for x in range(8) if qs[x] == q)
    assert len(preimages) == 2
    assert {x % 2 for x in preimages} == {0, 1}
assert quantize_3bit((1, 3, 5, 7))[2] == 4
assert quantize_3bit(tuple(range(8)) * 32) == (qs * 32, rs * 32, 128)
assert Fraction(sum(es), 8) == Fraction(1, 2)


class _IntSubclass(int):
    pass


class _ListSubclass(list):
    pass


class _TupleSubclass(tuple):
    pass


class _StrSubclass(str):
    pass


_rejections = 0


def _reject(function, *args):
    global _rejections
    try:
        function(*args)
    except ValueError:
        _rejections += 1
    else:
        raise AssertionError((function.__name__, args))


for bad_law in (None, True, {}, {1}, range(3), (x for x in [1]),
                _ListSubclass([1]), _TupleSubclass((1,)), (), [],
                (1,) * 9, (0,), (0, 0), (-1, 2), (65537,),
                (65536, 1), (True,), (_IntSubclass(1),), (1.0,),
                (float('nan'),), (float('inf'),), ('1',),
                (Fraction(1),), (Decimal(1),), ([1],)):
    _reject(huffman_codes, bad_law)
    _reject(encode_symbols, bad_law, ())
    _reject(decode_symbols, bad_law, '', 0)
for bad_symbols in (None, '0', {}, range(1), (x for x in [0]),
                    _ListSubclass([0]), _TupleSubclass((0,)), (0,) * 257,
                    (True,), (_IntSubclass(0),), (0.0,), (Fraction(0),),
                    (Decimal(0),), ('0',), (None,), ([0],), (-1,), (3,), (1,)):
    _reject(encode_symbols, (1, 0, 1), bad_symbols)
for bad_bits in (None, b'0', 0, ['0'], _StrSubclass('0'), '0' * 1793,
                 '2', '01 ', '0\n', '０', '𝟎'):
    _reject(decode_symbols, (1, 1), bad_bits, 1)
for bad_count in (None, True, False, _IntSubclass(0), 1.0, Fraction(1),
                  Decimal(1), '1', -1, 257):
    _reject(decode_symbols, (1, 1), '', bad_count)
for payload, count in (('1', 1), ('11', 1), ('0', 2), ('00', 1),
                       ('', 1), ('0', 0), ('10', 0), ('000', 1),
                       ('10' + '1', 1)):
    _reject(decode_symbols, (4, 2, 1, 1), payload, count)
for payload in ('0', '1', '000'):
    _reject(decode_symbols, (0, 5), payload, 3)
assert decode_symbols((4, 2, 1, 1), '', 0) == ()
assert decode_symbols((4, 2, 1, 1), '110', 1) == (2,)
assert decode_symbols((4, 2, 1, 1), '111', 1) == (3,)  # undetected one-bit edit
for bad_values in (None, '', {}, range(8), (x for x in [0]),
                   _ListSubclass([0]), _TupleSubclass((0,)), (0,) * 257,
                   (True,), (_IntSubclass(1),), (1.0,), (Fraction(1),),
                   (Decimal(1),), (float('nan'),), (float('inf'),),
                   ('1',), (None,), ([1],), (-1,), (8,)):
    _reject(quantize_3bit, bad_values)

# Valid list input, deterministic results and no mutation of supplied lists.
mutable_law, mutable_symbols, mutable_values = [4, 2, 1, 1], [0, 3], [0, 7]
assert encode_symbols(mutable_law, mutable_symbols) == '0111'
assert decode_symbols(mutable_law, '0111', 2) == (0, 3)
assert quantize_3bit(mutable_values) == ((0, 3), (0, 6), 1)
assert (mutable_law, mutable_symbols, mutable_values) == (
    [4, 2, 1, 1], [0, 3], [0, 7])
print('author regression:', _law_cases, 'laws,', _roundtrips,
      'short roundtrips,', _rejections, 'rejections; passed')
