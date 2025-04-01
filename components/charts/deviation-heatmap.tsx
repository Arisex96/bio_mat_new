"use client"

import { useEffect, useRef } from "react"
import type { MaterialRequirements } from "@/components/material-selector"

interface DeviationHeatmapProps {
  materials: any[]
  requirements: MaterialRequirements
  propertyDisplayNames: Record<string, string>
}

export const DeviationHeatmap = ({ materials, requirements, propertyDisplayNames }: DeviationHeatmapProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || materials.length === 0) return

    const properties = Object.keys(requirements) as (keyof MaterialRequirements)[]

    // Calculate deviations
    const deviations = materials.map((material) => {
      const deviationData: Record<string, number> = {}

      properties.forEach((prop) => {
        const reqVal = requirements[prop].value
        if (reqVal !== 0) {
          deviationData[prop] = ((material[prop] - reqVal) / reqVal) * 100
        } else {
          deviationData[prop] = material[prop] - reqVal
        }
      })

      return {
        name: material.Material,
        deviations: deviationData,
      }
    })

    // Sort materials by overall deviation
    deviations.sort((a, b) => {
      const aSum = Object.values(a.deviations).reduce((sum, val) => sum + Math.abs(val), 0)
      const bSum = Object.values(b.deviations).reduce((sum, val) => sum + Math.abs(val), 0)
      return aSum - bSum
    })

    // Clear previous content
    containerRef.current.innerHTML = ""

    // Create heatmap table
    const table = document.createElement("table")
    table.className = "w-full border-collapse"

    // Create header row
    const thead = document.createElement("thead")
    const headerRow = document.createElement("tr")

    // Add empty cell for top-left corner
    const cornerCell = document.createElement("th")
    cornerCell.className = "p-2 border"
    headerRow.appendChild(cornerCell)

    // Add property headers
    properties.forEach((prop) => {
      const th = document.createElement("th")
      th.className = "p-2 border font-medium text-sm"
      th.textContent = propertyDisplayNames[prop]
      headerRow.appendChild(th)
    })

    thead.appendChild(headerRow)
    table.appendChild(thead)

    // Create table body
    const tbody = document.createElement("tbody")

    // Add rows for each material
    deviations.forEach((material) => {
      const row = document.createElement("tr")

      // Add material name cell
      const nameCell = document.createElement("td")
      nameCell.className = "p-2 border font-medium"
      nameCell.textContent = material.name
      row.appendChild(nameCell)

      // Add deviation cells
      properties.forEach((prop) => {
        const cell = document.createElement("td")
        const deviation = material.deviations[prop]

        // Format deviation value
        const formattedValue = deviation.toFixed(1) + "%"

        // Determine cell color based on deviation
        const absDeviation = Math.abs(deviation)
        let bgColor

        if (absDeviation < 5) {
          bgColor = "bg-green-100 dark:bg-green-900"
        } else if (absDeviation < 15) {
          bgColor = "bg-yellow-100 dark:bg-yellow-900"
        } else if (absDeviation < 30) {
          bgColor = "bg-orange-100 dark:bg-orange-900"
        } else {
          bgColor = "bg-red-100 dark:bg-red-900"
        }

        cell.className = `p-2 border text-center ${bgColor}`
        cell.textContent = formattedValue

        row.appendChild(cell)
      })

      tbody.appendChild(row)
    })

    table.appendChild(tbody)
    containerRef.current.appendChild(table)
  }, [materials, requirements, propertyDisplayNames])

  return (
    <div className="w-full overflow-x-auto" ref={containerRef}>
      {materials.length === 0 && <p>No data available</p>}
    </div>
  )
}

