import { MaterialSelector } from "@/components/material-selector"
import { MaterialsDataProvider } from "@/providers/materials-data-provider"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Advanced Material Selection Tool</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Find optimal materials based on your mechanical property requirements
          </p>
        </header>

        <MaterialsDataProvider>
          <MaterialSelector />
        </MaterialsDataProvider>
      </div>
    </div>
  )
}

