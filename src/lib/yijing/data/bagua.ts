import type { HexagramData, TrigramDef, TrigramName, WuXing } from "../types";

// === 八卦定义 ===

export const TRIGRAMS: TrigramDef[] = [
  { name: "乾", chinese: "乾", symbol: "☰", element: "金", binary: 7 },
  { name: "兑", chinese: "兑", symbol: "☱", element: "金", binary: 6 },
  { name: "离", chinese: "离", symbol: "☲", element: "火", binary: 5 },
  { name: "震", chinese: "震", symbol: "☳", element: "木", binary: 4 },
  { name: "巽", chinese: "巽", symbol: "☴", element: "木", binary: 3 },
  { name: "坎", chinese: "坎", symbol: "☵", element: "水", binary: 2 },
  { name: "艮", chinese: "艮", symbol: "☶", element: "土", binary: 1 },
  { name: "坤", chinese: "坤", symbol: "☷", element: "土", binary: 0 },
];

export const TRIGRAM_BY_NAME: Record<string, TrigramDef> = {};
TRIGRAMS.forEach((t) => { TRIGRAM_BY_NAME[t.name] = t; });

// === 纳甲五行 ===

type TrigramNajia = Record<TrigramName, { lower: WuXing[]; upper: WuXing[] }>;

export const NAJIA_WUXING: TrigramNajia = {
  乾: { lower: ["水", "木", "土"], upper: ["火", "金", "土"] },
  兑: { lower: ["火", "木", "土"], upper: ["水", "金", "土"] },
  离: { lower: ["木", "土", "水"], upper: ["金", "土", "火"] },
  震: { lower: ["水", "木", "土"], upper: ["火", "金", "土"] },
  巽: { lower: ["土", "水", "金"], upper: ["土", "火", "木"] },
  坎: { lower: ["木", "土", "火"], upper: ["金", "土", "水"] },
  艮: { lower: ["土", "火", "金"], upper: ["土", "水", "木"] },
  坤: { lower: ["土", "火", "木"], upper: ["土", "水", "金"] },
};

export function getNajiaWuXing(
  lowerTrigram: TrigramName,
  upperTrigram: TrigramName
): WuXing[] {
  const lower = NAJIA_WUXING[lowerTrigram].lower;
  const upper = NAJIA_WUXING[upperTrigram].upper;
  return [...lower, ...upper];
}

// === 六十四卦数据 ===

