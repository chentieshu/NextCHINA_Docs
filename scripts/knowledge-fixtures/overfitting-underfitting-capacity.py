"""Candidate-independent fixture, authored from answer-free premises only.
Append to a candidate in python3 -I -c or import and call run_blind_api_checks(ns).
No files, network, randomness, subprocesses, or candidate source inspection.
"""
from fractions import Fraction as _review_F
from itertools import product as _review_product, permutations as _review_permutations
import json as _review_json

_review_X = (-2, -1, 1, 2)
_review_NAMES = ('constant', 'affine', 'lookup')
_review_LENGTH = {'constant': 1, 'affine': 2, 'lookup': 4}


def _review_exact_fraction(value, context):
    assert type(value) is _review_F, (context, 'expected exact Fraction', type(value).__name__)


def _review_tree(value):
    if type(value) in (tuple, list):
        return (type(value).__name__, tuple(_review_tree(v) for v in value))
    return (type(value).__name__, repr(value))


def _review_semantic_prediction(model, x):
    family, p = model
    if family == 'constant':
        return _review_F(p[0])
    if family == 'affine':
        return _review_F(p[0]) + _review_F(p[1]) * x
    return _review_F(p[_review_X.index(x)])


def _review_expanded_loss(model, rows):
    # Algebraic second-moment expansion, not a residual-square implementation.
    ps = [_review_semantic_prediction(model, x) for x, _ in rows]
    return (sum(p*p for p in ps) - 2*sum(p*y for p, (_, y) in zip(ps, rows))
            + sum(y*y for _, y in rows)) / len(rows)


def _review_expect_value_error(fn, *args, **kwargs):
    try:
        fn(*args, **kwargs)
    except ValueError:
        return
    except Exception as exc:
        raise AssertionError(('wrong rejection exception', fn.__name__, type(exc).__name__)) from exc
    raise AssertionError(('accepted invalid input', fn.__name__, repr(args), repr(kwargs)))


