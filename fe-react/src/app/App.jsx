import { createHashRouter, RouterProvider } from 'react-router-dom'
import { AppProviders } from './AppProviders.jsx'
import { AppRoutes } from './AppRoutes.jsx'

// Keep the existing hash URLs; data router provides supported navigation blocking.
const router = createHashRouter([{ path: '*', element: <AppProviders><AppRoutes /></AppProviders> }])

export function App() { return <RouterProvider router={router} /> }
