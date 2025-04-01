"use client"

import { useEffect, useRef } from "react"
import type { MaterialRequirements } from "@/components/material-selector"
import {
  Chart,
  type ChartConfiguration,
  RadarController,
  RadialLinearScale,
  LineElement,
  PointElement,
  Filler,
} from "chart.js"

// Register the required Chart.js components
Chart.register(RadarController, RadialLinearScale, LineElement, PointElement, Filler)

interface RadarChartProps {
  materials: any[]
  requirements: MaterialRequirements
  propertyDisplayNames: Record<string, string>
}

export const RadarChart = ({ materials, requirements, propertyDisplayNames }: RadarChartProps) => {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (!chartRef.current || materials.length === 0) return

    // Clean up previous chart instance
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const properties = Object.keys(requirements) as (keyof MaterialRequirements)[]

    // Find min and max for each property for normalization
    const mins: Record<string, number> = {}
    const maxs: Record<string, number> = {}

    properties.forEach((prop) => {
      mins[prop] = Math.min(...materials.map((m) => m[prop] || 0), requirements[prop].value)
      maxs[prop] = Math.max(...materials.map((m) => m[prop] || 0), requirements[prop].value)
    })

    // Normalize data for radar chart
    const normalizedMaterials = materials.map((material) => {
      const normalizedData: Record<string, number> = {}

      properties.forEach((prop) => {
        const min = mins[prop]
        const max = maxs[prop]
        const range = max - min

        normalizedData[prop] =
          range === 0
            ? 0.5 // Default to middle if range is 0
            : (material[prop] - min) / range
      })

      return {
        name: material.Material,
        data: normalizedData,
      }
    })

    // Normalize requirements
    const normalizedRequirements: Record<string, number> = {}
    properties.forEach((prop) => {
      const min = mins[prop]
      const max = maxs[prop]
      const range = max - min

      normalizedRequirements[prop] =
        range === 0
          ? 0.5 // Default to middle if range is 0
          : (requirements[prop].value - min) / range
    })

    // Create chart data
    const data = {
      labels: properties.map((prop) => propertyDisplayNames[prop]),
      datasets: [
        {
          label: "Your Requirements",
          data: properties.map((prop) => normalizedRequirements[prop]),
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          borderColor: "rgb(255, 99, 132)",
          pointBackgroundColor: "rgb(255, 99, 132)",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgb(255, 99, 132)",
          borderWidth: 2,
          fill: true,
        },
        ...normalizedMaterials.map((material, index) => {
          // Generate a color based on index
          const hue = (index * 137) % 360 // Golden angle approximation for good distribution
          return {
            label: material.name,
            data: properties.map((prop) => material.data[prop]),
            backgroundColor: `hsla(${hue}, 70%, 60%, 0.2)`,
            borderColor: `hsl(${hue}, 70%, 50%)`,
            pointBackgroundColor: `hsl(${hue}, 70%, 50%)`,
            pointBorderColor: "#fff",
            pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: `hsl(${hue}, 70%, 50%)`,
            borderWidth: 2,
            fill: true,
          }
        }),
      ],
    }

    // Create chart configuration
    const config: ChartConfiguration = {
      type: "radar",
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 0,
            max: 1,
            ticks: {
              display: false,
            },
          },
        },
        plugins: {
          legend: {
            position: "top",
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || ""
                const value = context.raw as number
                return `${label}: ${(value * 100).toFixed(1)}%`
              },
            },
          },
        },
      },
    }

    // Create new chart
    chartInstance.current = new Chart(chartRef.current, config)

    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [materials, requirements, propertyDisplayNames])

  return (
    <div className="w-full h-[500px]">
      <canvas ref={chartRef}></canvas>
    </div>
  )
}

