// Mock DB — 문서 데이터셋

interface MockDocDataset {
  id: string
  name: string
  version: string
  isActive: boolean
  isBuilding: boolean
  updatedAt: string
  chunkCount: number
  documentCount: number
  urlCount: number
  searchQuality: number
  embeddingModel: string
  vectorDb: string
  chunkSize: number
  chunkOverlap: number
  chunkStrategy: string
  buildProgress?: number
  buildTotal?: number
  buildCompleted?: number
}

const today = () => new Date().toISOString().slice(0, 10)

const datasetList: MockDocDataset[] = [
  {
    id: 'ds-1',
    name: 'ERP 지식베이스',
    version: 'v2.1',
    isActive: true,
    isBuilding: false,
    updatedAt: '2025-02-10',
    chunkCount: 5247,
    documentCount: 42,
    urlCount: 8,
    searchQuality: 92,
    embeddingModel: 'text-embedding-3-large',
    vectorDb: 'Pinecone',
    chunkSize: 512,
    chunkOverlap: 50,
    chunkStrategy: 'Recursive',
  },
  {
    id: 'ds-2',
    name: 'HR 정책 문서',
    version: 'v1.3',
    isActive: true,
    isBuilding: false,
    updatedAt: '2025-02-08',
    chunkCount: 3120,
    documentCount: 28,
    urlCount: 5,
    searchQuality: 88,
    embeddingModel: 'text-embedding-3-large',
    vectorDb: 'Pinecone',
    chunkSize: 512,
    chunkOverlap: 50,
    chunkStrategy: 'Recursive',
  },
  {
    id: 'ds-3',
    name: '제품 매뉴얼',
    version: 'v3.0',
    isActive: false,
    isBuilding: false,
    updatedAt: '2025-01-25',
    chunkCount: 8900,
    documentCount: 65,
    urlCount: 12,
    searchQuality: 85,
    embeddingModel: 'text-embedding-3-large',
    vectorDb: 'Pinecone',
    chunkSize: 512,
    chunkOverlap: 50,
    chunkStrategy: 'Recursive',
  },
  {
    id: 'ds-4',
    name: '고객 FAQ',
    version: 'v1.0',
    isActive: true,
    isBuilding: true,
    updatedAt: '2025-02-10',
    chunkCount: 0,
    documentCount: 35,
    urlCount: 20,
    searchQuality: 0,
    embeddingModel: 'text-embedding-3-large',
    vectorDb: 'Pinecone',
    chunkSize: 512,
    chunkOverlap: 50,
    chunkStrategy: 'Recursive',
    buildProgress: 68,
    buildTotal: 2780,
    buildCompleted: 1892,
  },
]

// ===== 문서 파일 목록 =====
interface MockDocFile {
  id: string
  name: string
  size: string
  categoryId: string
}

const docFileList: MockDocFile[] = [
  { id: 'doc-1', name: 'ERP시스템_사용자매뉴얼.pdf', size: '2.4 MB', categoryId: 'cat-1-1' },
  { id: 'doc-2', name: '인사관리_정책문서_2025.docx', size: '2.4 MB', categoryId: 'cat-1-1' },
  { id: 'doc-3', name: '전자결재_업무가이드.pdf', size: '2.4 MB', categoryId: 'cat-1-2' },
  { id: 'doc-4', name: 'ERP시스템_사용자매뉴얼.pdf', size: '2.4 MB', categoryId: 'cat-1-2' },
  { id: 'doc-5', name: '이 영역은 고정높이, 목록 6개부터 스크롤.pdf', size: '2.4 MB', categoryId: 'cat-2' },
  { id: 'doc-6', name: '급여관리_매뉴얼.pdf', size: '1.8 MB', categoryId: 'cat-2' },
  { id: 'doc-7', name: '근태관리_시스템_가이드.pdf', size: '3.1 MB', categoryId: 'cat-2' },
  { id: 'doc-8', name: '복리후생_안내서.docx', size: '1.2 MB', categoryId: 'cat-3' },
  { id: 'doc-9', name: '채용프로세스_매뉴얼.pdf', size: '2.0 MB', categoryId: 'cat-3' },
  { id: 'doc-10', name: '조직관리_정책.pdf', size: '1.5 MB', categoryId: 'cat-3' },
]

