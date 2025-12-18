const eigoQuiz = [
  {
    question: ' "I have a pen." を日本語に訳しなさい。',
    answers: [ '私はペンを持っています。', 'これはペンです。', 'あれはペンです。', 'ペンはどこですか？'],
    correct: '私はペンを持っています。',
    explanation: 'haveは「～を持っている」という所有を表す動詞です。主語がI（私）なので、「私はペンを持っています。」となります。',
    level: 1
  },
  {
    question: ' "apple" の複数形は？',
    answers: [ 'apples', 'applees', 'appls', 'apple\'s'],
    correct: 'apples',
    explanation: '多くの名詞は、単語の末尾に -s を付けることで複数形になります。',
    level: 1
  },
  {
    question: ' "play" の過去形は？',
    answers: [ 'playing', 'plays', 'played', 'playd'],
    correct: 'played',
    explanation: 'playのような規則動詞は、末尾に -ed を付けることで過去形になります。',
    level: 1
  },
  {
    question: '次のうち、最も強く発音する（アクセントがある）位置が他の3つと異なる単語はどれ？',
    answers: [ 'fa-mous', 'beau-ti-ful', 'im-por-tant', 'dif-fi-cult'],
    correct: 'im-por-tant',
    explanation: 'famous, beautiful, difficult は第1音節にアクセントがありますが、important は第2音節 (por) にアクセントがあります。',
    level: 1
  },
  {
    question: ' "This is the book (   ) I bought yesterday." カッコ内に入る最も適切な単語は？',
    answers: [ 'who', 'which', 'where', 'when'],
    correct: 'which',
    explanation: '先行詞が「物」(the book) なので、目的格の関係代名詞 which または that を使います。',
    level: 3
  },
  {
    question: ' "Let\'s play soccer." "Yes, (   )." カッコ内に入る最も適切な単語は？',
    answers: [ 'let\'s', 'we are', 'it is', 'I do'],
    correct: 'let\'s',
    explanation: 'Let\'s ...（～しましょう）という誘いに対して、同意する場合は Yes, let\'s. と答えるのが一般的です。',
    level: 1
  },
  {
    question: ' "tall" の比較級と最上級の正しい組み合わせは？',
    answers: [ 'taller, tallest', 'more tall, most tall', 'taller, the tallest', 'more tall, the most tall'],
    correct: 'taller, the tallest',
    explanation: '短い形容詞は、比較級では-erを、最上級ではthe -estを付けます。',
    level: 2
  },
  {
    question: ' "Can you help me?" と同じような意味を表す文はどれ？',
    answers: [ 'Could you give me a hand?', 'What can I do for you?', 'Do you need anything?', 'May I help you?'],
    correct: 'Could you give me a hand?',
    explanation: ' "give me a hand" は「手を貸す、手伝う」という意味の熟語です。Can you ...? よりも丁寧な依頼の表現になります。',
    level: 2
  },
  {
    question: ' "I get up at six thirty." の "thirty" と同じ意味の単語は？',
    answers: [ 'a quarter', 'half', 'fifteen', 'forty'],
    correct: 'half',
    explanation: '時間の表現で、30分は "thirty" または "half" (半分) を使って表すことができます。 "half past six" のように使います。',
    level: 1
  },
  {
    question: '次の文の( )に入れるのに最も適切な前置詞は？ "I am interested ( ) music."',
    answers: [ 'on', 'at', 'in', 'for'],
    correct: 'in',
    explanation: ' "be interested in ~" で「～に興味がある」という意味の熟語になります。',
    level: 2
  },
  {
    question: ' "I am a student." を否定文にしなさい。',
    answers: [ 'I am not a student.', 'I not am a student.', 'I do not a student.', 'I am no a student.'],
    correct: 'I am not a student.',
    explanation: 'be動詞の文を否定文にするときは、be動詞の後ろに not を置きます。',
    level: 1
  },
  {
    question: ' "You play tennis." を疑問文にしなさい。',
    answers: [ 'You play tennis?', 'Are you play tennis?', 'Do you play tennis?', 'Does you play tennis?'],
    correct: 'Do you play tennis?',
    explanation: '一般動詞（play）の現在形の文を疑問文にするときは、文の最初に Do を置きます。（主語が三人称単数の場合は Does）',
    level: 1
  },
  {
    question: ' "book" の前に付く冠詞として、適切でない場合があるものは？',
    answers: [ 'a', 'an', 'the', '冠詞なし'],
    correct: 'an',
    explanation: ' "an" は、次に続く単語が母音（a, i, u, e, o）の音で始まるときに使います。 "book" は子音の音なので "a book" となります。',
    level: 1
  },
  {
    question: ' "I went to the park." の "went" の原形は？',
    answers: [ 'go', 'goes', 'gone', 'going'],
    correct: 'go',
    explanation: ' "went" は "go" の不規則な過去形です。',
    level: 1
  },
  {
    question: ' "She is (   ) than me." カッコ内に入る最も適切な単語は？',
    answers: [ 'young', 'younger', 'youngest', 'more young'],
    correct: 'younger',
    explanation: ' "than" があるので比較級の文です。 "young" のような短い形容詞の比較級は -er を付けます。',
    level: 2
  },
  {
    question: ' "This is my pen." の "my" は何と呼ばれる？',
    answers: [ '代名詞', '所有格', '目的格', '主格'],
    correct: '所有格',
    explanation: '「私の〜」のように、所有を表す形を所有格といいます。',
    level: 1
  },
  {
    question: ' "I can (   ) English." カッコ内に入る最も適切な単語は？',
    answers: [ 'speak', 'speaks', 'speaking', 'spoke'],
    correct: 'speak',
    explanation: 'can, will, must などの助動詞の後ろには、動詞の原形がきます。',
    level: 1
  },
  {
    question: ' "Please look (   ) me." カッコ内に入る最も適切な前置詞は？',
    answers: [ 'at', 'on', 'in', 'for'],
    correct: 'at',
    explanation: ' "look at ~" で「〜を見る」という意味になります。',
    level: 1
  },
  {
    question: ' "I have two (   )." カッコ内に入る最も適切な単語は？',
    answers: [ 'dog', 'dogs', 'doges', 'dog\'s'],
    correct: 'dogs',
    explanation: '数が2以上の場合、名詞は複数形になります。多くの場合、-s を付けます。',
    level: 1
  },
  {
    question: ' "I was watching TV when he (   )." カッコ内に入る最も適切な単語は？',
    answers: [ 'come', 'came', 'comes', 'coming'],
    correct: 'came',
    explanation: '「彼が来たとき、私はテレビを見ていました」という意味の文です。過去のある時点で進行していた動作（was watching）を、別の過去の動作（came）が中断するイメージです。',
    level: 2
  },
  {
    question: ' "It is important (   ) study English." カッコ内に入る最も適切な単語は？',
    answers: [ 'for', 'of', 'to', 'that'],
    correct: 'to',
    explanation: ' "It is ... to ~" の形で、「〜することは…です」という意味になります。この to study は to不定詞の名詞的用法です。',
    level: 2
  },
  {
    question: ' "I don\'t know (   ) to do." カッコ内に入る単語として、文法的に間違っているものは？',
    answers: [ 'what', 'how', 'why', 'that'],
    correct: 'that',
    explanation: '「疑問詞 + to不定詞」で「何を〜すべきか」「どのように〜すべきか」などの意味を表すことができますが、that は疑問詞ではないためこの形はとれません。',
    level: 2
  },
  {
    question: ' "I am looking forward (   ) you." カッコ内に入る最も適切な単語は？',
    answers: [ 'see', 'to seeing', 'to see', 'seeing'],
    correct: 'to seeing',
    explanation: ' "look forward to ~ing" で「〜するのを楽しみに待つ」という意味の熟語です。この to は前置詞なので、後ろには名詞または動名詞(-ing)がきます。',
    level: 3
  },
  {
    question: ' "This flower is the (   ) of all." カッコ内に入る最も適切な単語は？',
    answers: [ 'beautiful', 'more beautiful', 'most beautiful', 'beautifullest'],
    correct: 'most beautiful',
    explanation: ' "the ... of all" の形から最上級の文だとわかります。beautiful のように長い単語の場合は、前に most を付けます。',
    level: 2
  },
  {
    question: ' "I have lived in Tokyo (   ) 2010." カッコ内に入る最も適切な前置詞は？',
    answers: [ 'for', 'since', 'from', 'at'],
    correct: 'since',
    explanation: '現在完了形（have lived）と共に使い、「〜以来ずっと」という継続を表す場合は since を使います。for は期間（例: for ten years）を表します。',
    level: 3
  },
  {
    question: ' "If it (   ) tomorrow, I will stay home." カッコ内に入る最も適切な単語は？',
    answers: [ 'rain', 'rains', 'will rain', 'rained'],
    correct: 'rains',
    explanation: '「もし〜ならば」という条件を表す if節の中では、未来のことでも現在形を使います。主語が it（三人称単数）なので、動詞に -s が付きます。',
    level: 2
  },
  {
    question: ' "This desk is made (   ) wood." カッコ内に入る最も適切な前置詞は？',
    answers: [ 'of', 'from', 'by', 'with'],
    correct: 'of',
    explanation: ' "be made of ~" は材料（見た目で何でできているかわかる）を表します。「be made from ~」は原料（見た目ではわからない）を表します。',
    level: 2
  },
  {
    question: ' "I am as (   ) as my brother." カッコ内に入る最も適切な単語は？',
    answers: [ 'tall', 'taller', 'tallest', 'more tall'],
    correct: 'tall',
    explanation: ' "as ... as ~" で「〜と同じくらい…」という意味の同等比較の文です。形容詞・副詞は原級（元の形）を使います。',
    level: 2
  },
  {
    question: ' "Let\'s go shopping, (   )?" カッコ内に入る最も適切な付加疑問は？',
    answers: [ 'don\'t we', 'are we', 'shall we', 'will you'],
    correct: 'shall we',
    explanation: 'Let\'s ... で始まる命令文の付加疑問は、shall we? となります。',
    level: 2
  },
  {
    question: ' "I have (   ) been to London." カッコ内に入る、「一度も〜ない」という意味を表す単語は？',
    answers: [ 'ever', 'never', 'already', 'just'],
    correct: 'never',
    explanation: '現在完了形で never を使うと「一度も〜したことがない」という経験を表します。ever は疑問文で「今までに」という意味で使われます。',
    level: 3
  },
  {
    question: ' "Stop (   )!" カッコ内に入る、「話すのをやめなさい」という意味にするための最も適切な単語は？',
    answers: [ 'talk', 'to talk', 'talking', 'talked'],
    correct: 'talking',
    explanation: 'stop ~ing で「〜するのをやめる」という意味になります。stop to talk は「話すために立ち止まる」という意味になります。',
    level: 2
  },
  {
    question: ' "The boy (   ) is running over there is my son." カッコ内に入る最も適切な単語は？',
    answers: [ 'who', 'which', 'whose', 'whom'],
    correct: 'who',
    explanation: '先行詞が「人」(The boy)で、主格（〜が）の働きをする関係代名詞なので who を使います。',
    level: 3
  },
  {
    question: ' "I am good (   ) playing the piano." カッコ内に入る最も適切な前置詞は？',
    answers: [ 'at', 'in', 'for', 'with'],
    correct: 'at',
    explanation: ' "be good at ~" で「〜が得意である」という意味の熟語になります。',
    level: 1
  },
  {
    question: ' "You must (   ) your homework." カッコ内に入る最も適切な単語は？',
    answers: [ 'do', 'does', 'did', 'doing'],
    correct: 'do',
    explanation: 'must は助動詞なので、後ろには動詞の原形がきます。',
    level: 1
  },
  {
    question: ' "How (   ) is this bag?" "It\'s 5,000 yen." カッコ内に入る最も適切な単語は？',
    answers: [ 'many', 'long', 'old', 'much'],
    correct: 'much',
    explanation: '値段を尋ねるときは How much ...? を使います。How many は数えられるものの数を尋ねるときに使います。',
    level: 1
  },
  {
    question: ' "I was (   ) to hear the news." カッコ内に入る、「その知らせを聞いて悲しかった」という意味にするための最も適切な単語は？',
    answers: [ 'sad', 'sadly', 'saddest', 'sadness'],
    correct: 'sad',
    explanation: '感情の原因を表す to不定詞の用法です。「〜して…だ」という意味になります。be動詞の後ろなので形容詞の sad が入ります。',
    level: 2
  },
  {
    question: ' "There is a cat (   ) the table." カッコ内に入る、「テーブルの下に」という意味にするための最も適切な前置詞は？',
    answers: [ 'on', 'in', 'under', 'by'],
    correct: 'under',
    explanation: 'under は「〜の下に」という意味の位置を表す前置詞です。',
    level: 1
  },
  {
    question: ' "I want (   ) a doctor." カッコ内に入る最も適切な単語は？',
    answers: [ 'be', 'to be', 'being', 'am'],
    correct: 'to be',
    explanation: 'want to ~ で「〜したい」という意味になります。',
    level: 1
  },
  {
    question: ' "This is the house (   ) he lives." カッコ内に入る最も適切な単語は？',
    answers: [ 'which', 'where', 'who', 'when'],
    correct: 'where',
    explanation: '先行詞が「場所」(the house)で、後ろの文で副詞の働きをする関係副詞なので where を使います。in which と書き換えることもできます。',
    level: 3
  },
  {
    question: ' "I have to finish my homework (   ) dinner." カッコ内に入る、「夕食の前に」という意味にするための最も適切な前置詞は？',
    answers: [ 'after', 'before', 'during', 'until'],
    correct: 'before',
    explanation: 'before は「〜の前に」という意味です。',
    level: 1
  },
  {
    question: ' "He is known (   ) everyone." カッコ内に入る最も適切な前置詞は？',
    answers: [ 'to', 'by', 'for', 'as'],
    correct: 'to',
    explanation: ' "be known to ~" で「〜に知られている」という意味になります。',
    level: 2
  },
  {
    question: ' "I enjoyed (   ) with my friends." カッコ内に入る最も適切な単語は？',
    answers: [ 'talk', 'to talk', 'talking', 'talked'],
    correct: 'talking',
    explanation: 'enjoy は目的語に動名詞(-ing)をとる動詞です。',
    level: 2
  },
  {
    question: ' "Don\'t be afraid (   ) making mistakes." カッコ内に入る最も適切な前置詞は？',
    answers: [ 'of', 'to', 'with', 'for'],
    correct: 'of',
    explanation: ' "be afraid of ~" で「〜を恐れる」という意味の熟語になります。',
    level: 2
  },
  {
    question: ' "I will call you if I (   ) time." カッコ内に入る最も適切な単語は？',
    answers: [ 'have', 'has', 'will have', 'had'],
    correct: 'have',
    explanation: '条件を表す if節の中では、未来のことでも現在形を使います。主語が I なので have となります。',
    level: 2
  },
  {
    question: ' "My hobby is (   ) pictures." カッコ内に入る最も適切な単語は？',
    answers: [ 'draw', 'drew', 'to draw', 'drawing'],
    correct: 'drawing',
    explanation: '「私の趣味は絵を描くことです」という意味にするには、動名詞 drawing または to不定詞 to draw を使います。',
    level: 2
  },
  {
    question: ' "He made me (   ) the room." カッコ内に入る最も適切な単語は？',
    answers: [ 'clean', 'to clean', 'cleaning', 'cleaned'],
    correct: 'clean',
    explanation: '使役動詞 make は、「make + 目的語 + 動詞の原形」の形で「（目的語）に〜させる」という意味になります。',
    level: 3
  },
  {
    question: ' "I am taller than he (   )." カッコ内に入る最も適切な単語は？',
    answers: [ 'is', 'am', 'does', 'has'],
    correct: 'is',
    explanation: '比較の文で、than の後ろは "he is tall" の "is" が省略されていると考えます。口語では目的格の him が使われることも多いです。',
    level: 2
  },
  {
    question: ' "I\'m sorry to have (   ) you waiting." カッコ内に入る最も適切な単語は？',
    answers: [ 'keep', 'kept', 'keeps', 'keeping'],
    correct: 'kept',
    explanation: 'have の後ろなので過去分詞形が入ります。「お待たせしてすみません」という意味の定番表現です。',
    level: 3
  },
  {
    question: ' "The sun rises in the (   )." カッコ内に入る最も適切な単語は？',
    answers: [ 'east', 'west', 'south', 'north'],
    correct: 'east',
    explanation: '「太陽は東から昇る」という意味の文です。',
    level: 1
  },
  {
    question: ' "I was born (   ) April 1st." カッコ内に入る最も適切な前置詞は？',
    answers: [ 'in', 'at', 'on', 'from'],
    correct: 'on',
    explanation: '特定の日付の前には on を使います。月や年の前には in、時刻の前には at を使います。',
    level: 1
  },
  {
    question: ' "Would you like (   ) coffee?" カッコ内に入る最も適切な単語は？',
    answers: [ 'any', 'some', 'a', 'many'],
    correct: 'some',
    explanation: '相手に何かを勧めるときの疑問文では、any の代わりに some を使うのが一般的です。',
    level: 1
  },
  {
    question: ' "He is a very famous singer." を、感嘆文に書き換えなさい。',
    answers: [ 'How famous singer he is!', 'What a famous singer he is!', 'How a famous singer he is!', 'What famous singer he is!'],
    correct: 'What a famous singer he is!',
    explanation: '「What a/an + 形容詞 + 名詞 + 主語 + 動詞!」の語順で感嘆文を作ります。',
    level: 2
  },
  {
    question: ' "I have a friend (   ) father is a doctor." カッコ内に入る最も適切な単語は？',
    answers: [ 'who', 'which', 'whose', 'whom'],
    correct: 'whose',
    explanation: '先行詞が「人」(a friend)で、所有格（〜の）の働きをする関係代名詞なので whose を使います。',
    level: 3
  },
  {
    question: ' "You had better (   ) a doctor." カッコ内に入る最も適切な単語は？',
    answers: [ 'see', 'to see', 'seeing', 'saw'],
    correct: 'see',
    explanation: 'had better ~ で「〜したほうがよい」という助言や軽い命令を表します。後ろには動詞の原形がきます。',
    level: 2
  },
  {
    question: ' "I am tired." " (   )" カッコ内に入る、「私もです」という意味の最も適切な表現は？',
    answers: [ 'Me too.', 'I am, too.', 'So am I.', 'All of the above'],
    correct: 'All of the above',
    explanation: 'Me too. は口語的な表現、I am, too. は丁寧な表現、So am I. も「私もそうです」という意味で使われる定型表現です。すべて正解です。',
    level: 1
  },
  {
    question: ' "This book was written (   ) him." カッコ内に入る最も適切な前置詞は？',
    answers: [ 'of', 'from', 'by', 'with'],
    correct: 'by',
    explanation: '受け身（受動態）の文で、「〜によって」という行為者を表す場合は by を使います。',
    level: 2
  },
  {
    question: ' "It began to rain." とほぼ同じ意味の文は？',
    answers: [ 'It began rain.', 'It began raining.', 'It began rained.', 'It began to raining.'],
    correct: 'It began raining.',
    explanation: 'begin は目的語に to不定詞 と 動名詞(-ing) の両方をとることができ、意味もほとんど変わりません。',
    level: 2
  },
  {
    question: ' "How (   ) have you been in Japan?" "For three years." カッコ内に入る最も適切な単語は？',
    answers: [ 'many', 'long', 'old', 'much'],
    correct: 'long',
    explanation: '期間を尋ねるときは How long ...? を使います。',
    level: 3
  },
  {
    question: ' "I have a lot of homework to (   )." カッコ内に入る最も適切な単語は？',
    answers: [ 'do', 'does', 'did', 'doing'],
    correct: 'do',
    explanation: 'to不定詞の形容詞的用法で、「〜するための…」という意味です。to の後ろは動詞の原形です。',
    level: 2
  },
  {
    question: ' "I am used to (   ) up early." カッコ内に入る最も適切な単語は？',
    answers: [ 'get', 'getting', 'got', 'to get'],
    correct: 'getting',
    explanation: 'be used to ~ing で「〜することに慣れている」という意味の熟語です。この to は前置詞です。',
    level: 3
  },
  {
    question: ' "He is not as tall as his father." とほぼ同じ意味の文は？',
    answers: [ 'He is taller than his father.', 'His father is taller than him.', 'His father is as tall as him.', 'He is the tallest in his family.'],
    correct: 'His father is taller than him.',
    explanation: '「彼は父親ほど背が高くない」という意味なので、「彼の父親は彼より背が高い」ということになります。',
    level: 2
  },
  {
    question: ' "I\'ll be back (   ) an hour." カッコ内に入る、「一時間後に」という意味にするための最も適切な前置詞は？',
    answers: [ 'in', 'at', 'on', 'after'],
    correct: 'in',
    explanation: '「今から〜後に」という未来の時間を表す場合は in を使います。after は過去のある時点からの「〜後」を表すことが多いです。',
    level: 2
  },
  {
    question: ' "I was made (   ) the room." カッコ内に入る、「部屋を掃除させられた」という意味にするための最も適切な単語は？',
    answers: [ 'clean', 'to clean', 'cleaning', 'cleaned'],
    correct: 'to clean',
    explanation: '使役動詞 make の受け身の形 (be made) では、後ろに to不定詞 がきます。',
    level: 3
  },
  {
    question: ' "I have a dog. (   ) name is Pochi." カッコ内に入る最も適切な単語は？',
    answers: [ 'It', 'Its', 'It\'s', 'He'],
    correct: 'Its',
    explanation: '「その〜」という所有を表す所有格なので Its を使います。It\'s は It is の短縮形です。',
    level: 1
  },
  {
    question: ' "I don\'t have (   ) money." カッコ内に入る最も適切な単語は？',
    answers: [ 'some', 'any', 'many', 'a'],
    correct: 'any',
    explanation: '否定文や疑問文では、some の代わりに any を使うのが一般的です。',
    level: 1
  },
  {
    question: ' "He is one of the (   ) players in the team." カッコ内に入る最も適切な単語は？',
    answers: [ 'good', 'better', 'best', 'well'],
    correct: 'best',
    explanation: 'one of the + 最上級 + 複数名詞 で「最も〜な…の一つ」という意味になります。',
    level: 2
  },
  {
    question: ' "I am thinking of (   ) abroad." カッコ内に入る最も適切な単語は？',
    answers: [ 'study', 'to study', 'studying', 'studied'],
    correct: 'studying',
    explanation: 'of は前置詞なので、後ろには名詞または動名詞(-ing)がきます。',
    level: 2
  },
  {
    question: ' "The news made her (   )." カッコ内に入る、「彼女を悲しませた」という意味にするための最も適切な単語は？',
    answers: [ 'sad', 'sadly', 'saddest', 'sadness'],
    correct: 'sad',
    explanation: 'make + 目的語 + 形容詞 で「（目的語）を〜な状態にさせる」という意味になります。',
    level: 3
  },
  {
    question: ' "I have never heard of such a thing." の意味は？',
    answers: [ 'そんなことは聞いたことがない', 'そんなことは言ったことがない', 'そんなことは見たことがない', 'そんなことは考えたことがない'],
    correct: 'そんなことは聞いたことがない',
    explanation: 'hear of ~ で「〜のことを聞く、噂に聞く」という意味です。現在完了形の経験用法です。',
    level: 3
  },
  {
    question: ' "Please tell me when (   )." カッコ内に入る、「いつ出発すればよいか」という意味にするための最も適切な単語は？',
    answers: [ 'to start', 'start', 'starting', 'started'],
    correct: 'to start',
    explanation: '「疑問詞 + to不定詞」の形で、名詞句を作ります。',
    level: 2
  },
  {
    question: ' "He is able to speak French." とほぼ同じ意味の文は？',
    answers: [ 'He can speak French.', 'He must speak French.', 'He will speak French.', 'He may speak French.'],
    correct: 'He can speak French.',
    explanation: 'be able to ~ は can とほぼ同じで「〜することができる」という能力や可能性を表します。',
    level: 2
  },
  {
    question: ' "I have two brothers. One is a doctor, and (   ) is a teacher." カッコ内に入る最も適切な単語は？',
    answers: [ 'another', 'other', 'the other', 'others'],
    correct: 'the other',
    explanation: '2つのうち「一つは〜で、もう一つは…」という場合、the other を使います。',
    level: 2
  },
  {
    question: ' "I am so tired (   ) I can\'t walk." カッコ内に入る最も適切な単語は？',
    answers: [ 'so', 'and', 'but', 'that'],
    correct: 'that',
    explanation: 'so ... that ~ で「とても…なので〜だ」という結果を表す構文です。',
    level: 2
  },
  {
    question: ' "I prefer walking (   ) taking a bus." カッコ内に入る最も適切な前置詞は？',
    answers: [ 'than', 'to', 'for', 'by'],
    correct: 'to',
    explanation: 'prefer A to B で「BよりもAを好む」という意味になります。than は使わないので注意が必要です。',
    level: 3
  },
  {
    question: ' "It is likely (   ) it will rain." カッコ内に入る最も適切な単語は？',
    answers: [ 'if', 'that', 'to', 'what'],
    correct: 'that',
    explanation: 'It is likely that ... で「…しそうだ」「…の可能性が高い」という意味の構文です。',
    level: 3
  },
  {
    question: ' "He is said (   ) a genius." カッコ内に入る最も適切な単語は？',
    answers: [ 'be', 'to be', 'being', 'is'],
    correct: 'to be',
    explanation: 'S is said to be ... で「Sは…だと言われている」という意味の構文です。',
    level: 3
  },
  {
    question: ' "I have my hair (   ) once a month." カッコ内に入る最も適切な単語は？',
    answers: [ 'cut', 'to cut', 'cutting', 'cuts'],
    correct: 'cut',
    explanation: 'have + 目的語 + 過去分詞 で「（目的語）を〜してもらう」という使役の意味を表します。cut は原形・過去形・過去分詞形がすべて同じ形です。',
    level: 3
  },
  {
    question: ' "Not only he but also I (   ) wrong." カッコ内に入る最も適切な単語は？',
    answers: [ 'am', 'is', 'are', 'be'],
    correct: 'am',
    explanation: 'Not only A but also B が主語の場合、動詞は B に合わせます。この文では I に合わせて am を使います。',
    level: 3
  },
  {
    question: ' "Take an umbrella with you (   ) it rains." カッコ内に入る、「雨が降る場合に備えて」という意味にするための最も適切な単語は？',
    answers: [ 'if', 'when', 'in case', 'unless'],
    correct: 'in case',
    explanation: 'in case ... で「…する場合に備えて」という意味になります。if は「もし（実際に）…ならば」という条件を表します。',
    level: 3
  },
  {
    question: ' "I remember (   ) him before." カッコ内に入る、「以前彼に会ったことを覚えている」という意味にするための最も適切な単語は？',
    answers: [ 'see', 'to see', 'seeing', 'saw'],
    correct: 'seeing',
    explanation: 'remember ~ing で「（過去に）〜したことを覚えている」という意味になります。remember to ~ は「（未来のこととして）忘れずに〜する」という意味です。',
    level: 2
  },
  {
    question: ' "The problem was difficult to solve." の "to solve" はどの用法？',
    answers: [ '名詞的用法', '形容詞的用法', '副詞的用法', '動名詞'],
    correct: '副詞的用法',
    explanation: '形容詞 difficult を修飾し、「解くのが難しい」という意味になっているため、to不定詞の副詞的用法です。',
    level: 2
  },
  {
    question: ' "I wish I (   ) a bird." カッコ内に入る最も適切な単語は？',
    answers: [ 'am', 'was', 'were', 'be'],
    correct: 'were',
    explanation: '現在の事実とは異なる願望を表す仮定法過去では、be動詞は主語に関わらず were を使うのが原則です。',
    level: 3
  },
  {
    question: ' "He is three years (   ) to me." カッコ内に入る、「私より3歳年上だ」という意味にするための最も適切な単語は？',
    answers: [ 'senior', 'older', 'elder', 'junior'],
    correct: 'senior',
    explanation: 'senior to ~ で「〜より年上だ」という意味になります。junior to ~ は「〜より年下だ」です。older than ~ とも言えますが、to を使う場合は senior/junior を使います。',
    level: 3
  },
  {
    question: ' "The population of Japan is larger than (   ) of Australia." カッコ内に入る最も適切な単語は？',
    answers: [ 'it', 'that', 'one', 'this'],
    correct: 'that',
    explanation: '前に出てきた名詞 (The population) の繰り返しを避けるために that を使います。複数形の名詞の場合は those を使います。',
    level: 3
  },
  {
    question: ' "It is no use (   ) over spilt milk." カッコ内に入る最も適切な単語は？',
    answers: [ 'cry', 'to cry', 'crying', 'cried'],
    correct: 'crying',
    explanation: 'It is no use ~ing で「〜しても無駄だ」という意味の定型表現です。「覆水盆に返らず」ということわざです。',
    level: 3
  },
  {
    question: ' "He seems to (   ) rich." カッコ内に入る最も適切な単語は？',
    answers: [ 'be', 'is', 'was', 'being'],
    correct: 'be',
    explanation: 'seem to ~ で「〜のように思われる」「〜らしい」という意味になります。to の後ろは動詞の原形です。',
    level: 2
  },
  {
    question: ' "I am busy (   ) my homework." カッコ内に入る最も適切な単語は？',
    answers: [ 'do', 'doing', 'to do', 'with'],
    correct: 'doing',
    explanation: 'be busy ~ing で「〜するのに忙しい」という意味の定型表現です。',
    level: 2
  },
  {
    question: ' "I can hardly believe it." の "hardly" の意味は？',
    answers: [ '一生懸命に', 'ほとんど〜ない', '硬く', '難しく'],
    correct: 'ほとんど〜ない',
    explanation: 'hardly は「ほとんど〜ない」という意味の準否定語です。「ほとんど信じられない」という意味になります。',
    level: 3
  },
  {
    question: ' "I would rather stay home (   ) go out." カッコ内に入る最も適切な単語は？',
    answers: [ 'to', 'than', 'for', 'but'],
    correct: 'than',
    explanation: 'would rather A than B で「BするよりもむしろAしたい」という意味になります。',
    level: 3
  },
  {
    question: ' "The number of students (   ) increasing." カッコ内に入る最も適切な単語は？',
    answers: [ 'is', 'are', 'be', 'have'],
    correct: 'is',
    explanation: 'The number of ~（〜の数）が主語の場合、単数扱いになります。A number of ~（たくさんの〜）が主語の場合は複数扱いになります。',
    level: 3
  },
  {
    question: ' "I am looking for my keys." の "look for" の意味は？',
    answers: [ '〜を調べる', '〜の世話をする', '〜を尊敬する', '〜を探す'],
    correct: '〜を探す',
    explanation: 'look for ~ で「〜を探す」という意味の句動詞です。',
    level: 1
  },
  {
    question: ' "He is used to driving on the left." の意味は？',
    answers: [ '彼は左側で運転したものだった', '彼は左側で運転することに慣れている', '彼は左側で運転するために使われる', '彼は左側で運転する予定だ'],
    correct: '彼は左側で運転することに慣れている',
    explanation: 'be used to ~ing で「〜することに慣れている」という意味です。used to ~ (原形) は「以前は〜したものだった」という過去の習慣を表します。',
    level: 3
  },
  {
    question: ' "This is the very book I was looking for." の "very" の意味は？',
    answers: [ 'とても', 'まさしくその', '唯一の', '高価な'],
    correct: 'まさしくその',
    explanation: 'the very + 名詞 で、名詞を強調し「まさしくその〜」という意味になります。',
    level: 3
  },
  {
    question: ' "He is, so to speak, a walking dictionary." の "so to speak" の意味は？',
    answers: [ '実を言うと', '言うまでもなく', 'いわば', 'つまり'],
    correct: 'いわば',
    explanation: 'so to speak は「いわば」「言ってみれば」という意味の挿入句です。',
    level: 3
  },
  {
    question: ' "I have no idea what to do." の "have no idea" の意味は？',
    answers: [ '良い考えがない', '何もする必要がない', '全くわからない', '興味がない'],
    correct: '全くわからない',
    explanation: 'have no idea は I don\'t know を強調した表現で、「全くわからない」「見当もつかない」という意味です。',
    level: 2
  },
  {
    question: ' "It goes without saying that health is important." の "It goes without saying that" の意味は？',
    answers: [ '〜だと言われている', '〜だとは限らない', '〜は言うまでもない', '〜だとは驚きだ'],
    correct: '〜は言うまでもない',
    explanation: '「健康が重要であることは言うまでもない」という意味の定型表現です。',
    level: 3
  },
  {
    question: ' "He is anything but a gentleman." の "anything but" の意味は？',
    answers: [ '〜以外の何でもない', '決して〜ではない', '〜に他ならない', '〜ばかり'],
    correct: '決して〜ではない',
    explanation: 'anything but ~ は「決して〜ではない」という強い否定を表します。「彼は決して紳士などではない」という意味です。nothing but ~ は「〜にすぎない」という意味になります。',
    level: 3
  },
  {
    question: ' "I could not help laughing." の "cannot help ~ing" の意味は？',
    answers: [ '〜するのを手伝えない', '〜せずにはいられない', '〜すべきではない', '〜する必要はない'],
    correct: '〜せずにはいられない',
    explanation: '「笑わずにはいられなかった」という意味の定型表現です。',
    level: 3
  },
  {
    question: ' "I was born in 1990." の "born" の原形は？',
    answers: [ 'bear', 'bore', 'born', 'bearing' ],
    correct: 'bear',
    explanation: ' "be born" は「生まれる」という意味ですが、動詞 "bear" (産む、耐える) の過去分詞形です。',
    level: 2
  },
  {
    question: '次のうち、発音が他の3つと異なるものはどれ？',
    answers: [ 'c<u>u</u>t', 'b<u>u</u>s', 's<u>u</u>n', 'p<u>u</u>t' ],
    correct: 'put',
    explanation: 'cut, bus, sun の "u" は [ʌ] と発音しますが、put の "u" は [ʊ] と発音します。',
    level: 1
  },
  {
    question: ' "It is fine today, (   ) it?" カッコ内に入る最も適切な付加疑問は？',
    answers: [ 'is it', 'is not it', 'isn\'t it', 'does it' ],
    correct: 'isn\'t it',
    explanation: '前の文が肯定文の場合、付加疑問は否定形になります。be動詞の文なので、be動詞を使います。',
    level: 2
  },
  {
    question: ' "I have nothing to do with it." の意味は？',
    answers: [ '私はそれをする時間がない', '私はそれとは何の関係もない', '私はそれについて何も知らない', '私はそれをするのが嫌だ' ],
    correct: '私はそれとは何の関係もない',
    explanation: ' "have nothing to do with ~" で「〜とは無関係である」という意味の定型表現です。',
    level: 3
  },
  {
    question: ' "He is used to (   ) alone." カッコ内に入る最も適切な単語は？',
    answers: [ 'live', 'living', 'lived', 'to live' ],
    correct: 'living',
    explanation: ' "be used to ~ing" で「〜することに慣れている」という意味になります。この to は前置詞なので、後ろには動名詞がきます。',
    level: 3
  },
  {
    question: ' "Could you tell me the way to the station?" に対する返答として、最も自然なものは？',
    answers: [ 'Yes, I could.', 'Go straight and turn left.', 'No, you couldn\'t.', 'The station is over there.' ],
    correct: 'Go straight and turn left.',
    explanation: '道を尋ねられているので、具体的な道順を教えるのが最も自然な返答です。"The station is over there." も可能ですが、道順を尋ねる質問にはより詳しい説明が期待されます。',
    level: 1
  },
  {
    question: ' "I\'m afraid I can\'t." の "I\'m afraid" の意味合いとして最も近いものは？',
    answers: [ '怖いです', '残念ながら', 'たぶん', '心配です' ],
    correct: '残念ながら',
    explanation: ' "I\'m afraid" は、相手の期待に沿えないことや、悪い知らせを伝えるときに使われる丁寧な前置きの言葉で、「残念ながら〜です」という意味合いになります。',
    level: 2
  },
  {
    question: ' "He is a man (   ) I respect." カッコ内に入る関係代名詞として、省略可能なものは？',
    answers: [ 'who', 'whom', 'whose', 'which' ],
    correct: 'whom',
    explanation: '目的格の関係代名詞(whom, which, that)は省略することができます。この文では "I respect him" の him の代わりなので、目的格の whom (または who/that) が入ります。',
    level: 3
  },
  {
    question: ' "It takes about ten minutes to walk to school." の意味は？',
    answers: [ '学校まで歩いて10分かかった', '学校まで歩いて10分かかるだろう', '学校まで歩いて約10分かかります', '学校まで歩いて10分以上かかる' ],
    correct: '学校まで歩いて約10分かかります',
    explanation: ' "It takes + 時間 + to 不定詞" で「〜するのに（時間）がかかる」という意味になります。"about" は「約」という意味です。',
    level: 1
  },
  {
    question: ' "I have already finished my homework." を疑問文にしなさい。',
    answers: [ 'Do you already finish your homework?', 'Have you already finished your homework?', 'Have you finished your homework yet?', 'Did you finish your homework yet?' ],
    correct: 'Have you finished your homework yet?',
    explanation: '現在完了形の疑問文は "Have/Has + 主語 + 過去分詞 ...?" の形です。疑問文では already の代わりに文末に yet を使うのが一般的です。',
    level: 3
  },
  {
    question: ' "I don\'t like summer. My brother doesn\'t like it, (   )." カッコ内に入る最も適切な単語は？',
    answers: [ 'too', 'also', 'either', 'neither' ],
    correct: 'either',
    explanation: '否定文に対して「〜もまた…ない」と同意する場合は、文末に either を使います。肯定文の場合は too を使います。',
    level: 2
  },
  {
    question: ' "He is poor, but he is happy." を "Though" を使って書き換えた文は？',
    answers: [ 'Though he is poor, but he is happy.', 'He is happy, though he is poor.', 'Though he is poor, he is happy.', 'BとCの両方' ],
    correct: 'BとCの両方',
    explanation: 'Though（〜だけれども）は接続詞で、文頭にも文中にも置くことができます。Though を使う場合、but は不要です。',
    level: 2
  },
  {
    question: ' "I saw him (   ) the street." カッコ内に入る、「通りを渡っている」という意味にするための最も適切な単語は？',
    answers: [ 'cross', 'to cross', 'crossed', 'crossing' ],
    correct: 'crossing',
    explanation: '知覚動詞 (see, hear, feelなど) + 目的語 + 原形不定詞/現在分詞 の形で、「Oが〜するのを見る」という意味になります。crossing を使うと、渡っている最中という進行中の動作を強調します。cross も文法的には可能です。',
    level: 3
  },
  {
    question: ' "I have no money with me." とほぼ同じ意味の文は？',
    answers: [ 'I don\'t have some money with me.', 'I don\'t have any money with me.', 'I have a few money with me.', 'I have little money with me.' ],
    correct: 'I don\'t have any money with me.',
    explanation: ' "no + 名詞" は "not ... any + 名詞" と書き換えることができます。',
    level: 1
  },
  {
    question: ' "It\'s time you (   ) to bed." カッコ内に入る最も適切な単語は？',
    answers: [ 'go', 'goes', 'went', 'have gone' ],
    correct: 'went',
    explanation: ' "It\'s time + 仮定法過去" の形で、「もう〜する時間だ」という意味になります。動詞は過去形を使います。',
    level: 3
  },
  {
    question: ' "He is two years older than I." とほぼ同じ意味の文は？',
    answers: [ 'He is two years senior to me.', 'I am two years junior to him.', 'He is older than I by two years.', 'すべて' ],
    correct: 'すべて',
    explanation: 'すべて「彼は私より2歳年上だ」という意味を表します。senior/junior は to を使い、than は使いません。',
    level: 3
  },
  {
    question: ' "I want something (   ) to drink." カッコ内に入る最も適切な単語は？',
    answers: [ 'cold', 'coldly', 'colder', 'coldest' ],
    correct: 'cold',
    explanation: '-thing, -body, -one で終わる代名詞は、形容詞が後ろから修飾します。',
    level: 2
  },
  {
    question: ' "I will wait here until he (   )." カッコ内に入る最も適切な単語は？',
    answers: [ 'come', 'comes', 'will come', 'came' ],
    correct: 'comes',
    explanation: '時や条件を表す副詞節 (when, if, until, beforeなど) の中では、未来のことでも現在形を使います。主語が he なので -s が付きます。',
    level: 2
  },
  {
    question: ' "I can\'t stand this noise." の "can\'t stand" の意味は？',
    answers: [ '立つことができない', '理解できない', '我慢できない', '止めることができない' ],
    correct: '我慢できない',
    explanation: ' "can\'t stand ~" で「〜に我慢できない」「〜はうんざりだ」という意味の口語表現です。',
    level: 2
  },
  {
    question: ' "He must have been ill." の意味は？',
    answers: [ '彼は病気にちがいない', '彼は病気だったにちがいない', '彼は病気のはずがない', '彼は病気だったかもしれない' ],
    correct: '彼は病気だったにちがいない',
    explanation: ' "must have + 過去分詞" で、過去の事柄に対する確信の高い推量（〜だったにちがいない）を表します。',
    level: 3
  },
  {
    question: ' "What do you do?" は何を尋ねる質問？',
    answers: [ '今何をしているか', '職業', '趣味', '週末の予定' ],
    correct: '職業',
    explanation: ' "What do you do?" は職業を尋ねる定番の表現です。「今何をしているか」は "What are you doing?" です。',
    level: 1
  },
  {
    question: ' "I\'d like to make a reservation." の "reservation" の意味は？',
    answers: [ '注文', '予約', '支払い', 'お願い' ],
    correct: '予約',
    explanation: 'make a reservation で「予約する」という意味になります。ホテルやレストランなどで使われます。',
    level: 1
  },
  {
    question: ' "He is said to have been a great musician." の意味は？',
    answers: [ '彼は偉大な音楽家だと言われている', '彼は偉大な音楽家だったと言われている', '彼は偉大な音楽家になるだろうと言われている', '彼は偉大な音楽家だと言った' ],
    correct: '彼は偉大な音楽家だったと言われている',
    explanation: ' "S is said to have + 過去分詞" の形で、「Sは〜だったと言われている」という、過去の事実についての現在の評判を表します。',
    level: 3
  },
  {
    question: ' "I have my car (   ) every year." カッコ内に入る最も適切な単語は？',
    answers: [ 'check', 'to check', 'checking', 'checked' ],
    correct: 'checked',
    explanation: ' "have + 目的語 + 過去分詞" で「（目的語）を〜してもらう」という意味になります。車はチェックされる側なので、過去分詞を使います。',
    level: 3
  },
  {
    question: ' "He, as well as you, (   ) responsible for it." カッコ内に入る最も適切な単語は？',
    answers: [ 'is', 'are', 'be', 'am' ],
    correct: 'is',
    explanation: ' "A as well as B" が主語の場合、動詞は A に合わせるのが原則です。この文では He に合わせて is を使います。',
    level: 3
  },
  {
    question: ' "It is no wonder that he is angry." の "It is no wonder that" の意味は？',
    answers: [ '〜なのは驚きだ', '〜なのは不思議ではない', '〜なのは残念だ', '〜なのはあり得ない' ],
    correct: '〜なのは不思議ではない',
    explanation: '「彼が怒っているのも不思議ではない」「彼が怒るのももっともだ」という意味の定型表現です。',
    level: 3
  },
  {
    question: ' "I regret (   ) such a thing." カッコ内に入る、「あんなことを言ったのを後悔している」という意味にするための最も適切な単語は？',
    answers: [ 'say', 'to say', 'saying', 'said' ],
    correct: 'saying',
    explanation: 'regret ~ing で「（過去に）〜したことを後悔する」という意味になります。regret to say は「残念ながら〜だと言う」という意味です。',
    level: 2
  },
  {
    question: ' "He is by no means a fool." の "by no means" の意味は？',
    answers: [ '決して〜ではない', 'あらゆる点で', 'どう見ても', '間違いなく' ],
    correct: '決して〜ではない',
    explanation: ' "by no means" は "not at all" と同じ意味の強い否定を表す副詞句です。「彼は決して愚か者ではない」という意味になります。',
    level: 3
  },
  {
    question: ' "I have to hand in my report by tomorrow." の "hand in" の意味は？',
    answers: [ '手伝う', '手渡す', '提出する', '諦める' ],
    correct: '提出する',
    explanation: ' "hand in" は「（レポートなどを）提出する」という意味の句動詞です。 "submit" と同じ意味で使われます。',
    level: 2
  },
  {
    question: ' "This is a picture (   ) by my sister." カッコ内に入る最も適切な単語は？',
    answers: [ 'paint', 'painting', 'painted', 'to paint' ],
    correct: 'painted',
    explanation: '過去分詞が後ろから名詞 (a picture) を修飾する形です。「私の姉によって描かれた写真」という意味になります。',
    level: 2
  },
  {
    question: ' "How come you are so late?" の "How come" の意味は？',
    answers: [ 'どうやって', 'なぜ', 'いつ', 'どこで' ],
    correct: 'なぜ',
    explanation: ' "How come ...?" は "Why ...?" と同じ意味ですが、より口語的な表現です。後ろの語順が "How come + 主語 + 動詞 ...?" となるのが特徴です。',
    level: 2
  },
  {
    question: ' "I have a few friends." と "I have few friends." の意味の違いは？',
    answers: [ '意味は同じ', 'a few は「少しはいる」、few は「ほとんどいない」', 'a few は「ほとんどいない」、few は「少しはいる」', 'a few は数えられない名詞に使う' ],
    correct: 'a few は「少しはいる」、few は「ほとんどいない」',
    explanation: 'a が付くと肯定的（少しはある）、付かないと否定的（ほとんどない）な意味になります。little / a little も同様です。',
    level: 2
  },
  {
    question: ' "I am supposed to meet him at six." の "be supposed to" の意味は？',
    answers: [ '〜することになっている', '〜できるはずだ', '〜したいと思う', '〜しなければならない' ],
    correct: '〜することになっている',
    explanation: '予定や義務、期待されていることなどを表し、「〜することになっている」「〜するはずだ」という意味で使われます。',
    level: 3
  },
  {
    question: ' "I can\'t figure out this problem." の "figure out" の意味は？',
    answers: [ '〜を計算する', '〜を想像する', '〜を理解する', '〜を無視する' ],
    correct: '〜を理解する',
    explanation: ' "figure out" は「〜を理解する」「〜を解明する」という意味の句動詞です。',
    level: 2
  },
  {
    question: ' "He may well be proud of his son." の "may well" の意味は？',
    answers: [ '〜するかもしれない', '〜するほうがよい', '〜するのはもっともだ', '〜してたぶん' ],
    correct: '〜するのはもっともだ',
    explanation: ' "may well ~" で「〜するのももっともだ」「たぶん〜だろう」という意味になります。',
    level: 3
  },
  {
    question: ' "I\'m calling to ask you a favor." の "favor" の意味は？',
    answers: [ '味', '人気', '親切な行為、お願い', '香り' ],
    correct: '親切な行為、お願い',
    explanation: ' "ask someone a favor" で「人にお願い事をする」という意味の定型表現です。',
    level: 2
  },
  {
    question: ' "He is second to none in English." の "second to none" の意味は？',
    answers: [ '誰にも劣らない', '二番目ではない', '誰とも話さない', '二番目にすぎない' ],
    correct: '誰にも劣らない',
    explanation: '「誰に対しても二番目ではない」ということから、「誰にも劣らない」「最高だ」という意味になります。',
    level: 3
  },
  {
    question: ' "I\'m broke." はどのような意味？',
    answers: [ '壊れた', '疲れた', 'お腹がすいた', '一文無しだ' ],
    correct: '一文無しだ',
    explanation: ' "broke" は形容詞で、「お金がない」「破産した」という意味の口語表現です。',
    level: 2
  },
  {
    question: ' "I\'ll keep my fingers crossed." はどのような意味？',
    answers: [ '指を組んで待つ', '幸運を祈る', '黙っている', '約束を守る' ],
    correct: '幸運を祈る',
    explanation: '人差し指と中指を交差させるジェスチャーから来ており、「幸運を祈っているよ」という意味で使われる表現です。',
    level: 3
  },
  {
    question: ' "It\'s up to you." はどのような意味？',
    answers: [ 'あなた次第です', 'あなたの番です', 'あなたのおかげです', 'あなたの上にあります' ],
    correct: 'あなた次第です',
    explanation: '決定を相手に委ねるときに使う表現で、「君に任せるよ」「君が決めていいよ」という意味になります。',
    level: 1
  },
  {
    question: ' "I have butterflies in my stomach." はどのような気持ちを表す？',
    answers: [ 'お腹がすいている', 'お腹をこわしている', 'わくわく・ドキドキしている', '怒っている' ],
    correct: 'わくわく・ドキドキしている',
    explanation: '胃の中に蝶が飛んでいるようなそわそわした感覚から、発表の前など、緊張や興奮で落ち着かない気持ちを表します。',
    level: 3
  },
  {
    question: ' "Let\'s call it a day." はどのような意味？',
    answers: [ 'その日を祝おう', '今日はこの辺で終わりにしよう', 'その日の名前を決めよう', '電話しよう' ],
    correct: '今日はこの辺で終わりにしよう',
    explanation: '仕事や作業などを切り上げる時に使う表現です。',
    level: 2
  },
  {
    question: ' "I\'m all ears." はどのような意味？',
    answers: [ '耳が痛い', '耳が大きい', 'ぜひ聞きたい', '何も聞こえない' ],
    correct: 'ぜひ聞きたい',
    explanation: '「全身を耳にして聞いていますよ」というニュアンスで、「ぜひ聞かせてください」「しっかり聞いています」という意味になります。',
    level: 2
  },
  {
    question: ' "break a leg" はどのような意味？',
    answers: [ '足を折れ', '頑張って！', '休憩しよう', '失敗しろ' ],
    correct: '頑張って！',
    explanation: '舞台に出る役者に対して、逆のことを言って幸運を祈るという迷信から生まれた表現です。「Good luck!」と同じ意味で使われます。',
    level: 3
  },
  {
    question: ' "It\'s a piece of cake." はどのような意味？',
    answers: ['これはケーキです', 'とても美味しい', '朝飯前だよ（とても簡単だ）', '甘い話だ' ],
    correct: '朝飯前だよ（とても簡単だ）',
    explanation: '「ケーキ一切れ食べるのと同じくらい簡単だ」ということから、「楽勝だよ」「お茶の子さいさい」という意味で使われます。',
    level: 2
  },
  {
    question: ' "I feel under the weather." はどのような意味？',
    answers: [ '気分が良い', '天気が悪い', '気分が悪い、体調が良くない', 'プレッシャーを感じる' ],
    correct: '気分が悪い、体調が良くない',
    explanation: '天候が悪いと体調も崩しやすいことから、「少し体調が悪い」「気分がすぐれない」という意味で使われます。',
    level: 3
  },
  {
    question: ' "once in a blue moon" はどのような意味？',
    answers: [ '青い月の夜に', '毎晩', 'ごくまれに', '満月の夜に' ],
    correct: 'ごくまれに',
    explanation: '「ブルームーン」は、ひと月に2回満月があるときの2回目の満月のことで、非常に珍しい現象です。そこから「めったにないこと」を意味します。',
    level: 3
  },
  {
    question: ' "spill the beans" はどのような意味？',
    answers: [ '豆をこぼす', '秘密を漏らす', '食事を始める', 'お金を無駄遣いする' ],
    correct: '秘密を漏らす',
    explanation: 'うっかり秘密をしゃべってしまう、暴露してしまう、という意味のイディオムです。',
    level: 3
  },
  {
    question: ' "hit the books" はどのような意味？',
    answers: [ '本を叩く', '本を売る', '猛勉強する', '読書を始める' ],
    correct: '猛勉強する',
    explanation: '特に試験などのために、集中的に一生懸命勉強することを意味します。',
    level: 2
  },
  {
    question: ' "When pigs fly" はどのような意味？',
    answers: [ '豚が飛ぶとき', '絶対にあり得ない', '奇跡が起きたら', 'すぐに' ],
    correct: '絶対にあり得ない',
    explanation: '「豚が空を飛ぶなんてあり得ない」ということから、「決して起こらないこと」を強調する表現です。',
    level: 3
  },
  {
    question: ' "The ball is in your court." はどのような意味？',
    answers: [ 'ボールはあなたのコートにある', '次はあなたの番だ', 'あなたが有利だ', 'あなたが責任を持つべきだ' ],
    correct: '次はあなたの番だ',
    explanation: 'テニスで相手のコートにボールを打ち返した状況から、次に行動を起こしたり決断したりするのは「あなたの方だ」という意味で使われます。',
    level: 3
  },
  {
    question: ' "bite the bullet" はどのような意味？',
    answers: [ '弾丸を噛む', '歯を食いしばって耐える', '食事をする', '早撃ちする' ],
    correct: '歯を食いしばって耐える',
    explanation: '昔、麻酔なしで手術する際に兵士が痛みをこらえるために弾丸を噛んだ、という話から、「困難な状況に耐える」「我慢する」という意味になりました。',
    level: 3
  },
  {
    question: ' "get out of hand" はどのような意味？',
    answers: [ '手を出す', '手を引く', '手に負えなくなる', '手に入れる' ],
    correct: '手に負えなくなる',
    explanation: '状況などがコントロールできなくなり、収拾がつかなくなることを意味します。',
    level: 3
  },
  {
    question: ' "go cold turkey" はどのような意味？',
    answers: [ '冷たい七面鳥を食べる', '（悪い習慣を）きっぱりとやめる', '鳥肌が立つ', '臆病になる' ],
    correct: '（悪い習慣を）きっぱりとやめる',
    explanation: '薬物や喫煙、飲酒などの依存性のある習慣を、徐々にではなく突然、完全に断つことを意味します。',
    level: 3
  },
  {
    question: ' "on the ball" はどのような意味？',
    answers: [ 'ボールの上にいる', '状況をよく理解している、仕事ができる', '遊び好きだ', 'スポーツが得意だ' ],
    correct: '状況をよく理解している、仕事ができる',
    explanation: 'スポーツでボールをしっかりコントロールしている様子から、機敏で、状況をよく把握して的確に行動できることを意味します。',
    level: 3
  },
  {
    question: ' "ring a bell" はどのような意味？',
    answers: [ 'ベルを鳴らす', '聞き覚えがある、ピンとくる', '警報を鳴らす', '電話をかける' ],
    correct: '聞き覚えがある、ピンとくる',
    explanation: '何かを聞いて、記憶の片隅にあったことが呼び覚まされるような感覚を表します。',
    level: 2
  },
  {
    question: ' "rule of thumb" はどのような意味？',
    answers: [ '親指のルール', '厳密な規則', '経験則、おおよその目安', '例外的なルール' ],
    correct: '経験則、おおよその目安',
    explanation: '科学的・数学的に厳密ではないが、経験上だいたい正しく、実用的な方法や基準を指します。',
    level: 3
  },
  {
    question: ' "sit on the fence" はどのような意味？',
    answers: [ 'フェンスに座る', '中立の立場をとる、日和見する', '危険な状況にいる', '休憩する' ],
    correct: '中立の立場をとる、日和見する',
    explanation: '二つの対立する意見や選択肢の間で、どちらにもつかずに態度を決めかねている様子を表します。',
    level: 3
  },
  {
    question: ' "take it with a grain of salt" はどのような意味？',
    answers: [ '塩をひとつまみ加える', '話半分に聞く、鵜呑みにしない', '真剣に受け止める', '味わって食べる' ],
    correct: '話半分に聞く、鵜呑みにしない',
    explanation: '聞いたこと全てを文字通り信じるのではなく、少し疑ってかかった方が良い、という意味で使われます。',
    level: 3
  },
  {
    question: ' "The whole nine yards" はどのような意味？',
    answers: [ '9ヤード全部', '何もかも全て', '長い道のり', '一部分' ],
    correct: '何もかも全て',
    explanation: '「全部、すっかり、何もかも」という意味で使われる口語表現です。語源は諸説あります。',
    level: 3
  },
  {
    question: ' "a blessing in disguise" はどのような意味？',
    answers: [ '変装した祝福', '不幸に見えて実は幸運なこと', '見せかけの幸運', '不幸中の幸い' ],
    correct: '不幸に見えて実は幸運なこと',
    explanation: '最初は悪いことだと思ったものが、後になってみるとかえって良い結果をもたらした、という状況を指します。「怪我の功名」に近いです。',
    level: 3
  },
  {
    question: ' "call it a night" はどのような意味？',
    answers: [ '夜と呼ぶ', '夜に電話する', '今日はもう寝る、活動を終える', '夜を徹して働く' ],
    correct: '今日はもう寝る、活動を終える',
    explanation: 'その日の夜の活動を終えて、寝ることにするときに使う表現です。"Let\'s call it a day." の夜バージョンです。',
    level: 2
  },
  {
    question: ' "get a second wind" はどのような意味？',
    answers: ['二度目の風を得る', '息切れする', '元気を取り戻す', '追い風が吹く' ],
    correct: '元気を取り戻す',
    explanation: '疲れていた状態から、再びエネルギーや活力が湧いてきて活動を続けられるようになることを意味します。',
    level: 3
  },
  {
    question: ' "go the extra mile" はどのような意味？',
    answers: [ '余分に1マイル行く', '期待以上の努力をする', '遠回りする', '無駄な努力をする' ],
    correct: '期待以上の努力をする',
    explanation: '求められている以上のこと、または特別な努力をすることを意味します。',
    level: 3
  },
  {
    question: ' "hang in there" はどのような意味？',
    answers: [ 'そこにぶら下がる', '頑張れ、あきらめないで', 'ちょっと待って', '様子を見る' ],
    correct: '頑張れ、あきらめないで',
    explanation: '困難な状況にいる人に対して、励ますときに使う口語表現です。',
    level: 2
  },
  {
    question: ' "jump on the bandwagon" はどのような意味？',
    answers: [ '楽隊の車に飛び乗る', '時流に乗る、人気のある方に付く', '流行遅れになる', '先頭に立つ' ],
    correct: '時流に乗る、人気のある方に付く',
    explanation: '勝ち馬に乗る、という日本語に近いです。多くの人が支持しているという理由で、自分もそれを支持し始めることを指します。',
    level: 3
  },
  {
    question: ' "pull someone\'s leg" はどのような意味？',
    answers: [ '誰かの足を引っ張る', '（冗談で）からかう', '誰かを助ける', '誰かを非難する' ],
    correct: '（冗談で）からかう',
    explanation: '悪意なく、冗談を言って相手をからかうことを意味します。日本語の「足を引っ張る（邪魔をする）」とは意味が異なります。',
    level: 3
  },
  {
    question: ' "speak of the devil" はどのような状況で使う？',
    answers: [ '悪魔について話すとき', '悪いことが起きたとき', '噂をすれば影が差す、と言わんばかりにその本人が現れたとき', '誰かを呪うとき' ],
    correct: '噂をすれば影が差す、と言わんばかりにその本人が現れたとき',
    explanation: 'ちょうどその人の噂話をしていたところに、当の本人が現れたときに使う決まり文句です。',
    level: 2
  },
  {
    question: ' "steal someone\'s thunder" はどのような意味？',
    answers: [ '誰かの雷を盗む', '手柄を横取りする', '大きな音を立てる', '注目を集める' ],
    correct: '手柄を横取りする',
    explanation: '他人が注目を集めたり賞賛されたりするはずだったアイデアや功績を、その人より先に発表したり実行したりして横取りすることを意味します。',
    level: 3
  },
  {
    question: ' "straight from the horse\'s mouth" はどのような意味？',
    answers: [ '馬の口からまっすぐに', '信頼できる情報筋から直接', 'ひどい口臭だ', '馬肉料理だ' ],
    correct: '信頼できる情報筋から直接',
    explanation: '競馬で馬主や騎手など内部の人間から直接情報を得る、というイメージから、「本人から直接」「確かな筋から」という意味で使われます。',
    level: 3
  },
  {
    question: ' "The last straw" はどのような意味？',
    answers: [ '最後の麦わら', '我慢の限界を超えさせる最後の出来事', '最後のチャンス', '一縷の望み' ],
    correct: '我慢の限界を超えさせる最後の出来事',
    explanation: 'ラクダの背に藁を積んでいき、最後の1本で背骨が折れてしまう、という話から、積もり積もった不満を爆発させる最後のきっかけを指します。',
    level: 3
  },
  {
    question: ' "through thick and thin" はどのような意味？',
    answers: [ '厚いものと薄いものを通り抜けて', '良い時も悪い時も', 'やせたり太ったり', 'どんな天候でも' ],
    correct: '良い時も悪い時も',
    explanation: '森の中の茂みが厚い（thick）場所も薄い（thin）場所も通り抜ける、ということから、「どんな困難があっても」「良い時も悪い時も変わらず」という意味で使われます。',
    level: 3
  },
  {
    question: ' "You can say that again!" はどのような意味？',
    answers: [ 'もう一度言ってください', '全くその通りだ！', 'そんなこと言うな', '聞き取れませんでした' ],
    correct: '全くその通りだ！',
    explanation: '相手の意見に強く同意するときに使う表現です。「もう一度言ってもらいたいくらい、その通りだ」というニュアンスです。',
    level: 2
  },
  {
    question: ' "a dime a dozen" はどのような意味？',
    answers: [ '1ダース10セント', 'ありふれていて価値がない', 'とても安い', '12個で10セント' ],
    correct: 'ありふれていて価値がない',
    explanation: '10セント（a dime）も出せば1ダース（a dozen）も手に入る、ということから、「どこにでもあって珍しくない」「ありふれている」という意味で使われます。',
    level: 3
  },
  {
    question: ' "beat around the bush" はどのような意味？',
    answers: [ '茂みの周りを叩く', '遠回しな言い方をする', '問題の核心に迫る', '探し物をする' ],
    correct: '遠回しな言い方をする',
    explanation: '鳥などを茂みから追い出すために周りを叩く様子から、本題に直接触れるのを避けて、回りくどい話し方をすることを意味します。',
    level: 3
  }
];
