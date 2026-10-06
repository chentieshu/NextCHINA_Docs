# Fresh independent reviewer suffix, derived before author release.
# No repository/runtime file imports; no author helper is replaced.
"""Independent reference derived only from the frozen premises packet.

No author implementation, scope, manuscript, source memo or tests were read.
All arithmetic is integral or Fraction. This module is deliberately independent.
"""
from fractions import Fraction


def _review_reference_integer(x, lo, hi):
    return type(x) is int and lo <= x <= hi


def reference_trace(record):
    fields = {"id", "sent_ms", "chunks", "end_ms", "status"}
    if type(record) is not dict or set(record) != fields:
        raise ValueError("record shape")
    name = record["id"]
    if type(name) is not str or not 1 <= len(name) <= 24:
        raise ValueError("id shape")
    if any(ch not in "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-" for ch in name):
        raise ValueError("id alphabet")
    send, end, state, chunks = (record[k] for k in ("sent_ms", "end_ms", "status", "chunks"))
    if not _review_reference_integer(send, 0, 10**9) or not _review_reference_integer(end, 0, 10**9) or end <= send:
        raise ValueError("request times")
    if type(state) is not str or state not in ("ok", "error", "timeout"):
        raise ValueError("state")
    if type(chunks) not in (list, tuple) or len(chunks) > 64:
        raise ValueError("chunks shape")
    if state == "ok" and not chunks:
        raise ValueError("success without content")
    times, counts = [], []
    previous = send
    for chunk in chunks:
        if type(chunk) not in (list, tuple) or len(chunk) != 2:
            raise ValueError("chunk shape")
        time, count = chunk
        if not _review_reference_integer(time, 0, 10**9) or not previous < time <= end:
            raise ValueError("chunk time")
        if not _review_reference_integer(count, 1, 4096):
            raise ValueError("chunk count")
        times.append(time)
        counts.append(count)
        previous = time
    total = sum(counts)
    if total > 65536:
        raise ValueError("total count")
    multiple = len(times) >= 2
    duration = times[-1] - times[0] if multiple else None
    subsequent = sum(counts[1:])
    successful = state == "ok"
    return {
        "id": name, "status": state, "sent_ms": send, "end_ms": end,
        "observed_ms": end - send, "tokens": total,
        "ttft_ms": times[0] - send if times else None,
        "content_ms": times[-1] - send if times else None,
        "post_ms": duration, "after_first_tokens": subsequent,
        "gaps_ms": tuple(b-a for a,b in zip(times, times[1:])),
        "whole_rate": Fraction(1000*total, end-send) if successful else None,
        "post_rate": Fraction(1000*subsequent, duration) if successful and multiple else None,
        "mean_token_gap_ms": Fraction(duration, len(times)-1)
            if successful and multiple and all(c == 1 for c in counts) else None,
    }


def reference_summary(records, window_start_ms, window_end_ms):
    if type(records) not in (list, tuple) or not 1 <= len(records) <= 64:
        raise ValueError("cohort shape")
    if not _review_reference_integer(window_start_ms, 0, 10**9) or not _review_reference_integer(window_end_ms, 0, 10**9):
        raise ValueError("window types/bounds")
    if window_end_ms <= window_start_ms:
        raise ValueError("window duration")
    metrics = [reference_trace(record) for record in records]
    if len({m["id"] for m in metrics}) != len(metrics):
        raise ValueError("duplicate id")
    if any(m["sent_ms"] < window_start_ms or m["end_ms"] > window_end_ms for m in metrics):
        raise ValueError("not enclosed")
    good = [m for m in metrics if m["status"] == "ok"]
    eligible = [m for m in good if m["post_ms"] is not None]
    elapsed = window_end_ms - window_start_ms
    tokens = sum(m["tokens"] for m in good)
    return {
        "window_ms": elapsed, "attempts": len(metrics), "successes": len(good),
        "errors": sum(m["status"] == "error" for m in metrics),
        "timeouts": sum(m["status"] == "timeout" for m in metrics),
        "ok_tokens": tokens,
        "partial_tokens": sum(m["tokens"] for m in metrics if m["status"] != "ok"),
        "ok_tokens_per_s": Fraction(1000*tokens, elapsed),
        "ok_requests_per_s": Fraction(1000*len(good), elapsed),
        "success_ms": tuple(m["observed_ms"] for m in good),
        "mean_post_rate": sum((m["post_rate"] for m in eligible), Fraction()) / len(eligible)
            if eligible else None,
        "pooled_post_rate": Fraction(1000*sum(m["after_first_tokens"] for m in eligible),
                                     sum(m["post_ms"] for m in eligible))
            if eligible else None,
    }


