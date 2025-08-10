// typing-words.js

const WORDS = [
    // くだもの (31)
    { h: 'りんご', r: 'RINGO' }, { h: 'みかん', r: 'MIKAN' }, { h: 'いちご', r: 'ITIGO' },
    { h: 'ばなな', r: 'BANANA' }, { h: 'すいか', r: 'SUIKA' }, { h: 'めろん', r: 'MERON' },
    { h: 'ぶどう', r: 'BUDOU' }, { h: 'もも', r: 'MOMO' }, { h: 'れもん', r: 'REMON' },
    { h: 'ぱいなっぷる', r: 'PAINAPPURU' }, { h: 'きうい', r: 'KIUI' }, { h: 'さくらんぼ', r: 'SAKURANBO' },
    { h: 'かき', r: 'KAKI' }, { h: 'なし', r: 'NASI' }, { h: 'まんごー', r: 'MANGO-' },
    { h: 'ぶるーべりー', r: 'BURU-BERI-' }, { h: 'いちじく', r: 'ITIJIKU' }, { h: 'びわ', r: 'BIWA' },
    { h: 'ゆず', r: 'YUZU' }, { h: 'あんず', r: 'ANZU' }, { h: 'ざくろ', r: 'ZAKURO' },
    { h: 'くり', r: 'KURI' }, { h: 'あけび', r: 'AKEBI' }, { h: 'きんかん', r: 'KINKAN' },
    { h: 'ぐれーぷふるーつ', r: 'GURE-PUFURU-TU' }, { h: 'ぷらむ', r: 'PURAMU' }, { h: 'ようかん', r: 'YOUKAN' },
    { h: 'どらごんふるーつ', r: 'DORAGONHURU-TU' }, { h: 'らいち', r: 'RAITI' }, { h: 'ぱぱいや', r: 'PAPAIYA' },
    { h: 'はっさく', r: 'HASSAKU' },

    // どうぶつ (31)
    { h: 'いぬ', r: 'INU' }, { h: 'ねこ', r: 'NEKO' }, { h: 'うさぎ', r: 'USAGI' },
    { h: 'きりん', r: 'KIRIN' }, { h: 'ぞう', r: 'ZOU' }, { h: 'ぱんだ', r: 'PANDA' },
    { h: 'らいおん', r: 'RAION' }, { h: 'とら', r: 'TORA' }, { h: 'さる', r: 'SARU' },
    { h: 'うま', r: 'UMA' }, { h: 'ひつじ', r: 'HITUJI' }, { h: 'やぎ', r: 'YAGI' },
    { h: 'にわとり', r: 'NIWATORI' }, { h: 'あひる', r: 'AHIRU' }, { h: 'ぺんぎん', r: 'PENGIN' },
    { h: 'りす', r: 'RISU' }, { h: 'しか', r: 'SIKA' }, { h: 'いのしし', r: 'INOSISI' },
    { h: 'たぬき', r: 'TANUKI' }, { h: 'きつね', r: 'KITUNE' }, { h: 'くま', r: 'KUMA' },
    { h: 'ごりら', r: 'GORIRA' }, { h: 'らくだ', r: 'RAKUDA' }, { h: 'さい', r: 'SAI' },
    { h: 'かば', r: 'KABA' }, { h: 'しまうま', r: 'SIMAUMA' }, { h: 'かんがるー', r: 'KANGARU-' },
    { h: 'こあら', r: 'KOARA' }, { h: 'なまけもの', r: 'NAMAKEMONO' }, { h: 'あるぱか', r: 'ARUPAKA' },
    { h: 'ぺりかん', r: 'PERIKAN' },

    // うみのいきもの (21)
    { h: 'いるか', r: 'IRUKA' }, { h: 'くじら', r: 'KUJIRA' }, { h: 'かめ', r: 'KAME' },
    { h: 'かに', r: 'KANI' }, { h: 'えび', r: 'EBI' }, { h: 'たこ', r: 'TAKO' },
    { h: 'いか', r: 'IKA' }, { h: 'さかな', r: 'SAKANA' }, { h: 'さめ', r: 'SAME' },
    { h: 'くらげ', r: 'KURAGE' }, { h: 'ひとで', r: 'HITODE' }, { h: 'あしか', r: 'ASIKA' },
    { h: 'らっこ', r: 'RAKKO' }, { h: 'まんぼう', r: 'MANBOU' }, { h: 'ちんあなご', r: 'TINANAGO' },
    { h: 'まぐろ', r: 'MAGURO' }, { h: 'たい', r: 'TAI' }, { h: 'ひらめ', r: 'HIRAME' },
    { h: 'あんこう', r: 'ANKOU' }, { h: 'うに', r: 'UNI' },
    { h: 'ふぐ', r: 'FUGU' },

    // やさい (30)
    { h: 'とまと', r: 'TOMATO' }, { h: 'きゅうり', r: 'KYUURI' }, { h: 'にんじん', r: 'NINJIN' },
    { h: 'ぴーまん', r: 'PI-MAN' }, { h: 'たまねぎ', r: 'TAMANEGI' }, { h: 'じゃがいも', r: 'JAGAIMO' },
    { h: 'きのこ', r: 'KINOKO' }, { h: 'なす', r: 'NASU' }, { h: 'れんこん', r: 'RENKON' },
    { h: 'だいこん', r: 'DAIKON' }, { h: 'きゃべつ', r: 'KYABETU' }, { h: 'れたす', r: 'RETASU' },
    { h: 'はくさい', r: 'HAKUSAI' }, { h: 'ごぼう', r: 'GOBOU' }, { h: 'さつまいも', r: 'SATUMAIMO' },
    { h: 'かぼちゃ', r: 'KABOCYA' }, { h: 'とうもろこし', r: 'TOUMOROKOSI' }, { h: 'えだまめ', r: 'EDAMAME' },
    { h: 'ぶろっこりー', r: 'BUROKKORI-' }, { h: 'ほうれんそう', r: 'HOURENSOU' }, { h: 'たけのこ', r: 'TAKENOKO' },
    { h: 'しょうが', r: 'SYOUGA' }, { h: 'にんにく', r: 'NINNIKU' }, { h: 'ねぎ', r: 'NEGI' },
    { h: 'ごーや', r: 'GO-YA' },
    { h: 'もやし', r: 'MOYASI' }, { h: 'かぶ', r: 'KABU' }, { h: 'しそ', r: 'SISO' },
    { h: 'みずな', r: 'MIZUNA' }, { h: 'せろり', r: 'SERORI' },

    // たべもの (33)
    { h: 'ごはん', r: 'GOHAN' }, { h: 'ぱん', r: 'PAN' }, { h: 'おにぎり', r: 'ONIGIRI' },
    { h: 'かれー', r: 'KARE-' }, { h: 'らーめん', r: 'RA-MEN' }, { h: 'すし', r: 'SUSI' },
    { h: 'ぎゅうにゅう', r: 'GYUUNYUU' }, { h: 'けーき', r: 'KE-KI' }, { h: 'あいす', r: 'AISU' },
    { h: 'うどん', r: 'UDON' }, { h: 'そば', r: 'SOBA' }, { h: 'てんぷら', r: 'TENPURA' },
    { h: 'やきにく', r: 'YAKINIKU' }, { h: 'ぎょうざ', r: 'GYOUZA' }, { h: 'おむらいす', r: 'OMURAISU' },
    { h: 'すぱげってぃ', r: 'SUPAGETTHI' }, { h: 'はんばーぐ', r: 'HANBA-GU' }, { h: 'からあげ', r: 'KARAAGE' },
    { h: 'ちーず', r: 'TI-ZU' }, { h: 'よーぐると', r: 'YO-GURUTO' }, { h: 'ぷりん', r: 'PURIN' },
    { h: 'くっきー', r: 'KUKKI-' }, { h: 'ちょこれーと', r: 'CYOKORE-TO' }, { h: 'さしみ', r: 'SASIMI' },
    { h: 'みそしる', r: 'MISOSIRU' }, { h: 'すーぷ', r: 'SU-PU' }, { h: 'さらだ', r: 'SARADA' },
    { h: 'ぴざ', r: 'PIZA' }, { h: 'ほっとけーき', r: 'HOTTOKE-KI' }, { h: 'おこのみやき', r: 'OKONOMIYAKI' },
    { h: 'たこやき', r: 'TAKOYAKI' }, { h: 'もんじゃ', r: 'MONJA' }, { h: 'やきとり', r: 'YAKITORI' },

    // のりもの (25)
    { h: 'くるま', r: 'KURUMA' }, { h: 'でんしゃ', r: 'DENSYA' }, { h: 'ひこうき', r: 'HIKOUKI' },
    { h: 'ばす', r: 'BASU' }, { h: 'たくしー', r: 'TAKUSI-' }, { h: 'しんかんせん', r: 'SINKANSEN' },
    { h: 'ふね', r: 'FUNE' }, { h: 'じてんしゃ', r: 'JITENSYA' }, { h: 'しょうぼうしゃ', r: 'SYOUBOUSYA' },
    { h: 'ぱとかー', r: 'PATOKA-' }, { h: 'きゅうきゅうしゃ', r: 'KYUUKYUUSYA' }, { h: 'ろけっと', r: 'ROKETTO' },
    { h: 'へりこぷたー', r: 'HERIKOPUTA-' }, { h: 'せんすいかん', r: 'SENSUIKAN' }, { h: 'よっと', r: 'YOTTO' },
    { h: 'とらっく', r: 'TORAKKU' }, { h: 'ばいく', r: 'BAIKU' }, { h: 'ききゅう', r: 'KIKYUU' },
    { h: 'くれーんしゃ', r: 'KURE-NSYA' }, { h: 'ぶるどーざー', r: 'BURUDO-ZA-' }, { h: 'しょべるかー', r: 'SYOBERUKA-' },
    { h: 'ごみしゅうしゅうしゃ', r: 'GOMISYUUSYUUSYA' }, { h: 'みきさーしゃ', r: 'MIKISA-SYA' }, { h: 'すくーるばす', r: 'SUKU-RUBASU' },
    { h: 'もーたーぼーと', r: 'MO-TA-BO-TO' },

    // いえのなか (28)
    { h: 'いえ', r: 'IE' }, { h: 'へや', r: 'HEYA' }, { h: 'つくえ', r: 'TUKUE' },
    { h: 'いす', r: 'ISU' }, { h: 'てれび', r: 'TEREBI' }, { h: 'ほん', r: 'HON' },
    { h: 'えんぴつ', r: 'ENPITU' }, { h: 'かみ', r: 'KAMI' }, { h: 'とけい', r: 'TOKEI' },
    { h: 'べっど', r: 'BEDDO' }, { h: 'ふとん', r: 'FUTON' }, { h: 'まど', r: 'MADO' },
    { h: 'どあ', r: 'DOA' }, { h: 'れいぞうこ', r: 'REIZOUKO' }, { h: 'せんたくき', r: 'SENTAKUKI' },
    { h: 'そうじき', r: 'SOUJIKI' }, { h: 'だいどころ', r: 'DAIDOKORO' }, { h: 'おふろ', r: 'OFURO' },
    { h: 'といれ', r: 'TOIRE' }, { h: 'でんわ', r: 'DENWA' }, { h: 'ぱそこん', r: 'PASOKON' },
    { h: 'かぎ', r: 'KAGI' }, { h: 'かがみ', r: 'KAGAMI' }, { h: 'ごみばこ', r: 'GOMIBAKO' },
    { h: 'かいだん', r: 'KAIDAN' },
    { h: 'ふた', r: 'FUTA' }, { h: 'こたつ', r: 'KOTATU' }, { h: 'でんき', r: 'DENKI' },

    // しぜん (29)
    { h: 'たいよう', r: 'TAIYOU' }, { h: 'つき', r: 'TUKI' }, { h: 'ほし', r: 'HOSI' },
    { h: 'やま', r: 'YAMA' }, { h: 'かわ', r: 'KAWA' }, { h: 'うみ', r: 'UMI' },
    { h: 'そら', r: 'SORA' }, { h: 'くも', r: 'KUMO' }, { h: 'あめ', r: 'AME' },
    { h: 'ゆき', r: 'YUKI' }, { h: 'はな', r: 'HANA' }, { h: 'き', r: 'KI' },
    { h: 'かぜ', r: 'KAZE' }, { h: 'かみなり', r: 'KAMINARI' }, { h: 'にじ', r: 'NIJI' },
    { h: 'いけ', r: 'IKE' }, { h: 'もり', r: 'MORI' }, { h: 'いし', r: 'ISI' },
    { h: 'すな', r: 'SUNA' }, { h: 'しま', r: 'SIMA' }, { h: 'たき', r: 'TAKI' },
    { h: 'どうくつ', r: 'DOUKUTU' }, { h: 'さばく', r: 'SABAKU' }, { h: 'おか', r: 'OKA' },
    { h: 'たに', r: 'TANI' },
    { h: 'こけ', r: 'KOKE' }, { h: 'どろ', r: 'DORO' }, { h: 'みず', r: 'MIZU' },
    { h: 'たいふう', r: 'TAIFUU' },

    // いろ (15)
    { h: 'あか', r: 'AKA' }, { h: 'あお', r: 'AO' }, { h: 'きいろ', r: 'KIIRO' },
    { h: 'みどり', r: 'MIDORI' }, { h: 'むらさき', r: 'MURASAKI' }, { h: 'しろ', r: 'SIRO' },
    { h: 'くろ', r: 'KURO' }, { h: 'ぴんく', r: 'PINKU' }, { h: 'おれんじ', r: 'ORENJI' },
    { h: 'ちゃいろ', r: 'CYAIRO' }, { h: 'はいいろ', r: 'HAIIRO' }, { h: 'みずいろ', r: 'MIZUIRO' },
    { h: 'きみどり', r: 'KIMIDORI' }, { h: 'こんいろ', r: 'KONIRO' }, { h: 'きんいろ', r: 'KINIRO' },

    // むし (20)
    { h: 'かぶとむし', r: 'KABUTOMUSI' }, { h: 'くわがた', r: 'KUWAGATA' }, { h: 'ちょうちょ', r: 'CYOUCYO' },
    { h: 'とんぼ', r: 'TONBO' }, { h: 'せみ', r: 'SEMI' }, { h: 'ばった', r: 'BATTA' },
    { h: 'かまきり', r: 'KAMAKIRI' }, { h: 'てんとうむし', r: 'TENTOUMUSI' }, { h: 'あり', r: 'ARI' },
    { h: 'はち', r: 'HATI' }, { h: 'だんごむし', r: 'DANGOMUSI' }, { h: 'かたつむり', r: 'KATATUMURI' },
    { h: 'ほたる', r: 'HOTARU' }, { h: 'すずむし', r: 'SUZUMUSI' }, { h: 'こおろぎ', r: 'KOOROGI' },
    { h: 'あげはちょう', r: 'AGEHACYOU' }, { h: 'いもむし', r: 'IMOMUSI' }, { h: 'くも', r: 'KUMO' },
    { h: 'か', r: 'KA' }, { h: 'はえ', r: 'HAE' },

    // がっき (24)
    { h: 'ぴあの', r: 'PIANO' }, { h: 'ぎたー', r: 'GITA-' }, { h: 'たいこ', r: 'TAIKO' },
    { h: 'ふえ', r: 'HUE' }, { h: 'とらんぺっと', r: 'TORANPETTO' }, { h: 'ばいおりん', r: 'BAIORIN' },
    { h: 'すず', r: 'SUZU' }, { h: 'カスタネット', r: 'KASUTANETTO' }, { h: 'もっきん', r: 'MOKKIN' },
    { h: 'てっきん', r: 'TEKKIN' }, { h: 'どらむ', r: 'DORAMU' }, { h: 'しんばる', r: 'SINBARU' },
    { h: 'りこーだー', r: 'RIKO-DA-' }, { h: 'はーもにか', r: 'HA-MONIKA' }, { h: 'とろんぼーん', r: 'TORONBO-N' },
    { h: 'ちゅーば', r: 'CYU-BA' }, { h: 'ほるん', r: 'HORUN' }, { h: 'はーぷ', r: 'HA-PU' },
    { h: 'ちぇろ', r: 'CHERO' }, { h: 'さんかくきん', r: 'SANKAKUKIN' },
    { h: 'きーぼーど', r: 'KI-BO-DO' }, { h: 'さっくす', r: 'SAKKUSU' }, { h: 'くらりねっと', r: 'KURARINETTO' },
    { h: 'まらかす', r: 'MARAKASU' },

    // みにつけるもの (20)
    { h: 'ふく', r: 'FUKU' }, { h: 'ずぼん', r: 'ZUBON' }, { h: 'すかーと', r: 'SUKA-TO' },
    { h: 'ぼうし', r: 'BOUSI' }, { h: 'くつ', r: 'KUTU' }, { h: 'くつした', r: 'KUTUSITA' },
    { h: 'てぶくろ', r: 'TEBUKURO' }, { h: 'まふらー', r: 'MAFURA-' }, { h: 'めがね', r: 'MEGANE' },
    { h: 'かばん', r: 'KABAN' }, { h: 'しゃつ', r: 'SYATU' }, { h: 'せーたー', r: 'SE-TA-' },
    { h: 'こーと', r: 'KO-TO' }, { h: 'ぱんつ', r: 'PANTU' }, { h: 'さんだる', r: 'SANDARU' },
    { h: 'ながぐつ', r: 'NAGAGUTU' }, { h: 'ゆびわ', r: 'YUBIWA' }, { h: 'ねっくれす', r: 'NEKKURESU' },
    { h: 'うでどけい', r: 'UDEDOKEI' }, { h: 'べると', r: 'BERUTO' },

    // からだ (20)
    { h: 'あたま', r: 'ATAMA' }, { h: 'かお', r: 'KAO' }, { h: 'め', r: 'ME' },
    { h: 'はな', r: 'HANA' }, { h: 'くち', r: 'KUTI' }, { h: 'みみ', r: 'MIMI' },
    { h: 'て', r: 'TE' }, { h: 'あし', r: 'ASI' }, { h: 'ゆび', r: 'YUBI' },
    { h: 'かた', r: 'KATA' }, { h: 'むね', r: 'MUNE' }, { h: 'おなか', r: 'ONAKA' },
    { h: 'せなか', r: 'SENAKA' }, { h: 'ひざ', r: 'HIZA' }, { h: 'ひじ', r: 'HIJI' },
    { h: 'くび', r: 'KUBI' }, { h: 'かみ', r: 'KAMI' }, { h: 'は', r: 'HA' },
    { h: 'した', r: 'SITA' }, { h: 'のど', r: 'NODO' },

    // しょくぎょう (13)
    { h: 'いしゃ', r: 'ISYA' }, { h: 'かんごし', r: 'KANGOSI' }, { h: 'せんせい', r: 'SENSEI' },
    { h: 'けいさつかん', r: 'KEISATUKAN' }, { h: 'しょうぼうし', r: 'SYOUBOUSI' }, { h: 'うんてんしゅ', r: 'UNTENSYU' },
    { h: 'ちょうりし', r: 'CYOURISI' }, { h: 'ぎんこういん', r: 'GINKOUIN' }, { h: 'はいしゃ', r: 'HAISYA' },
    { h: 'へるぱー', r: 'HERUPA-' }, { h: 'かうんせらー', r: 'KAUNSERA-' }, { h: 'えんじにあ', r: 'ENJINIA' },
    { h: 'しゅふ', r: 'SYUFU' },

    // スポーツ (18)
    { h: 'さっかー', r: 'SAKKA-' }, { h: 'やきゅう', r: 'YAKYUU' }, { h: 'ばすけっとぼーる', r: 'BASUKETTOBO-RU' },
    { h: 'ばれーぼーる', r: 'BARE-BO-RU' }, { h: 'てにす', r: 'TENISU' }, { h: 'すもう', r: 'SUMOU' },
    { h: 'じゅうどう', r: 'JUUDOU' }, { h: 'けんどう', r: 'KENDOU' }, { h: 'からて', r: 'KARATE' },
    { h: 'すいえい', r: 'SUIEI' }, { h: 'らぐびー', r: 'RAGUBI-' }, { h: 'ごるふ', r: 'GORUFU' },
    { h: 'ぼーりんぐ', r: 'BO-RINGU' }, { h: 'すけーと', r: 'SUKE-TO' }, { h: 'すのーぼーど', r: 'SUNO-BO-DO' },
    { h: 'すきー', r: 'SUKI-' }, { h: 'りくじょう', r: 'RIKUJOU' }, { h: 'たいそう', r: 'TAISOU' },

    // きもち (20)
    { h: 'うれしい', r: 'URESII' }, { h: 'かなしい', r: 'KANASII' }, { h: 'たのしい', r: 'TANOSII' },
    { h: 'おもしろい', r: 'OMOSIROI' }, { h: 'つまらない', r: 'TUMARANAI' }, { h: 'おいしい', r: 'OISII' },
    { h: 'まずい', r: 'MAZUI' }, { h: 'きれい', r: 'KIREI' }, { h: 'きたない', r: 'KITANAI' },
    { h: 'こわい', r: 'KOWAI' }, { h: 'ねむい', r: 'NEMUI' }, { h: 'さむい', r: 'SAMUI' },
    { h: 'あつい', r: 'ATUI' }, { h: 'いそがしい', r: 'ISOGASII' }, { h: 'ひま', r: 'HIMA' },
    { h: 'やさしい', r: 'YASASII' }, { h: 'むずかしい', r: 'MUZUKASII' }, { h: 'いい', r: 'II' },
    { h: 'わるい', r: 'WARUI' }, { h: 'すき', r: 'SUKI' },

    // がっこう (20)
    { h: 'がっこう', r: 'GAKKOU' }, { h: 'きょうしつ', r: 'KYOUSITU' }, { h: 'こくばん', r: 'KOKUBAN' },
    { h: 'えんぴつ', r: 'ENPITU' }, { h: 'けしごむ', r: 'KESIGOMU' }, { h: 'のーと', r: 'NO-TO' },
    { h: 'ほん', r: 'HON' }, { h: 'きょうかしょ', r: 'KYOUKASYO' }, { h: 'しけん', r: 'SIKEN' },
    { h: 'しゅくだい', r: 'SYUKUDAI' }, { h: 'がくせい', r: 'GAKUSEI' }, { h: 'せんせい', r: 'SENSEI' },
    { h: 'きゅうしょく', r: 'KYUUSYOKU' }, { h: 'たいいく', r: 'TAIIKU' }, { h: 'おんがく', r: 'ONGAKU' },
    { h: 'ずこう', r: 'ZUKOU' }, { h: 'さんすう', r: 'SANSUU' }, { h: 'こくご', r: 'KOKUGO' },
    { h: 'りか', r: 'RIKA' }, { h: 'しゃかい', r: 'SYAKAI' },

    // かぞく (15)
    { h: 'おとうさん', r: 'OTOUSAN' }, { h: 'おかあさん', r: 'OKAASAN' }, { h: 'おにいさん', r: 'ONIISAN' },
    { h: 'おねえさん', r: 'ONEESAN' }, { h: 'おとうと', r: 'OTOUTO' }, { h: 'いもうと', r: 'IMOUTO' },
    { h: 'おじいさん', r: 'OJIISAN' }, { h: 'おばあさん', r: 'OBAASAN' }, { h: 'かぞく', r: 'KAZOKU' },
    { h: 'あかちゃん', r: 'AKACYAN' }, { h: 'まご', r: 'MAGO' }, { h: 'こども', r: 'KODOMO' },
    { h: 'むすこ', r: 'MUSUKO' }, { h: 'むすめ', r: 'MUSUME' }, { h: 'ふうふ', r: 'FUUFU' },

    // かず (25)
    { h: 'いち', r: 'ITI' }, { h: 'に', r: 'NI' }, { h: 'さん', r: 'SAN' },
    { h: 'し', r: 'SI' }, { h: 'ご', r: 'GO' }, { h: 'ろく', r: 'ROKU' },
    { h: 'なな', r: 'NANA' }, { h: 'はち', r: 'HATI' }, { h: 'きゅう', r: 'KYUU' },
    { h: 'じゅう', r: 'JUU' }, { h: 'ひゃく', r: 'HYAKU' }, { h: 'せん', r: 'SEN' },
    { h: 'まん', r: 'MAN' }, { h: 'れい', r: 'REI' }, { h: 'ぜろ', r: 'ZERO' },
    { h: 'ひとつ', r: 'HITOTU' }, { h: 'ふたつ', r: 'FUTATU' }, { h: 'みっつ', r: 'MITTU' },
    { h: 'よっつ', r: 'YOTTU' }, { h: 'いつつ', r: 'ITUTU' },{ h: 'むっつ', r: 'MUTTU' },
    { h: 'ななつ', r: 'NANATU' },{ h: 'やっつ', r: 'YATTU' },{ h: 'ここのつ', r: 'KOKONOTU' },
    { h: 'とお', r: 'TOO' },

    // まち (26)
    { h: 'こうえん', r: 'KOUEN' }, { h: 'えき', r: 'EKI' }, { h: 'びょういん', r: 'BYOUIN' },
    { h: 'ぎんこう', r: 'GINKOU' }, { h: 'ゆうびんきょく', r: 'YUUBINKYOKU' }, { h: 'がっこう', r: 'GAKKOU' },
    { h: 'どうぶつえん', r: 'DOUBUTUEN' }, { h: 'すーぱー', r: 'SU-PA-' }, { h: 'こんびに', r: 'KONBINI' },
    { h: 'としょかん', r: 'TOSYOKAN' }, { h: 'えいがかん', r: 'EIGAKAN' }, { h: 'みせ', r: 'MISE' },
    { h: 'ほてる', r: 'HOTERU' }, { h: 'れすとらん', r: 'RESUTORAN' }, { h: 'けいさつしょ', r: 'KEISATUSYO' },
    { h: 'こうばん', r: 'KOUBAN' }, { h: 'しやくしょ', r: 'SIYAKUSYO' }, { h: 'じむしょ', r: 'JIMUSYO' },
    { h: 'くうこう', r: 'KUUKOU' }, { h: 'ちかてつ', r: 'TIKATETU' }, { h: 'ばすてい', r: 'BASUTEI' },
    { h: 'はし', r: 'HASI' }, { h: 'みち', r: 'MITI' }, { h: 'ひろば', r: 'HIROBA' },
    { h: 'かいしゃ', r: 'KAISYA' }, { h: 'びる', r: 'BIRU' },

    // どうぐ (25)
    { h: 'はさみ', r: 'HASAMI' }, { h: 'のり', r: 'NORI' }, { h: 'せろてーぷ', r: 'SEROTE-PU' },
    { h: 'えんぴつけずり', r: 'ENPITUKEZURI' }, { h: 'こんぱす', r: 'KONPASU' }, { h: 'じょうぎ', r: 'JOUGI' },
    { h: 'くりっぷ', r: 'KURIPPU' }, { h: 'ほっちきす', r: 'HOTTIKISU' }, { h: 'ふぁいる', r: 'FAIRU' },
    { h: 'ふせん', r: 'FUSEN' }, { h: 'けいさんき', r: 'KEISANKI' }, { h: 'かめら', r: 'KAMERA' },
    { h: 'らいと', r: 'RAITO' }, { h: 'ねじまわし', r: 'NEJIMAWASI' }, { h: 'かなづち', r: 'KANADUTI' },
    { h: 'のこぎり', r: 'NOKOGIRI' }, { h: 'どりる', r: 'DORIRU' }, { h: 'ぺんち', r: 'PENTI' },
    { h: 'きり', r: 'KIRI' }, { h: 'すぱな', r: 'SUPANA' },
    { h: 'はたき', r: 'HATAKI' }, { h: 'ほうき', r: 'HOUKI' }, { h: 'ちりとり', r: 'TIRITORI' },
    { h: 'ばけつ', r: 'BAKETU' }, { h: 'ぞうきん', r: 'ZOUKIN' },
];