/**
 * 쿠키 처리 유틸리티
 * - 쿠키 생성/읽기/삭제/설정 (document.cookie 기반)
 */

/** 쿠키 생성 */
export const createCookie = (name: string, value: string, days: number, secure: boolean = false): void => {
  let expires = ''
  if (days) {
    const date = new Date()
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
    expires = '; expires=' + date.toUTCString()
  }
  const secureFlag = secure ? '; secure' : ''
  document.cookie = name + '=' + value + expires + '; path=/' + secureFlag
}

/** 쿠키 읽기 */
export const getCookie = (name: string): string | null => {
  const nameEQ = name + '='
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

/** 쿠키 삭제 */
export const deleteCookie = (name: string): void => {
  createCookie(name, '', -1)
}

/** 쿠키 설정 */
export const setCookie = (cookieNm: string, value: unknown, expiredDays: number): void => {
  const now = new Date()
  now.setDate(now.getDate() + expiredDays)
  document.cookie = cookieNm + '=' + nvl(value, '') + ';expires=' + now.toUTCString()
}
