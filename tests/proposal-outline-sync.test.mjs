import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
import { ref, computed } from 'vue'

const source = readFileSync(new URL('../composables/proposal/useProposalOutline.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const item = (tocId, parentId, outlineStatusCd = '001', contentOutlineTxt = null) => ({
  tocId,
  parentId,
  title: tocId,
  outlineStatusCd,
  contentOutlineTxt,
})

function setup() {
  let list = []
  const api = { fetchSelectTocList: async () => ({ result: 'OK', list }) }
  const exports = {}
  const context = vm.createContext({
    exports,
    ref,
    computed,
    require: (id) => {
      if (id.endsWith('useProposalApi'))
        return { useProposalApi: () => ({ fetchSelectTocList: (...args) => api.fetchSelectTocList(...args) }) }
      if (id.endsWith('useToast')) return { openToast: () => {} }
      throw new Error(`Unexpected import: ${id}`)
    },
  })
  vm.runInContext(compiled, context)
  const state = exports.useProposalOutline(ref('project'), ref('model'), ref('agent'))
  return {
    state,
    api,
    setList: (next) => {
      list = next
    },
  }
}

test('deleting a selected subtree removes outline entries, selection, chat and confirmation counts', async () => {
  const { state, setList } = setup()
  setList([
    item('root', null),
    item('section', 'root'),
    item('leaf', 'section', '003', 'confirmed'),
    item('other', 'root'),
  ])
  await state.handleLoadToc()
  await state.handleSelectNode('leaf')
  state.isEditing.value = true
  state.editingText.value = 'draft'
  state.chatMessages.value = [{ role: 'user', text: 'update' }]
  assert.equal(state.confirmedCount.value, 1)
  setList([item('root', null), item('other', 'root')])
  await state.handleLoadToc({ preserveOutlineState: true })
  assert.equal(state.tocList.value.length, 2)
  assert.equal(state.leafNodes.value.length, 1)
  assert.equal(state.confirmedCount.value, 0)
  assert.equal(state.selectedTocId.value, null)
  assert.equal(state.selectedItem.value, null)
  assert.equal(state.isEditing.value, false)
  assert.equal(state.editingText.value, '')
  assert.equal(state.chatMessages.value.length, 0)
})

test('rename refresh keeps cached outline and unsaved edits of surviving selection', async () => {
  const { state, setList } = setup()
  setList([item('root', null), item('leaf', 'root', '002', 'existing outline')])
  await state.handleLoadToc()
  await state.handleSelectNode('leaf')
  state.isEditing.value = true
  state.editingText.value = 'unsaved edit'
  setList([item('root', null), { ...item('leaf', 'root', '002'), title: 'renamed' }])
  await state.handleLoadToc({ preserveOutlineState: true })
  assert.equal(state.selectedItem.value.title, 'renamed')
  assert.equal(state.selectedItem.value.contentOutlineTxt, 'existing outline')
  assert.equal(state.isEditing.value, true)
  assert.equal(state.editingText.value, 'unsaved edit')
  assert.equal(state.unGeneratedCount.value, 0)
})

test('adding a child changes outline targets and clears selection of its former leaf parent', async () => {
  const { state, setList } = setup()
  setList([item('root', null), item('section', 'root')])
  await state.handleLoadToc()
  await state.handleSelectNode('section')
  setList([item('root', null), item('section', 'root'), item('leaf', 'section')])
  await state.handleLoadToc({ preserveOutlineState: true })
  assert.equal(state.selectedTocId.value, null)
  assert.equal(state.leafNodes.value[0].tocId, 'leaf')
  assert.equal(state.unGeneratedCount.value, 1)
})

test('late list response cannot restore a deleted item', async () => {
  const { state, api } = setup()
  let resolveOld
  api.fetchSelectTocList = () =>
    new Promise((resolve) => {
      resolveOld = resolve
    })
  const oldLoad = state.handleLoadToc()
  api.fetchSelectTocList = async () => ({ result: 'OK', list: [] })
  await state.handleLoadToc()
  resolveOld({ result: 'OK', list: [item('deleted', null)] })
  await oldLoad
  assert.equal(state.tocList.value.length, 0)
  assert.equal(state.isLoadingToc.value, false)
})

test('regeneration reload does not restore old cached outline content', async () => {
  const { state, setList } = setup()
  setList([item('leaf', null, '002', 'old outline')])
  await state.handleLoadToc()
  setList([item('leaf', null, '002')])
  await state.handleLoadToc()
  assert.equal(state.tocList.value[0].contentOutlineTxt, null)
})

test('missing text for lazy-loaded drafts and confirmed outlines is not counted as unwritten', async () => {
  const { state, setList } = setup()
  setList([item('root', null), item('draft', 'root', '002'), item('confirmed', 'root', '003'), item('empty', 'root')])
  await state.handleLoadToc()
  assert.equal(state.unGeneratedCount.value, 1)
  state.tocList.value.find((entry) => entry.tocId === 'empty').outlineStatusCd = '002'
  assert.equal(state.unGeneratedCount.value, 0)
})
