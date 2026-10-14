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
  author: '剑宁（jerrywong）',
  license: 'CC BY-NC-SA 4.0',
  // 开局、通关、推演报告末尾的引文（ADR 0003）
  motto: {
    text: '人们自己创造自己的历史，但是他们并不是随心所欲地创造，并不是在他们自己选定的条件下创造，而是在直接碰到的、既定的、从过去承继下来的条件下创造。',
    src: '马克思《路易·波拿巴的雾月十八日》',
    kid: '历史里的人都能做选择，可他们没法选择自己生在什么时代、手里有什么、知道些什么。',
    start: '接下来，你就是张骞。你知道的，只有他当时知道的。',
    clear: '张骞做了他能做的选择。如果换成你，在同样的条件下，会怎么做？',
    end: '这一次，你在同样的条件下，做了自己的选择。',
  },
  chapters: ['序章 未央宫', '第一章 匈奴十年', '第二章 大宛与月氏', '第三章 归途', '终章 凿空', '重生 再走一次'],
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
  '气盛': 'qì shèng', '胆量': 'dǎn liàng', '陕西': 'shǎn xī',
  '甘肃': 'gān sù', '丝绸': 'sī chóu', '羊羔': 'yáng gāo', '贩子': 'fàn zi',
  '宁夏': 'níng xià', '遗址': 'yí zhǐ', '宗室': 'zōng shì',
  '咩': 'miē', '殿': 'diàn', '烽火台': 'fēng huǒ tái', '烽火': 'fēng huǒ',
  // 第二章到终章（2026-10-13 pinyin-pass；并南山依《史记正义》「並，白浪反」）
  '康居': 'kāng jū', '大夏': 'dà xià', '安息': 'ān xī', '身毒': 'yuān dú',
  '蓝市': 'lán shì', '妫水': 'guī shuǐ', '阿姆河': 'ā mǔ hé', '阿富汗': 'ā fù hàn',
  '羌': 'qiāng', '邛竹杖': 'qióng zhú zhàng', '蜀布': 'shǔ bù', '左谷蠡王': 'zuǒ lù lí wáng',
  '伊稚斜': 'yī zhì xié', '军臣': 'jūn chén', '卫青': 'wèi qīng', '博望侯': 'bó wàng hóu',
  '太中大夫': 'tài zhōng dà fū', '奉使君': 'fèng shǐ jūn', '司马迁': 'sī mǎ qiān', '李广利': 'lǐ guǎng lì',
  '李希霍芬': 'lǐ xī huò fēn', '李特尔': 'lǐ tè ěr', '并南山': 'bàng nán shān', '万多石': 'wàn duō dàn',
  '汗血马': 'hàn xuè mǎ', '血汗': 'xuè hàn', '凿空': 'záo kōng', '给食': 'jǐ shí',
  '若欲何之': 'ruò yù hé zhī', '殊无': 'shū wú', '禽兽': 'qín shòu', '鸟兽': 'niǎo shòu',
  '蒲陶': 'pú táo', '苜蓿': 'mù xu', '酿酒': 'niàng jiǔ', '地窖': 'dì jiào',
  '皮袍': 'pí páo', '要领': 'yào lǐng', '嗖': 'sōu', '阿爸': 'ā bà',
};

// ===== 人物 =====
const CHARS = {
  zhang: { name: '张骞', title: '汉朝的郎官，出使月氏的使者', sp: () => hasItem('jie') ? 'zhangqian' : 'zhangqian0' },
  gan: { name: '甘父', title: '匈奴人，堂邑家的仆人，神射手', sp: 'ganfu' },
  huqi: { name: '胡妻', title: '张骞在匈奴娶的妻子，史书没记下她的名字', sp: 'huqi' },
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
  dywang: { h: '#2a1a10', s: '#d8a070', r: '#2a6a8a', R: '#1a4a6a', t: '#f0c040', y: '#f0c040', b: '#2a1a10', f: ['crown', 'beard'] },
  dyman: { h: '#2a1a10', s: '#d8a070', r: '#c8a060', R: '#9a7a40', t: '#6a3a2a', x: '#e8e0d0', f: ['cap', 'beard'] },
  dywoman: { h: '#2a1a10', s: '#d8a070', r: '#a83a5a', R: '#7a2a40', t: '#f0d080', f: ['topknot', 'skirt'] },
  dychild: { h: '#2a1a10', s: '#d8a070', r: '#6a9a4a', R: '#4a7a2a', t: '#c03030', f: ['tufts'], small: true },
  kjman: { h: '#2a1a10', s: '#c89060', r: '#7a3a2a', R: '#5a2a1a', t: '#e8c060', x: '#3a2a1a', b: '#2a1a10', f: ['furhat', 'beard'] },
  yzman: { h: '#1a1a1a', s: '#d0a070', r: '#4a5a8a', R: '#2a3a6a', t: '#e0b040', x: '#e8e0d0', b: '#1a1a1a', f: ['furhat', 'longbeard'] },
  dxman: { h: '#2a1a10', s: '#d8a070', r: '#e0d0a0', R: '#b8a070', t: '#3a6a8a', x: '#3a6a8a', b: '#2a1a10', f: ['cap', 'beard', 'belly'] },
});
const SPEAK = { '张骞': 'zhangqian', '汉武帝': 'wudi', '单于': 'chanyu', '胡妻': 'huqi', '大宛王': 'dywang', '康居人': 'kjman', '月氏大臣': 'yzman' };

