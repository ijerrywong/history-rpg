'use strict';
// =====================================================================
//  剧本：张骞出使西域（spike：序章 + 第一章）
//  史料依据：《史记·大宛列传》《史记·匈奴列传》
//  规则：史料卡 fact: true 必须有出处；游戏想象的情节一律 fact: false，并在章末小结里点明
// =====================================================================

const GAME = {
  id: 'zhangqian',
  title: '张骞传',
  subtitle: '出使西域',
  tagline: '像素历史角色扮演 · 公元前138年',
  chapters: ['序章 未央宫', '第一章 匈奴十年', '第二章 大宛与月氏'],
  party: ['zhang'],
  titleSprites: ['zhangqian', 'ganfu', 'soldier', 'soldier'],
  titleSky: ['#0a0818', '#3a2438', '#8a4a30'],
  titleHills: ['#6a4a30', '#4a3020', '#2a1a10'],
};

// ===== 拼音（读者是小学生：生僻字、多音字、人名地名都注音） =====
// 引擎会在这些词上方标拼音，换行时不会拆开它们。设置里可以关掉
const PINYIN = {
  '张骞': 'zhāng qiān', '骞': 'qiān', '单于': 'chán yú', '冒顿': 'mò dú',
  '烽燧': 'fēng suì', '月氏': 'yuè zhī', '匈奴': 'xiōng nú', '甘父': 'gān fǔ',
  '堂邑父': 'táng yì fǔ', '堂邑氏': 'táng yì shì', '穹庐': 'qióng lú', '鸣镝': 'míng dí',
  '瓦当': 'wǎ dāng', '夯土': 'hāng tǔ', '应募': 'yìng mù', '招募': 'zhāo mù',
  '未央': 'wèi yāng', '长乐未央': 'cháng lè wèi yāng', '陇西': 'lǒng xī', '大宛': 'dà yuān',
  '康居': 'kāng jū', '莫高窟': 'mò gāo kū', '戍卒': 'shù zú', '毡帐': 'zhān zhàng',
  '毛毡': 'máo zhān', '驿站': 'yì zhàn', '驿卒': 'yì zú', '蜀锦': 'shǔ jǐn',
  '齐纨': 'qí wán', '牦牛': 'máo niú', '刘彻': 'liú chè', '降人': 'xiáng rén',
  '衣其皮革': 'yì qí pí gé', '畜肉': 'chù ròu', '咸食': 'xián shí', '抢掠': 'qiǎng lüè',
  '出塞': 'chū sài', '边塞': 'biān sài', '都城': 'dū chéng', '郡守': 'jùn shǒu',
  '闵贞': 'mǐn zhēn', '夹击': 'jiā jī', '稀罕': 'xī han', '侍从': 'shì cóng',
  '萧何': 'xiāo hé', '干粮': 'gān liáng', '绿松石': 'lǜ sōng shí', '郎官': 'láng guān',
  '看守': 'kān shǒu', '看管': 'kān guǎn', '朕': 'zhèn', '赐': 'cì',
  '娶': 'qǔ', '押送': 'yā sòng', '诏令': 'zhào lìng',
  '丞相': 'chéng xiàng', '同僚': 'tóng liáo', '迁徙': 'qiān xǐ', '松懈': 'sōng xiè',
  '敦煌': 'dūn huáng', '屋檐': 'wū yán', '书肆': 'shū sì', '帐篷': 'zhàng peng',
  '大婶': 'dà shěn', '器皿': 'qì mǐn', '巡逻': 'xún luó', '马蹄': 'mǎ tí',
  '竹杖': 'zhú zhàng', '穗子': 'suì zi', '牲畜': 'shēng chù', '充饥': 'chōng jī',
  '捎': 'shāo', '仆人': 'pú rén', '居延': 'jū yán', '金冠': 'jīn guān',
  '哨卡': 'shào qiǎ', '列传': 'liè zhuàn', '少长': 'shào zhǎng', '将军': 'jiāng jūn',
  '绿洲': 'lǜ zhōu', '气盛': 'qì shèng', '胆量': 'dǎn liàng', '陕西': 'shǎn xī',
  '甘肃': 'gān sù', '丝绸': 'sī chóu', '羊羔': 'yáng gāo', '贩子': 'fàn zi',
  '边疆': 'biān jiāng', '宁夏': 'níng xià', '遗址': 'yí zhǐ', '宗室': 'zōng shì',
  '咩': 'miē', '殿': 'diàn', '烽火台': 'fēng huǒ tái', '烽火': 'fēng huǒ',
};

