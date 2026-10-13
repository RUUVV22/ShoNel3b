const MESSAGES = Object.freeze({
  INVALID_NAME: 'يرجى إدخال اسم صحيح من حرفين على الأقل',
  INVALID_ROOM: 'رمز الغرفة غير صالح',
  ROOM_NOT_FOUND: 'الغرفة غير موجودة',
  ROOM_FULL: 'الغرفة ممتلئة',
  ROOM_STARTED: 'بدأت هذه الجولة بالفعل',
  DUPLICATE_NAME: 'هذا الاسم مستخدم بالفعل في الغرفة',
  NOT_HOST: 'هذا الإجراء متاح لمضيف الغرفة فقط',
  INVALID_TARGET: 'اختار لاعب موجود ولسّه باللعبة غير نفسك',
  PLAYER_ELIMINATED: 'تم إقصاؤك من هذه الجولة، تابع اللعب مع أصحابك',
  PLAYER_NOT_FOUND: 'تعذر العثور على اللاعب',
  INVALID_ASSIGNMENT: 'تعيين الفريق أو الدور غير صالح',
  LOBBY_ONLY: 'هذا الإجراء متاح في الردهة فقط',
  INVALID_GAME: 'هذه اللعبة غير متاحة حالياً',
  GAME_NOT_SELECTED: 'اختر لعبة من الردهة أولاً',
  INVALID_GAME_ACTION: 'هذا الإجراء غير متاح في اللعبة الحالية',
  GAME_NOT_ACTIVE: 'لا توجد جولة نشطة الآن',
  GAME_NOT_FINISHED: 'لم تنتهِ الجولة بعد',
  NOT_READY: 'اللاعبين أو إعدادات اللعبة لسه مش جاهزين لبدء الجولة',
  WAITING_FOR_ACTIONS: 'استنى اللاعبين يكملوا أدوارهم بالليل قبل الانتقال للمرحلة التالية',
  RECOVERY_NOT_NEEDED: 'لا يمكن تجاوز دور لاعب ما زال متصلاً بالغرفة',
  NOT_YOUR_TURN: 'مش دورك هلا، استنى الجولة أو اختيار اللاعب المناسب',
  SPYMASTER_ONLY: 'إعطاء التلميح متاح لقائد الفريق فقط',
  AGENT_ONLY: 'اختيار البطاقات متاح للاعبين فقط',
  CLUE_EXISTS: 'تم إعطاء تلميح لهذه الجولة بالفعل',
  CLUE_REQUIRED: 'يجب انتظار تلميح قائد الفريق',
  INVALID_CLUE: 'أدخل كلمة دالة صحيحة وعدداً مناسباً',
  CLUE_MATCHES_CARD: 'لا يمكن أن تكون الكلمة الدالة إحدى كلمات اللوحة',
  INVALID_CARD: 'هذه البطاقة غير متاحة للاختيار',
  INVALID_SESSION: 'تعذر استعادة جلسة اللاعب',
  UNAUTHORIZED: 'لا تملك صلاحية تنفيذ هذا الإجراء',
  SERVER_ERROR: 'حدث خطأ غير متوقع في الخادم',
});

class GameError extends Error {
  constructor(code, details) {
    super(MESSAGES[code] || MESSAGES.SERVER_ERROR);
    this.name = 'GameError';
    this.code = code;
    this.details = details;
  }
}

function asAckError(error) {
  if (error instanceof GameError) {
    return { ok: false, code: error.code, message: error.message, details: error.details };
  }

  console.error(error);
  return { ok: false, code: 'SERVER_ERROR', message: MESSAGES.SERVER_ERROR };
}

module.exports = { GameError, MESSAGES, asAckError };
