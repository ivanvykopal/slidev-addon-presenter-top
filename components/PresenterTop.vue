<script setup lang="ts">
import { useHead } from '@unhead/vue'
import { useEventListener, useLocalStorage, useWindowFocus } from '@vueuse/core'
import { computed, onMounted, ref, watch, watchEffect } from 'vue'
import { createClicksContextBase } from '@slidev/client/composables/useClicks.ts'
import { useDrawings } from '@slidev/client/composables/useDrawings.ts'
import { useMousePosInSlide } from '@slidev/client/composables/useMousePosInSlide.ts'
import { useNav } from '@slidev/client/composables/useNav.ts'
import { useSwipeControls } from '@slidev/client/composables/useSwipeControls.ts'
import { useWakeLock } from '@slidev/client/composables/useWakeLock.ts'
import { slidesTitle } from '@slidev/client/env.ts'
import ClicksSlider from '@slidev/client/internals/ClicksSlider.vue'
import ContextMenu from '@slidev/client/internals/ContextMenu.vue'
import CurrentProgressBar from '@slidev/client/internals/CurrentProgressBar.vue'
import DrawingControls from '@slidev/client/internals/DrawingControls.vue'
import Goto from '@slidev/client/internals/Goto.vue'
import IconButton from '@slidev/client/internals/IconButton.vue'
import LaserPointer from '@slidev/client/internals/LaserPointer.vue'
import NavControls from '@slidev/client/internals/NavControls.vue'
import NoteEditable from '@slidev/client/internals/NoteEditable.vue'
import NoteStatic from '@slidev/client/internals/NoteStatic.vue'
import QuickOverview from '@slidev/client/internals/QuickOverview.vue'
import SlideContainer from '@slidev/client/internals/SlideContainer.vue'
import SlidesShow from '@slidev/client/internals/SlidesShow.vue'
import SlideWrapper from '@slidev/client/internals/SlideWrapper.vue'
import TimerBar from '@slidev/client/internals/TimerBar.vue'
import TimerInlined from '@slidev/client/internals/TimerInlined.vue'
import { onContextMenu } from '@slidev/client/logic/contextMenu.ts'
import { registerShortcuts } from '@slidev/client/logic/shortcuts.ts'
import {
  cursorStyle,
  decreasePresenterFontSize,
  increasePresenterFontSize,
  presenterNotesFontSize,
  showPresenterCursor,
} from '@slidev/client/state/index.ts'
import { sharedState } from '@slidev/client/state/shared.ts'

const inFocus = useWindowFocus()
const main = ref<HTMLDivElement>()
const noteSection = ref<HTMLDivElement>()

registerShortcuts()
useSwipeControls(main)
if (__SLIDEV_FEATURE_WAKE_LOCK__)
  useWakeLock()

const {
  clicksContext,
  currentSlideNo,
  currentSlideRoute,
  hasNext,
  nextRoute,
  slides,
  getPrimaryClicks,
} = useNav()
const { isDrawing } = useDrawings()

useHead({ title: `Presenter - ${slidesTitle}` })

const notesEditing = ref(false)

// Next-frame (click context) logic, copied from the default presenter
const clicksCtxMap = computed(() => slides.value.map((route) => {
  const clicks = ref(0)
  return {
    context: createClicksContextBase(clicks, route?.meta.slide?.frontmatter.clicksStart ?? 0, route?.meta.clicks),
    clicks,
  }
}))
const nextFrame = computed(() => {
  if (clicksContext.value.current < clicksContext.value.total)
    return [currentSlideRoute.value!, clicksContext.value.current + 1] as const
  else if (hasNext.value)
    return [nextRoute.value, 0] as const
  else
    return null
})

const nextFrameClicksCtx = computed(() => {
  return nextFrame.value && clicksCtxMap.value[nextFrame.value[0].no - 1]
})

watch(
  nextFrame,
  () => {
    if (nextFrameClicksCtx.value && nextFrame.value)
      nextFrameClicksCtx.value.clicks.value = nextFrame.value[1]
  },
  { immediate: true },
)

// Notes panel height (persisted, resizable)
const MIN_NOTES_HEIGHT = 140
const notesHeight = useLocalStorage('slidev-presenter-top-notes-height', 280)
const isResizingNotes = ref(false)
const resizeStartY = ref(0)
const resizeStartHeight = ref(280)

function clampNotesHeight(height: number) {
  const max = Math.round(window.innerHeight * 0.65)
  return Math.max(MIN_NOTES_HEIGHT, Math.min(max, Math.round(height)))
}

function onNotesResizeStart(e: PointerEvent) {
  if (e.button !== 0)
    return
  e.preventDefault()
  resizeStartY.value = e.clientY
  resizeStartHeight.value = clampNotesHeight(notesHeight.value)
  isResizingNotes.value = true
}

useEventListener(window, 'pointermove', (e) => {
  if (isResizingNotes.value) {
    const delta = e.clientY - resizeStartY.value
    notesHeight.value = clampNotesHeight(resizeStartHeight.value + delta)
  }
})
useEventListener(window, 'pointerup', () => (isResizingNotes.value = false))
useEventListener(window, 'pointercancel', () => (isResizingNotes.value = false))
useEventListener(window, 'resize', () => (notesHeight.value = clampNotesHeight(notesHeight.value)))
onMounted(() => (notesHeight.value = clampNotesHeight(notesHeight.value)))