// ===== 人物 =====
const CHARS = {
  zhang: { name: '张骞', title: '汉朝的郎官，出使月氏的使者', sp: () => hasItem('jie') ? 'zhangqian' : 'zhangqian0' },
  gan: { name: '甘父', title: '匈奴人，堂邑家的仆人，神射手', sp: 'ganfu' },
};
Object.assign(SPRITES, {
  zhangqian0: { h: '#1a1a1a', r: '#7a2a2a', R: '#5a1a1a', t: '#d8c090', x: '#1a1a1a', b: '#1a1a1a', f: ['cap', 'beard'] },
  zhangqian: { h: '#1a1a1a', r: '#7a2a2a', R: '#5a1a1a', t: '#d8c090', x: '#1a1a1a', b: '#1a1a1a', f: ['cap', 'beard', 'jie'] },
  ganfu: { h: '#2a1a10', s: '#c89060', r: '#8a6a40', R: '#6a4a28', t: '#3a2a1a', x: '#5a3a20', b: '#2a1a10', f: ['furhat', 'beard'] },
  wudi: { h: '#1a1a1a', r: '#2a2a3a', R: '#1a1a2a', t: '#f0c040', y: '#f0c040', b: '#1a1a1a', f: ['crown', 'beard'] },
  chanyu: { h: '#2a1a10', s: '#c89060', r: '#8a2a2a', R: '#5a1a1a', t: '#f0c040', x: '#c8a040', b: '#2a1a10', f: ['furhat', 'longbeard'] },
  xnman: { h: '#2a1a10', s: '#c89060', r: '#6a5a3a', R: '#4a3e26', t: '#3a2a1a', x: '#7a5a3a', f: ['furhat'] },
  xnguard: { h: '#2a1a10', s: '#c89060', r: '#4a4a3a', R: '#2a2a1e', t: '#8a2a2a', x: '#3a3a2a', b: '#2a1a10', f: ['furhat', 'beard'] },
  xnwoman: { h: '#1a1a1a', s: '#d8a070', r: '#a0522d', R: '#7a3a1a', t: '#e8c060', x: '#7a5a3a', f: ['furhat', 'skirt'] },
  xnchild: { h: '#1a1a1a', s: '#d8a070', r: '#8a6a40', R: '#6a4a28', t: '#c03030', x: '#7a5a3a', f: ['furhat'], small: true },
  huqi: { h: '#1a1a1a', s: '#d8a070', r: '#c86a4a', R: '#9a4a2a', t: '#f0d080', f: ['topknot', 'skirt'] },
  son: { h: '#1a1a1a', s: '#e0b080', r: '#a0522d', R: '#7a3a1a', t: '#f0d080', f: ['tufts'], small: true },
});
const SPEAK = { '张骞': 'zhangqian', '汉武帝': 'wudi', '单于': 'chanyu', '胡妻': 'huqi' };

// 走失的小羊（任务物品在地图上的样子）
LOCICON.lamb = x => { pell(x, 8, 10, 5, 4, '#f4f0e8'); pell(x, 7, 9, 4, 3, '#ffffff'); pell(x, 13, 8, 2, 2, '#e8dcc8'); px(x, 13, 7, '#1a1a1a'); for (const X of [5, 7, 9, 11]) prect(x, X, 13, 1, 3, '#5a4a3a'); };

// 草原的曲子（五声音阶）
SONGS.steppe = { bpm: 96, style: 'walk', lead: 'pulse25', loop: true,
  mel: 'A4:4 C5:4 D5:4 E5:4 G5:6 E5:2 D5:8 E5:4 D5:4 C5:4 A4:4 C5:8 D5:8 A4:4 C5:4 D5:4 E5:4 A5:6 G5:2 E5:8 G5:4 E5:4 D5:4 C5:4 A4:16',
  ch: 'Am:16 G:16 Am:16 Em:16 Am:16 C:16 G:16 Am:16' };

// ===== 道具 =====
const ITEMS = {
  jie: { name: '汉节', type: 'key', desc: '使者的信物：一根竹杖，挂着牦牛尾做的穗子。见节如见皇帝。' },
  q_letter: { name: '家书', type: 'quest', desc: '长安老妇人写给儿子的信，儿子在陇西当戍卒。' },
  q_lamb: { name: '小羊羔', type: 'quest', desc: '匈奴小孩走失的小羊，咩咩直叫。' },
};

