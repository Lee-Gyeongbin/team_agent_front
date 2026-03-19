// ===== 카테고리 =====

interface MockCategory {
  id: string
  name: string
  parentId: string | null
  order: number
}

const categoryList: MockCategory[] = [
  { id: 'cat-1', name: '제품 문서', parentId: null, order: 0 },
  { id: 'cat-1-1', name: 'ERP 매뉴얼', parentId: 'cat-1', order: 0 },
  { id: 'cat-1-1-1', name: '사용자 가이드', parentId: 'cat-1-1', order: 0 },
  { id: 'cat-1-1-1-1', name: '관리자 매뉴얼', parentId: 'cat-1-1-1', order: 0 },
  { id: 'cat-2', name: '정책/규정', parentId: null, order: 1 },
  { id: 'cat-2-1', name: '개인정보', parentId: 'cat-2', order: 0 },
  { id: 'cat-3', name: '기술 문서', parentId: null, order: 2 },
  { id: 'cat-4', name: '마케팅', parentId: null, order: 3 },
  { id: 'cat-5', name: '지원센터', parentId: null, order: 4 },
]

// flat → tree 변환
function buildTree(items: MockCategory[], parentId: string | null = null): any[] {
  return items
    .filter((i) => i.parentId === parentId)
    .sort((a, b) => a.order - b.order)
    .map((i) => {
      const children = buildTree(items, i.id)
      return {
        id: i.id,
        name: i.name,
        expanded: false,
        ...(children.length > 0 ? { children } : {}),
      }
    })
}

export const mockCategoryDb = {
  getTree: () => buildTree(categoryList),

  save: (item: { id?: string; name: string; parentId?: string | null }) => {
    if (item.id) {
      const target = categoryList.find((c) => c.id === item.id)
      if (target) {
        target.name = item.name
        return target
      }
    }
    const newItem: MockCategory = {
      id: `cat-${Date.now()}`,
      name: item.name,
      parentId: item.parentId ?? null,
      order: categoryList.filter((c) => c.parentId === (item.parentId ?? null)).length,
    }
    categoryList.push(newItem)
    return newItem
  },

  rename: (id: string, name: string) => {
    const target = categoryList.find((c) => c.id === id)
    if (target) {
      target.name = name
      return target
    }
    return null
  },

  delete: (id: string) => {
    // 자식까지 재귀 삭제
    const idsToDelete = new Set<string>()
    const collect = (parentId: string) => {
      idsToDelete.add(parentId)
      categoryList.filter((c) => c.parentId === parentId).forEach((c) => collect(c.id))
    }
    collect(id)
    for (let i = categoryList.length - 1; i >= 0; i--) {
      if (idsToDelete.has(categoryList[i].id)) categoryList.splice(i, 1)
    }
    return { id }
  },
}

// ===== 문서 =====

interface MockDocument {
  id: string
  documentName: string
  fileType: string
  fileSize: string
  registerDate: string
  status: string
  ragCount: number
  categoryId: string
}

const documentList: MockDocument[] = [
  { id: 'doc-1', documentName: 'ERP시스템_사용자매뉴얼.pdf', fileType: 'pdf', fileSize: '2.4MB', registerDate: '2025.01.02', status: '활성', ragCount: 5, categoryId: 'cat-1-1' },
  { id: 'doc-2', documentName: '개인정보처리방침.txt', fileType: 'txt', fileSize: '128KB', registerDate: '2025.01.01', status: '활성', ragCount: 2, categoryId: 'cat-2-1' },
  { id: 'doc-3', documentName: '제안서_초안.doc', fileType: 'doc', fileSize: '1.1MB', registerDate: '2024.12.28', status: '활성', ragCount: 1, categoryId: 'cat-3' },
  { id: 'doc-4', documentName: 'API_연동가이드_v2.pdf', fileType: 'pdf', fileSize: '3.8MB', registerDate: '2025.01.05', status: '활성', ragCount: 3, categoryId: 'cat-3' },
  { id: 'doc-5', documentName: '2025_마케팅전략.doc', fileType: 'doc', fileSize: '2.1MB', registerDate: '2025.01.03', status: '비활성', ragCount: 0, categoryId: 'cat-4' },
  { id: 'doc-6', documentName: '보안정책_v3.pdf', fileType: 'pdf', fileSize: '1.5MB', registerDate: '2024.12.20', status: '활성', ragCount: 4, categoryId: 'cat-2' },
  { id: 'doc-7', documentName: '서비스_이용약관.txt', fileType: 'txt', fileSize: '98KB', registerDate: '2024.12.15', status: '활성', ragCount: 1, categoryId: 'cat-2-1' },
  { id: 'doc-8', documentName: '시스템_아키텍처.pdf', fileType: 'pdf', fileSize: '5.2MB', registerDate: '2025.01.08', status: '활성', ragCount: 6, categoryId: 'cat-3' },
  { id: 'doc-9', documentName: '고객응대_매뉴얼.doc', fileType: 'doc', fileSize: '890KB', registerDate: '2025.01.04', status: '활성', ragCount: 2, categoryId: 'cat-5' },
  { id: 'doc-10', documentName: 'FAQ_정리.txt', fileType: 'txt', fileSize: '256KB', registerDate: '2025.01.06', status: '비활성', ragCount: 0, categoryId: 'cat-5' },
  { id: 'doc-11', documentName: '데이터베이스_설계서.pdf', fileType: 'pdf', fileSize: '4.3MB', registerDate: '2025.01.07', status: '활성', ragCount: 3, categoryId: 'cat-3' },
  { id: 'doc-12', documentName: '회의록_20250110.doc', fileType: 'doc', fileSize: '320KB', registerDate: '2025.01.10', status: '활성', ragCount: 0, categoryId: 'cat-1-1' },
]