export const HEXAGRAMS: HexagramData[] = [
  // 1. 乾为天
  {
    id: 1, name: "乾为天", shortName: "乾",
    upperTrigram: "乾", lowerTrigram: "乾", binaryPattern: 63,
    palace: "乾宫", palaceElement: "金", shiYaoPosition: 6, yingYaoPosition: 3,
    upperYaoWuXing: NAJIA_WUXING["乾"].upper, lowerYaoWuXing: NAJIA_WUXING["乾"].lower, element: "金",
    guaCi: { original: "元亨利贞。", modern: "大为亨通，利于守持正道。" },
    yaoCi: [
      { position: 1, label: "初九", original: "潜龙勿用。", modern: "龙潜深渊，不宜施展。韬光养晦，等待时机。" },
      { position: 2, label: "九二", original: "见龙在田，利见大人。", modern: "龙现田野，利于拜见贵人。才能初显，宜得赏识。" },
      { position: 3, label: "九三", original: "君子终日乾乾，夕惕若厉，无咎。", modern: "终日勤勉，夜晚警惕自省，虽处险境也无灾祸。" },
      { position: 4, label: "九四", original: "或跃在渊，无咎。", modern: "或腾跃或退处深渊，审时度势则无咎。" },
      { position: 5, label: "九五", original: "飞龙在天，利见大人。", modern: "龙飞于天，大展宏图。利于拜见大德之人。" },
      { position: 6, label: "上九", original: "亢龙有悔。", modern: "龙飞过高而生悔恨。盛极必衰，盈不可久。" },
    ],
  },
  // 2. 坤为地
  {
    id: 2, name: "坤为地", shortName: "坤",
    upperTrigram: "坤", lowerTrigram: "坤", binaryPattern: 0,
    palace: "坤宫", palaceElement: "土", shiYaoPosition: 6, yingYaoPosition: 3,
    upperYaoWuXing: NAJIA_WUXING["坤"].upper, lowerYaoWuXing: NAJIA_WUXING["坤"].lower, element: "土",
    guaCi: {
      original: "元亨，利牝马之贞。君子有攸往，先迷后得主，利。西南得朋，东北丧朋。安贞吉。",
      modern: "大为亨通，利于柔顺守正。君子有所前往，起初迷惑而后得遇明主。安守正道则吉。",
    },
    yaoCi: [
      { position: 1, label: "初六", original: "履霜，坚冰至。", modern: "踏霜而知坚冰将至。见微知著，防患未然。" },
      { position: 2, label: "六二", original: "直方大，不习无不利。", modern: "正直端方博大，顺其自然无往不利。" },
      { position: 3, label: "六三", original: "含章可贞，或从王事，无成有终。", modern: "胸怀美质可守正，辅佐君王虽无成却能善终。" },
      { position: 4, label: "六四", original: "括囊，无咎无誉。", modern: "束紧口袋，缄默寡言。无咎无誉，谨慎自守。" },
      { position: 5, label: "六五", original: "黄裳，元吉。", modern: "穿黄色下裳，谦逊守中，大为吉祥。" },
      { position: 6, label: "上六", original: "龙战于野，其血玄黄。", modern: "龙战于野，两败俱伤。阴极生变，柔极则刚争。" },
    ],
  },
  // 3. 水雷屯
  {
    id: 3, name: "水雷屯", shortName: "屯",
    upperTrigram: "坎", lowerTrigram: "震", binaryPattern: 20,
    palace: "坎宫", palaceElement: "水", shiYaoPosition: 2, yingYaoPosition: 5,
    upperYaoWuXing: NAJIA_WUXING["坎"].upper, lowerYaoWuXing: NAJIA_WUXING["震"].lower, element: "水",
    guaCi: { original: "元亨利贞。勿用有攸往。利建侯。", modern: "大为亨通，利于守正。不宜轻举妄动，利于建立根基。" },
    yaoCi: [
      { position: 1, label: "初九", original: "磐桓。利居贞，利建侯。", modern: "徘徊不前。宜安居守正，利于建立根基。" },
      { position: 2, label: "六二", original: "屯如邅如，乘马班如。匪寇婚媾，女子贞不字，十年乃字。", modern: "艰难徘徊，骑马回旋。非劫匪而是求婚者，女子守贞不嫁，十年后才出嫁。" },
      { position: 3, label: "六三", original: "即鹿无虞，惟入于林中。君子几不如舍，往吝。", modern: "追鹿无虞人引导，只会迷失林间。君子见机不如舍弃，前往有憾。" },
      { position: 4, label: "六四", original: "乘马班如。求婚媾，往吉无不利。", modern: "骑马回旋不定。主动求婚则吉，无有不利。" },
      { position: 5, label: "九五", original: "屯其膏。小贞吉，大贞凶。", modern: "囤积恩泽而未广施。小事守正则吉，大事则凶。" },
      { position: 6, label: "上六", original: "乘马班如，泣血涟如。", modern: "骑马徘徊，泣血涟涟。穷途末路，悲不自胜。" },
    ],
  },
  // 4. 山水蒙
  {
    id: 4, name: "山水蒙", shortName: "蒙",
    upperTrigram: "艮", lowerTrigram: "坎", binaryPattern: 10,
    palace: "离宫", palaceElement: "火", shiYaoPosition: 4, yingYaoPosition: 1,
    upperYaoWuXing: NAJIA_WUXING["艮"].upper, lowerYaoWuXing: NAJIA_WUXING["坎"].lower, element: "火",
    guaCi: { original: "亨。匪我求童蒙，童蒙求我。初筮告，再三渎，渎则不告。利贞。", modern: "亨通。非我去求幼童启蒙，而是幼童求教于我。初次问筮则告，再三则是亵渎，亵渎则不告。利于守正。" },
    yaoCi: [
      { position: 1, label: "初六", original: "发蒙，利用刑人，用说桎梏，以往吝。", modern: "启发蒙昧，宜用典型示范，解脱桎梏。贸然而往则有憾。" },
      { position: 2, label: "九二", original: "包蒙吉。纳妇吉。子克家。", modern: "包容蒙昧者则吉，娶妻则吉。儿子能持家。" },
      { position: 3, label: "六三", original: "勿用取女。见金夫，不有躬。无攸利。", modern: "不可娶此女。见有财势的男子便失身自弃。无所利。" },
      { position: 4, label: "六四", original: "困蒙，吝。", modern: "困于蒙昧之中，有憾惜。" },
      { position: 5, label: "六五", original: "童蒙，吉。", modern: "保持童真蒙昧之心，吉祥。" },
      { position: 6, label: "上九", original: "击蒙，不利为寇，利御寇。", modern: "以严厉手段治蒙，不宜为寇害人，利于防御外寇。" },
    ],
  },
  // 5. 水天需
  {
    id: 5, name: "水天需", shortName: "需",
    upperTrigram: "坎", lowerTrigram: "乾", binaryPattern: 23,
    palace: "坤宫", palaceElement: "土", shiYaoPosition: 4, yingYaoPosition: 1,
    upperYaoWuXing: NAJIA_WUXING["坎"].upper, lowerYaoWuXing: NAJIA_WUXING["乾"].lower, element: "土",
    guaCi: { original: "有孚，光亨，贞吉。利涉大川。", modern: "心怀诚信，光明亨通，守正则吉。利于渡过大河。" },
    yaoCi: [
      { position: 1, label: "初九", original: "需于郊，利用恒，无咎。", modern: "在郊外等待，宜有恒心，无咎。" },
      { position: 2, label: "九二", original: "需于沙，小有言，终吉。", modern: "在沙地等待，虽有小口舌是非，终获吉祥。" },
      { position: 3, label: "九三", original: "需于泥，致寇至。", modern: "在泥泞中等待，招致盗寇。" },
      { position: 4, label: "六四", original: "需于血，出自穴。", modern: "在血泊中等待，从洞穴中逃离。" },
      { position: 5, label: "九五", original: "需于酒食，贞吉。", modern: "在酒食款待中等待，守正则吉。" },
      { position: 6, label: "上六", original: "入于穴，有不速之客三人来，敬之终吉。", modern: "进入洞穴，有不请自来的三位客人，恭敬以待终获吉祥。" },
    ],
  },
  // 6. 天水讼
  {
    id: 6, name: "天水讼", shortName: "讼",
    upperTrigram: "乾", lowerTrigram: "坎", binaryPattern: 58,
    palace: "离宫", palaceElement: "火", shiYaoPosition: 4, yingYaoPosition: 1,
    upperYaoWuXing: NAJIA_WUXING["乾"].upper, lowerYaoWuXing: NAJIA_WUXING["坎"].lower, element: "火",
    guaCi: { original: "有孚，窒惕，中吉，终凶。利见大人，不利涉大川。", modern: "有诚信但遭阻塞需警惕，过程中吉，最终则凶。利于见贵人，不利于冒险前行。" },
    yaoCi: [
      { position: 1, label: "初六", original: "不永所事，小有言，终吉。", modern: "不长久纠缠此事，虽有小口舌，终获吉祥。" },
      { position: 2, label: "九二", original: "不克讼，归而逋，其邑人三百户，无眚。", modern: "争讼不胜，逃归避难。其邑人三百户无灾祸。" },
      { position: 3, label: "六三", original: "食旧德，贞厉，终吉。或从王事，无成。", modern: "守旧德，守正虽险但终吉。或随王事，无所成。" },
      { position: 4, label: "九四", original: "不克讼，复即命，渝安贞，吉。", modern: "争讼不胜，回头顺命，改过守正，吉祥。" },
      { position: 5, label: "九五", original: "讼，元吉。", modern: "公正裁决争讼，大为吉祥。" },
      { position: 6, label: "上九", original: "或锡之鞶带，终朝三褫之。", modern: "虽被赐绶带，一日内三次被剥夺。讼胜德不配位。" },
    ],
  },
  // 7. 地水师
  {
    id: 7, name: "地水师", shortName: "师",
    upperTrigram: "坤", lowerTrigram: "坎", binaryPattern: 2,
    palace: "坎宫", palaceElement: "水", shiYaoPosition: 6, yingYaoPosition: 3,
    upperYaoWuXing: NAJIA_WUXING["坤"].upper, lowerYaoWuXing: NAJIA_WUXING["坎"].lower, element: "水",
    guaCi: { original: "贞，丈人吉，无咎。", modern: "守持正道，有德望的长者统帅则吉，无灾祸。" },
    yaoCi: [
      { position: 1, label: "初六", original: "师出以律，否臧凶。", modern: "出师必以纪律约束，纪律不善则凶。" },
      { position: 2, label: "九二", original: "在师中，吉无咎。王三锡命。", modern: "在军中，吉祥无咎。君王再三赐命宠任。" },
      { position: 3, label: "六三", original: "师或舆尸，凶。", modern: "军中或载尸而归，凶险。" },
      { position: 4, label: "六四", original: "师左次，无咎。", modern: "军队撤退驻扎，无咎。" },
      { position: 5, label: "六五", original: "田有禽，利执言，无咎。长子帅师，弟子舆尸，贞凶。", modern: "田中有禽兽，利于发号施令，无咎。长子统兵，次子却载尸而归，守正也凶。" },
      { position: 6, label: "上六", original: "大君有命，开国承家，小人勿用。", modern: "君王有命赏功封地，但小人不可重用。" },
    ],
  },
  // 8. 水地比
  {
    id: 8, name: "水地比", shortName: "比",
    upperTrigram: "坎", lowerTrigram: "坤", binaryPattern: 16,
    palace: "坤宫", palaceElement: "土", shiYaoPosition: 3, yingYaoPosition: 6,
    upperYaoWuXing: NAJIA_WUXING["坎"].upper, lowerYaoWuXing: NAJIA_WUXING["坤"].lower, element: "土",
    guaCi: { original: "吉。原筮，元永贞，无咎。不宁方来，后夫凶。", modern: "吉祥。再次筮问，长久守正则无咎。不安宁者前来亲附，落后而来者凶。" },
    yaoCi: [
      { position: 1, label: "初六", original: "有孚比之，无咎。有孚盈缶，终来有它吉。", modern: "以诚信亲附，无咎。诚信充盈如满缸，终有意外之吉。" },
      { position: 2, label: "六二", original: "比之自内，贞吉。", modern: "从内心亲附，守正则吉。" },
      { position: 3, label: "六三", original: "比之匪人。", modern: "亲附了不该亲附之人。" },
      { position: 4, label: "六四", original: "外比之，贞吉。", modern: "向外亲附贤者，守正则吉。" },
      { position: 5, label: "九五", original: "显比。王用三驱，失前禽，邑人不诫，吉。", modern: "彰显亲附。王猎三面围驱，失前禽而不追，邑人不惊，吉。" },
      { position: 6, label: "上六", original: "比之无首，凶。", modern: "亲附而无头领，凶。" },
    ],
  },
  // 9. 风天小畜
  {
    id: 9, name: "风天小畜", shortName: "小畜",
    upperTrigram: "巽", lowerTrigram: "乾", binaryPattern: 47,
    palace: "巽宫", palaceElement: "木", shiYaoPosition: 1, yingYaoPosition: 4,
    upperYaoWuXing: NAJIA_WUXING["巽"].upper, lowerYaoWuXing: NAJIA_WUXING["乾"].lower, element: "木",
    guaCi: { original: "亨。密云不雨，自我西郊。", modern: "亨通。密云满布却不下雨。小有积蓄而未大成。" },
    yaoCi: [
      { position: 1, label: "初九", original: "复自道，何其咎？吉。", modern: "回归自身之道，有何咎害？吉祥。" },
      { position: 2, label: "九二", original: "牵复，吉。", modern: "被牵引回归，吉祥。" },
      { position: 3, label: "九三", original: "舆说辐，夫妻反目。", modern: "车轮脱轴，夫妻反目。" },
      { position: 4, label: "六四", original: "有孚，血去惕出，无咎。", modern: "有诚信，免去血灾与忧惕，无咎。" },
      { position: 5, label: "九五", original: "有孚挛如，富以其邻。", modern: "以诚信牵系，与邻共富。" },
      { position: 6, label: "上九", original: "既雨既处，尚德载。妇贞厉，月几望，君子征凶。", modern: "雨已降下，安处已得。月近圆满时，君子出征凶。" },
    ],
  },
  // 10. 天泽履
  {
    id: 10, name: "天泽履", shortName: "履",
    upperTrigram: "乾", lowerTrigram: "兑", binaryPattern: 55,
    palace: "艮宫", palaceElement: "土", shiYaoPosition: 5, yingYaoPosition: 2,
    upperYaoWuXing: NAJIA_WUXING["乾"].upper, lowerYaoWuXing: NAJIA_WUXING["兑"].lower, element: "土",
    guaCi: { original: "履虎尾，不咥人，亨。", modern: "踩在老虎尾巴上，老虎却不咬人，亨通。虽险能化险为夷。" },
    yaoCi: [
      { position: 1, label: "初九", original: "素履，往无咎。", modern: "以质朴之心行事，前往无咎。" },
      { position: 2, label: "九二", original: "履道坦坦，幽人贞吉。", modern: "行道坦坦荡荡，幽居之人守正则吉。" },
      { position: 3, label: "六三", original: "眇能视，跛能履。履虎尾，咥人凶。武人为于大君。", modern: "独眼自以为能看，跛脚自以为能行。踩虎尾被咬，凶。武夫争当国君。" },
      { position: 4, label: "九四", original: "履虎尾，愬愬终吉。", modern: "踩虎尾而战战兢兢，终获吉祥。" },
      { position: 5, label: "九五", original: "夬履，贞厉。", modern: "果断而行，守正也有危险。" },
      { position: 6, label: "上九", original: "视履考祥，其旋元吉。", modern: "回顾行履，考察吉凶，返身则大吉。" },
    ],
  },
  // 11. 地天泰
  {
    id: 11, name: "地天泰", shortName: "泰",
    upperTrigram: "坤", lowerTrigram: "乾", binaryPattern: 7,
    palace: "坤宫", palaceElement: "土", shiYaoPosition: 3, yingYaoPosition: 6,
    upperYaoWuXing: NAJIA_WUXING["坤"].upper, lowerYaoWuXing: NAJIA_WUXING["乾"].lower, element: "土",
    guaCi: { original: "小往大来，吉亨。", modern: "小的消去，大的到来，吉祥亨通。天地交泰，万物通达。" },
    yaoCi: [
      { position: 1, label: "初九", original: "拔茅茹，以其汇，征吉。", modern: "拔茅草，连根带同类而起，出征则吉。" },
      { position: 2, label: "九二", original: "包荒，用冯河，不遐遗，朋亡，得尚于中行。", modern: "包容荒远，涉越大河，不遗远方，不结朋党，得中道而行。" },
      { position: 3, label: "九三", original: "无平不陂，无往不复。艰贞无咎。勿恤其孚，于食有福。", modern: "没有永恒的平坦，没有一去不复返。艰难守正则无咎。" },
      { position: 4, label: "六四", original: "翩翩不富，以其邻，不戒以孚。", modern: "翩翩往来而不富，与邻共处，以诚信不必戒备。" },
      { position: 5, label: "六五", original: "帝乙归妹，以祉元吉。", modern: "帝乙嫁妹，得福大吉。" },
      { position: 6, label: "上六", original: "城复于隍，勿用师。自邑告命，贞吝。", modern: "城墙倾覆于护城河，不可用兵。从邑中发布命令，守正亦有憾。" },
    ],
  },
  // 12. 天地否
  {
    id: 12, name: "天地否", shortName: "否",
    upperTrigram: "乾", lowerTrigram: "坤", binaryPattern: 56,
    palace: "乾宫", palaceElement: "金", shiYaoPosition: 3, yingYaoPosition: 6,
    upperYaoWuXing: NAJIA_WUXING["乾"].upper, lowerYaoWuXing: NAJIA_WUXING["坤"].lower, element: "金",
    guaCi: { original: "否之匪人，不利君子贞。大往小来。", modern: "否塞之时人道不通，不利于君子守正。大的消去，小的到来。" },
    yaoCi: [
      { position: 1, label: "初六", original: "拔茅茹，以其汇，贞吉亨。", modern: "拔茅草连根带同类，守正则吉亨。" },
      { position: 2, label: "六二", original: "包承，小人吉，大人否亨。", modern: "包容承顺，小人得吉，大人虽处否塞仍亨通。" },
      { position: 3, label: "六三", original: "包羞。", modern: "包藏羞耻。" },
      { position: 4, label: "九四", original: "有命无咎，畴离祉。", modern: "有天命在则无咎，众人共得福祉。" },
      { position: 5, label: "九五", original: "休否，大人吉。其亡其亡，系于苞桑。", modern: `终止否塞，大人得吉。常警惕“将亡将亡”，如系于柔韧桑枝般稳固。` },
      { position: 6, label: "上九", original: "倾否，先否后喜。", modern: "倾覆否塞，先悲后喜。否极泰来。" },
    ],
  },
  // 13. 天火同人
  {
    id: 13, name: "天火同人", shortName: "同人",
    upperTrigram: "乾", lowerTrigram: "离", binaryPattern: 61,
    palace: "离宫", palaceElement: "火", shiYaoPosition: 3, yingYaoPosition: 6,
    upperYaoWuXing: NAJIA_WUXING["乾"].upper, lowerYaoWuXing: NAJIA_WUXING["离"].lower, element: "火",
    guaCi: { original: "同人于野，亨。利涉大川，利君子贞。", modern: "在旷野中与人和同，亨通。利于渡大川，利于君子守正。" },
    yaoCi: [
      { position: 1, label: "初九", original: "同人于门，无咎。", modern: "在门口与人和同，无咎。" },
      { position: 2, label: "六二", original: "同人于宗，吝。", modern: "只在宗族内和同，格局太小有憾惜。" },
      { position: 3, label: "九三", original: "伏戎于莽，升其高陵，三岁不兴。", modern: "伏兵于草莽，登上高丘窥视，三年不敢兴兵。" },
      { position: 4, label: "九四", original: "乘其墉，弗克攻，吉。", modern: "登上高墙，却不攻打，吉祥。" },
      { position: 5, label: "九五", original: "同人先号咷而后笑，大师克相遇。", modern: "与人先哭号后欢笑，大军能够会师。" },
      { position: 6, label: "上九", original: "同人于郊，无悔。", modern: "在郊外与人和同，无悔。" },
    ],
  },
  // 14. 火天大有
  {
    id: 14, name: "火天大有", shortName: "大有",
    upperTrigram: "离", lowerTrigram: "乾", binaryPattern: 47,
    palace: "乾宫", palaceElement: "金", shiYaoPosition: 3, yingYaoPosition: 6,
    upperYaoWuXing: NAJIA_WUXING["离"].upper, lowerYaoWuXing: NAJIA_WUXING["乾"].lower, element: "金",
    guaCi: { original: "元亨。", modern: "大为亨通。丰收大有之年。" },
    yaoCi: [
      { position: 1, label: "初九", original: "无交害，匪咎。艰则无咎。", modern: "无交往之害，不是灾祸。知艰则无咎。" },
      { position: 2, label: "九二", original: "大车以载，有攸往，无咎。", modern: "大车满载，有所前往，无咎。" },
      { position: 3, label: "九三", original: "公用亨于天子，小人弗克。", modern: "公侯献贡于天子，小人做不到。" },
      { position: 4, label: "九四", original: "匪其彭，无咎。", modern: "不炫耀不盛气凌人，无咎。" },
      { position: 5, label: "六五", original: "厥孚交如，威如，吉。", modern: "以诚信相交，又有威仪，吉祥。" },
      { position: 6, label: "上九", original: "自天佑之，吉无不利。", modern: "有上天保佑，吉祥无不利。" },
    ],
  },
  // 15. 地山谦
  {
    id: 15, name: "地山谦", shortName: "谦",
    upperTrigram: "坤", lowerTrigram: "艮", binaryPattern: 1,
    palace: "兑宫", palaceElement: "金", shiYaoPosition: 5, yingYaoPosition: 2,
    upperYaoWuXing: NAJIA_WUXING["坤"].upper, lowerYaoWuXing: NAJIA_WUXING["艮"].lower, element: "金",
    guaCi: { original: "亨。君子有终。", modern: "亨通。君子有善终。谦虚使人受益。" },
    yaoCi: [
      { position: 1, label: "初六", original: "谦谦君子，用涉大川，吉。", modern: "谦而又谦的君子，可渡过大川，吉祥。" },
      { position: 2, label: "六二", original: "鸣谦，贞吉。", modern: "名扬而仍谦逊，守正则吉。" },
      { position: 3, label: "九三", original: "劳谦，君子有终吉。", modern: "有功劳而仍谦逊，君子有善终，吉祥。" },
      { position: 4, label: "六四", original: "无不利，撝谦。", modern: "无有不利，发挥谦虚之德。" },
      { position: 5, label: "六五", original: "不富以其邻，利用侵伐，无不利。", modern: "不以其邻而富，利于征伐不义，无不利。" },
      { position: 6, label: "上六", original: "鸣谦，利用行师，征邑国。", modern: "名扬而仍谦逊，利于出兵征伐邑国。" },
    ],
  },
  // 16. 雷地豫
  {
    id: 16, name: "雷地豫", shortName: "豫",
    upperTrigram: "震", lowerTrigram: "坤", binaryPattern: 4,
    palace: "震宫", palaceElement: "木", shiYaoPosition: 1, yingYaoPosition: 4,
    upperYaoWuXing: NAJIA_WUXING["震"].upper, lowerYaoWuXing: NAJIA_WUXING["坤"].lower, element: "木",
    guaCi: { original: "利建侯行师。", modern: "利于建立诸侯国和出兵行师。欢愉安乐。" },
    yaoCi: [
      { position: 1, label: "初六", original: "鸣豫，凶。", modern: "炫耀欢乐，凶。" },
      { position: 2, label: "六二", original: "介于石，不终日，贞吉。", modern: "坚如磐石，不终日沉溺，守正则吉。" },
      { position: 3, label: "六三", original: "盱豫，悔。迟有悔。", modern: "谄媚求乐，有悔。迟迟不改更有悔。" },
      { position: 4, label: "九四", original: "由豫，大有得。勿疑，朋盍簪。", modern: "由之而乐，大有所得。不要怀疑，朋友如发簪聚拢。" },
      { position: 5, label: "六五", original: "贞疾，恒不死。", modern: "守正防病，恒久而不死。" },
      { position: 6, label: "上六", original: "冥豫，成有渝，无咎。", modern: "昏暗中寻乐，成事后能改变，无咎。" },
    ],
  },
  // 17. 泽雷随
  {
    id: 17, name: "泽雷随", shortName: "随",
    upperTrigram: "兑", lowerTrigram: "震", binaryPattern: 52,
    palace: "震宫", palaceElement: "木", shiYaoPosition: 3, yingYaoPosition: 6,
    upperYaoWuXing: NAJIA_WUXING["兑"].upper, lowerYaoWuXing: NAJIA_WUXING["震"].lower, element: "木",
    guaCi: { original: "元亨利贞，无咎。", modern: "大为亨通，利于守正，无咎。随时而动，因顺而为。" },
    yaoCi: [
      { position: 1, label: "初九", original: "官有渝，贞吉。出门交有功。", modern: "官职有变，守正则吉。出门交往有成效。" },
      { position: 2, label: "六二", original: "系小子，失丈夫。", modern: "系住小孩，失去大人。因小失大。" },
      { position: 3, label: "六三", original: "系丈夫，失小子。随有求得，利居贞。", modern: "系住大人，失去小孩。随从而有求必得，利于安守正道。" },
      { position: 4, label: "九四", original: "随有获，贞凶。有孚在道，以明，何咎？", modern: "随从而有收获，守正也有凶。有诚信在道，光明磊落，有何咎？" },
      { position: 5, label: "九五", original: "孚于嘉，吉。", modern: "诚信于美善，吉祥。" },
      { position: 6, label: "上六", original: "拘系之，乃从维之。王用亨于西山。", modern: "被拘系，进而从之维系。王在西山祭祀。" },
    ],
  },
  // 18. 山风蛊
  {
    id: 18, name: "山风蛊", shortName: "蛊",
    upperTrigram: "艮", lowerTrigram: "巽", binaryPattern: 11,
    palace: "巽宫", palaceElement: "木", shiYaoPosition: 3, yingYaoPosition: 6,
    upperYaoWuXing: NAJIA_WUXING["艮"].upper, lowerYaoWuXing: NAJIA_WUXING["巽"].lower, element: "木",
    guaCi: { original: "元亨，利涉大川。先甲三日，后甲三日。", modern: "大为亨通，利于渡大川。做事前后都需要充分准备。治弊救衰。" },
    yaoCi: [
      { position: 1, label: "初六", original: "干父之蛊，有子，考无咎。厉终吉。", modern: "整治父辈弊端，有子如此，父无咎。虽危终吉。" },
      { position: 2, label: "九二", original: "干母之蛊，不可贞。", modern: "整治母辈之弊，不可太过强硬守正。" },
      { position: 3, label: "九三", original: "干父之蛊，小有悔，无大咎。", modern: "整治父辈之弊，小有悔恨，无大咎。" },
      { position: 4, label: "六四", original: "裕父之蛊，往见吝。", modern: "宽容父辈之弊，前往有憾惜。" },
      { position: 5, label: "六五", original: "干父之蛊，用誉。", modern: "整治父辈之弊，获得赞誉。" },
      { position: 6, label: "上九", original: "不事王侯，高尚其事。", modern: "不侍奉王侯，以高洁自守其事。" },
    ],
  },
  // 19. 地泽临
  {
    id: 19, name: "地泽临", shortName: "临",
    upperTrigram: "坤", lowerTrigram: "兑", binaryPattern: 6,
    palace: "坤宫", palaceElement: "土", shiYaoPosition: 2, yingYaoPosition: 5,
    upperYaoWuXing: NAJIA_WUXING["坤"].upper, lowerYaoWuXing: NAJIA_WUXING["兑"].lower, element: "土",
    guaCi: { original: "元亨利贞。至于八月有凶。", modern: "大为亨通，利于守正。到了八月可能有凶。居高临下，审时度势。" },
    yaoCi: [
      { position: 1, label: "初九", original: "咸临，贞吉。", modern: "以感化之心临下，守正则吉。" },
      { position: 2, label: "九二", original: "咸临，吉无不利。", modern: "以感化之心临下，吉无不利。" },
      { position: 3, label: "六三", original: "甘临，无攸利。既忧之，无咎。", modern: "以甜言蜜语临下，无所利。既能忧惧改过，无咎。" },
      { position: 4, label: "六四", original: "至临，无咎。", modern: "亲自临下，无咎。" },
      { position: 5, label: "六五", original: "知临，大君之宜，吉。", modern: "以智慧临下，大君该有的风范，吉祥。" },
      { position: 6, label: "上六", original: "敦临，吉无咎。", modern: "以敦厚之心临下，吉祥无咎。" },
    ],
  },
  // 20. 风地观
  {
    id: 20, name: "风地观", shortName: "观",
    upperTrigram: "巽", lowerTrigram: "坤", binaryPattern: 3,
    palace: "乾宫", palaceElement: "金", shiYaoPosition: 4, yingYaoPosition: 1,
    upperYaoWuXing: NAJIA_WUXING["巽"].upper, lowerYaoWuXing: NAJIA_WUXING["坤"].lower, element: "金",
    guaCi: { original: "盥而不荐，有孚颙若。", modern: "洗手后尚未献祭，已显虔诚仰望之态。以诚敬之心观察省思。" },
    yaoCi: [
      { position: 1, label: "初六", original: "童观，小人无咎，君子吝。", modern: "以童稚眼光观察，小人无咎，君子则有憾。" },
      { position: 2, label: "六二", original: "窥观，利女贞。", modern: "从缝隙窥视，利于女子守正（格局太小）。" },
      { position: 3, label: "六三", original: "观我生，进退。", modern: "观察自身行为，知进退。" },
      { position: 4, label: "六四", original: "观国之光，利用宾于王。", modern: "观察国家之光辉，利于做王的宾客。" },
      { position: 5, label: "九五", original: "观我生，君子无咎。", modern: "观察自身行为，君子无咎。" },
      { position: 6, label: "上九", original: "观其生，君子无咎。", modern: "观察他人行为，君子无咎。" },
    ],
  },
  // 21. 火雷噬嗑
  {
    id: 21, name: "火雷噬嗑", shortName: "噬嗑",
    upperTrigram: "离", lowerTrigram: "震", binaryPattern: 52,
    palace: "巽宫", palaceElement: "木", shiYaoPosition: 5, yingYaoPosition: 2,
    upperYaoWuXing: NAJIA_WUXING["离"].upper, lowerYaoWuXing: NAJIA_WUXING["震"].lower, element: "木",
    guaCi: { original: "亨。利用狱。", modern: "亨通。利于用刑断狱。咬合而通，清除障碍。" },
    yaoCi: [
      { position: 1, label: "初九", original: "屦校灭趾，无咎。", modern: "脚戴刑具遮住脚趾，无咎。小惩大诫。" },
      { position: 2, label: "六二", original: "噬肤灭鼻，无咎。", modern: "咬柔肉而掩鼻，无咎。" },
      { position: 3, label: "六三", original: "噬腊肉，遇毒。小吝，无咎。", modern: "吃腊肉遇到毒物，小有憾惜，无咎。" },
      { position: 4, label: "九四", original: "噬干胏，得金矢。利艰贞，吉。", modern: "吃带骨干肉得金箭头。利于艰难守正，吉祥。" },
      { position: 5, label: "六五", original: "噬干肉，得黄金。贞厉，无咎。", modern: "吃干肉得黄金。守正虽有危险但无咎。" },
      { position: 6, label: "上九", original: "何校灭耳，凶。", modern: "肩负刑具遮没耳朵，凶。" },
    ],
  },
  // 22. 山火贲
  {
    id: 22, name: "山火贲", shortName: "贲",
    upperTrigram: "艮", lowerTrigram: "离", binaryPattern: 45,
    palace: "艮宫", palaceElement: "土", shiYaoPosition: 1, yingYaoPosition: 4,
    upperYaoWuXing: NAJIA_WUXING["艮"].upper, lowerYaoWuXing: NAJIA_WUXING["离"].lower, element: "土",
    guaCi: { original: "亨。小利有攸往。", modern: "亨通。小利于有所前往。文饰之美，不可过度。" },
    yaoCi: [
      { position: 1, label: "初九", original: "贲其趾，舍车而徒。", modern: "装饰脚趾，舍车而步行。" },
      { position: 2, label: "六二", original: "贲其须。", modern: "装饰胡须。" },
      { position: 3, label: "九三", original: "贲如濡如，永贞吉。", modern: "文饰润泽，长久守正则吉。" },
      { position: 4, label: "六四", original: "贲如皤如，白马翰如。匪寇婚媾。", modern: "文饰素白，白马奔驰。非劫匪而是求婚者。" },
      { position: 5, label: "六五", original: "贲于丘园，束帛戋戋。吝，终吉。", modern: "装饰丘园，束帛微薄。虽有憾惜，终获吉祥。" },
      { position: 6, label: "上九", original: "白贲，无咎。", modern: "以素白为饰，返璞归真，无咎。" },
    ],
  },
  // 23. 山地剥
  {
    id: 23, name: "山地剥", shortName: "剥",
    upperTrigram: "艮", lowerTrigram: "坤", binaryPattern: 1,
    palace: "乾宫", palaceElement: "金", shiYaoPosition: 5, yingYaoPosition: 2,
    upperYaoWuXing: NAJIA_WUXING["艮"].upper, lowerYaoWuXing: NAJIA_WUXING["坤"].lower, element: "金",
    guaCi: { original: "不利有攸往。", modern: "不利于有所前往。小人道长，君子道消，宜顺时而止。" },
    yaoCi: [
      { position: 1, label: "初六", original: "剥床以足，蔑贞凶。", modern: "剥蚀床脚，蔑视正道则凶。" },
      { position: 2, label: "六二", original: "剥床以辨，蔑贞凶。", modern: "剥蚀床板，蔑视正道则凶。" },
      { position: 3, label: "六三", original: "剥之，无咎。", modern: "被剥蚀，无咎（上下皆阴，独与上九相应）。" },
      { position: 4, label: "六四", original: "剥床以肤，凶。", modern: "剥蚀床席近体肤，凶。" },
      { position: 5, label: "六五", original: "贯鱼，以宫人宠，无不利。", modern: "如穿鱼贯列，以宫人身份受宠，无不利。" },
      { position: 6, label: "上九", original: "硕果不食，君子得舆，小人剥庐。", modern: "硕果未被吞食，君子得车舆，小人被剥去庐舍。" },
    ],
  },
  // 24. 地雷复
  {
    id: 24, name: "地雷复", shortName: "复",
    upperTrigram: "坤", lowerTrigram: "震", binaryPattern: 4,
    palace: "坤宫", palaceElement: "土", shiYaoPosition: 1, yingYaoPosition: 4,
    upperYaoWuXing: NAJIA_WUXING["坤"].upper, lowerYaoWuXing: NAJIA_WUXING["震"].lower, element: "土",
    guaCi: { original: "亨。出入无疾，朋来无咎。反复其道，七日来复。利有攸往。", modern: "亨通。出入无病，朋友来无咎。循环反复，七日一回归。利于有所前往。" },
    yaoCi: [
      { position: 1, label: "初九", original: "不远复，无祗悔，元吉。", modern: "走不远就回归，无大悔恨，大为吉祥。" },
      { position: 2, label: "六二", original: "休复，吉。", modern: "愉快地回归，吉祥。" },
      { position: 3, label: "六三", original: "频复，厉无咎。", modern: "频频回归，虽有危险但无咎。" },
      { position: 4, label: "六四", original: "中行独复。", modern: "行至中途独自回归。" },
      { position: 5, label: "六五", original: "敦复，无悔。", modern: "敦厚地回归，无悔。" },
      { position: 6, label: "上六", original: "迷复，凶。有灾眚。用行师，终有大败。", modern: "迷失归路，凶。有灾祸。用兵出师，终有大败。" },
    ],
  },
  // 25. 天雷无妄
  {
    id: 25, name: "天雷无妄", shortName: "无妄",
    upperTrigram: "乾", lowerTrigram: "震", binaryPattern: 60,
    palace: "巽宫", palaceElement: "木", shiYaoPosition: 4, yingYaoPosition: 1,
    upperYaoWuXing: NAJIA_WUXING["乾"].upper, lowerYaoWuXing: NAJIA_WUXING["震"].lower, element: "木",
    guaCi: { original: "元亨利贞。其匪正有眚，不利有攸往。", modern: "大为亨通利于守正。若不行正道则有灾祸，不利于前往。" },
    yaoCi: [
      { position: 1, label: "初九", original: "无妄，往吉。", modern: "不妄为，前往则吉。" },
      { position: 2, label: "六二", original: "不耕获，不菑畲，则利有攸往。", modern: "不耕而收获，不垦而熟田，利于有所前往。" },
      { position: 3, label: "六三", original: "无妄之灾，或系之牛，行人之得，邑人之灾。", modern: "无故遭灾，如牛被系，行人牵走，邑人蒙灾。" },
      { position: 4, label: "九四", original: "可贞，无咎。", modern: "可以守正，无咎。" },
      { position: 5, label: "九五", original: "无妄之疾，勿药有喜。", modern: "无故生病，不用吃药自会痊愈有喜。" },
      { position: 6, label: "上九", original: "无妄，行有眚，无攸利。", modern: "不要妄为，行动有灾，无所利。" },
    ],
  },
  // 26. 山天大畜
  {
    id: 26, name: "山天大畜", shortName: "大畜",
    upperTrigram: "艮", lowerTrigram: "乾", binaryPattern: 57,
    palace: "艮宫", palaceElement: "土", shiYaoPosition: 2, yingYaoPosition: 5,
    upperYaoWuXing: NAJIA_WUXING["艮"].upper, lowerYaoWuXing: NAJIA_WUXING["乾"].lower, element: "土",
    guaCi: { original: "利贞。不家食吉。利涉大川。", modern: "利于守正。不在家吃闲饭则吉。利于渡大川。大积蓄大作为。" },
    yaoCi: [
      { position: 1, label: "初九", original: "有厉，利已。", modern: "有危险，利于停止。" },
      { position: 2, label: "九二", original: "舆说輹。", modern: "车轮脱轴。" },
      { position: 3, label: "九三", original: "良马逐，利艰贞。曰闲舆卫，利有攸往。", modern: "良马奔驰，利于艰难守正。练习车马防卫，利于前往。" },
      { position: 4, label: "六四", original: "童牛之牿，元吉。", modern: "在小牛角上装横木（防患未然），大为吉祥。" },
      { position: 5, label: "六五", original: "豮豕之牙，吉。", modern: "阉猪的獠牙（去除凶性），吉祥。" },
      { position: 6, label: "上九", original: "何天之衢，亨。", modern: "通达于天之大路，亨通。" },
    ],
  },
  // 27. 山雷颐
  {
    id: 27, name: "山雷颐", shortName: "颐",
    upperTrigram: "艮", lowerTrigram: "震", binaryPattern: 33,
    palace: "巽宫", palaceElement: "木", shiYaoPosition: 4, yingYaoPosition: 1,
    upperYaoWuXing: NAJIA_WUXING["艮"].upper, lowerYaoWuXing: NAJIA_WUXING["震"].lower, element: "木",
    guaCi: { original: "贞吉。观颐，自求口实。", modern: "守正则吉。观察颐养之道，自求口中之食。" },
    yaoCi: [
      { position: 1, label: "初九", original: "舍尔灵龟，观我朵颐，凶。", modern: "舍弃你的灵龟，看我大吃大嚼，凶。" },
      { position: 2, label: "六二", original: "颠颐，拂经于丘颐，征凶。", modern: "颠倒颐养，违背常理求养于上，出征则凶。" },
      { position: 3, label: "六三", original: "拂颐，贞凶。十年勿用，无攸利。", modern: "违背颐养之道，守正也有凶。十年不可用，无所利。" },
      { position: 4, label: "六四", original: "颠颐吉。虎视眈眈，其欲逐逐，无咎。", modern: "颠倒颐养反而吉祥。如虎眈眈而视，欲求追逐，无咎。" },
      { position: 5, label: "六五", original: "拂经，居贞吉。不可涉大川。", modern: "虽违常理，守正则吉。不可渡大川。" },
      { position: 6, label: "上九", original: "由颐，厉吉。利涉大川。", modern: "由此而获颐养，虽危终吉。利于渡大川。" },
    ],
  },
  // 28. 泽风大过
  {
    id: 28, name: "泽风大过", shortName: "大过",
    upperTrigram: "兑", lowerTrigram: "巽", binaryPattern: 30,
    palace: "震宫", palaceElement: "木", shiYaoPosition: 4, yingYaoPosition: 1,
    upperYaoWuXing: NAJIA_WUXING["兑"].upper, lowerYaoWuXing: NAJIA_WUXING["巽"].lower, element: "木",
    guaCi: { original: "栋桡。利有攸往，亨。", modern: "栋梁弯曲。利于有所前往，亨通。大过之时，非常之举。" },
    yaoCi: [
      { position: 1, label: "初六", original: "藉用白茅，无咎。", modern: "用白茅铺垫，无咎。谨慎之至。" },
      { position: 2, label: "九二", original: "枯杨生稊，老夫得其女妻，无不利。", modern: "枯杨生新枝，老夫得少妻，无不利。" },
      { position: 3, label: "九三", original: "栋桡，凶。", modern: "栋梁弯曲，凶。" },
      { position: 4, label: "九四", original: "栋隆，吉。有它吝。", modern: "栋梁隆起，吉祥。但有意外之憾。" },
      { position: 5, label: "九五", original: "枯杨生华，老妇得其士夫，无咎无誉。", modern: "枯杨开花，老妇得少夫，无咎无誉。" },
      { position: 6, label: "上六", original: "过涉灭顶，凶，无咎。", modern: "涉水过头顶，凶险。但非其罪，无咎。" },
    ],
  },
  // 29. 坎为水
  {
    id: 29, name: "坎为水", shortName: "坎",
    upperTrigram: "坎", lowerTrigram: "坎", binaryPattern: 10,
    palace: "坎宫", palaceElement: "水", shiYaoPosition: 6, yingYaoPosition: 3,
    upperYaoWuXing: NAJIA_WUXING["坎"].upper, lowerYaoWuXing: NAJIA_WUXING["坎"].lower, element: "水",
    guaCi: { original: "习坎，有孚，维心亨，行有尚。", modern: "重重险陷，有诚信则内心亨通，行动有可嘉尚之处。" },
    yaoCi: [
      { position: 1, label: "初六", original: "习坎，入于坎窞，凶。", modern: "重重险陷，陷入深坑，凶。" },
      { position: 2, label: "九二", original: "坎有险，求小得。", modern: "险中有险，求取小有所得。" },
      { position: 3, label: "六三", original: "来之坎坎，险且枕，入于坎窞，勿用。", modern: "来往都是险陷，险而且深。陷入深坑，不可用。" },
      { position: 4, label: "六四", original: "樽酒簋贰，用缶，纳约自牖，终无咎。", modern: "用樽酒簋食瓦缶之器，简约地从窗中送进，终无咎。" },
      { position: 5, label: "九五", original: "坎不盈，祗既平，无咎。", modern: "险坑未满，水已平静，无咎。" },
      { position: 6, label: "上六", original: "系用徽纆，寘于丛棘，三岁不得，凶。", modern: "被绳索捆绑，囚置于荆棘丛中，三年不得脱身，凶。" },
    ],
  },
  // 30. 离为火
  {
    id: 30, name: "离为火", shortName: "离",
    upperTrigram: "离", lowerTrigram: "离", binaryPattern: 21,
    palace: "离宫", palaceElement: "火", shiYaoPosition: 6, yingYaoPosition: 3,
    upperYaoWuXing: NAJIA_WUXING["离"].upper, lowerYaoWuXing: NAJIA_WUXING["离"].lower, element: "火",
    guaCi: { original: "利贞，亨。畜牝牛，吉。", modern: "利于守正，亨通。畜养母牛，吉祥。依附于正道则光明。" },
    yaoCi: [
      { position: 1, label: "初九", original: "履错然，敬之无咎。", modern: "脚步错杂纷乱，敬慎从事则无咎。" },
      { position: 2, label: "六二", original: "黄离，元吉。", modern: "黄色附丽，中正之道，大为吉祥。" },
      { position: 3, label: "九三", original: "日昃之离，不鼓缶而歌，则大耋之嗟，凶。", modern: "日暮时分之附丽，若不鼓缶而歌乐天知命，则老迈叹息，凶。" },
      { position: 4, label: "九四", original: "突如其来如，焚如，死如，弃如。", modern: "突然而来，如火烧，如死亡，如被弃。" },
      { position: 5, label: "六五", original: "出涕沱若，戚嗟若，吉。", modern: "泪流如雨，悲戚叹息，因忧惧而知戒，吉祥。" },
      { position: 6, label: "上九", original: "王用出征，有嘉折首，获匪其丑，无咎。", modern: "王用兵出征，嘉奖斩首之功，俘获其众，无咎。" },
    ],
  },
  // 31. 泽山咸
  {
    id: 31, name: "泽山咸", shortName: "咸",
    upperTrigram: "兑", lowerTrigram: "艮", binaryPattern: 38,
    palace: "兑宫", palaceElement: "金", shiYaoPosition: 3, yingYaoPosition: 6,
    upperYaoWuXing: NAJIA_WUXING["兑"].upper, lowerYaoWuXing: NAJIA_WUXING["艮"].lower, element: "金",
    guaCi: { original: "亨利贞。取女吉。", modern: "亨通，利于守正。娶妻吉祥。感应之道，以虚受人。" },
    yaoCi: [
      { position: 1, label: "初六", original: "咸其拇。", modern: "感应到脚拇指。" },
      { position: 2, label: "六二", original: "咸其腓，凶。居吉。", modern: "感应到小腿肚，有凶。安静守正则吉。" },
      { position: 3, label: "九三", original: "咸其股，执其随，往吝。", modern: "感应到大腿，执意随从，前往有憾。" },
      { position: 4, label: "九四", original: "贞吉悔亡。憧憧往来，朋从尔思。", modern: "守正则吉悔恨消失。心神不定往来不定，朋友终会顺从你的心思。" },
      { position: 5, label: "九五", original: "咸其脢，无悔。", modern: "感应到脊背，无悔。" },
      { position: 6, label: "上六", original: "咸其辅颊舌。", modern: "感应到面颊口舌。" },
    ],
  },
  // 32. 雷风恒
  {
    id: 32, name: "雷风恒", shortName: "恒",
    upperTrigram: "震", lowerTrigram: "巽", binaryPattern: 28,
    palace: "震宫", palaceElement: "木", shiYaoPosition: 3, yingYaoPosition: 6,
    upperYaoWuXing: NAJIA_WUXING["震"].upper, lowerYaoWuXing: NAJIA_WUXING["巽"].lower, element: "木",
    guaCi: { original: "亨，无咎，利贞。利有攸往。", modern: "亨通，无咎，利于守正。利于有所前往。恒久之道。" },
    yaoCi: [
      { position: 1, label: "初六", original: "浚恒，贞凶，无攸利。", modern: "深求恒久，守正也有凶，无所利。" },
      { position: 2, label: "九二", original: "悔亡。", modern: "悔恨消失。" },
      { position: 3, label: "九三", original: "不恒其德，或承之羞，贞吝。", modern: "不能恒守其德，或蒙受羞辱，守正也有憾。" },
      { position: 4, label: "九四", original: "田无禽。", modern: "田猎没有禽兽。徒劳无功。" },
      { position: 5, label: "六五", original: "恒其德，贞。妇人吉，夫子凶。", modern: "恒守其德，守正。妇人则吉，男子则凶。" },
      { position: 6, label: "上六", original: "振恒，凶。", modern: "动荡不安于恒久之道，凶。" },
    ],
  },
  // 33. 天山遁
  {
    id: 33, name: "天山遁", shortName: "遁",
    upperTrigram: "乾", lowerTrigram: "艮", binaryPattern: 49,
    palace: "乾宫", palaceElement: "金", shiYaoPosition: 2, yingYaoPosition: 5,
    upperYaoWuXing: NAJIA_WUXING["乾"].upper, lowerYaoWuXing: NAJIA_WUXING["艮"].lower, element: "金",
    guaCi: { original: "亨。小利贞。", modern: "亨通。小利于守正。君子退避，不与小人争。" },
    yaoCi: [
      { position: 1, label: "初六", original: "遁尾，厉。勿用有攸往。", modern: "退避在末尾，有危险。不宜有所前往。" },
      { position: 2, label: "六二", original: "执之用黄牛之革，莫之胜说。", modern: "用黄牛皮革牢牢捆缚，没人能解开。" },
      { position: 3, label: "九三", original: "系遁，有疾厉。畜臣妾吉。", modern: "被牵系而难以退避，有疾病危险。畜养臣妾则吉。" },
      { position: 4, label: "九四", original: "好遁，君子吉，小人否。", modern: "善于退避，君子吉祥，小人则否。" },
      { position: 5, label: "九五", original: "嘉遁，贞吉。", modern: "嘉美地退避，守正则吉。" },
      { position: 6, label: "上九", original: "肥遁，无不利。", modern: "从容宽裕地退避，无不利。" },
    ],
  },
  // 34. 雷天大壮
  {
    id: 34, name: "雷天大壮", shortName: "大壮",
    upperTrigram: "震", lowerTrigram: "乾", binaryPattern: 60,
    palace: "坤宫", palaceElement: "土", shiYaoPosition: 4, yingYaoPosition: 1,
    upperYaoWuXing: NAJIA_WUXING["震"].upper, lowerYaoWuXing: NAJIA_WUXING["乾"].lower, element: "土",
    guaCi: { original: "利贞。", modern: "利于守正。阳刚壮盛，非礼勿动。" },
    yaoCi: [
      { position: 1, label: "初九", original: "壮于趾，征凶，有孚。", modern: "壮在脚趾，出征则凶，要有诚信。" },
      { position: 2, label: "九二", original: "贞吉。", modern: "守正则吉。" },
      { position: 3, label: "九三", original: "小人用壮，君子用罔。贞厉。羝羊触藩，羸其角。", modern: "小人用壮力，君子则不这样。守正有险。公羊触藩篱，卡住角。" },
      { position: 4, label: "九四", original: "贞吉悔亡。藩决不羸，壮于大舆之輹。", modern: "守正则吉悔恨消失。藩篱决口不再卡角，壮在大车之轮轴。" },
      { position: 5, label: "六五", original: "丧羊于易，无悔。", modern: "在田畔丢失了羊，无悔。" },
      { position: 6, label: "上六", original: "羝羊触藩，不能退，不能遂。无攸利，艰则吉。", modern: "公羊触藩篱，不能退也不能进。无所利，知艰则吉。" },
    ],
  },
  // 35. 火地晋
  {
    id: 35, name: "火地晋", shortName: "晋",
    upperTrigram: "离", lowerTrigram: "坤", binaryPattern: 5,
    palace: "乾宫", palaceElement: "金", shiYaoPosition: 4, yingYaoPosition: 1,
    upperYaoWuXing: NAJIA_WUXING["离"].upper, lowerYaoWuXing: NAJIA_WUXING["坤"].lower, element: "金",
    guaCi: { original: "康侯用锡马蕃庶，昼日三接。", modern: "康侯用赏赐的良马繁殖，一日三次接见。柔进上行，光明磊落。" },
    yaoCi: [
      { position: 1, label: "初六", original: "晋如摧如，贞吉。罔孚，裕无咎。", modern: "前进或受挫，守正则吉。未得信任时宽裕待之则无咎。" },
      { position: 2, label: "六二", original: "晋如愁如，贞吉。受兹介福，于其王母。", modern: "前进而忧愁，守正则吉。从王母那里接受大福。" },
      { position: 3, label: "六三", original: "众允，悔亡。", modern: "众人信任服从，悔恨消失。" },
      { position: 4, label: "九四", original: "晋如鼫鼠，贞厉。", modern: "前进如硕鼠般贪婪，守正也有危险。" },
      { position: 5, label: "六五", original: "悔亡，失得勿恤。往吉无不利。", modern: "悔恨消失，得失都不必忧虑。前往吉无不利。" },
      { position: 6, label: "上九", original: "晋其角，维用伐邑。厉吉无咎，贞吝。", modern: "前进用其锐角，用于征伐邑国。虽危终吉但守正有憾。" },
    ],
  },
  // 36. 地火明夷
  {
    id: 36, name: "地火明夷", shortName: "明夷",
    upperTrigram: "坤", lowerTrigram: "离", binaryPattern: 5,
    palace: "坎宫", palaceElement: "水", shiYaoPosition: 4, yingYaoPosition: 1,
    upperYaoWuXing: NAJIA_WUXING["坤"].upper, lowerYaoWuXing: NAJIA_WUXING["离"].lower, element: "水",
    guaCi: { original: "利艰贞。", modern: "利于在艰难中守正。光明受伤，宜韬光养晦。" },
    yaoCi: [
      { position: 1, label: "初九", original: "明夷于飞，垂其翼。君子于行，三日不食。有攸往，主人有言。", modern: "光明受伤如鸟低飞垂翼。君子出行三日不食。有所前往，主人有责怪之言。" },
      { position: 2, label: "六二", original: "明夷，夷于左股，用拯马壮，吉。", modern: "光明受伤伤在左腿，用强壮的马来救助，吉祥。" },
      { position: 3, label: "九三", original: "明夷于南狩，得其大首。不可疾贞。", modern: "光明受伤时在南方狩猎，俘获大首领。不可急于守正。" },
      { position: 4, label: "六四", original: "入于左腹，获明夷之心，于出门庭。", modern: "进入左腹，获取受伤光明之心，于是出门离去。" },
      { position: 5, label: "六五", original: "箕子之明夷，利贞。", modern: "箕子那样的光明受伤，利于守正。" },
      { position: 6, label: "上六", original: "不明晦，初登于天，后入于地。", modern: "不明而暗，起初登于天上，后来坠入地下。" },
    ],
  },
  // 37. 风火家人
  {
    id: 37, name: "风火家人", shortName: "家人",
    upperTrigram: "巽", lowerTrigram: "离", binaryPattern: 43,
    palace: "巽宫", palaceElement: "木", shiYaoPosition: 2, yingYaoPosition: 5,
    upperYaoWuXing: NAJIA_WUXING["巽"].upper, lowerYaoWuXing: NAJIA_WUXING["离"].lower, element: "木",
    guaCi: { original: "利女贞。", modern: "利于女子守正。家道正则天下定。" },
    yaoCi: [
      { position: 1, label: "初九", original: "闲有家，悔亡。", modern: "在家中防患于未然，悔恨消失。" },
      { position: 2, label: "六二", original: "无攸遂，在中馈，贞吉。", modern: "无所专断，在家中主持饮食，守正则吉。" },
      { position: 3, label: "九三", original: "家人嗃嗃，悔厉吉。妇子嘻嘻，终吝。", modern: "家人严肃苛刻，有悔有险终吉。妇人孩子嘻嘻哈哈，终有憾。" },
      { position: 4, label: "六四", original: "富家，大吉。", modern: "使家庭富裕，大为吉祥。" },
      { position: 5, label: "九五", original: "王假有家，勿恤，吉。", modern: "君王来到家中，不用忧虑，吉祥。" },
      { position: 6, label: "上九", original: "有孚威如，终吉。", modern: "有诚信又有威严，终获吉祥。" },
    ],
  },
  // 38. 火泽睽
  {
    id: 38, name: "火泽睽", shortName: "睽",
    upperTrigram: "离", lowerTrigram: "兑", binaryPattern: 53,
    palace: "艮宫", palaceElement: "土", shiYaoPosition: 4, yingYaoPosition: 1,
    upperYaoWuXing: NAJIA_WUXING["离"].upper, lowerYaoWuXing: NAJIA_WUXING["兑"].lower, element: "土",
    guaCi: { original: "小事吉。", modern: "小事吉祥。乖离之时宜和而不同，求同存异。" },
    yaoCi: [
      { position: 1, label: "初九", original: "悔亡。丧马勿逐，自复。见恶人无咎。", modern: "悔恨消失。丢马不必追，会自己回来。见恶人无咎。" },
      { position: 2, label: "九二", original: "遇主于巷，无咎。", modern: "在巷中遇主人，无咎。" },
      { position: 3, label: "六三", original: "见舆曳，其牛掣，其人天且劓。无初有终。", modern: "见车被拖曳，牛被牵制，人被黥面割鼻。开始不顺终有好结果。" },
      { position: 4, label: "九四", original: "睽孤，遇元夫，交孚，厉无咎。", modern: "乖离孤独，遇善士，以诚信相交，虽危无咎。" },
      { position: 5, label: "六五", original: "悔亡。厥宗噬肤，往何咎？", modern: "悔恨消失。其宗族在吃肉，前往有何咎？" },
      { position: 6, label: "上九", original: "睽孤，见豕负涂，载鬼一车。先张之弧，后说之弧。匪寇婚媾，往遇雨则吉。", modern: "乖离孤独，见猪满身泥，一车鬼怪。先张弓，后放下。非盗乃婚娶，往遇雨则吉。" },
    ],
  },
  // 39. 水山蹇
  {
    id: 39, name: "水山蹇", shortName: "蹇",
    upperTrigram: "坎", lowerTrigram: "艮", binaryPattern: 10,
    palace: "兑宫", palaceElement: "金", shiYaoPosition: 4, yingYaoPosition: 1,
    upperYaoWuXing: NAJIA_WUXING["坎"].upper, lowerYaoWuXing: NAJIA_WUXING["艮"].lower, element: "金",
    guaCi: { original: "利西南，不利东北。利见大人，贞吉。", modern: "利于西南，不利东北。利于见贵人，守正则吉。艰难之时宜止则止。" },
    yaoCi: [
      { position: 1, label: "初六", original: "往蹇，来誉。", modern: "前往艰难，回来获赞誉。" },
      { position: 2, label: "六二", original: "王臣蹇蹇，匪躬之故。", modern: "王臣面临重重艰难，并非自身的过错。" },
      { position: 3, label: "九三", original: "往蹇来反。", modern: "前往艰难，返身回来。" },
      { position: 4, label: "六四", original: "往蹇来连。", modern: "前往艰难，回来有所连结。" },
      { position: 5, label: "九五", original: "大蹇朋来。", modern: "大艰难中朋友来助。" },
      { position: 6, label: "上六", original: "往蹇来硕，吉。利见大人。", modern: "前往艰难回来收获丰硕，吉祥。利于见贵人。" },
    ],
  },
  // 40. 雷水解
  {
    id: 40, name: "雷水解", shortName: "解",
    upperTrigram: "震", lowerTrigram: "坎", binaryPattern: 18,
    palace: "震宫", palaceElement: "木", shiYaoPosition: 2, yingYaoPosition: 5,
    upperYaoWuXing: NAJIA_WUXING["震"].upper, lowerYaoWuXing: NAJIA_WUXING["坎"].lower, element: "木",
    guaCi: { original: "利西南。无所往，其来复吉。有攸往，夙吉。", modern: "利于西南。不必前往，返回来则吉。有所前往，及早则吉。" },
    yaoCi: [
      { position: 1, label: "初六", original: "无咎。", modern: "无咎。" },
      { position: 2, label: "九二", original: "田获三狐，得黄矢，贞吉。", modern: "田猎获三狐，得黄金箭，守正则吉。" },
      { position: 3, label: "六三", original: "负且乘，致寇至，贞吝。", modern: "背着东西又乘车，招致盗寇，守正有憾。" },
      { position: 4, label: "九四", original: "解而拇，朋至斯孚。", modern: "解开脚拇指的束缚，朋友来则有诚信。" },
      { position: 5, label: "六五", original: "君子维有解，吉。有孚于小人。", modern: "君子被解除束缚，吉祥。以诚信感化小人。" },
      { position: 6, label: "上六", original: "公用射隼于高墉之上，获之，无不利。", modern: "公在高墙上射鹰，捕获之，无不利。" },
    ],
  },
  // 41. 山泽损
  {
    id: 41, name: "山泽损", shortName: "损",
    upperTrigram: "艮", lowerTrigram: "兑", binaryPattern: 38,
    palace: "艮宫", palaceElement: "土", shiYaoPosition: 3, yingYaoPosition: 6,
    upperYaoWuXing: NAJIA_WUXING["艮"].upper, lowerYaoWuXing: NAJIA_WUXING["兑"].lower, element: "土",
    guaCi: { original: "有孚，元吉，无咎，可贞。利有攸往。曷之用？二簋可用享。", modern: "有诚信，大为吉祥，无咎，可守正。利于前往。用什么祭祀？两簋即可。" },
    yaoCi: [
      { position: 1, label: "初九", original: "已事遄往，无咎。酌损之。", modern: "事毕速往，无咎。适当减损。" },
      { position: 2, label: "九二", original: "利贞，征凶。弗损益之。", modern: "利于守正，出征则凶。不减损而增益之。" },
      { position: 3, label: "六三", original: "三人行，则损一人。一人行，则得其友。", modern: "三人同行则减损一人，一人独行则得其友。" },
      { position: 4, label: "六四", original: "损其疾，使遄有喜，无咎。", modern: "减损其病疾，迅速则有喜，无咎。" },
      { position: 5, label: "六五", original: "或益之十朋之龟，弗克违，元吉。", modern: "有人赠以价值十朋的大龟，无法推辞，大为吉祥。" },
      { position: 6, label: "上九", original: "弗损益之，无咎，贞吉。利有攸往，得臣无家。", modern: "不减损而增益之，无咎，守正则吉。利于前往，得忘家之臣。" },
    ],
  },
  // 42. 风雷益
  {
    id: 42, name: "风雷益", shortName: "益",
    upperTrigram: "巽", lowerTrigram: "震", binaryPattern: 60,
    palace: "巽宫", palaceElement: "木", shiYaoPosition: 3, yingYaoPosition: 6,
    upperYaoWuXing: NAJIA_WUXING["巽"].upper, lowerYaoWuXing: NAJIA_WUXING["震"].lower, element: "木",
    guaCi: { original: "利有攸往，利涉大川。", modern: "利于有所前往，利于渡大川。损上益下，民悦无疆。" },
    yaoCi: [
      { position: 1, label: "初九", original: "利用为大作，元吉，无咎。", modern: "利于大兴土木建设，大为吉祥，无咎。" },
      { position: 2, label: "六二", original: "或益之十朋之龟，弗克违，永贞吉。王用享于帝，吉。", modern: "有人赠以十朋大龟无法推辞，永守正则吉。王用以祭天帝，吉祥。" },
      { position: 3, label: "六三", original: "益之用凶事，无咎。有孚中行，告公用圭。", modern: "增益用于凶险之事，无咎。有诚信行中道，以圭告公。" },
      { position: 4, label: "六四", original: "中行，告公从。利用为依迁国。", modern: "行中道告公而获从。利于作为依靠来迁移国都。" },
      { position: 5, label: "九五", original: "有孚惠心，勿问元吉。有孚惠我德。", modern: "有诚信施惠之心，不用问大为吉祥。有诚信施惠于我的德行。" },
      { position: 6, label: "上九", original: "莫益之，或击之。立心勿恒，凶。", modern: "无人增益他，反有人攻击他。立心不恒，凶。" },
    ],
  },
  // 43. 泽天夬
  {
    id: 43, name: "泽天夬", shortName: "夬",
    upperTrigram: "兑", lowerTrigram: "乾", binaryPattern: 47,
    palace: "坤宫", palaceElement: "土", shiYaoPosition: 5, yingYaoPosition: 2,
    upperYaoWuXing: NAJIA_WUXING["兑"].upper, lowerYaoWuXing: NAJIA_WUXING["乾"].lower, element: "土",
    guaCi: { original: "扬于王庭，孚号有厉。告自邑，不利即戎。利有攸往。", modern: "在王庭上宣扬，有诚信呼号知有危险。告于己邑，不宜即刻动武。利于前往。" },
    yaoCi: [
      { position: 1, label: "初九", original: "壮于前趾，往不胜为咎。", modern: "壮在脚前趾，前往不胜则有咎。" },
      { position: 2, label: "九二", original: "惕号，莫夜有戎，勿恤。", modern: "警惕呼号，暮夜有兵戎也不必忧虑。" },
      { position: 3, label: "九三", original: "壮于頄，有凶。君子夬夬，独行遇雨，若濡有愠，无咎。", modern: "壮在颧骨，有凶。君子果断决绝，独行遇雨，被淋湿有愠色，无咎。" },
      { position: 4, label: "九四", original: "臀无肤，其行次且。牵羊悔亡，闻言不信。", modern: "臀部无肉，行走困难。牵羊前进悔恨消失，听人说话却不信。" },
      { position: 5, label: "九五", original: "苋陆夬夬，中行无咎。", modern: "如马齿苋般脆断决绝，行中道则无咎。" },
      { position: 6, label: "上六", original: "无号，终有凶。", modern: "没有呼号之声，终有凶（小人被决除）。" },
    ],
  },
  // 44. 天风姤
  {
    id: 44, name: "天风姤", shortName: "姤",
    upperTrigram: "乾", lowerTrigram: "巽", binaryPattern: 55,
    palace: "乾宫", palaceElement: "金", shiYaoPosition: 1, yingYaoPosition: 4,
    upperYaoWuXing: NAJIA_WUXING["乾"].upper, lowerYaoWuXing: NAJIA_WUXING["巽"].lower, element: "金",
    guaCi: { original: "女壮，勿用取女。", modern: "女子过于强壮，不可娶此女。一阴始生，不宜与之相遇。" },
    yaoCi: [
      { position: 1, label: "初六", original: "系于金柅，贞吉。有攸往，见凶。羸豕孚蹢躅。", modern: "系于金属刹车，守正则吉。有所前往见凶。瘦猪躁动徘徊。" },
      { position: 2, label: "九二", original: "包有鱼，无咎。不利宾。", modern: "包裹中有鱼，无咎。不利于宾客。" },
      { position: 3, label: "九三", original: "臀无肤，其行次且。厉，无大咎。", modern: "臀部无肉，行走困难。虽有危险，无大咎。" },
      { position: 4, label: "九四", original: "包无鱼，起凶。", modern: "包裹中无鱼，兴起则有凶。" },
      { position: 5, label: "九五", original: "以杞包瓜，含章，有陨自天。", modern: "用杞柳包裹瓜果，蕴含文采，有陨落从天而来。" },
      { position: 6, label: "上九", original: "姤其角，吝，无咎。", modern: "相遇仅有角触之憾，有憾但无咎。" },
    ],
  },
  // 45. 泽地萃
  {
    id: 45, name: "泽地萃", shortName: "萃",
    upperTrigram: "兑", lowerTrigram: "坤", binaryPattern: 6,
    palace: "兑宫", palaceElement: "金", shiYaoPosition: 2, yingYaoPosition: 5,
    upperYaoWuXing: NAJIA_WUXING["兑"].upper, lowerYaoWuXing: NAJIA_WUXING["坤"].lower, element: "金",
    guaCi: { original: "亨。王假有庙。利见大人，亨，利贞。用大牲吉，利有攸往。", modern: "亨通。王至宗庙。利于见贵人，亨通利于守正。用大牲祭祀则吉，利于前往。" },
    yaoCi: [
      { position: 1, label: "初六", original: "有孚不终，乃乱乃萃。若号，一握为笑。勿恤，往无咎。", modern: "有诚信却不能始终，或乱或聚。若呼号，一握之间又笑。不用忧虑，前往无咎。" },
      { position: 2, label: "六二", original: "引吉，无咎。孚乃利用禴。", modern: "被引导而吉，无咎。诚信可用于微薄祭祀。" },
      { position: 3, label: "六三", original: "萃如嗟如，无攸利。往无咎，小吝。", modern: "聚集而嗟叹，无所利。前往无咎，小有憾惜。" },
      { position: 4, label: "九四", original: "大吉，无咎。", modern: "大为吉祥，无咎。" },
      { position: 5, label: "九五", original: "萃有位，无咎。匪孚，元永贞，悔亡。", modern: "聚集在高位，无咎。未得诚信，长久守正则悔恨消失。" },
      { position: 6, label: "上六", original: "赍咨涕洟，无咎。", modern: "叹息流涕，无咎（虽悲却无过）。" },
    ],
  },
  // 46. 地风升
  {
    id: 46, name: "地风升", shortName: "升",
    upperTrigram: "坤", lowerTrigram: "巽", binaryPattern: 3,
    palace: "震宫", palaceElement: "木", shiYaoPosition: 4, yingYaoPosition: 1,
    upperYaoWuXing: NAJIA_WUXING["坤"].upper, lowerYaoWuXing: NAJIA_WUXING["巽"].lower, element: "木",
    guaCi: { original: "元亨，用见大人，勿恤。南征吉。", modern: "大为亨通，可借此见贵人，不必忧虑。南征吉祥。" },
    yaoCi: [
      { position: 1, label: "初六", original: "允升，大吉。", modern: "诚信上升，大为吉祥。" },
      { position: 2, label: "九二", original: "孚乃利用禴，无咎。", modern: "诚信可用于微薄祭祀，无咎。" },
      { position: 3, label: "九三", original: "升虚邑。", modern: "上升至空虚的城邑。" },
      { position: 4, label: "六四", original: "王用亨于岐山，吉无咎。", modern: "王在岐山祭祀，吉祥无咎。" },
      { position: 5, label: "六五", original: "贞吉，升阶。", modern: "守正则吉，登阶上升。" },
      { position: 6, label: "上六", original: "冥升，利于不息之贞。", modern: "黄昏中仍上升，利于不停歇的坚守正道。" },
    ],
  },
  // 47. 泽水困
  {
    id: 47, name: "泽水困", shortName: "困",
    upperTrigram: "兑", lowerTrigram: "坎", binaryPattern: 22,
    palace: "兑宫", palaceElement: "金", shiYaoPosition: 1, yingYaoPosition: 4,
    upperYaoWuXing: NAJIA_WUXING["兑"].upper, lowerYaoWuXing: NAJIA_WUXING["坎"].lower, element: "金",
    guaCi: { original: "亨，贞，大人吉，无咎。有言不信。", modern: "亨通，守正，大人吉祥，无咎。说话却无人相信。" },
    yaoCi: [
      { position: 1, label: "初六", original: "臀困于株木，入于幽谷，三岁不觌。", modern: "臀部困于枯木，陷入幽深山谷，三年不得见人。" },
      { position: 2, label: "九二", original: "困于酒食，朱绂方来，利用亨祀。征凶，无咎。", modern: "困于酒食之累，朱绂刚送来，利于祭祀。出征则凶，无咎。" },
      { position: 3, label: "六三", original: "困于石，据于蒺藜。入于其宫，不见其妻，凶。", modern: "困于巨石，据于荆棘。入其宫中不见其妻，凶。" },
      { position: 4, label: "九四", original: "来徐徐，困于金车，吝，有终。", modern: "慢慢而来，困于金车，有憾但有善终。" },
      { position: 5, label: "九五", original: "劓刖，困于赤绂。乃徐有说，利用祭祀。", modern: "被割鼻断足，困于赤绂。徐徐得以解脱，利于祭祀。" },
      { position: 6, label: "上六", original: "困于葛藟，于臲兀。曰动悔有悔，征吉。", modern: "困于藤蔓缠绕，在高危处不安。动则有悔，知悔则出征吉祥。" },
    ],
  },
  // 48. 水风井
  {
    id: 48, name: "水风井", shortName: "井",
    upperTrigram: "坎", lowerTrigram: "巽", binaryPattern: 18,
    palace: "震宫", palaceElement: "木", shiYaoPosition: 5, yingYaoPosition: 2,
    upperYaoWuXing: NAJIA_WUXING["坎"].upper, lowerYaoWuXing: NAJIA_WUXING["巽"].lower, element: "木",
    guaCi: { original: "改邑不改井，无丧无得，往来井井。汔至，亦未繘井，羸其瓶，凶。", modern: "城邑可改，井不可改。无失无得，往来有序。快打到井水却未拉上井绳，打翻水瓶，凶。" },
    yaoCi: [
      { position: 1, label: "初六", original: "井泥不食，旧井无禽。", modern: "井底淤泥不能饮用，旧井旁无禽鸟。" },
      { position: 2, label: "九二", original: "井谷射鲋，瓮敝漏。", modern: "井谷之水仅射到小鱼，瓦罐破漏。" },
      { position: 3, label: "九三", original: "井渫不食，为我心恻。可用汲，王明并受其福。", modern: "井已淘净却无人饮用，使我心中凄恻。可以汲水，王若明察则共享其福。" },
      { position: 4, label: "六四", original: "井甃，无咎。", modern: "井壁砌好，无咎。" },
      { position: 5, label: "九五", original: "井洌，寒泉食。", modern: "井水清冽，寒泉可饮食。" },
      { position: 6, label: "上六", original: "井收勿幕，有孚元吉。", modern: "井收成之后勿加盖，有诚信则大为吉祥。" },
    ],
  },
  // 49. 泽火革
  {
    id: 49, name: "泽火革", shortName: "革",
    upperTrigram: "兑", lowerTrigram: "离", binaryPattern: 53,
    palace: "坎宫", palaceElement: "水", shiYaoPosition: 4, yingYaoPosition: 1,
    upperYaoWuXing: NAJIA_WUXING["兑"].upper, lowerYaoWuXing: NAJIA_WUXING["离"].lower, element: "水",
    guaCi: { original: "己日乃孚。元亨利贞，悔亡。", modern: "到了己日才有诚信。大为亨通利于守正，悔恨消失。变革之道。" },
    yaoCi: [
      { position: 1, label: "初九", original: "巩用黄牛之革。", modern: "用黄牛皮革牢牢加固。" },
      { position: 2, label: "六二", original: "己日乃革之，征吉，无咎。", modern: "己日才实行变革，出征则吉，无咎。" },
      { position: 3, label: "九三", original: "征凶，贞厉。革言三就，有孚。", modern: "出征则凶，守正有险。变革之言多次达成共识，才有诚信。" },
      { position: 4, label: "九四", original: "悔亡，有孚改命，吉。", modern: "悔恨消失，有诚信而改变命令，吉祥。" },
      { position: 5, label: "九五", original: "大人虎变，未占有孚。", modern: "大人如虎纹之变，不占卜已有诚信。" },
      { position: 6, label: "上六", original: "君子豹变，小人革面。征凶，居贞吉。", modern: "君子如豹纹之变，小人仅改面色。出征则凶，安居守正则吉。" },
    ],
  },
  // 50. 火风鼎
  {
    id: 50, name: "火风鼎", shortName: "鼎",
    upperTrigram: "离", lowerTrigram: "巽", binaryPattern: 43,
    palace: "离宫", palaceElement: "火", shiYaoPosition: 2, yingYaoPosition: 5,
    upperYaoWuXing: NAJIA_WUXING["离"].upper, lowerYaoWuXing: NAJIA_WUXING["巽"].lower, element: "火",
    guaCi: { original: "元吉，亨。", modern: "大为吉祥，亨通。鼎新革故，任贤用能。" },
    yaoCi: [
      { position: 1, label: "初六", original: "鼎颠趾，利出否。得妾以其子，无咎。", modern: "鼎颠倒其足，利于倒出腐败之物。纳妾得子，无咎。" },
      { position: 2, label: "九二", original: "鼎有实，我仇有疾，不我能即，吉。", modern: "鼎中有食物，我的仇人有疾病，不能接近我，吉祥。" },
      { position: 3, label: "九三", original: "鼎耳革，其行塞，雉膏不食。方雨亏悔，终吉。", modern: "鼎耳脱落，移动受阻，肥美雉肉吃不到。方要下雨则悔恨消失，终吉。" },
      { position: 4, label: "九四", original: "鼎折足，覆公餗，其形渥，凶。", modern: "鼎足折断，倾覆了王公的美食，形同被重罚，凶。" },
      { position: 5, label: "六五", original: "鼎黄耳金铉，利贞。", modern: "鼎有黄色鼎耳和金属鼎杠，利于守正。" },
      { position: 6, label: "上九", original: "鼎玉铉，大吉，无不利。", modern: "鼎有玉制鼎杠，大为吉祥，无不利。" },
    ],
  },
  // 51. 震为雷
  {
    id: 51, name: "震为雷", shortName: "震",
    upperTrigram: "震", lowerTrigram: "震", binaryPattern: 36,
    palace: "震宫", palaceElement: "木", shiYaoPosition: 6, yingYaoPosition: 3,
    upperYaoWuXing: NAJIA_WUXING["震"].upper, lowerYaoWuXing: NAJIA_WUXING["震"].lower, element: "木",
    guaCi: { original: "亨。震来虩虩，笑言哑哑。震惊百里，不丧匕鬯。", modern: "亨通。雷震袭来令人战栗，过后谈笑自若。震惊百里之远，手中祭器不失落。" },
    yaoCi: [
      { position: 1, label: "初九", original: "震来虩虩，后笑言哑哑，吉。", modern: "雷震袭来战栗，过后谈笑自若，吉祥。" },
      { position: 2, label: "六二", original: "震来厉，亿丧贝。跻于九陵，勿逐，七日得。", modern: "雷震来势凶猛，大量丧失钱财。登上九陵高处，不必追逐，七日可复得。" },
      { position: 3, label: "六三", original: "震苏苏，震行无眚。", modern: "雷震令人惶恐不安，因雷震而修省则无灾祸。" },
      { position: 4, label: "九四", original: "震遂泥。", modern: "雷震坠入泥中。" },
      { position: 5, label: "六五", original: "震往来厉，亿无丧，有事。", modern: "雷震往来危险，但万无一失，仍有所为。" },
      { position: 6, label: "上六", original: "震索索，视矍矍，征凶。震不于其躬，于其邻，无咎。婚媾有言。", modern: "雷震使人索索发抖，目光惊惶，出征则凶。雷震未及自身而及邻居，无咎。婚媾有口舌。" },
    ],
  },
  // 52. 艮为山
  {
    id: 52, name: "艮为山", shortName: "艮",
    upperTrigram: "艮", lowerTrigram: "艮", binaryPattern: 9,
    palace: "艮宫", palaceElement: "土", shiYaoPosition: 6, yingYaoPosition: 3,
    upperYaoWuXing: NAJIA_WUXING["艮"].upper, lowerYaoWuXing: NAJIA_WUXING["艮"].lower, element: "土",
    guaCi: { original: "艮其背，不获其身。行其庭，不见其人。无咎。", modern: "止于背而不获其身，行于庭中不见其人。无咎。当止则止。" },
    yaoCi: [
      { position: 1, label: "初六", original: "艮其趾，无咎。利永贞。", modern: "止住脚趾，无咎。利于长久守正。" },
      { position: 2, label: "六二", original: "艮其腓，不拯其随，其心不快。", modern: "止住小腿肚，不能救助其所随，其心中不快。" },
      { position: 3, label: "九三", original: "艮其限，列其夤，厉薰心。", modern: "止住腰部，脊肉撕裂，危险熏心。" },
      { position: 4, label: "六四", original: "艮其身，无咎。", modern: "止住身体，无咎。" },
      { position: 5, label: "六五", original: "艮其辅，言有序，悔亡。", modern: "止住面颊，言语有条理，悔恨消失。" },
      { position: 6, label: "上九", original: "敦艮，吉。", modern: "敦厚知止，吉祥。" },
    ],
  },
  // 53. 风山渐
  {
    id: 53, name: "风山渐", shortName: "渐",
    upperTrigram: "巽", lowerTrigram: "艮", binaryPattern: 11,
    palace: "艮宫", palaceElement: "土", shiYaoPosition: 3, yingYaoPosition: 6,
    upperYaoWuXing: NAJIA_WUXING["巽"].upper, lowerYaoWuXing: NAJIA_WUXING["艮"].lower, element: "土",
    guaCi: { original: "女归吉，利贞。", modern: "女子出嫁吉祥，利于守正。循序渐进。" },
    yaoCi: [
      { position: 1, label: "初六", original: "鸿渐于干，小子厉，有言，无咎。", modern: "鸿雁渐渐飞到岸边，小子有危险，有口舌，无咎。" },
      { position: 2, label: "六二", original: "鸿渐于磐，饮食衎衎，吉。", modern: "鸿雁渐渐飞到大石上，饮食欢乐，吉祥。" },
      { position: 3, label: "九三", original: "鸿渐于陆，夫征不复，妇孕不育，凶。利御寇。", modern: "鸿雁渐渐飞到陆地，丈夫出征不归，妇人怀孕不育，凶。利于防御寇盗。" },
      { position: 4, label: "六四", original: "鸿渐于木，或得其桷，无咎。", modern: "鸿雁渐渐飞到树上，或得平整的树枝，无咎。" },
      { position: 5, label: "九五", original: "鸿渐于陵，妇三岁不孕，终莫之胜，吉。", modern: "鸿雁渐渐飞到山陵，妇人三年不孕，终无人能胜过她，吉祥。" },
      { position: 6, label: "上九", original: "鸿渐于逵，其羽可用为仪，吉。", modern: "鸿雁渐渐飞到大道，其羽毛可用于礼仪，吉祥。" },
    ],
  },
  // 54. 雷泽归妹
  {
    id: 54, name: "雷泽归妹", shortName: "归妹",
    upperTrigram: "震", lowerTrigram: "兑", binaryPattern: 52,
    palace: "兑宫", palaceElement: "金", shiYaoPosition: 3, yingYaoPosition: 6,
    upperYaoWuXing: NAJIA_WUXING["震"].upper, lowerYaoWuXing: NAJIA_WUXING["兑"].lower, element: "金",
    guaCi: { original: "征凶，无攸利。", modern: "出征则凶，无所利。少女归嫁，宜顺不宜强求。" },
    yaoCi: [
      { position: 1, label: "初九", original: "归妹以娣，跛能履，征吉。", modern: "嫁妹以娣陪嫁，跛脚而能行，出征则吉。" },
      { position: 2, label: "九二", original: "眇能视，利幽人之贞。", modern: "独眼而能看，利于幽居之人守正。" },
      { position: 3, label: "六三", original: "归妹以须，反归以娣。", modern: "嫁妹等待，反回时以娣陪嫁。" },
      { position: 4, label: "九四", original: "归妹愆期，迟归有时。", modern: "嫁妹延期，迟嫁也有其时机。" },
      { position: 5, label: "六五", original: "帝乙归妹，其君之袂不如其娣之袂良。月几望，吉。", modern: "帝乙嫁妹，正妻的衣袖不如陪嫁妹妹的衣袖精美。月近圆满，吉祥。" },
      { position: 6, label: "上六", original: "女承筐无实，士刲羊无血，无攸利。", modern: "女子捧着空筐，男子杀羊不见血，无所利。" },
    ],
  },
  // 55. 雷火丰
  {
    id: 55, name: "雷火丰", shortName: "丰",
    upperTrigram: "震", lowerTrigram: "离", binaryPattern: 53,
    palace: "坎宫", palaceElement: "水", shiYaoPosition: 5, yingYaoPosition: 2,
    upperYaoWuXing: NAJIA_WUXING["震"].upper, lowerYaoWuXing: NAJIA_WUXING["离"].lower, element: "水",
    guaCi: { original: "亨，王假之。勿忧，宜日中。", modern: "亨通，王亲临至此。不必忧虑，宜如日中天那样光明。" },
    yaoCi: [
      { position: 1, label: "初九", original: "遇其配主，虽旬无咎。往有尚。", modern: "遇到配得上的主人，虽十日也无咎。前往有可嘉之处。" },
      { position: 2, label: "六二", original: "丰其蔀，日中见斗。往得疑疾，有孚发若，吉。", modern: "丰大之时被遮蔽，日正当中却见北斗。前往遭疑病，以诚信感发则吉。" },
      { position: 3, label: "九三", original: "丰其沛，日中见沬。折其右肱，无咎。", modern: "丰大之时被遮暗，日正当中却见小星。折断右臂，无咎。" },
      { position: 4, label: "九四", original: "丰其蔀，日中见斗。遇其夷主，吉。", modern: "丰大之时被遮蔽，日正当中见北斗。遇到夷平之主，吉祥。" },
      { position: 5, label: "六五", original: "来章，有庆誉，吉。", modern: "来求光明文采，有喜庆和美誉，吉祥。" },
      { position: 6, label: "上六", original: "丰其屋，蔀其家。窥其户，阒其无人，三岁不觌，凶。", modern: "丰大其屋，遮蔽其家。窥视其门户，寂静无人，三年不见人，凶。" },
    ],
  },
  // 56. 火山旅
  {
    id: 56, name: "火山旅", shortName: "旅",
    upperTrigram: "离", lowerTrigram: "艮", binaryPattern: 37,
    palace: "离宫", palaceElement: "火", shiYaoPosition: 1, yingYaoPosition: 4,
    upperYaoWuXing: NAJIA_WUXING["离"].upper, lowerYaoWuXing: NAJIA_WUXING["艮"].lower, element: "火",
    guaCi: { original: "小亨，旅贞吉。", modern: "小有亨通，旅客守正则吉。漂泊在外，柔顺处之。" },
    yaoCi: [
      { position: 1, label: "初六", original: "旅琐琐，斯其所取灾。", modern: "旅客琐碎卑微，这是自取灾祸的原因。" },
      { position: 2, label: "六二", original: "旅即次，怀其资，得童仆贞。", modern: "旅客住进旅馆，怀揣钱财，获得童仆的忠心。" },
      { position: 3, label: "九三", original: "旅焚其次，丧其童仆，贞厉。", modern: "旅店被烧，丧失童仆，守正也有危险。" },
      { position: 4, label: "九四", original: "旅于处，得其资斧，我心不快。", modern: "旅客有所居处，获得钱财斧头，但我心中不愉快。" },
      { position: 5, label: "六五", original: "射雉一矢亡，终以誉命。", modern: "射野鸡一箭射中，最终获得美誉爵命。" },
      { position: 6, label: "上九", original: "鸟焚其巢，旅人先笑后号咷。丧牛于易，凶。", modern: "鸟的巢被烧毁，旅人先笑后哭号。在田畔丢了牛，凶。" },
    ],
  },
  // 57. 巽为风
  {
    id: 57, name: "巽为风", shortName: "巽",
    upperTrigram: "巽", lowerTrigram: "巽", binaryPattern: 18,
    palace: "巽宫", palaceElement: "木", shiYaoPosition: 6, yingYaoPosition: 3,
    upperYaoWuXing: NAJIA_WUXING["巽"].upper, lowerYaoWuXing: NAJIA_WUXING["巽"].lower, element: "木",
    guaCi: { original: "小亨，利有攸往，利见大人。", modern: "小有亨通，利于有所前往，利于见贵人。巽顺之道。" },
    yaoCi: [
      { position: 1, label: "初六", original: "进退，利武人之贞。", modern: "犹疑进退，利于武人般果决守正。" },
      { position: 2, label: "九二", original: "巽在床下，用史巫纷若，吉无咎。", modern: "巽顺地伏在床下，用祝史巫觋多多祝祷，吉祥无咎。" },
      { position: 3, label: "九三", original: "频巽，吝。", modern: "频频巽顺做作，有憾惜。" },
      { position: 4, label: "六四", original: "悔亡，田获三品。", modern: "悔恨消失，田猎获三品猎物。" },
      { position: 5, label: "九五", original: "贞吉悔亡，无不利。无初有终。先庚三日，后庚三日，吉。", modern: "守正则吉悔恨消失，无不利。开始不顺但有善终。庚日前后各三日，吉祥。" },
      { position: 6, label: "上九", original: "巽在床下，丧其资斧，贞凶。", modern: "巽顺地伏在床下，丢失钱财斧头，守正也有凶。" },
    ],
  },
  // 58. 兑为泽
  {
    id: 58, name: "兑为泽", shortName: "兑",
    upperTrigram: "兑", lowerTrigram: "兑", binaryPattern: 54,
    palace: "兑宫", palaceElement: "金", shiYaoPosition: 6, yingYaoPosition: 3,
    upperYaoWuXing: NAJIA_WUXING["兑"].upper, lowerYaoWuXing: NAJIA_WUXING["兑"].lower, element: "金",
    guaCi: { original: "亨利贞。", modern: "亨通，利于守正。喜悦待人，朋友讲习。" },
    yaoCi: [
      { position: 1, label: "初九", original: "和兑，吉。", modern: "和悦待人，吉祥。" },
      { position: 2, label: "九二", original: "孚兑，吉，悔亡。", modern: "诚信而悦，吉祥，悔恨消失。" },
      { position: 3, label: "六三", original: "来兑，凶。", modern: "来讨好谄媚之悦，凶。" },
      { position: 4, label: "九四", original: "商兑，未宁。介疾有喜。", modern: "商量而未宁，界分疾患有喜。" },
      { position: 5, label: "九五", original: "孚于剥，有厉。", modern: "诚信被剥蚀，有危险。" },
      { position: 6, label: "上六", original: "引兑。", modern: "引诱他人喜悦。" },
    ],
  },
  // 59. 风水涣
  {
    id: 59, name: "风水涣", shortName: "涣",
    upperTrigram: "巽", lowerTrigram: "坎", binaryPattern: 10,
    palace: "离宫", palaceElement: "火", shiYaoPosition: 5, yingYaoPosition: 2,
    upperYaoWuXing: NAJIA_WUXING["巽"].upper, lowerYaoWuXing: NAJIA_WUXING["坎"].lower, element: "火",
    guaCi: { original: "亨。王假有庙，利涉大川，利贞。", modern: "亨通。王至宗庙，利于渡大川，利于守正。涣散之时宜聚合人心。" },
    yaoCi: [
      { position: 1, label: "初六", original: "用拯马壮，吉。", modern: "用强壮的马来救助，吉祥。" },
      { position: 2, label: "九二", original: "涣奔其机，悔亡。", modern: "涣散之时奔赴几案（抓住机会），悔恨消失。" },
      { position: 3, label: "六三", original: "涣其躬，无悔。", modern: "涣散自身之利自私，无悔。" },
      { position: 4, label: "六四", original: "涣其群，元吉。涣有丘，匪夷所思。", modern: "涣散其朋党，大为吉祥。涣散中有山丘，非平常所能想到。" },
      { position: 5, label: "九五", original: "涣汗其大号，涣王居，无咎。", modern: "涣散时发布大汗般的大号令，涣大王之居所，无咎。" },
      { position: 6, label: "上九", original: "涣其血，去逖出，无咎。", modern: "涣散其忧愁流血，远离忧愁而出去，无咎。" },
    ],
  },
  // 60. 水泽节
  {
    id: 60, name: "水泽节", shortName: "节",
    upperTrigram: "坎", lowerTrigram: "兑", binaryPattern: 22,
    palace: "坎宫", palaceElement: "水", shiYaoPosition: 1, yingYaoPosition: 4,
    upperYaoWuXing: NAJIA_WUXING["坎"].upper, lowerYaoWuXing: NAJIA_WUXING["兑"].lower, element: "水",
    guaCi: { original: "亨。苦节不可贞。", modern: "亨通。过分苦的节制不可长久守持。节以制度，不伤财害民。" },
    yaoCi: [
      { position: 1, label: "初九", original: "不出户庭，无咎。", modern: "不走出门户庭院，无咎。" },
      { position: 2, label: "九二", original: "不出门庭，凶。", modern: "不走出大门庭院，凶（该出不出）。" },
      { position: 3, label: "六三", original: "不节若，则嗟若，无咎。", modern: "不知节制，就会嗟叹。但非其罪过，无咎。" },
      { position: 4, label: "六四", original: "安节，亨。", modern: "安于节制，亨通。" },
      { position: 5, label: "九五", original: "甘节，吉。往有尚。", modern: "甘美地节制，吉祥。前往有可嘉之处。" },
      { position: 6, label: "上六", original: "苦节，贞凶，悔亡。", modern: "苦涩地节制，守正也有凶。知悔则悔恨消失。" },
    ],
  },
  // 61. 风泽中孚
  {
    id: 61, name: "风泽中孚", shortName: "中孚",
    upperTrigram: "巽", lowerTrigram: "兑", binaryPattern: 38,
    palace: "艮宫", palaceElement: "土", shiYaoPosition: 4, yingYaoPosition: 1,
    upperYaoWuXing: NAJIA_WUXING["巽"].upper, lowerYaoWuXing: NAJIA_WUXING["兑"].lower, element: "土",
    guaCi: { original: "豚鱼吉。利涉大川，利贞。", modern: "用豚鱼祭祀吉祥。利于渡大川，利于守正。中心诚信之道。" },
    yaoCi: [
      { position: 1, label: "初九", original: "虞吉，有它不燕。", modern: "安守则吉，若有意外则不安宁。" },
      { position: 2, label: "九二", original: "鸣鹤在阴，其子和之。我有好爵，吾与尔靡之。", modern: "鹤鸣在阴处，其子应和。我有好酒，我与你共享。" },
      { position: 3, label: "六三", original: "得敌，或鼓或罢，或泣或歌。", modern: "遇敌，或击鼓或停息，或哭泣或歌唱。" },
      { position: 4, label: "六四", original: "月几望，马匹亡，无咎。", modern: "月近圆满时丢失马匹，无咎。" },
      { position: 5, label: "九五", original: "有孚挛如，无咎。", modern: "以诚信牵系人心，无咎。" },
      { position: 6, label: "上九", original: "翰音登于天，贞凶。", modern: "飞鸟之音升于天（声闻过高），守正也有凶。" },
    ],
  },
  // 62. 雷山小过
  {
    id: 62, name: "雷山小过", shortName: "小过",
    upperTrigram: "震", lowerTrigram: "艮", binaryPattern: 33,
    palace: "兑宫", palaceElement: "金", shiYaoPosition: 4, yingYaoPosition: 1,
    upperYaoWuXing: NAJIA_WUXING["震"].upper, lowerYaoWuXing: NAJIA_WUXING["艮"].lower, element: "金",
    guaCi: { original: "亨利贞。可小事，不可大事。飞鸟遗之音，不宜上，宜下。大吉。", modern: "亨通利于守正。可做小事不可做大事。飞鸟留下悲鸣声，不宜向上宜向下。大为吉祥。" },
    yaoCi: [
      { position: 1, label: "初六", original: "飞鸟以凶。", modern: "飞鸟带来凶兆。" },
      { position: 2, label: "六二", original: "过其祖，遇其妣。不及其君，遇其臣。无咎。", modern: "超过祖父，遇到祖母。没赶上君主，遇到臣子。无咎。" },
      { position: 3, label: "九三", original: "弗过防之，从或戕之，凶。", modern: "不加以过分防备，随从就会受到伤害，凶。" },
      { position: 4, label: "九四", original: "无咎。弗过遇之，往厉必戒。勿用永贞。", modern: "无咎。不需过分也能遇到，前往危险必须戒备。不可固守不变。" },
      { position: 5, label: "六五", original: "密云不雨，自我西郊。公弋取彼在穴。", modern: "密云从西郊而来却不下雨。公用弋箭射取在洞穴中的猎物。" },
      { position: 6, label: "上六", original: "弗遇过之，飞鸟离之，凶。是谓灾眚。", modern: "不遇而过分，飞鸟陷入罗网，凶。这就是灾祸。" },
    ],
  },
  // 63. 水火既济
  {
    id: 63, name: "水火既济", shortName: "既济",
    upperTrigram: "坎", lowerTrigram: "离", binaryPattern: 21,
    palace: "坎宫", palaceElement: "水", shiYaoPosition: 3, yingYaoPosition: 6,
    upperYaoWuXing: NAJIA_WUXING["坎"].upper, lowerYaoWuXing: NAJIA_WUXING["离"].lower, element: "水",
    guaCi: { original: "亨小，利贞。初吉终乱。", modern: "小有亨通，利于守正。起初吉祥，最终则乱。成功之后要居安思危。" },
    yaoCi: [
      { position: 1, label: "初九", original: "曳其轮，濡其尾，无咎。", modern: "拖曳车轮，沾湿尾巴，无咎。" },
      { position: 2, label: "六二", original: "妇丧其茀，勿逐，七日得。", modern: "妇人丢失车幔，不必追逐，七日可复得。" },
      { position: 3, label: "九三", original: "高宗伐鬼方，三年克之。小人勿用。", modern: "高宗征伐鬼方，三年才攻克。小人不可用。" },
      { position: 4, label: "六四", original: "繻有衣袽，终日戒。", modern: "有破旧棉衣，整日戒备。" },
      { position: 5, label: "九五", original: "东邻杀牛，不如西邻之禴祭，实受其福。", modern: "东邻杀牛盛祭，不如西邻微薄祭祀，实际承受其福。" },
      { position: 6, label: "上六", original: "濡其首，厉。", modern: "沾湿了头，危险。" },
    ],
  },
  // 64. 火水未济
  {
    id: 64, name: "火水未济", shortName: "未济",
    upperTrigram: "离", lowerTrigram: "坎", binaryPattern: 42,
    palace: "离宫", palaceElement: "火", shiYaoPosition: 3, yingYaoPosition: 6,
    upperYaoWuXing: NAJIA_WUXING["离"].upper, lowerYaoWuXing: NAJIA_WUXING["坎"].lower, element: "火",
    guaCi: { original: "亨。小狐汔济，濡其尾，无攸利。", modern: "亨通。小狐狸快渡过河时沾湿了尾巴，无所利。事未成，不可强求。" },
    yaoCi: [
      { position: 1, label: "初六", original: "濡其尾，吝。", modern: "沾湿了尾巴，有憾惜。" },
      { position: 2, label: "九二", original: "曳其轮，贞吉。", modern: "拖曳车轮，守正则吉。" },
      { position: 3, label: "六三", original: "未济，征凶。利涉大川。", modern: "事未成，出征则凶。但利于渡大川。" },
      { position: 4, label: "九四", original: "贞吉悔亡。震用伐鬼方，三年有赏于大国。", modern: "守正则吉悔恨消失。以雷霆之势伐鬼方，三年得到大国的赏赐。" },
      { position: 5, label: "六五", original: "贞吉无悔。君子之光，有孚，吉。", modern: "守正则吉无悔。君子的光芒，有诚信，吉祥。" },
      { position: 6, label: "上九", original: "有孚于饮酒，无咎。濡其首，有孚失是。", modern: "有诚信地饮酒，无咎。沾湿了头，虽有诚信却失了正道。" },
    ],
  },
];

export function getHexagramById(id: number): HexagramData | undefined {
  return HEXAGRAMS.find((h) => h.id === id);
}

export function getHexagramByPattern(pattern: number): HexagramData | undefined {
  return HEXAGRAMS.find((h) => h.binaryPattern === pattern);
}
