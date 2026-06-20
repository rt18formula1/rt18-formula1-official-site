/**
 * F1サーキットのタイムゾーンデータ
 * 国名またはレース名でUTCオフセット（時間）とIANAタイムゾーンを取得する
 */

export interface CircuitTimezone {
  utcOffset: number;  // UTC+Nの整数（例: 9 = UTC+9）
  ianaTimezone: string;
  label: string;       // 表示用: "UTC+9" など
}

// サーキット名/国名 → タイムゾーンのマッピング
const CIRCUIT_TIMEZONES: Record<string, CircuitTimezone> = {
  // ===== オーストラリア =====
  'Australia': { utcOffset: 11, ianaTimezone: 'Australia/Melbourne', label: 'UTC+11' },
  // ===== 中国 =====
  'China': { utcOffset: 8, ianaTimezone: 'Asia/Shanghai', label: 'UTC+8' },
  // ===== 日本 =====
  'Japan': { utcOffset: 9, ianaTimezone: 'Asia/Tokyo', label: 'UTC+9' },
  // ===== バーレーン =====
  'Bahrain': { utcOffset: 3, ianaTimezone: 'Asia/Bahrain', label: 'UTC+3' },
  // ===== サウジアラビア =====
  'Saudi Arabia': { utcOffset: 3, ianaTimezone: 'Asia/Riyadh', label: 'UTC+3' },
  // ===== マイアミ（USA）=====
  'USA': { utcOffset: -4, ianaTimezone: 'America/New_York', label: 'UTC-4' },
  'United States': { utcOffset: -4, ianaTimezone: 'America/New_York', label: 'UTC-4' },
  'Austin': { utcOffset: -5, ianaTimezone: 'America/Chicago', label: 'UTC-5' },
  // ===== エミリア・ロマーニャ / イタリア =====
  'Italy': { utcOffset: 2, ianaTimezone: 'Europe/Rome', label: 'UTC+2' },
  // ===== モナコ =====
  'Monaco': { utcOffset: 2, ianaTimezone: 'Europe/Monaco', label: 'UTC+2' },
  // ===== カナダ =====
  'Canada': { utcOffset: -4, ianaTimezone: 'America/Toronto', label: 'UTC-4' },
  // ===== スペイン =====
  'Spain': { utcOffset: 2, ianaTimezone: 'Europe/Madrid', label: 'UTC+2' },
  // ===== オーストリア =====
  'Austria': { utcOffset: 2, ianaTimezone: 'Europe/Vienna', label: 'UTC+2' },
  // ===== イギリス =====
  'UK': { utcOffset: 1, ianaTimezone: 'Europe/London', label: 'UTC+1' },
  'Great Britain': { utcOffset: 1, ianaTimezone: 'Europe/London', label: 'UTC+1' },
  // ===== ベルギー =====
  'Belgium': { utcOffset: 2, ianaTimezone: 'Europe/Brussels', label: 'UTC+2' },
  // ===== ハンガリー =====
  'Hungary': { utcOffset: 2, ianaTimezone: 'Europe/Budapest', label: 'UTC+2' },
  // ===== オランダ =====
  'Netherlands': { utcOffset: 2, ianaTimezone: 'Europe/Amsterdam', label: 'UTC+2' },
  // ===== シンガポール =====
  'Singapore': { utcOffset: 8, ianaTimezone: 'Asia/Singapore', label: 'UTC+8' },
  // ===== アゼルバイジャン =====
  'Azerbaijan': { utcOffset: 4, ianaTimezone: 'Asia/Baku', label: 'UTC+4' },
  // ===== メキシコ =====
  'Mexico': { utcOffset: -6, ianaTimezone: 'America/Mexico_City', label: 'UTC-6' },
  // ===== ブラジル =====
  'Brazil': { utcOffset: -3, ianaTimezone: 'America/Sao_Paulo', label: 'UTC-3' },
  // ===== ラスベガス（USA）=====
  'Las Vegas': { utcOffset: -8, ianaTimezone: 'America/Los_Angeles', label: 'UTC-8' },
  // ===== カタール =====
  'Qatar': { utcOffset: 3, ianaTimezone: 'Asia/Qatar', label: 'UTC+3' },
  // ===== アブダビ（UAE）=====
  'UAE': { utcOffset: 4, ianaTimezone: 'Asia/Dubai', label: 'UTC+4' },
  'Abu Dhabi': { utcOffset: 4, ianaTimezone: 'Asia/Dubai', label: 'UTC+4' },
};

