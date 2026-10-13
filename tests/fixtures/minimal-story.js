'use strict';
// 最小剧本：两个人物、一张卡、一座城。engine-check 用它证明引擎不依赖任何具体题材
const GAME = { id: 'fake', title: '郑和', chapters: ['序章 龙江船厂'], party: ['zh'] };
const CHARS = { zh: { name: '郑和', sp: 'official' } };
const SPEAK = {};
const ITEMS = {};
const CARDS = { baochuan: { ch: 0, fact: true, title: '宝船', src: '《明史·郑和传》', text: '郑和船队最大的船叫宝船。' } };
const RECAPS = { 0: { game: ['你参观了船厂。'], history: ['1405 年郑和第一次下西洋。'] } };
const WORLD_DEF = { name: '江南', start: 'A', coarse: ['^^^^^', '^.A.^', '^...^', '^^^^^'], zones: [{ z: 'jn', x0: 1, y0: 1, x1: 3, y1: 2 }], zoneInfo: { jn: { ground: '.', mtn: '^' } } };
const LOCS = { A: { id: 'nanjing', kind: 'town', icon: 'port', name: '南京' } };
const RELICS = [], GATE_MSG = {}, DUNGEONS = {}, QUESTS = {};
const TOWNS = { nanjing: { name: '龙江船厂', size: 'small', theme: 'coast', b: [], npcs: [
  { sp: 'man', name: '船匠', x: 4, y: 6, card: 'baochuan', say: ['这艘宝船，比一座宫殿还大！'] },
  { sp: 'official', name: '郑和', x: 9, y: 6, say: ['明天就要出海了。'] } ] } };
const STORY = { async intro() { Fade.a = 1; Scene = MapScene; MapScene.enter('town:nanjing', 11, 14, 'up'); await fadeIn(300); await narr('龙江船厂。'); } };