// Sync presenter cursor (from the default presenter)
onMounted(() => {
  const mouse = useMousePosInSlide()
  const focus = useWindowFocus()

  watchEffect(() => {
    if (!mouse.value || !focus.value || isDrawing.value || !showPresenterCursor.value) {
      sharedState.cursor = undefined
    }
    else {
      sharedState.cursor = {
        ...mouse.value,
        style: cursorStyle.value,
      }
    }
  })
})
</script>

<template>
  <div class="ptop-presenter bg-main of-hidden">
    <div class="ptop-top-bars">
      <CurrentProgressBar />
      <TimerBar />
    </div>

    <div ref="noteSection" class="ptop-note bg-main" :style="{ height: `${notesHeight}px` }">
      <div class="ptop-note-toolbar border-b border-main">
        <span class="op50 px2 text-sm">Notes</span>
        <div flex-auto />
        <div class="transition" :class="inFocus ? '' : 'op25'">
          <IconButton title="Increase font size" @click="increasePresenterFontSize">
            <div class="i-carbon:zoom-in" />
          </IconButton>
          <IconButton title="Decrease font size" @click="decreasePresenterFontSize">
            <div class="i-carbon:zoom-out" />
          </IconButton>
          <IconButton
            v-if="__DEV__"
            title="Edit Notes"
            @click="notesEditing = !notesEditing"
          >
            <div class="i-carbon:edit" />
          </IconButton>
        </div>
      </div>
      <NoteEditable
        v-if="__DEV__"
        :key="`edit-${currentSlideNo}`"
        v-model:editing="notesEditing"
        :no="currentSlideNo"
        class="ptop-note-content"
        :clicks-context="clicksContext"
        :style="{ fontSize: `${presenterNotesFontSize}em` }"
      />
      <NoteStatic
        v-else
        :key="`static-${currentSlideNo}`"
        :no="currentSlideNo"
        class="ptop-note-content"
        :style="{ fontSize: `${presenterNotesFontSize}em` }"
        :clicks-context="clicksContext"
      />
      <div
        class="ptop-notes-resizer"
        :class="{ active: isResizingNotes }"
        role="separator"
        aria-orientation="horizontal"
        title="Resize notes panel"
        @pointerdown="onNotesResizeStart"
      />
    </div>

    <div class="ptop-slides">
      <div ref="main" class="ptop-cell bg-main">
        <div class="ptop-cell-label border-b border-main">
          <span op50 px2>Current</span>
        </div>
        <SlideContainer key="main" class="p-2 lg:p-4 flex-auto" is-main @contextmenu="onContextMenu">
          <SlidesShow render-context="presenter" />
          <LaserPointer />
        </SlideContainer>
        <ClicksSlider
          :key="currentSlideRoute?.no"
          :clicks-context="getPrimaryClicks(currentSlideRoute)"
          class="w-full pb2 px4 flex-none"
        />
      </div>
      <div class="ptop-cell bg-main p-2 lg:p-4">
        <SlideContainer v-if="nextFrame && nextFrameClicksCtx" key="next" class="flex-auto">
          <SlideWrapper
            :key="nextFrame[0].no"
            :clicks-context="nextFrameClicksCtx.context"
            :route="nextFrame[0]"
            render-context="previewNext"
          />
        </SlideContainer>
        <div v-else class="h-full flex justify-center items-center">
          <div class="text-gray-500">
            End of the presentation
          </div>
        </div>
        <div class="absolute left-0 top-0 bg-main border-b border-r border-main px2 py1 op50 text-sm">
          Next
        </div>
      </div>
    </div>

    <div class="ptop-bottom bg-main border-t border-main">
      <NavControls :persist="true" class="transition" :class="inFocus ? '' : 'op25'" />
      <div flex-auto />
      <TimerInlined />
    </div>

    <DrawingControls v-if="__SLIDEV_FEATURE_DRAWINGS__" />
  </div>
  <Goto />
  <QuickOverview />
  <ContextMenu />
</template>

<style scoped>
.ptop-presenter {
  --slidev-controls-foreground: current;
  height: 100%;
  display: grid;
  grid-template-rows: max-content max-content minmax(0, 1fr) min-content;
}

.ptop-slides {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1px;
  min-height: 0;
  background: rgba(128, 128, 128, 0.2);
}

.ptop-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.ptop-cell-label {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.25rem;
}

.ptop-note {
  position: relative;
  display: grid;
  grid-template-rows: max-content minmax(0, 1fr);
  overflow: hidden;
}

.ptop-note-toolbar {
  display: flex;
  align-items: center;
  padding: 0.25rem;
}

.ptop-note-content {
  width: 100%;
  max-width: 85ch;
  margin: 0 auto;
  height: 100%;
  overflow: auto;
  padding: 0.5rem 1.5rem;
}

.ptop-bottom {
  display: flex;
  align-items: center;
}

.ptop-notes-resizer {
  position: absolute;
  left: 0;
  bottom: -6px;
  width: 100%;
  height: 12px;
  cursor: row-resize;
  z-index: 10;
  touch-action: none;
}

.ptop-notes-resizer::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 100%;
  height: 1px;
  background-color: currentColor;
  opacity: 0.2;
  transform: translateY(-50%);
}
</style>