def reference_quantile(samples, q):
    if type(samples) not in (list, tuple) or not 1 <= len(samples) <= 256:
        raise ValueError("samples shape")
    if any(not _review_reference_integer(x, 0, 10**9) for x in samples):
        raise ValueError("sample values")
    if type(q) is not Fraction or not 0 < q <= 1:
        raise ValueError("quantile")
    rank = (len(samples)*q.numerator + q.denominator - 1) // q.denominator
    return sorted(samples)[rank-1]


def record(name, send, chunks, end, status="ok"):
    return dict(id=name, sent_ms=send, chunks=chunks, end_ms=end, status=status)


FIXTURES = {
    "A": record("A", 0, [(100,1),(200,1),(300,1),(500,1)], 500),
    "B": record("B", 100, [(400,1),(500,1),(600,1)], 600),
    "S": record("S", 20, [(120,1)], 120),
    "C": record("C", 0, [(100,3),(400,2)], 400),
    "D": record("D", 0, [(100,1),(200,1)], 260),
    "T": record("T", 0, [], 5000, "timeout"),
    "E": record("E", 10, [(60,2)], 90, "error"),
}


def shift(record_, offset):
    return record(record_["id"], record_["sent_ms"]+offset,
                  [(t+offset,c) for t,c in record_["chunks"]], record_["end_ms"]+offset,
                  record_["status"])


def scale(record_, factor):
    return record(record_["id"], record_["sent_ms"]*factor,
                  [(t*factor,c) for t,c in record_["chunks"]], record_["end_ms"]*factor,
                  record_["status"])

"""Frozen black-box checks; the author implementation is not an oracle.

Pass the three candidate API callables to run_suite after artifact release.
Before release this file is run only against the independent reference.
"""
from copy import deepcopy
from fractions import Fraction as F
from itertools import permutations
R = FIXTURES


class IntSubclass(int): pass
class StrSubclass(str): pass
class ListSubclass(list): pass
class TupleSubclass(tuple): pass
class DictSubclass(dict): pass
class FractionSubclass(F): pass


def strict_equal(actual, expected):
    assert type(actual) is type(expected), (type(actual), type(expected), actual, expected)
    assert actual == expected, (actual, expected)
    if type(expected) is dict:
        for key in expected:
            strict_equal(actual[key], expected[key])
    elif type(expected) in (tuple, list):
        for a,e in zip(actual, expected): strict_equal(a,e)


def changed(source, **updates):
    result = deepcopy(source)
    result.update(updates)
    return result


def expected_trace(name, observed, tokens, ttft, content, post, after, gaps, whole, rate, mean):
    source = R[name]
    return dict(id=name, status=source["status"], sent_ms=source["sent_ms"],
                end_ms=source["end_ms"], observed_ms=observed, tokens=tokens,
                ttft_ms=ttft, content_ms=content, post_ms=post,
                after_first_tokens=after, gaps_ms=gaps, whole_rate=whole,
                post_rate=rate, mean_token_gap_ms=mean)


