# Chat Store 아키텍처

> `useChatStore.ts` 리팩토링 결과 — 1524줄 → 8개 파일 분리

## 파일 구조

```
composables/chat/
├── useChatStore.ts                          # 오케스트레이터 (697줄)
├── useChatAgentRegistry.ts                  # 에이전트 목록 관리 (113줄)
├── useChatPanelManager.ts                   # 패널 관리 (185줄)
└── agents/
    ├── useSurveyAgentActions.ts             # 설문 에이전트 (133줄)
    ├── useRecommendAgentActions.ts          # 추천 에이전트 (211줄)
    ├── useTranslateAgentActions.ts          # 번역 에이전트 (158줄)
    ├── useAutoRecommendAgentActions.ts      # 자동추천 에이전트 (132줄)
    └── useNewsCuratorAgentActions.ts        # 뉴스큐레이터 에이전트 (197줄)
```

---

## 의존성 그래프

```
useChatStore (오케스트레이터)
├── useChatAgentRegistry        ← chatIndexAgents singleton
├── useChatPanelManager         ← 패널 상태
├── agents/useSurveyAgentActions
├── agents/useRecommendAgentActions
├── agents/useTranslateAgentActions
├── agents/useAutoRecommendAgentActions
└── agents/useNewsCuratorAgentActions

각 agents/* 파일은 공통으로:
├── useChatSocket()             ← messages (module-level singleton)
├── useChatRooms()              ← chatRoom, createChatRoom
├── useChatSearchState()        ← selectedChatAgentId, resolveSvcTy 등
├── useChatSendPipeline()       ← executeSendPipeline
└── chatIndexAgents (useChatAgentRegistry에서 named export)
```

---

## 파일별 상세

### `useChatStore.ts` — 오케스트레이터

**역할**: 모든 하위 모듈을 조합하고, Vue 파일이 사용하는 단일 진입점 제공. return 객체 API는 리팩토링 전과 완전히 동일.

**담당 상태**
| 상태 | 설명 |
|------|------|
| `lastLoadedChatLogRows` | 재파싱용 — 마지막 로드한 raw 로그 |
| `lastLoadedChatLogRoomId` | 재파싱용 — 마지막 로드한 roomId |
| `isModalOpen` | 좋아요/싫어요 모달 열림 상태 |
| `modalMessage` | 모달 메시지 내용 |
| `modalTitle` | 모달 제목 |
| `modalPlaceholder` | 모달 입력 placeholder |
| `selectedLogId` | 선택된 로그 ID |
| `messagesForDisplay` | computed — 에이전트별 필터 적용된 메시지 목록 |

**담당 메서드**
| 메서드 | 설명 |
|--------|------|
| `handleSelectChatLogList(roomId, options?)` | 채팅 로그 조회 + 에이전트 방 등록 + 메시지 변환 오케스트레이션 |
| `applyChatLogRowsToMessages(rawList, roomId)` | raw 로그 → ChatMessage 변환 후 messages에 반영 |
| `onSend(files?, contentOverride?)` | 일반 메시지 전송 파이프라인 |
| `selectChatIndexAgent(agent)` | 에이전트 선택 라우터 — svcTy별 분기 후 각 agent 모듈에 위임 |
| `handleSelectChatIndexAgentForC(agent)` | 일반 C 타입 에이전트 선택/해제 토글 |
| `handleOpenAgentLink(agent)` | 링크형 에이전트 외부 URL 열기 |
| `handleResetChatPanels()` | 다음 추천 질문 초기화 + 패널 전체 리셋 |

**watch**
- `chatIndexAgents` 변경 감지 → `applyChatLogRowsToMessages` 재실행 (에이전트 subCfg 로드 후 메시지 재파싱)

---

### `useChatAgentRegistry.ts` — 에이전트 목록 관리

**역할**: `/chat` 인덱스 에이전트 목록의 singleton 상태 관리. `chatIndexAgents`를 named export해 다른 파일에서 직접 import 가능.