// ===== 史料卡 =====
const CARDS = {
  // —— 序章 ——
  changan: { ch: 0, fact: true, title: '长安城', src: '《史记·高祖本纪》',
    text: '西汉的都城，在今天的陕西西安。皇帝住在未央宫，它是汉朝初年丞相萧何主持修建的。两千多年过去，宫殿早就不在了，只留下高高的夯土台基。',
    img: { src: 'img/cards/changan.jpg', cap: '今天的未央宫前殿遗址。这道长坡就是当年大殿的台基。', credit: '猫猫的日记本 · CC BY-SA 3.0 · Wikimedia Commons' } },
  wadang: { ch: 0, fact: true, title: '长乐未央', src: '出土文物',
    text: '瓦当是屋檐最前面那片瓦的圆头，能挡住雨水，保护木头屋檐。汉代瓦当上常刻吉祥话，「长乐未央」的意思是「快乐永远没有尽头」。',
    img: { src: 'img/cards/wadang.jpg', cap: '刻着「长乐未央」的汉代瓦当，直径17厘米（宁夏博物馆）。', credit: 'BabelStone · CC BY-SA 3.0 · Wikimedia Commons' } },
  xiongnu: { ch: 0, fact: true, title: '匈奴', src: '《史记·匈奴列传》',
    text: '北方草原上的游牧民族，首领叫「单于」。他们从小骑马射箭，来去如风，常常南下抢掠汉朝的边境。',
    img: { src: 'img/cards/xiongnu.jpg', cap: '匈奴的鹰顶金冠（战国时期，内蒙古出土）。顶上站着一只绿松石做头的雄鹰。', credit: 'Gary Todd · CC0 · Wikimedia Commons' } },
  heqin: { ch: 0, fact: true, title: '和亲', src: '《史记·匈奴列传》',
    text: '汉朝初年打不过匈奴，只好把宗室的女儿当作公主嫁给单于，每年再送去丝绸、粮食和酒，换来暂时的和平。可匈奴还是常常来抢。' },
  yuezhi: { ch: 0, fact: true, title: '大月氏', src: '《史记·大宛列传》',
    text: '月氏（读作 ròu zhī 或 yuè zhī）原来住在今天甘肃一带。匈奴打败了月氏，杀了月氏王，还把他的头骨做成了酒器。月氏人逃到遥远的西方，一直恨着匈奴。' },
  banliang: { ch: 0, fact: true, title: '半两钱', src: '出土钱币实物',
    text: '圆形方孔的铜钱，上面写着「半两」二字。秦始皇统一了钱币，汉朝初年继续用它。外圆内方的样子，后来用了两千多年。',
    img: { src: 'img/cards/banliang.jpg', cap: '博物馆里的半两钱。方孔右边是「半」，左边是「两」。', credit: 'Gary Todd · CC0 · Wikimedia Commons' } },
  zhaomu: { ch: 0, fact: true, title: '应募出使', src: '《史记·大宛列传》',
    text: '汉武帝想联合月氏夹击匈奴，可去月氏必须穿过匈奴的地盘，于是公开招募使者。当时做「郎」（皇帝侍从官）的张骞报名了。约公元前138年，他带着一百多人出发。',
    img: { src: 'img/cards/zhaomu.jpg', cap: '敦煌莫高窟第323窟壁画：汉武帝送张骞出发。这是七百多年后唐朝人画的佛教传说，不是当时的记录。', credit: '唐代壁画 · 公有领域 · Wikimedia Commons' } },
  ganfu: { ch: 0, fact: true, title: '甘父', src: '《史记·大宛列传》',
    text: '甘父本是匈奴人，是堂邑氏家的仆人，所以又叫「堂邑父」。他射箭很准，路上没有吃的时候，就射鸟兽给大家充饥。' },
  longxi: { ch: 0, fact: true, title: '出陇西', src: '《史记·大宛列传》',
    text: '陇西郡在今天甘肃的东南部，是汉朝西北边境的郡。史书记载，张骞和甘父「俱出陇西」——从这里走出汉朝，进入匈奴控制的地方。' },
  fengsui: { ch: 0, fact: true, title: '烽燧', src: '居延汉简等出土文献',
    text: '边境上每隔一段路就有一座烽火台。白天放烟，夜里点火，一座接一座传下去。敌人一来，消息很快就能传到后方。' },
  // —— 第一章 ——
  chanyu: { ch: 1, fact: true, title: '单于的话', src: '《史记·大宛列传》',
    text: '单于扣下张骞，说：「月氏在我们北边，汉朝怎么能派使者过去？要是我派使者去南越，汉朝肯让路吗？」' },
  qionglu: { ch: 1, fact: true, title: '穹庐', src: '《汉书·匈奴传》',
    text: '匈奴人住的圆顶帐篷叫「穹庐」，用木架和毛毡搭成。要搬家的时候拆开，放到马背上就能带走。',
    img: { src: 'img/cards/qionglu.jpg', cap: '今天蒙古草原上的毡帐。样子和古时候差不多，只是多了一块太阳能板。', credit: 'Bernard Gagnon · CC0 · Wikimedia Commons' } },
  youmu: { ch: 1, fact: true, title: '逐水草迁徙', src: '《史记·匈奴列传》',
    text: '匈奴人放牧马、牛、羊，哪里水草好，就搬到哪里去。他们没有城墙，也不种田。' },
  food: { ch: 1, fact: true, title: '吃肉穿皮', src: '《史记·匈奴列传》',
    text: '史书说，匈奴「自君王以下，咸食畜肉，衣其皮革」——从单于到平民，都吃牲畜的肉，穿兽皮做的衣服。汉朝的丝绸和粮食，在草原上非常稀罕。' },
  qiyang: { ch: 1, fact: true, title: '骑羊射鸟', src: '《史记·匈奴列传》',
    text: '史书说匈奴的孩子「能骑羊，引弓射鸟鼠；少长则射狐兔」——小时候骑着羊射鸟和老鼠，长大一点就射狐狸和兔子。所以人人都是好骑手。' },
  mingdi: { ch: 1, fact: true, title: '鸣镝', src: '《史记·匈奴列传》',
    text: '一种射出去会发出响声的箭。匈奴的冒顿单于用它训练部下：鸣镝射向哪里，所有人都必须跟着射向哪里。',
    img: { src: 'img/cards/mingdi.jpg', cap: '铜鸣镝（河南博物院「匈奴」特展）。箭头上的小孔，飞起来会呜呜响。', credit: 'Gary Todd · CC0 · Wikimedia Commons' } },
  wife: { ch: 1, fact: true, title: '胡妻', src: '《史记·大宛列传》',
    text: '单于让张骞娶了匈奴妻子，还生了孩子，想让他安心留在草原。史书没有记下她的名字。' },
  jie: { ch: 1, fact: true, title: '持节不失', src: '《史记·大宛列传》',
    text: '「节」是使者的信物。张骞被扣留了十多年，娶妻生子，却一直把汉节带在身边，没有丢掉。史书写道：「然骞持汉节不失。」',
    img: { src: 'img/cards/jie.jpg', cap: '清代闵贞《苏武牧羊图》。苏武是比张骞晚几十年的汉使，也被匈奴扣留，手里拿的就是汉节。', credit: '闵贞 · 公有领域 · 克利夫兰艺术博物馆' } },
  yuyan: { ch: 1, fact: false, title: '学说匈奴话', src: '游戏想象',
    text: '史书没有写张骞怎样学匈奴话。但他在草原住了十多年，后来又和西域各国打交道，很可能会说当地的话。游戏里跟小孩学说话的情节是想象的。' },
  escape: { ch: 1, fact: true, title: '向西逃走', src: '《史记·大宛列传》',
    text: '时间久了，匈奴对张骞看管得越来越松。张骞抓住机会，带着手下逃走，向西走了几十天，到达了大宛。' },
};

