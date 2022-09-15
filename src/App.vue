<template>
  <div class="w-screen h-screen flex flex-col justify-start items-center">
    <img src="./assets/logo.png" alt="Logo" />

    <div class="flex">
      <canvas
        class="rounded-sm shadow-2xl"
        :width="canvasWidth"
        :height="canvasHeight"
        id="canvas"
      ></canvas>
    </div>

    <div class="mt-20">
      <button
        type="button"
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-6"
        @click="open()"
      >
        Add Image
      </button>
      <button
        type="button"
        class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-6"
        :style="[
          deleteBtnDisabled
            ? { cursor: 'not-allowed', backgroundColor: '#ccc' }
            : '',
        ]"
        :disabled="deleteBtnDisabled"
        @click="deleteImg()"
      >
        Delete Image
      </button>
      <button
        type="button"
        class="bg-white hover:bg-gray-50 text-black font-bold py-2 px-4 rounded"
        @click="exportImg()"
      >
        Export Image
      </button>
    </div>

    <div class="absolute top-1/3 right-24" v-if="!deleteBtnDisabled && current">
      <p>
        You have selected image: <b>{{ current.name }}</b>
      </p>
      <p>
        Image width: <b>{{ current.width }}</b
        >px
      </p>
      <p>
        Image height: <b>{{ current.height }}</b
        >px
      </p>
      <p>
        Center point x coordinates: <b>{{ current.x }}</b>
      </p>
      <p>
        Center point y coordinates: <b>{{ current.y }}</b>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { fabric } from 'fabric'
import { useWindowSize, useFileDialog } from '@vueuse/core'
import { getImageOriginSize, getImageRealSize } from './utils'
import { useMenu } from './hooks/useMenu'

let canvas: fabric.Canvas | null = null
let resetVal = {
  name: '',
  x: 0,
  y: 0,
  width: 0,
  height: 0,
}
let current = reactive({ ...resetVal })
const filesList = ref<File[]>([])
const deleteBtnDisabled = ref<boolean>(true)
const { width, height } = useWindowSize()
const { files, open, reset } = useFileDialog({
  accept: 'image/*',
})
const { showMenu, hideMenu } = useMenu({
  menus: [
    {
      name: 'Bring To Front',
      onClick: function (e: MouseEvent) {
        if (!canvas) return
        const t = canvas.getActiveObject()
        t.bringToFront()
      },
    },
    {
      name: 'Send To Back',
      onClick: function (e: MouseEvent) {
        if (!canvas) return
        const t = canvas.getActiveObject()
        t.sendToBack()
      },
    },
  ],
})

const canvasWidth = computed(() => width.value / 2)
const canvasHeight = computed(() => height.value / 2)

const setupCanvas = () => {
  // 不能使用reactive包装fabric, 否则添加图片后图片四周所有的拖拽点失效
  // canvas = reactive(new fabric.Canvas('canvas'))
  canvas = new fabric.Canvas('canvas')
  canvas.setBackgroundColor('rgb(255,255,255)', canvas.renderAll.bind(canvas))
  canvas.preserveObjectStacking = true

  canvas.on('mouse:down', (e) => calcPos(e.target))
  canvas.on('object:modified', (e) => calcPos(e.target))

  canvas.on('object:moving', (e) => calcPos(e.target))
}

const addImageToCanvas = async (f: File) => {
  const { width: imageWidth, height: imageHeight } = await getImageOriginSize(f)

  const src = URL.createObjectURL(f)

  fabric.Image.fromURL(src, (img) => {
    const norm = 0.5
    const { width: w, height: h } = getImageRealSize(
      canvasWidth.value,
      canvasHeight.value,
      imageWidth,
      imageHeight,
      norm,
    )

    // 动态计算图片x坐标的值
    let x =
      100 +
      filesList.value.findIndex((file) => file.name == f.name) *
        ((canvasWidth.value * norm) / 2)
    // 如果接近边界
    if (x >= canvasWidth.value)
      x = canvasWidth.value - (canvasWidth.value * norm) / 2
    const y = canvasHeight.value / 2 - h / 2
    img.set({
      left: x,
      top: y,
      cacheKey: f.name,
      onSelect: (e) => {
        deleteBtnDisabled.value = false
        return false
      },
      onDeselect: (e) => {
        deleteBtnDisabled.value = true
        current = Object.assign(current, { ...resetVal })
        return false
      },
    })
    img.scaleToWidth(w)
    img.scaleToHeight(h)

    URL.revokeObjectURL(src)
    canvas?.add(img)
  })
}

const deleteImg = () => {
  let activeObject = canvas?.getActiveObject()
  if (!activeObject) return

  const i = filesList.value.findIndex(
    (f) => f.name === (activeObject as any).cacheKey,
  )

  if (i > -1) filesList.value.splice(i, 1)

  canvas?.remove(activeObject)
  canvas?.renderAll()
}

const exportImg = () => {
  const dataURL = canvas?.toDataURL({
    width: canvasWidth.value,
    height: canvasHeight.value,
    left: 0,
    top: 0,
    format: 'png',
  })
  const link = document.createElement('a')
  link.download = 'canvas.png'
  link.href = dataURL!
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const calcPos = (target: any) => {
  if (!target) return
  const { top, left, aCoords, cacheKey } = target
  current.name = cacheKey
  current.width = aCoords.br.x - aCoords.bl.x
  current.height = aCoords.bl.y - aCoords.tl.y
  current.x = left + current.width / 2
  current.y = top + current.height / 2
}

watch(files, () => {
  if (!files.value) return

  for (const f of files.value) {
    // 如果没有重复的文件上传过
    if (!filesList.value.find((file) => file.name === f.name)) {
      filesList.value.push(f)
      addImageToCanvas(f)
    }
  }
})

onMounted(() => {
  setupCanvas()
  document.addEventListener('contextmenu', showMenu)
  document.addEventListener('click', hideMenu)
})

onUnmounted(() => {
  document.removeEventListener('contextmenu', showMenu)
  document.removeEventListener('click', hideMenu)
})
</script>

<style>
body {
  width: 100vw;
  height: 100vh;
  margin: 0;
  background-color: rgba(244, 245, 245, 1);
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #000;
}
</style>