EXPECTED = {
    "A": expected_trace("A",500,4,100,500,400,3,(100,100,200),F(8),F(15,2),F(400,3)),
    "B": expected_trace("B",500,3,300,500,200,2,(100,100),F(6),F(10),F(100)),
    "S": expected_trace("S",100,1,100,100,None,0,(),F(10),None,None),
    "C": expected_trace("C",400,5,100,400,300,2,(300,),F(25,2),F(20,3),None),
    "D": expected_trace("D",260,2,100,200,100,1,(100,),F(100,13),F(10),F(100)),
    "T": expected_trace("T",5000,0,None,None,None,0,(),None,None,None),
    "E": expected_trace("E",80,2,50,50,None,0,(),None,None,None),
}


def run_suite(trace_metrics, summarize, nearest_rank):
    passed = {"positive":0, "rejections":0}

    def check(fn, args, expected):
        original = deepcopy(args)
        result = fn(*args)
        strict_equal(result, expected)
        strict_equal(args, original)
        if type(result) is dict:
            assert all(result is not x for x in args)
        passed["positive"] += 1
        return result

    def reject(fn, args):
        original = deepcopy(args)
        try:
            fn(*args)
        except ValueError:
            pass
        except Exception as error:
            raise AssertionError(("expected ValueError",type(error),str(error),args)) from error
        else:
            raise AssertionError(("invalid input accepted",args))
        assert args == original, ("mutation on failure",args,original)
        passed["rejections"] += 1

    for name in EXPECTED:
        check(trace_metrics, (deepcopy(R[name]),), EXPECTED[name])

    main = dict(window_ms=600, attempts=2, successes=2, errors=0, timeouts=0,
                ok_tokens=7, partial_tokens=0, ok_tokens_per_s=F(35,3),
                ok_requests_per_s=F(10,3), success_ms=(500,500),
                mean_post_rate=F(35,4), pooled_post_rate=F(25,3))
    check(summarize, ([R["A"],R["B"]],0,600), main)
    wide = dict(main,window_ms=1000,ok_tokens_per_s=F(7),ok_requests_per_s=F(2))
    check(summarize, ([R["A"],shift(R["B"],400)],0,1000), wide)
    check(summarize, ([R["A"],R["B"]],0,1000), wide)
    mixed = dict(main,window_ms=5000,attempts=4,errors=1,timeouts=1,partial_tokens=2,
                 ok_tokens_per_s=F(7,5),ok_requests_per_s=F(2,5))
    check(summarize, ([R[x] for x in ("A","B","T","E")],0,5000), mixed)
    failed = dict(window_ms=5000,attempts=2,successes=0,errors=1,timeouts=1,
                  ok_tokens=0,partial_tokens=2,ok_tokens_per_s=F(0),ok_requests_per_s=F(0),
                  success_ms=(),mean_post_rate=None,pooled_post_rate=None)
    check(summarize, ([R["T"],R["E"]],0,5000), failed)

    L = [record(f"L{i:02}",0,[(50,1)],50) for i in range(1,20)]
    L.append(record("L20",0,[(1050,1)],1050))
    U = [record(f"U{i:02}",0,[(110,1)],110) for i in range(1,21)]
    ls = dict(window_ms=1050,attempts=20,successes=20,errors=0,timeouts=0,
              ok_tokens=20,partial_tokens=0,ok_tokens_per_s=F(400,21),ok_requests_per_s=F(400,21),
              success_ms=(50,)*19+(1050,),mean_post_rate=None,pooled_post_rate=None)
    check(summarize,(L,0,1050),ls)
    check(summarize,(U,0,110),dict(ls,window_ms=110,ok_tokens_per_s=F(2000,11),
                                 ok_requests_per_s=F(2000,11),success_ms=(110,)*20))
    check(summarize,(L+[R["T"]],0,5000),dict(ls,window_ms=5000,attempts=21,timeouts=1,
                                          ok_tokens_per_s=F(4),ok_requests_per_s=F(4)))
    for samples, mean, p95, p99 in [([50]*19+[1050],F(100),50,1050),([110]*20,F(110),110,110)]:
        assert F(sum(samples),len(samples)) == mean
        check(nearest_rank,(samples,F(19,20)),p95)
        check(nearest_rank,(samples,F(99,100)),p99)
    check(nearest_rank,([50]*19,F(99,100)),50)
    check(nearest_rank,([1050],F(99,100)),1050)
    assert F(50+1050,2) == 550
    assert F(19*50+1050,20) == 100

    for name,source in R.items():
        for offset in (1,79,10000):
            expected = dict(EXPECTED[name],sent_ms=source["sent_ms"]+offset,
                            end_ms=source["end_ms"]+offset)
            check(trace_metrics,(shift(source,offset),),expected)
        for factor in (2,3,17):
            expected = dict(EXPECTED[name])
            for key in ("sent_ms","end_ms","observed_ms","ttft_ms","content_ms","post_ms","mean_token_gap_ms"):
                if expected[key] is not None: expected[key] *= factor
            expected["gaps_ms"] = tuple(g*factor for g in expected["gaps_ms"])
            for key in ("whole_rate","post_rate"):
                if expected[key] is not None: expected[key] /= factor
            check(trace_metrics,(scale(source,factor),),expected)
    check(summarize,([shift(R["A"],500),shift(R["B"],500)],500,1100),main)
    check(summarize,([scale(R["A"],3),scale(R["B"],3)],0,1800),
          dict(main,window_ms=1800,success_ms=(1500,1500),ok_tokens_per_s=F(35,9),
               ok_requests_per_s=F(10,9),mean_post_rate=F(35,12),pooled_post_rate=F(25,9)))

    varied = [R["A"],R["C"],R["D"],R["E"],R["T"]]
    vary_summary = dict(window_ms=5000,attempts=5,successes=3,errors=1,timeouts=1,
        ok_tokens=11,partial_tokens=2,ok_tokens_per_s=F(11,5),ok_requests_per_s=F(3,5),
        success_ms=(500,400,260),mean_post_rate=F(145,18),pooled_post_rate=F(15,2))
    for order in permutations(varied):
        expected = dict(vary_summary,success_ms=tuple(r["end_ms"]-r["sent_ms"] for r in order if r["status"]=="ok"))
        check(summarize,(order,0,5000),expected)
    check(trace_metrics,(changed(R["A"],chunks=[(100,1),(500,3)]),),
          dict(EXPECTED["A"],gaps_ms=(400,),mean_token_gap_ms=None))
    check(trace_metrics,(changed(R["A"],chunks=[(100,2),(500,2)]),),
          dict(EXPECTED["A"],gaps_ms=(400,),after_first_tokens=2,post_rate=F(5),mean_token_gap_ms=None))
    check(trace_metrics,(changed(R["D"],end_ms=300),),
          dict(EXPECTED["D"],end_ms=300,observed_ms=300,whole_rate=F(20,3)))
    partial = changed(R["A"],status="error",end_ms=1000)
    check(trace_metrics,(partial,),dict(EXPECTED["A"],status="error",end_ms=1000,
                                      observed_ms=1000,whole_rate=None,post_rate=None,mean_token_gap_ms=None))
    check(trace_metrics,(changed(R["S"],chunks=[(120,9)]),),
          dict(EXPECTED["S"],tokens=9,whole_rate=F(90)))
    check(summarize,([R["S"]],20,120),dict(window_ms=100,attempts=1,successes=1,errors=0,
          timeouts=0,ok_tokens=1,partial_tokens=0,ok_tokens_per_s=F(10),ok_requests_per_s=F(10),
          success_ms=(100,),mean_post_rate=None,pooled_post_rate=None))

    # Quantile reference is independent counting: find the first sample value
    # with cumulative frequency >= q*n; do not use the implementation's ceil formula.
    for n in range(1,33):
        samples = [(i*11)%7 for i in range(n)]
        qs = {F(1),F(1,10**9)} | {F(k,n) for k in range(1,n+1)}
        qs |= {F(2*k+1,2*n) for k in range(n)}
        previous = -1
        for q in sorted(qs):
            expected = min(v for v in set(samples) if sum(x<=v for x in samples)*q.denominator >= n*q.numerator)
            result = check(nearest_rank,(samples,q),expected)
            assert previous <= result
            previous = result
            check(nearest_rank,(list(reversed(samples)),q),expected)
            check(nearest_rank,([x*7 for x in samples],q),expected*7)
    check(nearest_rank,(tuple([0]*255+[10**9]),F(1)),10**9)

    # Accepted limits and exact containers.
    accepted = [record("a",0,[(1,1)],1),record("Z"*24,0,((10**9,4096),),10**9),
                record("aZ_09-",0,[[i,1024] for i in range(1,65)],64),
                record("maxcount",0,[(i,4096) for i in range(1,17)],16)]
    for source in accepted:
        check(trace_metrics,(source,),reference_trace(source))
    maximum = [record(str(i),0,[(1,1)],1) for i in range(64)]
    check(summarize,(tuple(maximum),0,1),dict(window_ms=1,attempts=64,successes=64,errors=0,
        timeouts=0,ok_tokens=64,partial_tokens=0,ok_tokens_per_s=F(64000),ok_requests_per_s=F(64000),
        success_ms=(1,)*64,mean_post_rate=None,pooled_post_rate=None))

    bad_records = [None,[],(),"record",DictSubclass(R["A"])]
    for key in R["A"]:
        item = deepcopy(R["A"]); del item[key]; bad_records.append(item)
    bad_records += [changed(R["A"],extra=1)]
    for v in (None,True,1,"","x"*25,"a b","a.b","a/b","é","中",StrSubclass("A")):
        bad_records.append(changed(R["A"],id=v))
    for key in ("sent_ms","end_ms"):
        for v in (None,True,1.0,"1",-1,10**9+1,IntSubclass(1)):
            bad_records.append(changed(R["A"],**{key:v}))
    bad_records += [changed(R["A"],end_ms=0),changed(R["A"],sent_ms=500),changed(R["A"],sent_ms=600)]
    for v in (None,True,1,"OK","failed","",StrSubclass("ok")):
        bad_records.append(changed(R["A"],status=v))
    for v in (None,{},"",ListSubclass([]),TupleSubclass(()),[],[(i,1) for i in range(1,66)]):
        bad_records.append(changed(R["A"],chunks=v))
    for v in (None,{},"",(),(100,),(100,1,1),ListSubclass([100,1]),TupleSubclass((100,1))):
        bad_records.append(changed(R["A"],chunks=[v]))
    for v in (None,True,1.0,"100",IntSubclass(100),-1,0,501):
        bad_records.append(changed(R["A"],chunks=[(v,1)]))
    for v in (None,True,1.0,"1",IntSubclass(1),-1,0,4097):
        bad_records.append(changed(R["A"],chunks=[(100,v)]))
    bad_records += [changed(R["A"],chunks=[(100,1),(100,1)]),
                    changed(R["A"],chunks=[(200,1),(100,1)]),
                    changed(R["A"],chunks=[(i,4096) for i in range(1,18)])]
    for source in bad_records:
        reject(trace_metrics,(source,))
        # Valid prefix must not turn a malformed cohort into partial success.
        reject(summarize,([R["B"],source],0,10**9))
    for v in (None,{},"",ListSubclass([R["A"]]),TupleSubclass((R["A"],)),[],[R["A"]]*65):
        reject(summarize,(v,0,5000))
    reject(summarize,([R["A"],R["A"]],0,500))
    reject(summarize,([R["A"],changed(R["E"],id="A")],0,500))
    for v in (None,True,0.0,"0",-1,10**9+1,IntSubclass(0)):
        reject(summarize,([R["A"]],v,5000))
        reject(summarize,([R["A"]],0,v))
    for start,end in ((0,0),(500,0),(1,500),(0,499),(11,90),(0,4999)):
        source = R["E"] if (start,end)==(11,90) else R["T"] if end==4999 else R["A"]
        reject(summarize,([source],start,end))
    invalid_failure = changed(R["T"],chunks=[(0,1)])
    reject(summarize,([R["A"],invalid_failure],0,5000))
    for v in (None,{},"",ListSubclass([1]),TupleSubclass((1,)),[],[0]*257):
        reject(nearest_rank,(v,F(1,2)))
    for v in (None,True,1.0,"1",-1,10**9+1,IntSubclass(1)):
        reject(nearest_rank,([v],F(1,2)))
    for v in (None,True,1,0.99,FractionSubclass(1,2),F(0),F(-1,2),F(101,100)):
        reject(nearest_rank,([1],v))
    return passed