// ===== 章末小结 =====
const RECAPS = {
  0: {
    game: ['你是汉朝的郎官张骞。在长安，你听人说起匈奴的强大、和亲的无奈，还有月氏和匈奴的仇恨。', '汉武帝招募出使月氏的使者，你报了名，接过汉节，还找到了向导甘父。', '你们一路西行到了陇西，走出了边塞……'],
    history: ['西汉初年匈奴很强，汉朝只能靠和亲换和平。到了汉武帝时，汉朝想反击匈奴。', '汉武帝听说月氏恨匈奴，想联合月氏一起夹击匈奴，于是招募使者。', '约公元前138年（也有书写作前139年），张骞带着一百多人和向导甘父，从陇西出发。', '注意：游戏里长安的老兵、老先生、送信的老妇人等小角色是虚构的。'],
  },
  1: {
    game: ['一出边塞，你们就被匈奴骑兵抓住，押到了单于面前。', '你在草原住了下来，见识了穹庐、放牧和吃肉穿皮的生活，还娶了妻、有了孩子。', '十年过去，你一直带着汉节。趁看守松懈，你和甘父逃了出来，一路向西，到了大宛。'],
    history: ['张骞一行被匈奴扣留了十多年。单于让他娶妻生子，但他「持汉节不失」。', '后来看管渐松，张骞带着手下逃走，西行几十天到了大宛，又经过康居，到达大月氏。', '史书没写清他这次逃走时妻儿是否同行。几年后他回汉朝时，是带着匈奴妻子和甘父一起逃回来的。', '出发时一百多人，十三年后只有张骞和甘父两人回到长安。游戏里找小羊、学匈奴话等情节是想象的。'],
  },
};

