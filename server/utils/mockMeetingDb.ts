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

const sampleMinutesContent = `<h1>회의록</h1>
<table>
  <tbody>
    <tr><th>제목</th><td>퍼블릭 LLM 사용 및 비용 관련 논의</td></tr>
    <tr><th>작성자</th><td>허회진</td></tr>
    <tr><th>일시</th><td></td></tr>
    <tr><th>장소</th><td></td></tr>
    <tr><th>참석자</th><td>SPEAKER_00, SPEAKER_01</td></tr>
  </tbody>
</table>
<h2>안건</h2>
<ul>
  <li>퍼블릭 LLM 사용 가능 여부</li>
  <li>비용 발생 시점과 규모</li>
  <li>방산업체의 제약 사항</li>
</ul>
<h2>논의내용</h2>
<ul>
  <li>방산업체는 퍼블릭 LLM 사용 불가하여 SLM 이동 필요</li>
  <li>일부 기관에서는 퍼블릭 LLM 사용 가능</li>
  <li>과제 비용은 약 3600만원 수준이며 단계별로 지출됨</li>
  <li>필요 시 클라우드 사용 요청 가능하지만 현재는 미확정</li>
  <li>퍼블릭 LLM이 필요 기능을 수행하는 데 필수적임</li>
</ul>
<h2>결정사항</h2>
<ul>
  <li>퍼블릭 LLM 사용 가능한 기관과 비사용 기관 구분하여 적용</li>
  <li>비용 산정은 단계별로 진행하며 구체적 비용 추후 확정</li>
  <li>클라우드 사용 요청은 필요 시에만 진행</li>
</ul>
<h2>할일목록 (To-Do)</h2>
<ul>
  <li>SLM 이동 가능성 검토 및 추진</li>
  <li>비용 세부 산정 자료 준비</li>
  <li>클라우드 사용 요청 절차 마련</li>
</ul>
<h2>보류사항</h2>
<ul>
  <li>정확한 비용 산정 확정</li>
  <li>클라우드 사용 시기 및 범위 결정</li>
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

}
