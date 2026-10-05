import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadGarden, repositoryRoot } from './validate-garden.mjs';
import { attachTopicHubs, branchId } from './build-topic-hubs.mjs';
import { normalizeNetwork } from '../src/features/workspace/networkLayout.js';
import { normalizeNetworkSettings } from '../src/features/workspace/networkPreferences.js';

const INVENTORY_FILE = 'content/garden/content-inventory.json';
const TRACKED_DIRECTORY = 'docs/content-inventory';
const TRACKED_INDEX = `${TRACKED_DIRECTORY}/README.md`;
const CSV_BYTE_BUDGET = 12000;
const DEFAULT_AS_OF = '2026-10-05';
const BASELINE = {
  commit: '91a80ffef7f50e3a1cc7ef7ea3a506b0a60c6dc2', asOf: '2026-10-05',
  modelNodes: 603, visibleNodes: 602, concepts: 380, topics: 77, domains: 14, hubs: 18, branches: 113,
  publishedPages: 28, directlyBoundNodes: 90, directlyBoundConcepts: 48,
  independentArticles: 5, independentConcepts: 15, independentBranchPlacements: 5,
  independentArticleIds: ['llm-attention-calculation', 'llm-kv-cache', 'llm-softmax-temperature', 'llm-tokenization', 'llm-training-loop'],
  topology: { conceptsWithoutNonTreeEdges: 270, topicsWithoutNonTreeEdges: 72, navigationEdges: 602, globalPrerequisites: 10, routeLocalPrerequisites: 0, mixedRelatedEdges: 133, hubIdentityLinksWithinRelated: 18, branchReferencesWithinRelated: 70, genuineEditorialRelated: 45 },
  note: 'Historical pre-improvement baseline measured with loadGarden, attachTopicHubs and production normalizeNetwork; never recomputed from the working tree.'
};