// 走失的小羊（任务物品在地图上的样子）
// 一捆苜蓿（开紫花的牧草）
LOCICON.musu = x => { for (let k = 0; k < 6; k++) pline(x, 5 + k, 14, 3 + k * 2, 4 + (k % 2) * 2, '#3a8a3a'); prect(x, 4, 10, 9, 2, '#c8a050'); for (const [X, Y] of [[3, 4], [7, 3], [11, 5], [9, 6]]) { px(x, X, Y, '#9a5ac8'); px(x, X + 1, Y, '#b07ad8'); } };
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
  q_musu: { name: '苜蓿', type: 'quest', desc: '一捆开紫花的苜蓿草，大宛的马最爱吃。' },
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
  // —— 第二章 ——
  dywang: { ch: 2, fact: true, title: '大宛王很高兴', src: '《史记·大宛列传》',
    text: '大宛早就听说汉朝很富有，想和汉朝来往，可一直找不到路。张骞来了，大宛王很高兴，问他：「你要去哪儿？」史书里的原话是「若欲何之？」' },
  chengnuo: { ch: 2, fact: true, title: '张骞的承诺', src: '《史记·大宛列传》',
    text: '张骞说：「请大王派人送我去月氏。我回到汉朝以后，汉朝送给大王的财物多得说不完。」大宛王觉得有道理，就派了向导和翻译。向导就是带路的人。' },
  putaojiu: { ch: 2, fact: true, title: '葡萄酒能放几十年', src: '《史记·大宛列传》',
    text: '大宛人用葡萄（古书写作「蒲陶」）酿酒，有钱人家藏的酒有一万多石，放几十年都不坏。大宛的马最爱吃一种草，叫苜蓿。',
    img: { src: 'img/cards/putaojiu.jpg', cap: '今天的苜蓿花。大宛的马最爱吃它，后来汉使把种子带回了中原。', credit: 'Sten Porse · CC BY-SA 3.0 · Wikimedia Commons' } },
  hanxue: { ch: 2, fact: true, title: '汗血马', src: '《史记·大宛列传》',
    text: '大宛有很多好马。史书说这种马流的汗像血一样红，叫「汗血马」，还说它们是「天马」的后代。为什么会流「血汗」，史书没有解释。',
    img: { src: 'img/cards/hanxue.jpg', cap: '东汉铜奔马（甘肃省博物馆）。这是汉代人心中的骏马，不是汗血马的写真，比张骞晚两百多年。', credit: 'Gary Todd · CC0 · Wikimedia Commons' } },
  chuansong: { ch: 2, fact: true, title: '一站一站送过去', src: '《史记·大宛列传》',
    text: '大宛派人把张骞送到康居，康居又把他送到大月氏。张骞是靠各国的人一站一站帮忙，才走到的。康居人也是赶着牛羊、四处搬家的游牧民族。' },
  xinwang: { ch: 2, fact: true, title: '新王是谁？', src: '《史记》《汉书》',
    text: '大月氏的老王被匈奴杀了，后来立了新王。《史记》说新王是太子，《汉书》说新王是王后。两本书说得不一样，到今天也说不准。' },
  anle: { ch: 2, fact: true, title: '大月氏不想打仗了', src: '《史记·大宛列传》',
    text: '大月氏搬到了新家，土地肥沃，没什么敌人，日子过得很安乐。他们觉得汉朝太远了，一点也不想再找匈奴报仇。',
    img: { src: 'img/cards/anle.jpg', cap: '今天的阿姆河，古代叫妫水。大月氏的王庭就在这条河的北边。', credit: 'My cardio · CC BY-SA 4.0 · Wikimedia Commons' } },
  lanshi: { ch: 2, fact: true, title: '大夏的大市场', src: '《史记·大宛列传》',
    text: '大夏人住在城里，很会做生意。都城叫蓝市城，市场上什么东西都有卖。可是他们的军队很弱，怕打仗。大夏在今天的阿富汗北部一带。' },
  qiongzhu: { ch: 2, fact: true, title: '四川的东西跑到了大夏', src: '《史记·大宛列传》',
    text: '张骞在大夏的市场上，看见四川出产的邛竹杖和蜀布。大夏人说，是商人从身毒（就是古印度）买来的。张骞想：身毒离四川一定不远！' },
  yinbi: { ch: 2, fact: true, title: '硬币上有国王的脸', src: '《史记·大宛列传》',
    text: '张骞听说，西边的安息国用银子做钱，钱上印着国王的脸。国王死了，就换一种新钱。这是张骞听人说的，他没有亲自去过安息。',
    img: { src: 'img/cards/yinbi.jpg', cap: '安息国王米特拉达梯二世的银币，和张骞是同一个时代。钱上印的就是国王的脸。', credit: 'Neilson C. Debevoise · 公有领域 · Wikimedia Commons' } },
  yaoling: { ch: 2, fact: true, title: '没完成的任务', src: '《史记·大宛列传》',
    text: '张骞在大夏住了一年多，始终没能说服大月氏一起打匈奴。史书说他「不能得月氏要领」。「要领」本来指衣服的腰和领，这里是说抓不住要点，事情没办成。' },
  // —— 第三章 ——
  nanshan: { ch: 3, fact: true, title: '换一条路回家', src: '《史记·大宛列传》',
    text: '回家时，张骞想避开匈奴，沿着南边的大山走，从羌人住的地方回来。史书写的是「并南山，欲从羌中归」。没想到，又被匈奴抓住了。',
    img: { src: 'img/cards/nanshan.jpg', cap: '今天的祁连山（在甘肃嘉峪关拍摄）。张骞回家时，就是沿着这样连绵的雪山走的。', credit: 'Emcc83 · CC BY-SA 3.0 · Wikimedia Commons' } },
  sheshou: { ch: 3, fact: true, title: '会射箭的好伙伴', src: '《史记·大宛列传》',
    text: '甘父（堂邑父）原本是胡人，射箭很准。最难的时候没东西吃，他就射鸟兽给大家吃。史书说他「穷急射禽兽给食」。',
    img: { src: 'img/cards/sheshou.jpg', cap: '东汉的射猎画像砖（中国国家博物馆）。左上角的人正拉弓射天上的鸟。比张骞晚两百多年。', credit: 'Anagoria · CC BY-SA 4.0 · Wikimedia Commons' } },
  luan: { ch: 3, fact: true, title: '趁乱逃走', src: '《史记》大宛列传、匈奴列传',
    text: '张骞又被关了一年多。这时单于死了，单于的弟弟左谷蠡王打败太子，自己当了单于，匈奴乱成一团。张骞趁乱带着妻子和甘父逃回了汉朝。' },
  // —— 终章 ——
  erren: { ch: 4, fact: true, title: '一百多人去，两人回', src: '《史记·大宛列传》',
    text: '出发时有一百多人。过了十三年，只有张骞和甘父两个人回到汉朝。一起逃回来的胡妻，不在原来那一百多人里。' },
  jiangshang: { ch: 4, fact: true, title: '皇帝的奖赏', src: '《史记·大宛列传》',
    text: '约公元前126年，张骞回到长安。汉武帝让张骞当「太中大夫」，让甘父当「奉使君」。这两个都是官名。' },
  zaokong: { ch: 4, fact: true, title: '什么叫「凿空」', src: '《史记·大宛列传》及古注',
    text: '司马迁在《史记》里说张骞「凿空」。凿就是打开，空就是孔、通道。意思是：通往西域本来没有路，张骞像凿开一个洞一样，第一个把路打通了。',
    img: { src: 'img/cards/zaokong.jpg', cap: '今天陕西城固的张骞墓。2014 年，它和丝绸之路一起列入了世界遗产。', credit: 'hanming_huang · CC BY-SA 2.0 · Wikimedia Commons' } },
  bowang: { ch: 4, fact: true, title: '博望侯', src: '《史记·大宛列传》',
    text: '回国三年后，张骞跟着大将军卫青打匈奴。他知道哪里有水和草，军队不缺水草，立了功，被封为博望侯。「博望」常被解释成「看得广、望得远」。',
    img: { src: 'img/cards/bowang.jpg', cap: '西汉霍去病墓前的「马踏匈奴」石雕。霍去病是和张骞同一个时代的将军。', credit: 'Hanming Huang · CC BY-SA 4.0 · Wikimedia Commons' } },
  putao: { ch: 4, fact: true, title: '葡萄是谁带回来的？', src: '《史记·大宛列传》《汉书》',
    text: '很多人以为葡萄是张骞带回来的。其实史书写的是：张骞以后的「汉使」把葡萄和苜蓿的种子带回来。汗血马更晚，是二十多年后打大宛才得到的。' },
  sichou: { ch: 4, fact: true, title: '「丝绸之路」这个名字', src: '近代学者研究',
    text: '汉朝人从来不说「丝绸之路」。这个名字是一千九百多年后的德国学者起的：1838 年李特尔已经用过，1877 年李希霍芬让它出了名。',
    img: { src: 'img/cards/sichou.jpg', cap: '德国地理学家李希霍芬。是他让「丝绸之路」这个名字出了名。', credit: '佚名 · 公有领域 · Wikimedia Commons' } },
  // ----- 重生线（只在重生模式里拿得到）-----
  songxia: { ch: 5, rebirth: true, fact: true, title: '一点点松下来', src: '《史记·大宛列传》',
    text: '张骞在匈奴住了十多年，娶了妻子，有了孩子。匈奴人慢慢不再那么紧地看着他。张骞一直留着汉节。机会一来，他就带着手下人往西逃。' },
  liangben: { ch: 5, rebirth: true, fact: true, title: '两本书不一样', src: '《史记·大宛列传》《汉书·张骞传》',
    text: '《史记》说张骞逃走前，看守变松了。《汉书》在同一个地方，却写他「住在匈奴西边」。两本古书写法不同，所以我们不能说得太肯定。' },
  liangci: { ch: 5, rebirth: true, fact: true, title: '两次出使带的东西不一样', src: '《史记·大宛列传》',
    text: '第一次出使，史书只写了一百多人，没写带了什么礼物。第二次去乌孙，张骞带了三百人，每人两匹马，几万头牛羊，还有很多金子和丝绸。' },
  wusun: { ch: 5, rebirth: true, fact: true, title: '乌孙也说「再想想」', src: '《史记·大宛列传》',
    text: '很多年后，张骞带着大批财物去劝乌孙搬回东边。乌孙王老了，国家分成几块，大臣都怕匈奴，也不知道汉朝有多大。所以乌孙没答应。' },
  kanyikan: { ch: 5, rebirth: true, fact: true, title: '看一看就明白了', src: '《史记·大宛列传》',
    text: '乌孙派了几十个使者，跟张骞到汉朝看看。他们看到汉朝人多、富有，回去一说，乌孙就开始看重汉朝了。' },
  jiemeng: { ch: 5, rebirth: true, fact: true, title: '结盟以后', src: '《汉书·西域传》《汉书·匈奴传》',
    text: '汉朝公主一位接一位嫁到乌孙。公元前71年，汉朝和乌孙一起打匈奴，匈奴从此衰弱了。这时离张骞去乌孙，已经过了大约五十年。' },
  huijia: { ch: 5, rebirth: true, fact: true, title: '回家的路选哪条', src: '《史记·大宛列传》',
    text: '回来时，张骞沿着南边的大山走，想从羌人住的地方回汉朝，可还是被匈奴抓住了。那时河西一带还是匈奴的地方。他为什么选这条路，史书没写。' },
  hexi: { ch: 5, rebirth: true, fact: true, title: '河西什么时候变成汉朝的', src: '《汉书·武帝纪》《史记·大宛列传》',
    text: '张骞回来五年后，匈奴的浑邪王投降了汉朝。从那以后，河西走廊不再有匈奴人。汉朝在这里设了郡（郡：地方上的行政区）。' },
  shendu: { ch: 5, rebirth: true, fact: true, title: '身毒在哪里', src: '《史记·大宛列传》',
    text: '张骞在大夏看到四川的竹杖和布。大夏人说，是商人从东南边的身毒买来的。身毒在大夏东南几千里，又湿又热，人们骑着大象打仗。' },
  xinan: { ch: 5, rebirth: true, fact: true, title: '西南的路没走通', src: '《史记·大宛列传》',
    text: '张骞回来后说，从蜀地去大夏，路近又没有强盗。汉武帝派人从蜀地分四路去找身毒，都被昆明等部族挡住。试了很多年，始终没有走通。' },
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
  2: {
    game: ['大宛王很高兴，派向导和翻译送你们，经过康居，到了大月氏。', '大月氏过上了安乐的日子，不想再和匈奴打仗。', '你在大夏的市场上看到了四川的竹杖和布。住了一年多，还是没能完成使命。'],
    history: ['张骞亲自到过大宛、康居、大月氏、大夏四个国家，这是史书明确写的。', '大月氏「志安乐」，「殊无报胡之心」；张骞「不能得月氏要领」，没有办成联合月氏的事。', '大月氏的新王是太子还是王后，《史记》和《汉书》说法不同。', '注意：大宛王只有「若欲何之？」一句是史书原话；马夫、酿酒人、找苜蓿是游戏想象的。'],
  },
  3: {
    game: ['你们沿着南山回家，甘父射猎，让大家填饱了肚子。', '在羌中，你们又被匈奴抓住了。', '一年多后，单于死了，匈奴大乱。你带着妻子和甘父逃了出来。'],
    history: ['张骞「并南山，欲从羌中归，复为匈奴所得」，又被扣留一年多。', '约公元前126年，军臣单于死，他的弟弟左谷蠡王伊稚斜攻打太子、自立为单于。张骞趁乱和胡妻、堂邑父逃回汉朝。', '史书没有写张骞的孩子后来怎样，所以游戏里不再出现孩子。', '打猎和逃走那一夜的经过，是游戏想象的。'],
  },
  4: {
    game: ['你回到长安，见到了汉武帝。一百多人出发，只回来了两个人。', '后来，汉朝的使者一批接一批往西走，把西域的东西带回了中原。'],
    history: ['张骞把亲自到过的四国，和听说的五六个大国，都报告给了汉武帝。', '司马迁说张骞「凿空」：他是第一个打通去西域道路的人。之后「使者相望于道」，路上的使者一个接一个。', '葡萄、苜蓿是后来的汉使带回的；汗血马是公元前101年李广利打大宛才得到的。都不是张骞亲手带回。', '「丝绸之路」是近代德国学者起的名字。游戏里长安小角色的对话是想象的。'],
  },
};