export const mockDocumentDb = {
  getList: (params?: { keyword?: string; status?: string; categoryIds?: string[]; page?: number; pageSize?: number }) => {
    let filtered = [...documentList]

    if (params?.keyword) {
      const kw = params.keyword.toLowerCase()
      filtered = filtered.filter((d) => d.documentName.toLowerCase().includes(kw))
    }
    if (params?.status && params.status !== 'all') {
      const statusMap: Record<string, string> = { active: '활성', inactive: '비활성' }
      filtered = filtered.filter((d) => d.status === (statusMap[params.status!] || params.status))
    }
    if (params?.categoryIds?.length) {
      filtered = filtered.filter((d) => params.categoryIds!.includes(d.categoryId))
    }

    const total = filtered.length
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 10
    const start = (page - 1) * pageSize
    const list = filtered.slice(start, start + pageSize)

    return { list, total }
  },

  save: (item: Partial<MockDocument>) => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '.')
    const ext = item.documentName?.split('.').pop()?.toLowerCase() || 'txt'
    const newDoc: MockDocument = {
      id: `doc-${Date.now()}`,
      documentName: item.documentName || '새 문서',
      fileType: ext,
      fileSize: '0KB',
      registerDate: today,
      status: '활성',
      ragCount: 0,
      categoryId: item.categoryId || '',
      ...item,
    }
    documentList.push(newDoc)
    return newDoc
  },

  delete: (ids: string[]) => {
    for (let i = documentList.length - 1; i >= 0; i--) {
      if (ids.includes(documentList[i].id)) documentList.splice(i, 1)
    }
    return { ids }
  },
}

// ===== URL =====

interface MockUrl {
  id: string
  category: string
  urlAddress: string
  urlName: string
  collectionCycle: string
  lastCollectedAt: string
  active: boolean
  categoryId: string
}

const urlList: MockUrl[] = [
  { id: 'url-1', category: '블로그', urlAddress: 'https://blog.example.com', urlName: '공식블로그', collectionCycle: '매일', lastCollectedAt: '2025-02-11 00:15', active: true, categoryId: 'cat-4' },
  { id: 'url-2', category: '문서', urlAddress: 'https://docs.example.com/', urlName: '기술 문서', collectionCycle: '매일', lastCollectedAt: '2025-02-11 00:15', active: true, categoryId: 'cat-3' },
  { id: 'url-3', category: '지원센터', urlAddress: 'https://support.example.com/', urlName: '지원센터', collectionCycle: '매일', lastCollectedAt: '2025-02-11 00:15', active: false, categoryId: 'cat-5' },
  { id: 'url-4', category: '블로그', urlAddress: 'https://tech.blog.example.com', urlName: '기술 블로그', collectionCycle: '매주', lastCollectedAt: '2025-02-10 08:00', active: true, categoryId: 'cat-3' },
  { id: 'url-5', category: '뉴스', urlAddress: 'https://news.example.com/press', urlName: '보도자료', collectionCycle: '매일', lastCollectedAt: '2025-02-11 00:15', active: true, categoryId: 'cat-4' },
]

export const mockUrlDb = {
  getList: (params?: { keyword?: string; status?: string; category?: string; page?: number; pageSize?: number }) => {
    let filtered = [...urlList]

    if (params?.keyword) {
      const kw = params.keyword.toLowerCase()
      filtered = filtered.filter((u) => u.urlName.toLowerCase().includes(kw) || u.urlAddress.toLowerCase().includes(kw))
    }
    if (params?.status && params.status !== 'all') {
      filtered = filtered.filter((u) => (params.status === 'active' ? u.active : !u.active))
    }
    if (params?.category && params.category !== 'all') {
      filtered = filtered.filter((u) => u.category === params.category)
    }

    const total = filtered.length
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 10
    const start = (page - 1) * pageSize
    const list = filtered.slice(start, start + pageSize)

    return { list, total }
  },

  save: (item: Partial<MockUrl>) => {
    const idx = urlList.findIndex((u) => u.id === item.id)
    if (idx > -1) {
      urlList[idx] = { ...urlList[idx], ...item }
      return urlList[idx]
    }
    const newItem: MockUrl = {
      id: `url-${Date.now()}`,
      category: '',
      urlAddress: '',
      urlName: '',
      collectionCycle: '매일',
      lastCollectedAt: '-',
      active: true,
      categoryId: '',
      ...item,
    }
    urlList.push(newItem)
    return newItem
  },

  delete: (ids: string[]) => {
    for (let i = urlList.length - 1; i >= 0; i--) {
      if (ids.includes(urlList[i].id)) urlList.splice(i, 1)
    }
    return { ids }
  },

  toggleStatus: (id: string, active: boolean) => {
    const target = urlList.find((u) => u.id === id)
    if (target) {
      target.active = active
      return target
    }
    return null
  },
}
