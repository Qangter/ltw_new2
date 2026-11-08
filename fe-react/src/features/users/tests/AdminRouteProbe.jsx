import { useLocation, useNavigate } from 'react-router-dom'

export function AdminRouteProbe() {
  const location = useLocation()
  const navigate = useNavigate()
  return <><span data-testid="admin-url">{location.pathname}{location.search}</span><button onClick={() => navigate(-1)}>Test Back</button></>
}