**module-level named exports** (singleton ref — 어디서나 직접 import 가능)
| export | 타입 | 설명 |
|--------|------|------|
| `chatIndexAgents` | `Ref<Agent[]>` | 전체 에이전트 목록 |
| `isLoadingChatIndexAgents` | `Ref<boolean>` | 로딩 상태 |
| `normalizeChatAgents` | `(list: Agent[]) => Agent[]` | useYn 필터 + subCfg 정규화 + 정렬 |
| `selectedChatThemeAgent` | `ComputedRef<Agent \| null>` | 현재 선택된 에이전트 |
| `getChatIndexAgentSubLabel` | `(agent: Agent) => string` | svcTy → 한글 서브타이틀 |
| `getChatIndexAgentColorStyle` | `(colorHex: string) => object` | CSS 변수 색상 스타일 객체 |
| `handleSelectChatIndexAgents` | `() => Promise<void>` | API 호출 + 목록 갱신 (중복 요청 방지) |

**svcTy 매핑**
| svcTy | 설명 |
|-------|------|
| M | 문서검색증강(RAG) Agent |
| S | 검색모드-to-SQL Agent |
| T | 실시간 음성인식(STT) Agent |
| C | 일반 채팅 Agent |
| A | 메일 브리핑 Agent |
| W | 번역 Agent |
| D | 프로젝트 리스크 진단 Agent |

---

### `useChatPanelManager.ts` — 패널 관리

**역할**: PDF 뷰어, 시각화, 리서치 리포트 3종 패널의 상태 및 데이터 로딩 관리.

**module-level 상태** (singleton)
| 상태 | 타입 | 설명 |
|------|------|------|
| `activePanelType` | `Ref<PanelType>` | 현재 활성 패널 종류 (`'pdf' \| 'visualization' \| 'report' \| 'none'`) |
| `isPanelFullscreen` | `Ref<boolean>` | 패널 전체화면 여부 |
| `activePanelMessageId` | `Ref<string \| null>` | 패널에 연결된 메시지 ID |
| `pdfRefList` | `Ref<ChatRefRow[]>` | PDF 참조 문서 목록 |
| `visualizationViewMap` | `Ref<Record<string, VisualizationViewModel>>` | logId → 시각화 뷰모델 맵 |
| `activeVisualizationView` | `ComputedRef` | 현재 패널의 시각화 뷰모델 |

**메서드**
| 메서드 | 설명 |
|--------|------|
| `onViewSource(id)` | PDF 패널 열기 — 참조 문서 목록 API 조회 |
| `onViewVisualization(id)` | 시각화 패널 열기 — 테이블 데이터 로드 |
| `onViewReport(id)` | 리서치 리포트 패널 열기 |
| `onPanelClose(value)` | 패널 닫기 — PDF URL 캐시 / 시각화 뷰맵 정리 |
| `handleSelectVisualizationData(logId)` | 시각화 데이터 조회 — tableData + 통계 매핑 → VisualizationViewModel 생성 |
| `handleSelectChatPdfFileUrl(docFileId)` | PDF URL 조회 (캐시 우선, 외부 URL 감지) |
| `isChatPdfExternalDoc(docFileId)` | 외부 URL 수집 파일 여부 판별 |
| `handleResetChatPdfFileUrlMap()` | PDF URL 캐시 초기화 |

---

### `agents/useSurveyAgentActions.ts` — 설문 에이전트 (svcTy: C / subTy: SURVEY)

**역할**: 심리 설문(SURVEY) 에이전트의 전송·제출·인라인 주입·닫기 액션.

**노출 상태**
| 상태 | 출처 | 설명 |
|------|------|------|
| `isSurveyVisible` | `usePsychologySurvey()` | 설문 오버레이 표시 여부 |
| `isGenderStepVisible` | `usePsychologySurvey()` | 성별 선택 단계 표시 여부 |
| `surveyGender` | `usePsychologySurvey()` | 선택된 성별 |