def run_blind_api_checks(ns):
    fit, predict, mse, report = (ns[name] for name in ('fit_family', 'predict', 'mse', 'risk_report'))
    assert type(ns['SUPPORT']) is tuple and ns['SUPPORT'] == _review_X
    assert all(type(x) is int for x in ns['SUPPORT'])
    assert type(ns['FAMILIES']) is tuple and ns['FAMILIES'] == _review_NAMES
    assert all(type(f) is str for f in ns['FAMILIES'])
    counts = {'valid_fit': 0, 'valid_predict': 0, 'valid_mse': 0,
              'valid_reports': 0, 'invalid_calls': 0}

    def reject(fn, *args, **kwargs):
        counts['invalid_calls'] += 1
        _review_expect_value_error(fn, *args, **kwargs)

    def check_prediction(model, x):
        actual = predict(model, x)
        _review_exact_fraction(actual, 'predict')
        assert actual == _review_semantic_prediction(model, x), ('predict value', model, x, actual)
        counts['valid_predict'] += 1

    def check_mse(model, rows):
        before = _review_tree(rows)
        actual = mse(model, rows)
        _review_exact_fraction(actual, 'mse')
        assert actual == _review_expanded_loss(model, rows), ('mse value', model, rows, actual)
        assert _review_tree(rows) == before, 'mse mutated rows'
        counts['valid_mse'] += 1

    def check_fit(rows, family):
        before = _review_tree(rows)
        model = fit(rows, family)
        assert _review_tree(rows) == before, 'fit mutated rows'
        assert type(model) is tuple and len(model) == 2, 'fit model schema'
        assert type(model[0]) is str and model[0] == family, 'fit family schema'
        p = model[1]
        assert type(p) is tuple and len(p) == _review_LENGTH[family], 'fit parameters schema'
        for v in p:
            _review_exact_fraction(v, 'fit parameter')
            assert abs(v.numerator) <= 1024 and 1 <= v.denominator <= 1024
        # Uniqueness-certified optimality conditions: full-rank design + residual
        # orthogonality determine the least-squares fit without an oracle solver.
        residuals = [(_review_semantic_prediction(model, x) - y) for x, y in rows]
        if family in ('constant', 'affine'):
            assert sum(residuals) == 0, ('intercept optimality', rows, model)
        if family == 'affine':
            assert sum(x*r for (x, _), r in zip(rows, residuals)) == 0, ('slope optimality', rows, model)
        if family == 'lookup':
            assert all(r == 0 for r in residuals), ('lookup interpolation', rows, model)
        for x in _review_X:
            check_prediction(model, x)
        check_mse(model, rows)
        counts['valid_fit'] += 1
        return model

    # Every original noise draw, every ordering, list and tuple record/container mixes.
    for signs in _review_product((-1, 1), repeat=4):
        base = tuple((x, x+e) for x, e in zip(_review_X, signs))
        for k, order in enumerate(_review_permutations(range(4))):
            rows = [list(base[i]) if (k+i) % 2 else base[i] for i in order]
            if k % 2:
                rows = tuple(rows)
            for family in _review_NAMES:
                check_fit(rows, family)
    # Broad label boundaries, including cases outside the fictional noise process.
    for ys in _review_product((-16, 0, 16), repeat=4):
        rows = [[x, y] for x, y in zip(_review_X, ys)]
        for family in _review_NAMES:
            model = check_fit(rows, family)
            check_mse(model, [(1, -16)] * 32)
            check_mse(model, ((2, 16),))
    for k in range(99):
        ys = tuple(((k*a+b) % 33)-16 for a, b in ((1, 0), (7, 3), (13, 8), (17, 21)))
        rows = tuple(zip(_review_X, ys))
        for family in _review_NAMES:
            check_fit(rows, family)

    # Direct valid model states cover exact int inputs, rational boundaries, and signs.
    values = (0, 1, -1024, 1024, _review_F(0), _review_F(-1024, 1023),
              _review_F(1023, 1024), _review_F(1, 1024), _review_F(-1, 1024),
              _review_F(2048, 2048), _review_F(-4096, 2048))
    for family in _review_NAMES:
        length = _review_LENGTH[family]
        for k in range(len(values)):
            model = (family, tuple(values[(k+j) % len(values)] for j in range(length)))
            for x in _review_X:
                check_prediction(model, x)
            check_mse(model, [[-2, -16], [-2, 16], [1, 0], [2, -1], [2, 1]])

    # Frozen closed-form average oracle: independent of candidate fitting/evaluation.
    for s, n, t in _review_product((0, 1), repeat=3):
        expected = (
            ('constant', _review_F(5,2)*s + _review_F(3,4)*n,
             _review_F(5,2)*s + _review_F(1,4)*n,
             _review_F(5,2)*s + _review_F(1,4)*n + t),
            ('affine', _review_F(n,2), _review_F(n,2), _review_F(n,2)+t),
            ('lookup', _review_F(0), _review_F(n), _review_F(n+t)))
        actual = report(signal=s, train_noise=n, fresh_noise=t)
        assert type(actual) is tuple and len(actual) == 3, 'risk outer schema'
        for row, exp in zip(actual, expected):
            assert type(row) is tuple and len(row) == 4, 'risk row schema'
            assert type(row[0]) is str, 'risk family type'
            for v in row[1:]:
                _review_exact_fraction(v, 'risk entry')
            assert row == exp, ('risk value', s, n, t, row, exp)
        counts['valid_reports'] += 1
    assert report() == report(1, 1, 1), 'risk defaults'

    class IntChild(int):
        pass
    class FloatChild(float):
        pass
    class StringChild(str):
        pass
    class FractionChild(_review_F):
        pass
    class ListChild(list):
        pass
    class TupleChild(tuple):
        pass

    base = [(-2, -1), (-1, -2), (1, 0), (2, 3)]
    good_model = ('affine', (_review_F(0), _review_F(1)))
    bad_scalars = (True, False, 0.0, FloatChild(1.0), '1', b'1', None,
                   complex(1, 0), IntChild(1), _review_F(1), FractionChild(1))
    for family in (None, True, 1, b'affine', StringChild('affine'), 'linear', '', [], ('affine',)):
        reject(fit, base, family)
    for rows in (None, 'abcd', b'abcd', {}, set(_review_X), iter(base),
                 ListChild(base), TupleChild(base), [], base[:3], base+[base[0]]):
        reject(fit, rows, 'affine')
    for bad_record in (None, 'ab', {'x': -2, 'y': -1}, ListChild((-2, -1)),
                       TupleChild((-2, -1)), (), (-2,), (-2, -1, 4)):
        reject(fit, [bad_record]+base[1:], 'affine')
    for x in bad_scalars + (0, -3, 3, 16):
        reject(fit, [(x, -1)]+base[1:], 'affine')
        reject(predict, good_model, x)
        reject(mse, good_model, [(x, 0)])
    for y in bad_scalars + (-17, 17, 1024):
        reject(fit, [(-2, y)]+base[1:], 'affine')
        reject(mse, good_model, [(1, y)])
    for x in _review_X:
        reject(fit, [(x, -1)]+base[1:], 'affine') if x != -2 else None
    reject(fit, [base[0]]*4, 'constant')

    invalid_parameters = (True, False, 0.0, '0', None, complex(0,0), IntChild(0),
                          FractionChild(0), 1025, -1025, _review_F(1025,1024),
                          _review_F(-1025,1024), _review_F(1,1025), _review_F(-1,1025),
                          [], {}, (), object(), 1 << 1000, -(1 << 1000))
    bad_models = [None, [], list(good_model), ListChild(good_model), TupleChild(good_model),
                  (), ('affine',), ('affine', (0,1), 3), ('linear',(0,1)),
                  (StringChild('affine'),(0,1)), (True,(0,1)), (b'affine',(0,1))]
    for family in _review_NAMES:
        length = _review_LENGTH[family]
        for p in (None, [0]*length, ListChild([0]*length), TupleChild([0]*length),
                  tuple([0]*(length-1)), tuple([0]*(length+1))):
            bad_models.append((family, p))
        for bad_value in invalid_parameters:
            for index in range(length):
                p = [0]*length
                p[index] = bad_value
                bad_models.append((family, tuple(p)))
    for model in bad_models:
        reject(predict, model, 1)
        reject(mse, model, [(1,0)])
    for rows in (None, '', {}, iter(base), ListChild(base), TupleChild(base), [], [base[0]]*33):
        reject(mse, good_model, rows)
    for record in (None, 'ab', (), (1,), (1,0,2), ListChild((1,0)), TupleChild((1,0))):
        reject(mse, good_model, [record])
    for name in ('signal', 'train_noise', 'fresh_noise'):
        for bad in bad_scalars + (-1, 2, 16, [], {}, (), object()):
            reject(report, **{name: bad})
    return counts


