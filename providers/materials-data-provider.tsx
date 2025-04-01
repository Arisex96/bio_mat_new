"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface MaterialsDataContextType {
  data: any[] | null
  loading: boolean
  error: string | null
}

const MaterialsDataContext = createContext<MaterialsDataContextType>({
  data: null,
  loading: true,
  error: null,
})

export const useMaterialsData = () => useContext(MaterialsDataContext)

interface MaterialsDataProviderProps {
  children: ReactNode
}

export const MaterialsDataProvider = ({ children }: MaterialsDataProviderProps) => {
  const [data, setData] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch the materials data from our API endpoint
        const response = await fetch("/api/materials")

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }

        const materialsData = await response.json()

        if (Array.isArray(materialsData)) {
          setData(materialsData)
        } else if (materialsData.error) {
          throw new Error(materialsData.error)
        } else {
          throw new Error("Invalid data format received")
        }

        setLoading(false)
      } catch (err) {
        console.error("Error loading materials data:", err)
        setError(err instanceof Error ? err.message : "Failed to load materials data")
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return <MaterialsDataContext.Provider value={{ data, loading, error }}>{children}</MaterialsDataContext.Provider>
}

