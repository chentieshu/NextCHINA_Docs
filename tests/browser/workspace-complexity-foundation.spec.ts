import { registerFoundationTests } from './foundation-reader';

registerFoundationTests({
  id: 'algorithm-complexity-cost-model', name: 'complexity foundation',
  title: '算法复杂度：先说清楚在数什么', concept: 'concept:big-o', parent: 'topic:optimization', leaf: 'complexity',
  sources: [
    'https://opendatastructures.org/ods-python/1_3_Mathematical_Background.html',
    'https://opendatastructures.org/ods-python/1_4_Model_Computation.html',
    'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/c6d8f06c6f11e3342633dec85498f551_MIT6_006S20_r01.pdf',
    'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/6b9b20992d8c6a0f3f10a34ff7878aa9_MIT6_006F11_lec02.pdf',
    'https://docs.python.org/3.14/library/bisect.html',
    'https://algs4.cs.princeton.edu/14analysis/',
    'https://arxiv.org/html/2205.14135v2',
  ],
  headings: ['1. 先固定任务，再比较成本', '3. O、Ω、Θ 说的是界；最好、最坏说的是输入',
    '5. 八个数的完整账单，和一个明示的平均分布', '6. 准备、查询、输出、空间，要分开结账',
    '7. 可运行实验：计数器只负责一件事', '8. 把账单带到矩阵和注意力', '9. 自测：把省略的条件补回来', '来源、版本与范围'],
  claims: ['找到插入位置不等于找到相等元素', '关键比较次数', '不会重新扫描或复制数组',
    '不是设备上的计时基准', '固定数组未必能实现全部秩', '同用二分查找', 'uniform-gap means', '44/9 29/9'],
  formulas: ['C_{\\mathrm{linear}}(n,r)=\\min(r+1,n)', 'D(n)=(1+D(m))', '\\mathbb E[C_{\\mathrm{linear}}]=44/9', 'n^2d_k'],
  tableRows: [9, 4],
  onward: [['branch:llm:math/probability', 'llm-conditional-probability'], ['branch:llm:math/tensor-shapes', 'llm-tensor-shapes'],
    ['branch:llm:mechanisms/attention', 'llm-attention-calculation'], ['branch:llm:inference/kv-cache', 'llm-kv-cache']],
  backlinks: ['llm-attention-calculation'],
});