// Frozen original identities, rebuilt from the exact 91a80ff Git tree. No Git dependency at audit time.
const BASELINE_NODE_IDS = ["branch:agents:products","branch:agents:rankings","branch:ai-overview:orientation","branch:assistants:products","branch:audio:applications","branch:audio:orientation","branch:coding:products","branch:embedding:orientation","branch:evidence:sources","branch:image-generation:applications","branch:image-generation:mechanisms","branch:llm:applications","branch:llm:applications/agents","branch:llm:applications/assistants","branch:llm:applications/coding","branch:llm:applications/industries","branch:llm:applications/integration","branch:llm:applications/rag","branch:llm:inference","branch:llm:inference/deployment","branch:llm:inference/generation-loop","branch:llm:inference/kv-cache","branch:llm:inference/kv-cache/memory","branch:llm:inference/kv-cache/prefix","branch:llm:inference/kv-cache/read-write","branch:llm:inference/optimization","branch:llm:inference/reasoning-runtime","branch:llm:inference/request","branch:llm:inference/serving","branch:llm:math","branch:llm:math/derivatives","branch:llm:math/objectives","branch:llm:math/probability","branch:llm:math/representations","branch:llm:math/softmax","branch:llm:math/tensor-shapes","branch:llm:math/tokenization","branch:llm:mechanisms","branch:llm:mechanisms/architectures","branch:llm:mechanisms/attention","branch:llm:mechanisms/attention/heads","branch:llm:mechanisms/attention/mask","branch:llm:mechanisms/attention/normalization","branch:llm:mechanisms/attention/qkv","branch:llm:mechanisms/attention/scaling","branch:llm:mechanisms/attention/scores","branch:llm:mechanisms/attention/weighted-values","branch:llm:mechanisms/experts","branch:llm:mechanisms/feedforward","branch:llm:mechanisms/output","branch:llm:mechanisms/position","branch:llm:models","branch:llm:models/evolution","branch:llm:models/families","branch:llm:models/model-detail","branch:llm:models/openness","branch:llm:models/specifications","branch:llm:orientation","branch:llm:orientation/definition","branch:llm:orientation/learning-map","branch:llm:orientation/paradigms","branch:llm:orientation/training-inference","branch:llm:pricing","branch:llm:pricing/api","branch:llm:pricing/offers","branch:llm:pricing/self-hosting","branch:llm:pricing/subscription","branch:llm:pricing/task-cost","branch:llm:rankings","branch:llm:rankings/capabilities","branch:llm:rankings/composite","branch:llm:rankings/efficiency","branch:llm:rankings/methodology","branch:llm:rankings/specialized","branch:llm:rankings/system-results","branch:llm:rankings/text-preference","branch:llm:research","branch:llm:research/claims","branch:llm:research/frontiers","branch:llm:research/papers","branch:llm:research/unknowns","branch:llm:research/updates","branch:llm:safety","branch:llm:safety/attacks","branch:llm:safety/failure","branch:llm:safety/operations","branch:llm:safety/rights","branch:llm:safety/scope","branch:llm:training","branch:llm:training/adaptation","branch:llm:training/alignment","branch:llm:training/budget","branch:llm:training/data","branch:llm:training/loop","branch:llm:training/not-training","branch:llm:training/samples","branch:llm:tutorials","branch:llm:tutorials/attention-lab","branch:llm:tutorials/evaluation-lab","branch:llm:tutorials/first-steps","branch:llm:tutorials/system-lab","branch:llm:tutorials/token-lab","branch:llm:tutorials/training-lab","branch:music:applications","branch:music:orientation","branch:platforms:products","branch:spatial:applications","branch:video-production:workflow","branch:video:applications","branch:video:orientation","branch:video:tutorials","branch:vlm:orientation","branch:world-models:orientation","concept:3d-tools","concept:a2a","concept:aa-index","concept:ablation","concept:access-controls","concept:accessibility","concept:accuracy-f1","concept:action-conditioning","concept:action-token","concept:activation","concept:actor-critic","concept:adamw","concept:adversarial-input","concept:agent","concept:agent-lab","concept:agent-loop","concept:agriculture-ai","concept:anomaly-detection","concept:anthropomorphism","concept:api-contract","concept:api-first-request","concept:api-pricing","concept:api-providers","concept:art-ai","concept:artificial-intelligence","concept:asr","concept:asset-consistency","concept:assistant-products","concept:astar","concept:attention-lab","concept:audio-model","concept:audio-tools","concept:auditability","concept:autodiff","concept:autoregression","concept:backpropagation","concept:batch-epoch","concept:bayes-rule","concept:bayesian-network","concept:behavior-cloning","concept:bellman-equation","concept:benchmark-protocol","concept:bias-harm","concept:big-o","concept:biology-ai","concept:bm25","concept:business-model","concept:calibration","concept:capability-vs-reliability","concept:capacity-planning","concept:causal-generalization","concept:causal-mask","concept:causal-model","concept:cfg","concept:chain-rule","concept:checkpoint","concept:chunking","concept:circuit-intervention","concept:claim-review","concept:classical-planning","concept:classification-task","concept:climate-ai","concept:clip-alignment","concept:clustering","concept:cnn","concept:code-assistants","concept:coding-agents","concept:commerce-ai","concept:compiler-kernel","concept:compression","concept:compute-memory-bound","concept:compute-supply","concept:conditional-probability","concept:confidence-interval","concept:consent","concept:constrained-optimization","concept:contamination-audit","concept:context-assembly","concept:context-window","concept:continual-learning","concept:continuous-batching","concept:contrastive-learning","concept:copyright","concept:counterfactual","concept:cross-attention","concept:cross-entropy","concept:data-cleaning","concept:data-collection","concept:data-contamination","concept:data-leakage","concept:data-parallel","concept:data-versioning","concept:decision-control-task","concept:decision-tree","concept:decode","concept:decoding","concept:deep-learning","concept:deepfake","concept:denoising","concept:deployment-lab","concept:depth-pose","concept:derivative","concept:design-ai","concept:diffusion","concept:diffusion-policy","concept:digital-divide","concept:disputed-claims","concept:distillation","concept:distribution-shift","concept:dit","concept:documentation-compliance","concept:domain-randomization","concept:domain-validation","concept:dot-product","concept:dpo","concept:drift-monitoring","concept:dynamic-scene","concept:edge-ai","concept:education-ai","concept:eigen-svd","concept:embedding-model","concept:energy-accounting","concept:energy-ai","concept:entropy","concept:environmental-impact","concept:evaluation-dataset","concept:evaluation-lab","concept:evidence-attribution","concept:evolutionary-algorithms","concept:expectation-variance","concept:expert-parallel","concept:exploration","concept:fact-check-practice","concept:fairness-evaluation","concept:features-circuits","concept:federated-learning","concept:feedback-control","concept:few-shot","concept:finance-ai","concept:finetuning-lab","concept:flash-attention","concept:floating-point","concept:flow-matching","concept:formal-logic","concept:foundation-model-era","concept:full-duplex","concept:game-ai","concept:gaussian-splatting","concept:generation-control","concept:generation-task","concept:generative-ai","concept:gnn","concept:gpu","concept:gradient","concept:gradient-boosting","concept:graph-learning","concept:graphical-models","concept:hallucination","concept:heuristic-search","concept:hmm-kalman","concept:human-ai-interaction","concept:human-approval","concept:human-evaluation","concept:human-in-loop","concept:human-preference-board","concept:hybrid-search","concept:idempotency","concept:identity-consistency","concept:image-classification","concept:image-tools","concept:imagined-rollout","concept:imitation-learning","concept:in-context-learning","concept:incident-response","concept:interconnect","concept:interleaved-modalities","concept:interpretability","concept:joint-representation","concept:judge-bias","concept:kinematics","concept:kl-divergence","concept:knowledge-representation","concept:kv-cache","concept:labeling","concept:labour-impact","concept:latent-dynamics","concept:latent-vae","concept:learning-rate","concept:least-privilege","concept:legal-ai","concept:legal-jurisdiction","concept:license-rights","concept:linear-models","concept:linear-regression-lab","concept:llm","concept:local-model-lab","concept:local-privacy","concept:logistics-ai","concept:logits","concept:long-term-memory","concept:lora","concept:loss-objective","concept:lowcode-platforms","concept:machine-learning","concept:managed-inference","concept:manufacturing-ai","concept:materials-ai","concept:matrix-multiplication","concept:matrix-tensor","concept:mcp","concept:mcts","concept:mdp","concept:media-ai","concept:medical-ai","concept:memory-bandwidth","concept:mesh-generation","concept:meta-learning","concept:misuse","concept:mlops-release","concept:mlp","concept:modality-fusion","concept:model-hubs","concept:model-registry","concept:model-risk-assessment","concept:model-version","concept:model-vs-product","concept:moe","concept:monitoring-lab","concept:motion-design","concept:mpc","concept:mqa-gqa","concept:multi-agent","concept:multi-head","concept:multimodal-metrics","concept:music-generation","concept:music-tools","concept:mutual-information","concept:negative-results","concept:nerf","concept:neural-codec","concept:neural-era","concept:neuro-symbolic","concept:neuromorphic","concept:norm-distance","concept:npu","concept:numerical-stability","concept:object-detection","concept:observability","concept:ocr","concept:office-ai","concept:offline-rl","concept:open-ecosystem","concept:overfitting","concept:paged-attention","concept:paper-reading","concept:physical-safety","concept:pipeline-parallel","concept:planning-memory","concept:policy-gradient","concept:pomdp","concept:precision-recall","concept:prediction-task","concept:predictive-representation","concept:preference-learning","concept:prefill","concept:privacy","concept:probing","concept:product-version","concept:prompt-injection","concept:prompt-practice","concept:provenance","concept:provider-organization","concept:pruning","concept:qkv","concept:quality-cost-frontier","concept:quantization","concept:quantum-ml","concept:query-rewriting","concept:rag","concept:rag-lab","concept:random-forest","concept:random-variable","concept:ranking-metrics","concept:reasoning-verification","concept:recommender-system","concept:regional-availability","concept:regularization","concept:regulatory-scope","concept:release-timeline","concept:reproduction","concept:reranker","concept:research-search-tools","concept:research-team","concept:residual-normalization","concept:retirement","concept:retrieval-task","concept:retry-budget","concept:rl-lab","concept:rlhf","concept:rnn-lstm","concept:robustness","concept:roi-study","concept:rope","concept:safety-evaluation","concept:sandbox","concept:sat-csp","concept:scene-tracking","concept:scientific-ai","concept:segmentation","concept:self-attention","concept:self-supervised-learning","concept:sensor-fusion","concept:sft","concept:sgd","concept:sim-to-real","concept:simulation","concept:slam","concept:softmax","concept:sound-editing","concept:source-tracking","concept:spatial-grounding","concept:spatiotemporal-attention","concept:speculative-decoding","concept:ssm","concept:standards-framework","concept:state-observation","concept:statistical-era","concept:statistical-inference","concept:statistical-power","concept:storyboarding","concept:streaming-protocol","concept:structured-output","concept:supervised-learning","concept:svm","concept:swarm-intelligence","concept:symbolic-era","concept:synthetic-data","concept:table-analysis-practice","concept:tabular-learning","concept:tail-latency","concept:task-total-cost","concept:tensor-parallel","concept:terminal-bench","concept:test-time-compute","concept:theorem-proving","concept:throughput","concept:time-series","concept:token-embedding","concept:tokenization","concept:tool-calling","concept:tps","concept:train-validation-test","concept:training-framework","concept:training-license","concept:transfer-learning","concept:transformer","concept:transport-ai","concept:ttft","concept:tts","concept:understanding-generation","concept:unsupervised-learning","concept:update-log","concept:usecase-baseline","concept:value-function","concept:vector","concept:vector-index","concept:video-model","concept:video-production","concept:video-tools","concept:vision-encoder","concept:visual-connector","concept:visual-reasoning","concept:vit-patch","concept:vla","concept:vlm","concept:waveform-stft","concept:workflow-platforms","concept:workflow-vs-agent","concept:world-model","concept:zero-fsdp","domain:algorithms","domain:applications","domain:data-learning","domain:embodied","domain:engineering","domain:evaluation","domain:governance","domain:mathematics","domain:modalities","domain:overview","domain:products","domain:research","domain:systems","domain:tutorials","hub:agents","hub:ai-overview","hub:assistants","hub:audio","hub:coding","hub:embedding","hub:evidence","hub:image-generation","hub:llm","hub:music","hub:platforms","hub:rag","hub:spatial","hub:transformer","hub:video","hub:video-production","hub:vlm","hub:world-models","root:ai","topic:agent-systems","topic:assistant-tools","topic:audio-speech","topic:boundaries","topic:calculus","topic:case-method","topic:classical-ml","topic:commerce-transport","topic:computer-vision","topic:creative-practice","topic:creative-tools","topic:culture-design","topic:data-lifecycle","topic:data-rights","topic:developer-practice","topic:developer-tools","topic:distributed-training","topic:edge-cost","topic:efficiency-metrics","topic:evaluation-protocols","topic:evidence-maintenance","topic:first-steps","topic:frontiers","topic:generalization","topic:hardware","topic:history","topic:human-society","topic:image-generation","topic:industry-ecosystem","topic:industry-environment","topic:inference-efficiency","topic:inference-serving","topic:information-theory","topic:interfaces","topic:knowledge-work","topic:landscape","topic:language-modeling","topic:learning-paradigms","topic:linear-algebra","topic:mathematical-practice","topic:mechanistic-understanding","topic:native-multimodal","topic:neural-architectures","topic:operational-governance","topic:optimization","topic:physical-perception","topic:platform-tools","topic:policy-standards","topic:post-training","topic:probabilistic-causal","topic:probability-statistics","topic:product-lifecycle","topic:ranking-references","topic:reinforcement-learning","topic:retrieval-augmentation","topic:risk-mechanisms","topic:robot-learning","topic:science-health","topic:scientific-method","topic:search-planning","topic:search-retrieval","topic:shipping-practice","topic:simulation-transfer","topic:specialized-modeling","topic:stack-operations","topic:state-control","topic:symbolic-reasoning","topic:system-reliability","topic:task-landscape","topic:task-metrics","topic:training-loop","topic:transfer-continuity","topic:transformer-mechanisms","topic:trust-metrics","topic:video-space","topic:vision-language","topic:world-modeling"];
const ORIGINAL_NODE_IDS = new Set(BASELINE_NODE_IDS);
const UPSTREAM_INTEGRATION = {
  commit: '300a6468f1072228d00285e029c3bc8c28853f05', measuredFromExactGitTree: true,
  modelNodes: 630, networkCandidateNodes: 629, defaultMapAdmittedNodes: 168, concepts: 407,
  directlyBoundNodes: 90, independentArticles: 5, globalPrerequisites: 10, routeLocalPrerequisites: 57,
  conceptsWithoutNonTreeEdges: 261, topicsWithoutNonTreeEdges: 71,
  edgeTypes: { browse_child: 629, recommended_before: 67, related: 45, uses: 12, mitigates: 1, is_a: 2, references: 70, represents: 18 },
  note: 'Concurrent upstream expansion before this task\'s 3 new units and 11 global teaching edges; not a deployment claim.'
};
const SEMANTIC_EDGE_TYPES = new Set(['is_a', 'part_of', 'uses', 'trained_with', 'evaluated_by', 'mitigates']);
const edgeRole = e => e.type === 'browse_child' ? 'navigation' : e.type === 'references' ? 'reference'
  : e.type === 'represents' ? 'identity' : e.type === 'recommended_before' ? e.routeId ? 'route-local-teaching' : 'global-teaching'
  : e.type === 'related' ? 'editorial-related' : 'typed-semantic';