// レース名→国名のマッピング（一部のケース用）
const RACE_NAME_TO_COUNTRY: Record<string, string> = {
  'Miami Grand Prix': 'USA',
  'United States Grand Prix': 'USA',
  'MSC Cruises United States Grand Prix': 'Austin',
  'Austin': 'Austin',
  'Las Vegas Grand Prix': 'Las Vegas',
  'Spanish Grand Prix': 'Spain',
  'Gran Premio de España': 'Spain',
  'Madrid': 'Spain',
  'São Paulo Grand Prix': 'Brazil',
  'Sao Paulo Grand Prix': 'Brazil',
  'Abu Dhabi Grand Prix': 'UAE',
};

/**
 * レースの国名（またはレース名）からタイムゾーン情報を取得する
 * 見つからない場合は UTC+0 を返す
 */
export function getCircuitTimezone(country: string, raceName?: string): CircuitTimezone {
  // まずレース名で試みる
  if (raceName) {
    for (const [key, tz] of Object.entries(RACE_NAME_TO_COUNTRY)) {
      if (raceName.includes(key) || key.includes(raceName)) {
        return CIRCUIT_TIMEZONES[tz] ?? CIRCUIT_TIMEZONES['USA'];
      }
    }
  }

  // 国名で直接検索
  if (CIRCUIT_TIMEZONES[country]) {
    return CIRCUIT_TIMEZONES[country];
  }

  // 部分一致で検索
  for (const [key, tz] of Object.entries(CIRCUIT_TIMEZONES)) {
    if (country.includes(key) || key.includes(country)) {
      return tz;
    }
  }

  // デフォルトはUTC+0
  return { utcOffset: 0, ianaTimezone: 'UTC', label: 'UTC+0' };
}

/**
 * UTCのセッション時刻を指定タイムゾーンに変換する
 * date: "YYYY-MM-DD", time: "HH:MM:SSZ" (Jolpica形式)
 * Returns: { date: "MM/DD", time: "HH:MM" }
 */
export function convertSessionTime(
  sessionDate: string,
  sessionTime: string,
  utcOffset: number
): { date: string; time: string } {
  // "2026-05-22" + "12:30:00Z" → UTCのDateオブジェクト
  const isoString = `${sessionDate}T${sessionTime.replace('Z', '')}Z`;
  const utcDate = new Date(isoString);

  // UTCオフセットを加算
  const localMs = utcDate.getTime() + utcOffset * 60 * 60 * 1000;
  const localDate = new Date(localMs);

  const month = String(localDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(localDate.getUTCDate()).padStart(2, '0');
  const hours = String(localDate.getUTCHours()).padStart(2, '0');
  const minutes = String(localDate.getUTCMinutes()).padStart(2, '0');

  return {
    date: `${month}/${day}`,
    time: `${hours}:${minutes}`,
  };
}

/** セッション所要時間（デフォルト値・分単位） */
export const SESSION_DURATIONS: Record<string, number> = {
  fp1: 60,
  fp2: 60,
  fp3: 60,
  sprintQualifying: 44,
  sprint: 30,
  qualifying: 60,
  race: 120,
};

/** セッション表示名 */
export const SESSION_LABELS: Record<string, string> = {
  fp1: 'Practice 1',
  fp2: 'Practice 2',
  fp3: 'Practice 3',
  sprintQualifying: 'Sprint Qualifying',
  sprint: 'Sprint',
  qualifying: 'Qualifying',
  race: 'Race',
};