_review_counts = run_suite(trace_metrics, summarize, nearest_rank)
print('INDEPENDENT REVIEW:', _review_counts)
# Post-release supplement uses the unchanged pre-release independent reference.
# It expands valid-domain coverage; no candidate result supplies an oracle.
from itertools import combinations as _review_combinations, product as _review_product

_review_generated_traces = 0
for _review_send in (0, 7):
    for _review_size in range(4):
        for _review_deltas in _review_combinations(range(1, 6), _review_size):
            for _review_counts_tuple in _review_product((1, 2), repeat=_review_size):
                for _review_status in ("ok", "error", "timeout"):
                    if _review_status == "ok" and _review_size == 0:
                        continue
                    for _review_delay in (0, 4):
                        _review_end = _review_send + (_review_deltas[-1] if _review_deltas else 1) + _review_delay
                        _review_input = record("independent", _review_send,
                            [(_review_send+d,c) for d,c in zip(_review_deltas,_review_counts_tuple)],
                            _review_end, _review_status)
                        _review_before = deepcopy(_review_input)
                        strict_equal(trace_metrics(_review_input),reference_trace(_review_input))
                        strict_equal(_review_input,_review_before)
                        _review_generated_traces += 1

_review_generated_cohorts = 0
for _review_order in permutations(tuple(R.values()),3):
    _review_before = deepcopy(_review_order)
    strict_equal(summarize(_review_order,0,5000),reference_summary(_review_order,0,5000))
    strict_equal(_review_order,_review_before)
    _review_generated_cohorts += 1