if __name__ == '__main__' and all(name in globals() for name in ('fit_family', 'predict', 'mse', 'risk_report')):
    print(_review_json.dumps({'blind_fixture': 'PASS', 'counts': run_blind_api_checks(globals())}, sort_keys=True))

# Additional implementation-conformance check after blind answers were frozen.
# This records public fit/mse calls; semantic results remain checked separately.
from collections import Counter as _mechanics_Counter
from itertools import product as _mechanics_product
from fractions import Fraction as _mechanics_F

_mechanics_original_fit, _mechanics_original_mse = fit_family, mse
_mechanics_cases = []
for _s, _n, _t in _mechanics_product((0,1),repeat=3):
    _noise = tuple(_mechanics_product((-1,1),repeat=4)) if _n else ((0,0,0,0),)
    _wanted_training = _mechanics_Counter((fam, tuple((x,_s*x+e) for x,e in zip((-2,-1,1,2), es)))
                                         for fam in ('constant','affine','lookup') for es in _noise)
    _wanted_evaluation = _mechanics_Counter()
    _got_training, _got_evaluation = _mechanics_Counter(), _mechanics_Counter()
    _clean = tuple((x,_s*x) for x in (-2,-1,1,2))
    _fresh = tuple((x,_s*x+e) for x in (-2,-1,1,2) for e in ((-1,1) if _t else (0,)))
    def _mechanics_fit(rows, family):
        model = _mechanics_original_fit(rows, family)
        canonical = tuple(sorted(tuple(row) for row in rows))
        _got_training[(family, canonical)] += 1
        for evaluation in (canonical, _clean, _fresh):
            _wanted_evaluation[(model, tuple(sorted(evaluation)))] += 1
        return model
    def _mechanics_mse(model, rows):
        _got_evaluation[(model, tuple(sorted(tuple(row) for row in rows)))] += 1
        return _mechanics_original_mse(model,rows)
    fit_family,mse = _mechanics_fit,_mechanics_mse
    try:
        _mechanics_report = risk_report(_s,_n,_t)
    finally:
        fit_family,mse = _mechanics_original_fit,_mechanics_original_mse
    assert _got_training == _wanted_training, ('training enumeration mechanics',_s,_n,_t)
    assert _got_evaluation == _wanted_evaluation, ('evaluation population mechanics',_s,_n,_t)
    _mechanics_cases.append({'switches':[_s,_n,_t], 'fit_calls':sum(_got_training.values()),
                             'mse_calls':sum(_got_evaluation.values()), 'fresh_rows':len(_fresh)})