/** Keep the audit honest when the renderer's non-exported admission predicate changes. */
function mapAdmission(root, network, groups) {
  const source = readFileSync(path.join(root, 'src/features/workspace/networkEngine.js'), 'utf8');
  const body = source.match(/const mapEligible = node => \{([\s\S]*?)\n  \};/)?.[1];
  const expected = `
    if (node.kind === 'domain' || hasResource(node)) return true;
    return (network.adjacency.get(node.id) ?? []).some(edge =>
      !['browse_child','references','represents','related'].includes(edge.type));`;
  assert.equal(body?.replace(/\s+/g, ''), expected.replace(/\s+/g, ''), 'Renderer map admission changed; update and verify the audit mirror before regenerating.');
  const hasResource = n => Boolean(n.articleBindings?.length || n.resourceRefs?.length || n.embeddedArticleId);
  const eligible = n => n.kind === 'domain' || hasResource(n) || (network.adjacency.get(n.id) ?? []).some(e =>
    !['browse_child', 'references', 'represents', 'related'].includes(e.type));
  const settings = normalizeNetworkSettings(null, groups.map(g => g.id));
  const admitted = network.nodes.filter(eligible);
  const shownByDefaults = admitted.filter(n => (!settings.groups || settings.groups.includes(network.domainOf(n.id)?.group)) &&
    (!settings.onlyResources || hasResource(n)) && (settings.detail === 'all' || (settings.detail === 'concepts' ? n.kind === 'concept' : ['domain', 'hub', 'topic'].includes(n.kind))));
  assert.equal(settings.focusNeighbors, false, 'Review default focus-neighbor admission');
  return { admittedIds: new Set(admitted.map(n => n.id)), defaultVisibleIds: new Set(shownByDefaults.map(n => n.id)), settings };
}

const sort = values => [...new Set(values)].sort();
const digest = value => createHash('sha256').update(value).digest('hex');
const json = (root, file) => JSON.parse(readFileSync(path.join(root, file), 'utf8'));
const serialize = value => {
  if (!value?.nodes) return JSON.stringify(value, null, 2) + '\n';
  const { nodes, edges, ...rest } = value;
  const rows = (key, items) => ',\n  \"' + key + '\": [\n' + items.map(item => '    ' + JSON.stringify(item)).join(',\n') + '\n  ]';
  return JSON.stringify(rest, null, 2).slice(0, -2) + (edges ? rows('edges', edges) : '') + rows('nodes', nodes) + '\n}\n';
};
const group = (items, key) => {
  const result = new Map();
  for (const item of items) { const k = key(item); result.set(k, [...(result.get(k) ?? []), item]); }
  return result;
};
const daysBetween = (asOf, date) => date ? Math.floor((Date.parse(asOf) - Date.parse(date)) / 86400000) : null;
const route = (id, article = false) => `?${new URLSearchParams(article ? { view: 'article', article: id } :
  id === 'root:ai' ? { view: 'garden', scope: id, display: 'graph' } : { view: 'garden', scope: 'root:ai', node: id, display: 'graph' })}`;

// A batch is an editorial work package, not a claim that each graph node needs a new article.
const BATCHES = [
  ['N00', '导航与知识边界', 'P0', [], '根、领域、主题、专题的目标、边界、阅读次序与资料类型；保留规范 ID'],
  ['C01', '数学、概率与损失', 'P0', ['N00'], '形状与矩阵、条件概率、熵与交叉熵优先；再补微积分、优化和计算代价'],
  ['C02', 'AI 入门与边界', 'P1', ['N00'], '任务、路线、历史与模型/产品边界，用可辨别的例子解释'],
  ['C03', '数据、训练与适配', 'P1', ['C01'], '数据划分、泛化、学习范式、训练、后训练与迁移；区分参数更新与上下文学习'],
  ['C04', '语言模型与内部机制', 'P1', ['C01', 'C03'], '语言建模、Transformer 内部计算与模型边界；细化已有单元的未覆盖问题'],
  ['C05', '工程、推理与性能', 'P1', ['C04'], '硬件、分布式、服务、优化、部署与经济性；缓存子问题复用已有正文'],
  ['C06', '评测、榜单与价格', 'P0', ['C01'], '指标、协议、置信区间、系统与模型区别；另开最新来源复核，不刷新旧日期'],
  ['C07', '检索、接口与智能体', 'P1', ['C04'], '检索与 RAG、Agent 循环、接口与可靠执行，补失败和权限边界'],
  ['C08', '经典算法与结构', 'P2', ['C01', 'C03'], '经典 ML、符号、搜索、概率因果与其余网络结构，保持对象边界'],
  ['C09', '视觉与图文理解', 'P2', ['C04'], '视觉编码、Patch、对齐、连接与图文推理，复用数学与注意力'],
  ['C10', '图像、视频与空间', 'P2', ['C04', 'C09'], '扩散、去噪、DiT、视频一致性和 3D 表示；不将生成视频等同世界模型'],
  ['C11', '音频与统一多模态', 'P2', ['C04'], '波形、ASR、TTS、Codec、音乐和跨模态统一表示'],
  ['C12', '世界模型与具身', 'P2', ['C03', 'C08'], '观测、状态、控制、动作、环境预测、仿真与物理安全'],
  ['C13', '产品、版本与平台', 'P1', ['C06', 'C07'], '产品目录和模型/版本/订阅/API 的关系；只在原 JSON 更新易变事实'],
  ['C14', '教程、实验与交付', 'P2', ['C04', 'C05', 'C07'], '目标、步骤、依赖、输出、验证和失败恢复；引用规范机制，不复制讲解'],
  ['C15', '行业应用与案例', 'P2', ['C06', 'C07'], '逐行业任务、基线、证据和人的责任；健康、法律、金融需领域复核'],
  ['C16', '安全、权利与治理', 'P1', ['C07'], '失效攻击、数据权利、运行治理、社会影响与法域/版本，避免通用合规保证'],
  ['C17', '研究与证据维护', 'P1', ['C06'], '研究方法、可解释性、前沿、产业、主张与证据变更，保留未知和争议']
].map(([id, label, priority, dependencies, outcome]) => ({ id, label, priority, dependencies, outcome }));
const DOMAIN_BATCH = {
  mathematics: 'C01', overview: 'C02', 'data-learning': 'C03', engineering: 'C05', evaluation: 'C06',
  systems: 'C07', algorithms: 'C08', embodied: 'C12', products: 'C13', tutorials: 'C14', applications: 'C15', governance: 'C16', research: 'C17'
};
const LLM_SECTION_BATCH = {
  orientation: 'C02', math: 'C01', mechanisms: 'C04', training: 'C03', inference: 'C05', rankings: 'C06',
  models: 'C13', pricing: 'C06', applications: 'C07', tutorials: 'C14', safety: 'C16', research: 'C17'
};
const MODALITY_TOPIC_BATCH = { 'language-modeling': 'C04', 'computer-vision': 'C09', 'vision-language': 'C09',
  'image-generation': 'C10', 'video-space': 'C10', 'audio-speech': 'C11', 'native-multimodal': 'C11' };
const HUB_BATCH = { vlm: 'C09', 'image-generation': 'C10', video: 'C10', spatial: 'C10', audio: 'C11', music: 'C11', transformer: 'C04' };
const SEMANTIC_GROUPS = [
  [['token-embedding', 'embedding-model'], '模型内部查表表示与用于检索等任务的独立表示模型，复用向量知识，保留不同对象'],
  [['transformer', 'llm', 'vlm', 'dit'], '架构、语言模型类别、视觉语言类别与扩散架构实例不是同义词'],
  [['world-model', 'video-model', 'latent-dynamics'], '环境预测、视频生成和潜在动力学的目标与输入不同'],
  [['rag', 'agent', 'workflow-vs-agent'], '证据增强方法、执行系统与编排方式的比较入口不合并'],
  [['cross-attention', 'visual-connector'], '注意力计算机制与跨模态连接组件不等价'],
  [['decoding', 'decode', 'autoregression'], '选择输出的算法、推理服务阶段和概率分解分别说明'],
  [['data-leakage', 'data-contamination', 'contamination-audit'], '泛化评估泄漏、评测污染与检测方法相关，但对象和职责不同'],
  [['human-in-loop', 'human-approval'], '行业中的人工参与与具体高风险动作批准粒度不同'],
  [['privacy', 'local-privacy', 'least-privilege', 'access-controls'], '数据保护目标、端侧约束、权限原则与治理机制分别保留'],
  [['api-pricing', 'task-total-cost', 'quality-cost-frontier'], '单价记录、任务总成本与质量/预算比较不得混为同一指标'],
  [['entropy', 'cross-entropy', 'kl-divergence', 'loss-objective'], '信息量、交叉熵、分布差异和训练目标层级不同，用公式联系而不合并'],
  [['source-tracking', 'provenance', 'evidence-attribution', 'claim-review'], '来源管理、来源链、回答归因与主张审查是不同责任'],
  [['video-production', 'video-tools', 'video-model'], '创作流程、产品目录与模型机制分别组织'],
  [['copyright', 'training-license', 'license-rights'], '权利概念、训练数据许可与产品/模型许可证按对象和法域分别解释']
].map(([ids, reason]) => ({ conceptIds: ids.map(id => `concept:${id}`), decision: 'keep-separate-related-not-duplicate', reason,
  scope: 'editorial-boundary-review-not-exhaustive-semantic-proof' }));