// ===== 世界地图 =====
const WORLD_DEF = {
  name: '西北边疆', start: 'A', seed: 138,
  coarse: [
    '^^^^^^^^^^^^^^',
    '^ddd^.h...^^^^',
    '^dZd7..X.h^.T^',
    '^ddd^h...T3L.^',
    '^ddd^..h..^..^',
    '^^^^^^^^^^^h.^',
    '^^^^^^^^^^^TA^',
    '^^^^^^^^^^^^^^',
  ],
  zones: [
    { z: 'han', x0: 11, y0: 1, x1: 12, y1: 6 },
    { z: 'steppe', x0: 5, y0: 1, x1: 9, y1: 4 },
    { z: 'west', x0: 1, y0: 1, x1: 3, y1: 4 },
  ],
  zoneInfo: { han: { ground: '.', mtn: '^' }, steppe: { ground: '.', mtn: '^' }, west: { ground: 'd', mtn: 'R' } },
};
const LOCS = {
  A: { id: 'changan', kind: 'town', icon: 'bigcity', art: 'capital', name: '长安城' },
  L: { id: 'longxi', kind: 'town', icon: 'fort', art: 'frontier', name: '陇西' },
  X: { id: 'xiongnu', kind: 'town', icon: 'yurts', art: 'camp', name: '匈奴营地', need: () => !F().escaped, needMsg: '（不能回去了。往西走，去找月氏！）' },
  Z: { id: 'dayuan', kind: 'event', icon: 'city', art: 'oasis', name: '大宛', ev: 'dayuan' },
};
// 野外的文物：at 写 'world:区域' / 'town:城镇' / 'dun:场景:层'
const RELICS = [
  { at: 'town:changan', card: 'wadang', say: '地上有一块圆圆的旧瓦，上面刻着四个字：「长乐未央」。' },
  { at: 'world:han', card: 'banliang', say: '草丛里有一枚铜钱，圆形方孔，上面写着「半两」。' },
  { at: 'world:steppe', card: 'mingdi', say: '草地上插着一支奇怪的箭，箭头上有几个小孔。拔出来一吹——呜呜作响！' },
];
// 关卡在世界地图上的样子：3 是汉朝边塞的关城，7 是匈奴的哨卡
const GATE_ART = { '3': 'hanpass', '7': 'xnpost' };
const GATE_MSG = {
  '3': async () => {
    if (F().ch >= 1) return '往东是回汉朝的路，可匈奴的哨骑把守得严严实实。……况且，你的使命在西边。';
    const c = await ask('甘父', '张大人，出了这道关，就是匈奴人的地方了。要出塞吗？', ['出塞！', '再准备一下']);
    if (c === 0) await STORY.chuSai();
  },
  '7': () => F().escaped ? null : '匈奴的哨卡。几个骑兵正在巡逻，眼睛一直盯着你们。（现在还逃不掉。）',
};
const DUNGEONS = {};