**메서드**
| 메서드 | 설명 |
|--------|------|
| `onSendSurvey(content, surveyMessageLogId?)` | 진단 프롬프트 전송 — question 메시지 숨김, surveyAnswers 주입 |
| `onSurveyMessageSubmit(logId)` | 메시지 목록 내 설문 컴포넌트 제출 — 프롬프트 빌드 후 `onSendSurvey` 호출 |
| `addInlineSurveyMessage(answers, agentId?)` | 설문 제출 후 새 채팅방에 readonly 설문 카드 주입 |
| `handleClosePsychologySurvey(surveyMessageLogId?)` | 설문 닫기 — 에이전트 선택 해제, 메시지 제거 |
| `handleIndexSurveySubmit()` | `/chat` 인덱스에서 설문 제출 — 방 생성 → 인라인 주입 → 방 등록 → 닫기 |

---

### `agents/useRecommendAgentActions.ts` — 추천 에이전트 (svcTy: C / RECOMMEND)

**역할**: 콘텐츠 추천 에이전트의 폼 카드 제출·결과 카드 생성·재시도·닫기 액션.

**노출 상태**
| 상태 | 출처 | 설명 |
|------|------|------|
| `isRecommendVisible` | `useRecommendAgent()` | 추천 오버레이 표시 여부 |

**메서드**
| 메서드 | 설명 |
|--------|------|
| `onSendRecommend(content, formLogId?, payload?, agentId?)` | 추천 프롬프트 전송 → form 카드 submitted 처리 → result 카드 생성 |
| `handleSubmitRecommendAgentForm(logId, payload)` | 폼 카드 제출 진입점 — 방 없으면 인덱스 제출, 방 있으면 `onSendRecommend` |
| `handleRecommendAgentRetry(resultLogId)` | result 카드에서 재추천 — 새 form 카드 추가 |
| `addInlineRecommendMessage(payload, agentId)` | 새 채팅방 진입 시 readonly 추천 카드 + result 카드 목록 앞 주입 |
| `handleIndexRecommendSubmit(payload)` | `/chat` 인덱스에서 추천 폼 제출 — 방 생성 → 인라인 주입 → 닫기 |
| `appendRecommendCardIfNeeded(agent)` | 채팅방 내 미제출 추천 카드가 없을 때만 추가 |
| `handleCloseRecommendAgent(logId?)` | 오버레이 + 카드 닫기 — 에이전트 선택 해제 |
| `openRecommendAgent()` | 추천 오버레이 열기 |

---

### `agents/useTranslateAgentActions.ts` — 번역 에이전트 (svcTy: W)

**역할**: 번역(TRANSLATE) 에이전트의 폼 제출·파일 번역·인라인 카드·닫기 액션.

**노출 상태**
| 상태 | 출처 | 설명 |
|------|------|------|
| `isTranslateVisible` | `useTranslateAgent()` | 번역 오버레이 표시 여부 |

**메서드**
| 메서드 | 설명 |
|--------|------|
| `onSendTranslate(content, formLogId?, payload?, agentId?)` | 번역 프롬프트 전송 (svcTy 고정 `'W'`) — 파일 첨부 지원 |
| `handleSubmitTranslateAgentForm(logId, payload)` | 폼 카드 제출 진입점 — 방 없으면 인덱스 제출, 방 있으면 `onSendTranslate` |
| `addInlineTranslateMessage(payload, agentId)` | 새 채팅방 진입 시 readonly 번역 카드 목록 앞 주입 |
| `handleIndexTranslateSubmit(payload)` | `/chat` 인덱스에서 번역 폼 제출 — 방 생성(파일 포함) → 인라인 주입 → 닫기 |
| `appendTranslateCardIfNeeded(agent)` | 채팅방 내 미제출 번역 카드가 없을 때만 추가 |
| `handleCloseTranslateAgent(logId?)` | 오버레이 + 카드 닫기 — 에이전트 선택 해제 |
| `openTranslateAgent()` | 번역 오버레이 열기 |

---

### `agents/useAutoRecommendAgentActions.ts` — 자동추천 에이전트 (svcTy: C / AUTO_RECOMMEND)

**역할**: 에이전트 클릭 즉시 자동 제출되는 AUTO_RECOMMEND 에이전트 액션.

