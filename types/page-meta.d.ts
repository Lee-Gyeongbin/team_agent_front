declare module '#app' {
  interface PageMeta {
    /** 'read' = 해당 화면 경로의 조회 권한이 없으면 접근을 막는다 */
    permission?: 'read'
  }
}

export {}
