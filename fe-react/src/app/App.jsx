import { HashRouter } from 'react-router-dom'
import { AppProviders } from './AppProviders.jsx'
import { AppRoutes } from './AppRoutes.jsx'

export function App() {
  return (
    <HashRouter>
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    </HashRouter>
  )
}
