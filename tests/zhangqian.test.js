// 《张骞传》试玩脚本：tools/playtest.js 按 steps 走完全部剧情，ending 触发结局，routes 检查地图路线
module.exports = H => ({
  steps: [
    ['序章 长安', [H.npc('匈奴降人'), H.npc('老妇人'), H.npc('甘父'), H.door('书肆'), H.door('兵营'), H.door('东市'), H.door('未央宫'), H.npc('郎官同僚'), H.npc('甘父'), H.pickAll(), H.leave(), H.pickWorld('han'), H.enter('L')]],
    ['序章 陇西', [H.npc('年轻戍卒'), H.door('郡府'), H.door('烽火台'), H.door('驿站'), H.toWorld('L'), H.gate('3')]],
    ['第一章 匈奴', [H.door('你的毡帐'), H.npc('牧民'), H.door('牧民毡帐'), H.door('老牧人的毡帐'), H.npc('匈奴小孩'), H.leave(), H.pickWorld('steppe'), H.gate('7'), H.enter('X'), H.npc('匈奴小孩'), H.door('单于大帐'), H.door('你的毡帐'), H.npc('胡妻'), H.npc('儿子'), H.door('你的毡帐')]],
    ['第二章 大宛', [H.enter('Y'), H.door('王宫'), H.door('葡萄酒坊'), H.door('马场'), H.door('民居'), H.npc('马夫'), H.leave(), H.pickWorld('ferghana'), H.enter('Y'), H.npc('马夫'), H.toWorld('Y'), H.enter('K'), H.enter('M'), H.enter('B')]],
    ['第二章 大夏', [H.door('客舍'), H.door('蓝市'), H.npc('大夏商人'), H.npc('钱币商'), H.door('民居'), H.door('客舍')]],
    ['第三章 归途', [H.toWorld('B'), H.enter('C'), H.enter('H'), H.enter('C'), H.door('单于大帐'), H.npc('胡妻'), H.door('你的毡帐')]],
    ['终章 长安', [H.enter('X'), H.enter('L'), H.toWorld('L'), H.enter('A'), H.door('书肆'), H.door('张家'), H.door('未央宫'), H.npc('郎官同僚'), H.npc('老妇人'), H.npc('小孩')]],
  ],
  ending: H.door('张家'),
  // 重生路径：picks 是每个决策点选第几项（从 0 数）。覆盖全部四个结局、全部重生史料卡
  rebirth: (() => {
    const camp = [H.door('单于大帐'), H.door('你的毡帐'), H.door('你的毡帐')];           // 决策 1 → 十年 → 逃走
    const west = [H.enter('Y'), H.door('王宫'), H.toWorld('Y'), H.enter('K'), H.enter('M'), H.enter('B'), H.npc('大夏商人'), H.door('客舍')]; // → 决策 2、3
    const home = [H.door('你的毡帐'), H.enter('L'), H.toWorld('L'), H.enter('A')];        // 再被抓 → 趁乱逃 → 长安
    return [
      { name: '等待·不带家人·讲报仇·南山', picks: { d1: 1, family: 1, d2: 0, d3: 0 }, steps: [...camp, ...west, H.toWorld('B'), H.enter('H'), H.enter('C'), ...home], ending: '十三年，两人还' },
      { name: '现在走·带家人·请月氏派人·北道', picks: { d1: 0, family: 0, d2: 2, d3: 1 }, steps: [...camp, ...west, ...home], ending: '带回月氏使者' },
      { name: '等待·带家人·许诺重礼·绕道身毒', picks: { d1: 1, family: 0, d2: 1, d3: 2 }, steps: [...camp, ...west], ending: '西南的路没走通' },
      { name: '不走了', picks: { d1: 2 }, steps: [H.door('你的毡帐')], ending: '留在了草原' },
      { name: '等待·不带家人·记下西域·留在大夏', picks: { d1: 1, family: 1, d2: 3, d3: 3 }, steps: [...camp, ...west], ending: '留在了大夏' },
    ];
  })(),
  routes: [
    // 序章、第一章
    { name: '长安→陇西', from: 'A', to: 'L' },
    { name: '长安→边塞关卡 3', from: 'A', toGate: '3' },
    { name: '汉地文物（半两钱）走得到', from: 'A', toChest: { card: 'banliang' } },
    { name: '出塞前到不了草原', from: 'A', to: 'X', expect: false },
    { name: '营地→哨卡 7', flags: { ch: 1 }, from: 'X', toGate: '7' },
    { name: '草原文物和小羊走得到', flags: { ch: 1 }, quests: { lamb: { st: 'on' } }, from: 'X', toChest: [{ card: 'mingdi' }, { quest: 'lamb' }] },
    { name: '被扣时到不了大宛', flags: { ch: 1 }, from: 'X', to: 'Y', expect: false },
    { name: '逃走后→大宛', flags: { ch: 1, escaped: 1, gate7: 1 }, from: { loc: 'X', dy: 1 }, to: 'Y' },
    // 第二章
    { name: '没有向导到不了康居', flags: { ch: 2, escaped: 1, gate7: 1 }, from: 'Y', to: 'K', expect: false },
    { name: '有向导→康居', flags: { ch: 2, escaped: 1, gate7: 1, gate2: 1 }, from: 'Y', to: 'K' },
    { name: '有向导→大月氏', flags: { ch: 2, escaped: 1, gate7: 1, gate2: 1 }, from: 'Y', to: 'M' },
    { name: '有向导→大夏（过妫水渡口）', flags: { ch: 2, escaped: 1, gate7: 1, gate2: 1 }, from: 'Y', to: 'B' },
    { name: '苜蓿走得到', flags: { ch: 2, escaped: 1, gate7: 1 }, quests: { musu: { st: 'on' } }, from: 'Y', toChest: { quest: 'musu' } },
    // 第三章、终章
    { name: '雪山没开时到不了打猎营地', flags: { ch: 2, escaped: 1, gate7: 1, gate2: 1 }, from: 'B', to: 'H', expect: false },
    { name: '雪山开了→打猎营地→羌中', flags: { ch: 3, escaped: 1, gate2: 1, gate6: 1 }, from: 'B', to: 'C' },
    { name: '又被扣时出不了草原', flags: { ch: 3, escaped: 1, captured2: 1, gate2: 1, gate6: 1 }, from: { loc: 'X', dy: 1 }, to: 'L', expect: false },
    { name: '逃回后→陇西→长安', flags: { ch: 3, escaped: 1, captured2: 1, escaped2: 1, gate3: 1, gate2: 1, gate6: 1 }, from: { loc: 'X', dy: 1 }, to: 'A' },
  ],
});
