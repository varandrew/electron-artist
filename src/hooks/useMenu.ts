interface Menu {
  name: string
  onClick: (event: MouseEvent) => void
}

interface MenuOptions {
  menus: Menu[]
}

export function useMenu(options: MenuOptions) {
  const ContextMenu = function (opts: MenuOptions) {
    let instance: any

    function createMenu() {
      const ul = document.createElement('ul')
      ul.classList.add('custom-context-menu')
      const { menus } = opts
      if (menus && menus.length > 0) {
        for (let menu of menus) {
          const li = document.createElement('li')
          li.textContent = menu.name
          li.onclick = menu.onClick
          ul.appendChild(li)
        }
      }
      const body = document.querySelector('body')
      body!.appendChild(ul)
      return ul
    }

    return {
      getInstance: function () {
        if (!instance) {
          instance = createMenu()
        }
        return instance
      },
    }
  }

  const contextMenu = ContextMenu(options)

  const showMenu = (e: MouseEvent) => {
    e.preventDefault()
    const menus = contextMenu.getInstance()
    menus.style.top = `${e.clientY}px`
    menus.style.left = `${e.clientX}px`
    menus.classList.remove('hidden')
  }

  const hideMenu = (e: MouseEvent) => {
    const menus = contextMenu.getInstance()
    menus.classList.add('hidden')
  }

  return {
    showMenu,
    hideMenu,
  }
}
