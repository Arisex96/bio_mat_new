"use client"

import { useEffect, useRef } from "react"
import type { MaterialRequirements } from "@/components/material-selector"
import {
  Chart,
  type ChartConfiguration,
  BarController,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js"

// Register the required Chart.js components
Chart.register(BarController, CategoryScale, LinearScale, BarElement, Tooltip, Legend)

interface PropertyBarChartProps {
  materials: any[]
  property: keyof MaterialRequirements
  displayName: string
  targetValue: number
}

export const PropertyBarChart = ({ materials, property, displayName, targetValue }: PropertyBarChartProps) => {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (!chartRef.current || materials.length === 0) return

    // Clean up previous chart instance
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    // Sort materials by distance score
    const sortedMaterials = [...materials].sort((a, b) => a.Distance_Score - b.Distance_Score)

    // Create chart data
    const data = {
      labels: sortedMaterials.map((m) => m.Material),
      datasets: [
        {
          label: displayName,
          data: sortedMaterials.map((m) => m[property]),
          backgroundColor: sortedMaterials.map((m) => {
            // Color based on how close to target value
            const value = m[property]
            const percentDiff = Math.abs((value - targetValue) / targetValue)

            if (percentDiff <= 0.05) return "rgba(46, 204, 113, 0.7)" // Very close - green
            if (percentDiff <= 0.15) return "rgba(241, 196, 15, 0.7)" // Close - yellow
            if (percentDiff <= 0.3) return "rgba(230, 126, 34, 0.7)" // Somewhat close - orange
            return "rgba(231, 76, 60, 0.7)" // Far - red
          }),
          borderColor: "rgba(0, 0, 0, 0.1)",
          borderWidth: 1,
        },
      ],
    }

    // Create chart configuration
    const config: ChartConfiguration = {
      type: "bar",
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: displayName,
            },
          },
          x: {
            title: {
              display: true,
              text: "Material",
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              afterLabel: (context) => {
                const material = sortedMaterials[context.dataIndex]
                const value = material[property]
                const percentDiff = (((value - targetValue) / targetValue) * 100).toFixed(1)
                return `Difference from target: ${percentDiff}%`
              },
            },
          },
        },
      },
    }

    // Create new chart
    chartInstance.current = new Chart(chartRef.current, config)

    // Add target line annotation
    if (chartInstance.current) {
      const originalDraw = chartInstance.current.draw
      chartInstance.current.draw = function () {
        originalDraw.apply(this, arguments)
        
        const ctx = this.ctx
        const yAxis = this.scales.y
        const targetPixel = yAxis.getPixelForValue(targetValue)

        // Draw target line
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(this.chartArea.left, targetPixel)
        ctx.lineTo(this.chartArea.right, targetPixel)
        ctx.lineWidth = 2
        ctx.strokeStyle = "rgba(255, 0, 0, 0.7)"
        ctx.setLineDash([5, 5])
        ctx.stroke()

        // Draw target label
        ctx.fillStyle = "rgba(255, 0, 0, 0.9)"
        ctx.textAlign = "left"
        ctx.textBaseline = "bottom"
        ctx.font = "12px Arial"
        ctx.fillText("Target Value", this.chartArea.left + 5, targetPixel - 5)
        ctx.restore()
      }
    }

    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [materials, property, displayName, targetValue])

  return (
    <div className="w-full h-[500px]">
      <canvas ref={chartRef}></canvas>
    </div>
  )
}