// ===== 世界地图 =====
const WORLD_DEF = {
  name: '西域之路', start: 'A', seed: 138,
  // 西 ← → 东。K 康居  Y 大宛  M 大月氏  B 大夏  X 匈奴营地  L 陇西  A 长安  H 打猎营地  C 羌中
  // 关卡：2 大宛西边的山路  7 匈奴哨卡  3 汉朝边塞  6 南山雪岭
  coarse: [
    '^^^^^^^^^^^^^^^^^^^^^',
    '^.K.^.h^ddd^.h...^^^^',
    '^...2.Y.ddd7..X.h^.T^',
    '^.M.^..^ddd^h...T3L.^',
    '^~~.^.h^ddd^..h..^..^',
    '^.B.^^^^^^^^^^^^^^h.^',
    '^^6^^^^^^^^^^^^^^^TA^',
    '^*******H******C^^^^^',
    '^^^^^^^^^^^^^^^^^^^^^',
  ],
  zones: [
    { z: 'han', x0: 18, y0: 1, x1: 19, y1: 6 },
    { z: 'steppe', x0: 12, y0: 1, x1: 16, y1: 4 },
    { z: 'desert', x0: 8, y0: 1, x1: 10, y1: 4 },
    { z: 'ferghana', x0: 5, y0: 1, x1: 6, y1: 4 },
    { z: 'xiyu', x0: 1, y0: 1, x1: 3, y1: 5 },
    { z: 'nanshan', x0: 1, y0: 6, x1: 15, y1: 8 },
  ],
  zoneInfo: {
    han: { ground: '.', mtn: '^' }, steppe: { ground: '.', mtn: '^' }, desert: { ground: 'd', mtn: 'R' },
    ferghana: { ground: '.', mtn: '^' }, xiyu: { ground: '.', mtn: '^' }, nanshan: { ground: '*', mtn: 'S' },
  },
};
const LOCS = {
  A: { id: 'changan', kind: 'town', icon: 'bigcity', art: 'capital', name: '长安城' },
  L: { id: 'longxi', kind: 'town', icon: 'fort', art: 'frontier', name: '陇西' },
  X: { id: 'xiongnu', kind: 'town', icon: 'yurts', art: 'camp', name: '匈奴营地',
    need: () => !F().escaped || (F().captured2 && !F().escaped2),
    get needMsg() { return F().escaped2 ? '（不能回去了。往东走，回汉朝！）' : '（不能回去了。往西走，去找月氏！）'; } },
  Y: { id: 'dayuan', kind: 'town', icon: 'city', art: 'oasis', name: '大宛' },
  K: { id: 'kangju', kind: 'event', icon: 'yurts', art: 'wagoncamp', name: '康居', ev: 'kangju' },
  M: { id: 'yuezhi', kind: 'event', icon: 'yurts', art: 'rivercourt', name: '大月氏', ev: 'yuezhi', need: () => F().kangju, needMsg: '（不认得路。先跟着向导，去北边的康居吧。）' },
  B: { id: 'daxia', kind: 'town', icon: 'city', art: 'bazaarcity', name: '大夏', need: () => F().yuezhi, needMsg: '（先去大月氏的王庭，把汉朝的话带到吧。）' },
  H: { id: 'hunt', kind: 'event', icon: 'peak', art: 'campfire', name: '雪山脚下', ev: 'hunt' },
  C: { id: 'qiang', kind: 'event', icon: 'peak', art: 'hillcamp', name: '羌中', ev: 'qiang', need: () => F().hunt, needMsg: '（大家又冷又饿，走不动了。先在雪山脚下歇一歇，想办法弄点吃的吧。）' },
};
// 野外的文物：at 写 'world:区域' / 'town:城镇' / 'dun:场景:层'
const RELICS = [
  { at: 'town:changan', card: 'wadang', say: '地上有一块圆圆的旧瓦，上面刻着四个字：「长乐未央」。' },
  { at: 'world:han', card: 'banliang', say: '草丛里有一枚铜钱，圆形方孔，上面写着「半两」。' },
  { at: 'world:steppe', card: 'mingdi', say: '草地上插着一支奇怪的箭，箭头上有几个小孔。拔出来一吹——呜呜作响！' },
];
// 关卡在世界地图上的样子：3 是汉朝边塞的关城，7 是匈奴的哨卡（2 和 6 用地形本身：山石、冰雪）
const GATE_ART = { '3': 'hanpass', '7': 'xnpost' };
const GATE_MSG = {
  '3': async () => {
    if (F().ch >= 1) return '往东是回汉朝的路，可匈奴的哨骑把守得严严实实。';
    const c = await ask('甘父', '张大人，出了这道关，就是匈奴人的地方了。要出塞吗？', ['出塞！', '再准备一下']);
    if (c === 0) await STORY.chuSai();
  },
  '7': () => F().captured2 ? '哨卡又加了岗。这一次，往西是走不通了。' : '匈奴的哨卡。几个骑兵正在巡逻，眼睛一直盯着你们。（现在还逃不掉。）',
  '2': () => '西边的山路又陡又险，没有向导会迷路。（先去大宛城里拜见国王吧。）',
  '6': () => '南边是连绵的雪山，大雪封住了山路。',
};
const DUNGEONS = {};

