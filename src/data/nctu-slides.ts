/**
 * Slides for the /nctu deck. NCTU Alumni at Tokyo, 2026/08/29.
 *
 * The deck is the run of show. A host drives it from the front and the room
 * watches, so it follows the day in order (流程, 致詞, 大合照, 賓果, 猜謎,
 * 系友分享) rather than being a bare question bank. Content transcribed from
 * the event's Notion page; the internal logistics rows (訂便當, 拿收據,
 * 收拾場地) are deliberately not here, because they are not for the room.
 *
 * This is the whole content model: edit this file, nothing else. The page at
 * `src/pages/nctu.astro` renders whatever is in `slides` and derives its
 * keyboard sequence from the reveal steps each kind declares.
 *
 * Reveal order per kind (one press of the next key advances one step):
 *   cover:     one step
 *   agenda:    one step
 *   section:   one step
 *   text:      one step, plus one per bullet if `revealBullets` is set
 *   bingo:     one step
 *   riddle:    prompt → hint (if any) → answer (+ explain, if any)
 *   question:  prompt (+ options) → answer (+ explain, if any)
 */

export type Slide =
  | {
      kind: "cover";
      title: string;
      subtitle?: string;
      note?: string;
    }
  | {
      kind: "section";
      /** Small line above the title, e.g. "第一關". */
      label?: string;
      title: string;
      /** Optional lines under the title: the rules of the round. */
      body?: string[];
    }
  | {
      kind: "agenda";
      title?: string;
      /** One row per segment of the day, in order. */
      rows: { time: string; item: string; note?: string }[];
    }
  | {
      kind: "text";
      title?: string;
      body: string[];
      /** Reveal bullets one press at a time instead of all at once. */
      revealBullets?: boolean;
    }
  | {
      kind: "bingo";
      title?: string;
      /** Rows of cells, rendered as a grid at whatever size fits. */
      rows: string[][];
    }
  | {
      kind: "riddle";
      /** Shown in the corner, e.g. "猜謎 3". Falls back to the running count. */
      index?: string;
      prompt: string;
      hint?: string;
      answer: string;
      explain?: string;
    }
  | {
      kind: "question";
      index?: string;
      prompt: string;
      /** Labels A, B, C… are added by the renderer, so do not repeat them here. */
      options?: string[];
      /**
       * The option letter when `options` is set ("B"), otherwise free text.
       * With options the deck shows the letter and the option together, and
       * dims the ones that were wrong.
       */
      answer: string;
      explain?: string;
      /** Path under `public/`, e.g. "img/nctu/kiritani.png". */
      image?: string;
    };

