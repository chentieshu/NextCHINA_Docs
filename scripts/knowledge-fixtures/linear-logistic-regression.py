# Independent post-release tests based on frozen blind derivations; no filesystem access.
from decimal import Decimal as D, localcontext
from fractions import Fraction as F
from itertools import product as cartesian
from math import isclose as _ic, nextafter as _next, isfinite as _finite
import json as _json

_N = 0

def _check(ok, label):
    global _N
    assert ok, label
    _N += 1

def _near(a,b,label,atol=1e-12,rtol=1e-12):
    _check(_ic(a,float(b),abs_tol=atol,rel_tol=rtol),label)

def _bad(fn,label):
    try: fn()
    except ValueError: _check(True,label)
    except Exception as e: raise AssertionError(label+': wrong exception '+type(e).__name__) from e
    else: raise AssertionError(label+': accepted invalid input')

def _oracle(rows,b,w,precision=90):
    with localcontext() as c:
        c.prec=precision
        b,w=D(str(b)),D(str(w)); terms=[]; rs=[]; vs=[]
        for x,y in rows:
            z=b+w*x; t=(-abs(z)).exp()
            terms.append(max(z,0)-y*z+(1+t).ln())
            # Independently evaluate signed residual by the likelihood derivative.
            p=1/(1+(-z).exp())
            rs.append(p-y); vs.append(p*(1-p))
        n=D(len(rows))
        return (sum(terms)/n,(sum(rs)/n,sum(r*x for r,(x,y) in zip(rs,rows))/n),
                ((sum(vs)/n,sum(v*x for v,(x,y) in zip(vs,rows))/n),
                 (sum(v*x for v,(x,y) in zip(vs,rows))/n,sum(v*x*x for v,(x,y) in zip(vs,rows))/n)))

_A=((-1,0),(0,1),(1,3))
_B=((0,0),(0,0),(0,0),(0,1),(1,0),(1,1),(1,1),(1,1))
_C=((-1,0),(1,1))
_ALT=((-1,0),(-1,0),(-1,0),(-1,1),(2,0),(2,0),(2,1),(2,1))
_MISC=((-3,0),(-1,1),(0,0),(2,1),(4,1))
_m=fit_affine(_A); _l=fit_logistic(_B)
_check(_m==(F(4,3),F(3,2)),'exact affine optimum')
_check(tuple(affine_predict(_m,x) for x in (-1,0,1))==(F(-1,6),F(4,3),F(17,6)),'exact affine predictions')
_check(fit_affine(((-1,2),(0,-1),(1,4)))==(F(5,3),F(1)),'blind changed-affine oracle')
for _rows_a in (_A,((-8,-100),(8,100)),((-5,1),(-1,-3),(0,0),(2,9)),tuple((i%9-4,(i*7)%101-50) for i in range(32))):
    _fit=fit_affine(_rows_a)
    _rs=[affine_predict(_fit,x)-y for x,y in _rows_a]
    _check(sum(_rs)==sum(x*r for (x,y),r in zip(_rows_a,_rs))==0,'affine independent normal equations')
    _check(fit_affine(tuple(reversed(_rows_a)))==_fit,'affine permutation')
    for _q in (-8,-1,F(1,3),0,8,0.25):
        _pred=affine_predict(_fit,_q)
        if type(_q) is float: _near(_pred,float(_fit.b)+float(_fit.w)*_q,'affine float query')
        else: _check(type(_pred) is F and _pred==_fit.b+_fit.w*_q,'affine exact query type/value')
    for _db,_dw in cartesian((F(-2),F(0),F(2,3)),repeat=2):
        _lhs=sum((_fit.b+_db+(_fit.w+_dw)*x-y)**2 for x,y in _rows_a)
        _rhs=sum(r*r for r in _rs)+sum((_db+_dw*x)**2 for x,y in _rows_a)
        _check(_lhs==_rhs,'general exact complete-square certificate')
for _shift in (-2,2):
    _check(fit_affine(tuple((x,y+_shift) for x,y in _A))==(_m.b+_shift,_m.w),'affine response shift')
    _check(fit_affine(tuple((x+_shift,y) for x,y in _A))==(_m.b-_shift*_m.w,_m.w),'affine origin shift')
_check(fit_affine(_A*4)==_m,'affine replication')
with localcontext() as _ctx:
    _ctx.prec=90
    _ln3=D(3).ln(); _nll=D(4).ln()-D(3)*_ln3/4