// ===== 城镇 =====
const TOWNS = {
  changan: {
    name: '长安城', size: 'big', theme: 'city', roof: '#3a3a4a',
    b: [
      { slot: 0, type: 'rest', art: 'house', washing: true, label: '张家', ask: '回家歇一会儿吗？' },
      { slot: 1, type: 'special', art: 'palace', label: '未央宫', ev: 'weiyang' },
      { slot: 2, type: 'house', art: 'market', label: '东市', who: '丝绸商人', say: ['上好的蜀锦、齐纨！……唉，可惜北边的匈奴年年来抢，商路都不太平。'], roof: '#5a3a6a' },
      { slot: 5, type: 'house', art: 'bookshop', label: '书肆', who: '老先生', card: 'heqin', say: ['高祖皇帝当年被匈奴围在白登山，七天七夜，差点回不来。', '从那以后，汉朝只好和匈奴「和亲」——嫁公主，送丝绸，送粮食……', '可匈奴拿了东西，转头又来抢。皇上年轻气盛，怕是忍不了多久了。'], roof: '#2a5a3a' },
      { slot: 6, type: 'house', art: 'barracks', label: '兵营', who: '老兵', card: 'xiongnu', say: ['我在北边打过匈奴。他们人人骑马，从小就会射箭。', '咱们的步兵刚列好阵，人家的骑兵早就跑得没影了。'], roof: '#5a4a3a' },
      { slot: 9, type: 'house', art: 'house', roof: '#6a5040', label: '民宅', who: '老婆婆', say: ['孩子，听说宫里在招人去西边？那可是要穿过匈奴人的地盘啊……'] },
    ],
    decor: ['plaza', 'trees', 'garden', 'pond'],
    features: { canal: { y: 12, bridges: [4, 23] } },
    npcs: [
      { sp: 'guard', name: '城门守卫', x: 13, y: 20, still: true, cond: () => !F().ganJoined, say: () => F().appointed ? ['张郎官，向导找到了吗？听说城西住着一个叫甘父的胡人，懂匈奴话。'] : ['张郎官要出城？没有皇上的诏令可不行。', '听说皇上正在未央宫为匈奴的事发愁呢。'] },
      { sp: 'guard', name: '城门守卫', x: 14, y: 20, still: true, cond: () => !F().ganJoined, say: ['城外往西是陇西，再往西……就是匈奴人的地方了。'] },
      { sp: 'xnman', name: '匈奴降人', x: 21, y: 13, card: 'yuezhi', say: () => { F().heardYuezhi = 1; return ['我原来是匈奴人，后来逃到了汉朝。', '你知道月氏吗？他们以前住在西边的河西一带。我们匈奴打败了他们，杀了月氏王……', '还把月氏王的头骨做成了喝酒的器皿。月氏人逃到很远的西方，到现在还恨着匈奴呢。']; } },
      { sp: 'ganfu', name: '甘父', x: 3, y: 13, cond: () => !F().ganJoined, fn: () => STORY.ganfu() },
      { sp: 'oldwoman', name: '老妇人', x: 16, y: 13, say: ['我儿子在陇西当兵，守烽火台。好几年没回来了……'] },
      { sp: 'child', name: '小孩', x: 10, y: 18, say: () => F().appointed ? ['你要去很远很远的西边吗？那边有没有会飞的马？'] : ['我长大了也要当大将军，打匈奴！'] },
      { sp: 'merchant', name: '卖饼的', x: 23, y: 18, say: ['胡饼！刚出炉的胡饼！……这名字？我也不知道，大家都这么叫。'] },
      { sp: 'scholar', name: '郎官同僚', x: 5, y: 6, card: 'changan', cardIf: () => F().appointed, say: () => F().appointed ? ['张兄真的要去月氏？……一路保重，一定要活着回来！', '等你回来，咱们再一起站在未央宫的台阶上，看整座长安城。'] : ['（操作：方向键移动，Z 键对话和调查，X 键打开菜单，撞到门就能进屋。）', '张兄，听说皇上要找人去出使西边的月氏，满朝文武没人敢应。'] },
    ],
  },
  longxi: {
    name: '陇西', size: 'small', theme: 'desert', roof: '#6a4a2a', yOffset: 1,
    onEnter: async () => { if (F().longxiSeen) return; F().longxiSeen = 1; await narr(['陇西。汉朝西北边境的最后一座城。', '城外西边就是边塞。再往西走，就进入匈奴的地盘了。']); },
    b: [
      { slot: 0, type: 'rest', art: 'station', label: '驿站', keeper: '驿卒', ask: '使者大人，要在驿站歇歇脚吗？' },
      { slot: 4, type: 'house', art: 'office', label: '郡府', who: '陇西郡守', card: 'longxi', say: ['你就是要去月氏的张骞？', '出了陇西往西，到处都是匈奴的骑兵。一百多人的使团，太显眼了……', '本官能做的，只有为你们备足干粮和水。保重！'] },
      { slot: 1, type: 'house', art: 'beacon', label: '烽火台', who: '老戍卒', say: ['看见那座高台了吗？那是烽燧。', '白天放烟，夜里点火。匈奴一来，一座传一座，消息很快就到长安了。'], roof: '#5a4a3a' },
    ],
    decor: ['trees', 'field'],
    npcs: [
      { sp: 'soldier', name: '年轻戍卒', x: 4, y: 6, say: ['边塞的风真大。我娘在长安，不知道她身体好不好……'] },
      { sp: 'merchant', name: '马贩子', x: 15, y: 6, say: ['西边草原上的马，又高又壮。可惜匈奴人不肯卖给咱们。'] },
      { sp: 'woman2', name: '农妇', x: 9, y: 12, say: ['去年秋天匈奴来抢过一次，把粮食和牛羊都抢走了。'] },
    ],
  },
  xiongnu: {
    name: '匈奴营地', size: 'small', theme: 'steppe', style: 'yurt', wall: '#e8dcc0', music: 'steppe',
    b: [
      { slot: 0, type: 'special', art: 'yurt_home', label: '你的毡帐', ev: 'home' },
      { slot: 1, type: 'special', art: 'yurt_royal', label: '单于大帐', ev: 'chanyuTent' },
      { slot: 2, type: 'house', art: 'yurt_herd', label: '牧民毡帐', who: '牧民大婶', card: 'food', say: ['汉人，饿了吧？来，吃块羊肉，喝碗马奶。', '我们草原上不种粮食。吃的是牛羊肉，穿的是兽皮。', '你们汉朝的丝绸可真软和……单于身上就穿着一件。'] },
      { slot: 4, type: 'house', art: 'yurt_old', label: '老牧人的毡帐', who: '老牧人', card: 'qionglu', say: ['这是我们的「穹庐」。木头搭架子，外面盖上毛毡，冬天也不怕冷。', '要搬家了，拆开往马背上一放就走。你们汉人的房子能搬吗？哈哈！'] },
    ],
    decor: ['field', 'field', 'trees'],
    features: { tiles: ['r', 'b', 'b', 'k'] },
    npcs: [
      { sp: 'xnguard', name: '匈奴看守', x: 10, y: 14, still: true, say: () => F().tenYears ? ['又去溜达？去吧去吧。都十年了，你还能跑到哪儿去？'] : ['单于说了，你们哪儿也不许去！营地附近随便走走可以。'] },
      { sp: 'xnman', name: '牧民', x: 4, y: 6, card: 'youmu', say: ['再过些日子，这片草就吃光了。到时候整个营地都要搬走。', '哪里有水、有草，我们就去哪里。草原就是我们的家。'] },
      { sp: 'xnchild', name: '匈奴小孩', x: 15, y: 6, say: () => G.quests.lamb && G.quests.lamb.st === 'done' ? ['看！我骑着小羊射中了一只老鼠！', '你也学会说我们的话啦！'] : ['你说话怎么怪怪的？'] },
      { sp: 'huqi', name: '胡妻', x: 9, y: 12, cond: () => F().tenYears, say: () => F().escapeTalk ? ['……我知道你的心一直在西边。那根竹杖，你天天擦，十年都没放下过。'] : ['孩子又长高了。他说话一半像你，一半像我。'] },
      { sp: 'son', name: '儿子', x: 11, y: 12, cond: () => F().tenYears, say: ['阿爸，汉朝是什么样子的？那里也有这么大的草原吗？'] },
    ],
  },
};

