// 《张骞传》试玩脚本：tools/playtest.js 按 steps 走完全部剧情，ending 触发结局，routes 检查地图路线
module.exports = H => ({
  steps: [
    ['长安', [H.npc('匈奴降人'), H.npc('老妇人'), H.npc('甘父'), H.door('书肆'), H.door('兵营'), H.door('东市'), H.door('未央宫'), H.npc('郎官同僚'), H.npc('甘父'), H.pickAll(), H.leave(), H.pickWorld('han'), H.enter('L')]],
    ['陇西', [H.npc('年轻戍卒'), H.door('郡府'), H.door('烽火台'), H.door('驿站'), H.toWorld('L'), H.gate('3')]],
    ['匈奴', [H.door('你的毡帐'), H.npc('牧民'), H.door('牧民毡帐'), H.door('老牧人的毡帐'), H.npc('匈奴小孩'), H.leave(), H.pickWorld('steppe'), H.gate('7'), H.enter('X'), H.npc('匈奴小孩'), H.door('单于大帐'), H.door('你的毡帐'), H.npc('胡妻'), H.npc('儿子'), H.door('你的毡帐')]],
  ],
  ending: H.enter('Z'),
  routes: [
    { name: '长安→陇西', from: 'A', to: 'L' },
    { name: '长安→边塞关卡 3', from: 'A', toGate: '3' },
    { name: '汉地文物（半两钱）走得到', from: 'A', toChest: { card: 'banliang' } },
    { name: '出塞前到不了草原', from: 'A', to: 'X', expect: false },
    { name: '营地→哨卡 7', flags: { ch: 1 }, from: 'X', toGate: '7' },
    { name: '草原文物和小羊走得到', flags: { ch: 1 }, quests: { lamb: { st: 'on' } }, from: 'X', toChest: [{ card: 'mingdi' }, { quest: 'lamb' }] },
    { name: '被扣时到不了大宛', flags: { ch: 1 }, from: 'X', to: 'Z', expect: false },
    { name: '逃走后→大宛', flags: { ch: 1, escaped: 1, gate7: 1 }, from: { loc: 'X', dy: 1 }, to: 'Z' },
  ],
});