for _rows_l,_bb,_ww,_jj in ((_B,-_ln3,2*_ln3,_nll),(_ALT,-2*_ln3/3,_ln3/3,(_nll+D(2).ln())/2)):
    _model=fit_logistic(_rows_l)
    _near(_model.b,_bb,'analytic logistic intercept',atol=1e-6)
    _near(_model.w,_ww,'analytic logistic slope',atol=1e-6)
    _near(_model.loss,_jj,'analytic logistic NLL')
    for _x in set(x for x,y in _rows_l):
        _p=D(1)/(1+(-_bb-_ww*_x).exp())
        _near(logistic_predict(_model,_x),_p,'analytic logistic group probability',atol=2e-7)
# Frozen explicit budget-0 and budget-1 formulae, independent of candidate evaluator.
for _rows_l,_b1,_w1 in ((_B,F(0),F(1,3)),(_C,F(0),F(1)),(_MISC,F(2,35),F(16,35))):
    _zero=fit_logistic(_rows_l,max_steps=0)
    _check((_zero.b,_zero.w,_zero.steps,_zero.stop)==(0,0,0,'budget'),'zero budget state')
    _one=fit_logistic(_rows_l,max_steps=1)
    _near(_one.b,_b1,'frozen first-update intercept',atol=1e-14)
    _near(_one.w,_w1,'frozen first-update slope',atol=1e-14)
    _check((_one.steps,_one.stop)==(1,'budget'),'first-update state and budget')
