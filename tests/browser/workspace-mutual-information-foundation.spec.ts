import { registerFoundationTests } from './foundation-reader';

registerFoundationTests({
  id: 'mutual-information', name: 'mutual information foundation',
  title: '互信息：已知一个变量，平均少了多少不确定性？', concept: 'concept:mutual-information', parent: 'topic:information-theory', leaf: 'mutual-information',
  sources: ['https://ee.stanford.edu/~gray/it.pdf',
    'https://ocw.mit.edu/courses/6-441-information-theory-spring-2016/184197ca5d5418da2415d37e929860b9_MIT6_441S16_chapter_2.pdf',
    'https://ocw.mit.edu/courses/6-441-information-theory-spring-2016/pages/lecture-notes/',
    'https://sites.stat.columbia.edu/liam/research/pubs/info_est-nc.pdf',
    'https://docs.python.org/3.14/library/math.html', 'https://docs.python.org/3.14/library/fractions.html'],
  headings: ['1. 先把共同出现的概率写全', '“平均”不能省：某次观察反而会增加熵',
    '3. 同一件事，也可以看成联合分布与独立分布的 KL', '零概率不需要补一个小数', '4. 把表示碰撞写成一张概率表',
    '两两独立，仍可能藏着共同约束', '6. 可运行实验：精确分布与近似对数分开',
    '7. 把频数代进去，问题就从计算变成了估计', '8. 迁移练习与继续阅读', '来源、版本与验证边界'],
  claims: ['不是采样得到的频数', '非负性属于完整的平均', '不计算它的对数', '不能把三图配对档案当成等概率数据集',
    '并不证明真实灰度转换或 SimCLR 必然抹掉颜色', '不是交换 KL 的两个分布', '精确判据依然返回',
    '并非所有输入上的严格误差定理', '没有实现估计器、误差区间或因果识别'],
  formulas: ['H(X\\mid Y)=\\sum', 'I(X;Y)&=D_{\\mathrm{KL}}', 'I(C;G)=0', 'A\\mathbin{\\mathrm{XOR}}B'],
  tableRows: [3, 3, 3, 4],
  onward: [['branch:llm:math/probability', 'llm-conditional-probability'], ['branch:llm:math/objectives', 'llm-entropy-cross-entropy'],
    ['branch:ai-overview:orientation/learning-signals', 'unsupervised-self-supervised-learning']],
  backlinks: ['llm-entropy-cross-entropy', 'unsupervised-self-supervised-learning'],
  unfilled: ['concept:compression', 'concept:contrastive-learning'],
});
