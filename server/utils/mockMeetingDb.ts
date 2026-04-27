// Mock DB — 서버 메모리에 저장 (서버 재시작 시 초기화)

interface MockMeetingStep {
  key: string
  label: string
  status: 'wait' | 'progress' | 'done'
}

interface MockSpeaker {
  id: string
  name: string
  alias?: string
  colorIndex: number
}

interface MockSttItem {
  id: string
  speakerId: string
  speakerName: string
  time: string
  text: string
}

interface MockRecipient {
  id: string
  name: string
  email?: string
}

interface MockMeeting {
  id: string
  title: string
  date: string
  location?: string
  participants: string[]
  purpose?: string
  steps: MockMeetingStep[]
  speakers: MockSpeaker[]
  sttList: MockSttItem[]
  minutesContent: string
  fileFormat: 'docx' | 'pdf' | 'hwp' | 'txt' | 'md'
  recipients: MockRecipient[]
  templateId: string
  language: string
  createdAt: string
  updatedAt: string
}

const today = () => new Date().toISOString().slice(0, 10)
const now = () => new Date().toISOString()

// ============================================
// 🔽 더미 데이터 — 백엔드 연결 시 API로 교체
// ============================================

const defaultSteps = (): MockMeetingStep[] => [
  { key: 'record', label: '회의 녹음 / 실시간 STT', status: 'wait' },
  { key: 'speaker', label: '화자 분리', status: 'wait' },
  { key: 'generate', label: '회의록 자동 생성', status: 'wait' },
  { key: 'edit', label: '회의록 편집', status: 'wait' },
  { key: 'share', label: '저장 및 공유', status: 'wait' },
]

const sampleSpeakers: MockSpeaker[] = [
  { id: 'sp-1', name: '김지현', alias: '나', colorIndex: 0 },
  { id: 'sp-2', name: '박상우', colorIndex: 1 },
  { id: 'sp-3', name: '이수진', colorIndex: 2 },
  { id: 'sp-4', name: '최민호', colorIndex: 3 },
  { id: 'sp-5', name: '정우영', colorIndex: 4 },
  { id: 'sp-6', name: '한지혜', colorIndex: 5 },
]

const sampleStt: MockSttItem[] = [
  {
    id: 'stt-1',
    speakerId: 'sp-1',
    speakerName: '김지현',
    time: '10:00:15',
    text: '안녕하세요. 오늘 회의는 5월 마케팅 전략에 대해 논의하고 실행 계획을 수립하는 자리입니다.',
  },
  {
    id: 'stt-2',
    speakerId: 'sp-2',
    speakerName: '박상우',
    time: '10:01:02',
    text: '5월 프로모션 목표는 신규 고객 유입 20% 증가시키는 것으로 설정했습니다.',
  },
  {
    id: 'stt-3',
    speakerId: 'sp-3',
    speakerName: '이수진',
    time: '10:01:45',
    text: "타겟 고객 분석 결과를 기반으로 캠페인 메시지를 재정의했습니다. 주요 키워드는 '간편함'과 '신뢰'입니다.",
  },
  {
    id: 'stt-4',
    speakerId: 'sp-4',
    speakerName: '최민호',
    time: '10:02:30',
    text: '예산은 총 2천만원으로 제안드리며, 디지털 광고와 인플루언서 협업에 집중할 예정입니다.',
  },
  {
    id: 'stt-5',
    speakerId: 'sp-1',
    speakerName: '김지현',
    time: '10:03:12',
    text: '좋습니다. 각 항목별 담당자와 일정을 아래에서 확정해 주세요.',
  },
]

const sampleMinutesContent = `<h2>1. 회의 개요</h2>
<ul>
  <li>회의명: 2026년 5월 마케팅 전략 회의</li>
  <li>일시: 2026.05.20 (월) 10:00 ~ 11:30</li>
  <li>장소: 회의실 A / 온라인</li>
  <li>참석자: 김지현, 박상우, 이수진, 최민호, 정우영, 한지혜</li>
  <li>회의 목적: 5월 마케팅 전략 논의 및 실행 계획 수립</li>
</ul>

<h2>2. 주요 논의 내용</h2>
<table>
  <thead>
    <tr><th>안건</th><th>주요 내용</th></tr>
  </thead>
  <tbody>
    <tr><td>5월 프로모션 목표</td><td>신규 고객 유입 20% 증가</td></tr>
    <tr><td>타겟 고객 및 메시지</td><td>핵심 키워드 '간편함', '신뢰'</td></tr>
    <tr><td>예산 및 채널</td><td>총 2천만원, 디지털 광고 및 인플루언서 협업 중심</td></tr>
    <tr><td>기타 논의</td><td>세부 실행 계획 및 일정 확정 필요</td></tr>
  </tbody>
</table>

<h2>3. 실행 계획</h2>
<table>
  <thead>
    <tr><th>No.</th><th>과제</th><th>담당자</th><th>기한</th><th>비고</th></tr>
  </thead>
  <tbody>
    <tr><td>1</td><td>캠페인 기획안 상세화</td><td>이수진</td><td>~ 5/24(금)</td><td>타겟 메시지 확정</td></tr>
    <tr><td>2</td><td>디지털 광고 집행 계획 수립</td><td>최민호</td><td>~ 5/24(금)</td><td>매체/예산 배분 포함</td></tr>
    <tr><td>3</td><td>인플루언서 섭외 및 협업 논의</td><td>정우영</td><td>~ 5/27(월)</td><td>후보 리스트업</td></tr>
    <tr><td>4</td><td>성과 지표 및 측정 방안 정의</td><td>한지혜</td><td>~ 5/27(월)</td><td>KPI 설정</td></tr>
  </tbody>
</table>

<h2>4. 다음 회의</h2>
<ul>
  <li>일시: 2026.05.27 (월) 10:00</li>
  <li>안건: 실행 계획 진행 상황 점검</li>
</ul>`

