/**
 * クイズ問題
 *  type: 'choice' … 3択 / 'ox' … ○×問題 / 'compare' … AとBどちらが有利か
 *  answer: 正解の選択肢の index（出題時に選択肢はシャッフルされる）
 *  category: 解説ページへの復習リンク用のカテゴリID
 */
export const QUESTIONS = [
  {
    id: 'q-material',
    type: 'choice',
    category: 'materials',
    question: '次のうち、火災初期の延焼を最も抑えやすい内装はどれ？',
    options: [
      '不燃材料（石膏ボード）で仕上げた部屋',
      '一般の木質パネルで仕上げた部屋',
      '防炎処理をしていないカーテンが多い部屋',
    ],
    answer: 0,
    explanation: '不燃材料は加熱開始後20分間燃焼しない性能を持ち、燃え広がりと煙の発生を抑えます。',
  },
  {
    id: 'q-compartment',
    type: 'choice',
    category: 'fire-prevention',
    question: '防火区画の主な目的として正しいものはどれ？',
    options: [
      '火災の範囲を限定し、避難や消火の時間を確保すること',
      '建物の断熱性能を高め、冷暖房費を下げること',
      '建物を細かく分け、建設コストを下げること',
    ],
    answer: 0,
    explanation: '防火区画は耐火性能のある壁・床・防火戸で建物を区切り、火災が建物全体に広がるのを防ぎます。',
  },
  {
    id: 'q-smoke-danger',
    type: 'choice',
    category: 'smoke-evacuation',
    question: '火災による死者の原因として最も多いのはどれ？',
    options: [
      '煙に含まれる有毒ガスの吸入',
      '建物の振動',
      '消火に使われた水',
    ],
    answer: 0,
    explanation: '煙には一酸化炭素などの有毒ガスが含まれ、短時間で意識を失わせることがあります。視界も奪い、避難を困難にします。',
  },
  {
    id: 'q-two-way',
    type: 'compare',
    category: 'smoke-evacuation',
    question: '避難上、より有利な計画はどっち？',
    options: [
      '廊下の両端に階段がある（2方向避難）',
      '廊下の片側の端にだけ階段がある',
    ],
    icons: ['⇆', '→'],
    answer: 0,
    explanation: '2方向避難なら、一方の経路が火や煙で使えなくなっても、もう一方の階段から逃げられます。',
  },
  {
    id: 'q-steel',
    type: 'choice',
    category: 'fire-resistance',
    question: '鉄骨構造に耐火被覆が必要な主な理由はどれ？',
    options: [
      '鋼材は高温になると強度が大きく低下し、倒壊の危険があるため',
      '鋼材は火災時に溶けて燃料になるため',
      '鋼材がさびて見た目が悪くなるのを防ぐため',
    ],
    answer: 0,
    explanation: '鋼材は約500℃前後で強度が常温時の半分程度まで低下します。被覆で熱が伝わるのを遅らせ、倒壊を防ぎます。',
  },
  {
    id: 'q-ox-same',
    type: 'ox',
    category: 'fire-prevention',
    question: '「防火」と「耐火」は、どちらも同じ意味の言葉である。',
    options: ['○', '×'],
    answer: 1,
    explanation: '防火は火災の発生・拡大を「防ぐ」こと、耐火は構造体が火災の熱に「耐えて」壊れないこと。目的が異なります。',
  },
  {
    id: 'q-ox-smoke-layer',
    type: 'ox',
    category: 'smoke-evacuation',
    question: '火災の煙は、まず天井付近にたまり、時間とともに下降してくる。',
    options: ['○', '×'],
    answer: 0,
    explanation: '熱い煙は軽いため上昇して天井付近に煙層をつくり、時間とともに厚くなって下りてきます。避難時に姿勢を低くするのはこのためです。',
  },
  {
    id: 'q-noncombustible-time',
    type: 'choice',
    category: 'materials',
    question: '不燃材料に求められる「加熱開始後に燃焼しない時間」はどれ？',
    options: ['20分間', '10分間', '5分間'],
    answer: 0,
    explanation: '不燃材料は20分間、準不燃材料は10分間、難燃材料は5分間です。',
  },
  {
    id: 'q-ox-wood',
    type: 'ox',
    category: 'fire-resistance',
    question: '太い木材は、燃えると表面が炭化して断熱層となり、内部まで燃えるのに時間がかかる。',
    options: ['○', '×'],
    answer: 0,
    explanation: '炭化層は熱を伝えにくいため、内部は燃えにくくなります。この性質を利用するのが「燃えしろ設計」です。',
  },
  {
    id: 'q-fire-door',
    type: 'compare',
    category: 'planning',
    question: '延焼を抑えやすいのはどっち？',
    options: [
      '防火戸の前に何も置かれておらず、火災時に自動で閉まる',
      '防火戸の前に段ボールが積まれ、閉まらない',
    ],
    icons: ['🚪', '📦'],
    answer: 0,
    explanation: '防火戸が閉まらなければ、区画の壁があっても開口部から火と煙が流れ込みます。日常の維持管理も防火計画の一部です。',
  },
  {
    id: 'q-smoke-curtain',
    type: 'choice',
    category: 'smoke-evacuation',
    question: '「防煙垂れ壁」の役割として正しいものはどれ？',
    options: [
      '天井付近を流れる煙をせき止め、広がりを遅らせる',
      '床付近の冷たい空気をせき止める',
      '火災時に下りてきて炎を消す',
    ],
    answer: 0,
    explanation: '煙は天井付近を流れるため、天井から50cm以上下がった垂れ壁で煙の広がる範囲を区切ります。',
  },
  {
    id: 'q-flashover',
    type: 'choice',
    category: 'materials',
    question: '「フラッシュオーバー」とはどんな現象？',
    options: [
      '室内の可燃物が熱で一斉に燃え出し、部屋全体が炎に包まれる',
      '消火のために窓を一斉に開けること',
      '煙が階段を一気に上昇すること',
    ],
    answer: 0,
    explanation: 'フラッシュオーバーが起きると室内での生存は困難になります。内装を燃えにくくすると、発生までの時間を延ばせます。',
  },
  {
    id: 'q-vertical',
    type: 'choice',
    category: 'fire-prevention',
    question: '「竪穴区画」で囲う必要があるのはどんな空間？',
    options: [
      '階段・吹抜け・エレベーターシャフトなど上下につながる空間',
      '地下の機械室だけ',
      '屋上の庭園',
    ],
    answer: 0,
    explanation: '上下につながる空間は煙突のように煙と熱が上昇する通り道になるため、区画して上階への拡大を防ぎます。',
  },
  {
    id: 'q-ox-cover',
    type: 'ox',
    category: 'fire-resistance',
    question: '鉄筋コンクリートでは、かぶり厚さを大きくすると火災時に鉄筋の温度が上がりやすくなる。',
    options: ['○', '×'],
    answer: 1,
    explanation: 'かぶりのコンクリートが断熱層となるため、かぶり厚さが大きいほど鉄筋の温度は上がりにくくなります。',
  },
  {
    id: 'q-exhaust',
    type: 'compare',
    category: 'smoke-evacuation',
    question: '廊下で煙の影響を受けにくいのはどっち？',
    options: [
      '排煙設備があり、居室の扉が閉まっている',
      '排煙設備がなく、居室の扉が開いたまま',
    ],
    icons: ['🌬️', '🌫️'],
    answer: 0,
    explanation: '扉が閉まっていれば煙の流出を抑えられ、排煙設備は流れ込んだ煙を屋外へ出します。シミュレーションでも確かめてみましょう。',
  },
  {
    id: 'q-users',
    type: 'choice',
    category: 'planning',
    question: 'より厳しい避難安全計画が求められる建物はどれ？',
    options: [
      '入院患者が寝ている病院',
      '家族だけが住む平屋の住宅',
      '人のいない倉庫',
    ],
    answer: 0,
    explanation: '自力で避難しにくい人や、建物に不慣れな人が多く利用する建物ほど、手厚い安全計画が求められます。',
  },
]

/** 出題用に問題を選び、選択肢をシャッフルする（○×は順番を固定） */
export function buildRound(count, random = Math.random) {
  const pool = [...QUESTIONS]
  shuffle(pool, random)
  return pool.slice(0, Math.min(count, pool.length)).map(q => {
    if (q.type === 'ox') return { ...q, order: q.options.map((_, i) => i) }
    const order = q.options.map((_, i) => i)
    shuffle(order, random)
    return { ...q, order }
  })
}

function shuffle(arr, random) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** 正答率に応じた称号 */
export function rankFor(percent) {
  if (percent === 100) return { title: '防耐火マイスター', icon: '🏆', message: '全問正解！防火と耐火の基本をしっかり理解しています。' }
  if (percent >= 80) return { title: '防火エキスパート', icon: '🎖️', message: 'すばらしい！間違えた問題の解説を読めば完璧です。' }
  if (percent >= 60) return { title: '防火見習い', icon: '🔰', message: 'よくできました。学習解説で復習するとさらに理解が深まります。' }
  return { title: 'これからが伸びしろ', icon: '🌱', message: '学習解説とシミュレーションで基本を確かめてから、もう一度挑戦しましょう。' }
}
