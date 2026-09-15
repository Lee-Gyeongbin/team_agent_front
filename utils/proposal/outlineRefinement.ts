export interface OutlineSection {
  title: string
  text: string
  start: number
  end: number
}

/** Keep exact source offsets so only the selected section is replaced. */
export function splitOutlineSections(source: string): OutlineSection[] {
  const headings: { start: number; title: string }[] = []
  let offset = 0
  let fence = ''
  for (const line of source.split(/(?<=\n)/)) {
    const marker = line.match(/^\s*(`{3,}|~{3,})/)
    if (marker) {
      if (!fence) fence = marker[1]!
      else if (marker[1]![0] === fence[0] && marker[1]!.length >= fence.length) fence = ''
    } else if (!fence) {
      const match = line.match(/^(?:\d+[.)]\s+|#{1,3}\s+)(.+)/)
      if (match)
        headings.push({
          start: offset,
          title: line
            .trim()
            .replace(/^#{1,3}\s+/, '')
            .replace(/\*\*/g, ''),
        })
    }
    offset += line.length
  }
  if (!headings.length) return []
  return headings.map((heading, index) => {
    const end = headings[index + 1]?.start ?? source.length
    return { ...heading, end, text: source.slice(heading.start, end) }
  })
}