# Returned dictionaries are fresh and changing one does not contaminate inputs
# or later calls. Timing/count tuples contain only immutable scalar values.
_review_one = trace_metrics(R["A"])
_review_two = trace_metrics(R["A"])
assert _review_one is not _review_two
_review_one["tokens"] = -1
strict_equal(trace_metrics(R["A"]),EXPECTED["A"])
_review_one = summarize([R["A"],R["B"]],0,600)
_review_two = summarize([R["A"],R["B"]],0,600)
assert _review_one is not _review_two
_review_one["success_ms"] = ()
assert _review_two["success_ms"] == (500,500)

# Invalid iterators are rejected without consuming them or coercing to a list.
for _review_target in ("chunks","records","samples"):
    _review_stream = iter(("first","second"))
    try:
        if _review_target == "chunks":
            trace_metrics(changed(R["A"],chunks=_review_stream))
        elif _review_target == "records":
            summarize(_review_stream,0,5000)
        else:
            nearest_rank(_review_stream,F(1,2))
    except ValueError:
        pass
    else:
        raise AssertionError("iterator accepted")
    assert next(_review_stream) == "first"

assert nearest_rank([9,1],F(1,10**100)) == 1
_review_b_content_shift = changed(R["B"],chunks=[(450,1),(550,1),(650,1)],end_ms=650)
strict_equal(trace_metrics(_review_b_content_shift),dict(EXPECTED["B"],
    end_ms=650, observed_ms=550, ttft_ms=350, content_ms=550, whole_rate=F(60,11)))
assert F(8179,10000) < F(99,100)**20 < F(818,1000)
assert F(80+100,2) == 90 and F(2*1000,120) == F(50,3)
assert nearest_rank([80,100],F(95,100)) == nearest_rank([80,100],F(99,100)) == 100
print("SUPPLEMENT:", _review_generated_traces, "traces;", _review_generated_cohorts,
      "cohorts; 3 iterator rejections; freshness, T1 and non-generative checks")