# Finite collection of changed inputs, labels, rank and separation patterns.
_datasets=[_B,_ALT,_C,_MISC,((0,0),(0,1)),((2,0),(2,1)),((0,1),(0,1)),((-8,0),(8,1))]
_datasets += [tuple((((i*3+j)%17)-8, (i+j+j//2)%2) for i in range(j+2)) for j in range(2,8)]
for _data in _datasets:
    _prior=None
    for _budget in (0,1,2,3,10,30):
        _state=fit_logistic(_data,max_steps=_budget)
        _oj,(_ob,_ow),_hess=_oracle(_data,_state.b,_state.w)
        _near(_state.loss,_oj,'independent returned loss')
        _near(_state.grad_norm,(_ob*_ob+_ow*_ow).sqrt(),'independent returned Euclidean norm')
        _check(0<=_state.steps<=_budget,'bounded actual update count')
        _check((_state.stop=='gradient')==(_state.grad_norm<=1e-9),'stopping predicate at returned state')
        if _state.stop=='budget': _check(_state.steps==_budget,'budget exhausts requested updates')
        if _prior is not None: _check(_state.loss<=_prior+1e-12,'bounded trajectory loss decreases')
        _prior=_state.loss
    # First step from integer sums, rather than a copied optimizer loop.
    _d=sum(1+x*x for x,y in _data)
    _b1=-4*sum(F(1,2)-y for x,y in _data)/_d
    _w1=-4*sum(x*(F(1,2)-y) for x,y in _data)/_d
    _first=fit_logistic(_data,max_steps=1)
    _near(_first.b,_b1,'general first-step intercept',atol=1e-14)
    _near(_first.w,_w1,'general first-step slope',atol=1e-14)
    for _b,_w in ((0,0),(0.7,-0.4),(-1.1,0.8)):
        _oj,(_ob,_ow),_hh=_oracle(_data,_b,_w)
        _jj,(_gb,_gw)=logistic_loss_gradient(_data,_b,_w)
        for _value,_expect in ((_jj,_oj),(_gb,_ob),(_gw,_ow)): _near(_value,_expect,'direct independent objective/gradient')
        _eps=1e-5
        _fd_b=(logistic_loss_gradient(_data,_b+_eps,_w)[0]-logistic_loss_gradient(_data,_b-_eps,_w)[0])/(2*_eps)
        _fd_w=(logistic_loss_gradient(_data,_b,_w+_eps)[0]-logistic_loss_gradient(_data,_b,_w-_eps)[0])/(2*_eps)
        _near(_gb,_fd_b,'loss finite-difference b',atol=1e-7,rtol=1e-6)
        _near(_gw,_fd_w,'loss finite-difference w',atol=1e-7,rtol=1e-6)
        for _column in (0,1):
            _plus=logistic_loss_gradient(_data,_b+(_eps if _column==0 else 0),_w+(_eps if _column==1 else 0))[1]
            _minus=logistic_loss_gradient(_data,_b-(_eps if _column==0 else 0),_w-(_eps if _column==1 else 0))[1]
            for _row in (0,1): _near((_plus[_row]-_minus[_row])/(2*_eps),_hh[_row][_column],'independent Hessian check',atol=1e-7,rtol=1e-6)
    if len(_data)<=16:
        _s=fit_logistic(_data,max_steps=17)
        for _variant in (tuple(reversed(_data)),_data*2):
            _v=fit_logistic(_variant,max_steps=17)
            for _field in ('b','w','loss','grad_norm'): _near(getattr(_s,_field),getattr(_v,_field),'order/replication invariant',atol=1e-10)
        _flip=fit_logistic(tuple((x,1-y) for x,y in _data),max_steps=17)
        _near(_flip.b,-_s.b,'label flip trajectory b');_near(_flip.w,-_s.w,'label flip trajectory w')
        _reflect=fit_logistic(tuple((-x,y) for x,y in _data),max_steps=17)
        _near(_reflect.b,_s.b,'feature reflection b');_near(_reflect.w,-_s.w,'feature reflection w')
# Exact zero-gradient max-budget validation and final-step priority.
for _tol in (1e-12,1e-3):
    _s=fit_logistic(((2,0),(2,1)),max_steps=5000,tol=_tol)
    _check((_s.b,_s.w,_s.steps,_s.stop)==(0,0,0,'gradient'),'accepted limits and initial stationarity')
_s0=fit_logistic(((0,0),(0,1)),max_steps=0)
_check(_s0.stop=='gradient' and _s0.steps==0,'zero-budget gradient priority')
_st=fit_logistic(_B,tol=1e-3)
_sr=fit_logistic(_B,max_steps=_st.steps,tol=1e-3)
_check(_sr.stop=='gradient' and _sr.steps==_st.steps,'final-allowed-update gradient priority')
# Threshold semantics: exact computational ties, nextafter, and no fit mutation.
_z=fit_logistic(_B,max_steps=0)
_check(classify(_z,0)==1,'zero-model exact tie chooses one')
for _x in (-8,F(1,2),8):
    _p=logistic_predict(_l,_x)
    _check(classify(_l,_x,_p)==1,'threshold exactly equals computed probability')
    _check(classify(_l,_x,_next(_p,1.0))==0,'threshold strictly above computed probability')
    _check(classify(_l,_x,_next(_p,0.0))==1,'threshold strictly below computed probability')
_check(tuple(classify(_l,x,0.8) for x in (0,1))==(0,0),'threshold transfer')
_saved=tuple(logistic_predict(_l,x) for x in (-1,0,1))
for _ys in cartesian((0,1),repeat=3):
    _check(tuple(logistic_predict(_l,x) for x,y in zip((-1,0,1),_ys))==_saved,'heldout relabeling isolation')
# Moderate, extreme and representable tiny scoring, from independent Decimal arithmetic.
for _zval,_yval in cartesian((-100000,-1000,-40,-1,0,1,40,1000,100000),(0,1)):
    with localcontext() as _ctx:
        _ctx.prec=550
        _zz=D(_zval); _oracle_loss=max(_zz,0)-_yval*_zz+(1+(-abs(_zz)).exp()).ln()
    _near(binary_logloss(_zval,_yval),_oracle_loss,'finite-logit stable loss')
_small=logistic_loss_gradient(((0,1),(0,1)),40,0)[1][0]
_check(_small<0,'saturated positive logit retains signed gradient')
with localcontext() as _ctx:
    _ctx.prec=90;_near(_small,-D(1)/(1+D(40).exp()),'tiny derivative relative precision',atol=1e-32,rtol=1e-12)
for _b,_w in cartesian((-10000,10000),repeat=2):
    _r=((8,0),(-8,1)); _got=logistic_loss_gradient(_r,_b,_w); _want=_oracle(_r,_b,_w)
    _near(_got[0],_want[0],'finite coefficient-bound loss')
    _near(_got[1][0],_want[1][0],'finite coefficient-bound gb');_near(_got[1][1],_want[1][1],'finite coefficient-bound gw')
# Accepted large-representation but finite Fraction queries; no universal time assertion.
for _q in (F(1,2**4096),F(2**4096-1,2**4096),F(-8),F(8),-8.0,8.0):
    _prediction=affine_predict(_m,_q)
    if type(_q) is F: _check(_prediction==_m.b+_m.w*_q,'accepted long Fraction exact prediction')
    _check(_finite(logistic_predict(_l,_q)),'accepted long Fraction probability')
# Exact record immutability, no stored row aliases, no caller mutation, wrong record types.
for _model in (_m,_l):
    try: _model.b=99
    except AttributeError: _check(True,'fitted state immutable')
    else: raise AssertionError('fitted state mutable')
for _train in (fit_affine,fit_logistic):
    _mutable=[list(row) for row in (_A if _train is fit_affine else _B)]
    _snapshot=[r[:] for r in _mutable]; _state=_train(_mutable)
    _check(_mutable==_snapshot,'training nonmutation')
    _mutable[0][1]=88
    _check(_state==_train(_snapshot),'state detached from rows')
_badrows=[[0,0],[1,1],[2,True]]; _snapshot=[r[:] for r in _badrows]
for _fn in (fit_affine,fit_logistic,lambda r:logistic_loss_gradient(r,0,0)):
    _bad(lambda:_fn(_badrows),'late invalid-row rejection');_check(_badrows==_snapshot,'failure nonmutation')
class _I(int): pass
class _F(float): pass
class _L(list): pass
class _T(tuple): pass
_invalid_rows=(None,{},'xx',[],[(0,0)],[(0,0)]*33,iter(((0,0),(1,1))),_L(((0,0),(1,1))),_T(((0,0),(1,1))),((0,0),_T((1,1))),((0,0),(1,)),((0,0),(1,1,1)),((0,0),(_I(1),1)),((0,0),(1,True)),((0,0),(True,1)),((0.0,0),(1,1)),((F(0),0),(1,1)),((9,0),(1,1)),((-9,0),(1,1)),((float('nan'),0),(1,1)),((0,float('inf')),(1,1)))
for _r in _invalid_rows:
    for _fn in (fit_affine,fit_logistic,lambda r:logistic_loss_gradient(r,0,0)):_bad(lambda:_fn(_r),'strict row shape/type/range')
for _r in (((2,1),(2,3),(2,5)),((-8,-101),(8,100)),((-8,-100),(8,101))):_bad(lambda:fit_affine(_r),'affine rank/target limits')
for _r in (((0,-1),(1,1)),((0,0),(1,2))):
    _bad(lambda:fit_logistic(_r),'logistic target bounds');_bad(lambda:logistic_loss_gradient(_r,0,0),'gradient target bounds')
_badscalars=(None,True,False,'1',complex(0),_I(1),_F(1),float('nan'),float('inf'),-float('inf'))
for _q in _badscalars+(F(8001,1000),_next(8.0,float('inf')),-9,10**1000):
    _bad(lambda:affine_predict(_m,_q),'query shape/type/value');_bad(lambda:logistic_predict(_l,_q),'logistic query shape/type/value')
for _wrong in (None,{},(0,1),_l):_bad(lambda:affine_predict(_wrong,0),'affine wrong model record')
for _wrong in (None,{},(0,1),_m):_bad(lambda:logistic_predict(_wrong,0),'logistic wrong model record')
for _v in _badscalars+(-1,5001,1.0,F(1)):_bad(lambda:fit_logistic(_B,max_steps=_v),'budget strict contract')
for _v in _badscalars+(0,-1,1e-13,_next(1e-3,1.0),F(1,1000)):_bad(lambda:fit_logistic(_B,tol=_v),'tol strict contract')
for _v in _badscalars+(0,1,-0.1,1.1,F(1,2)):_bad(lambda:classify(_l,0,_v),'threshold strict contract')
for _v in _badscalars+(10001,-10001,F(1,2)):
    _bad(lambda:logistic_loss_gradient(_B,_v,0),'b strict contract');_bad(lambda:logistic_loss_gradient(_B,0,_v),'w strict contract')
for _v in _badscalars+(100001,-100001,F(1,2)):_bad(lambda:binary_logloss(_v,0),'logit strict contract')
for _v in _badscalars+(2,-1,1.0,F(1)):_bad(lambda:binary_logloss(0,_v),'binary label strict contract')
print(_json.dumps({'independent_checks':_N,'datasets':len(_datasets),'status':'passed'},sort_keys=True))
