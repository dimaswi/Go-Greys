import { createContext, type ReactNode, useCallback, useContext, useMemo, useRef, useState } from "react"
import { Button } from "../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog"
import { Input } from "../components/ui/input"

type DialogMode = "alert" | "confirm" | "prompt"

interface PromptOptions {
  title?: string
  message: string
  placeholder?: string
  password?: boolean
}

interface AppDialogContextValue {
  alert: (message: string, title?: string) => Promise<void>
  confirm: (message: string, title?: string) => Promise<boolean>
  prompt: (options: PromptOptions) => Promise<string | null>
}

const AppDialogContext = createContext<AppDialogContextValue | null>(null)

export function AppDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<DialogMode>("alert")
  const [title, setTitle] = useState("Informasi")
  const [message, setMessage] = useState("")
  const [placeholder, setPlaceholder] = useState("")
  const [isPasswordInput, setIsPasswordInput] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const resolverRef = useRef<((value: unknown) => void) | null>(null)

  const closeAndResolve = useCallback((value: unknown) => {
    setOpen(false)
    if (resolverRef.current) {
      resolverRef.current(value)
      resolverRef.current = null
    }
  }, [])

  const alert = useCallback((msg: string, dialogTitle = "Informasi") => {
    setMode("alert")
    setTitle(dialogTitle)
    setMessage(msg)
    setOpen(true)
    return new Promise<void>((resolve) => {
      resolverRef.current = () => resolve()
    })
  }, [])

  const confirm = useCallback((msg: string, dialogTitle = "Konfirmasi") => {
    setMode("confirm")
    setTitle(dialogTitle)
    setMessage(msg)
    setOpen(true)
    return new Promise<boolean>((resolve) => {
      resolverRef.current = (value) => resolve(Boolean(value))
    })
  }, [])

  const prompt = useCallback((options: PromptOptions) => {
    setMode("prompt")
    setTitle(options.title || "Input")
    setMessage(options.message)
    setPlaceholder(options.placeholder || "")
    setIsPasswordInput(Boolean(options.password))
    setInputValue("")
    setOpen(true)
    return new Promise<string | null>((resolve) => {
      resolverRef.current = (value) => resolve((value as string) || null)
    })
  }, [])

  const value = useMemo(() => ({ alert, confirm, prompt }), [alert, confirm, prompt])

  return (
    <AppDialogContext.Provider value={value}>
      {children}
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (!nextOpen && resolverRef.current) {
            resolverRef.current(mode === "confirm" ? false : null)
            resolverRef.current = null
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{message}</DialogDescription>
          </DialogHeader>

          {mode === "prompt" ? (
            <Input
              autoFocus
              type={isPasswordInput ? "password" : "text"}
              placeholder={placeholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") closeAndResolve(inputValue.trim())
              }}
            />
          ) : null}

          <DialogFooter>
            {mode === "confirm" || mode === "prompt" ? (
              <Button type="button" variant="outline" onClick={() => closeAndResolve(mode === "confirm" ? false : null)}>
                Batal
              </Button>
            ) : null}
            <Button
              type="button"
              onClick={() => {
                if (mode === "alert") closeAndResolve(true)
                if (mode === "confirm") closeAndResolve(true)
                if (mode === "prompt") closeAndResolve(inputValue.trim())
              }}
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppDialogContext.Provider>
  )
}

export function useAppDialog() {
  const ctx = useContext(AppDialogContext)
  if (!ctx) {
    throw new Error("useAppDialog must be used within AppDialogProvider")
  }
  return ctx
}
