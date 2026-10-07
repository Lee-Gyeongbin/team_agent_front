/** Format standalone JSON examples for display only; never change the saved prompt. */
export function formatPromptJsonExamples(text: string): string {
  const lines = text.split(/\r?\n/)
  const output: string[] = []
  let fence: string | null = null
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]
    const marker = line.trimStart().match(/^(`{3,}|~{3,})/)
    if (marker) {
      if (!fence) fence = marker[1]
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null
      output.push(line)
      continue
    }
    if (fence || !/^[\t ]*(?:\[|\{)/.test(line)) {
      output.push(line)
      continue
    }
    let depth = 0
    let quoted = false
    let escaped = false
    let end = index
    let complete = false
    for (; end < lines.length; end++) {
      for (const character of lines[end]) {
        if (quoted) {
          if (escaped) escaped = false
          else if (character === '\\') escaped = true
          else if (character === '"') quoted = false
        } else if (character === '"') quoted = true
        else if (character === '{' || character === '[') depth++
        else if (character === '}' || character === ']') depth--
      }
      if (depth === 0 && !quoted) {
        complete = true
        break
      }
      if (depth < 0) break
    }
    if (!complete) {
      output.push(line)
      continue
    }
    const candidate = lines.slice(index, end + 1).join('\n')
    try {
      const formatted = JSON.stringify(JSON.parse(candidate), null, 2)
      // Use a fence longer than any backticks in the example.
      const longest = Math.max(2, ...(formatted.match(/`+/g) ?? []).map((run) => run.length))
      const delimiter = '`'.repeat(longest + 1)
      output.push('', `${delimiter}json`, formatted, delimiter, '')
      index = end
    } catch {
      output.push(line)
    }
  }
  return output.join('\n')
}