export const slides: Slide[] = [
  {
    kind: "cover",
    title: "2026 陽明交大資訊系友日 ＠ 東京",
    subtitle: "2026 / 08 / 29",
    note: "→ 或空白鍵 下一步 · ← 上一步 · 數字 + Enter 跳頁 · F 全螢幕 · B 黑屏 · T 開燈關燈 · O 目錄",
  },
  {
    kind: "agenda",
    title: "今日流程",
    rows: [
      { time: "13:00", item: "報到接待" },
      {
        time: "13:30",
        item: "致詞",
        note: "黃俊龍副院長、張立平系主任、大河馬會長",
      },
      { time: "13:45", item: "場地方代表開場" },
      { time: "13:50", item: "大合照" },
      { time: "14:00", item: "分組破冰＆下午茶", note: "賓果、猜謎" },
      { time: "15:30", item: "主題分享／系友分享", note: "簡士強" },
      { time: "16:00", item: "活動結束", note: "交流到 16:30" },
    ],
  },
  {
    kind: "section",
    label: "13:30",
    title: "致詞",
    body: ["黃俊龍 副院長", "張立平 系主任", "大河馬 會長", "場地方代表開場"],
  },
  {
    kind: "section",
    label: "13:50",
    title: "大合照",
    body: ["請大家往前集中"],
  },

  // 賓果, 30 min
  {
    kind: "section",
    label: "14:00 · 破冰",
    title: "賓果",
    body: [
      "和別人聊天，請對方幫自己簽名",
      "同一個人最多簽兩格",
      "連線完成後上台分享",
    ],
  },
  {
    kind: "bingo",
    title: "賓果卡",
    rows: [
      ["同屆畢業的人", "資工系的人", "住東京超過 5 年", "重修過", "搭過小紅巴"],
      [
        "為了寫作業通宵過",
        "在竹科工作過",
        "在日本打工過（バイト）",
        "日文 N1 程度",
        "在日本考過駕照",
      ],
      ["會唱一首日文歌", "跳過竹湖", "FREE", "有念研究所", "曾經在實驗室過夜"],
      [
        "交大打工／當過助教",
        "曾經半夜 debug 到天亮",
        "會兩種以上程式語言",
        "參加過交大校慶運動會",
        "去巨城看過電影",
      ],
      [
        "參加過黑客松／程式競賽",
        "辦過確定申告",
        "喝過神之雞湯",
        "看過日本煙火大會",
        "在日本自駕旅行過",
      ],
    ],
  },

  // 猜謎, 1 h
  {
    kind: "section",
    label: "14:30",
    title: "猜謎",
    body: ["分成幾組", "每題給大家看幾分鐘討論", "最後一起解答"],
  },
  {
    kind: "question",
    prompt: "交大資工系的英文縮寫是？",
    options: ["CS", "CSIE", "EECS", "IEE"],
    answer: "B",
  },
  {
    kind: "question",
    prompt: "交大人常搭的「小紅」其實是哪條路線？",
    options: [
      "紅線 2 號",
      "科學園區巡迴巴士紅線",
      "81 號公車",
      "竹科接駁 1 號線",
    ],
    answer: "B",
  },
  {
    kind: "question",
    prompt: "陽明交大是哪一年正式合併？",
    options: ["2019", "2020", "2021", "2023"],
    answer: "C",
  },
  {
    kind: "question",
    prompt: "2021 年（陽明交大合併那年）的「今年の漢字」是哪一個字？",
    options: ["絆（きずな）", "令（れい）", "密（みつ）", "金（きん）"],
    answer: "D",
  },
  {
    kind: "question",
    prompt: "浩然圖書館的樓層規模是？",
    options: [
      "地上 6 層地下 1 層",
      "地上 8 層地下 1 層",
      "地上 10 層地下 2 層",
      "地上 8 層地下 2 層",
    ],
    answer: "B",
  },
  {
    kind: "section",
    label: "換個玩法",
    title: "開放討論",
    body: ["現場搶答", "無標準答案"],
  },
  {
    kind: "question",
    prompt: "「桐谷さん」（靠股東優待生活聞名的元將棋棋士）住在東京哪一區？",
    image: "img/nctu/kiritani.png",
    options: ["中野区", "杉並区", "練馬区", "大田区"],
    answer: "A",
  },
  {
    kind: "question",
    prompt: "上司請你吃飯，結帳時你應該？",
    options: [
      "搶著付錢，但就真的拿出錢包而已",
      "說「ごちそうさまです」，乖乖被請客",
      "堅持要各付各的",
      "結帳的瞬間假裝要去廁所逃跑",
    ],
    answer: "B",
  },
  {
    kind: "question",
    prompt: "資訊二館「啟航計畫」的募款目標是多少？",
    options: ["4 億", "6 億", "8 億", "10 億"],
    answer: "C",
    explain:
      "主體工程的 6 億已經募到，內裝工程還需要 2 億，合計 8 億。截至 2026/08/28 已募得 615,092,000 元，進度 77%，仍在持續募款中。（cs2-fundraising.cs.nycu.edu.tw）",
  },
  {
    kind: "question",
    prompt: "交大二餐為什麼會有宵禁？",
    options: [
      "有學生半夜在裡面打麻將",
      "有學生半夜在裡面烤肉，觸發火災警報",
      "有學生半夜在裡面喝酒",
      "有學生半夜在裡面打架",
    ],
    answer: "A",
  },
  {
    kind: "question",
    prompt: "交大光復校區草地上有一台雕塑，那是什麼車？",
    options: ["馬車", "牛車", "三輪車", "機車"],
    answer: "B",
    explain:
      "1962 年台灣第一台 IBM 650 電腦由基隆港運抵新竹交大，當時沒有防震用的氣墊車，只好用牛車以極慢速度運送。雕塑就在光復校區工程三館前的草地上。（剪綵當天因冷氣不足、溫度過高，真空管燒壞，最後報廢）",
  },

  {
    kind: "section",
    label: "15:30",
    title: "主題分享／系友分享",
    body: ["簡士強"],
  },
  {
    kind: "cover",
    title: "謝謝大家",
    subtitle: "交流到 16:30",
  },
];
