import { useEffect, useRef } from "react"
import { Navigate, Outlet, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { toast } from "sonner"

interface RoleRouteProps {
  permissions?: string[]
}

export default function RoleRoute({ permissions }: RoleRouteProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const hasShownRef = useRef(false)
  
  // Check if user has any of the required permissions
  const isUnauthorized = Boolean(
    user && 
    permissions && 
    permissions.length > 0 && 
    !permissions.some(p => user.permissions?.includes(p))
  )
  
  const fallback = "/"

  useEffect(() => {
    if (!isUnauthorized || !user || hasShownRef.current) return
    hasShownRef.current = true
    toast.error("Anda tidak memiliki akses ke fitur ini.")
    navigate(fallback, { replace: true })
  }, [isUnauthorized, user, navigate, fallback])

  if (!user) return <Navigate to="/login" replace />
  if (isUnauthorized) return null

  return <Outlet />
}