// ===== URL 목록 =====
interface MockDocUrl {
  id: string
  name: string
  url: string
  category: string
}

const urlList: MockDocUrl[] = [
  { id: 'url-1', name: '공식 블로그', url: 'https://blog.example.com', category: '블로그' },
  { id: 'url-2', name: '기술 문서', url: 'https://docs.example.com', category: '문서' },
  { id: 'url-3', name: '기술 문서', url: 'https://docs.example.com', category: '문서' },
  { id: 'url-4', name: '기술 문서', url: 'https://docs.example.com', category: '문서' },
  { id: 'url-5', name: '기술 문서', url: 'https://docs.example.com', category: '문서' },
  { id: 'url-6', name: '기술 문서', url: 'https://docs.example.com', category: '문서' },
]

export const mockDocDatasetDb = {
  getList: () => datasetList.map((d) => ({ ...d })),

  getSummary: () => {
    const active = datasetList.filter((d) => d.isActive)
    const inactive = datasetList.filter((d) => !d.isActive)
    const totalChunks = datasetList.reduce((sum, d) => sum + d.chunkCount, 0)
    const qualityList = datasetList.filter((d) => d.searchQuality > 0)
    const avgQuality = qualityList.length > 0
      ? Math.round(qualityList.reduce((sum, d) => sum + d.searchQuality, 0) / qualityList.length * 10) / 10
      : 0
    const totalDocs = datasetList.reduce((sum, d) => sum + d.documentCount, 0)
    const totalUrls = datasetList.reduce((sum, d) => sum + d.urlCount, 0)

    // 벡터 수 포맷 (K, M)
    const vectorCount = totalChunks * 1.5
    let totalVectors = ''
    if (vectorCount >= 1000000) {
      totalVectors = `${(vectorCount / 1000000).toFixed(1)}M`
    } else if (vectorCount >= 1000) {
      totalVectors = `${(vectorCount / 1000).toFixed(1)}K`
    } else {
      totalVectors = `${Math.round(vectorCount)}`
    }

    return {
      totalCount: datasetList.length,
      activeCount: active.length,
      inactiveCount: inactive.length,
      totalVectors,
      avgSearchQuality: avgQuality,
      totalDocuments: totalDocs,
      totalUrls: totalUrls,
    }
  },

  save: (dataset: Partial<MockDocDataset>) => {
    const index = datasetList.findIndex((d) => d.id === dataset.id)
    if (index > -1) {
      datasetList[index] = { ...datasetList[index], ...dataset, updatedAt: today() }
      return datasetList[index]
    } else {
      const newDataset: MockDocDataset = {
        id: `ds-${Date.now()}`,
        name: '',
        version: 'v1.0',
        isActive: true,
        isBuilding: true,
        updatedAt: today(),
        chunkCount: 0,
        documentCount: 0,
        urlCount: 0,
        searchQuality: 0,
        embeddingModel: 'text-embedding-3-large',
        vectorDb: 'Pinecone',
        chunkSize: 512,
        chunkOverlap: 50,
        chunkStrategy: 'Recursive',
        buildProgress: 0,
        buildTotal: 0,
        buildCompleted: 0,
        ...dataset,
      }
      datasetList.push(newDataset)
      return newDataset
    }
  },

  delete: (id: string) => {
    const index = datasetList.findIndex((d) => d.id === id)
    if (index > -1) datasetList.splice(index, 1)
    return { id }
  },

  // 문서 파일 목록
  getDocFiles: () => docFileList.map((d) => ({ ...d })),

  // URL 목록
  getUrls: () => urlList.map((u) => ({ ...u })),

  toggleActive: (id: string) => {
    const item = datasetList.find((d) => d.id === id)
    if (item) item.isActive = !item.isActive
    return item ?? null
  },
}
