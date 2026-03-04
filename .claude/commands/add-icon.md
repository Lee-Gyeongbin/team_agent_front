---
description: Figma에서 아이콘 SVG를 다운로드하고 프로젝트 아이콘 시스템에 등록
---

# 아이콘 추가

Figma URL: $ARGUMENTS

## 워크플로우

1. **Figma URL에서 fileKey, nodeId 파싱**
   - URL 패턴: `figma.com/design/<fileKey>/...?node-id=<nodeId>`

2. **Figma 데이터 가져오기**
   - `mcp__figma__get_figma_data`로 노드 조회 (depth: 5)
   - 아이콘 이름, 크기, fill/stroke 방식 파악

3. **SVG 다운로드**
   - `mcp__figma__download_figma_images`로 다운로드
   - 저장 경로: `assets/icons/svg/`
   - 파일명: kebab-case (예: `thumbs-up.svg`)

4. **SVG 정리**
   - 여러 아이콘이 하나의 프레임에 합쳐진 경우 → 개별 SVG로 분리 (viewBox 조정)
   - 배경 rect 제거
   - `icon-file-bg` 용: stroke/fill 색상을 `#000`으로 통일 (mask 호환)
   - `icon-file` 용: 원본 색상 유지

5. **믹스인 선택**

| SVG 특성 | 믹스인 | 용도 |
|----------|--------|------|
| 고정 색상 (로고, 브랜드) | `icon-file` | 원본 색상 유지 |
| 색상 변경 필요 (액션 버튼 등) | `icon-file-bg` | CSS로 색상 제어 |

6. **`assets/styles/icons/_icons.custom.scss`에 클래스 등록**

```scss
// 주석 (용도)
.icon-{이름} {
  @include icon-file('{svg파일명}');      // 고정 색상
  // 또는
  @include icon-file-bg('{svg파일명}');   // 색상 변경 가능
}
```

7. **결과 보고** — 추가된 아이콘 목록 표로 정리

## 사용법

```html
<i class="icon-{이름} size-{크기}"></i>
<i class="icon-{이름} size-16 icon-primary"></i>  <!-- 색상 변경 (icon-file-bg만) -->
```

## 사이즈: `.size-12` ~ `.size-48` (4px 단위)