// ===== 支线任务 =====
const QUESTS = {
  jiashu: { name: '一封家书', town: 'changan', npc: '老妇人', ch: 0, type: 'deliver', item: 'q_letter',
    to: { town: 'longxi', npc: '年轻戍卒', say: ['这是……我娘的信！', '她说家里一切都好，叫我在边塞别冻着……', '谢谢你，使者大人！我带你看看我们的烽火台是怎么用的吧！'] },
    desc: '把老妇人的家书送到陇西，交给她当戍卒的儿子。',
    ask: ['你要往西边去？经过陇西吗？', '我儿子在陇西守烽火台。能帮我捎一封信给他吗？'],
    after: '儿子回信了！说他在边塞挺好的。谢谢你啊！',
    reward: { cards: ['fengsui'] } },
  lamb: { name: '走失的小羊', town: 'xiongnu', npc: '匈奴小孩', ch: 1, type: 'find', find: 'world:steppe', item: 'q_lamb', icon: 'lamb',
    desc: '在营地外的草原上，找回匈奴小孩走失的小羊。',
    ask: ['我的小羊跑丢了！就在营地外面的草原上……', '我每天都骑着它练射箭呢。你帮我找找好不好？'],
    wait: '小羊跑到营地外面去了，大概躲在哪个角落里……',
    done: ['咩咩！就是它！', '我教你一句我们的话吧：「谢谢」是这么说的……', '你学得真快！'],
    after: '你看我骑羊射箭！',
    reward: { cards: ['qiyang', 'yuyan'] } },
};

