# 프로젝트 실수 기록

> 같은 실수 반복 방지를 위한 팀 공유 메모

## 트러블슈팅

### [환경] node_modules 깨짐 (lodash 모듈 누락)
- **상황**: `Cannot find module './_setToString'` 에러 발생
- **실수**: 그냥 다시 실행만 시도
- **해결**: `rm -rf node_modules && npm install`
- **날짜**: 2026-02-28

### [설정] VS Code Copilot 커밋 메시지 영어로 생성
- **상황**: 커밋 메시지 자동 생성이 영어로 나옴
- **해결**: `.vscode/settings.json`에 `github.copilot.chat.commitMessageGeneration.instructions` 추가
- **날짜**: 2026-02-28
