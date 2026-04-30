/**
 * SEO向けの画像alt属性を自動生成するユーティリティ
 */

// 画像のalt属性を自動生成
export function generateImageAlt(
  title: string | null | undefined,
  type: 'news' | 'portfolio' | 'album' | 'profile' | 'sns' = 'news',
  additionalContext?: string
): string {
  if (!title) {
    // タイトルがない場合はデフォルトaltを返す
    return getDefaultAlt(type);
  }

  // タイトルをクリーンアップ（余分な記号を削除）
  const cleanTitle = title
    .replace(/[^\w\s\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // コンテキストに基づいたalt属性を生成
  const context = getContextPrefix(type);
  const suffix = getContextSuffix(type);
  
  let alt = `${context}${cleanTitle}${suffix}`;
  
  // 追加コンテキストがある場合は追加
  if (additionalContext) {
    alt += ` - ${additionalContext}`;
  }

  // 長さを制限（125文字以内）
  if (alt.length > 125) {
    alt = alt.substring(0, 122) + '...';
  }

  return alt;
}

// デフォルトalt属性
function getDefaultAlt(type: string): string {
  const defaults = {
    news: 'F1ニュース記事 - rt18_formula1',
    portfolio: 'F1ファンアート作品 - rt18_formula1',
    album: 'F1アルバムギャラリー - rt18_formula1',
    profile: 'rt18_formula1 プロフィール',
    sns: 'SNSリンク - rt18_formula1'
  };
  return defaults[type as keyof typeof defaults] || 'rt18_formula1';
}

// コンテキスト接頭辞
function getContextPrefix(type: string): string {
  const prefixes = {
    news: 'F1ニュース：',
    portfolio: 'F1ファンアート：',
    album: 'F1アルバム：',
    profile: '',
    sns: ''
  };
  return prefixes[type as keyof typeof prefixes] || '';
}

// コンテキスト接尾辞
function getContextSuffix(type: string): string {
  const suffixes = {
    news: ' - Formula 1最新ニュース',
    portfolio: ' - Formula 1イラスト作品',
    album: ' - Formula 1ギャラリー',
    profile: ' - rt18_formula1',
    sns: ' - rt18_formula1'
  };
  return suffixes[type as keyof typeof suffixes] || '';
}

// 画像ファイル名からalt属性を生成（フォールバック用）
export function generateAltFromFilename(filename: string): string {
  if (!filename) return 'rt18_formula1';
  
  // 拡張子を除去
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  
  // ハイフンやアンダースコアをスペースに変換
  const cleanedName = nameWithoutExt.replace(/[-_]/g, ' ');
  
  // 数字を除去
  const finalName = cleanedName.replace(/\d+/g, '').trim();
  
  if (finalName.length === 0) return 'rt18_formula1';
  
  return `rt18_formula1 - ${finalName}`;
}

// SEO最適化された画像コンポーネント用propsを生成
export function generateImageProps(
  src: string | null,
  title: string | null | undefined,
  type: 'news' | 'portfolio' | 'album' | 'profile' | 'sns' = 'news',
  additionalContext?: string
) {
  const alt = generateImageAlt(title, type, additionalContext);
  
  // srcがnullの場合は返さない
  if (!src) {
    return null;
  }
  
  return {
    src,
    alt,
    loading: 'lazy' as const,
    decoding: 'async' as const,
  };
}
