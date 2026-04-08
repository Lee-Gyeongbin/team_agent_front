# NCP Object Storage 이미지 업로드 가이드

> 이 프로젝트는 **Presigned URL** 방식을 사용합니다.
> 백엔드가 서명된 URL을 발급하고, 프론트엔드가 해당 URL로 NCP에 **직접 PUT** 합니다.

---

## 전체 흐름

```
[프론트엔드]                  [백엔드]                  [NCP Object Storage]

① 파일 메타 전송 ──────────►  Presigned PUT URL 생성
   (fileName, fileType,         (유효 10분)
    fileSize, categoryId)
                             ◄──── uploadUrl, filePath 반환

② NCP에 직접 PUT  ─────────────────────────────────►  이미지 저장
   (uploadUrl, file binary)

③ filePath를 DB 저장 요청 ──►  TB_DOC_FILE 등에 저장
```

---

## 설정 (globals.properties)

```properties
ncp.storage.endpoint=https://kr.object.ncloudstorage.com
ncp.storage.region=kr-standard
ncp.storage.bucket=ta-storage
ncp.storage.accessKey=YOUR_ACCESS_KEY
ncp.storage.secretKey=YOUR_SECRET_KEY
```

| 속성 | 설명 |
|------|------|
| `endpoint` | NCP Object Storage 엔드포인트 (S3 호환) |
| `region` | `kr-standard` 고정 |
| `bucket` | 버킷명 |
| `accessKey` / `secretKey` | NCP 콘솔 > Object Storage > API 인증 키 |

---

## 백엔드

### 1. S3 클라이언트 빈 등록 (`NcpObjectStorageConfig.java`)

```java
@Bean
public AmazonS3 amazonS3() {
    BasicAWSCredentials credentials = new BasicAWSCredentials(accessKey, secretKey);
    return AmazonS3ClientBuilder.standard()
            .withEndpointConfiguration(new EndpointConfiguration(endpoint, region))
            .withCredentials(new AWSStaticCredentialsProvider(credentials))
            .build();
}
```

AWS SDK v1(`com.amazonaws`)을 그대로 사용합니다. NCP Object Storage는 S3 호환 API를 제공하므로 엔드포인트만 교체하면 동작합니다.

### 2. Presigned URL 발급 API

**엔드포인트**: `POST /api/com/file/uploadFile.do`

**요청 바디 (FileVO)**

| 필드 | 필수 | 설명 |
|------|------|------|
| `fileName` | Y | 원본 파일명 (예: `profile.png`) |
| `fileType` | Y | MIME 타입 (예: `image/png`) |
| `fileSize` | N | 파일 크기 (bytes) |
| `categoryId` | 조건부 | 버킷 내 경로 prefix. `storeFilePath`가 없을 때 사용 |
| `storeFilePath` | 조건부 | 저장 경로 직접 지정 시 사용 (categoryId 우선) |

**응답**

```json
{
  "uploadUrl": "https://kr.object.ncloudstorage.com/ta-storage/images/profile.png?X-Amz-...",
  "filePath": "images/profile.png"
}
```

| 필드 | 설명 |
|------|------|
| `uploadUrl` | NCP에 PUT 요청할 Presigned URL (유효 10분) |
| `filePath` | 버킷 내 객체 키. DB 저장 시 이 값을 `FILE_PATH`에 저장 |

**스토리지 키 결정 로직**

```
storeFilePath 또는 storeFileName 있음  →  storeFilePath 사용
없음  →  {categoryId}/{fileName}
```

예: `categoryId=images`, `fileName=profile.png` → 키: `images/profile.png`

### 3. 이미지 뷰 URL 발급

**엔드포인트**: `POST /api/com/file/viewFile.do`

이미지(`png`, `jpg`, `jpeg`, `webp`, `gif`)인 경우 `viewType: "IMAGE"`를 반환합니다.

**응답**

```json
{
  "viewType": "IMAGE",
  "url": "https://kr.object.ncloudstorage.com/ta-storage/images/profile.png?X-Amz-...",
  "fileName": "profile.png"
}
```

뷰 URL 유효 시간: **30분**

---

## 프론트엔드

### 이미지 업로드 (`useFileStore.ts`)

```ts
import { useFileStore } from '~/composables/com/useFileStore'

const { handleUploadFile } = useFileStore()

// file: File 객체 (input[type=file] 또는 드래그앤드롭)
const filePath = await handleUploadFile({
  file,
  categoryId: 'images',   // NCP 경로 prefix
})

if (filePath) {
  // filePath → DB 저장 API에 전달
  console.log('저장된 경로:', filePath)  // 예: "images/profile.png"
}
```

**내부 동작 순서**

```ts
// 1) Presigned URL 발급
const { uploadUrl, filePath } = await fetchUploadFileUrl({
  fileName: file.name,
  fileType: file.type || 'application/octet-stream',
  fileSize: String(file.size),
  categoryId,
})

// 2) NCP에 직접 PUT
await fetch(uploadUrl, {
  method: 'PUT',
  headers: { 'Content-Type': file.type },
  body: file,
})

// 3) filePath 반환 → 호출자가 DB 저장에 사용
return filePath
```

### 저장 경로 직접 지정 (선택)

같은 파일을 덮어쓰거나 경로를 고정할 때:

```ts
const filePath = await handleUploadFile({
  file,
  storeFilePath: 'avatars/user-123.png',  // 경로 고정
})
```

### 이미지 표시 (`useFileStore.ts`)

```ts
const { handleViewFileUrl } = useFileStore()

const url = await handleViewFileUrl(docId, docFileId)
// → <img :src="url" /> 에 바인딩
```

반환된 `url`은 Presigned GET URL이므로 별도 인증 헤더 없이 `<img>` 태그에서 바로 사용 가능합니다.

---

## 지원 이미지 형식

| 확장자 | MIME 타입 |
|--------|----------|
| `png` | `image/png` |
| `jpg`, `jpeg` | `image/jpeg` |
| `webp` | `image/webp` |
| `gif` | `image/gif` |

이 외 형식은 `viewType: "DOWNLOAD"` 또는 `"PDF"` 등으로 처리됩니다.

---

## 주요 유효 시간

| 용도 | 유효 시간 |
|------|----------|
| 업로드 Presigned URL (`PUT`) | 10분 |
| 뷰 Presigned URL (`GET`) | 30분 |
| 다운로드 Presigned URL (`GET`) | 10분 |

---

## 에러 케이스

| 상황 | 처리 방식 |
|------|----------|
| 업로드 실패 (`response.ok === false`) | `openToast({ type: 'error' })` + `null` 반환 |
| 스토리지에 파일 없음 | `viewType: "DOWNLOAD"`, `reason: "STORAGE_OBJECT_MISSING"` |
| 파일 미등록 (DB 없음) | `viewType: "DOWNLOAD"`, `reason: "FILE_NOT_FOUND"` |

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `common/util/NcpObjectStorageConfig.java` | AmazonS3 빈 설정 |
| `common/system/service/impl/FileServiceImpl.java` | Presigned URL 생성 로직 |
| `common/web/FileController.java` | `/com/file/*.do` API 엔드포인트 |
| `composables/com/useFileApi.ts` | 프론트 API 호출 함수 |
| `composables/com/useFileStore.ts` | 업로드/뷰/다운로드 액션 |
| `types/file.ts` | FileVO 관련 타입 정의 |
