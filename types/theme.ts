export interface IconItem {
  iconId: string // ICON_ID
  iconNm: string // ICON_NM
  iconClassNm: string // ICON_CLASS_NM
  iconFileNm: string // ICON_FILE_NM
  iconFilePath: string // ICON_FILE_PATH
  useYn: 'Y' | 'N' // USE_YN
  createDt: string // CREATE_DT
  modifyDt: string // MODIFY_DT
}

export interface ColorItem {
  colorId: string // COLOR_ID
  colorNm: string // COLOR_NM
  colorKey: string // COLOR_KEY
  colorHex: string // COLOR_HEX
  useYn: 'Y' | 'N' // USE_YN
  createDt: string // CREATE_DT
  modifyDt: string // MODIFY_DT
}
