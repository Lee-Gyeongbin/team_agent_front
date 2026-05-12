import { format } from 'sql-formatter'

/**
 * SQL 문자열을 가독성 있게 포맷팅
 * - 키워드 대문자 유지, 들여쓰기 2칸, MySQL 방언 사용
 */
export const formatSql = (sql: string | undefined | null): string => {
  if (!sql) return ''
  try {
    return format(sql, {
      language: 'mysql',
      tabWidth: 2,
      keywordCase: 'upper',
      linesBetweenQueries: 1,
    })
  } catch {
    // 파싱 실패 시 원본 그대로 반환
    return sql
  }
}