// ===== 剧情 =====
const STORY = {
  async intro() {
    Snd.play('sad');
    Fade.a = 0;
    await card(['张骞传', '— 出使西域 —'], { big: true });
    await card(['两千多年前，西汉。', '北方草原上，匈奴的骑兵来去如风，', '常常南下抢掠汉朝的边境。'], { lh: 46 });
    await card(['汉朝打不过，只好嫁公主、送丝绸，', '换来一时的和平。'], { lh: 46 });
    await card(['到了汉武帝的时候，', '年轻的皇帝不想再忍了。'], { lh: 46 });
    await card(['未央宫', '', '序章'], { big: true });
    const p = doorPos('changan', 0);
    Fade.a = 1;
    Scene = MapScene; MapScene.enter('town:changan', p.x, p.y, 'down');
    await fadeIn(800);
    await narr('长安城。你是皇宫里的一名郎官，名叫张骞。');
    await say('张骞', ['听说皇上正在为匈奴的事发愁，要找人去办一件大事。', '先在城里转转，再去未央宫看看吧。']);
    await narr('（方向键移动，Z 键对话和调查，X 键打开菜单。地上闪光的竹简，是可以收集的史料卡！）');
    autosave();
  },
  async weiyang() {
    if (F().appointed) { await narr('（未央宫里，汉武帝正等着你的好消息。去城西找甘父吧。）'); return; }
    Snd.play('sad');
    await narr('未央宫大殿。汉武帝刘彻坐在殿上，大臣们分列两旁。');
    await say('汉武帝', ['匈奴年年犯我边境。朕不想再靠和亲过日子了！', '听匈奴降人说，月氏王被匈奴所杀，头骨被做成了酒器。月氏人逃到西边，恨透了匈奴。', '朕想派使者去找月氏，约他们一起夹击匈奴。', '可是去月氏，必须穿过匈奴的地盘……谁愿意去？']);
    await narr('大殿里一片安静，谁也不说话。');
    const c = await ask('张骞', '（要报名吗？）', ['臣愿往！', '再想想']);
    if (c !== 0) { await say('汉武帝', '……唉。'); Snd.play(MapScene.musicFor()); return; }
    await say('张骞', '臣张骞，愿意出使月氏！');
    await say('汉武帝', ['好！有胆量！', '朕赐你汉节。见节如见朕。再给你一百多人随行。']);
    await giveItem('jie');
    await getCard('zhaomu');
    await say('汉武帝', '去月氏的路要经过匈奴。城西住着一个叫甘父的胡人，懂匈奴话，又善骑射。让他给你带路。');
    F().appointed = 1;
    Snd.play(MapScene.musicFor());
    autosave();
  },
  async ganfu() {
    if (!F().appointed) { await say('甘父', ['我叫甘父，本是匈奴人，现在是堂邑家的仆人。', '……听说宫里在找人去西边？那可是条要命的路。']); return; }
    await say('甘父', ['张大人！皇上的诏令我听说了。', '我是匈奴人，懂他们的话，也认得草原上的路。', '我的弓箭也不差——路上饿了，我射鸟兽给大家吃！']);
    await say('张骞', '好！甘父，我们一起去！');
    F().ganJoined = 1;
    await joinParty('gan');
    await getCard('ganfu');
    await narr('（出了长安城往北走，就是陇西。）');
  },
  async chuSai() {
    await recap(0);
    await chapter(1);
    Snd.play('dungeon');
    await narr(['你们刚走出边塞没多远……', '远处尘土飞扬，马蹄声越来越近——']);
    Snd.sfx('encounter'); Shake.start(8, 700);
    await narr(['是匈奴的骑兵！', '一百多人的使团，被团团围住，一个也没跑掉。']);
    await fadeOut(600);
    await card(['你们被押送到了单于的大帐前。'], { auto: 2600 });
    const p = doorPos('xiongnu', 1);
    Fade.a = 1;
    Scene = MapScene; MapScene.enter('town:xiongnu', p.x, p.y, 'up');
    await fadeIn(600);
    Snd.play('sad');
    await say('单于', ['汉朝的使者？要去月氏？', '哼！月氏在我们北边，汉朝怎么能派使者过去？', '要是我派使者去南越，汉朝肯让我们从中原过去吗？']);
    await say('单于', '把他们留下！谁也不许走！');
    await getCard('chanyu');
    Snd.play(MapScene.musicFor());
    await say('甘父', ['张大人……看来，我们要在草原上待一阵子了。', '先四处看看吧。匈奴人怎么过日子，总得弄明白。']);
    await narr('（和营地里的人聊聊天。累了就回「你的毡帐」休息。）');
    autosave();
  },
  async chanyuTent() {
    if (F().tenYears) { await narr('（单于大帐里正在喝酒唱歌，没人理会你。）'); return; }
    await say('单于', ['又是你。还想着去月氏？', '留在草原吧。这里有吃不完的羊肉，喝不完的马奶。']);
  },
  async home() {
    if (!F().tenYears) {
      const seen = ['qionglu', 'youmu', 'food'].filter(hasCard).length;
      if (seen < 2) { await narr(['你在毡帐里坐了一会儿，心里想着月氏。', '（先出去走走，看看匈奴人是怎么生活的吧。）']); return; }
      await STORY.tenYears();
      return;
    }
    if (!F().escaped) { await STORY.escapeNight(); return; }
  },
  async tenYears() {
    await narr('夜深了。你躺在毡帐里，摸着身边的汉节，慢慢睡着了……');
    await fadeOut(900);
    Snd.play('sad');
    await card(['一年，两年……'], { auto: 2400 });
    await card(['草原上的草，绿了又黄，黄了又绿。'], { auto: 2600 });
    await card(['单于为你娶了一位匈奴妻子。', '后来，你们有了一个儿子。'], { lh: 46 });
    F().tenYears = 1;
    await getCard('wife');
    await card(['你学会了骑马放羊，', '也学会了说匈奴话。'], { lh: 46 });
    await card(['可是，那根汉节，', '你一直带在身边。'], { lh: 46 });
    await getCard('jie');
    await card(['十年过去了。'], { big: true });
    MapScene.refresh();
    Snd.play(MapScene.musicFor());
    await fadeIn(900);
    await say('甘父', ['张大人，你发现了吗？这些年，看守越来越松了。', '他们以为我们早就死心了……', '找个夜里，我们走吧。往西去，去找月氏！']);
    await narr('（和家人说说话吧。准备好了，就回「你的毡帐」。）');
    autosave();
  },
  async escapeNight() {
    const c = await ask('甘父', '张大人，今晚没有月亮，看守也喝醉了。现在走吗？', ['走！', '再等等']);
    if (c !== 0) { await say('甘父', '好，我们再等等。'); return; }
    F().escapeTalk = 1;
    await say('胡妻', ['……我知道你的心一直在西边。', '那根竹杖，你天天擦，十年都没放下过。']);
    await say('张骞', '……');
    await fadeOut(800);
    Snd.play('dungeon');
    await card(['那一夜，没有月亮。'], { auto: 2400 });
    await card(['你握紧汉节，和甘父、几个随从一起，', '悄悄牵出了马……'], { lh: 46 });
    F().escaped = 1; F().gate7 = 1;
    await getCard('escape');
    await toWorldAt('X');
    await say('甘父', ['往西！一直往西！', '穿过那道哨卡，就是去大宛的路了！']);
    autosave();
  },
  async dayuan() {
    await narr(['你们向西走了几十天。', '翻过沙丘，前方出现了一座绿洲中的城——', '大宛到了！']);
    await recap(1);
    await fadeOut(400);
    Snd.play('title');
    await card(['未完待续', '', '第二章 大宛与月氏', '（这一章还在制作中）'], { big: true });
    await card(['感谢游玩！', '', `你一共收集了 ${cardCount()} / ${Object.keys(CARDS).length} 张史料卡。`, '想集齐全部史料卡？再来一次「新的旅程」吧！'], { lh: 40 });
    UI.stack.length = 0;
    titleLoop();
  },
};