const meetingList: MockMeeting[] = [
  {
    id: 'meeting-1',
    title: '2026년 5월 마케팅 전략 회의',
    date: '2026.05.20 (월) 10:00 ~ 11:30',
    location: '회의실 A / 온라인',
    participants: ['김지현', '박상우', '이수진', '최민호', '정우영', '한지혜'],
    purpose: '5월 마케팅 전략 논의 및 실행 계획 수립',
    steps: [
      { key: 'record', label: '회의 녹음 / 실시간 STT', status: 'progress' },
      { key: 'speaker', label: '화자 분리', status: 'done' },
      { key: 'generate', label: '회의록 자동 생성', status: 'done' },
      { key: 'edit', label: '회의록 편집', status: 'progress' },
      { key: 'share', label: '저장 및 공유', status: 'wait' },
    ],
    speakers: [...sampleSpeakers],
    sttList: [...sampleStt],
    minutesContent: sampleMinutesContent,
    fileFormat: 'pdf',
    recipients: [
      { id: 'rc-1', name: '김지현' },
      { id: 'rc-2', name: '박상우' },
      { id: 'rc-3', name: '이수진' },
      { id: 'rc-4', name: '최민호' },
      { id: 'rc-5', name: '정우영' },
      { id: 'rc-6', name: '한지혜' },
    ],
    templateId: 'default',
    language: 'ko',
    createdAt: '2026-04-26',
    updatedAt: '2026-04-27',
  },
  {
    id: 'meeting-2',
    title: '주간 개발 스프린트 리뷰',
    date: '2026.04.22 (월) 14:00 ~ 15:00',
    location: '회의실 B',
    participants: ['김지현', '박상우', '이수진'],
    purpose: '스프린트 결과 공유 및 다음 스프린트 계획',
    steps: defaultSteps().map((s) => ({ ...s, status: 'done' as const })),
    speakers: sampleSpeakers.slice(0, 3),
    sttList: [],
    minutesContent: '<h2>스프린트 리뷰</h2><p>완료 항목과 잔여 작업을 정리했습니다.</p>',
    fileFormat: 'docx',
    recipients: [{ id: 'rc-1', name: '김지현' }],
    templateId: 'default',
    language: 'ko',
    createdAt: '2026-04-22',
    updatedAt: '2026-04-22',
  },
]

// ===== Mock 사용자 (메일 발송 대상 검색용) =====
interface MockMeetingUser {
  id: string
  name: string
  email: string
  dept: string
}

const userList: MockMeetingUser[] = [
  { id: 'u-1', name: '김지현', email: 'jihyun.kim@company.com', dept: '마케팅' },
  { id: 'u-2', name: '박상우', email: 'sangwoo.park@company.com', dept: '마케팅' },
  { id: 'u-3', name: '이수진', email: 'sujin.lee@company.com', dept: '마케팅' },
  { id: 'u-4', name: '최민호', email: 'minho.choi@company.com', dept: '재무' },
  { id: 'u-5', name: '정우영', email: 'wooyoung.jung@company.com', dept: '영업' },
  { id: 'u-6', name: '한지혜', email: 'jihye.han@company.com', dept: '데이터' },
  { id: 'u-7', name: '강민수', email: 'minsu.kang@company.com', dept: '개발' },
  { id: 'u-8', name: '윤서연', email: 'seoyeon.yoon@company.com', dept: '디자인' },
  { id: 'u-9', name: '오현준', email: 'hyunjun.oh@company.com', dept: '개발' },
  { id: 'u-10', name: '임채영', email: 'chaeyoung.lim@company.com', dept: '인사' },
]