function walkFiles(root, directory) {
  return readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap(entry => {
    const file = `${directory}/${entry.name}`;
    return entry.isDirectory() ? walkFiles(root, file) : [file];
  });
}

function articleCatalogue(root, publishedIds, asOf) {
  const registry = json(root, 'content/articles.json').articles;
  const authored = new Map(registry.map(a => [a.id, a]));
  const sources = json(root, 'content/data/sources.json').sources;
  const sourceById = new Map(sources.map(s => [s.id, s]));
  const meta = json(root, 'content/data/research-meta.json');
  const benchmarks = json(root, 'content/data/benchmarks.json').benchmarks;
  const prices = json(root, 'content/data/model-api-prices.json').modelApiPrices;
  const productFiles = walkFiles(root, 'content/data/products').filter(file => file.endsWith('.json')).sort();
  const products = productFiles.flatMap(file => json(root, file).products.map(record => ({ file, record })));
  const urlType = url => /arxiv\.org|aclanthology\.org|doi\.org/.test(url) ? 'paper-version-needs-citation-review' : 'mutable-documentation-or-web-page';
  const sourceRecord = s => ({ id: s.id, url: s.url, access: s.access, recordedCheckedAt: s.checkedAt ?? null,
    sourceDate: s.sourceDate ?? null, daysSinceRecordedCheck: daysBetween(asOf, s.checkedAt),
    daysSinceSourceDate: daysBetween(asOf, s.sourceDate), liveVerifiedByAudit: false, note: s.note ?? null });
  const articles = sort(publishedIds).map(id => {
    const article = authored.get(id);
    if (article) {
      const body = readFileSync(path.join(root, article.file), 'utf8');
      const sourceUrls = sort([...(article.knowledgeUnit?.sourceUrls ?? []), ...[...body.matchAll(/\]\((https?:\/\/[^\s)]+)\)/g)].map(m => m[1])]);
      return { id, title: article.title, route: route(id, true), origin: 'authored-markdown', sourceOfTruth: [article.file, 'content/articles.json'],
        authoredDate: article.date, independentUnit: article.knowledgeUnit ?? null, reviewStatus: article.knowledgeUnit?.reviewStatus ?? 'not-independently-reviewed-in-inventory',
        sourceUrls: sourceUrls.map(url => ({ url, sourceKind: urlType(url), recordedCheckedAt: null, liveVerifiedByAudit: false })),
        freshness: { status: 'citation-presence-only-no-live-verification', authoredDateIsVerificationDate: false, recordedCheckedAt: null },
        mechanicalSignals: { bytes: Buffer.byteLength(body), characters: [...body].length, headings: [...body.matchAll(/^#{1,6}\s/gm)].length,
          runnableExampleMarkers: [...body.matchAll(/^# nextchina-example: /gm)].length, citationUrlCount: sourceUrls.length,
          sha256: digest(body), normalizedWhitespaceSha256: digest(body.replace(/\s+/g, ' ').trim()),
          meaningOrTeachingQualityAssessed: false } };
    }
    let records = [], files = [], sourceIds = [], snapshotDate = null, recordSelector;
    const benchmark = benchmarks.find(b => b.id === id);
    if (benchmark) {
      records = [benchmark]; files = ['content/data/benchmarks.json']; sourceIds = [benchmark.sourceId];
      snapshotDate = benchmark.snapshotDate; recordSelector = `benchmarks[id=${id}]`;
    } else if (id === 'model-api-prices') {
      records = prices; files = ['content/data/model-api-prices.json']; sourceIds = prices.map(p => p.sourceId); recordSelector = 'modelApiPrices[*]';
    } else if (id.startsWith('catalog-') || id === 'agent-products') {
      const category = id === 'agent-products' ? 'agent' : id.slice('catalog-'.length);
      const selected = products.filter(p => p.record.categories.includes(category));
      records = selected.map(p => p.record); files = sort(selected.map(p => p.file)); sourceIds = records.flatMap(p => p.sourceIds);
      recordSelector = `products[categories includes ${category}]`;
    } else {
      assert.ok(['overview', 'sources-and-gaps'].includes(id), `Unknown generated article source: ${id}`);
      files = sort(walkFiles(root, 'content/data').filter(file => file.endsWith('.json')));
      sourceIds = sources.map(s => s.id); recordSelector = id === 'overview' ? 'research aggregates' : 'source register and research-meta.pendingItems';
    }
    const linkedSources = sort(sourceIds).map(sourceId => { assert.ok(sourceById.has(sourceId), `Missing source ${sourceId}`); return sourceRecord(sourceById.get(sourceId)); });
    const checkDates = sort([...records.map(r => r.checkedAt).filter(Boolean), ...linkedSources.map(s => s.recordedCheckedAt).filter(Boolean)]);
    return { id, title: benchmark?.title ?? id, route: route(id, true), origin: 'generated-from-research-json',
      sourceOfTruth: sort([...files, 'content/data/sources.json', 'content/data/research-meta.json', 'content/data/categories.json']),
      renderer: 'src/data/generated-docs.ts', recordSelector, independentUnit: null, reviewStatus: 'recorded-source-status-only-not-reverified',
      sourceUrls: linkedSources, snapshotDate, freshness: { status: 'dated-reference-reverify-before-current-claims',
        researchRecordedCheckedAt: meta.checkedAt, oldestRecordedCheckedAt: checkDates[0] ?? null,
        newestRecordedCheckedAt: checkDates.at(-1) ?? null, daysSinceOldestRecordedCheck: daysBetween(asOf, checkDates[0]),
        daysSinceSnapshot: daysBetween(asOf, snapshotDate), liveVerifiedByAudit: false,
        incompleteOrUnavailableSourceIds: linkedSources.filter(s => ['partial', 'unavailable'].includes(s.access)).map(s => s.id) },
      recordCount: records.length || null };
  });
  return { articles, sources: sources.map(sourceRecord) };
}

/** Pure snapshot of the current canonical model and its navigation overlay. No network, no edits. */
export function buildContentInventory(root = repositoryRoot, { asOf = DEFAULT_AS_OF } = {}) {
  assert.match(asOf, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(new Date(asOf).toISOString().slice(0, 10), asOf, 'Invalid as-of date');
  const { blueprint, graph: base, publishedArticleIds, masterOutline } = loadGarden(root);
  const graph = attachTopicHubs(base, root, publishedArticleIds);
  const network = normalizeNetwork(graph); // The production renderer excludes root, group, path and document.
  const candidateIds = new Set(network.nodes.map(n => n.id));
  const admission = mapAdmission(root, network, blueprint.groups);
  const byId = new Map(graph.nodes.map(n => [n.id, n]));
  const children = group(graph.nodes.filter(n => n.parentId), n => n.parentId);
  const ancestors = id => { const out = []; let n = byId.get(id); while (n?.parentId) { n = byId.get(n.parentId); out.unshift(n); } return out; };
  const descendants = id => { const out = [...(children.get(id) ?? [])]; for (let i = 0; i < out.length; i++) out.push(...(children.get(out[i].id) ?? [])); return out; };
  const domainOf = id => [...ancestors(id), byId.get(id)].find(n => n.kind === 'domain');
  const definitionSources = new Map([['root:ai', { file: 'content/garden/blueprint.json', pointer: '/rootId' }]]);
  blueprint.domains.forEach((domain, di) => {
    definitionSources.set(`domain:${domain.id}`, { file: 'content/garden/blueprint.json', pointer: `/domains/${di}` });
    domain.topics.forEach((topic, ti) => {
      const prefix = `/domains/${di}/topics/${ti}`;
      definitionSources.set(`topic:${topic.id}`, { file: 'content/garden/blueprint.json', pointer: prefix });
      Object.keys(topic.concepts).forEach(id => definitionSources.set(`concept:${id}`, { file: 'content/garden/blueprint.json', pointer: `${prefix}/concepts/${id}` }));
    });
  });
  const plan = json(root, 'content/garden/plans/topic-hubs-v2.json');
  const rawBlueprint = json(root, 'content/garden/blueprint.json');
  const hubConfig = json(root, 'content/garden/hub-integration.json');
  const legacyBoundNodes = new Set();
  const walkOutline = (hubId, items, pointer, prefix = '') => items.forEach((item, index) => {
    const key = prefix ? `${prefix}/${item.id}` : item.id;
    definitionSources.set(branchId(hubId, key), { file: 'content/garden/plans/topic-hubs-v2.json', pointer: `${pointer}/${index}` });
    if (item.legacyDataRef) legacyBoundNodes.add(branchId(hubId, key));
    if (item.children) walkOutline(hubId, item.children, `${pointer}/${index}/children`, key);
  });
  plan.hubSeeds.forEach((seed, index) => {
    definitionSources.set(seed.id, { file: 'content/garden/plans/topic-hubs-v2.json', pointer: `/hubSeeds/${index}` });
    if (plan.hubOutlines[seed.id]) walkOutline(seed.id, plan.hubOutlines[seed.id], `/hubOutlines/${seed.id}`);
  });
  const { articles, sources } = articleCatalogue(root, publishedArticleIds, asOf);
  const articleById = new Map(articles.map(a => [a.id, a]));
  const independentIds = new Set(articles.filter(a => a.independentUnit).map(a => a.id));
  const own = id => {
    const n = byId.get(id), refs = new Map();
    for (const ref of n.articleBindings) refs.set(ref.articleId, { ...ref, fromNodeId: id });
    for (const ref of n.resourceRefs ?? []) if (!refs.has(ref.articleId)) refs.set(ref.articleId, { articleId: ref.articleId, coverage: ref.role, fromNodeId: id });
    if (n.embeddedArticleId && !refs.has(n.embeddedArticleId)) refs.set(n.embeddedArticleId, { articleId: n.embeddedArticleId, coverage: 'reference', fromNodeId: id });
    return [...refs.values()].sort((a, b) => a.articleId.localeCompare(b.articleId, 'en'));
  };
  const referenceEdges = graph.edges.filter(e => ['references', 'represents'].includes(e.type));
  const referenceAdjacency = new Map(graph.nodes.map(n => [n.id, []]));
  for (const e of referenceEdges) { referenceAdjacency.get(e.source).push(e.target); referenceAdjacency.get(e.target).push(e.source); }
  const relations = graph.edges.filter(e => e.type !== 'browse_child' && !referenceEdges.includes(e));
  const topologyOnlyIds = new Set(graph.nodes.filter(n => !graph.edges.some(e => e.type !== 'browse_child' && (e.source === n.id || e.target === n.id))).map(n => n.id));
  const edges = graph.edges.map(e => {
    const semantic = SEMANTIC_EDGE_TYPES.has(e.type);
    const evidenceKeys = ['evidence', 'evidenceIds', 'evidenceUrls', 'sourceIds', 'sourceUrls', 'citations'].filter(key => {
      const value = e[key]; return typeof value === 'string' ? value.trim().length > 0 : Array.isArray(value) ? value.length > 0 : value && typeof value === 'object' && Object.keys(value).length > 0;
    });
    const relationIndex = rawBlueprint.relations.findIndex(r => r.source === e.source && r.target === e.target && r.type === e.type && !e.routeId);
    const pathIndex = e.routeId ? rawBlueprint.learningPaths.findIndex(p => p.id === e.routeId) : -1;
    return { ...e, audit: { role: edgeRole(e), directed: e.type !== 'related',
      semanticEvidenceStatus: semantic ? evidenceKeys.length ? 'explicit-metadata-present-not-verified' : 'missing-explicit-evidence' : 'not-a-scientific-semantic-claim',
      evidenceMetadataKeys: evidenceKeys,
      missingScope: semantic && !e.scope, missingExplicitProvenance: semantic && !e.provenance,
      sourceOfTruth: relationIndex >= 0 ? { file: 'content/garden/blueprint.json', pointer: `/relations/${relationIndex}` } : pathIndex >= 0 ?
        { file: 'content/garden/blueprint.json', pointer: `/learningPaths/${pathIndex}`, derivation: 'adjacent-steps-preserving-routeId' } :
        e.type === 'browse_child' ? { derivation: 'node-parentId-navigation-only' } :
        { file: 'content/garden/plans/topic-hubs-v2.json', derivation: e.provenance ?? 'unrecorded' },
      reasonIsEvidence: false } };
  });
  const batchById = new Map(BATCHES.map(b => [b.id, b]));
  const chooseBatch = n => {
    if (['root', 'domain', 'topic', 'hub'].includes(n.kind)) return 'N00';
    if (n.hubId === 'hub:llm') return LLM_SECTION_BATCH[n.outlinePath.split('/')[0]];
    const hubBatch = HUB_BATCH[n.hubId?.slice(4)]; if (hubBatch) return hubBatch;
    const topic = ancestors(n.id).find(a => a.kind === 'topic')?.id.slice(6);
    if (topic === 'transformer-mechanisms' || n.id === 'concept:transformer') return 'C04';
    if (topic && MODALITY_TOPIC_BATCH[topic]) return MODALITY_TOPIC_BATCH[topic];
    return DOMAIN_BATCH[domainOf(n.id)?.id.slice(7)];
  };
  const nodes = [...graph.nodes].sort((a, b) => a.id.localeCompare(b.id, 'en')).map(n => {
    const direct = own(n.id), used = new Set(direct.map(r => r.articleId));
    const collect = ids => {
      const out = [];
      for (const id of ids) for (const ref of own(id)) if (!used.has(ref.articleId)) { out.push(ref); used.add(ref.articleId); }
      return out.sort((a, b) => a.articleId.localeCompare(b.articleId, 'en'));
    };
    // Mirror knowledgeIndex.resourcesFor priority: own, explicit reference, then descendants.
    const referenced = collect(referenceAdjacency.get(n.id));
    const inherited = collect(descendants(n.id).map(d => d.id));
    const ancestorContext = sort(ancestors(n.id).flatMap(a => own(a.id).map(r => r.articleId)));
    const independent = direct.filter(r => independentIds.has(r.articleId)).map(r => r.articleId);
    const batchId = chooseBatch(n); assert.ok(batchById.has(batchId), `Node lacks a batch: ${n.id}`);
    const canonicalRefIds = n.kind === 'concept' ? [n.id] : n.conceptRefs ?? [];
    const source = definitionSources.get(n.id) ?? { file: 'content/garden/plans/topic-hubs-v2.json',
      selector: `articlePlacements[*].placements[hubId=${n.hubId},section=${n.outlinePath}]`, generatedResourceBranch: true };
    const isConcept = n.kind === 'concept';
    const missing = !independent.length;
    const coverageStatus = independent.length ? 'direct-independent-unit-needs-review' : direct.length ? 'direct-resource-without-independent-unit' :
      referenced.length ? 'explicit-reference-only' : inherited.length ? 'descendant-resources-only' : 'no-reading-resource';
    const nextAction = isConcept ? (missing ? 'write-or-justify-shared-explanation' : 'review-exact-concept-coverage') : `review-${n.kind}-context`;
    const checks = direct.flatMap(r => {
      const f = articleById.get(r.articleId).freshness;
      return [f.oldestRecordedCheckedAt, f.recordedCheckedAt].filter(Boolean);
    }).sort();
    return { id: n.id, label: n.label, type: n.kind, scopeMembership: ORIGINAL_NODE_IDS.has(n.id) ? 'original-91a80ff-scope' : 'expanded-since-91a80ff',
      renderEligibility: { networkCandidate: candidateIds.has(n.id), mapAdmitted: admission.admittedIds.has(n.id), visibleUnderDefaultPreferences: admission.defaultVisibleIds.has(n.id),
        selectableByExplicitRoute: candidateIds.has(n.id) }, route: route(n.id),
      parentId: n.parentId, domainId: domainOf(n.id)?.id ?? null, groupId: domainOf(n.id)?.group ?? null,
      taxonomyPath: [...ancestors(n.id).map(a => a.id), n.id], canonicalRefIds, hubRefIds: n.hubRefs ?? [],
      learningStages: masterOutline.stages.filter(s => s.refs.some(id => id === n.id || ancestors(n.id).some(a => a.id === id))).map(s => s.id),
      learningPaths: graph.learningPaths.filter(p => p.steps.includes(n.id)).map(p => p.id),
      sourceOfTruth: { definition: source, bindingSources: sort([
        ...(rawBlueprint.articleBindings.some(b => b.nodeIds.includes(n.id)) ? ['content/garden/blueprint.json'] : []),
        ...(legacyBoundNodes.has(n.id) || plan.articlePlacements.some(record => record.placements.some(p => branchId(p.hubId, p.section) === n.id)) ? ['content/garden/plans/topic-hubs-v2.json'] : []),
        ...(hubConfig.resourcePlacements.some(p => branchId(p.hubId, p.path) === n.id) ? ['content/garden/hub-integration.json'] : []),
        ...(independent.length ? ['content/articles.json#knowledgeUnit'] : [])
      ]) },
      articleIds: direct.map(r => r.articleId), independentArticleIds: independent,
      coverage: { status: coverageStatus, direct, referenced, inheritedFromDescendants: inherited, ancestorContextArticleIds: ancestorContext,
        independentExplanationMissing: isConcept ? missing : null,
        hasOnlyNavigationSummary: !direct.length && Boolean(n.summary ?? (n.kind === 'domain' && blueprint.domains.find(d => `domain:${d.id}` === n.id)?.question)) },
      relationships: { incomingEdgeIds: edges.filter(e => e.target === n.id).map(e => e.id), outgoingEdgeIds: edges.filter(e => e.source === n.id).map(e => e.id),
        globalPrerequisites: relations.filter(e => e.type === 'recommended_before' && !e.routeId && e.target === n.id).map(e => e.source),
        globalRecommendedNext: relations.filter(e => e.type === 'recommended_before' && !e.routeId && e.source === n.id).map(e => e.target),
        routeLocalIncomingEdgeIds: relations.filter(e => e.routeId && e.target === n.id).map(e => e.id),
        routeLocalOutgoingEdgeIds: relations.filter(e => e.routeId && e.source === n.id).map(e => e.id),
        typedSemanticIncomingEdgeIds: edges.filter(e => SEMANTIC_EDGE_TYPES.has(e.type) && e.target === n.id).map(e => e.id),
        typedSemanticOutgoingEdgeIds: edges.filter(e => SEMANTIC_EDGE_TYPES.has(e.type) && e.source === n.id).map(e => e.id),
        related: sort(relations.filter(e => e.type === 'related' && (e.source === n.id || e.target === n.id)).map(e => e.source === n.id ? e.target : e.source)),
        explicitReferenceNeighbors: sort(referenceAdjacency.get(n.id)), hasOnlyTreeEdges: topologyOnlyIds.has(n.id) },
      freshness: { oldestDirectResourceRecordedCheck: checks[0] ?? null,
        hasDatedResearchResource: direct.some(r => articleById.get(r.articleId).origin === 'generated-from-research-json') },
      review: { sourceContentStatus: n.contentStatus, sourceEvidenceStatus: n.evidenceStatus,
        independentUnitStatuses: sort(independent.map(id => articleById.get(id).reviewStatus)),
        editorialStatus: 'needs-node-specific-review' },
      work: { batchId, priority: batchById.get(batchId).priority, deliverableKind: isConcept ? 'canonical-explanation' : n.kind === 'branch' ? 'contextual-navigation-or-scoped-explanation' : 'navigation-and-scope',
        status: independent.length ? 'draft-present-needs-review' : isConcept ? 'needs-independent-coverage' : 'needs-navigation-review', nextAction }
    };
  });
  const concepts = nodes.filter(n => n.type === 'concept');
  const counts = Object.fromEntries(['root', 'domain', 'topic', 'concept', 'hub', 'branch'].map(kind => [kind, nodes.filter(n => n.type === kind).length]));
  const duplicateGroups = (items, key, field = 'id') => [...group(items, key)].filter(([, values]) => values.length > 1)
    .map(([value, values]) => ({ value, ids: values.map(v => v[field]).sort() })).sort((a, b) => a.value.localeCompare(b.value, 'en'));
  const markdownArticles = articles.filter(a => a.origin === 'authored-markdown');
  const batches = BATCHES.map(b => {
    const members = nodes.filter(n => n.work.batchId === b.id);
    return { ...b, status: 'open', nodeIds: members.map(n => n.id), totalNodes: members.length,
      networkCandidateNodes: members.filter(n => n.renderEligibility.networkCandidate).length, defaultVisibleNodes: members.filter(n => n.renderEligibility.visibleUnderDefaultPreferences).length, concepts: members.filter(n => n.type === 'concept').length,
      branches: members.filter(n => n.type === 'branch').length, directlyExplainedConcepts: members.filter(n => n.type === 'concept' && n.independentArticleIds.length).length,
      conceptsStillWithoutIndependentExplanation: members.filter(n => n.coverage.independentExplanationMissing).length,
      notYetIndependentlyReviewed: members.length };
  });
  const sourceFiles = sort([
    ...walkFiles(root, 'content').filter(file => file.endsWith('.json') && file !== INVENTORY_FILE),
    ...markdownArticles.flatMap(article => article.sourceOfTruth),
    'scripts/audit-node-content.mjs', 'scripts/prepare-garden.mjs', 'scripts/validate-garden.mjs', 'scripts/build-topic-hubs.mjs', 'scripts/knowledge-units.mjs',
    'src/features/workspace/knowledgeIndex.ts', 'src/features/workspace/networkLayout.js', 'src/features/workspace/networkEngine.js', 'src/features/workspace/networkPreferences.js', 'src/routing.ts', 'src/data/generated-docs.ts', 'src/data/research.ts'
  ]).map(file => ({ file, sha256: digest(readFileSync(path.join(root, file))) }));
  const independentConceptIds = concepts.filter(n => n.independentArticleIds.length).map(n => n.id);
  const result = { schemaVersion: 2, auditAsOf: asOf, generator: 'scripts/audit-node-content.mjs',
    scope: 'all-canonical-and-navigation-nodes-no-claim-of-completed-curriculum', baseline: BASELINE, upstreamIntegration: UPSTREAM_INTEGRATION,
    originalScope: { originalModelNodeIds: BASELINE_NODE_IDS, preservedModelNodes: nodes.filter(n => ORIGINAL_NODE_IDS.has(n.id)).length, originalNetworkCandidates: BASELINE_NODE_IDS.filter(id => id !== 'root:ai').length,
      missingOriginalNodeIds: BASELINE_NODE_IDS.filter(id => !byId.has(id)), addedNodeIds: nodes.filter(n => !ORIGINAL_NODE_IDS.has(n.id)).map(n => n.id) },
    inputs: { aggregateSha256: digest(serialize(sourceFiles)), files: sourceFiles },
    summary: { publicationStatus: 'working-tree-model-not-deployment-verification', modelNodes: nodes.length, networkCandidateNodes: network.nodes.length, defaultMapAdmittedNodes: admission.admittedIds.size, defaultVisibleNodes: admission.defaultVisibleIds.size,
      hiddenByAdmissionButRetainedNodes: network.nodes.length - admission.admittedIds.size, rootExcludedByProductionRenderer: true, byType: counts,
      publishedPages: articles.length, authoredMarkdownPages: markdownArticles.length, generatedReferencePages: articles.length - markdownArticles.length,
      directlyBoundNodes: nodes.filter(n => n.articleIds.length).length, directlyBoundConcepts: concepts.filter(n => n.articleIds.length).length,
      independentArticles: independentIds.size, independentConcepts: independentConceptIds.length,
      independentBranchPlacements: nodes.filter(n => n.type === 'branch' && n.independentArticleIds.length).length,
      conceptsWithoutIndependentExplanation: concepts.length - independentConceptIds.length,
      directlyBoundNodesWithoutIndependentExplanation: nodes.filter(n => n.articleIds.length && !n.independentArticleIds.length).length,
      networkCandidatesWithoutDirectResource: nodes.filter(n => n.renderEligibility.networkCandidate && !n.articleIds.length).length,
      defaultVisibleNodesWithoutDirectResource: nodes.filter(n => n.renderEligibility.visibleUnderDefaultPreferences && !n.articleIds.length).length,
      independentlyReviewedNodes: 0, note: 'Coverage counts metadata bindings, not concept-level completeness, teaching quality, or fact verification.',
      coverageStatuses: Object.fromEntries([...group(nodes, n => n.coverage.status)].map(([k, values]) => [k, values.length])),
      currentIndependentArticleIds: sort(independentIds), currentIndependentConceptIds: independentConceptIds,
      independentArticlesAddedSinceBaseline: sort([...independentIds].filter(id => !BASELINE.independentArticleIds.includes(id))) },
    duplicateAudit: { duplicateCanonicalIds: duplicateGroups(concepts, n => n.id), exactCanonicalLabelDuplicates: duplicateGroups(concepts, n => n.label),
      normalizedCanonicalLabelCandidates: duplicateGroups(concepts, n => n.label.normalize('NFKC').trim().toLowerCase()),
      exactMarkdownDuplicates: duplicateGroups(markdownArticles, a => a.mechanicalSignals.sha256),
      normalizedWhitespaceMarkdownCandidates: duplicateGroups(markdownArticles, a => a.mechanicalSignals.normalizedWhitespaceSha256),
      repeatedNavigationOrCrossKindLabels: duplicateGroups(nodes, n => n.label), semanticBoundaryReviews: SEMANTIC_GROUPS,
      action: 'Keep all IDs. Navigation-label reuse and multiple resource placements are intentional. No automatic merges.',
      limitation: 'Exact bytes/labels and selected semantic boundaries only; no exhaustive semantic equivalence, paragraph plagiarism, or article-level correctness detection.' },
    relationshipAudit: { totalEdges: edges.length, countsByType: Object.fromEntries([...group(edges, e => e.type)].map(([type, list]) => [type, list.length])),
      navigationEdges: edges.filter(e => e.type === 'browse_child').length, nonTreeEdges: edges.filter(e => e.type !== 'browse_child').length,
      referencesEdges: edges.filter(e => e.type === 'references').length, representsEdges: edges.filter(e => e.type === 'represents').length,
      editorialRelatedEdges: edges.filter(e => e.type === 'related').length, typedSemanticEdges: edges.filter(e => SEMANTIC_EDGE_TYPES.has(e.type)).length,
      globalRecommendedBeforeEdges: edges.filter(e => e.type === 'recommended_before' && !e.routeId).length,
      routeLocalRecommendedBeforeEdges: edges.filter(e => e.type === 'recommended_before' && e.routeId).length,
      conceptsWithoutNonTreeEdges: concepts.filter(n => n.relationships.hasOnlyTreeEdges).length,
      topicsWithoutNonTreeEdges: nodes.filter(n => n.type === 'topic' && n.relationships.hasOnlyTreeEdges).length,
      conceptIdsWithoutNonTreeEdges: concepts.filter(n => n.relationships.hasOnlyTreeEdges).map(n => n.id),
      topicIdsWithoutNonTreeEdges: nodes.filter(n => n.type === 'topic' && n.relationships.hasOnlyTreeEdges).map(n => n.id),
      conceptsWithoutGlobalPrerequisite: concepts.filter(n => !n.relationships.globalPrerequisites.length).length,
      semanticEdgesMissingEvidence: edges.filter(e => e.audit.semanticEvidenceStatus === 'missing-explicit-evidence').map(e => e.id),
      semanticEdgesMissingScope: edges.filter(e => e.audit.missingScope).map(e => e.id),
      semanticEdgesMissingExplicitProvenance: edges.filter(e => e.audit.missingExplicitProvenance).map(e => e.id),
      globalPrerequisitesAcyclic: true, routeLocalOrderCompiledFromLearningPaths: true, routeLocalOrderIsLogicalNecessity: false,
      combinedPrerequisitesClaimedAcyclic: false,
      note: 'Global teaching edges are a DAG. Route-local adjacency retains routeId and is not promoted into global prerequisites. Semantic evidence/scope gaps are flagged; audit adds no edges.' },
    displayAudit: { source: 'src/features/workspace/networkEngine.js#mapEligible', defaultSettings: admission.settings,
      admissionRule: 'Domains, nodes with own resources, or endpoints of a non-navigation/non-reference/non-identity/non-related edge.',
      candidateCountIsDefaultVisibleCount: false, hiddenNodesRemainInInventory: true, explicitSelectedNodeOverridesAdmission: true,
      browserRenderVerifiedByThisScript: false },
    coverageDefinitions: { direct: 'Own explicit binding/resource/embedded reader, deduplicated by article ID.',
      referenced: 'One-hop references/represents edges in either direction, excluding already direct articles, matching current knowledgeIndex.resourcesFor.',
      inheritedFromDescendants: 'Resources from navigation descendants, excluding direct/referenced articles; does not explain the ancestor.',
      ancestorContextArticleIds: 'Ancestor bindings recorded for context only. Current node sheet does not inherit these resources.',
      independent: 'Only article registry knowledgeUnit.kind=independent-explanation; a multi-concept unit is still one article and still needs independent review.',
      navigation: 'Roots/domains/topics/hubs/branches have distinct navigation or context obligations; The original 602-node scope and expanded candidates do not imply equally many independent articles.' },
    nextActionDefinitions: {
      'write-or-justify-shared-explanation': 'Scope and write a distinct explanation or justify shared-unit coverage; overview/reference does not complete a concept.',
      'review-exact-concept-coverage': 'Independently review the bound unit against this exact concept; shared binding is not proof of full coverage.',
      'review-branch-context': 'Review contextual question, canonical refs and resource roles; add specific context if needed and reuse article IDs.',
      'review-root-context': 'Review whole-garden scope, entry paths and truthful coverage explanation.',
      'review-domain-context': 'Review domain question, boundaries, topic order and cross-domain entry points.',
      'review-topic-context': 'Review concept grouping, suggested learning order and boundaries; a topic does not require its own independent article.',
      'review-hub-context': 'Review hub purpose, reader routes, canonical subject and resource roles; expand only when sources support it.'
    },
    reviewPolicy: { mechanicalStructureValidated: true, semanticCompletenessReviewed: false, completedNodes: 0, liveSourceVerificationPerformed: false,
      articleSourceOfTruth: 'Resolve every article ID through top-level articles; no copied bodies or data rows.',
      relationsAreEditorialNotCausalProof: true, ancestorContextDisplayedByCurrentNodeSheet: false, authoredDateIsVerificationDate: false },
    limitations: [
      'No network requests; URL presence, recorded check dates and file hashes do not prove current accessibility or truth.',
      'As-of date is explicit and stable, not a claim of live monitoring; regenerate with --as-of when reviewing a later date.',
      'No expert or independent content review performed by this mechanical inventory. Source statuses are preserved.',
      'No token/character threshold certifies a complete explanation; empty or overview-only concept coverage is a planning signal.',
      'Routes use the production query contract; normalizeNetwork counts candidates only. mapEligible is mirrored with a source-contract guard; default admission is not live browser-state verification.',
      'Suggested batches are editorial sequencing; dependencies are not new scientific prerequisite graph edges.',
      'Non-LLM hubs currently derive resource branches; absent detailed outlines are not silently synthesized.',
      'Source contentStatus remains outline even for bound drafts; article metadata and node-specific review remain separate.'
    ], batches, articles, sources, edges, nodes };
  validateInventory(result, graph);
  return result;
}

function validateInventory(inventory, graph) {
  assert.equal(inventory.nodes.length, graph.nodes.length);
  assert.equal(inventory.edges.length, graph.edges.length);
  assert.deepEqual(inventory.originalScope.missingOriginalNodeIds, [], 'Original scope lost nodes');
  for (const edge of graph.edges) { const saved = inventory.edges.find(e => e.id === edge.id); for (const key of Object.keys(edge)) assert.deepEqual(saved[key], edge[key], `Lost edge metadata ${edge.id}:${key}`); }
  assert.equal(new Set(inventory.nodes.map(n => n.id)).size, graph.nodes.length);
  assert.equal(inventory.batches.reduce((sum, b) => sum + b.totalNodes, 0), graph.nodes.length);
  assert.deepEqual(sort(inventory.batches.flatMap(b => b.nodeIds)), sort(graph.nodes.map(n => n.id)));
  assert.equal(inventory.batches.flatMap(b => b.nodeIds).length, graph.nodes.length, 'A node appears in two batches');
  const articles = new Set(inventory.articles.map(a => a.id));
  const ids = new Set(inventory.nodes.map(n => n.id));
  for (const n of inventory.nodes) {
    for (const ref of [...n.coverage.direct, ...n.coverage.referenced, ...n.coverage.inheritedFromDescendants]) {
      assert.ok(articles.has(ref.articleId) && ids.has(ref.fromNodeId), `Dangling coverage ${n.id}`);
    }
    for (const id of n.canonicalRefIds) assert.ok(ids.has(id), `Dangling canonical reference ${id}`);
    assert.ok(!n.articleIds.length || n.sourceOfTruth.bindingSources.length, `Missing binding source ${n.id}`);
    assert.ok(n.route.length < 1800);
    const params = new URLSearchParams(n.route.slice(1));
    assert.equal(params.get('node') ?? params.get('scope'), n.id);
  }
  for (const review of SEMANTIC_GROUPS) for (const id of review.conceptIds) assert.ok(ids.has(id), `Unknown semantic-review concept ${id}`);
}

/** RFC 4180 quoting; the small tracked files contain one record for every model node. */
const csvCell = value => {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

export function trackedInventoryArtifacts(inventory) {
  const header = ['id', 'label', 'type', 'batch', 'direct_article_ids', 'independent_article_ids', 'independent_coverage', 'default_admission'].join(',') + '\n';
  const byId = new Map(inventory.nodes.map(node => [node.id, node]));
  const files = new Map(), rows = [];
  for (const batch of inventory.batches) {
    const chunks = []; let current = header, count = 0;
    for (const id of batch.nodeIds) {
      const node = byId.get(id);
      const line = [node.id, node.label, node.type, batch.id, node.articleIds.join(';'), node.independentArticleIds.join(';'),
        node.independentArticleIds.length ? 'bound-needs-review' : node.type === 'concept' ? 'missing' : 'navigation',
        node.renderEligibility.visibleUnderDefaultPreferences].map(csvCell).join(',') + '\n';
      assert.ok(Buffer.byteLength(header + line) <= CSV_BYTE_BUDGET, `Inventory CSV row exceeds file budget: ${id}`);
      if (count && Buffer.byteLength(current + line) > CSV_BYTE_BUDGET) { chunks.push({ text: current, count }); current = header; count = 0; }
      current += line; count++;
    }
    if (count) chunks.push({ text: current, count });
    const names = chunks.map((chunk, index) => {
      const name = `${batch.id}${chunks.length > 1 ? `-${index + 1}` : ''}.csv`;
      files.set(`${TRACKED_DIRECTORY}/${name}`, chunk.text); return name;
    });
    rows.push(`| ${batch.id} | ${batch.label} | ${batch.totalNodes} | ${batch.concepts} | ${batch.conceptsStillWithoutIndependentExplanation} | ${names.map(name => `[${name}](${name})`).join('、')} |`);
  }
  const summary = inventory.summary;
  const index = [
    '# 全节点内容清单', '', '<!-- Generated by scripts/audit-node-content.mjs; do not edit by hand. -->',
    `<!-- audit-as-of: ${inventory.auditAsOf} -->`, '',
    `审计基准日：${inventory.auditAsOf}。这是工作树快照，不表示已部署或通过独立专家复核。`, '',
    `共 ${summary.modelNodes} 个模型节点：${summary.byType.concept} 个规范概念、${summary.byType.topic} 个主题、${summary.byType.domain} 个领域、${summary.byType.hub} 个专题、${summary.byType.branch} 个分支及 1 个根。原 ${inventory.originalScope.preservedModelNodes} 个模型 ID 全部保留，当前增加 ${inventory.originalScope.addedNodeIds.length} 个节点。`, '',
    `地图候选 ${summary.networkCandidateNodes} 个；默认准入 ${summary.defaultVisibleNodes} 个。${summary.hiddenByAdmissionButRetainedNodes} 个未准入候选仍在清单内，根不进入地图候选。`, '',
    `${summary.independentArticles} 篇独立知识单元显式绑定 ${summary.independentConcepts} 个规范概念；${summary.conceptsWithoutIndependentExplanation} 个概念仍缺独立绑定，已有绑定仍需逐项复核。`, '',
    '## 按批次查找', '',
    '| 批次 | 范围 | 节点 | 概念 | 缺独立绑定的概念 | 完整 CSV |',
    '| --- | --- | ---: | ---: | ---: | --- |', ...rows, '',
    '每个模型节点恰好出现一次。CSV 使用 UTF-8 和标准双引号转义；多个 articleId 用分号分隔。', '',
    '- id / label / type / batch：稳定身份、名称、节点职责和所属编辑批次',
    '- direct_article_ids：仅当前节点的直接绑定，不含引用或下级资源',
    '- independent_article_ids：注册的独立单元 ID；多概念共享文章仍只是一篇文章',
    '- independent_coverage：bound-needs-review 表示有绑定待复核；missing 表示概念缺独立绑定；navigation 表示导航节点，不等于缺少一篇文章',
    '- default_admission：当前默认偏好、无选择时的地图准入；false 不代表节点删除或不能选择', '',
    '## 复现完整追踪信息', '',
    `这些小 CSV 和本索引随 Git 保存。完整 JSON 为忽略的构建产物，仍生成在 content/garden/content-inventory.json；包含全部来源定位、直接/引用/下级覆盖、历史身份、${inventory.edges.length} 条边及其原始类型/方向/routeId/scope/证据元数据。`, '',
    'npm ci 的 prepare，以及 npm run build 的 prebuild，会重新生成完整 JSON 并核对已跟踪清单。它们不会静默重写 CSV。', '',
    '```sh',
    '# 有意更新事实源后的清单快照：同时刷新小文件与完整 JSON',
    'npm run audit:content',
    '# 只重建忽略的 JSON，并验证已跟踪文件未过期',
    'node scripts/audit-node-content.mjs --prepare',
    '# 检查完整 JSON、CSV、索引、确定性与过期拒绝',
    'npm run test:content',
    '```', '',
    '完整字段和质量要求见 [全站内容整理计划](../content-organization-plan.md)。如需新的审计日，运行 node scripts/audit-node-content.mjs --write --as-of YYYY-MM-DD；日期不是联网复核证明。', '',
    `输入 SHA-256：${inventory.inputs.aggregateSha256}`, ''
  ].join('\n');
  files.set(TRACKED_INDEX, index);
  return files;
}

function auditAsOf(root) {
  const index = path.join(root, TRACKED_INDEX);
  if (existsSync(index)) {
    const date = readFileSync(index, 'utf8').match(/<!-- audit-as-of: (\d{4}-\d{2}-\d{2}) -->/)?.[1];
    assert.ok(date, 'Tracked inventory index is missing its audit-as-of marker.');
    return date;
  }
  return DEFAULT_AS_OF;
}

export function checkTrackedInventories(inventory, root = repositoryRoot) {
  const artifacts = trackedInventoryArtifacts(inventory);
  for (const [file, expected] of artifacts) {
    const target = path.join(root, file);
    if (!existsSync(target) || readFileSync(target, 'utf8') !== expected) throw new Error(`Tracked content inventory is missing or stale: ${file}. Run npm run audit:content and review the changes.`);
  }
  const directory = path.join(root, TRACKED_DIRECTORY);
  for (const file of readdirSync(directory)) if (/^[NC]\d{2}(?:-\d+)?\.csv$/.test(file) && !artifacts.has(`${TRACKED_DIRECTORY}/${file}`)) {
    throw new Error(`Obsolete inventory shard: ${file}. Run npm run audit:content.`);
  }
}

function writeTrackedInventories(inventory, root) {
  const artifacts = trackedInventoryArtifacts(inventory), directory = path.join(root, TRACKED_DIRECTORY);
  mkdirSync(directory, { recursive: true });
  for (const file of readdirSync(directory)) if (/^[NC]\d{2}(?:-\d+)?\.csv$/.test(file) && !artifacts.has(`${TRACKED_DIRECTORY}/${file}`)) rmSync(path.join(directory, file));
  for (const [file, contents] of artifacts) writeFileSync(path.join(root, file), contents);
}

/** Build/install hook: reconstruct ignored detail, but never silently rewrite tracked review files. */
export function prepareContentInventory(root = repositoryRoot) {
  const inventory = buildContentInventory(root, { asOf: auditAsOf(root) });
  writeFileSync(path.join(root, INVENTORY_FILE), serialize(inventory));
  checkTrackedInventories(inventory, root);
  return inventory;
}

export function checkInventory(expected, file) {
  assert.ok(existsSync(file), `Missing inventory: run node scripts/audit-node-content.mjs --write`);
  if (readFileSync(file, 'utf8') !== serialize(expected)) {
    throw new Error('Content inventory is stale. Run node scripts/audit-node-content.mjs --write (preserving or intentionally updating --as-of).');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const args = process.argv.slice(2), mode = args.shift() ?? '--check';
    assert.ok(['--check', '--write', '--prepare', '--self-test'].includes(mode), 'Usage: node scripts/audit-node-content.mjs [--check|--write|--prepare|--self-test] [--as-of YYYY-MM-DD]');
    const target = path.join(repositoryRoot, INVENTORY_FILE);
    let asOf = auditAsOf(repositoryRoot);
    if (args.length) { assert.equal(args.length, 2); assert.equal(args[0], '--as-of'); asOf = args[1]; }
    const inventory = buildContentInventory(repositoryRoot, { asOf });
    if (mode === '--write') { writeFileSync(target, serialize(inventory)); writeTrackedInventories(inventory, repositoryRoot); }
    else if (mode === '--prepare') { writeFileSync(target, serialize(inventory)); checkTrackedInventories(inventory); }
    else if (mode === '--check') { checkInventory(inventory, target); checkTrackedInventories(inventory); }
    else {
      assert.equal(serialize(inventory), serialize(buildContentInventory(repositoryRoot, { asOf })), 'Non-deterministic inventory');
      checkInventory(inventory, target);
      checkTrackedInventories(inventory);
      assert.deepEqual([...trackedInventoryArtifacts(inventory)], [...trackedInventoryArtifacts(buildContentInventory(repositoryRoot, { asOf }))], 'Non-deterministic tracked CSV/index');
      const changed = structuredClone(inventory); changed.summary.modelNodes++;
      assert.throws(() => checkInventory(changed, target), /stale/);
      assert.deepEqual(inventory.baseline.independentArticleIds, BASELINE.independentArticleIds);
      // Exercise real input changes away from the worktree, not just a changed summary field.
      const temporary = mkdtempSync(path.join(tmpdir(), 'nextchina-content-audit-'));
      try {
        for (const { file } of inventory.inputs.files) {
          const destination = path.join(temporary, file); mkdirSync(path.dirname(destination), { recursive: true });
          copyFileSync(path.join(repositoryRoot, file), destination);
        }
        const snapshot = path.join(temporary, INVENTORY_FILE);
        copyFileSync(target, snapshot);
        writeTrackedInventories(inventory, temporary);
        const [csvFile, csvContents] = [...trackedInventoryArtifacts(inventory)].find(([file]) => file.endsWith('.csv'));
        writeFileSync(path.join(temporary, csvFile), csvContents + '\n');
        assert.throws(() => checkTrackedInventories(inventory, temporary), /stale/);
        writeFileSync(path.join(temporary, csvFile), csvContents);
        checkTrackedInventories(inventory, temporary);
        const draft = path.join(temporary, 'content/models/unregistered-audit-draft.md');
        writeFileSync(draft, 'Unregistered draft must not change published-model coverage.\n');
        checkInventory(buildContentInventory(temporary, { asOf }), snapshot);
        const registeredFile = inventory.articles.find(a => a.origin === 'authored-markdown').sourceOfTruth[0];
        const articleFile = path.join(temporary, registeredFile);
        writeFileSync(articleFile, readFileSync(articleFile, 'utf8') + '\n');
        assert.throws(() => checkInventory(buildContentInventory(temporary, { asOf }), snapshot), /stale/);
      } finally { rmSync(temporary, { recursive: true, force: true }); }
      console.log('Determinism, exact batch partition, route/reference integrity, JSON/CSV/index determinism, stale CSV rejection, real-input staleness and unregistered-draft isolation passed.');
    }
    console.log(JSON.stringify({ status: 'pass', mode, asOf, file: INVENTORY_FILE, ...inventory.summary }, null, 2));
  } catch (error) { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }
}