// ===== 城镇 =====
const TOWNS = {
  changan: {
    name: '长安城', size: 'big', theme: 'city', roof: '#3a3a4a',
    onEnter: () => STORY.changanBack(),
    b: [
      { slot: 0, type: 'special', art: 'house', washing: true, label: '张家', ev: 'zhangHome' },
      { slot: 1, type: 'special', art: 'palace', label: '未央宫', ev: 'weiyang' },
      { slot: 2, type: 'house', art: 'market', label: '东市', who: '丝绸商人', say: ['上好的蜀锦、齐纨！……唉，可惜北边的匈奴年年来抢，商路都不太平。'], roof: '#5a3a6a' },
      { slot: 5, type: 'house', art: 'bookshop', label: '书肆', who: '老先生', card: 'heqin', cardIf: () => F().ch < 4, roof: '#2a5a3a',
        say: () => F().ch >= 4 ? ['张大人！你真的从西域回来了！', '大宛、康居、大月氏、大夏……老夫活了一辈子，连这些名字都没听过。', '快坐下，给老夫讲讲！老夫要一个字一个字记下来。'] : ['高祖皇帝当年被匈奴围在白登山，七天七夜，差点回不来。', '从那以后，汉朝只好和匈奴「和亲」——嫁公主，送丝绸，送粮食……', '可匈奴拿了东西，转头又来抢。皇上年轻气盛，怕是忍不了多久了。'] },
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
      { sp: 'oldwoman', name: '老妇人', x: 16, y: 13, say: () => F().ch >= 4 ? ['张大人，你走的那年，我儿子还在陇西守烽火台。', '十三年了……你的头发也白了。'] : ['我儿子在陇西当兵，守烽火台。好几年没回来了……'] },
      { sp: 'child', name: '小孩', x: 10, y: 18, say: () => F().ch >= 4 ? ['你就是从西边回来的张大人？', '西边真的有流「血汗」的马吗？真的有放几十年的葡萄酒吗？'] : F().appointed ? ['你要去很远很远的西边吗？那边有没有会飞的马？'] : ['我长大了也要当大将军，打匈奴！'] },
      { sp: 'merchant', name: '卖饼的', x: 23, y: 18, say: ['胡饼！刚出炉的胡饼！……这名字？我也不知道，大家都这么叫。'] },
      { sp: 'scholar', name: '郎官同僚', x: 5, y: 6, card: 'changan', cardIf: () => F().appointed, say: () => F().ch >= 4 ? ['张兄！你真的活着回来了！', '十三年……当年和你一起出发的一百多人呢？……唉，不说了，回来就好。'] : F().appointed ? ['张兄真的要去月氏？……一路保重，一定要活着回来！', '等你回来，咱们再一起站在未央宫的台阶上，看整座长安城。'] : ['（操作：方向键移动，Z 键对话和调查，X 键打开菜单，撞到门就能进屋。）', '张兄，听说皇上要找人去出使西边的月氏，满朝文武没人敢应。'] },
    ],
  },
  longxi: {
    name: '陇西', size: 'small', theme: 'desert', roof: '#6a4a2a', yOffset: 1,
    onEnter: async () => {
      if (F().escaped2 && !F().longxiBack) { F().longxiBack = 1; await narr(['陇西！是汉朝的土地！', '守城的士兵盯着你们看了半天——你们穿着匈奴人的皮袍，他们根本认不出来。']); await say('张骞', '我是十三年前出使月氏的张骞，回来了！'); return; }
      if (F().longxiSeen) return; F().longxiSeen = 1; await narr(['陇西。汉朝西北边境的最后一座城。', '城外西边就是边塞。再往西走，就进入匈奴的地盘了。']);
    },
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
      { sp: 'xnguard', name: '匈奴看守', x: 10, y: 14, still: true, say: () => F().captured2 ? ['又是你！上次让你跑了，这回看你往哪儿跑。'] : F().tenYears ? ['又去溜达？去吧去吧。都十年了，你还能跑到哪儿去？'] : ['单于说了，你们哪儿也不许去！营地附近随便走走可以。'] },
      { sp: 'xnman', name: '牧民', x: 4, y: 6, card: 'youmu', say: ['再过些日子，这片草就吃光了。到时候整个营地都要搬走。', '哪里有水、有草，我们就去哪里。草原就是我们的家。'] },
      { sp: 'xnchild', name: '匈奴小孩', x: 15, y: 6, say: () => G.quests.lamb && G.quests.lamb.st === 'done' ? ['看！我骑着小羊射中了一只老鼠！', '你也学会说我们的话啦！'] : ['你说话怎么怪怪的？'] },
      { sp: 'huqi', name: '胡妻', x: 9, y: 12, cond: () => F().tenYears && !F().escaped2, say: () => F().captured2 ? ['单于病得很重。营地里的人都在偷偷说，要出大事了。', '等乱起来的时候，就是我们走的时候。'] : F().escapeTalk ? ['……我知道你的心一直在西边。那根竹杖，你天天擦，十年都没放下过。'] : ['孩子又长高了。他说话一半像你，一半像我。'] },
      { sp: 'son', name: '儿子', x: 11, y: 12, cond: () => F().tenYears && !F().escaped, say: ['阿爸，汉朝是什么样子的？那里也有这么大的草原吗？'] },
    ],
  },
  dayuan: {
    name: '大宛', size: 'small', theme: 'village', roof: '#8a6a40',
    onEnter: () => STORY.dayuanEnter(),
    b: [
      { slot: 0, type: 'special', art: 'mudpalace', label: '王宫', ev: 'dyPalace' },
      { slot: 1, type: 'house', art: 'winery', label: '葡萄酒坊', who: '酿酒人', card: 'putaojiu', say: ['来，尝尝我们大宛的葡萄酒！', '城里的富人家，地窖里藏着一万多石酒，放几十年都不坏。', '对了，城外的马吃的那种开紫花的草，叫苜蓿。马最爱吃了。'] },
      { slot: 2, type: 'house', art: 'horsefarm', label: '马场', who: '养马人', say: ['看这些马！个子高，跑得快，大宛的马是天下最好的。', '有的马跑起来，脖子上流的汗是红的，像血一样。'] },
      { slot: 4, type: 'house', art: 'flathouse', label: '民居', who: '农夫', say: ['我们大宛人不像匈奴那样赶着牛羊到处走。', '我们住在有城墙的城里，种稻子、种麦子。大大小小的城，有七十多座呢。'] },
    ],
    decor: ['garden', 'field', 'trees'],
    npcs: [
      { sp: 'dyman', name: '马夫', x: 15, y: 6, say: ['大宛的马，是「天马」的后代！'] },
      { sp: 'dychild', name: '大宛小孩', x: 4, y: 6, say: () => F().gate2 ? ['你们要去月氏？那可远啦，要走好多好多天！'] : ['你们从哪里来？你们的衣服好奇怪！'] },
      { sp: 'dywoman', name: '大宛妇人', x: 9, y: 12, say: ['东边的汉朝？我只听商人说过，那里有一种又软又亮的布……'] },
    ],
  },
  daxia: {
    name: '大夏', size: 'small', theme: 'desert', roof: '#8a6a40',
    onEnter: () => STORY.daxiaEnter(),
    b: [
      { slot: 0, type: 'special', art: 'courtyard_inn', label: '客舍', ev: 'dxInn' },
      { slot: 1, type: 'house', art: 'bazaar', label: '蓝市', who: '市场管事', card: 'lanshi', say: ['欢迎来到蓝市城的大市场！这里什么都有卖。', '我们大夏人最会做生意。打仗？哎呀，那可不行，我们的兵很弱，最怕打仗了。'] },
      { slot: 2, type: 'house', art: 'flathouse', label: '民居', who: '大夏老人', say: ['月氏人来了以后，我们就归顺了他们。', '只要能安安稳稳做生意，谁当头儿都一样。'] },
    ],
    decor: ['plaza', 'trees', 'garden'],
    npcs: [
      { sp: 'dxman', name: '大夏商人', x: 4, y: 6, card: 'qiongzhu', learn: 'shendu', say: ['客人，看看这根竹杖，节又高又直！还有这匹布，结实得很。', '从哪儿来的？是商人从东南边的身毒买来的。'] },
      { sp: 'merchant', name: '钱币商', x: 15, y: 6, card: 'yinbi', say: ['你见过安息国的银币吗？上面印着国王的脸！', '国王死了，就换一种新钱。可惜我手里这枚，你看不出是哪个国王了。'] },
      { sp: 'dychild', name: '大夏小孩', x: 9, y: 12, say: ['我爹说，你们是从太阳升起的地方来的？'] },
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
  musu: { name: '马爱吃的草', town: 'dayuan', npc: '马夫', ch: 2, type: 'find', find: 'world:ferghana', item: 'q_musu', icon: 'musu',
    desc: '在大宛城外的草地上，给马夫找一捆苜蓿回来。',
    ask: ['唉，马圈里的苜蓿吃完了，马饿得直叫。', '城外的草地上长着苜蓿，开紫色的小花。你们能帮我割一捆回来吗？'],
    wait: '苜蓿就长在城外的草地上，开着紫色的小花。',
    done: ['就是它！你们看，马闻到味道就跑过来了！', '告诉你们一个秘密：我们大宛的马，有的流的汗是红的……'],
    after: '吃饱了苜蓿，马跑得更快了！',
    reward: { cards: ['hanxue'] } },
};

// ===== 重生（大纲见 docs/zhangqian/outline.md「重生线大纲」；史实依据见 facts.md「重生线专项」）=====
// 随从人数、口粮数值是游戏设定，史书没写
const REBIRTH = {
  res: [
    { id: 'men', name: '随从', start: 10 },
    { id: 'jie', name: '汉节', bool: true, get: () => hasItem('jie') ? 1 : 0 },
    { id: 'promise', name: '许诺', start: 3 },
    { id: 'food', name: '口粮', start: 6 },
    { id: 'know', name: '消息', get: () => Object.keys(G.know).length },
  ],
  know: {
    hate: '月氏被匈奴打败，恨匈奴（出发前就知道）',
    north: '单于说：月氏在匈奴的北边',
    loose: '这些年，看守越来越松了',
    rich: '大宛早就听说汉朝很富有',
    moved: '大月氏已经搬到很远的西边，住在妫水旁',
    anle: '月氏这里土地肥、强盗少，日子过得安乐',
    far: '月氏人觉得汉朝离他们太远',
    shendu: '大夏东南几千里，有个身毒国，那里卖蜀地的货物',
    more: '西域还有五六个大国（是听人说的）',
    roads: '大宛、康居、大月氏、大夏之间怎么走',
  },
  reflect: { q: '这一次，哪个条件是你最选不了的？', opts: ['匈奴挡在去西域的路上', '月氏已经过上了安乐的日子', '单于什么时候死、匈奴什么时候乱'] },
  async intro() {
    G.party = ['zhang', 'gan']; addItem('jie');
    Object.assign(F(), { ch: 1, appointed: 1, ganJoined: 1 });
    G.know.hate = 1;
    Snd.play('sad');
    await card(['重生', '', '再走一次出使的路'], { big: true });
    await card(['你和甘父刚被匈奴扣下，', '押到了单于的营地。', '一百多人的使团，现在剩下十个随从。'], { lh: 46 });
    await card(['这一次，每一步都由你来决定。', '走之前，先看看手里还有什么，', '还知道些什么。'], { lh: 46 });
    const p = doorPos('xiongnu', 0);
    Fade.a = 1;
    Scene = MapScene; MapScene.enter('town:xiongnu', p.x, p.y, 'down');
    await fadeIn(600);
    Snd.play(MapScene.musicFor());
    await narr(['（右上角是你手里的东西：随从、汉节、许诺、口粮、消息。）', '（「消息」要靠自己打听。没打听到的事，有些选项就选不了。）']);
    await say('甘父', ['张大人，先在营地里四处看看、问问吧。', '想好了，就回「你的毡帐」，决定什么时候走。']);
    autosave();
  },
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
    if (F().ch >= 4) { if (F().metEmperor) await narr('（皇上还在翻看你画的西域地图，看得入了迷。）'); else await STORY.fuming(); return; }
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
    if (isRebirth() && !F().tenYears && !knows('north')) {
      await say('单于', ['汉朝的使者，还想着去月氏？', '月氏在我们北边！汉朝的人，怎么能从我的地盘上过去？']);
      await learn('north'); return;
    }
    if (F().captured2) { await narr('（大帐外站满了卫兵。听说单于病得很重，谁也不许进去。）'); return; }
    if (F().tenYears) { await narr('（单于大帐里正在喝酒唱歌，没人理会你。）'); return; }
    await say('单于', ['又是你。还想着去月氏？', '留在草原吧。这里有吃不完的羊肉，喝不完的马奶。']);
  },
  async home() {
    if (isRebirth()) return STORY.rbHome();
    if (!F().tenYears) {
      const seen = ['qionglu', 'youmu', 'food'].filter(hasCard).length;
      if (seen < 2) { await narr(['你在毡帐里坐了一会儿，心里想着月氏。', '（先出去走走，看看匈奴人是怎么生活的吧。）']); return; }
      await STORY.tenYears();
      return;
    }
    if (!F().escaped) { await STORY.escapeNight(); return; }
    if (F().captured2 && !F().escaped2) { await STORY.chaos(); return; }
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
    if (isRebirth()) { await learn('loose'); await getCard('songxia'); await getCard('liangben'); }
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
  // ===== 第二章 大宛与月氏 =====
  async dayuanEnter() {
    if (F().dySeen) return;
    F().dySeen = 1;
    await narr(['你们向西走了几十天。', '翻过沙丘，前方出现了一片绿油油的田野，还有一座有城墙的城——', '大宛到了！']);
    await recap(1);
    await chapter(2);
    await narr(['大宛人不放牧。他们住在有城墙的城里，种稻子和麦子。', '几个大宛士兵围了过来。一听说你们是汉朝的使者，连忙跑去报告国王。']);
    await narr('（去王宫拜见大宛王吧。）');
  },
  async dyPalace() {
    if (F().gate2) { await say('大宛王', ['一路平安！到了月氏，别忘了替我问好。', '还有——别忘了你的承诺！']); return; }
    Snd.play('sad');
    await narr('大宛王宫。国王一看见你们手里的汉节，眼睛都亮了。');
    await say('大宛王', ['汉朝来的使者？我早就听说，汉朝是个很富有的大国！', '我一直想和汉朝来往，可是找不到路……', '你要去哪儿？']);
    await narr('（史书里，大宛王只留下了这一句话：「若欲何之？」——你要到哪里去？）');
    await getCard('dywang');
    await say('张骞', ['我替汉朝出使月氏，路被匈奴挡住，被关了十多年，好不容易才逃出来。', '请大王派人送我去月氏。等我回到汉朝，汉朝送给大王的财物，多得说不完！']);
    if (isRebirth()) { await learn('rich'); await addRes('promise', -1, '许诺回汉朝后重谢大宛王'); }
    await say('大宛王', ['好！我派最好的向导和翻译，送你们去！']);
    await getCard('chengnuo');
    if (isRebirth()) await addRes('food', 2, '大宛王送了干粮');
    F().gate2 = 1;
    Snd.play(MapScene.musicFor());
    await narr('（有向导带路了。出城往西翻过山路，先去北边的康居。）');
    autosave();
  },
  async kangju() {
    if (F().kangju) { await narr('康居的营帐。牛羊在草地上吃草，大家已经把你们送上路了。'); return; }
    await narr(['康居的营帐散在草原上。康居人和匈奴人一样，赶着牛羊四处搬家。', '大宛的向导走上前，用当地话说明了来意。']);
    await say('康居人', ['汉朝的使者？大宛送来的客人，就是我们的客人。', '月氏的王庭在南边的大河旁。我们派人接着送你们去！']);
    await getCard('chuansong');
    await learn('moved');
    F().kangju = 1;
    await narr('（往南走，大月氏的王庭就在妫水北边。）');
    autosave();
  },
  async yuezhi() {
    if (F().yuezhi) { await narr('月氏人在河边放马、唱歌。他们的日子过得很安乐。'); return; }
    Snd.play('sad');
    await narr(['妫水——就是今天的阿姆河。河的北边，是大月氏的王庭。', '你们终于见到了月氏人。为了这一天，你们走了十多年。']);
    await say('月氏大臣', ['老王被匈奴杀了以后，我们立了新王，一路搬到了这里。']);
    await narr('（新王是谁？《史记》说是太子，《汉书》说是王后。两本书说得不一样。）');
    await getCard('xinwang');
    await say('张骞', ['汉朝愿意和大月氏一起，夹击匈奴，为老王报仇！']);
    await say('月氏大臣', ['……这里的土地肥，又没有敌人，大家过得很安乐。', '汉朝离这里太远了。报仇的事，还是算了吧。']);
    await getCard('anle');
    await learn('anle'); await learn('far');
    await say('张骞', '……我不死心。我再想想办法！');
    F().yuezhi = 1;
    Snd.play(MapScene.musicFor());
    await narr('（月氏让南边的大夏归顺了自己。过了妫水的渡口往南，去大夏再试一试。）');
    autosave();
  },
  async daxiaEnter() {
    if (F().dxSeen) return;
    F().dxSeen = 1;
    await narr(['大夏人住在城里，城中间是热闹的大市场。', '叫卖声、讨价还价声，从早到晚都没停过。']);
    await narr('（逛逛市场吧。累了就去「客舍」歇脚。）');
  },
  async dxInn() {
    if (F().ch >= 3) { await rest({ keeper: '客舍老板', ask: '客人，要歇一歇吗？' }); return; }
    if (!['lanshi', 'qiongzhu', 'yinbi'].some(hasCard)) { await narr('（先去市场转转，看看大夏人都卖些什么吧。）'); return; }
    if (isRebirth()) return STORY.rbDaxia();
    const c = await ask('甘父', '张大人，我们在大夏已经住了一年多了，月氏还是不肯答应……回汉朝吧？', ['回汉朝', '再住一阵']);
    if (c !== 0) { await say('甘父', '好，再等等看。'); return; }
    await fadeOut(600);
    await card(['一年多过去了。'], { auto: 2400 });
    await fadeIn(600);
    await say('张骞', ['我没能说服月氏……', '可是，西域的路、西域的国家，我都记在心里了。这些都要告诉皇上！']);
    await getCard('yaoling');
    await recap(2);
    await chapter(3);
    await say('甘父', ['这次别走匈奴的草原了。', '我们沿着南边的大山走，从羌人住的地方绕回汉朝！']);
    F().gate6 = 1;
    await getCard('nanshan');
    await narr('（出了城往南，雪山的路打开了。）');
    autosave();
  },
  // ===== 第三章 归途 =====
  async hunt() {
    if (F().hunt) { await narr('火堆还在冒着烟。吃饱了，继续往东走吧。'); return; }
    await narr(['雪山脚下又冷又饿，干粮早就吃光了。', '大家缩在火堆边，谁也不说话。']);
    await say('甘父', '张大人，等着！');
    Snd.sfx('wind');
    await narr('（甘父拉开弓——嗖！远处的一只野羊应声倒下。）');
    await say('张骞', ['好箭法！今晚有烤肉吃了！', '甘父，这一路要是没有你，我们早就饿死了。']);
    await getCard('sheshou');
    if (isRebirth()) await addRes('food', 3, '甘父射到了野羊');
    F().hunt = 1;
    await narr('（继续往东走，前面就是羌人住的地方。）');
    autosave();
  },
  async qiang() {
    if (F().captured2) return;
    await narr(['羌中的山谷里，牧人的营帐星星点点。', '再往东走，就是汉朝了——']);
    Snd.sfx('encounter'); Shake.start(8, 700);
    await narr(['马蹄声！是匈奴的骑兵！', '你们又被抓住了。']);
    await STORY.recapture(3);
  },
  async recapture(loss) {
    F().captured2 = 1; F().gate7 = 0;
    if (isRebirth()) await addRes('men', -loss, '被抓时走散了');
    await fadeOut(600);
    await card(['你们又被押回了匈奴的营地。'], { auto: 2600 });
    const p = doorPos('xiongnu', 0);
    Fade.a = 1;
    Scene = MapScene; MapScene.enter('town:xiongnu', p.x, p.y, 'up');
    await fadeIn(600);
    Snd.play('sad');
    if (G.party.includes('huqi')) await say('胡妻', ['又回到这里了……', '别怕。我们一起等机会。']);
    else { await say('胡妻', ['……你回来了。', '我就知道，我们还会再见的。']); await say('张骞', '这一次，我们一起走。'); }
    Snd.play(MapScene.musicFor());
    await narr('（回「你的毡帐」歇着，等待机会。）');
    autosave();
  },
  async chaos() {
    await narr('你躺在毡帐里，等啊等……');
    await fadeOut(900);
    Snd.play('sad');
    await card(['又过了一年多……'], { auto: 2400 });
    await card(['一天，单于死了。'], { auto: 2400 });
    await card(['单于的弟弟左谷蠡王，带兵攻打太子，', '要自己当单于。'], { lh: 46 });
    Snd.sfx('encounter'); Shake.start(10, 900);
    await card(['整个营地乱成了一团！'], { big: true });
    await getCard('luan');
    await fadeIn(600);
    await say('甘父', '张大人，就是现在！');
    F().escaped2 = 1; F().gate3 = 1;
    if (!G.party.includes('huqi')) { await say('胡妻', '我跟你们走！'); await joinParty('huqi'); }
    if (isRebirth()) await addRes('men', -2, '乱中走散了');
    await fadeOut(600);
    await card(['你们骑上马，趁乱冲出了营地……'], { auto: 2600 });
    await toWorldAt('X');
    await say('张骞', ['往东！回汉朝！']);
    await narr('（汉朝边塞的关城，就在东边。）');
    autosave();
  },
  // ===== 重生：三个决策点和四个结局 =====
  async rbHome() {
    if (!F().d1) {
      const c = await decide('d1', '甘父', '张大人，我们被关在这里了。什么时候走？', [
        { label: '现在就走', why: [{ t: '越早走，越早到月氏' }, { t: '皇上在等消息，不能拖', card: 'zhaomu' }] },
        { label: '等看守松了再走', why: [{ t: '现在看守太紧，跑不掉', card: 'chanyu' }, { t: '先学会匈奴话，认得草原的路' }] },
        { label: '不走了，留在草原', why: [{ t: '路太远，太危险了' }, { t: '在草原上也能活下去', card: 'food' }] },
      ]);
      F().d1 = c + 1;
      if (c === 2) return STORY.rbEndC('grass');
      if (c === 0) {
        await fadeOut(500); Snd.sfx('encounter'); Shake.start(8, 700);
        await card(['那一夜，你们偷偷牵出了马……', '可是没跑出多远，匈奴的骑兵就追上来了。'], { lh: 46 });
        await fadeIn(500);
        await addRes('men', -3, '被追回时走散了');
        await narr('（这一段是推演：史书没写张骞早早逃跑过。）');
        await say('甘父', '看守更紧了……只好再等等。');
      }
      await STORY.tenYears();
      return;
    }
    if (F().captured2 && !F().escaped2) return STORY.chaos();
    if (F().escaped) return;
    const c = await decide('family', '胡妻', '（今晚就走。妻子和孩子怎么办？）', [
      { label: '带上妻儿一起走', why: [{ t: '一家人不能分开' }, { t: '她会说匈奴话，路上用得着', card: 'wife' }] },
      { label: '自己先走，以后再说', why: [{ t: '带着孩子走不快，会被追上' }, { t: '草原是她的家，她在这里更安全' }] },
    ]);
    await narr('（史书没写张骞第一次逃走时，妻儿有没有一起走。）');
    await fadeOut(800);
    Snd.play('dungeon');
    await card(['那一夜，没有月亮。'], { auto: 2400 });
    await card(['你握紧汉节，和甘父、随从们一起，', '悄悄牵出了马……'], { lh: 46 });
    F().escaped = 1; F().gate7 = 1;
    await getCard('escape');
    await toWorldAt('X');
    if (c === 0) { await joinParty('huqi'); await addRes('food', -1, '多带了家人，口粮吃得快'); }
    await addRes('food', -2, '往西走了几十天');
    await say('甘父', ['往西！一直往西！', '穿过那道哨卡，就是去大宛的路了！']);
    autosave();
  },
  async rbDaxia() {
    if (F().d3) return;
    await fadeOut(600);
    await card(['你们在大夏住了一年多。', '这一天，你决定最后一次去见月氏的大臣。'], { lh: 46 });
    await fadeIn(600);
    const c2 = await decide('d2', '张骞', '（最后一次劝月氏。怎么劝？）', [
      { label: '讲报仇：一起打匈奴，为老王报仇', why: [{ t: '月氏恨匈奴，出发前就知道', card: 'yuezhi' }] },
      { label: '许诺重礼：汉朝会送很多财物', cost: { promise: 2 }, why: [{ t: '大宛就是因为许诺才帮我们的', card: 'chengnuo' }, { t: '谁都喜欢好东西' }] },
      { label: '请月氏派人跟我回汉朝看看', need: 'far', why: [{ t: '他们觉得汉朝太远，那就亲眼来看看' }, { t: '光靠嘴说，别人不会信' }] },
      { label: '不劝了，把西域的路和国家都记下来', why: [{ t: '月氏过得安乐，劝不动了', card: 'anle' }, { t: '这些消息，皇上一定用得着' }] },
    ]);
    F().d2 = c2 + 1;
    if (c2 === 0) await say('月氏大臣', ['老王的仇，我们记着。', '可这里土地肥，又没有敌人。汉朝那么远，打起仗来谁帮我们？']);
    if (c2 === 1) {
      await say('月氏大臣', ['汉朝的财物？听起来很好。', '可汉朝在哪儿，我们都没见过。为了几句许诺去打匈奴？不行。']);
      await getCard('liangci');
      await narr('（很多年后，张骞带着大批财物去劝乌孙，也没能说动。）');
      await getCard('wusun');
    }
    if (c2 === 2) {
      await say('月氏大臣', ['……去汉朝看看？', '好吧。我们派两个人跟你走。要是汉朝真像你说的那么大，我们再商量。']);
      F().envoys = 1;
      await narr('（这一段是推演：历史上月氏没有派人跟张骞走。依据是后来乌孙的使者到汉朝看过以后，乌孙开始看重汉朝。）');
      await getCard('kanyikan');
    }
    if (c2 === 3) {
      await say('张骞', ['劝不动，就不劝了。', '西域的路、西域的国家，我要一样一样记下来！']);
      await learn('more'); await learn('roads');
    }
    await getCard('yaoling');
    const c3 = await decide('d3', '甘父', '张大人，该回汉朝了。走哪条路？', [
      { label: '沿南边的大山，从羌人住的地方走', cost: { food: 2 }, why: [{ t: '躲开匈奴的草原' }, { t: '甘父会打猎，路上饿不着', card: 'ganfu' }] },
      { label: '往北，直接穿过匈奴的草原', cost: { food: 1 }, why: [{ t: '这条路最近' }, { t: '我们会说匈奴话，能混过去' }] },
      { label: '往东南，绕道身毒回蜀地', cost: { food: 3 }, need: 'shendu', why: [{ t: '身毒卖蜀地的货，离蜀应该不远', card: 'qiongzhu' }, { t: '那边没有匈奴' }] },
      { label: '不回去了，留在大夏', why: [{ t: '大夏安稳，又热闹', card: 'lanshi' }, { t: '回去的路太危险' }] },
    ]);
    F().d3 = c3 + 1;
    if (c3 === 3) return STORY.rbEndC('daxia');
    if (c3 === 2) return STORY.rbEndD();
    await chapter(3);
    if (c3 === 0) {
      await say('甘父', ['这次别走匈奴的草原了。', '我们沿着南边的大山走，从羌人住的地方绕回汉朝！']);
      F().gate6 = 1;
      await getCard('nanshan'); await getCard('huijia');
      await narr('（出了城往南，雪山的路打开了。）');
      autosave(); return;
    }
    await say('甘父', '往北！穿过草原，最快就能到家！');
    await fadeOut(500);
    await card(['你们往北走了没几天……'], { auto: 2400 });
    await fadeIn(300);
    Snd.sfx('encounter'); Shake.start(8, 700);
    await narr(['马蹄声！草原上到处是匈奴的骑兵。', '你们又被抓住了。']);
    await narr('（张骞回国后对汉武帝说过：往北走，会被匈奴抓住。可那是他回来以后才说的。）');
    await getCard('huijia');
    await STORY.recapture(5);
  },
  async rbHome2() {
    F().homeBack = 1;
    const men = res('men'), used = 3 - res('promise'), wife = G.party.includes('huqi');
    const who = `张骞、甘父${wife ? '、胡妻' : ''}${men > 0 ? `，还有 ${men} 个随从` : ''}`;
    const north = F().d3 === 2;
    await narr(['长安！你们回来了。', `一起回来的有：${who}。`]);
    await getCard('hexi');
    if (F().envoys) {
      await narr(['两个月氏使者睁大了眼睛：', '这么大的城，这么多的人……汉朝原来这么大！']);
      await getCard('jiemeng');
      return endRebirth({
        title: '带回月氏使者', type: '合理推演',
        lines: [`一起回来的有：${who}，还有两个月氏使者。`, '月氏使者亲眼看到了汉朝有多大。', `一路上你用汉朝的名义许诺了 ${used} 次，回到汉朝，这些许诺才有机会兑现。`, '可是，月氏离汉朝太远了。看重汉朝，不等于马上就会出兵打匈奴。'],
        compare: ['正史里，月氏没有派人跟张骞回来。这个结局是推演的。', '推演的依据：后来乌孙的使者到汉朝看过以后，乌孙开始看重汉朝（史实）。', '可乌孙从看重汉朝，到真的和汉朝一起打匈奴，用了大约五十年，还经过了两代和亲。结盟不会一下子成功。', north ? '你选了北道。「往北会被匈奴抓住」是张骞回来以后才说的，出发时谁也不知道。' : '回家的路上又被匈奴抓住，和正史一样。', '随从人数、口粮是游戏设定，史书没写。'],
      });
    }
    return endRebirth({
      title: '十三年，两人还', type: '史实',
      lines: [`一起回来的有：${who}。`, `一路上你用汉朝的名义许诺了 ${used} 次，回到汉朝，这些许诺才有机会兑现。`, `你带回了 ${res('know')} 条西域的消息。`, '没能说服月氏。可西域的路，从此有人走过了。'],
      compare: ['和正史一样：张骞没能说服月氏，又被匈奴抓了一次，最后趁乱逃回长安。', '正史里，一百多人出发，十三年后只回来张骞和堂邑父两个人。', men > 0 ? `你这一局多回来了 ${men} 个随从。随从人数是游戏设定，史书没写路上怎么减员。` : '你的随从也全走散了，和正史一样。', north ? '你选了北道。「往北会被匈奴抓住」是张骞回来以后才说的，出发时谁也不知道。' : '张骞为什么选南山这条路，史书没写。', '就算回来了，河西还在匈奴手里。五年后浑邪王投降，河西才归了汉朝。'],
    });
  },
  async rbEndC(where) {
    const grass = where === 'grass';
    await fadeOut(800);
    await card(grass ? ['你留在了草原上。', '放羊、骑马，日子一年一年过去。', '那根汉节，挂在毡帐的角落里。'] : ['你留在了大夏。', '市场热热闹闹，日子安安稳稳。', '可汉朝，再也没有你的消息。'], { lh: 46 });
    return endRebirth({
      title: grass ? '留在了草原' : '留在了大夏', type: '历史上没有发生',
      lines: [grass ? '你没有去找月氏，一直留在匈奴的草原上。' : '你见过了月氏和大夏，却没有回汉朝。', `用汉朝的名义许下的 ${3 - res('promise')} 次许诺，全部落空了。`, '汉朝少了第一个亲眼见过西域的人。'],
      compare: ['正史里，张骞两次从匈奴逃走，最后回到了汉朝。', '如果张骞没回来，会怎样？史家没有推演过，游戏也只说到这里，不替历史补答案。', '我们知道的是：《汉书》说「张骞始开西域之迹」——是张骞第一个打开了去西域的路。'],
    });
  },
  async rbEndD() {
    await fadeOut(800);
    await card(['你们往东南走，想经过身毒绕回蜀地。', '山越来越高，路越来越窄。'], { lh: 46 });
    await card(['在西南的大山里，', '当地的部族挡住了去路，不让外人通过。', '你们只好停在半路。'], { lh: 46 });
    await getCard('shendu'); await getCard('xinan');
    return endRebirth({
      title: '西南的路没走通', type: '历史上没有发生',
      lines: ['你从大夏人那里知道了身毒，想走一条没有匈奴的路。', '可是你们被挡在西南的大山里，回不了汉朝。', `用汉朝的名义许下的 ${3 - res('promise')} 次许诺，没能兑现。`],
      compare: ['正史里，张骞没有走这条路。', '推演的依据：张骞回国后，汉武帝派人从蜀地分四路去找身毒，都被昆明等部族挡住，「终莫得通」（史实）。', '你在大夏听到的身毒消息是真的。可是知道有一条路，不等于走得通。'],
    });
  },
  // ===== 终章 凿空 =====
  async changanBack() {
    if (!F().escaped2 || F().homeBack) return;
    if (isRebirth()) return STORY.rbHome2();
    F().homeBack = 1;
    await narr(['十三年了。', '长安城还是那么热闹。可是你出发时带走的一百多人，只剩下身边的甘父。']);
    await recap(3);
    await chapter(4);
    await narr('（去未央宫，向皇上复命。）');
  },
  async fuming() {
    Snd.play('sad');
    await narr('未央宫大殿。汉武帝快步走下台阶。');
    await say('张骞', ['臣张骞，回来复命。', '臣没能说服月氏……可大宛、康居、大月氏、大夏，臣都亲自去过了。']);
    await say('汉武帝', '十三年了……一百多人出发，只回来了你们两个？');
    await getCard('erren');
    await say('汉武帝', ['你带回来的，是比月氏更宝贵的东西——西域的路！', '朕封你为太中大夫，封甘父为奉使君！']);
    await getCard('jiangshang');
    F().metEmperor = 1;
    Snd.play(MapScene.musicFor());
    await narr('（回家好好歇一歇吧。）');
    autosave();
  },
  async zhangHome() {
    if (F().ch >= 4 && F().metEmperor) { await STORY.epilogue(); return; }
    await rest({ ask: '回家歇一会儿吗？' });
  },
  async epilogue() {
    const c = await ask(null, '（回家歇下，故事就要结束了。准备好了吗？）', ['好了', '再逛逛']);
    if (c !== 0) return;
    await fadeOut(900);
    Snd.play('ending');
    await card(['很多年以后……'], { big: true });
    await card(['张骞跟着大将军卫青出征。', '他知道哪里有水、哪里有草，军队一路不缺水草。'], { lh: 46 });
    await getCard('bowang');
    await card(['汉朝的使者一批接一批往西走。', '史书说，「使者相望于道」——', '路上的使者，一个能望见下一个。'], { lh: 46 });
    await card(['使者们带回了葡萄和苜蓿的种子，', '种满了肥沃的田地。'], { lh: 46 });
    await getCard('putao');
    await card(['写《史记》的司马迁说：', '张骞「凿空」——', '他第一个打通了去西域的路。'], { lh: 46 });
    await getCard('zaokong');
    await card(['又过了将近两千年……', '一位德国学者把这条路，', '叫作「丝绸之路」。'], { lh: 46 });
    await getCard('sichou');
    await recap(4);
    await fadeOut(400);
    Snd.play('title');
    await card(['张骞传', '— 全剧终 —'], { big: true });
    markCleared();
    await mottoCard(GAME.motto.clear);
    const main = Object.keys(CARDS).filter(id => !CARDS[id].rebirth);
    await card(['感谢游玩！', '', `你一共收集了 ${main.filter(hasCard).length} / ${main.length} 张史料卡。`, '标题画面多了「重生」：', '回到关键时刻，换一种选择试试！'], { lh: 40 });
    UI.stack.length = 0;
    titleLoop();
  },
};
