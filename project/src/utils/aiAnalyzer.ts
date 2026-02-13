export function analyzeComplaintPriority(title: string, description: string): 'low' | 'medium' | 'high' | 'urgent' {
  const text = `${title} ${description}`.toLowerCase();

  const urgentKeywords = [
    'urgent', 'emergency', 'critical', 'immediate', 'danger', 'hazard',
    'life threatening', 'severe', 'accident', 'injury', 'fire', 'electrical',
    'broken', 'damaged', 'leaking', 'flooding', 'safety', 'security breach'
  ];

  const highKeywords = [
    'serious', 'major', 'important', 'significant', 'broken', 'not working',
    'completely', 'totally', 'entire', 'all', 'multiple', 'widespread',
    'affecting many', 'cant access', 'locked out', 'no water', 'no power'
  ];

  const lowKeywords = [
    'minor', 'small', 'slight', 'cosmetic', 'aesthetic', 'suggestion',
    'would be nice', 'could improve', 'enhancement', 'request'
  ];

  const urgentCount = urgentKeywords.filter(keyword => text.includes(keyword)).length;
  const highCount = highKeywords.filter(keyword => text.includes(keyword)).length;
  const lowCount = lowKeywords.filter(keyword => text.includes(keyword)).length;

  if (urgentCount >= 2 || text.includes('urgent') || text.includes('emergency')) {
    return 'urgent';
  }

  if (urgentCount >= 1 || highCount >= 2) {
    return 'high';
  }

  if (lowCount >= 1) {
    return 'low';
  }

  return 'medium';
}

export function suggestCategory(title: string, description: string, categories: Array<{ id: string; name: string; description: string }>): string {
  const text = `${title} ${description}`.toLowerCase();

  const categoryKeywords: Record<string, string[]> = {
    'infrastructure': [
      'building', 'classroom', 'room', 'wall', 'ceiling', 'floor', 'door',
      'window', 'furniture', 'desk', 'chair', 'board', 'paint', 'construction',
      'maintenance', 'repair', 'facility', 'AC', 'air conditioning', 'ventilation',
      'heating', 'cooling', 'lights', 'lighting'
    ],
    'it & technology': [
      'computer', 'laptop', 'software', 'hardware', 'wifi', 'internet',
      'network', 'connection', 'lab', 'system', 'server', 'website',
      'portal', 'app', 'application', 'projector', 'printer', 'scanner',
      'mouse', 'keyboard', 'screen', 'monitor', 'email', 'login', 'password'
    ],
    'academics': [
      'course', 'class', 'professor', 'teacher', 'exam', 'test', 'assignment',
      'grade', 'marks', 'schedule', 'timetable', 'syllabus', 'curriculum',
      'lecture', 'tutorial', 'practical', 'lab session', 'semester', 'registration'
    ],
    'hostel': [
      'hostel', 'room', 'bed', 'mattress', 'warden', 'roommate', 'accommodation',
      'dormitory', 'mess', 'laundry', 'bathroom', 'toilet', 'shower', 'cleaning'
    ],
    'cafeteria': [
      'food', 'cafeteria', 'canteen', 'menu', 'meal', 'lunch', 'dinner',
      'breakfast', 'hygiene', 'quality', 'taste', 'service', 'dining'
    ],
    'transportation': [
      'bus', 'transport', 'parking', 'vehicle', 'shuttle', 'route', 'timing',
      'driver', 'bike', 'car', 'commute'
    ],
    'library': [
      'library', 'book', 'reading', 'study', 'resources', 'journal',
      'database', 'reference', 'librarian', 'borrowing', 'reservation'
    ],
    'sports & recreation': [
      'sports', 'gym', 'fitness', 'playground', 'court', 'field', 'equipment',
      'recreation', 'activity', 'club', 'practice', 'training'
    ],
    'security': [
      'security', 'safety', 'guard', 'theft', 'stolen', 'lost', 'missing',
      'unauthorized', 'suspicious', 'incident', 'access', 'entry', 'gate'
    ]
  };

  const scores: Record<string, number> = {};

  for (const category of categories) {
    const categoryName = category.name.toLowerCase();
    const keywords = categoryKeywords[categoryName] || [];

    let score = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        score += 1;
      }
    }

    scores[category.id] = score;
  }

  const bestMatch = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];

  if (bestMatch && bestMatch[1] > 0) {
    return bestMatch[0];
  }

  const otherCategory = categories.find(c => c.name.toLowerCase() === 'other');
  return otherCategory?.id || categories[0]?.id || '';
}

export function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const lowerText = text.toLowerCase();

  const positiveWords = ['good', 'great', 'excellent', 'happy', 'satisfied', 'thank', 'appreciate', 'helpful'];
  const negativeWords = ['bad', 'poor', 'terrible', 'horrible', 'worst', 'unhappy', 'disappointed', 'frustrated', 'angry', 'useless', 'broken', 'damaged'];

  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });

  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeCount++;
  });

  if (negativeCount > positiveCount) return 'negative';
  if (positiveCount > negativeCount) return 'positive';
  return 'neutral';
}