export const mockMeetingUserDb = {
  /** 사용자 검색 — 이름/메일/부서로 부분 일치 */
  search: (keyword: string) => {
    const kw = keyword.trim().toLowerCase()
    if (!kw) return [...userList]
    return userList.filter(
      (u) =>
        u.name.toLowerCase().includes(kw) ||
        u.email.toLowerCase().includes(kw) ||
        u.dept.toLowerCase().includes(kw),
    )
  },
  /** 회의 참석자 이름 배열 → 사용자 정보 매칭 */
  matchByNames: (names: string[]) => {
    return names
      .map((name) => userList.find((u) => u.name === name))
      .filter((u): u is MockMeetingUser => Boolean(u))
  },
}

// ===== Meeting CRUD =====
export const mockMeetingDb = {
  // 목록 조회
  getList: () => [...meetingList],

  // 단건 조회
  getDetail: (id: string) => meetingList.find((m) => m.id === id) ?? null,

  // 추가/수정
  save: (meeting: Partial<MockMeeting>) => {
    const index = meeting.id ? meetingList.findIndex((m) => m.id === meeting.id) : -1
    if (index > -1) {
      meetingList[index] = {
        ...meetingList[index],
        ...meeting,
        updatedAt: now(), // ISO datetime — 자동 저장 시각까지 표시되도록
      }
      return meetingList[index]
    } else {
      const newMeeting: MockMeeting = {
        id: `meeting-${Date.now()}`,
        title: '새 회의',
        date: now().slice(0, 10),
        participants: [],
        steps: defaultSteps(),
        speakers: [],
        sttList: [],
        minutesContent: '',
        fileFormat: 'pdf',
        recipients: [],
        templateId: 'default',
        language: 'ko',
        createdAt: today(),
        updatedAt: now(),
        ...meeting,
      }
      meetingList.push(newMeeting)
      return newMeeting
    }
  },

  // 삭제
  delete: (id: string) => {
    const index = meetingList.findIndex((m) => m.id === id)
    if (index > -1) meetingList.splice(index, 1)
    return { id }
  },

  // 화자 정보 저장
  saveSpeaker: (meetingId: string, speaker: Partial<MockSpeaker>) => {
    const meeting = meetingList.find((m) => m.id === meetingId)
    if (!meeting) return null
    const index = speaker.id ? meeting.speakers.findIndex((s) => s.id === speaker.id) : -1
    if (index > -1) {
      meeting.speakers[index] = { ...meeting.speakers[index], ...speaker }
      return meeting.speakers[index]
    } else {
      const newSpeaker: MockSpeaker = {
        id: `sp-${Date.now()}`,
        name: '',
        colorIndex: meeting.speakers.length % 8,
        ...speaker,
      }
      meeting.speakers.push(newSpeaker)
      return newSpeaker
    }
  },

  // 화자 일괄 저장 — 이름 매핑 후 STT 발화 화자명도 동기화
  saveSpeakers: (meetingId: string, speakers: Partial<MockSpeaker>[]) => {
    const meeting = meetingList.find((m) => m.id === meetingId)
    if (!meeting) return []
    speakers.forEach((sp) => {
      if (!sp.id) return
      const idx = meeting.speakers.findIndex((s) => s.id === sp.id)
      if (idx > -1) meeting.speakers[idx] = { ...meeting.speakers[idx], ...sp }
    })
    // STT 발화 화자명 동기화 (화자1 → 허희진 매핑이 STT 리스트에도 즉시 반영)
    meeting.sttList = meeting.sttList.map((stt) => {
      const speaker = meeting.speakers.find((s) => s.id === stt.speakerId)
      return speaker ? { ...stt, speakerName: speaker.name } : stt
    })
    return [...meeting.speakers]
  },

  // STT 더미 발화 추가 (녹음 중 가짜 데이터 생성)
  pushSttDummy: (meetingId: string) => {
    const meeting = meetingList.find((m) => m.id === meetingId)
    if (!meeting || meeting.speakers.length === 0) return null
    const speaker = meeting.speakers[Math.floor(Math.random() * meeting.speakers.length)]
    const dummyTexts = [
      '추가 의견을 드리자면 일정 재조정이 필요합니다.',
      '해당 사항은 다음 회의에서 다시 다루는 게 좋겠습니다.',
      '제가 말씀드린 부분은 별도 자료로 공유드리겠습니다.',
      '이번 분기 KPI 달성을 위한 추가 캠페인을 검토해 주세요.',
      '그 부분은 제가 담당해서 진행하겠습니다.',
    ]
    const newItem: MockSttItem = {
      id: `stt-${Date.now()}`,
      speakerId: speaker.id,
      speakerName: speaker.name,
      time: new Date().toTimeString().slice(0, 8),
      text: dummyTexts[Math.floor(Math.random() * dummyTexts.length)],
    }
    meeting.sttList.push(newItem)
    return newItem
  },
}
