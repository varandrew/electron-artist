interface OriginImageType {
  imgEle: HTMLImageElement
  width: number
  height: number
}

interface RealImageType {
  width: number
  height: number
}

/* A function that returns a promise. The promise resolves with an object that contains the image element,
width, and height. */
export const getImageOriginSize = (f: File): Promise<OriginImageType> => {
  return new Promise((resolve, reject) => {
    const src = URL.createObjectURL(f)
    const image = new Image()
    image.src = src
    image.onload = () => {
      URL.revokeObjectURL(image.src)

      resolve({
        imgEle: image,
        width: image.width,
        height: image.height,
      })
    }
  })
}

export const getImageRealSize = (
  parentWidth: number,
  parentHeight: number,
  imgWidth: number,
  imgHeight: number,
  radio = 0.5,
): RealImageType => {
  const standard = {
    width: radio * parentHeight,
    height: radio * parentWidth,
  }
  const scaleC = parentWidth / parentHeight
  const scaleI = imgWidth / imgHeight

  if (imgWidth < standard.width && imgHeight < standard.height)
    return { width: imgWidth, height: imgHeight }

  if (scaleC > scaleI) {
    //说明图片比较高 以高度为准
    standard.width = standard.height * scaleI
  } else if (scaleC < scaleI) {
    //说明图片比较宽 以宽度为准
    standard.height = standard.width / scaleI
  } else {
    standard.height = standard.width / scaleI
  }

  return standard
}