**노출 상태**
| 상태 | 출처 | 설명 |
|------|------|------|
| `isAutoRecommendVisible` | `useAutoRecommend()` | 자동추천 오버레이 표시 여부 |

**메서드**
| 메서드 | 설명 |
|--------|------|
| `getSelectedAutoRecommendAgent()` | 현재 선택된 AutoRecommend 에이전트 반환 |
| `onSendAutoRecommend(content, cardLogId?)` | 자동추천 프롬프트 전송 — question 숨김, 방 등록 |
| `onAutoRecommendMessageSubmit(logId)` | 메시지 목록 내 카드 제출 — 에이전트 프롬프트 조회 후 `onSendAutoRecommend` |
| `addInlineAutoRecommendMessage(agentId)` | 새 채팅방 진입 시 submitted 상태 카드 목록 앞 주입 |
| `resetAutoRecommendPanel()` | 오버레이 닫기 + 에이전트 선택 해제 |
| `handleIndexAutoRecommendSubmit()` | `/chat` 인덱스에서 에이전트 클릭 즉시 — 방 생성 → 인라인 주입 → 패널 초기화 |
| `handleAutoRecommendIntroEnd()` | 인트로 종료 후 하단 에이전트 선택만 해제 (카드·메시지 유지) |

---

### `agents/useNewsCuratorAgentActions.ts` — 뉴스큐레이터 에이전트 (고정 agentId)

**역할**: 뉴스 분야 선택 → 큐레이션 프롬프트 제출 전체 흐름 관리.

**노출 상태**
| 상태 | 출처 | 설명 |
|------|------|------|
| `isNewsCuratorVisible` | `useNewsCurator()` | 뉴스큐레이터 오버레이 표시 여부 |

**메서드**
| 메서드 | 설명 |
|--------|------|
| `submitNewsCuratorPrompt(categories, isNew, sendFn)` | 공통 제출 파이프라인 — 카테고리 검증 → 관심분야 저장 → 프롬프트 빌드 → sendFn 주입 |
| `onNewsCuratorMessageSubmit(logId, categories?, options?)` | 메시지 목록 내 뉴스 카드 제출 — 전송 후 카드 상태 동기화 |
| `addInlineNewsMessage(categories, isNew)` | 새 채팅방 진입 시 submitted 뉴스 카드 목록 앞 주입 |
| `handleSyncNewsCard(logId, categories?, options?)` | 뉴스 카드 제출 완료 상태 동기화 (categories·isNew 반영) |
| `handleNewsCuratorReselectCategories(logId)` | 기존 제출 카드에서 분야 재선택 — 새 미제출 카드 추가 |
| `handleSaveUserNewsInterestCategories(codeIdList)` | 관심 뉴스 분야 서버 저장 |
| `handleCloseNewsCurator(logId?)` | 오버레이 닫기 + 에이전트 선택 해제, 카드 제거 옵션 |
| `handleIndexNewsCuratorSubmit(categories, options?)` | `/chat` 인덱스에서 카테고리 선택 후 제출 — 방 생성 → 인라인 주입 → 닫기 |
| `handleNewsCuratorIntroEnd()` | 인트로 종료 후 하단 에이전트 선택만 해제 (카드·메시지 유지) |
| `openNewsCurator()` | 뉴스큐레이터 오버레이 열기 |
| `parseNewsCuratorPromptMeta` | 뉴스 프롬프트 메타 파싱 (re-export) |

---

## 새 에이전트 추가 방법

1. `agents/use{AgentName}AgentActions.ts` 생성
2. 필요한 util 함수는 `utils/chat/{agentName}Util.ts`에 순수 로직으로 작성
3. `useChatStore.ts`에서 import 후 module-level 초기화
4. `messagesForDisplay` computed에 필터 로직 추가
5. `selectChatIndexAgent` 라우터에 분기 추가
6. `handleSelectChatLogList`에 방 등록 감지 로직 추가
7. `useChatStore` return 객체에 노출할 항목 추가
