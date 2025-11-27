// src/services/routerNavigate.ts
let navigateFunction: (path: string) => void

export const setNavigate = (fn: (path: string) => void) => {
  navigateFunction = fn
}

export default function routerNavigate(path: string) {
  if (navigateFunction) {
    navigateFunction(path)
  } else {
    // fallback — evita travar
    window.location.href = path
  }
}