print('INDEPENDENT_MECHANICS_PASS',_mechanics_cases)

# Post-release additions; frozen blind fixture remains byte-for-byte intact.
from fractions import Fraction as _supp_F
from itertools import product as _supp_product

def _supp_report_schema(report):
    assert type(report) is tuple and len(report) == 3
    for row,name in zip(report,('constant','affine','lookup')):
        assert type(row) is tuple and len(row)==4
        assert type(row[0]) is str and row[0]==name
        assert all(type(v) is _supp_F for v in row[1:]), 'default/positional report needs exact Fractions'

for _supp_args in ((), (1,), (1,1), (1,1,1)):
    _supp_report_schema(risk_report(*_supp_args))
for _supp_args in _supp_product((0,1),repeat=3):
    _supp_report_schema(risk_report(*_supp_args))
for _supp_kw in ({'signal':0},{'train_noise':0},{'fresh_noise':0},
                 {'signal':0,'train_noise':0},{'signal':0,'fresh_noise':0},
                 {'train_noise':0,'fresh_noise':0}):
    _supp_report_schema(risk_report(**_supp_kw))
# Valid record counts must not be treated like fit's four-point design.
for _supp_count in (1,2,3,4,5,31,32):
    try:
        _supp_value=mse(('constant',(_supp_F(0),)),[(1,1)]*_supp_count)
    except Exception as exc:
        raise AssertionError(('rejected valid evaluation length',_supp_count)) from exc
    assert type(_supp_value) is _supp_F and _supp_value==1
# A rejected input must not be consumed or rewritten first.
_supp_ticks=[]
def _supp_generator():
    _supp_ticks.append('iterated')
    yield (1,0)
for _supp_fn in (lambda r: fit_family(r,'affine'),lambda r:mse(('constant',(0,)),r)):
    try:
        _supp_fn(_supp_generator())
    except ValueError:
        pass
    else:
        raise AssertionError('generator accepted')
assert not _supp_ticks,'rejected generator was consumed'
print('INDEPENDENT_SUPPLEMENT_PASS')
