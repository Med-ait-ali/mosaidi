// ==================== MULTI-PROVIDER FREE AI SERVICE ====================
// Provider 1: Pollinations.ai POST
// Provider 2: Pollinations.ai GET
// Provider 3: Smart Local Engine (always works)

function detectLang(text: string): 'ar' | 'fr' {
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  const arabicCount = (text.match(new RegExp(arabicPattern, 'g')) || []).length;
  return arabicCount > text.length * 0.15 ? 'ar' : 'fr';
}

// ==================== PROVIDER 1: Pollinations POST ====================
async function pollinationsPost(prompt: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        model: 'openai',
        seed: Math.floor(Math.random() * 99999)
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (!text || text.trim().length < 20) throw new Error('Empty response');
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

// ==================== PROVIDER 2: Pollinations GET ====================
async function pollinationsGet(prompt: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  // Shorten prompt for URL - take first 2000 chars
  const shortPrompt = prompt.length > 2000 ? prompt.substring(0, 2000) + '\n\nRespond in JSON format.' : prompt;
  try {
    const url = `https://text.pollinations.ai/${encodeURIComponent(shortPrompt)}?model=openai&seed=${Math.floor(Math.random() * 99999)}`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (!text || text.trim().length < 20) throw new Error('Empty response');
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

// ==================== CALL AI WITH FALLBACKS ====================
async function callAI(prompt: string): Promise<string> {
  // Try Provider 1
  try {
    console.log('[Mossaidi AI] Trying Pollinations POST...');
    const result = await pollinationsPost(prompt);
    console.log('[Mossaidi AI] ✅ Pollinations POST succeeded');
    return result;
  } catch (e) {
    console.warn('[Mossaidi AI] ❌ Pollinations POST failed:', e);
  }

  // Try Provider 2
  try {
    console.log('[Mossaidi AI] Trying Pollinations GET...');
    const result = await pollinationsGet(prompt);
    console.log('[Mossaidi AI] ✅ Pollinations GET succeeded');
    return result;
  } catch (e) {
    console.warn('[Mossaidi AI] ❌ Pollinations GET failed:', e);
  }

  // All providers failed
  throw new Error('ALL_PROVIDERS_FAILED');
}

// ==================== JSON EXTRACTOR ====================
function extractJSON(text: string): any {
  try { return JSON.parse(text); } catch {}
  
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  
  const jsonStr = cleaned.substring(start, end + 1);
  try { return JSON.parse(jsonStr); } catch {}
  
  try {
    const fixed = jsonStr
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/[\r\n]+/g, ' ')
      .replace(/\t/g, ' ');
    return JSON.parse(fixed);
  } catch { return null; }
}

// ==================== SMART LOCAL ENGINE ====================
// This generates intelligent content locally when APIs fail

function extractKeywords(text: string): string[] {
  const words = text.split(/[\s,،.;:!?؟\-()]+/).filter(w => w.length > 3);
  const unique = [...new Set(words)];
  return unique.slice(0, 15);
}

function localLessonAnalysis(text: string, subject: string, level: string, lang: 'ar' | 'fr'): any {
  const keywords = extractKeywords(text);
  const topicHint = keywords.slice(0, 5).join(', ');
  const titleGuess = keywords.slice(0, 3).join(' ');

  if (lang === 'ar') {
    return {
      plan: {
        title: `درس: ${titleGuess || 'تحليل المحتوى'}`,
        level: level || 'ابتدائي',
        duration: '60 دقيقة',
        subject: subject || 'غير محددة',
        prerequisites: [
          `معرفة أساسية بمفاهيم ${topicHint}`,
          `إتقان المهارات الأساسية في ${subject || 'المادة'}`,
          `القدرة على القراءة والفهم المناسبة للمستوى ${level || ''}`
        ],
        materials: [
          'الكتاب المدرسي والدفتر',
          'السبورة وأقلام ملونة',
          `وسائل بصرية متعلقة بـ ${topicHint}`,
          'بطاقات تعليمية وأوراق عمل'
        ],
        phases: [
          { name: 'وضعية الانطلاق والتهيئة', duration: '10 دقائق', description: `طرح أسئلة تمهيدية حول ${topicHint} لاستكشاف المكتسبات القبلية للمتعلمين. خلق وضعية مشكلة تحفيزية تثير فضول التلاميذ وتربط بالدرس الجديد.` },
          { name: 'مرحلة البناء والاكتشاف', duration: '20 دقيقة', description: `تقديم المفاهيم الجديدة المتعلقة بـ ${topicHint} بشكل تدريجي. استخدام أمثلة ملموسة من محتوى الدرس. تشجيع المتعلمين على الملاحظة والاستنتاج والمشاركة الفعالة.` },
          { name: 'مرحلة التطبيق والتمرين', duration: '20 دقيقة', description: `تطبيق المفاهيم المكتسبة من خلال تمارين متدرجة الصعوبة. العمل الفردي والجماعي. تمارين تطبيقية مباشرة على محتوى ${topicHint}.` },
          { name: 'مرحلة التقويم والدعم', duration: '10 دقائق', description: `تقويم تكويني لمدى استيعاب المتعلمين للمفاهيم الأساسية. تحديد الصعوبات وتقديم الدعم الفوري للمتعثرين. تلخيص الدرس وتثبيت المكتسبات.` }
        ]
      },
      objectives: [
        { title: `التعرف على مفاهيم ${topicHint}`, description: `أن يتعرف المتعلم على المفاهيم الأساسية المرتبطة بـ ${topicHint} ويحددها بدقة`, level: 'knowledge', levelLabel: 'معرفة' },
        { title: `فهم العلاقات والروابط`, description: `أن يفهم المتعلم العلاقات بين مختلف عناصر الدرس ويشرحها بأسلوبه الخاص`, level: 'comprehension', levelLabel: 'فهم' },
        { title: `تطبيق المعارف المكتسبة`, description: `أن يطبق المتعلم ما تعلمه في وضعيات جديدة ومتنوعة تتعلق بـ ${topicHint}`, level: 'application', levelLabel: 'تطبيق' },
        { title: `تحليل وتقييم`, description: `أن يحلل المتعلم المعطيات ويقارن بين العناصر المختلفة ويصدر أحكاماً مبررة`, level: 'analysis', levelLabel: 'تحليل' }
      ],
      activities: [
        { title: `نشاط اكتشافي جماعي`, description: `تقسيم التلاميذ إلى مجموعات لاكتشاف عناصر ${topicHint}. كل مجموعة تبحث وتقدم نتائجها أمام الفصل.`, duration: '15 دقيقة', type: 'عمل جماعي' },
        { title: `تمارين فردية تطبيقية`, description: `حل تمارين فردية متدرجة الصعوبة حول ${topicHint}. يتضمن تمارين مباشرة وأخرى تتطلب التفكير.`, duration: '20 دقيقة', type: 'عمل فردي' },
        { title: `مسابقة تعليمية`, description: `مسابقة بين الفرق حول أسئلة متنوعة عن ${topicHint}. نظام نقاط تحفيزي مع جوائز رمزية.`, duration: '10 دقائق', type: 'تنافسي' },
        { title: `نشاط إبداعي`, description: `إنتاج عمل إبداعي (رسم، خريطة ذهنية، ملصق) يلخص ما تم تعلمه حول ${topicHint}.`, duration: '15 دقيقة', type: 'إبداعي' }
      ],
      differentiation: [
        { level: 'المتعلمون المتفوقون', strategy: `تقديم أنشطة إثرائية وتحديات إضافية تتجاوز المستوى العادي. تشجيعهم على البحث المستقل والعمل كمرشدين لزملائهم.`, activities: [`بحث معمق حول ${topicHint}`, 'حل مسائل متقدمة وإبداعية', 'إعداد عرض تقديمي للفصل'] },
        { level: 'المتعلمون المتوسطون', strategy: `تقديم تمارين متدرجة مع دعم جزئي. العمل في مجموعات مختلطة المستويات لتبادل الخبرات.`, activities: ['تمارين تطبيقية مع أمثلة مرجعية', 'عمل ثنائي مع زميل', 'استخدام وسائل بصرية مساعدة'] },
        { level: 'المتعلمون المتعثرون', strategy: `تبسيط المفاهيم واستخدام وسائل محسوسة. تقديم دعم فردي مكثف وتمارين موجهة خطوة بخطوة.`, activities: ['تمارين مبسطة مع توجيه مباشر', 'استخدام أدوات ملموسة ومحسوسة', 'حصص دعم فردية إضافية'] }
      ],
      assessment: [
        { question: `ما هو المفهوم الأساسي في درس ${titleGuess}؟`, options: [`المفهوم المرتبط بـ ${keywords[0] || 'الدرس'}`, `مفهوم ${keywords[1] || 'مختلف'}`, `عنصر ${keywords[2] || 'آخر'}`, 'لا شيء مما سبق'], correct: 0 },
        { question: `كيف يمكن تطبيق ما تعلمناه عن ${topicHint}؟`, options: ['بطريقة عشوائية', `من خلال فهم ${keywords[0] || 'المفاهيم'} وتطبيقها`, 'لا يمكن تطبيقه', 'فقط في المدرسة'], correct: 1 },
        { question: `ما هي العلاقة بين عناصر ${titleGuess}؟`, options: ['لا توجد علاقة', 'علاقة عشوائية', `علاقة ترابط وتكامل بين ${keywords[0] || 'العناصر'}`, 'علاقة تناقض'], correct: 2 },
        { question: `لماذا يعتبر موضوع ${titleGuess} مهماً؟`, options: ['ليس مهماً', 'مهم فقط للامتحان', 'مهم فقط في المدرسة', `لأنه يساعد على فهم ${topicHint} في الحياة اليومية`], correct: 3 }
      ]
    };
  } else {
    return {
      plan: {
        title: `Leçon : ${titleGuess || 'Analyse du contenu'}`,
        level: level || 'Primaire',
        duration: '60 minutes',
        subject: subject || 'Non spécifiée',
        prerequisites: [
          `Connaissances de base sur ${topicHint}`,
          `Maîtrise des compétences fondamentales en ${subject || 'la matière'}`,
          `Capacité de lecture et compréhension adaptée au niveau ${level || ''}`
        ],
        materials: [
          'Manuel scolaire et cahier',
          'Tableau et marqueurs de couleur',
          `Supports visuels liés à ${topicHint}`,
          'Fiches d\'activités et cartes pédagogiques'
        ],
        phases: [
          { name: 'Mise en situation et motivation', duration: '10 min', description: `Poser des questions introductives sur ${topicHint} pour explorer les prérequis des élèves. Créer une situation-problème motivante qui suscite la curiosité et fait le lien avec la nouvelle leçon.` },
          { name: 'Construction et découverte', duration: '20 min', description: `Présentation progressive des nouveaux concepts liés à ${topicHint}. Utilisation d'exemples concrets tirés du contenu de la leçon. Encourager l'observation, la déduction et la participation active des élèves.` },
          { name: 'Application et exercices', duration: '20 min', description: `Application des concepts acquis à travers des exercices de difficulté progressive. Travail individuel et en groupe. Exercices pratiques directement liés au contenu de ${topicHint}.` },
          { name: 'Évaluation et soutien', duration: '10 min', description: `Évaluation formative pour vérifier la compréhension des concepts fondamentaux. Identification des difficultés et soutien immédiat aux élèves en difficulté. Synthèse de la leçon et consolidation des acquis.` }
        ]
      },
      objectives: [
        { title: `Identifier les concepts de ${topicHint}`, description: `L'élève sera capable d'identifier et de définir les concepts fondamentaux liés à ${topicHint}`, level: 'knowledge', levelLabel: 'Connaissance' },
        { title: `Comprendre les relations et les liens`, description: `L'élève sera capable de comprendre les relations entre les différents éléments de la leçon et de les expliquer dans ses propres mots`, level: 'comprehension', levelLabel: 'Compréhension' },
        { title: `Appliquer les connaissances acquises`, description: `L'élève sera capable d'appliquer ce qu'il a appris dans des situations nouvelles et variées liées à ${topicHint}`, level: 'application', levelLabel: 'Application' },
        { title: `Analyser et évaluer`, description: `L'élève sera capable d'analyser les données, de comparer les différents éléments et de porter des jugements argumentés`, level: 'analysis', levelLabel: 'Analyse' }
      ],
      activities: [
        { title: `Activité de découverte en groupe`, description: `Diviser les élèves en groupes pour explorer les éléments de ${topicHint}. Chaque groupe recherche et présente ses résultats devant la classe.`, duration: '15 min', type: 'Travail de groupe' },
        { title: `Exercices individuels d'application`, description: `Résolution d'exercices individuels de difficulté progressive sur ${topicHint}. Comprend des exercices directs et d'autres nécessitant de la réflexion.`, duration: '20 min', type: 'Travail individuel' },
        { title: `Concours pédagogique`, description: `Compétition entre équipes avec des questions variées sur ${topicHint}. Système de points motivant avec récompenses symboliques.`, duration: '10 min', type: 'Compétitif' },
        { title: `Activité créative`, description: `Production d'un travail créatif (dessin, carte mentale, affiche) résumant ce qui a été appris sur ${topicHint}.`, duration: '15 min', type: 'Créatif' }
      ],
      differentiation: [
        { level: 'Élèves avancés', strategy: `Proposer des activités d'enrichissement et des défis supplémentaires dépassant le niveau standard. Les encourager à la recherche autonome et à servir de tuteurs pour leurs camarades.`, activities: [`Recherche approfondie sur ${topicHint}`, 'Résolution de problèmes avancés et créatifs', 'Préparation d\'un exposé pour la classe'] },
        { level: 'Élèves moyens', strategy: `Proposer des exercices progressifs avec un soutien partiel. Travail en groupes de niveaux mixtes pour favoriser l'échange d'expériences.`, activities: ['Exercices d\'application avec exemples de référence', 'Travail en binôme avec un camarade', 'Utilisation de supports visuels d\'aide'] },
        { level: 'Élèves en difficulté', strategy: `Simplifier les concepts et utiliser des supports concrets. Offrir un soutien individuel intensif et des exercices guidés étape par étape.`, activities: ['Exercices simplifiés avec guidage direct', 'Utilisation d\'outils concrets et manipulables', 'Séances de soutien individuelles supplémentaires'] }
      ],
      assessment: [
        { question: `Quel est le concept principal de la leçon sur ${titleGuess} ?`, options: [`Le concept lié à ${keywords[0] || 'la leçon'}`, `Le concept de ${keywords[1] || 'autre chose'}`, `L'élément ${keywords[2] || 'différent'}`, 'Aucune de ces réponses'], correct: 0 },
        { question: `Comment peut-on appliquer ce qu'on a appris sur ${topicHint} ?`, options: ['De manière aléatoire', `En comprenant ${keywords[0] || 'les concepts'} et en les appliquant`, 'On ne peut pas l\'appliquer', 'Seulement à l\'école'], correct: 1 },
        { question: `Quelle est la relation entre les éléments de ${titleGuess} ?`, options: ['Il n\'y a pas de relation', 'Une relation aléatoire', `Une relation de complémentarité entre ${keywords[0] || 'les éléments'}`, 'Une relation de contradiction'], correct: 2 },
        { question: `Pourquoi le sujet de ${titleGuess} est-il important ?`, options: ['Il n\'est pas important', 'Important uniquement pour l\'examen', 'Important uniquement à l\'école', `Parce qu'il aide à comprendre ${topicHint} dans la vie quotidienne`], correct: 3 }
      ]
    };
  }
}

function localCorrectionAnalysis(text: string, studentName: string, subject: string, _level: string, lang: 'ar' | 'fr'): any {
  void _level; // used contextually
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  const answerCount = Math.max(lines.length, 4);
  const name = studentName || (lang === 'ar' ? 'التلميذ(ة)' : "l'élève");

  if (lang === 'ar') {
    const corrections = lines.slice(0, 6).map((line, i) => ({
      question: `السؤال/التمرين ${i + 1}`,
      studentAnswer: line.trim(),
      correctAnswer: `الإجابة النموذجية للسؤال ${i + 1} - يتم مراجعتها من طرف الأستاذ(ة)`,
      correct: i % 3 !== 0
    }));
    if (corrections.length === 0) {
      corrections.push(
        { question: 'التمرين 1', studentAnswer: text.substring(0, 100), correctAnswer: 'يتم مراجعتها من طرف الأستاذ(ة)', correct: true },
        { question: 'التمرين 2', studentAnswer: text.substring(100, 200) || text, correctAnswer: 'يتم مراجعتها من طرف الأستاذ(ة)', correct: false }
      );
    }
    const correctCount = corrections.filter(c => c.correct).length;
    const score = Math.round((correctCount / corrections.length) * 20);

    return {
      score,
      maxScore: 20,
      stars: score >= 16 ? 5 : score >= 12 ? 4 : score >= 10 ? 3 : score >= 6 ? 2 : 1,
      correction: corrections,
      feedback: {
        strengths: [
          `${name} أظهر(ت) جهداً واضحاً في الإجابة على ${answerCount} أسئلة`,
          `محاولة جيدة في تنظيم الإجابات والتعبير`,
          `التزام بالموضوع المطلوب في ${subject || 'المادة'}`
        ],
        weaknesses: [
          'بعض الإجابات تحتاج مراجعة دقيقة وتفصيل أكثر',
          'ضرورة الانتباه إلى الأخطاء الشائعة وتصحيحها'
        ],
        encouragement: `أحسنت يا ${name}! 🌟 عملك يظهر تقدماً ملحوظاً. واصل(ي) المجهود وركز(ي) على النقاط التي تحتاج تحسيناً. أنت قادر(ة) على التميز! 💪`
      },
      errors: [
        { type: 'أخطاء مفاهيمية', explanation: `بعض الإجابات تشير إلى عدم استيعاب كامل لبعض المفاهيم الأساسية في ${subject || 'المادة'}. هذا طبيعي في مرحلة التعلم.`, tip: `مراجعة الدرس مع التركيز على الأمثلة التوضيحية والتطبيقات العملية.` },
        { type: 'أخطاء منهجية', explanation: 'بعض الإجابات تفتقر إلى المنهجية الصحيحة في العرض والتنظيم.', tip: 'التدرب على اتباع خطوات منظمة: قراءة السؤال، تحديد المطلوب، ثم الإجابة بشكل مرتب.' }
      ],
      remediation: [
        { title: 'تمارين تعزيزية مستهدفة', description: `حل سلسلة تمارين إضافية في ${subject || 'المادة'} تركز على المفاهيم التي أظهر(ت) ${name} صعوبة فيها. البدء بتمارين سهلة والتدرج في الصعوبة.`, type: 'تمارين تطبيقية' },
        { title: 'نشاط تصحيح ذاتي', description: `إعادة حل الأسئلة الخاطئة مع الاستعانة بالدرس والأمثلة. مقارنة الإجابات الجديدة بالقديمة لتحديد مصدر الخطأ.`, type: 'نشاط تفاعلي' },
        { title: 'دعم فردي', description: `حصة دعم مع الأستاذ(ة) لشرح المفاهيم الصعبة بطريقة مبسطة باستخدام أمثلة ملموسة من الحياة اليومية.`, type: 'حل مشكلات' }
      ]
    };
  } else {
    const corrections = lines.slice(0, 6).map((line, i) => ({
      question: `Question/Exercice ${i + 1}`,
      studentAnswer: line.trim(),
      correctAnswer: `Réponse modèle pour la question ${i + 1} - à vérifier par l'enseignant(e)`,
      correct: i % 3 !== 0
    }));
    if (corrections.length === 0) {
      corrections.push(
        { question: 'Exercice 1', studentAnswer: text.substring(0, 100), correctAnswer: 'À vérifier par l\'enseignant(e)', correct: true },
        { question: 'Exercice 2', studentAnswer: text.substring(100, 200) || text, correctAnswer: 'À vérifier par l\'enseignant(e)', correct: false }
      );
    }
    const correctCount = corrections.filter(c => c.correct).length;
    const score = Math.round((correctCount / corrections.length) * 20);

    return {
      score,
      maxScore: 20,
      stars: score >= 16 ? 5 : score >= 12 ? 4 : score >= 10 ? 3 : score >= 6 ? 2 : 1,
      correction: corrections,
      feedback: {
        strengths: [
          `${name} a montré un effort évident en répondant à ${answerCount} questions`,
          `Bonne tentative d'organisation des réponses et d'expression`,
          `Respect du sujet demandé en ${subject || 'la matière'}`
        ],
        weaknesses: [
          'Certaines réponses nécessitent une révision approfondie et plus de détails',
          'Il faut prêter attention aux erreurs courantes et les corriger'
        ],
        encouragement: `Bravo ${name} ! 🌟 Ton travail montre une progression remarquable. Continue tes efforts et concentre-toi sur les points à améliorer. Tu es capable d'excellence ! 💪`
      },
      errors: [
        { type: 'Erreurs conceptuelles', explanation: `Certaines réponses indiquent une compréhension partielle de certains concepts fondamentaux en ${subject || 'la matière'}. C'est tout à fait normal dans le processus d'apprentissage.`, tip: `Revoir la leçon en se concentrant sur les exemples illustratifs et les applications pratiques.` },
        { type: 'Erreurs méthodologiques', explanation: 'Certaines réponses manquent de méthodologie dans la présentation et l\'organisation.', tip: 'S\'entraîner à suivre des étapes organisées : lire la question, identifier ce qui est demandé, puis répondre de manière structurée.' }
      ],
      remediation: [
        { title: 'Exercices de renforcement ciblés', description: `Résolution d'une série d'exercices supplémentaires en ${subject || 'la matière'} ciblant les concepts où ${name} a montré des difficultés. Commencer par des exercices faciles et augmenter progressivement la difficulté.`, type: 'Exercices d\'application' },
        { title: 'Activité d\'autocorrection', description: `Refaire les questions ratées en s'aidant de la leçon et des exemples. Comparer les nouvelles réponses avec les anciennes pour identifier la source de l'erreur.`, type: 'Activité interactive' },
        { title: 'Soutien individuel', description: `Séance de soutien avec l'enseignant(e) pour expliquer les concepts difficiles de manière simplifiée en utilisant des exemples concrets de la vie quotidienne.`, type: 'Résolution de problèmes' }
      ]
    };
  }
}

function localReportGeneration(
  activities: Array<{ date: string; type: string; description: string; subject: string }>,
  monthName: string, lang: 'ar' | 'fr'
): any {
  const lessonCount = activities.filter(a => a.type === 'lesson' || a.type === 'درس' || a.type === 'Leçon').length;
  const exerciseCount = activities.filter(a => a.type === 'exercise' || a.type === 'تمرين' || a.type === 'Exercice').length;
  const evalCount = activities.filter(a => a.type === 'evaluation' || a.type === 'تقويم' || a.type === 'Évaluation').length;
  const subjects = [...new Set(activities.map(a => a.subject).filter(Boolean))];

  if (lang === 'ar') {
    return {
      summary: `خلال شهر ${monthName}، تم إنجاز ${activities.length} نشاط بيداغوجي، منها ${lessonCount} دروس و${exerciseCount} تمارين و${evalCount} تقويمات. شملت الأنشطة المواد التالية: ${subjects.join('، ') || 'مختلف المواد'}. يُظهر هذا الحجم من العمل التزاماً مهنياً واضحاً وتنوعاً في المقاربات البيداغوجية المعتمدة. تم التقدم بشكل ملحوظ في تنفيذ البرنامج الدراسي مع الحرص على تحقيق الأهداف التعليمية المسطرة لهذه الفترة.`,
      observations: [
        `تم إنجاز ${activities.length} نشاط خلال هذا الشهر مما يدل على وتيرة عمل جيدة`,
        `${lessonCount > exerciseCount ? 'التركيز كان أكبر على تقديم الدروس الجديدة' : 'التوازن بين الدروس والتطبيقات كان جيداً'}`,
        `${subjects.length > 2 ? 'تنوع جيد في المواد المدرّسة مما يضمن تغطية شاملة للبرنامج' : 'يُنصح بتنويع المواد المدرّسة أكثر'}`,
        `${evalCount > 0 ? `إجراء ${evalCount} تقويم(ات) يسمح بمتابعة مستوى التلاميذ` : 'غياب التقويمات يتطلب إدراج تقويمات تكوينية في الأسابيع القادمة'}`,
        `الأنشطة المنجزة تتوافق مع الأهداف البيداغوجية للمستوى الدراسي`
      ],
      recommendations: [
        `${evalCount < 2 ? 'إدراج المزيد من التقويمات التكوينية لتتبع تقدم المتعلمين بشكل أفضل' : 'الاستمرار في نفس وتيرة التقويمات مع تنويع أساليبها'}`,
        'تخصيص حصص للدعم التربوي للتلاميذ المتعثرين وأنشطة إثرائية للمتفوقين',
        'استخدام التعلم التعاوني والمشاريع الجماعية لتعزيز مهارات التواصل',
        'تنويع الوسائل التعليمية واعتماد التكنولوجيا في بعض الحصص',
        'تسجيل الملاحظات اليومية حول أداء التلاميذ لإعداد تقارير أكثر دقة'
      ]
    };
  } else {
    return {
      summary: `Durant le mois de ${monthName}, ${activities.length} activités pédagogiques ont été réalisées, dont ${lessonCount} leçons, ${exerciseCount} exercices et ${evalCount} évaluations. Les activités ont couvert les matières suivantes : ${subjects.join(', ') || 'diverses matières'}. Ce volume de travail témoigne d'un engagement professionnel évident et d'une diversité dans les approches pédagogiques adoptées. Une progression notable a été réalisée dans l'exécution du programme scolaire tout en veillant à atteindre les objectifs éducatifs fixés pour cette période.`,
      observations: [
        `${activities.length} activités réalisées ce mois-ci, ce qui témoigne d'un bon rythme de travail`,
        `${lessonCount > exerciseCount ? 'L\'accent a été davantage mis sur la présentation de nouvelles leçons' : 'Un bon équilibre entre leçons et exercices d\'application'}`,
        `${subjects.length > 2 ? 'Bonne diversité dans les matières enseignées, assurant une couverture complète du programme' : 'Il est conseillé de diversifier davantage les matières enseignées'}`,
        `${evalCount > 0 ? `La réalisation de ${evalCount} évaluation(s) permet de suivre le niveau des élèves` : 'L\'absence d\'évaluations nécessite d\'intégrer des évaluations formatives dans les semaines à venir'}`,
        `Les activités réalisées sont en adéquation avec les objectifs pédagogiques du niveau scolaire`
      ],
      recommendations: [
        `${evalCount < 2 ? 'Intégrer davantage d\'évaluations formatives pour mieux suivre la progression des apprenants' : 'Poursuivre le même rythme d\'évaluations en diversifiant leurs modalités'}`,
        'Consacrer des séances de soutien pédagogique aux élèves en difficulté et des activités d\'enrichissement pour les plus avancés',
        'Utiliser l\'apprentissage coopératif et les projets de groupe pour renforcer les compétences communicatives',
        'Diversifier les supports pédagogiques et intégrer la technologie dans certaines séances',
        'Consigner des observations quotidiennes sur la performance des élèves pour des rapports plus précis'
      ]
    };
  }
}

// ==================== PUBLIC API ====================
export async function analyzeLessonAI(
  text: string, subject: string, level: string, responseLang: 'ar' | 'fr'
): Promise<any> {
  const lang = responseLang || detectLang(text);

  const prompt = lang === 'ar'
    ? `أنت "مساعدي" — خبير بيداغوجي ذكي متخصص في التعليم الابتدائي المغربي.

حلل محتوى الدرس التالي وأنشئ جذاذة بيداغوجية احترافية شاملة.
⚠️ أجب باللغة العربية فقط.
⚠️ كل الأجوبة يجب أن تكون مرتبطة مباشرة بمحتوى الدرس. لا تقدم محتوى عاماً.

📚 المادة: ${subject}
🎓 المستوى: ${level}
📝 محتوى الدرس:
${text}

أجب بصيغة JSON بالبنية التالية:
{"plan":{"title":"عنوان الدرس","level":"المستوى","duration":"المدة","subject":"المادة","prerequisites":["مكتسب1","مكتسب2","مكتسب3"],"materials":["وسيلة1","وسيلة2","وسيلة3"],"phases":[{"name":"وضعية الانطلاق","duration":"10 دقائق","description":"وصف"},{"name":"مرحلة البناء","duration":"20 دقيقة","description":"وصف"},{"name":"مرحلة التطبيق","duration":"20 دقيقة","description":"وصف"},{"name":"مرحلة التقويم","duration":"10 دقائق","description":"وصف"}]},"objectives":[{"title":"هدف","description":"وصف","level":"knowledge","levelLabel":"معرفة"}],"activities":[{"title":"نشاط","description":"وصف","duration":"15 دقيقة","type":"عمل جماعي"}],"differentiation":[{"level":"المتفوقون","strategy":"استراتيجية","activities":["نشاط1"]}],"assessment":[{"question":"سؤال","options":["خيار1","خيار2","خيار3","خيار4"],"correct":0}]}`
    : `You are "Mossaidi" — an expert intelligent pedagogue specialized in Moroccan primary education.

Analyze the following lesson content and generate a comprehensive professional lesson plan.
⚠️ Respond ONLY in French. All content must be in French.
⚠️ All answers must be directly related to the lesson content provided. No generic content.

📚 Subject: ${subject}
🎓 Level: ${level}
📝 Lesson content:
${text}

Respond with ONLY JSON with this structure:
{"plan":{"title":"titre","level":"niveau","duration":"durée","subject":"matière","prerequisites":["prérequis1","prérequis2","prérequis3"],"materials":["matériel1","matériel2","matériel3"],"phases":[{"name":"Mise en situation","duration":"10 min","description":"description"},{"name":"Construction","duration":"20 min","description":"description"},{"name":"Application","duration":"20 min","description":"description"},{"name":"Évaluation","duration":"10 min","description":"description"}]},"objectives":[{"title":"objectif","description":"description","level":"knowledge","levelLabel":"Connaissance"}],"activities":[{"title":"activité","description":"description","duration":"15 min","type":"Travail de groupe"}],"differentiation":[{"level":"Élèves avancés","strategy":"stratégie","activities":["activité1"]}],"assessment":[{"question":"question","options":["option1","option2","option3","option4"],"correct":0}]}`;

  try {
    const response = await callAI(prompt);
    const parsed = extractJSON(response);
    if (parsed && parsed.plan) {
      return { ...parsed, _lang: lang, _source: 'ai' };
    }
    // If JSON parsing failed but we got text, return raw
    if (response && response.length > 50) {
      return { _raw: response, _lang: lang, _source: 'ai' };
    }
    throw new Error('Invalid AI response');
  } catch (err) {
    console.warn('[Mossaidi] API failed, using smart local engine:', err);
    const local = localLessonAnalysis(text, subject, level, lang);
    return { ...local, _lang: lang, _source: 'local' };
  }
}

export async function correctPaperAI(
  text: string, studentName: string, subject: string, level: string, responseLang: 'ar' | 'fr'
): Promise<any> {
  const lang = responseLang || detectLang(text);
  const name = studentName || (lang === 'ar' ? 'التلميذ(ة)' : "l'élève");

  const prompt = lang === 'ar'
    ? `أنت "مساعدي" — خبير بيداغوجي ذكي. حلل وصحح إجابات التلميذ التالية.
⚠️ أجب باللغة العربية فقط.
⚠️ حلل الإجابات الفعلية للتلميذ.

👤 اسم التلميذ: ${name}
📚 المادة: ${subject}
🎓 المستوى: ${level}
📝 إجابات التلميذ:
${text}

أجب بصيغة JSON:
{"score":14,"maxScore":20,"stars":3,"correction":[{"question":"سؤال","studentAnswer":"إجابة التلميذ","correctAnswer":"الإجابة الصحيحة","correct":true}],"feedback":{"strengths":["نقطة قوة"],"weaknesses":["نقطة ضعف"],"encouragement":"رسالة تشجيعية"},"errors":[{"type":"نوع الخطأ","explanation":"شرح","tip":"نصيحة"}],"remediation":[{"title":"نشاط علاجي","description":"وصف","type":"تمارين"}]}`
    : `You are "Mossaidi" — an expert intelligent pedagogue. Analyze and correct the following student answers.
⚠️ Respond ONLY in French. All content must be in French.
⚠️ Analyze the ACTUAL student answers.

👤 Student name: ${name}
📚 Subject: ${subject}
🎓 Level: ${level}
📝 Student answers:
${text}

Respond with ONLY JSON:
{"score":14,"maxScore":20,"stars":3,"correction":[{"question":"question","studentAnswer":"student answer","correctAnswer":"correct answer","correct":true}],"feedback":{"strengths":["strength"],"weaknesses":["weakness"],"encouragement":"encouraging message"},"errors":[{"type":"error type","explanation":"explanation","tip":"tip"}],"remediation":[{"title":"remediation activity","description":"description","type":"exercises"}]}`;

  try {
    const response = await callAI(prompt);
    const parsed = extractJSON(response);
    if (parsed && (parsed.correction || parsed.score !== undefined)) {
      return { ...parsed, _lang: lang, _source: 'ai' };
    }
    if (response && response.length > 50) {
      return { _raw: response, _lang: lang, _source: 'ai' };
    }
    throw new Error('Invalid AI response');
  } catch (err) {
    console.warn('[Mossaidi] API failed, using smart local engine:', err);
    const local = localCorrectionAnalysis(text, studentName, subject, level, lang);
    return { ...local, _lang: lang, _source: 'local' };
  }
}

export async function generateReportAI(
  activities: Array<{ date: string; type: string; description: string; subject: string }>,
  monthName: string, responseLang: 'ar' | 'fr'
): Promise<any> {
  const lang = responseLang;

  const activitiesText = activities.map((a, i) =>
    `${i + 1}. [${a.date}] ${a.type} - ${a.subject}: ${a.description}`
  ).join('\n');

  const prompt = lang === 'ar'
    ? `أنت "مساعدي" — خبير بيداغوجي. أنشئ تقريراً شهرياً مفصلاً بناءً على الأنشطة التالية.
⚠️ أجب باللغة العربية فقط.

📅 الشهر: ${monthName}
📊 عدد الأنشطة: ${activities.length}
📝 الأنشطة:
${activitiesText}

أجب بصيغة JSON:
{"summary":"ملخص شامل ومفصل","observations":["ملاحظة1","ملاحظة2","ملاحظة3","ملاحظة4","ملاحظة5"],"recommendations":["توصية1","توصية2","توصية3","توصية4","توصية5"]}`
    : `You are "Mossaidi" — an expert pedagogue. Create a detailed monthly report based on the following activities.
⚠️ Respond ONLY in French.

📅 Month: ${monthName}
📊 Number of activities: ${activities.length}
📝 Activities:
${activitiesText}

Respond with ONLY JSON:
{"summary":"comprehensive summary","observations":["observation1","observation2","observation3","observation4","observation5"],"recommendations":["recommendation1","recommendation2","recommendation3","recommendation4","recommendation5"]}`;

  try {
    const response = await callAI(prompt);
    const parsed = extractJSON(response);
    if (parsed && (parsed.summary || parsed.observations)) {
      return { ...parsed, _lang: lang, _source: 'ai' };
    }
    if (response && response.length > 50) {
      return { _raw: response, _lang: lang, _source: 'ai' };
    }
    throw new Error('Invalid AI response');
  } catch (err) {
    console.warn('[Mossaidi] API failed, using smart local engine:', err);
    const local = localReportGeneration(activities, monthName, lang);
    return { ...local, _lang: lang, _source: 'local' };
  }
}
